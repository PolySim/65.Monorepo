import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import { extname, isAbsolute, join, relative, resolve } from 'path';
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
import { Category } from '../entities/category.entity';
import { Image } from '../entities/image.entity';
import { State } from '../entities/state.entity';

interface ChunkUploadSession {
  fileHash: string;
  fileName: string;
  hikeId: string;
  totalChunks: number;
  fileSize: number;
  chunkSize: number;
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

  private resolveManagedImagePath(
    storedPath: string,
    requireFile = true,
  ): string {
    const imageRoot = resolve(config.image_path);
    const candidatePath = resolve(imageRoot, storedPath);
    const candidateFromRoot = relative(imageRoot, candidatePath);

    if (
      !candidateFromRoot ||
      candidateFromRoot.startsWith('..') ||
      isAbsolute(candidateFromRoot)
    ) {
      throw new NotFoundException('Image not found');
    }

    if (!fs.existsSync(candidatePath)) {
      if (requireFile) {
        throw new NotFoundException('Image not found');
      }
      return candidatePath;
    }

    const realImageRoot = fs.realpathSync(imageRoot);
    const realImagePath = fs.realpathSync(candidatePath);
    const realPathFromRoot = relative(realImageRoot, realImagePath);

    if (
      !realPathFromRoot ||
      realPathFromRoot.startsWith('..') ||
      isAbsolute(realPathFromRoot) ||
      !fs.statSync(realImagePath).isFile()
    ) {
      throw new NotFoundException('Image not found');
    }

    return realImagePath;
  }

  private resolveChunkTempDirectory(fileHash: string): string {
    if (!/^[a-f0-9]{1,64}$/i.test(fileHash)) {
      throw new BadRequestException("Identifiant de session d'upload invalide");
    }

    const tempRoot = resolve(config.image_path, 'temp');
    const tempDirectory = resolve(tempRoot, fileHash);
    const pathFromRoot = relative(tempRoot, tempDirectory);

    if (
      !pathFromRoot ||
      pathFromRoot.startsWith('..') ||
      isAbsolute(pathFromRoot)
    ) {
      throw new BadRequestException("Identifiant de session d'upload invalide");
    }

    return tempDirectory;
  }

  private getSafeImageExtension(fileName: string): string {
    const extension = extname(fileName).slice(1).toLowerCase();
    if (!['gif', 'jpeg', 'jpg', 'png', 'webp'].includes(extension)) {
      throw new BadRequestException("Format d'image non pris en charge");
    }
    return extension;
  }

  async sendImage(
    path: string,
    rotate: number,
    width?: number,
    quality?: number,
  ): Promise<StreamableFile> {
    if (!path || path === 'undefined') {
      throw new NotFoundException('Image not found');
    }

    const image = await this.findOne({
      where: { path },
    });

    const category = image
      ? null
      : await this.dataSource.getRepository(Category).findOne({
          where: { image_path: path },
          select: { id: true },
        });
    const state =
      image || category
        ? null
        : await this.dataSource.getRepository(State).findOne({
            where: { image_path: path },
            select: { id: true },
          });

    if (!image && !category && !state) {
      throw new NotFoundException('Image not found');
    }

    const requestedRotation = rotate as unknown;
    const rotationValue =
      requestedRotation === undefined ||
      requestedRotation === null ||
      String(requestedRotation).trim() === ''
        ? Number(image?.rotate ?? 0)
        : Number(requestedRotation);

    if (!Number.isFinite(rotationValue) || rotationValue % 90 !== 0) {
      throw new BadRequestException('Image rotation is invalid');
    }

    const normalizedRotation = ((rotationValue % 360) + 360) % 360;
    const requestedWidth = width as unknown;
    const widthValue =
      requestedWidth === undefined ||
      requestedWidth === null ||
      String(requestedWidth).trim() === ''
        ? null
        : Number(requestedWidth);
    const requestedQuality = quality as unknown;
    const qualityValue =
      requestedQuality === undefined ||
      requestedQuality === null ||
      String(requestedQuality).trim() === ''
        ? 82
        : Number(requestedQuality);

    if (
      (widthValue !== null &&
        (!Number.isInteger(widthValue) ||
          widthValue < 1 ||
          widthValue > 3840)) ||
      !Number.isInteger(qualityValue) ||
      qualityValue < 40 ||
      qualityValue > 95
    ) {
      throw new BadRequestException("Paramètres d'image invalides");
    }

    const globalPath = this.resolveManagedImagePath(path);

    const ext = extname(globalPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const streamOptions = {
      type: mimeTypes[ext] || 'application/octet-stream',
      disposition: 'inline',
    };

    if (normalizedRotation === 0 && widthValue === null) {
      return new StreamableFile(fs.createReadStream(globalPath), streamOptions);
    }

    try {
      let imagePipeline = sharp(globalPath).rotate(normalizedRotation);
      if (widthValue !== null) {
        imagePipeline = imagePipeline.resize({
          width: widthValue,
          withoutEnlargement: true,
        });
      }

      if (ext === '.jpg' || ext === '.jpeg') {
        imagePipeline = imagePipeline.jpeg({
          mozjpeg: true,
          quality: qualityValue,
        });
      } else if (ext === '.webp') {
        imagePipeline = imagePipeline.webp({ quality: qualityValue });
      }

      const rotatedFile = await imagePipeline.toBuffer();

      return new StreamableFile(rotatedFile, streamOptions);
    } catch {
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
        const extension = this.getSafeImageExtension(file.originalname ?? '');
        const path = `${newId}.${extension}`;
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
    await this.delete(image);
    try {
      const directoryPath = this.resolveManagedImagePath(image.path, false);
      if (fs.existsSync(directoryPath)) {
        fs.unlinkSync(directoryPath);
      }
    } catch {
      // La ligne en base est déjà supprimée : conserver un éventuel fichier
      // legacy plutôt que de risquer une suppression hors du volume d'images.
    }
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
      chunkSize = 512 * 1024,
    } = initiateUploadDto; // 512KB en prod, 1MB en dev

    const normalizedFileSize = Number(fileSize);
    const normalizedChunkSize = Number(chunkSize);
    if (
      !Number.isSafeInteger(normalizedFileSize) ||
      normalizedFileSize <= 0 ||
      normalizedFileSize > 100 * 1024 * 1024 ||
      !Number.isSafeInteger(normalizedChunkSize) ||
      normalizedChunkSize <= 0 ||
      normalizedChunkSize > 1024 * 1024
    ) {
      throw new BadRequestException("Paramètres d'upload invalides");
    }

    this.getSafeImageExtension(fileName);
    const totalChunks = Math.ceil(normalizedFileSize / normalizedChunkSize);

    // Créer le répertoire temporaire pour les chunks
    const tempDir = this.resolveChunkTempDirectory(fileHash);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const session: ChunkUploadSession = {
      fileHash,
      fileName,
      hikeId,
      totalChunks,
      fileSize: normalizedFileSize,
      chunkSize: normalizedChunkSize,
      uploadedChunks: new Set(),
      chunkPaths: new Map(),
      createdAt: new Date(),
    };

    this.uploadSessions.set(fileHash, session);

    return {
      fileHash,
      totalChunks,
      chunkSize: normalizedChunkSize,
      uploadId: fileHash,
    };
  }

  async uploadChunk(chunk: File, chunkUploadDto: ChunkUploadDto) {
    const { fileHash } = chunkUploadDto;
    const tempDir = this.resolveChunkTempDirectory(fileHash);

    // Convertir les chaînes en nombres
    const chunkIndex = Number(chunkUploadDto.chunkIndex);
    const totalChunks = Number(chunkUploadDto.totalChunks);

    const session = this.uploadSessions.get(fileHash);
    if (!session) {
      throw new BadRequestException("Session d'upload non trouvée");
    }

    if (!Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks)) {
      throw new BadRequestException('Index de chunk ou nombre total invalide');
    }

    if (totalChunks !== session.totalChunks) {
      throw new BadRequestException('Nombre total de chunks incohérent');
    }

    if (chunkIndex >= totalChunks || chunkIndex < 0) {
      throw new BadRequestException('Index de chunk invalide');
    }

    if (session.uploadedChunks.has(chunkIndex)) {
      return { success: true, message: 'Chunk déjà uploadé' };
    }

    if (!chunk?.buffer?.length || chunk.buffer.length > session.chunkSize) {
      throw new BadRequestException('Taille de chunk invalide');
    }

    const chunkPath = join(tempDir, `chunk_${chunkIndex}`);

    // Sauvegarder le chunk
    fs.writeFileSync(chunkPath, chunk.buffer);

    session.uploadedChunks.add(chunkIndex);
    session.chunkPaths.set(chunkIndex, chunkPath); // Utiliser l'index numérique comme clé

    return {
      success: true,
      uploadedChunks: session.uploadedChunks.size,
      totalChunks: session.totalChunks,
      isComplete: session.uploadedChunks.size === session.totalChunks,
    };
  }

  async getChunkStatus(fileHash: string): Promise<ChunkStatusDto> {
    this.resolveChunkTempDirectory(fileHash);
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
    this.resolveChunkTempDirectory(fileHash);

    const session = this.uploadSessions.get(fileHash);
    if (!session) {
      throw new BadRequestException("Session d'upload non trouvée");
    }

    if (session.hikeId !== hikeId) {
      throw new BadRequestException("Session d'upload incohérente");
    }

    if (session.uploadedChunks.size !== session.totalChunks) {
      throw new BadRequestException(
        `Tous les chunks ne sont pas uploadés: ${session.uploadedChunks.size}/${session.totalChunks}`,
      );
    }

    let finalStoredPath: string | null = null;
    let savedImage: Image | null = null;

    try {
      // Assembler les chunks
      const finalFileName = `${uuidv4()}.${this.getSafeImageExtension(session.fileName)}`;
      finalStoredPath = `Hike/${finalFileName}`;

      // Créer le répertoire de destination si nécessaire
      const hikeDir = join(config.image_path, 'Hike');
      if (!fs.existsSync(hikeDir)) {
        fs.mkdirSync(hikeDir, { recursive: true });
      }
      const finalPath = this.resolveManagedImagePath(finalStoredPath, false);

      // Assembler les chunks dans l'ordre
      const writeStream = fs.createWriteStream(finalPath);
      for (let i = 0; i < session.totalChunks; i++) {
        // Les clés peuvent être des chaînes, essayer les deux
        const chunkPath =
          session.chunkPaths.get(i) || session.chunkPaths.get(i.toString());

        if (!chunkPath || !fs.existsSync(chunkPath)) {
          throw new BadRequestException(`Chunk ${i} manquant`);
        }
        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData);
      }
      writeStream.end();

      // Attendre que l'écriture soit terminée
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve as () => void);
        writeStream.on('error', reject);
      });

      // Vérifier que le fichier final existe et sa taille
      if (!fs.existsSync(finalPath)) {
        throw new BadRequestException('Fichier final non créé');
      }

      if (fs.statSync(finalPath).size !== session.fileSize) {
        throw new BadRequestException('Taille du fichier final incohérente');
      }

      try {
        const processedBuffer = await sharp(finalPath).toBuffer();
        await sharp(processedBuffer).toFile(finalPath);
      } catch (sharpError) {
        console.error('Erreur Sharp:', sharpError);
        throw new BadRequestException("Erreur lors du traitement de l'image");
      }

      // Obtenir le nombre d'images existantes pour l'ordre
      const numberMax = (await this.count({ where: { hikeId } })) + 1;

      // Créer l'entrée en base de données
      const newImage = new Image();
      newImage.id = uuidv4();
      newImage.hikeId = hikeId;
      newImage.path = finalStoredPath;
      newImage.ordered = numberMax;

      savedImage = await this.save(newImage);

      // Nettoyer les fichiers temporaires
      try {
        this.cleanupTempFiles(fileHash);
      } catch (cleanupError) {
        console.error(
          'Impossible de nettoyer les chunks finalisés:',
          cleanupError,
        );
      }
      this.uploadSessions.delete(fileHash);

      return savedImage;
    } catch (error) {
      if (!savedImage && finalStoredPath) {
        try {
          const finalPath = this.resolveManagedImagePath(
            finalStoredPath,
            false,
          );
          if (fs.existsSync(finalPath)) {
            fs.unlinkSync(finalPath);
          }
        } catch {
          // Le chemin est invalide ou le fichier a déjà disparu.
        }
      }

      console.error('ERREUR lors de la finalisation:', error);
      console.error(
        'Stack trace:',
        error instanceof Error ? error.stack : 'N/A',
      );
      try {
        this.cleanupTempFiles(fileHash);
      } catch (cleanupError) {
        console.error(
          'Impossible de nettoyer les chunks en erreur:',
          cleanupError,
        );
      }
      this.uploadSessions.delete(fileHash);
      throw error;
    }
  }

  async cancelChunkUpload(fileHash: string) {
    this.resolveChunkTempDirectory(fileHash);
    const session = this.uploadSessions.get(fileHash);
    if (!session) {
      // Session déjà supprimée, pas d'erreur
      return { success: true, message: 'Upload déjà annulé' };
    }

    this.cleanupTempFiles(fileHash);
    this.uploadSessions.delete(fileHash);

    return { success: true, message: 'Upload annulé' };
  }

  private cleanupTempFiles(fileHash: string) {
    const tempDir = this.resolveChunkTempDirectory(fileHash);
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
    try {
      // 1. Nettoyer les images en base qui n'existent plus sur le disque
      const allImages = await this.find();
      let deletedFromDb = 0;

      for (const image of allImages) {
        const filePath = join(config.image_path, image.path);
        if (!fs.existsSync(filePath)) {
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
            deletedFromDisk++;
          }
        }

        return { deletedFromDb, deletedFromDisk };
      }

      return { deletedFromDb, deletedFromDisk: 0 };
    } catch (error) {
      console.error('Erreur lors du nettoyage des images orphelines:', error);
      throw error;
    }
  }
}
