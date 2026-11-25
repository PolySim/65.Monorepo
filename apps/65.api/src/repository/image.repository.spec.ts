import {
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import * as sharp from 'sharp';
import { config } from 'src/config/config';
import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Image } from '../entities/image.entity';
import { State } from '../entities/state.entity';
import { ImageRepository } from './image.repository';

jest.mock('src/config/config', () => ({ config: { image_path: '' } }));

async function contents(file: StreamableFile): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of file.getStream()) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function raster(width: number, height: number, alpha = false) {
  const channels = alpha ? 4 : 3;
  const data = Buffer.alloc(width * height * channels);
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[i++] = (x + (y % 19) * 11) % 256;
      data[i++] = (y + (x % 11) * 16) % 256;
      data[i++] = ((x + y) * 3) % 256;
      if (alpha) data[i++] = x < width / 2 ? 0 : 150;
    }
  }
  return sharp(data, { raw: { width, height, channels } });
}

function animation() {
  const width = 40;
  const pageHeight = 24;
  const size = width * pageHeight * 4;
  const data = Buffer.alloc(size * 2);
  for (let frame = 0; frame < 2; frame++) {
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 20; x++) {
        const i = frame * size + (y * width + x) * 4;
        data[i + frame * 2] = 255;
        data[i + 3] = 255;
      }
    }
  }
  return sharp(data, {
    raw: { width, height: pageHeight * 2, channels: 4, pageHeight },
  });
}

function upload(originalname: string, buffer: Buffer): File {
  return { originalname, buffer } as File;
}

describe('ImageRepository', () => {
  let repository: ImageRepository;
  let temp: string;
  let root: string;
  let dataSource: { createEntityManager: jest.Mock; getRepository: jest.Mock };
  let lookup: jest.SpyInstance;

  const internals = () =>
    repository as unknown as {
      renderVariant(
        input: Buffer,
        profile: { width: number; quality: number; rotation: number },
      ): Promise<Buffer>;
      readOriginal(source: string, expected: fs.BigIntStats): Promise<Buffer>;
      cacheVariant(key: string, data: Buffer): void;
      pendingVariants: Map<string, Promise<Buffer>>;
      variants: Map<string, Buffer>;
      variantBytes: number;
    };

  function fixture(path: string, data: Buffer): string {
    const destination = join(root, path);
    fs.mkdirSync(dirname(destination), { recursive: true });
    fs.writeFileSync(destination, data);
    return destination;
  }

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    temp = fs.mkdtempSync(join(tmpdir(), 'image-repository-'));
    root = join(temp, 'images');
    fs.mkdirSync(root);
    jest.replaceProperty(config, 'image_path', root);
    dataSource = {
      createEntityManager: jest.fn(() => ({})),
      getRepository: jest.fn(() => ({
        findOne: jest.fn().mockResolvedValue(null),
      })),
    };
    repository = new ImageRepository(dataSource as unknown as DataSource);
    lookup = jest.spyOn(repository, 'findOne').mockResolvedValue(new Image());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    fs.rmSync(temp, { recursive: true, force: true });
  });

  it('refuse un hash qui sortirait du répertoire temporaire', async () => {
    await expect(
      repository.initiateChunkUpload({
        fileHash: '../../../65.Monorepo',
        fileName: 'photo.jpg',
        hikeId: 'hike-id',
        fileSize: 1024,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepte les 200 chunks du client à 100 Mio et refuse 201 avant mkdir', async () => {
    const dto = {
      fileHash: 'a1',
      fileName: 'photo.jpg',
      hikeId: 'hike-id',
      fileSize: 100 * 1024 * 1024,
    };
    await expect(
      repository.initiateChunkUpload({ ...dto, chunkSize: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      repository.initiateChunkUpload({ ...dto, chunkSize: 512 * 1024 - 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fs.readdirSync(root)).toEqual([]);
    await expect(repository.initiateChunkUpload(dto)).resolves.toEqual({
      fileHash: 'a1',
      uploadId: 'a1',
      totalChunks: 200,
      chunkSize: 512 * 1024,
    });
    await expect(
      repository.initiateChunkUpload({
        ...dto,
        fileHash: 'a2',
        chunkSize: 1024 * 1024,
      }),
    ).resolves.toMatchObject({ totalChunks: 100 });
  });

  it('borne les sessions, conserve une reprise et libère les places annulées ou expirées', async () => {
    const dto = { fileName: 'photo.jpg', hikeId: 'hike-id', fileSize: 10 };
    const start = (index: number) =>
      repository.initiateChunkUpload({ ...dto, fileHash: index.toString(16) });
    await Promise.all(Array.from({ length: 8 }, (_, i) => start(i)));
    await repository.uploadChunk(upload('chunk', Buffer.alloc(10)), {
      ...dto,
      fileHash: '0',
      chunkIndex: '0',
      totalChunks: '1',
    });
    await expect(start(8)).rejects.toMatchObject({ status: 503 });
    expect(fs.readdirSync(join(root, 'temp'))).toHaveLength(8);
    await expect(start(0)).resolves.toMatchObject({ totalChunks: 1 });
    await expect(
      repository.initiateChunkUpload({
        ...dto,
        fileHash: '0',
        hikeId: 'other',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(repository.getChunkStatus('0')).resolves.toMatchObject({
      uploadedChunks: [0],
    });
    await repository.cancelChunkUpload('0');
    await expect(start(8)).resolves.toMatchObject({ uploadId: '8' });
    jest.advanceTimersByTime(25 * 60 * 60 * 1000);
    expect(fs.readdirSync(join(root, 'temp'))).toEqual([]);
    await expect(start(9)).resolves.toMatchObject({ uploadId: '9' });
  });

  it('vérifie la taille exacte du chunk normal et du dernier fragment client', async () => {
    const dto = {
      fileHash: 'a1',
      fileName: 'photo.jpg',
      hikeId: 'hike-id',
      fileSize: 512 * 1024 + 7,
    };
    await repository.initiateChunkUpload(dto);
    const chunk = (chunkIndex: string, size: number) =>
      repository.uploadChunk(upload('chunk', Buffer.alloc(size)), {
        ...dto,
        chunkIndex,
        totalChunks: '2',
      });
    await expect(chunk('0', 512 * 1024 - 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(chunk('1', 8)).rejects.toBeInstanceOf(BadRequestException);
    expect(fs.readdirSync(join(root, 'temp', dto.fileHash))).toEqual([]);
    await expect(chunk('0', 512 * 1024)).resolves.toMatchObject({
      isComplete: false,
    });
    await expect(chunk('1', 7)).resolves.toMatchObject({ isComplete: true });
  });

  it("refuse aussi un hash malveillant lors de l'annulation", async () => {
    await expect(
      repository.cancelChunkUpload('../../database.db'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([Category, State])(
    'sert une image %p enregistrée sans width ni rotation',
    async (entity) => {
      lookup.mockResolvedValue(null);
      dataSource.getRepository.mockImplementation((target) => ({
        findOne: jest
          .fn()
          .mockResolvedValue(target === entity ? { id: 'known-id' } : null),
      }));
      const path = `${entity.name}/photo.jpg`;
      fixture(path, await raster(200, 120).jpeg().toBuffer());
      const response = await repository.sendImage(path);
      expect(response.getHeaders().type).toBe('image/webp');
      expect(await sharp(await contents(response)).metadata()).toMatchObject({
        format: 'webp',
        width: 200,
        height: 120,
      });
    },
  );

  it.each(['png', 'jpeg'] as const)(
    'réduit le poids %s sans width et garde le fichier source intact',
    async (format) => {
      const pixels = raster(2400, 1200, format === 'png');
      const original = await (
        format === 'png' ? pixels.png() : pixels.jpeg({ quality: 96 })
      ).toBuffer();
      const path = `Hike/large.${format}`;
      const source = fixture(path, original);
      const response = await repository.sendImage(path);
      const variant = await contents(response);
      expect(response.getHeaders()).toEqual({
        type: 'image/webp',
        disposition: 'inline',
        length: variant.length,
      });
      expect(await sharp(variant).metadata()).toMatchObject({
        format: 'webp',
        width: 1920,
        height: 960,
        hasAlpha: format === 'png',
      });
      if (format === 'png') {
        const rgba = await sharp(variant).raw().toBuffer();
        expect(rgba[3]).toBe(0);
        expect(rgba[1919 * 4 + 3]).toBe(150);
      }
      console.info(
        `${format}: ${original.length} → ${variant.length} octets (2400 × 1200 → 1920 × 960)`,
      );
      expect(variant.length).toBeLessThan(original.length * 0.7);
      expect(fs.readFileSync(source).equals(original)).toBe(true);
      expect(fs.readdirSync(dirname(source))).toEqual([`large.${format}`]);
    },
  );

  it('optimise une photo JPEG valide de 48 mégapixels', async () => {
    const original = await sharp({
      create: { width: 8000, height: 6000, channels: 3, background: '#123456' },
    })
      .jpeg()
      .toBuffer();
    const path = 'Hike/48mp.jpg';
    fixture(path, original);
    const output = await contents(await repository.sendImage(path));
    expect(await sharp(output).metadata()).toMatchObject({
      format: 'webp',
      width: 1920,
      height: 1440,
    });
  });

  it('borne aussi la hauteur d’un original très vertical sans recadrer', async () => {
    const path = 'Hike/portrait.png';
    fixture(path, await raster(200, 4800).png().toBuffer());
    const variant = await contents(await repository.sendImage(path));
    expect(await sharp(variant).metadata()).toMatchObject({
      width: 160,
      height: 3840,
    });
  });

  it('applique l’orientation EXIF avant la rotation métier et dimensionne le résultat', async () => {
    const path = 'Hike/exif.jpg';
    fixture(
      path,
      await raster(160, 80).withMetadata({ orientation: 6 }).jpeg().toBuffer(),
    );
    lookup.mockResolvedValue(Object.assign(new Image(), { rotate: 90 }));
    const orientedOnly = await contents(await repository.sendImage(path, '0'));
    const withBusinessRotation = await contents(
      await repository.sendImage(path, undefined, '80'),
    );
    const oriented = await sharp(orientedOnly).metadata();
    const rotated = await sharp(withBusinessRotation).metadata();
    expect(oriented).toMatchObject({ width: 80, height: 160 });
    expect(rotated).toMatchObject({ width: 80, height: 40 });
    expect(oriented.orientation).toBeUndefined();
    expect(rotated.orientation).toBeUndefined();
  });

  it.each(['gif', 'webp'] as const)(
    'préserve transparence, ordre et chronologie %s, même après rotation',
    async (format) => {
      const path = `Hike/animation.${format}`;
      const options = { delay: [80, 220], loop: 3 };
      const input = await animation().toFormat(format, options).toBuffer();
      const inputMetadata = await sharp(input, { animated: true }).metadata();
      fixture(path, input);
      for (const [rotation, width, height] of [
        [0, 20, 12],
        [90, 20, 33],
        [180, 20, 12],
        [270, 20, 33],
      ]) {
        const variant = await contents(
          await repository.sendImage(path, rotation, width),
        );
        const output = sharp(variant, { animated: true });
        expect(await output.metadata()).toMatchObject({
          format: 'webp',
          width,
          pageHeight: height,
          pages: 2,
          hasAlpha: true,
          delay: inputMetadata.delay,
          loop: inputMetadata.loop,
        });
        const rgba = await output.raw().toBuffer();
        const frameSize = width * height * 4;
        // The top-left coloured block moves to a different corner at each rotation.
        const x = rotation === 90 || rotation === 180 ? width - 3 : 2;
        const y = rotation === 180 || rotation === 270 ? height - 3 : 2;
        const pixel = (y * width + x) * 4;
        const opposite = ((height - 1 - y) * width + width - 1 - x) * 4;
        expect(rgba[pixel]).toBeGreaterThan(200); // First frame is red.
        expect(rgba[frameSize + pixel + 2]).toBeGreaterThan(200); // Then blue.
        expect(rgba[opposite + 3]).toBe(0);
      }
    },
  );

  it('compte la surface GIF décodée une seule fois, toutes trames comprises', async () => {
    const gif = await animation()
      .gif({ delay: [80, 220] })
      .toBuffer();
    // Expand the logical canvas and repeat the two small frames without
    // allocating a raw oversized fixture. 10 × 4 Mi px passes; 18 × fails.
    const firstFrame = gif.indexOf(Buffer.from([0x21, 0xf9, 4]));
    const header = Buffer.from(gif.subarray(0, firstFrame));
    header.writeUInt16LE(2048, 6);
    header.writeUInt16LE(2048, 8);
    const repeatedGif = (pairs: number) =>
      Buffer.concat([
        header,
        ...Array<Buffer>(pairs).fill(gif.subarray(firstFrame, -1)),
        gif.subarray(-1),
      ]);
    const valid = repeatedGif(5);
    const oversized = repeatedGif(9);
    await expect(
      sharp(valid, { animated: true }).metadata(),
    ).resolves.toMatchObject({
      width: 2048,
      height: 20480,
      pages: 10,
    });
    await expect(sharp(oversized).metadata()).resolves.toMatchObject({
      width: 2048,
      height: 2048,
      pages: 18,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);
    const save = jest
      .spyOn(repository, 'save')
      .mockImplementation(async (image: Image) => image);
    const [image] = await repository.createImage('hike-id', [
      upload('ok.gif', valid),
    ]);
    const output = await contents(
      await repository.sendImage(image.path, 0, 256),
    );
    expect(await sharp(output, { animated: true }).metadata()).toMatchObject({
      width: 256,
      pageHeight: 256,
      pages: 10,
    });
    const path = 'Hike/oversized.gif';
    fixture(path, oversized);
    await expect(repository.sendImage(path, 90, 256)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      repository.createImage('hike-id', [upload('oversized.gif', oversized)]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(save).toHaveBeenCalledTimes(1);
    expect(internals().variants.size).toBe(1);
  });

  it('applique aussi un EXIF miroir à chaque trame WebP avant la rotation métier', async () => {
    const path = 'Hike/mirrored.webp';
    fixture(
      path,
      await animation()
        .withMetadata({ orientation: 5 })
        .webp({ delay: [80, 220] })
        .toBuffer(),
    );
    const variant = await contents(await repository.sendImage(path, 90, 20));
    const output = sharp(variant, { animated: true });
    expect(await output.metadata()).toMatchObject({
      width: 20,
      pageHeight: 12,
      pages: 2,
      delay: [80, 220],
    });
    const rgba = await output.raw().toBuffer();
    expect(rgba[(2 * 20 + 17) * 4]).toBeGreaterThan(200); // Transpose, then clockwise rotation.
    expect(rgba[(2 * 20 + 2) * 4 + 3]).toBe(0);
  });

  it.each([
    [0, 0, 82],
    [0, 3841, 82],
    [0, 123.5, 82],
    [0, 400, 96],
    [0, 400, 39],
    [45, 400, 82],
  ])(
    'refuse le profil hors limites (%i, %i, %i)',
    async (rotation, width, quality) => {
      await expect(
        repository.sendImage('Hike/photo.jpg', rotation, width, quality),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('coalesce les rendus concurrents, distingue les profils et revalide l’enregistrement avant tout hit', async () => {
    const path = 'Hike/cached.png';
    fixture(path, await raster(180, 90).png().toBuffer());
    const render = jest.spyOn(internals(), 'renderVariant');
    const [first, second] = await Promise.all([
      repository.sendImage(path, '-360', '100', '82').then(contents),
      repository.sendImage(path, 0, 100).then(contents),
    ]);
    expect(first.equals(second)).toBe(true);
    expect(render).toHaveBeenCalledTimes(1);
    expect(
      (await contents(await repository.sendImage(path, 360, 100, 82))).equals(
        first,
      ),
    ).toBe(true);
    expect(render).toHaveBeenCalledTimes(1);
    await repository.sendImage(path, 0, 100, 75);
    await repository.sendImage(path, 0, 110, 82);
    await repository.sendImage(path, 90, 100, 82);
    expect(render).toHaveBeenCalledTimes(4);
    lookup.mockResolvedValueOnce(null);
    await expect(repository.sendImage(path, 0, 100, 82)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(render).toHaveBeenCalledTimes(4);
    expect(lookup).toHaveBeenCalledTimes(7);
  });

  it('refuse un original vide ou de plus de 100 Mio avant lecture', async () => {
    const path = 'Hike/size.png';
    const source = fixture(path, Buffer.alloc(0));
    const read = jest.spyOn(internals(), 'readOriginal');
    await expect(repository.sendImage(path)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    fs.truncateSync(source, 100 * 1024 * 1024 + 1);
    await expect(repository.sendImage(path)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('borne la file avant lecture, mutualise à saturation et libère la place après erreur', async () => {
    const path = 'Hike/burst.png';
    fixture(path, await raster(40, 20).png().toBuffer());
    await repository.sendImage(path, 0, 20); // Un hit ne consomme pas de place.
    const state = internals();
    const read = jest.spyOn(state, 'readOriginal');
    let release: () => void;
    let markStarted: () => void;
    const stall = new Promise<void>((resolve) => (release = resolve));
    const started = new Promise<void>((resolve) => (markStarted = resolve));
    const render = jest
      .spyOn(state, 'renderVariant')
      .mockImplementationOnce(async () => {
        markStarted();
        await stall;
        throw new Error('failed render');
      })
      .mockResolvedValue(Buffer.from('variant'));
    const first = expect(
      repository.sendImage(path, 0, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
    await Promise.race([started, first]);
    const queued = Array.from({ length: 16 }, (_, i) =>
      repository.sendImage(path, 0, i + 2),
    );
    const duplicate = repository.sendImage(path, 0, 2);
    // Attach handlers immediately so an unexpected rejection still drains the test fixture.
    const jobs = Promise.allSettled([first, ...queued, duplicate]);
    try {
      await expect(repository.sendImage(path, 0, 18)).rejects.toMatchObject({
        status: 503,
      });
      await expect(repository.sendImage(path, 0, 20)).resolves.toBeInstanceOf(
        StreamableFile,
      );
      expect(state.pendingVariants.size).toBe(17);
      expect(read).toHaveBeenCalledTimes(1);
      expect(state.variants.size).toBe(1);
    } finally {
      release();
      expect((await jobs).every(({ status }) => status === 'fulfilled')).toBe(
        true,
      );
    }
    expect(render.mock.calls.map(([, { width }]) => width)).toEqual(
      Array.from({ length: 17 }, (_, i) => i + 1),
    );
    expect(read).toHaveBeenCalledTimes(17);
    expect(state.pendingVariants.size).toBe(0);
    expect(state.variants.size).toBe(17); // 16 succès et le hit préchauffé.
    await expect(repository.sendImage(path, 0, 1)).resolves.toBeInstanceOf(
      StreamableFile,
    );
    await expect(repository.sendImage(path, 0, 18)).resolves.toBeInstanceOf(
      StreamableFile,
    );
    expect(read).toHaveBeenCalledTimes(19);
  });

  it('ignore un cache chaud si le fichier est remplacé, supprimé ou pointe hors racine', async () => {
    const path = 'Hike/cached.png';
    const original = await raster(90, 45).png().toBuffer();
    const source = fixture(path, original);
    const render = jest.spyOn(internals(), 'renderVariant');
    const time = new Date('2024-01-01T00:00:00Z');
    fs.utimesSync(source, time, time);
    await repository.sendImage(path);
    const replacement = fixture('Hike/replacement.png', original);
    fs.utimesSync(replacement, time, time);
    fs.renameSync(replacement, source);
    await repository.sendImage(path);
    expect(render).toHaveBeenCalledTimes(2);
    fs.unlinkSync(source);
    await expect(repository.sendImage(path)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    const outside = join(temp, 'outside.png');
    fs.writeFileSync(outside, original);
    fs.symlinkSync(outside, source);
    await expect(repository.sendImage(path)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(repository.sendImage('../outside.png')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('ne mémorise pas une erreur et ne livre pas un rendu dont le fichier a changé pendant le calcul', async () => {
    const path = 'Hike/changing.png';
    const original = await raster(90, 45).png().toBuffer();
    const source = fixture(path, original);
    const render = jest.spyOn(internals(), 'renderVariant');
    render.mockRejectedValueOnce(new Error('temporary failure'));
    await expect(repository.sendImage(path)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    render.mockImplementationOnce(async () => {
      fs.renameSync(fixture('Hike/next.png', original), source);
      return Buffer.from('version périmée');
    });
    await expect(repository.sendImage(path)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(internals().variants.size).toBe(0);
    await expect(repository.sendImage(path)).resolves.toBeDefined();
    expect(render).toHaveBeenCalledTimes(3);
  });

  it('évince la variante la moins récemment utilisée à la limite de 256 entrées', async () => {
    const path = 'Hike/entry.png';
    fixture(path, await raster(20, 10).png().toBuffer());
    const cache = internals();
    const render = jest
      .spyOn(cache, 'renderVariant')
      .mockResolvedValue(Buffer.from('variant'));
    for (let width = 1; width <= 256; width++)
      await repository.sendImage(path, 0, width);
    await repository.sendImage(path, 0, 1); // Rajeunir la plus ancienne.
    await repository.sendImage(path, 0, 257);
    await repository.sendImage(path, 0, 1);
    expect(render).toHaveBeenCalledTimes(257);
    await repository.sendImage(path, 0, 2);
    expect(render).toHaveBeenCalledTimes(258);
    expect(cache.variants.size).toBe(256);
    expect(cache.variantBytes).toBe(256 * 'variant'.length);
  });

  it('respecte aussi le budget de 64 Mio et ne conserve pas une variante trop grosse', () => {
    const cache = internals();
    const mib = 1024 * 1024;
    cache.cacheVariant('a', Buffer.alloc(30 * mib));
    cache.cacheVariant('b', Buffer.alloc(30 * mib));
    cache.cacheVariant('c', Buffer.alloc(5 * mib));
    cache.cacheVariant('oversized', Buffer.alloc(64 * mib + 1));
    expect([...cache.variants.keys()]).toEqual(['b', 'c']);
    expect(cache.variantBytes).toBe(35 * mib);
  });

  it('conserve les octets et les métadonnées de l’original importé directement', async () => {
    const original = await raster(44, 32)
      .withMetadata({ orientation: 8 })
      .jpeg()
      .toBuffer();
    jest.spyOn(repository, 'count').mockResolvedValue(0);
    jest
      .spyOn(repository, 'save')
      .mockImplementation(async (image: Image) => image);
    const [image] = await repository.createImage('hike-id', [
      upload('photo.JPG', original),
    ]);
    expect(fs.readFileSync(join(root, image.path)).equals(original)).toBe(true);
    expect(
      await sharp(
        await contents(await repository.sendImage(image.path)),
      ).metadata(),
    ).toMatchObject({ width: 32, height: 44 });
  });

  it('nettoie uniquement le fichier du save rejeté lors de l’import direct', async () => {
    const original = await raster(16, 10).jpeg().toBuffer();
    const dbError = new Error('db failure');
    const existing = fixture('Hike/existing.jpg', original);
    jest.spyOn(repository, 'count').mockResolvedValue(1);
    const save = jest
      .spyOn(repository, 'save')
      .mockImplementationOnce(async (image: Image) => {
        expect(fs.readFileSync(join(root, image.path))).toEqual(original);
        throw dbError;
      });
    await expect(
      repository.createImage('hike-id', [upload('new.jpg', original)]),
    ).rejects.toBe(dbError);
    expect(save).toHaveBeenCalledTimes(1);
    expect(fs.readdirSync(join(root, 'Hike'))).toEqual(['existing.jpg']);
    expect(fs.readFileSync(existing)).toEqual(original);
  });

  it('refuse un format incohérent et un JPEG tronqué même si ses en-têtes sont lisibles', async () => {
    const save = jest.spyOn(repository, 'save');
    jest.spyOn(repository, 'count').mockResolvedValue(0);
    const jpeg = await raster(200, 100).jpeg().toBuffer();
    const truncated = jpeg.subarray(0, -100);
    await expect(sharp(truncated).metadata()).resolves.toMatchObject({
      format: 'jpeg',
    });
    await expect(
      repository.createImage('hike-id', [upload('bad.jpg', truncated)]),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      repository.createImage('hike-id', [upload('bad.png', jpeg)]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(save).not.toHaveBeenCalled();
    expect(fs.readdirSync(root)).toEqual([]);
  });

  async function uploadChunks(data: Buffer, fileName: string) {
    const fileHash = 'abc123';
    const hikeId = 'hike-id';
    const chunkSize = 32;
    const { totalChunks } = await repository.initiateChunkUpload({
      fileHash,
      hikeId,
      fileName,
      fileSize: data.length,
      chunkSize,
    });
    for (let chunkIndex = totalChunks - 1; chunkIndex >= 0; chunkIndex--) {
      await repository.uploadChunk(
        upload(
          'chunk',
          data.subarray(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize),
        ),
        {
          fileHash,
          fileName,
          hikeId,
          fileSize: data.length,
          chunkIndex,
          totalChunks,
        },
      );
    }
    return { fileHash, hikeId };
  }

  it('assemble un GIF importé par chunks sans modifier les octets ni perdre de trames', async () => {
    const original = await animation()
      .gif({ delay: [80, 220], loop: 3 })
      .toBuffer();
    const upload = await uploadChunks(original, 'animated.gif');
    jest.spyOn(repository, 'count').mockResolvedValue(0);
    jest.spyOn(repository, 'save').mockImplementation(async (image: Image) => {
      await expect(
        repository.completeChunkUpload(upload),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        repository.cancelChunkUpload(upload.fileHash),
      ).rejects.toBeInstanceOf(BadRequestException);
      return image;
    });
    const image = await repository.completeChunkUpload(upload);
    expect(fs.readFileSync(join(root, image.path)).equals(original)).toBe(true);
    expect(
      await sharp(await contents(await repository.sendImage(image.path)), {
        animated: true,
      }).metadata(),
    ).toMatchObject({ pages: 2, delay: [80, 220] });
    expect(fs.existsSync(join(root, 'temp', upload.fileHash))).toBe(false);
  });

  it('supprime l’assemblage invalide et ne crée aucune ligne en base', async () => {
    const log = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const save = jest.spyOn(repository, 'save');
    const upload = await uploadChunks(Buffer.from('not a png'), 'bad.png');
    await expect(repository.completeChunkUpload(upload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(save).not.toHaveBeenCalled();
    expect(fs.readdirSync(join(root, 'Hike'))).toEqual([]);
    expect(fs.existsSync(join(root, 'temp', upload.fileHash))).toBe(false);
    expect(log).toHaveBeenCalled();
  });

  it('ne touche pas au fichier si la suppression en base échoue', async () => {
    const image = Object.assign(new Image(), {
      id: 'image-id',
      path: 'Hike/photo.jpg',
    });
    const original = Buffer.from('image to keep');
    const source = fixture(image.path, original);
    lookup.mockResolvedValue(image);
    jest.spyOn(repository, 'delete').mockRejectedValue(new Error('db failure'));
    await expect(repository.deleteImage(image.id)).rejects.toThrow(
      'db failure',
    );
    expect(fs.readFileSync(source)).toEqual(original);
  });
});
