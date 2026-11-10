import {
  BACKUP_LIMIT,
  createBackup,
  parseBackup,
  planImport,
  persistImport,
  withSavedLibrary,
} from './libraryBackup';
import { ADDED_KEY, normalizeDirectoryStation, saveAddedStations } from './addedStations';
import { FAVORITES_KEY } from './favoritesStorage';
import { RECENT_KEY } from './recentStorage';
const added = (index = 1, url = `https://radio.example/${index}.m3u8`) =>
  normalizeDirectoryStation({
    stationuuid: `12345678-1234-1234-1234-${String(index).padStart(12, '0')}`,
    name: `Station ${index}`,
    url,
    hls: 1,
  });
const curated = { id: 'curated', name: 'Curated', url: 'https://radio.example/main' };
const current = () => ({
  catalog: [curated, added()],
  favoriteIds: ['curated'],
  recentIds: ['curated'],
  settings: { language: 'en', theme: 'dark', volume: 0.5, muted: false },
});
const incoming = () =>
  createBackup(
    {
      catalog: [added(2)],
      favoriteIds: [added(2).id, 'temporarily-removed'],
      recentIds: [added(2).id],
      settings: { language: 'pl', theme: 'light', volume: 0.2, muted: true },
    },
    new Date('2026-11-10T00:00:00Z'),
  );
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());
test('export/import round trip retains HLS, stable IDs, dormant favorites and settings', () => {
  const backup = incoming();
  expect(backup.createdAt).toBe('2026-11-10T00:00:00.000Z');
  const parsed = parseBackup('\uFEFF' + JSON.stringify(backup));
  expect(parsed.stations[0]).toEqual(added(2));
  expect(parsed.favoriteIds).toContain('temporarily-removed');
  expect(parsed.settings).toEqual(backup.settings);
  expect(backup).not.toHaveProperty('catalog');
});
test.each(['{}', '[]', '{bad', 'null'])('invalid file %s has no storage effects', (text) => {
  localStorage.setItem('unrelated', 'keep');
  expect(() => parseBackup(text)).toThrow('invalid');
  expect(localStorage.length).toBe(1);
});
test('rejects oversized files and unsupported backup versions', () => {
  expect(() => parseBackup(' '.repeat(BACKUP_LIMIT + 1))).toThrow('size');
  expect(() => parseBackup(JSON.stringify({ ...incoming(), version: 2 }))).toThrow('version');
});
test.each([
  (b) => {
    b.stations[0].url = 'http://radio.example/live';
  },
  (b) => {
    b.stations[0].url = 'javascript:alert(1)';
  },
  (b) => {
    b.stations[0].id = 'wrong';
  },
  (b) => {
    b.stations[0].directoryId = 'invalid';
  },
  (b) => {
    b.stations[0].languageCodes = [{}];
  },
  (b) => {
    b.stations[0].name = '';
  },
  (b) => {
    b.favoriteIds = [{}];
  },
  (b) => {
    b.settings.volume = 2;
  },
  (b) => {
    b.settings.muted = 'true';
  },
  (b) => {
    b.settings.theme = 'invalid';
  },
])('rejects malformed payload without partial acceptance (%#)', (mutate) => {
  const backup = incoming();
  mutate(backup);
  expect(() => parseBackup(JSON.stringify(backup))).toThrow('invalid');
});
test('combines libraries idempotently and remaps duplicate URL identities', () => {
  const backup = incoming();
  backup.stations.push(added(3, curated.url));
  backup.favoriteIds.push(added(3).id);
  backup.recentIds.push(added(3).id);
  const plan = planImport(backup, current());
  expect(plan.counts).toEqual({ stations: 1, favorites: 2, recent: 1 });
  expect(plan.favoriteIds).toEqual(['curated', added(2).id, 'temporarily-removed']);
  expect(plan.recentIds).toEqual(['curated', added(2).id]);
  expect(
    planImport(backup, {
      ...current(),
      catalog: [curated, ...plan.stations],
      favoriteIds: plan.favoriteIds,
      recentIds: plan.recentIds,
    }).counts,
  ).toEqual({ stations: 0, favorites: 0, recent: 0 });
});
test('same ID with a changed URL keeps the existing endpoint', () => {
  const backup = incoming();
  backup.stations = [added(1, 'https://radio.example/changed')];
  const plan = planImport(backup, current());
  expect(plan.stations).toEqual([added()]);
});
test('refuses a combined catalog above 100 without truncation', () => {
  const full = {
    ...current(),
    catalog: [curated, ...Array.from({ length: 100 }, (_, i) => added(i + 10))],
  };
  expect(() => planImport(incoming(), full)).toThrow('limit');
});
test('keeps current history first and applies the existing 20-station cap', () => {
  const old = { ...current(), recentIds: Array.from({ length: 20 }, (_, i) => `old-${i}`) };
  expect(planImport(incoming(), old).recentIds).toEqual(old.recentIds);
});
test('merges changes saved by another tab before confirmation', () => {
  saveAddedStations([added(7)]);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, stationIds: ['other-tab'] }));
  const plan = planImport(incoming(), withSavedLibrary(current()));
  expect(plan.stations.map((s) => s.id)).toContain(added(7).id);
  expect(plan.favoriteIds).toContain('other-tab');
});
test('import keeps player/language/theme settings unless explicitly selected', () => {
  localStorage.setItem('wra:language:v1', '{"version":1,"language":"en"}');
  localStorage.setItem('wra:player:v1', 'keep');
  const plan = planImport(incoming(), current());
  persistImport(plan);
  expect(localStorage.getItem('wra:language:v1')).toContain('en');
  expect(localStorage.getItem('wra:player:v1')).toBe('keep');
  persistImport(plan, { includeSettings: true, stationId: 'curated' });
  expect(JSON.parse(localStorage.getItem('wra:language:v1')).language).toBe('pl');
  expect(JSON.parse(localStorage.getItem('wra:player:v1'))).toEqual({
    version: 1,
    stationId: 'curated',
    volume: 0.2,
    muted: true,
  });
});
test.each([ADDED_KEY, FAVORITES_KEY, RECENT_KEY])(
  'protects future-schema storage at %s before writing anything',
  (key) => {
    localStorage.setItem(key, '{"version":9,"keep":true}');
    const before = { ...localStorage };
    expect(() => persistImport(planImport(incoming(), current()))).toThrow('newer');
    expect({ ...localStorage }).toEqual(before);
  },
);
test('failed write rolls back previous keys including originally absent keys', () => {
  localStorage.setItem(FAVORITES_KEY, '{"version":1,"stationIds":["keep"]}');
  const before = { ...localStorage };
  const original = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key === RECENT_KEY) throw Error('quota');
    return original.call(this, key, value);
  });
  expect(() => persistImport(planImport(incoming(), current()))).toThrow('storage');
  expect({ ...localStorage }).toEqual(before);
});
test('reports rollback failure distinctly instead of claiming no changes', () => {
  const fake = {
    getItem: () => null,
    setItem: jest.fn((key) => {
      if (key === FAVORITES_KEY) throw Error('blocked');
    }),
    removeItem: () => {
      throw Error('blocked');
    },
  };
  expect(() => persistImport(planImport(incoming(), current()), {}, fake)).toThrow('recovery');
});
test('blocked storage access is reported before any state updates', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw Error('blocked');
  });
  expect(() => persistImport(planImport(incoming(), current()))).toThrow('storage');
});

test('a future settings schema is preserved unless settings import is explicitly requested', () => {
  const raw = '{"version":3,"preserve":true}';
  localStorage.setItem('wra:theme:v1', raw);
  const plan = planImport(incoming(), current());
  persistImport(plan);
  expect(localStorage.getItem('wra:theme:v1')).toBe(raw);
  const before = { ...localStorage };
  expect(() => persistImport(plan, { includeSettings: true, stationId: 'curated' })).toThrow(
    'newer',
  );
  expect({ ...localStorage }).toEqual(before);
});
