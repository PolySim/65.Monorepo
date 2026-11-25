import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { databaseConfig } from 'src/config/database.config';
import { HikeRepository } from 'src/repository/hike.repository';
import { UserRepository } from 'src/repository/user.repository';
import { HikeService } from 'src/services/hike.service';
import request = require('supertest');
import { DataSource } from 'typeorm';
import { HikeController } from './hike.controller';

// Exercise the real Nest guards, but stand in for the ESM Better Auth adapter.
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: (headers: Record<string, string>) => new Headers(headers),
}));
jest.mock('../auth', () => ({
  auth: {
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        const cookie = headers.get('cookie');
        if (!['session=a', 'session=b', 'session=unlinked'].includes(cookie)) {
          return null;
        }
        return { user: { id: cookie.split('=')[1] }, session: {} };
      },
    },
  },
}));

const alice = 'session=a';
const bob = 'session=b';

describe('Hike API on the SQLite bootstrap schema', () => {
  let app: INestApplication;
  let db: DataSource;

  beforeAll(async () => {
    db = await new DataSource({
      ...databaseConfig,
      database: ':memory:',
      logging: false,
    }).initialize();
    const connection = await db.createQueryRunner().connect();
    await new Promise<void>((resolveExec, reject) => {
      connection.exec(
        readFileSync(resolve(__dirname, '../../init-database.sql'), 'utf8'),
        (error: Error | null) => (error ? reject(error) : resolveExec()),
      );
    });
    await db.query(`INSERT INTO User(id, email, roleId, authUserId) VALUES
      ('user-a', 'alpha@example.test', 0, 'a'), ('user-b', 'beta@example.test', 1, 'b')`);
    await db.query(
      `INSERT INTO Category(id, name) VALUES ('foot', 'Randonnée'), ('ski', 'Ski de rando')`,
    );
    await db.query(
      `INSERT INTO State(id, name) VALUES ('massif-a', 'Vallon Azur'), ('massif-b', 'Massif Indigo')`,
    );
    await db.query(
      `INSERT INTO Difficulty(id, name) VALUES ('easy', 'Facile')`,
    );
    for (let i = 11; i >= 0; i--) {
      await db.query(
        `INSERT INTO Hike(id, title, stateId, categoryId, difficultyId, mainImagePosition, content)
         VALUES (?, 'Crête', 'massif-a', 'foot', 'easy', 0, 'Longue description')`,
        [`hike-${String(i).padStart(2, '0')}`],
      );
    }
    await db.query(`INSERT INTO Hike(id, title, stateId, categoryId, difficultyId, mainImagePosition)
      VALUES ('literal', 'Boucle 100%_marquée', 'massif-b', 'ski', 'easy', 0),
             ('plain', 'Boucle 100XAmarquée', 'massif-b', 'ski', 'easy', 0),
             ('phrase', 'Aiguille Blanche', 'massif-b', 'ski', 'easy', 0),
             ('typo-first', 'Aguilles', 'massif-b', 'ski', 'easy', 0),
             ('substring', 'Mont des Éguilles', 'massif-b', 'ski', 'easy', 0),
             ('exact', 'Éguilles', 'massif-b', 'ski', 'easy', 0),
             ('unicode', 'ΣΙΣΥΦΟΣ au Cœur du massif', 'massif-b', 'ski', 'easy', 0),
             ('short', 'Pré des Roches', 'massif-b', 'ski', 'easy', 0)`);

    const module = await Test.createTestingModule({
      controllers: [HikeController],
      providers: [
        { provide: DataSource, useValue: db },
        HikeService,
        HikeRepository,
        UserRepository,
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (db?.isInitialized) await db.destroy();
  });

  const api = () => request(app.getHttpServer());
  const suggestions = (q: string) =>
    api().get('/hikes/suggestions').query({ q }).set('Cookie', alice);

  it('requires a session on suggestions, status and writes', async () => {
    await api().get('/hikes/suggestions?q=cr').expect(401);
    await api().get('/hikes/hike-00/favorite').expect(401);
    await api()
      .put('/hikes/hike-00/favorite')
      .send({ isFavorite: true })
      .expect(401);
    await api()
      .put('/hikes/update')
      .set('Cookie', alice)
      .send({ id: 'hike-00' })
      .expect(403);
  });

  it.each([
    '  cRêTe  ',
    'CRETE',
    'CRE\u0302TE',
    'vallon',
    'RANDONNEE',
    'creet',
    'valoln',
    'randonee',
  ])(
    'matches %s and returns at most eight stable, lightweight rows',
    async (q) => {
      const res = await suggestions(q)
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(res.body).toEqual(
        Array.from({ length: 8 }, (_, i) => ({
          id: `hike-${String(11 - i).padStart(2, '0')}`,
          title: 'Crête',
          categoryId: 'foot',
          categoryName: 'Randonnée',
          stateId: 'massif-a',
          stateName: 'Vallon Azur',
        })),
      );
    },
  );

  it('ranks normalized full and substring matches before earlier fuzzy titles', async () => {
    const { body } = await suggestions('EGUILLES').expect(200);
    expect(body.map((row: { id: string }) => row.id)).toEqual([
      'exact',
      'substring',
      'typo-first',
    ]);
  });

  it.each([
    'aiguile blanche',
    'aiguille blacnhe',
    'agiuille blanche',
    'aiguillle blanche',
    'aiguulle blanche',
  ])('allows one typo in a phrase: %s', async (term) => {
    const { body } = await suggestions(term).expect(200);
    expect(body.map((row: { id: string }) => row.id)).toEqual(['phrase']);
  });

  it.each(['σίσυφοσ', 'COEUR'])(
    'folds Unicode case and accents in %s without changing the display title',
    async (term) => {
      const { body } = await suggestions(term).expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        id: 'unicode',
        title: 'ΣΙΣΥΦΟΣ au Cœur du massif',
      });
    },
  );

  it('refreshes suggestions after hike and label changes on the same connection', async () => {
    await suggestions('roches')
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].id).toBe('short');
      });
    try {
      await db.query(
        `UPDATE Hike SET title = 'Sentier du Hêtre' WHERE id = 'short'`,
      );
      await db.query(
        `UPDATE State SET name = 'L’Éboulis' WHERE id = 'massif-b'`,
      );
      await suggestions('roches').expect(200, []);
      await suggestions('hetre')
        .expect(200)
        .expect(({ body }) => {
          expect(body[0]).toMatchObject({
            id: 'short',
            title: 'Sentier du Hêtre',
          });
        });
      await suggestions('eboulis')
        .expect(200)
        .expect(({ body }) => {
          expect(body).not.toHaveLength(0);
          expect(
            body.every(
              (row: { stateName: string }) => row.stateName === 'L’Éboulis',
            ),
          ).toBe(true);
        });
    } finally {
      await db.query(
        `UPDATE Hike SET title = 'Pré des Roches' WHERE id = 'short'`,
      );
      await db.query(
        `UPDATE State SET name = 'Massif Indigo' WHERE id = 'massif-b'`,
      );
    }
  });

  it('does not retain a catalog read during a rolled-back SQLite transaction', async () => {
    const transaction = db.createQueryRunner();
    await transaction.startTransaction();
    try {
      await transaction.query(
        `UPDATE Hike SET title = 'Sentier factice' WHERE id = 'short'`,
      );
      await suggestions('factice')
        .expect(200)
        .expect(({ body }) => {
          expect(body[0].id).toBe('short');
        });
    } finally {
      await transaction.rollbackTransaction();
      await transaction.release();
    }
    await suggestions('factice').expect(200, []);
    await suggestions('roches')
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].id).toBe('short');
      });
  });

  it('handles short terms and validates q without supporting LIKE wildcards', async () => {
    await suggestions('  ').expect(200, []);
    await suggestions('c').expect(200, []);
    await suggestions('e\u0301').expect(200, []);
    await suggestions('pre')
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].id).toBe('short');
      });
    await suggestions('pxe').expect(200, []);
    await suggestions('aiguile blacnhe').expect(200, []);
    await suggestions('1001').expect(200, []);
    await suggestions('introuvable').expect(200, []);
    await suggestions('x'.repeat(81)).expect(400);
    await api()
      .get('/hikes/suggestions?q=a&q=b')
      .set('Cookie', alice)
      .expect(400);
    const { body } = await suggestions('%_').expect(200);
    expect(body.map((row: { id: string }) => row.id)).toEqual(['literal']);
  });

  it('keeps the collection/admin filter unrestricted and the detail route intact', async () => {
    for (const filters of [
      { categoryId: 'foot' },
      { categoryId: 'foot', stateId: 'massif-a' },
    ]) {
      const { body } = await api()
        .post('/hikes/filters')
        .set('Cookie', bob)
        .send(filters)
        .expect(201);
      expect(body).toHaveLength(12);
      expect(body[0]).toMatchObject({
        category: { id: 'foot' },
        difficulty: { name: 'Facile' },
      });
    }
    const detail = await api()
      .get('/hikes/hike-00')
      .set('Cookie', alice)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: 'hike-00',
      content: 'Longue description',
    });
  });

  it('sets a boolean status idempotently, per user, while keeping the rich favorites list', async () => {
    const path = '/hikes/hike-00/favorite';
    const get = (cookie: string) => api().get(path).set('Cookie', cookie);
    const put = (isFavorite: boolean) =>
      api()
        .put(path)
        .set('Cookie', alice)
        .send({ isFavorite, userId: 'user-b' });

    await get(alice)
      .expect('Cache-Control', 'no-store')
      .expect(200, { isFavorite: false });
    await Promise.all([
      put(true).expect(200, { isFavorite: true }),
      put(true).expect(200, { isFavorite: true }),
    ]);
    await get(alice).expect(200, { isFavorite: true });
    await get(bob).expect(200, { isFavorite: false });
    const favorites = await api()
      .get('/hikes/favorites')
      .set('Cookie', alice)
      .expect(200);
    expect(favorites.body).toHaveLength(1);
    expect(favorites.body[0]).toMatchObject({
      id: 'hike-00',
      title: 'Crête',
      state: { id: 'massif-a' },
    });
    await put(false).expect(200, { isFavorite: false });
    await put(false).expect(200, { isFavorite: false });
    await get(alice).expect(200, { isFavorite: false });
    await api().get('/hikes/favorites').set('Cookie', alice).expect(200, []);
  });

  it('keeps legacy toggle compatible with the new status endpoint', async () => {
    for (const isFavorite of [true, false]) {
      await api()
        .post('/hikes/toggle-favorite')
        .set('Cookie', bob)
        .send({ hikeId: 'hike-00' })
        .expect(201);
      await api()
        .get('/hikes/hike-00/favorite')
        .set('Cookie', bob)
        .expect(200, { isFavorite });
    }
  });

  it('rejects invalid status, unknown hikes and sessions without an application user', async () => {
    await api()
      .put('/hikes/hike-00/favorite')
      .set('Cookie', alice)
      .send({ isFavorite: 'true' })
      .expect(400);
    await api().get('/hikes/unknown/favorite').set('Cookie', alice).expect(404);
    await api()
      .put('/hikes/unknown/favorite')
      .set('Cookie', alice)
      .send({ isFavorite: true })
      .expect(404);
    await api()
      .get('/hikes/hike-00/favorite')
      .set('Cookie', 'session=unlinked')
      .expect(403);
  });
});
