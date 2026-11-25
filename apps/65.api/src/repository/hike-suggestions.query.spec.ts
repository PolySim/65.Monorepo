import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Database, OPEN_CREATE, OPEN_READWRITE, OPEN_URI } from 'sqlite3';
import { HikeSuggestions } from './hike-suggestions.query';

const flags = OPEN_CREATE | OPEN_READWRITE | OPEN_URI;
const fixture = 'file:hike-suggestions-fixture?mode=memory&cache=shared';

const exec = (db: Database, sql: string) =>
  new Promise<void>((done, fail) => {
    db.exec(sql, (error) => (error ? fail(error) : done()));
  });

const close = (db: Database) =>
  new Promise<void>((done, fail) => {
    db.close((error) => (error ? fail(error) : done()));
  });

it('coalesces cold loads and refreshes after commits from a second SQLite connection', async () => {
  const reader = new Database(fixture, flags);
  const writer = new Database(fixture, flags);
  try {
    await exec(
      writer,
      readFileSync(resolve(__dirname, '../../init-database.sql'), 'utf8'),
    );
    await exec(
      writer,
      `
      INSERT INTO Category (id, name) VALUES ('foot', 'Randonnée');
      INSERT INTO State (id, name) VALUES ('state', 'Mont d’Azur');
      INSERT INTO Difficulty (id, name) VALUES ('easy', 'Facile');
      INSERT INTO Hike (id, title, categoryId, stateId, difficultyId, mainImagePosition)
      VALUES ('test', 'Crête du Couloir', 'foot', 'state', 'easy', 0);
    `,
    );
    let loads = 0;
    const suggestions = new HikeSuggestions(<T>(sql: string) => {
      if (sql.includes('FROM Hike')) loads++;
      return new Promise<T[]>((done, fail) => {
        reader.all<T>(sql, (error, rows) => (error ? fail(error) : done(rows)));
      });
    });
    const first = await Promise.all([
      suggestions.find('creet'),
      suggestions.find('AZUR'),
      suggestions.find('couloir'),
    ]);
    expect(first.map((rows) => rows.map(({ id }) => id))).toEqual([
      ['test'],
      ['test'],
      ['test'],
    ]);
    expect(loads).toBe(1);

    await exec(
      writer,
      `UPDATE Category SET name = 'Raquettes' WHERE id = 'foot'`,
    );
    expect(await suggestions.find('randonnee')).toEqual([]);
    expect(await suggestions.find('raquettes')).toMatchObject([
      { id: 'test', categoryName: 'Raquettes' },
    ]);
    expect(loads).toBe(2);

    await exec(
      writer,
      `INSERT INTO Hike (id, title, categoryId, stateId, difficultyId, mainImagePosition)
       VALUES ('partial', 'Col des Mouflons', 'foot', 'state', 'easy', 0),
              ('exact', 'Mouﬂons', 'foot', 'state', 'easy', 0),
              ('lake', 'Lac d’Azur', 'foot', 'state', 'easy', 0),
              ('pass', 'Col du Grand‐Pic', 'foot', 'state', 'easy', 0),
              ('literal', 'Balise %_', 'foot', 'state', 'easy', 0);`,
    );
    expect(await suggestions.find('MOUFLONS')).toMatchObject([
      { id: 'exact', title: 'Mouﬂons' },
      { id: 'partial' },
    ]);
    for (const query of ['lac d azru', "lac d'azru", 'lac d’azru']) {
      expect(await suggestions.find(query)).toMatchObject([{ id: 'lake' }]);
    }
    for (const query of ['col du garnd-pic', 'col du garnd‑pic']) {
      expect(await suggestions.find(query)).toMatchObject([{ id: 'pass' }]);
    }
    expect(await suggestions.find('%_')).toMatchObject([{ id: 'literal' }]);
    expect(await suggestions.find('lac d%azru')).toEqual([]);
    expect(await suggestions.find('lac d_azru')).toEqual([]);
    expect(await suggestions.find('lac d--azru')).toEqual([]);
  } finally {
    await Promise.all([close(reader), close(writer)]);
  }
});
