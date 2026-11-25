// Run from apps/65.api: pnpm exec tsx scripts/measure-hike-queries.ts
// Uses the API's sqlite3 driver and a disposable in-memory bootstrap schema.
import { deepStrictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Database, VERSION } from 'sqlite3';
import { HikeSuggestions } from '../src/repository/hike-suggestions.query';

const db = new Database(':memory:');

const exec = (sql: string) =>
  new Promise<void>((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });

const all = <T = Record<string, unknown>>(sql: string, params: string[] = []) =>
  new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (err, rows: T[]) =>
      err ? reject(err) : resolve(rows),
    );
  });

// Pre-change baselines: join before vs. after the LIKE predicate and LIMIT.
const hikeSuggestionsSql = `
  SELECT match.id, match.title, match.categoryId, category.name AS categoryName,
         match.stateId, state.name AS stateName
  FROM (
    SELECT id, title, categoryId, stateId, rowid AS tieOrder
    FROM Hike
    WHERE title LIKE ? ESCAPE '\\'
       OR stateId IN (SELECT id FROM State WHERE name LIKE ? ESCAPE '\\')
       OR categoryId IN (SELECT id FROM Category WHERE name LIKE ? ESCAPE '\\')
    ORDER BY title, rowid LIMIT 8
  ) AS match
  JOIN Category AS category ON category.id = match.categoryId
  JOIN State AS state ON state.id = match.stateId
  ORDER BY match.title, match.tieOrder`;

function hikeSuggestionParams(term: string): string[] {
  const pattern = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
  return [pattern, pattern, pattern];
}

const joinedSearch = `
  SELECT hike.id, hike.title, hike.categoryId, category.name AS categoryName,
         hike.stateId, state.name AS stateName
  FROM Hike AS hike
  JOIN State AS state ON state.id = hike.stateId
  JOIN Category AS category ON category.id = hike.categoryId
  WHERE hike.title LIKE ? ESCAPE '\\'
     OR state.name LIKE ? ESCAPE '\\'
     OR category.name LIKE ? ESCAPE '\\'
  ORDER BY hike.title, hike.rowid LIMIT 8`;

const median = (times: number[]) =>
  times.sort((a, b) => a - b)[Math.floor(times.length / 2)].toFixed(3);

const search = new HikeSuggestions(all);

async function compare(term: string, count: number, firstId?: string) {
  const params = hikeSuggestionParams(term);
  const reference = await all(joinedSearch, params);
  const legacy = await all(hikeSuggestionsSql, params);
  deepStrictEqual(legacy, reference);
  const result = await search.find(term);
  deepStrictEqual([result.length, result[0]?.id], [count, firstId]);
  const timings = {
    joined: [] as number[],
    optimized: [] as number[],
    warm: [] as number[],
  };
  const cases = [
    ['joined', () => all(joinedSearch, params)],
    ['optimized', () => all(hikeSuggestionsSql, params)],
    ['warm', () => search.find(term)],
  ] as const;
  for (let i = 0; i < 31; i++) {
    for (let j = 0; j < cases.length; j++) {
      const [name, run] = cases[(i + j) % cases.length];
      const start = performance.now();
      await run();
      timings[name].push(performance.now() - start);
    }
  }
  console.log(
    `${term}: joined ${median(timings.joined)} ms, LIMIT before joins ${median(timings.optimized)} ms, Unicode/fuzzy warm ${median(timings.warm)} ms | ${legacy.length} → ${result.length} rows / ${Buffer.byteLength(JSON.stringify(result))} B`,
  );
}

async function main() {
  await exec(readFileSync(join(__dirname, '../init-database.sql'), 'utf8'));
  await exec(`
    PRAGMA foreign_keys = ON;
    INSERT INTO User (id, email, roleId, authUserId) VALUES ('app-user', 'demo@example.test', 0, 'auth-user');
    INSERT INTO Difficulty (id, name) VALUES ('easy', 'Facile');
    WITH RECURSIVE seq(n) AS (VALUES(0) UNION ALL SELECT n + 1 FROM seq WHERE n < 19)
    INSERT INTO Category (id, name) SELECT 'c-' || n, 'Catégorie ' || n FROM seq;
    WITH RECURSIVE seq(n) AS (VALUES(0) UNION ALL SELECT n + 1 FROM seq WHERE n < 199)
    INSERT INTO State (id, name) SELECT 's-' || n, printf('Massif %03d', n) FROM seq;
    WITH RECURSIVE seq(n) AS (VALUES(1) UNION ALL SELECT n + 1 FROM seq WHERE n < 50000)
    INSERT INTO Hike (id, title, categoryId, stateId, difficultyId, mainImagePosition, content)
    SELECT 'h-' || n,
      CASE WHEN n = 50000 THEN 'Vallon des Mélèzes'
           ELSE printf('Itinéraire %05d – %s %s', n,
             CASE n % 3 WHEN 0 THEN 'Boucle' WHEN 1 THEN 'Crête' ELSE 'Lac' END,
             CASE n % 4 WHEN 0 THEN 'des Aiguilles' WHEN 1 THEN 'du Chêne' WHEN 2 THEN 'd’Azur' ELSE 'du Nord' END)
      END,
      'c-' || (n % 20), 's-' || (n % 200), 'easy', 0, hex(zeroblob(256)) FROM seq;
    INSERT INTO Favorite (userId, hikeId) SELECT 'app-user', id FROM Hike WHERE stateId = 's-99';
  `);
  console.log(
    `SQLite ${VERSION}, 50,000 hikes, 200 states, 20 categories, 250 favorites`,
  );
  const cold: number[] = [];
  for (let i = 0; i < 11; i++) {
    const empty = new HikeSuggestions(all);
    const start = performance.now();
    const result = await empty.find('melezse');
    cold.push(performance.now() - start);
    deepStrictEqual(
      result.map(({ id }) => id),
      ['h-50000'],
    );
  }
  console.log(
    `Cold catalog + late fuzzy hit: p50 ${median(cold)} ms (11 loads); warm p50 over 31 reads:`,
  );
  await compare('ITINÉRAIRE', 8, 'h-1');
  await compare('49998', 1, 'h-49998');
  await compare('Massif 199', 8, 'h-199');
  await compare('Categorie 19', 8, 'h-19');
  await compare('melezse', 1, 'h-50000');
  await compare('lac d azru', 8, 'h-2');
  await compare('introuvable', 0);
  const printPlan = async (name: string, sql: string, params: string[]) => {
    const plan = await all(`EXPLAIN QUERY PLAN ${sql}`, params);
    console.log(`${name}:\n${plan.map((row) => `  ${row.detail}`).join('\n')}`);
  };
  const params = hikeSuggestionParams('introuvable');
  await printPlan('Joined search', joinedSearch, params);
  await printPlan('Optimized search', hikeSuggestionsSql, params);
  await printPlan(
    'Favorite key lookup',
    'SELECT EXISTS (SELECT 1 FROM Favorite WHERE userId = ? AND hikeId = ?)',
    ['app-user', 'h-99'],
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.close());
