import type { HikeSuggestionDto } from '../DTO/hike.dto';

const LIMIT = 8;
const MIN_FUZZY_WORD_LENGTH = 4;
const folds: Record<string, string> = { ς: 'σ', ß: 'ss', œ: 'oe', æ: 'ae' };

// Read only suggestion columns. Keep the bootstrap's (title, rowid) tie order.
const catalogSql = `
  SELECT hike.id, hike.title, hike.categoryId, category.name AS categoryName,
         hike.stateId, state.name AS stateName
  FROM Hike AS hike
  JOIN Category AS category ON category.id = hike.categoryId
  JOIN State AS state ON state.id = hike.stateId
  ORDER BY hike.title, hike.rowid`;

// data_version sees other connections, total_changes sees this TypeORM connection.
// Both are cheap counters on the existing SQLite driver, not schema changes.
const revisionSql = `
  SELECT data_version || ':' || total_changes() AS revision FROM pragma_data_version`;

type Select = <T>(sql: string) => Promise<T[]>;

type Label = { text: string; words?: string[] };
type Entry = {
  row: HikeSuggestionDto;
  title: Label;
  category: Label;
  state: Label;
};

function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[ςßœæ]/g, (char) => folds[char]);
}

async function readCatalog(select: Select): Promise<Entry[]> {
  const rows = await select<HikeSuggestionDto>(catalogSql);
  const labels = new Map<string, Label>();
  function label(raw: string): Label {
    let prepared = labels.get(raw);
    if (!prepared) {
      prepared = { text: normalize(raw) };
      labels.set(raw, prepared);
    }
    return prepared;
  }
  return rows.map((row) => ({
    row,
    title: label(row.title),
    category: label(row.categoryName),
    state: label(row.stateName),
  }));
}

// The hot path uses BMP strings. Supplementary letters must be treated as
// single code points (including when swapping two adjacent letters).
const highSurrogate = /[\uD800-\uDBFF]/;

function oneEdit(a: string, b: string): boolean {
  if (highSurrogate.test(a) || highSurrogate.test(b)) {
    return oneEditUnits(Array.from(a), Array.from(b));
  }
  return oneEditUnits(a, b);
}

// At the first mismatch, there is just one possible insertion/deletion, or
// one substitution/adjacent swap. Verify the untouched suffix; no DP matrix.
function oneEditUnits(a: string | string[], b: string | string[]): boolean {
  if (a.length > b.length) [a, b] = [b, a];
  if (b.length - a.length > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;

  if (a.length !== b.length) {
    for (; i < a.length; i++) if (a[i] !== b[i + 1]) return false;
    return true;
  }
  if (i === a.length) return false;
  i += a[i] === b[i + 1] && a[i + 1] === b[i] ? 2 : 1;
  for (; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const wordsIn = /[\p{L}\p{N}]+/gu;
const lettersOnly = /^\p{L}+$/u;
// Allow internal apostrophes and hyphens only as fuzzy word separators.
// Literal matching above the fuzzy rank still compares the full text.
const fuzzyTerm = /^[\p{L}\p{N}]+(?:(?:\s+|['’\u2010\u2011-])[\p{L}\p{N}]+)*$/u;

type Needle = {
  words: { word: string; allowEdit: boolean }[];
  anchors?: [string, string, string];
};

function fuzzyWords(term: string): Needle | undefined {
  if (!fuzzyTerm.test(term)) return;
  let longest: string[] = [];
  const tokens: string[] = term.match(wordsIn) ?? [];
  const words = tokens.map((word) => {
    const chars = Array.from(word);
    const allowEdit =
      chars.length >= MIN_FUZZY_WORD_LENGTH && lettersOnly.test(word);
    if (allowEdit && chars.length > longest.length) longest = chars;
    return { word, allowEdit };
  });
  if (!longest.length) return;
  // One edit, including a swap across a split, can damage at most two
  // disjoint chunks. For longer terms, require any one exact anchor before
  // tokenizing a label or testing its words. Keep spans >= 2 code points.
  const size = Math.floor(longest.length / 3);
  if (size < 2) return { words };
  return {
    words,
    anchors: [
      longest.slice(0, size).join(''),
      longest.slice(size, 2 * size).join(''),
      longest.slice(2 * size).join(''),
    ],
  };
}

// Compare whole words or consecutive words, with at most one typo in the
// entire phrase. Never approximate short words, numeric IDs or punctuation.
function matchesFuzzy(label: Label, { words: term, anchors }: Needle): boolean {
  if (
    anchors &&
    !label.text.includes(anchors[0]) &&
    !label.text.includes(anchors[1]) &&
    !label.text.includes(anchors[2])
  ) {
    return false;
  }
  const words = (label.words ??= label.text.match(wordsIn) ?? []);
  for (let start = 0; start <= words.length - term.length; start++) {
    let edited = false;
    let i = 0;
    for (; i < term.length; i++) {
      const { word, allowEdit } = term[i];
      const candidate = words[start + i];
      if (word === candidate) continue;
      if (
        edited ||
        !allowEdit ||
        !oneEdit(word, candidate) ||
        !lettersOnly.test(candidate)
      )
        break;
      edited = true;
    }
    if (i === term.length && edited) return true;
  }
  return false;
}

function rank(catalog: Entry[], term: string): HikeSuggestionDto[] {
  const exact: HikeSuggestionDto[] = [];
  const contains: HikeSuggestionDto[] = [];
  for (const { row, title, category, state } of catalog) {
    if (title.text === term || category.text === term || state.text === term) {
      exact.push(row);
      if (exact.length === LIMIT) return exact;
    } else if (
      contains.length < LIMIT &&
      (title.text.includes(term) ||
        category.text.includes(term) ||
        state.text.includes(term))
    ) {
      contains.push(row);
    }
  }
  const results = exact.concat(contains).slice(0, LIMIT);
  if (results.length === LIMIT) return results;

  const needle = fuzzyWords(term);
  if (!needle) return results;

  const seen = new Set(results);
  const sharedLabels = new Map<Label, boolean>();
  function matchesShared(label: Label): boolean {
    const cached = sharedLabels.get(label);
    if (cached !== undefined) return cached;
    const match = matchesFuzzy(label, needle);
    sharedLabels.set(label, match);
    return match;
  }
  // One more linear pass at most. Label tokenization lives with the catalog;
  // shared categories/states are compared once per term, and we stop at eight.
  for (const { row, title, category, state } of catalog) {
    if (
      !seen.has(row) &&
      (matchesShared(category) ||
        matchesShared(state) ||
        matchesFuzzy(title, needle))
    ) {
      results.push(row);
      if (results.length === LIMIT) break;
    }
  }
  return results;
}

export class HikeSuggestions {
  private snapshot?: { revision: string; catalog: Promise<Entry[]> };

  constructor(
    private readonly select: Select,
    private readonly isTransactionActive: () => boolean = () => false,
  ) {}

  async find(query: string): Promise<HikeSuggestionDto[]> {
    const term = normalize(query.trim()).trim();
    if (Array.from(term).length < 2) return [];

    const [{ revision }] = await this.select<{ revision: string }>(revisionSql);
    // TypeORM SQLite shares one connection. A SELECT during a write transaction
    // can see uncommitted data; never retain that view after a rollback.
    if (this.isTransactionActive())
      return rank(await readCatalog(this.select), term);
    if (this.snapshot?.revision !== revision) {
      // Coalesce concurrent cold requests for the same revision. No per-query
      // cache or persistent index; a write makes the next read reload labels.
      const snapshot = { revision, catalog: readCatalog(this.select) };
      this.snapshot = snapshot;
      void snapshot.catalog.catch(() => {
        if (this.snapshot === snapshot) this.snapshot = undefined;
      });
    }
    return rank(await this.snapshot.catalog, term);
  }
}
