import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import { extname, join } from 'path';
import * as sharp from 'sharp';
import { config } from 'src/config/config';
import {
  ChunkStatusDto,
  ChunkUploadDto,
  CompleteUploadDto,
  InitiateUploadDto,
} from 'src/DTO/chunk.dto';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Image } from '../entities/image.entity';

interface ChunkUploadSession {
  fileHash: string;
  fileName: string;
  hikeId: string;
  totalChunks: number;
  fileSize: number;
  uploadedChunks: Set<number>;
  chunkPaths: Map<number | string, string>;
  createdAt: Date;
}

@Injectable()
export class ImageRepository extends Repository<Image> {
  private uploadSessions: Map<string, ChunkUploadSession> = new Map();

  constructor(private dataSource: DataSource) {
    super(Image, dataSource.createEntityManager());
    // Nettoyer les sessions expirées toutes les heures
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  async sendImage(path: string, rotate: number) {
    const image = await this.findOne({
      where: { path },
    });
    if (path === 'undefined') throw new NotFoundException('Image not found');

    const globalPath = `${config.image_path}/${path}`;

    // Vérifier si le fichier existe physiquement
    if (!fs.existsSync(globalPath)) {
      console.error(`Fichier image manquant: ${globalPath}`);

      // Si l'image existe en base mais pas sur le disque, la supprimer de la base
      if (image) {
        console.log(`Suppression de l'image orpheline de la base: ${image.id}`);
        await this.delete(image);
      }

      throw new NotFoundException(`Image physique non trouvée: ${path}`);
    }

    const globalRotate = Number(rotate) ?? image?.rotate ?? 0;

    try {
      const rotatedFile = await sharp(globalPath)
        .rotate(globalRotate)
        .toBuffer();

      const ext = extname(globalPath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };

      return new StreamableFile(rotatedFile, {
        type: mimeTypes[ext] || 'application/octet-stream',
        disposition: 'inline',
      });
    } catch (error) {
      console.error(
        `Erreur lors du traitement de l'image ${globalPath}:`,
        error,
      );

      // Si l'image est corrompue et existe en base, la supprimer
      if (image) {
        console.log(`Suppression de l'image corrompue de la base: ${image.id}`);
        await this.delete(image);
      }

      throw new NotFoundException(`Impossible de traiter l'image: ${path}`);
    }
  }

  async createImage(hikeId: string, files: File[]): Promise<Image[]> {
    const numberMax =
      (await this.count({
        where: {
          hikeId,
        },
      })) + 1;
    return await Promise.all(
      files.map(async (file, i) => {
        const newId = uuidv4();
        const path = `${newId}.${(file.originalname ?? '').split('.').slice(-1)[0]}`;
        const newImage = new Image();
        newImage.id = newId;
        newImage.hikeId = hikeId;
        newImage.path = `Hike/${path}`;
        newImage.ordered = numberMax + i;
        await this.uploadImage({ name: path, file });
        const saved = await this.save(newImage);
        return saved;
      }),
    );
  }

  async deleteImage(imageId: string) {
    const image = await this.findOne({
      where: {
        id: imageId,
      },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    const directoryPath = `${config.image_path}/${image.path}`;
    if (fs.existsSync(directoryPath)) {
      fs.unlinkSync(directoryPath);
    }
    await this.delete(image);
  }

  async rotateImage(imageId: string) {
    const image = await this.findOne({
      where: {
        id: imageId,
      },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    const rotate = (image.rotate ?? 0) + 90;
    return await this.update(image.id, {
      rotate: rotate >= 360 ? 0 : rotate,
    });
  }

  async reorderImage(hikeId: string, imageIds: string[]) {
    const images = await this.find({
      where: {
        hikeId,
        id: In(imageIds),
      },
    });
    await Promise.all(
      images.map(async (image) =>
        this.update(image.id, {
          ordered: imageIds.indexOf(image.id),
        }),
      ),
    );
  }

  private async uploadImage({ name, file }: { name: string; file: File }) {
    const directoryPath = `${config.image_path}/Hike`;
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await sharp(file.buffer).toFile(`${directoryPath}/${name}`);
  }

  async initiateChunkUpload(initiateUploadDto: InitiateUploadDto) {
    const {
      fileHash,
      fileName,
      hikeId,
      fileSize,
      chunkSize = 1024 * 1024,
    } = initiateUploadDto; // 1MB par défaut

    console.log('Initiation upload:', { fileHash, fileName, fileSize, hikeId });

    const totalChunks = Math.ceil(fileSize / chunkSize);

    // Créer le répertoire temporaire pour les chunks
    const tempDir = join(config.image_path, 'temp', fileHash);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('Répertoire temporaire créé:', tempDir);
    }

    const session: ChunkUploadSession = {
      fileHash,
      fileName,
      hikeId,
      totalChunks,
      fileSize,
      uploadedChunks: new Set(),
      chunkPaths: new Map(),
      createdAt: new Date(),
    };

    this.uploadSessions.set(fileHash, session);
    console.log('Session créée:', {
      fileHash,
      totalChunks,
      sessionsCount: this.uploadSessions.size,
    });

    return {
      fileHash,
      totalChunks,
      chunkSize,
      uploadId: fileHash,
    };
  }

  async uploadChunk(chunk: File, chunkUploadDto: ChunkUploadDto) {
    const { fileHash } = chunkUploadDto;

    // Convertir les chaînes en nombres
    const chunkIndex = parseInt(chunkUploadDto.chunkIndex.toString(), 10);
    const totalChunks = parseInt(chunkUploadDto.totalChunks.toString(), 10);

    console.log('Upload chunk:', {
      fileHash,
      chunkIndex,
      totalChunks,
      chunkSize: chunk.size,
      originalTypes: {
        chunkIndexType: typeof chunkUploadDto.chunkIndex,
        totalChunksType: typeof chunkUploadDto.totalChunks,
      },
    });

    const session = this.uploadSessions.get(fileHash);
    if (!session) {
      throw new BadRequestException("Session d'upload non trouvée");
    }

    if (isNaN(chunkIndex) || isNaN(totalChunks)) {
      throw new BadRequestException('Index de chunk ou nombre total invalide');
    }

    if (chunkIndex >= totalChunks || chunkIndex < 0) {
      throw new BadRequestException('Index de chunk invalide');
    }

    if (session.uploadedChunks.has(chunkIndex)) {
      return { success: true, message: 'Chunk déjà uploadé' };
    }

    const tempDir = join(config.image_path, 'temp', fileHash);
    const chunkPath = join(tempDir, `chunk_${chunkIndex}`);

    // Sauvegarder le chunk
    fs.writeFileSync(chunkPath, chunk.buffer);

    session.uploadedChunks.add(chunkIndex);
    session.chunkPaths.set(chunkIndex, chunkPath); // Utiliser l'index numérique comme clé

    console.log('Chunk sauvegardé:', {
      chunkIndex,
      chunkPath,
      uploadedCount: session.uploadedChunks.size,
      totalChunks: session.totalChunks,
    });

    return {
      success: true,
      uploadedChunks: session.uploadedChunks.size,
      totalChunks: session.totalChunks,
      isComplete: session.uploadedChunks.size === session.totalChunks,
    };
  }

  async getChunkStatus(fileHash: string): Promise<ChunkStatusDto> {
    const session = this.uploadSessions.get(fileHash);
    if (!session) {
      throw new NotFoundException("Session d'upload non trouvée");
    }

    return {
      fileHash,
      uploadedChunks: Array.from(session.uploadedChunks),
      totalChunks: session.totalChunks,
      isComplete: session.uploadedChunks.size === session.totalChunks,
    };
  }

  async completeChunkUpload(
    completeUploadDto: CompleteUploadDto,
  ): Promise<Image> {
    const { fileHash, hikeId } = completeUploadDto;

    console.log('Tentative de finalisation pour fileHash:', fileHash);
    console.log('Sessions actives:', Array.from(this.uploadSessions.keys()));

    const session = this.uploadSessions.get(fileHash);
    if (!session) {
      throw new BadRequestException("Session d'upload non trouvée");
    }

    console.log('Session trouvée:', {
      uploadedChunks: session.uploadedChunks.size,
      totalChunks: session.totalChunks,
      chunkPaths: Array.from(session.chunkPaths.keys()),
    });

    if (session.uploadedChunks.size !== session.totalChunks) {
      throw new BadRequestException(
        `Tous les chunks ne sont pas uploadés: ${session.uploadedChunks.size}/${session.totalChunks}`,
      );
    }

    try {
      console.log('Début assemblage des chunks...');

      // Assembler les chunks
      const finalFileName = `${uuidv4()}.${session.fileName.split('.').pop()}`;
      const finalPath = join(config.image_path, 'Hike', finalFileName);

      console.log('Fichier final:', { finalFileName, finalPath });

      // Créer le répertoire de destination si nécessaire
      const hikeDir = join(config.image_path, 'Hike');
      if (!fs.existsSync(hikeDir)) {
        fs.mkdirSync(hikeDir, { recursive: true });
        console.log('Répertoire créé:', hikeDir);
      }

      console.log('Assemblage des chunks...');
      // Assembler les chunks dans l'ordre
      const writeStream = fs.createWriteStream(finalPath);
      for (let i = 0; i < session.totalChunks; i++) {
        // Les clés peuvent être des chaînes, essayer les deux
        const chunkPath =
          session.chunkPaths.get(i) || session.chunkPaths.get(i.toString());
        console.log(`Vérification chunk ${i}:`, {
          chunkPath,
          exists: chunkPath ? fs.existsSync(chunkPath) : false,
          lookupNumber: session.chunkPaths.get(i),
          lookupString: session.chunkPaths.get(i.toString()),
        });

        if (!chunkPath || !fs.existsSync(chunkPath)) {
          console.error(`ERREUR: Chunk ${i} manquant`, {
            chunkPath,
            chunkPathsKeys: Array.from(session.chunkPaths.keys()),
            chunkPathsEntries: Array.from(session.chunkPaths.entries()),
          });
          throw new BadRequestException(`Chunk ${i} manquant`);
        }
        const chunkData = fs.readFileSync(chunkPath);
        console.log(`Chunk ${i} lu:`, { size: chunkData.length });
        writeStream.write(chunkData);
      }
      writeStream.end();
      console.log('Écriture terminée, attente de la finalisation...');

      // Attendre que l'écriture soit terminée
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve as () => void);
        writeStream.on('error', reject);
      });
      console.log('Fichier assemblé avec succès');

      // Vérifier que le fichier final existe et sa taille
      if (!fs.existsSync(finalPath)) {
        throw new BadRequestException('Fichier final non créé');
      }
      const finalStats = fs.statSync(finalPath);
      console.log('Fichier final:', { path: finalPath, size: finalStats.size });

      // Traiter l'image avec Sharp pour validation et optimisation
      console.log('Traitement Sharp...');
      try {
        const processedBuffer = await sharp(finalPath).toBuffer();
        await sharp(processedBuffer).toFile(finalPath);
        console.log('Traitement Sharp terminé');
      } catch (sharpError) {
        console.error('Erreur Sharp:', sharpError);
        throw new BadRequestException("Erreur lors du traitement de l'image");
      }

      // Obtenir le nombre d'images existantes pour l'ordre
      console.log('Comptage des images existantes...');
      const numberMax = (await this.count({ where: { hikeId } })) + 1;
      console.log('Ordre calculé:', numberMax);

      // Créer l'entrée en base de données
      console.log('Création en base de données...');
      const newImage = new Image();
      newImage.id = uuidv4();
      newImage.hikeId = hikeId;
      newImage.path = `Hike/${finalFileName}`;
      newImage.ordered = numberMax;

      const savedImage = await this.save(newImage);
      console.log('Image sauvegardée:', savedImage.id);

      // Nettoyer les fichiers temporaires
      console.log('Nettoyage des fichiers temporaires...');
      this.cleanupTempFiles(fileHash);
      this.uploadSessions.delete(fileHash);
      console.log('Upload finalisé avec succès');

      return savedImage;
    } catch (error) {
      // Nettoyer en cas d'erreur
      console.error('ERREUR lors de la finalisation:', error);
      console.error(
        'Stack trace:',
        error instanceof Error ? error.stack : 'N/A',
      );
      this.cleanupTempFiles(fileHash);
      this.uploadSessions.delete(fileHash);
      throw error;
    }
  }

  async cancelChunkUpload(fileHash: string) {
    const session = this.uploadSessions.get(fileHash);
    if (!session) {
      // Session déjà supprimée, pas d'erreur
      console.log('Session déjà supprimée pour:', fileHash);
      return { success: true, message: 'Upload déjà annulé' };
    }

    console.log('Annulation upload pour:', fileHash);
    this.cleanupTempFiles(fileHash);
    this.uploadSessions.delete(fileHash);

    return { success: true, message: 'Upload annulé' };
  }

  private cleanupTempFiles(fileHash: string) {
    const tempDir = join(config.image_path, 'temp', fileHash);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  private cleanupExpiredSessions() {
    const now = new Date();
    const expireTime = 24 * 60 * 60 * 1000; // 24 heures

    for (const [fileHash, session] of this.uploadSessions.entries()) {
      if (now.getTime() - session.createdAt.getTime() > expireTime) {
        this.cleanupTempFiles(fileHash);
        this.uploadSessions.delete(fileHash);
      }
    }
  }

  // Méthode utilitaire pour nettoyer les images orphelines
  async cleanupOrphanImages() {
    console.log('Début du nettoyage des images orphelines...');

    try {
      // 1. Nettoyer les images en base qui n'existent plus sur le disque
      const allImages = await this.find();
      let deletedFromDb = 0;

      for (const image of allImages) {
        const filePath = join(config.image_path, image.path);
        if (!fs.existsSync(filePath)) {
          console.log(
            `Image orpheline supprimée de la base: ${image.id} - ${image.path}`,
          );
          await this.delete(image);
          deletedFromDb++;
        }
      }

      // 2. Optionnel: Supprimer les fichiers sur le disque qui ne sont plus en base
      const hikeDir = join(config.image_path, 'Hike');
      if (fs.existsSync(hikeDir)) {
        const filesOnDisk = fs.readdirSync(hikeDir);
        const pathsInDb = allImages.map((img) => img.path);
        let deletedFromDisk = 0;

        for (const file of filesOnDisk) {
          const filePath = `Hike/${file}`;
          if (!pathsInDb.includes(filePath)) {
            const fullPath = join(hikeDir, file);
            fs.unlinkSync(fullPath);
            console.log(`Fichier orphelin supprimé du disque: ${filePath}`);
            deletedFromDisk++;
          }
        }

        console.log(
          `Nettoyage terminé: ${deletedFromDb} images supprimées de la base, ${deletedFromDisk} fichiers supprimés du disque`,
        );
        return { deletedFromDb, deletedFromDisk };
      }

      return { deletedFromDb, deletedFromDisk: 0 };
    } catch (error) {
      console.error('Erreur lors du nettoyage des images orphelines:', error);
      throw error;
    }
  }
}
