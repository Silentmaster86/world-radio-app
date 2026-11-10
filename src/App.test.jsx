import { StationsProvider } from './context/StationsContext';
import { act } from 'react';
import { ThemeProvider } from 'styled-components';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AudioProvider } from './context/AudioContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeProviderToggle, useTheme } from './context/ThemeContext';
import { stations } from './data/stations';
import { STATION_PAGE_SIZE } from './hooks/useStationFilters';
import { FAVORITES_KEY } from './lib/favoritesStorage';
import { RECENT_KEY } from './lib/recentStorage';
import { render } from './test/render';
import { FakeAudio } from './test/FakeAudio';
import { LanguageProvider } from './context/LanguageContext';
import { LANGUAGE_KEY } from './i18n';

function ThemedApp() {
  const { theme } = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}

function mount() {
  return render(
    <ErrorBoundary>
      <LanguageProvider>
        <StationsProvider>
          <FavoritesProvider>
            <AudioProvider>
              <ThemeProviderToggle>
                <ThemedApp />
              </ThemeProviderToggle>
            </AudioProvider>
          </FavoritesProvider>
        </StationsProvider>
      </LanguageProvider>
    </ErrorBoundary>,
  );
}

beforeEach(() => {
  window.history.scrollRestoration = 'auto';
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.scrollY = 0;
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  jest.spyOn(window, 'Audio').mockImplementation(() => new FakeAudio());
});
afterEach(() => jest.restoreAllMocks());

test('compact catalog preserves audio, navigation, reload and current search results', async () => {
  window.history.replaceState({}, '', '/?campaign=demo');
  let page = mount();
  expect(page.container.querySelectorAll('article')).toHaveLength(stations.length);
  expect(stations).toHaveLength(12);
  expect(page.container.textContent).not.toContain('Show more stations');
  const audio = window.Audio.mock.results[0].value;
  expect(audio.play).not.toHaveBeenCalled();
  await act(async () =>
    page.container.querySelector('[data-station-id="deutschlandfunk-nova"]').click(),
  );
  page.click('[aria-label="Add Deutschlandfunk Nova to favorites"]');
  expect(JSON.parse(localStorage.getItem(RECENT_KEY)).stationIds[0]).toBe('deutschlandfunk-nova');
  const pauses = audio.pause.mock.calls.length;
  page.click('#open-player');
  page.click('[aria-label="Back to stations"]');
  expect(page.container.querySelectorAll('article')).toHaveLength(stations.length);
  expect(window.location.search).toBe('?campaign=demo');
  expect(audio.pause).toHaveBeenCalledTimes(pauses);
  expect(window.Audio).toHaveBeenCalledTimes(1);
  page.unmount();
  page = mount();
  expect(page.container.querySelectorAll('article')).toHaveLength(stations.length);
  expect(window.Audio.mock.results[1].value.play).not.toHaveBeenCalled();
  expect(
    page.container.querySelector('[aria-label="Remove Deutschlandfunk Nova from favorites"]'),
  ).not.toBeNull();
  const search = page.container.querySelector('#station-search');
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
      search,
      'culture deutschlandfunk',
    );
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(window.location.search).toContain('campaign=demo');
  expect(page.container.querySelectorAll('article')).toHaveLength(1);
  expect(page.container.querySelector('[data-station-title]').textContent).toBe(
    'Deutschlandfunk Kultur',
  );
});

test('removed stations disappear from collections without erasing saved IDs', () => {
  const removedId = 'somafm-groove-salad';
  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify({ version: 1, stationIds: [removedId, 'pr-chicago'] }),
  );
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify({ version: 1, stationIds: [removedId, 'pr-chicago'] }),
  );
  const page = mount();
  act(() =>
    [...page.container.querySelectorAll('button')]
      .find((button) => button.textContent.startsWith('Favorites ('))
      .click(),
  );
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((item) => item.textContent),
  ).toEqual(['PR Chicago']);
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)).stationIds).toContain(removedId);
  page.click('#recent-collection');
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((item) => item.textContent),
  ).toEqual(['PR Chicago']);
  expect(JSON.parse(localStorage.getItem(RECENT_KEY)).stationIds).toContain(removedId);
});

test('switching to Polish changes the UI without restarting radio or clearing favorites', async () => {
  const page = mount();
  await act(async () => page.container.querySelector('[data-station-id="pr-chicago"]').click());
  page.click('[aria-label="Add PR Chicago to favorites"]');
  const audio = window.Audio.mock.results[0].value;
  const playCount = audio.play.mock.calls.length;
  page.click('#open-settings');
  const language = page.container.querySelector('#language');
  act(() => {
    language.value = 'pl';
    language.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(document.documentElement.lang).toBe('pl');
  expect(page.container.textContent).toContain('Wszystkie stacje (12)');
  expect(page.container.textContent).toContain('Szukaj stacji');
  expect(
    page.container.querySelector('[aria-label="Usuń PR Chicago z ulubionych"]'),
  ).not.toBeNull();
  expect(window.Audio).toHaveBeenCalledTimes(1);
  expect(audio.play).toHaveBeenCalledTimes(playCount);
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)).stationIds).toContain('pr-chicago');
  expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY))).toEqual({
    version: 1,
    language: 'pl',
  });
  act(() => {
    language.value = 'en';
    language.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(document.documentElement.lang).toBe('en');
  expect(page.container.textContent).toContain('All stations (12)');
});

test('the full app migrates old favorites and plays current catalog data', async () => {
  localStorage.setItem('favorites', '[{"name":"Heart UK","url":"https://old.example/removed"}]');
  const page = mount();
  expect(page.container.querySelectorAll('[data-station-title]').length).toBe(
    Math.min(STATION_PAGE_SIZE, stations.length),
  );
  expect(
    page.container.querySelector('[aria-label="Remove Heart UK from favorites"]').textContent,
  ).toBe('♥');
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)).stationIds).toEqual(['heart-uk']);
  const favoriteFilter = [...page.container.querySelectorAll('button')].find((item) =>
    item.textContent.startsWith('Favorites ('),
  );
  act(() => favoriteFilter.click());
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((item) => item.textContent),
  ).toEqual(['Heart UK']);
  await act(async () => page.container.querySelector('[data-station-id="heart-uk"]').click());
  expect(page.container.querySelector('[aria-label="Radio player"] h2').textContent).toBe(
    'Heart UK',
  );
  expect(window.Audio.mock.results[0].value.src).toBe(
    stations.find((station) => station.id === 'heart-uk').url,
  );
  expect(window.Audio).toHaveBeenCalledTimes(1);
});

test('the full app uses US data for Chicago and keeps a usable catalog after invalid storage', () => {
  localStorage.setItem('favorites', '{');
  const page = mount();
  expect(page.container.querySelector('h1').textContent).toContain('World Radio App');
  expect(page.container.querySelectorAll('[data-station-title]').length).toBe(
    Math.min(STATION_PAGE_SIZE, stations.length),
  );
  const us = page.container.querySelector('#station-country');
  act(() => {
    us.value = 'US';
    us.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((item) => item.textContent),
  ).toEqual(
    stations.filter((station) => station.countryCode === 'US').map((station) => station.name),
  );
  expect(page.container.querySelector('[aria-label="United States"]')).not.toBeNull();
  expect(page.container.querySelector('[role=alert]')).toBeNull();
});

test('recent stations record confirmed playback, survive reload and clear without stopping audio or favorites', async () => {
  let page = mount();
  expect(localStorage.getItem(RECENT_KEY)).toBeNull();
  await act(async () => page.container.querySelector('[data-station-id="heart-uk"]').click());
  await act(async () => page.container.querySelector('[data-station-id="capital-dance"]').click());
  await act(async () => page.container.querySelector('[data-station-id="heart-uk"]').click());
  page.click('#recent-collection');
  expect(window.location.search).toContain('section=recent');
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((s) => s.textContent),
  ).toEqual(['Heart UK', 'Capital Dance']);
  const firstAudio = window.Audio.mock.results[0].value;
  const firstPauses = firstAudio.pause.mock.calls.length;
  page.click('#open-player');
  page.click('[aria-label="Back to stations"]');
  expect(window.location.search).toContain('section=recent');
  expect(firstAudio.pause).toHaveBeenCalledTimes(firstPauses);
  expect(window.Audio).toHaveBeenCalledTimes(1);
  page.unmount();
  page = mount();
  const audio = window.Audio.mock.results[1].value;
  expect(audio.play).not.toHaveBeenCalled();
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((s) => s.textContent),
  ).toEqual(['Heart UK', 'Capital Dance']);
  page.click('[aria-label="Add Heart UK to favorites"]');
  await act(async () => page.container.querySelector('[data-station-id="heart-uk"]').click());
  const pauses = audio.pause.mock.calls.length;
  act(() =>
    [...page.container.querySelectorAll('button')]
      .find((b) => b.textContent === 'Clear history')
      .click(),
  );
  expect(page.container.textContent).toContain('No recent stations to show');
  expect(document.activeElement.id).toBe('recent-collection');
  expect(audio.pause).toHaveBeenCalledTimes(pauses);
  expect(
    page.container.querySelector('[data-player-status]').getAttribute('data-player-status'),
  ).toBe('playing');
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)).stationIds).toContain('heart-uk');
  act(() => audio.emit('waiting', { readyState: 1 }));
  act(() => audio.emit('playing', { paused: false, readyState: 4 }));
  expect(JSON.parse(localStorage.getItem(RECENT_KEY)).stationIds).toEqual([]);
  expect(window.Audio).toHaveBeenCalledTimes(2);
});

test('a failed start stays out of recent stations', async () => {
  const page = mount();
  const audio = window.Audio.mock.results[0].value;
  audio.play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
  await act(async () => page.container.querySelector('[aria-label="Play"]').click());
  page.click('#recent-collection');
  expect(page.container.textContent).toContain('No recent stations to show');
  expect(localStorage.getItem(RECENT_KEY)).toBeNull();
});

test('the rendered player reports a failed start, retries and returns to paused', async () => {
  const page = mount();
  const audio = window.Audio.mock.results[0].value;
  expect(page.container.querySelector('[data-player-status]').textContent).toContain(
    'Ready to play',
  );
  audio.play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
  await act(async () => page.container.querySelector('[aria-label="Play"]').click());
  expect(
    page.container.querySelector('[data-player-status]').getAttribute('data-player-status'),
  ).toBe('error');
  expect(page.container.textContent).toContain('Playback was blocked');
  await act(async () =>
    page.container.querySelector('[aria-label="Retry current station"]').click(),
  );
  expect(
    page.container.querySelector('[data-player-status]').getAttribute('data-player-status'),
  ).toBe('playing');
  page.click('[aria-label="Pause"]');
  expect(page.container.querySelector('[data-player-status]').textContent).toBe('Paused');
});

test('combined URL filters survive reload and reset without removing unrelated parameters', () => {
  window.history.replaceState({}, '', '/?country=GB&genre=News&language=pl&q=prl&campaign=demo');
  let page = mount();
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((item) => item.textContent),
  ).toEqual(['PRL']);
  page.unmount();
  page = mount();
  expect(page.container.querySelector('#station-search').value).toBe('prl');
  const reset = [...page.container.querySelectorAll('button')].find(
    (item) => item.textContent === 'Reset filters',
  );
  act(() => reset.click());
  expect(page.container.querySelectorAll('[data-station-title]')).toHaveLength(
    Math.min(STATION_PAGE_SIZE, stations.length),
  );
  expect(window.location.search).toBe('?campaign=demo');
});

test('empty favorites guide the user to stations; unmatched refinements can be cleared', () => {
  window.history.replaceState({}, '', '/?section=favorites');
  const page = mount();
  expect(page.container.textContent).toContain('Your favorites start here');
  act(() =>
    [...page.container.querySelectorAll('button')]
      .find((item) => item.textContent === 'Browse all stations')
      .click(),
  );
  expect(page.container.querySelectorAll('[data-station-title]')).toHaveLength(
    Math.min(STATION_PAGE_SIZE, stations.length),
  );
  const country = page.container.querySelector('#station-country');
  const genre = page.container.querySelector('#station-genre');
  act(() => {
    country.value = 'US';
    country.dispatchEvent(new Event('change', { bubbles: true }));
  });
  act(() => {
    genre.value = 'Pop';
    genre.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(page.container.textContent).toContain('No matching stations');
  act(() =>
    [...page.container.querySelectorAll('button')]
      .find((item) => item.textContent === 'Clear search and filters')
      .click(),
  );
  expect(page.container.querySelectorAll('[data-station-title]')).toHaveLength(
    Math.min(STATION_PAGE_SIZE, stations.length),
  );
});

test('the shared player survives route changes and restores the list, scroll and keyboard focus', async () => {
  window.history.replaceState({}, '', '/?country=GB&genre=News');
  const scroll = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.scrollY = 420;
  const page = mount();
  page.click('[aria-controls="station-refinements"]');
  await act(async () => page.container.querySelector('[data-station-id="prl"]').click());
  const audio = window.Audio.mock.results[0].value;
  const pauseCount = audio.pause.mock.calls.length;
  const open = page.container.querySelector('#open-player');
  open.focus();
  page.click('#open-player');
  expect(window.location.pathname).toBe('/now-playing');
  expect(page.container.querySelector('[aria-label="Radio player"]')).toBeNull();
  expect(
    page.container.querySelector('[data-player-status]').getAttribute('data-player-status'),
  ).toBe('playing');
  page.click('[aria-label="Back to stations"]');
  expect(window.location.pathname + window.location.search).toBe('/?country=GB&genre=News');
  expect(
    [...page.container.querySelectorAll('[data-station-title]')].map((item) => item.textContent),
  ).toEqual(['PRL']);
  expect(scroll).toHaveBeenLastCalledWith(0, 420);
  expect(document.activeElement.id).toBe('open-player');
  expect(
    page.container
      .querySelector('[aria-controls="station-refinements"]')
      .getAttribute('aria-expanded'),
  ).toBe('true');
  expect(window.Audio).toHaveBeenCalledTimes(1);
  expect(audio.pause).toHaveBeenCalledTimes(pauseCount);
});

test('direct entry to car mode can return to the catalog without autoplay', () => {
  window.history.replaceState({}, '', '/now-playing');
  const page = mount();
  expect(window.Audio.mock.results[0].value.play).not.toHaveBeenCalled();
  page.click('[aria-label="Back to stations"]');
  expect(page.container.querySelectorAll('[data-station-title]')).toHaveLength(
    Math.min(STATION_PAGE_SIZE, stations.length),
  );
});

test('sleep timer survives navigation to car mode and pauses the same audio element', async () => {
  jest.useFakeTimers();
  const page = mount();
  try {
    await act(async () => page.container.querySelector('[aria-label="Play"]').click());
    const audio = window.Audio.mock.results[0].value;
    page.click('[data-sleep-timer]');
    page.click('[data-sleep-minutes="15"]');
    page.click('#open-player');
    expect(page.container.querySelector('[data-sleep-timer]').getAttribute('aria-pressed')).toBe(
      'true',
    );
    act(() => jest.advanceTimersByTime(15 * 60_000));
    expect(
      page.container.querySelector('[data-player-status]').getAttribute('data-player-status'),
    ).toBe('paused');
    expect(audio.src).toBe('');
    expect(window.Audio).toHaveBeenCalledTimes(1);
  } finally {
    page.unmount();
    jest.useRealTimers();
  }
});

test('rapid edits preserve every filter before the router finishes rendering', () => {
  const page = mount();
  const country = page.container.querySelector('#station-country');
  const genre = page.container.querySelector('#station-genre');
  act(() => {
    country.value = 'US';
    country.dispatchEvent(new Event('change', { bubbles: true }));
    genre.value = 'Pop';
    genre.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const params = new URLSearchParams(window.location.search);
  expect(params.get('country')).toBe('US');
  expect(params.get('genre')).toBe('Pop');
  expect(page.container.textContent).toContain('No matching stations');
});

test('the router owns scroll restoration while mounted and releases it on cleanup', () => {
  const page = mount();
  expect(window.history.scrollRestoration).toBe('manual');
  page.unmount();
  expect(window.history.scrollRestoration).toBe('auto');
});

test('return scrolling recovers when the list height settles after the first layout', () => {
  const callbacks = new Map();
  let nextId = 0;
  let availableScroll = 0;
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = ++nextId;
    callbacks.set(id, callback);
    return id;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => callbacks.delete(id));
  window.scrollTo.mockImplementation((x, y) => {
    window.scrollY = Math.min(y, availableScroll);
  });
  const page = mount();
  window.scrollY = 300;
  page.click('#open-player');
  page.click('[aria-label="Back to stations"]');
  expect(window.scrollY).toBe(0);
  availableScroll = 600;
  for (let frame = 0; frame < 2; frame += 1)
    act(() => {
      const pending = [...callbacks.entries()];
      for (const [id, callback] of pending) {
        callbacks.delete(id);
        callback();
      }
    });
  expect(window.scrollY).toBe(300);
  page.unmount();
  expect(callbacks.size).toBe(0);
});

test('worldwide search adds a station that plays, enters favorites/history and survives reload without autoplay', async () => {
  const previousFetch = global.fetch;
  const row = {
    stationuuid: '12345678-1234-1234-1234-123456789abc',
    name: 'World Jazz',
    countrycode: 'FR',
    url_resolved: 'https://radio.example/live',
    tags: 'jazz',
    languagecodes: 'fre',
  };
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ rows: [row], hasMore: false }) });
  const input = (page, selector, value) =>
    act(() => {
      const node = page.container.querySelector(selector);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true }));
    });
  try {
    window.history.replaceState({}, '', '/discover');
    let page = mount();
    input(page, 'form input', 'jazz');
    await act(async () =>
      page.container
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(page.container.textContent).toContain('World Jazz');
    act(() =>
      [...page.container.querySelectorAll('button')].find((b) => b.textContent === 'Add').click(),
    );
    expect(page.container.querySelector('article button').disabled).toBe(true);
    page.click('a[href="/"]');
    input(page, '#station-search', 'World Jazz');
    expect(page.container.querySelectorAll('article')).toHaveLength(1);
    page.click('[aria-label="Add World Jazz to favorites"]');
    await act(async () =>
      page.container
        .querySelector('[data-station-id="rb-12345678-1234-1234-1234-123456789abc"]')
        .click(),
    );
    expect(JSON.parse(localStorage.getItem(RECENT_KEY)).stationIds[0]).toBe(
      'rb-' + row.stationuuid,
    );
    expect(window.Audio.mock.results[0].value.src).toBe(row.url_resolved);
    expect(window.Audio).toHaveBeenCalledTimes(1);
    page.unmount();
    page = mount();
    expect(
      page.container.querySelector('[aria-label="Remove World Jazz from favorites"]'),
    ).not.toBeNull();
    expect(window.Audio.mock.results[1].value.play).not.toHaveBeenCalled();
    expect(page.container.querySelectorAll('article')).toHaveLength(1);
  } finally {
    global.fetch = previousFetch;
  }
});

test('discovery uses named countries and explains BBC HLS results without hiding them', async () => {
  const previousFetch = global.fetch;
  const rows = [
    {
      stationuuid: '12345678-1234-1234-1234-123456789abc',
      name: 'KISS',
      countrycode: 'GB',
      url_resolved: 'https://radio.example/kiss',
    },
    {
      stationuuid: '22345678-1234-1234-1234-123456789abc',
      name: 'Absolute Radio',
      countrycode: 'GB',
      url_resolved: 'https://radio.example/absolute',
    },
    {
      stationuuid: '32345678-1234-1234-1234-123456789abc',
      name: 'BBC Radio 1',
      countrycode: 'GB',
      url_resolved: 'https://radio.example/radio1.m3u8',
      hls: 1,
    },
  ];
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ rows, hasMore: false }) });
  try {
    window.history.replaceState({}, '', '/discover');
    const page = mount();
    const country = page.container.querySelector('form select');
    expect(country.querySelector('option[value="GB"]').textContent).toBe('United Kingdom');
    act(() => {
      country.value = 'GB';
      country.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () =>
      page.container
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    expect(global.fetch.mock.calls[0][0]).toContain('country=GB');
    expect([...page.container.querySelectorAll('article h2')].map((n) => n.textContent)).toEqual([
      'KISS',
      'Absolute Radio',
      'BBC Radio 1',
    ]);
    expect(page.container.querySelectorAll('article button:disabled')).toHaveLength(1);
    expect(page.container.textContent).toContain('This entry uses a format');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rows: [], hasMore: false }),
    });
    await act(async () =>
      page.container
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    expect(page.container.textContent).toContain('No stations found.');
  } finally {
    global.fetch = previousFetch;
  }
});

test('settings open and close without restarting playback or changing saved stations', async () => {
  const page = mount();
  await act(async () => page.container.querySelector('[data-station-id="heart-uk"]').click());
  const audio = window.Audio.mock.results[0].value;
  const pauses = audio.pause.mock.calls.length;
  page.click('#open-settings');
  const dialog = page.container.querySelector('dialog[open]');
  expect(dialog).not.toBeNull();
  expect(document.activeElement.id).toBe('language');
  page.click('#close-settings');
  expect(dialog.hasAttribute('open')).toBe(false);
  expect(document.activeElement.id).toBe('open-settings');
  expect(audio.pause).toHaveBeenCalledTimes(pauses);
  expect(window.Audio).toHaveBeenCalledTimes(1);
  expect(page.container.querySelector('[data-player-status]').dataset.playerStatus).toBe('playing');
});
