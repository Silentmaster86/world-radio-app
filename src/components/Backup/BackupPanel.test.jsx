import { act } from 'react';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '../../darkTheme';
import { render } from '../../test/render';
import { FakeAudio, deferred } from '../../test/FakeAudio';
import { StationsProvider, useStations } from '../../context/StationsContext';
import { FavoritesProvider, useFavorites } from '../../context/FavoritesContext';
import { AudioProvider, useAudio } from '../../context/AudioContext';
import { RecentStationsProvider, useRecentStations } from '../../context/RecentStationsContext';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import { ThemeProviderToggle, useTheme } from '../../context/ThemeContext';
import { normalizeDirectoryStation } from '../../lib/addedStations';
import { createBackup, downloadBackup } from '../../lib/libraryBackup';
import BackupPanel from './BackupPanel';

jest.mock('../../lib/libraryBackup', () => ({
  ...jest.requireActual('../../lib/libraryBackup'),
  downloadBackup: jest.fn(),
}));
let api;
const added = normalizeDirectoryStation({
  stationuuid: '12345678-1234-1234-1234-123456789abc',
  name: 'Imported HLS',
  url: 'https://radio.example/hls.m3u8',
  hls: 1,
});
const payload = () =>
  createBackup({
    catalog: [added],
    favoriteIds: [added.id],
    recentIds: [added.id],
    settings: { language: 'pl', theme: 'light', volume: 0.2, muted: true },
  });
function Harness() {
  api = {
    stations: useStations(),
    favorites: useFavorites(),
    audio: useAudio(),
    recent: useRecentStations(),
    language: useLanguage(),
    theme: useTheme(),
  };
  return <BackupPanel />;
}
function mount() {
  return render(
    <LanguageProvider>
      <StationsProvider>
        <FavoritesProvider>
          <AudioProvider>
            <ThemeProviderToggle>
              <ThemeProvider theme={darkTheme}>
                <RecentStationsProvider>
                  <Harness />
                </RecentStationsProvider>
              </ThemeProvider>
            </ThemeProviderToggle>
          </AudioProvider>
        </FavoritesProvider>
      </StationsProvider>
    </LanguageProvider>,
  );
}
async function choose(
  page,
  value = payload(),
  file = { size: 100, text: async () => JSON.stringify(value) },
) {
  const input = page.container.querySelector('[data-backup-file]');
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('wra:theme:v1', '{"version":1,"mode":"dark"}');
  jest.spyOn(window, 'Audio').mockImplementation(() => new FakeAudio());
});
afterEach(() => jest.restoreAllMocks());
test('file selection and cancellation have no import effects; download uses current state', async () => {
  const page = mount();
  await act(async () => {
    await api.audio.play();
  });
  const before = { ...localStorage };
  await choose(page);
  expect(page.container.querySelector('[data-backup-preview]')).not.toBeNull();
  expect({ ...localStorage }).toEqual(before);
  page.click('[data-backup-cancel]');
  expect(page.container.querySelector('[data-backup-preview]')).toBeNull();
  expect(api.stations.stations.some((s) => s.id === added.id)).toBe(false);
  page.click('[data-backup-export]');
  expect(downloadBackup).toHaveBeenLastCalledWith(
    expect.objectContaining({ app: 'world-radio-app', recentIds: ['capital-dance'] }),
  );
});
test('confirmed merge preserves the audio instance, current source, favorites/history and active timer', async () => {
  const page = mount();
  await act(async () => {
    await api.audio.play();
    api.audio.setSleepTimer(15);
    api.favorites.toggleFavorite('capital-dance');
  });
  const audio = window.Audio.mock.results[0].value,
    source = audio.src,
    deadline = api.audio.sleepTimerDeadline;
  await choose(page);
  page.click('[data-backup-apply]');
  expect(window.Audio).toHaveBeenCalledTimes(1);
  expect(audio.src).toBe(source);
  expect(api.audio.status).toBe('playing');
  expect(api.audio.sleepTimerDeadline).toBe(deadline);
  expect(api.stations.stations.find((s) => s.id === added.id)).toEqual(added);
  expect(api.favorites.favoriteIds).toEqual(['capital-dance', added.id]);
  expect(api.recent.recentIds).toEqual(['capital-dance', added.id]);
  expect(api.language.language).toBe('en');
  expect(api.theme.mode).toBe('dark');
  expect(api.audio.muted).toBe(false);
  expect(JSON.parse(localStorage.getItem('wra:stations:v1')).stations).toEqual([added]);
  expect(document.activeElement).toBe(page.container.querySelector('[data-backup-file]'));
});
test('repeated imports deduplicate and optional settings update without stopping playback', async () => {
  const page = mount();
  await act(async () => {
    await api.audio.play();
    api.audio.setSleepTimer(30);
  });
  const deadline = api.audio.sleepTimerDeadline;
  await choose(page);
  page.click('[data-backup-apply]');
  await choose(page);
  page.click('[data-backup-settings]');
  page.click('[data-backup-apply]');
  expect(api.stations.stations.filter((s) => s.id === added.id)).toHaveLength(1);
  expect(api.favorites.favoriteIds).toEqual([added.id]);
  expect(api.language.language).toBe('pl');
  expect(api.theme.mode).toBe('light');
  expect(api.audio.volume).toBe(0.2);
  expect(api.audio.muted).toBe(true);
  expect(api.audio.status).toBe('playing');
  expect(api.audio.sleepTimerDeadline).toBe(deadline);
  expect(window.Audio).toHaveBeenCalledTimes(1);
  expect(page.container.querySelector('[data-backup-message]').textContent).toContain(
    'zaimportowana',
  );
});
test('failed persistence leaves live contexts and playback unchanged', async () => {
  const page = mount();
  await act(async () => {
    await api.audio.play();
  });
  await choose(page);
  const before = { ...localStorage },
    count = api.stations.stations.length;
  const original = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key === 'wra:recent:v1') throw Error('quota');
    return original.call(this, key, value);
  });
  page.click('[data-backup-apply]');
  expect(page.container.querySelector('[role=alert]').textContent).toContain('preserved');
  expect(api.stations.stations).toHaveLength(count);
  expect(api.audio.status).toBe('playing');
  expect({ ...localStorage }).toEqual(before);
});
test('a newer oversized file cancels a pending read and cannot be overwritten by late completion', async () => {
  const page = mount(),
    pending = deferred();
  await choose(page, null, { size: 100, text: () => pending.promise });
  await choose(page, null, { size: 2 * 1024 * 1024, text: jest.fn() });
  await act(async () => pending.resolve(JSON.stringify(payload())));
  expect(page.container.querySelector('[data-backup-preview]')).toBeNull();
  expect(page.container.textContent).not.toContain('Reading backup');
  expect(page.container.querySelector('[role=alert]').textContent).toContain('1 MB');
});
