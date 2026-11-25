import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'path';
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

const DEFAULT_IMAGE_WIDTH = 1920;
const MAX_IMAGE_DIMENSION = 3840;
const DEFAULT_IMAGE_QUALITY = 82;
const MAX_ORIGINAL_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 64 * 1024 * 1024; // Includes all frames.
const MAX_QUEUED_VARIANTS = 16; // One active render per repository, including its read.
const MAX_CACHE_BYTES = 64 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 256;
const DEFAULT_CHUNK_BYTES = 512 * 1024; // Also used by the frontend splitter.
const MAX_CHUNK_BYTES = 1024 * 1024;
const MAX_UPLOAD_CHUNKS = Math.ceil(MAX_ORIGINAL_BYTES / DEFAULT_CHUNK_BYTES);
const MAX_UPLOAD_SESSIONS = 8;

interface ImageProfile {
  width: number;
  quality: number;
  rotation: number;
}

interface ChunkUploadSession {
  fileHash: string;
  fileName: string;
  hikeId: string;
  totalChunks: number;
  fileSize: number;
  chunkSize: number;
  uploadedChunks: Set<number>;
  chunkPaths: Map<number, string>;
  createdAt: Date;
  finalizing?: boolean;
}

@Injectable()
export class ImageRepository extends Repository<Image> {
  private uploadSessions: Map<string, ChunkUploadSession> = new Map();
  private readonly variants = new Map<string, Buffer>();
  private readonly pendingVariants = new Map<string, Promise<Buffer>>();
  private readonly variantQueue: Array<() => void> = [];
  private renderingVariant = false;
  private variantBytes = 0;

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

    try {
      const realImageRoot = fs.realpathSync(imageRoot);
      const exists = fs.existsSync(candidatePath);
      const realImagePath = exists
        ? fs.realpathSync(candidatePath)
        : join(
            fs.realpathSync(dirname(candidatePath)),
            basename(candidatePath),
          );
      const realPathFromRoot = relative(realImageRoot, realImagePath);

      if (
        !realPathFromRoot ||
        realPathFromRoot.startsWith('..') ||
        isAbsolute(realPathFromRoot) ||
        (exists ? !fs.statSync(realImagePath).isFile() : requireFile)
      ) {
        throw new NotFoundException('Image not found');
      }
      return realImagePath;
    } catch {
      throw new NotFoundException('Image not found');
    }
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
    rotate?: number | string,
    width?: number | string,
    quality?: number | string,
  ): Promise<StreamableFile> {
    if (typeof path !== 'string' || !path || path === 'undefined') {
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

    const numericQuery = (value: unknown, fallback: number): number => {
      if (value == null || (typeof value === 'string' && value.trim() === '')) {
        return fallback;
      }
      return typeof value === 'number' || typeof value === 'string'
        ? Number(value)
        : NaN;
    };
    const rotation = numericQuery(rotate, Number(image?.rotate ?? 0));
    const profile: ImageProfile = {
      rotation: ((rotation % 360) + 360) % 360,
      width: numericQuery(width, DEFAULT_IMAGE_WIDTH),
      quality: numericQuery(quality, DEFAULT_IMAGE_QUALITY),
    };
    if (!Number.isSafeInteger(rotation) || rotation % 90 !== 0) {
      throw new BadRequestException('Image rotation is invalid');
    }
    if (
      !Number.isInteger(profile.width) ||
      profile.width < 1 ||
      profile.width > MAX_IMAGE_DIMENSION ||
      !Number.isInteger(profile.quality) ||
      profile.quality < 40 ||
      profile.quality > 95
    ) {
      throw new BadRequestException("Paramètres d'image invalides");
    }

    try {
      // Resolve and check the source on every request, including cache hits.
      const source = this.resolveManagedImagePath(path);
      const stat = fs.statSync(source, { bigint: true });
      if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_ORIGINAL_BYTES) {
        throw new Error('Invalid image file');
      }
      const version = this.fileVersion(stat);
      const key = JSON.stringify([source, version, profile]);
      let variant = this.variants.get(key);
      if (variant) {
        this.variants.delete(key);
        this.variants.set(key, variant);
      } else {
        let pending = this.pendingVariants.get(key);
        if (!pending) {
          pending = this.scheduleVariant(async () => {
            const original = await this.readOriginal(source, stat);
            const result = await this.renderVariant(original, profile);
            if (
              fs.realpathSync(source) !== source ||
              this.fileVersion(fs.statSync(source, { bigint: true })) !==
                version
            ) {
              throw new Error('Image changed during rendering');
            }
            this.cacheVariant(key, result);
            return result;
          }).finally(() => this.pendingVariants.delete(key));
          this.pendingVariants.set(key, pending);
        }
        variant = await pending;
        if (this.resolveManagedImagePath(path) !== source) {
          throw new Error('Image path changed during rendering');
        }
      }

      return new StreamableFile(variant, {
        type: 'image/webp',
        disposition: 'inline',
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new NotFoundException("Impossible de traiter l'image");
    }
  }

  private scheduleVariant(job: () => Promise<Buffer>): Promise<Buffer> {
    let ready: Promise<void>;
    if (this.renderingVariant) {
      if (this.variantQueue.length >= MAX_QUEUED_VARIANTS) {
        throw new ServiceUnavailableException("File de rendu d'images pleine");
      }
      ready = new Promise<void>((resolve) => this.variantQueue.push(resolve));
    } else {
      this.renderingVariant = true;
      ready = Promise.resolve();
    }
    return ready.then(job).finally(() => {
      const next = this.variantQueue.shift();
      // Transfer the slot without allowing new jobs to jump the queue.
      if (next) next();
      else this.renderingVariant = false;
    });
  }

  private fileVersion(stat: fs.BigIntStats): string {
    return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
  }

  private async readOriginal(
    source: string,
    expected: fs.BigIntStats,
  ): Promise<Buffer> {
    const file = await fs.promises.open(
      source,
      fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK,
    );
    try {
      const version = this.fileVersion(expected);
      if (this.fileVersion(await file.stat({ bigint: true })) !== version) {
        throw new Error('Image changed before reading');
      }
      // Read only the checked file size, even if a concurrent writer extends it.
      const original = Buffer.allocUnsafe(Number(expected.size));
      let offset = 0;
      while (offset < original.length) {
        const { bytesRead } = await file.read(
          original,
          offset,
          original.length - offset,
        );
        if (!bytesRead) throw new Error('Image truncated during reading');
        offset += bytesRead;
      }
      if (this.fileVersion(await file.stat({ bigint: true })) !== version) {
        throw new Error('Image changed during reading');
      }
      return original;
    } finally {
      await file.close();
    }
  }

  private cacheVariant(key: string, variant: Buffer): void {
    if (variant.length > MAX_CACHE_BYTES) return;
    while (
      this.variants.size >= MAX_CACHE_ENTRIES ||
      this.variantBytes + variant.length > MAX_CACHE_BYTES
    ) {
      const oldest = this.variants.entries().next().value;
      if (!oldest) break;
      this.variants.delete(oldest[0]);
      this.variantBytes -= oldest[1].length;
    }
    this.variants.set(key, variant);
    this.variantBytes += variant.length;
  }

  private async renderVariant(
    original: Buffer,
    profile: ImageProfile,
  ): Promise<Buffer> {
    // With animated input, Sharp checks width × stacked height before decoding.
    const input = this.imageDecoder(original);
    const metadata = await input.metadata();
    const resize: sharp.ResizeOptions = {
      width: profile.width,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    };
    const webp = { quality: profile.quality };
    const orientation = metadata.orientation ?? 1;
    const pages = metadata.pages ?? 1;
    if (pages === 1) {
      return input
        .autoOrient()
        .rotate(profile.rotation)
        .resize(resize)
        .webp(webp)
        .toBuffer();
    }

    if (profile.rotation === 0 && orientation === 1) {
      return input.resize(resize).webp(webp).toBuffer();
    }

    // Sharp stacks animation frames vertically. Rotating that strip either
    // fails (90/270) or reverses frame order (180). Transform each frame instead.
    const { data, info } = await input
      .toColourspace('srgb')
      .ensureAlpha()
      .raw({ depth: 'uchar' })
      .toBuffer({ resolveWithObject: true });
    const pageHeight = info.pageHeight;
    const frameSize = info.width * pageHeight * 4;
    if (
      !pageHeight ||
      info.height !== pageHeight * pages ||
      info.channels !== 4 ||
      data.length !== frameSize * pages ||
      data.length > MAX_IMAGE_PIXELS * 4
    ) {
      throw new Error('Invalid decoded animation size');
    }
    // EXIF's eight transforms expressed as a horizontal mirror, then a rotation.
    const exifAngle = [0, 0, 0, 180, 180, 270, 90, 90, 270][orientation] ?? 0;
    const mirror = [2, 4, 5, 7].includes(orientation);
    let frames: Buffer;
    let frameWidth: number;
    let frameHeight: number;
    for (let i = 0; i < pages; i++) {
      const frame = await sharp(
        data.subarray(i * frameSize, (i + 1) * frameSize),
        {
          raw: { width: info.width, height: pageHeight, channels: 4 },
        },
      )
        .flop(mirror)
        .rotate((exifAngle + profile.rotation) % 360)
        .resize(resize)
        .raw()
        .toBuffer({ resolveWithObject: true });
      if (!frames) {
        const outputBytes = frame.data.length * pages;
        if (outputBytes > MAX_IMAGE_PIXELS * 4) {
          throw new Error('Animation output exceeds pixel budget');
        }
        frames = Buffer.allocUnsafe(outputBytes);
        frameWidth = frame.info.width;
        frameHeight = frame.info.height;
      }
      frame.data.copy(frames, i * frame.data.length);
    }
    return sharp(frames, {
      raw: {
        width: frameWidth,
        height: frameHeight * pages,
        channels: 4,
        pageHeight: frameHeight,
      },
    })
      .webp({ ...webp, delay: metadata.delay, loop: metadata.loop })
      .toBuffer();
  }

  private imageDecoder(input: Buffer | string): sharp.Sharp {
    return sharp(input, { animated: true, limitInputPixels: MAX_IMAGE_PIXELS });
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
        const destination = await this.uploadImage({ name: path, file });
        try {
          return await this.save(newImage);
        } catch (error) {
          await this.discardOriginal(destination);
          throw error;
        }
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

  private originalDestination(name: string): string {
    fs.mkdirSync(join(config.image_path, 'Hike'), { recursive: true });
    return this.resolveManagedImagePath(`Hike/${name}`, false);
  }

  private async discardOriginal(destination: string): Promise<void> {
    try {
      await fs.promises.unlink(destination);
    } catch {
      // Preserve the original error if the file cannot be removed.
    }
  }

  private async validateOriginal(
    input: Buffer | string,
    fileName: string,
  ): Promise<void> {
    const extension = this.getSafeImageExtension(fileName);
    const expectedFormat = extension === 'jpg' ? 'jpeg' : extension;
    try {
      const original = this.imageDecoder(input);
      const metadata = await original.metadata();
      if (metadata.format !== expectedFormat) {
        throw new Error('Image format does not match its extension');
      }
      // metadata() reads headers only. Force a full decode (including all frames)
      // to catch damaged files without encoding or stripping the original.
      await original.stats();
    } catch {
      throw new BadRequestException(
        'Fichier image invalide ou format incohérent',
      );
    }
  }

  private async uploadImage({ name, file }: { name: string; file: File }) {
    const original: Buffer = file.buffer;
    if (
      !Buffer.isBuffer(original) ||
      !original.length ||
      original.length > MAX_ORIGINAL_BYTES
    ) {
      throw new BadRequestException('Taille du fichier invalide');
    }
    await this.validateOriginal(original, name);
    const destination = this.originalDestination(name);
    await fs.promises.writeFile(destination, original, { flag: 'wx' });
    return destination;
  }

  async initiateChunkUpload(initiateUploadDto: InitiateUploadDto) {
    const {
      fileHash,
      fileName,
      hikeId,
      fileSize,
      chunkSize = DEFAULT_CHUNK_BYTES,
    } = initiateUploadDto;

    const normalizedFileSize = Number(fileSize);
    const normalizedChunkSize = Number(chunkSize);
    if (
      !Number.isSafeInteger(normalizedFileSize) ||
      normalizedFileSize <= 0 ||
      normalizedFileSize > MAX_ORIGINAL_BYTES ||
      !Number.isSafeInteger(normalizedChunkSize) ||
      normalizedChunkSize <= 0 ||
      normalizedChunkSize > MAX_CHUNK_BYTES
    ) {
      throw new BadRequestException("Paramètres d'upload invalides");
    }

    this.getSafeImageExtension(fileName);
    const totalChunks = Math.ceil(normalizedFileSize / normalizedChunkSize);

    if (totalChunks > MAX_UPLOAD_CHUNKS) {
      throw new BadRequestException('Nombre maximal de chunks dépassé');
    }
    const tempDir = this.resolveChunkTempDirectory(fileHash);
    const result = {
      fileHash,
      totalChunks,
      chunkSize: normalizedChunkSize,
      uploadId: fileHash,
    };
    const existing = this.uploadSessions.get(fileHash);
    if (existing) {
      if (
        existing.hikeId !== hikeId ||
        existing.fileName !== fileName ||
        existing.fileSize !== normalizedFileSize ||
        existing.chunkSize !== normalizedChunkSize
      ) {
        throw new BadRequestException("Session d'upload incohérente");
      }
      return result;
    }
    if (this.uploadSessions.size >= MAX_UPLOAD_SESSIONS) {
      throw new ServiceUnavailableException(
        "Trop de sessions d'upload actives",
      );
    }

    fs.mkdirSync(tempDir, { recursive: true });
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
    return result;
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

    const expectedSize = Math.min(
      session.chunkSize,
      session.fileSize - chunkIndex * session.chunkSize,
    );
    if (
      !Buffer.isBuffer(chunk?.buffer) ||
      chunk.buffer.length !== expectedSize
    ) {
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

    if (session.finalizing) {
      throw new BadRequestException('Finalisation déjà en cours');
    }
    session.finalizing = true;
    let writtenPath: string | undefined;
    let savedImage: Image | null = null;

    try {
      const finalFileName = `${uuidv4()}.${this.getSafeImageExtension(session.fileName)}`;
      const finalStoredPath = `Hike/${finalFileName}`;
      const finalPath = this.originalDestination(finalFileName);
      const output = await fs.promises.open(finalPath, 'wx');
      writtenPath = finalPath;
      try {
        for (let i = 0; i < session.totalChunks; i++) {
          const chunkPath = session.chunkPaths.get(i);
          if (!chunkPath) {
            throw new BadRequestException(`Chunk ${i} manquant`);
          }
          const chunkData = await fs.promises
            .readFile(chunkPath)
            .catch((error: NodeJS.ErrnoException) => {
              if (error.code === 'ENOENT') {
                throw new BadRequestException(`Chunk ${i} manquant`);
              }
              throw error;
            });
          await output.writeFile(chunkData);
        }
        if ((await output.stat()).size !== session.fileSize) {
          throw new BadRequestException('Taille du fichier final incohérente');
        }
      } finally {
        await output.close();
      }
      await this.validateOriginal(finalPath, finalFileName);

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
      if (!savedImage && writtenPath) {
        await this.discardOriginal(writtenPath);
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
    if (session.finalizing) {
      throw new BadRequestException('Finalisation déjà en cours');
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
      if (
        !session.finalizing &&
        now.getTime() - session.createdAt.getTime() > expireTime
      ) {
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
