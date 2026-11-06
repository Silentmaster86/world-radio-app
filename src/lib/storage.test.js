import { readStorage, writeStorage, removeStorage } from './storage';

const validate = (value) => Array.isArray(value);
afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

test('uses the fallback for a missing key without writing', () => {
  expect(readStorage('favorites', [], validate)).toEqual({
    value: [],
    status: 'ready',
    exists: false,
  });
  expect(localStorage.getItem('favorites')).toBeNull();
});

test.each(['{', '{}', 'null', '42', '"favorites"'])('recovers invalid saved data: %s', (raw) => {
  localStorage.setItem('favorites', raw);
  expect(readStorage('favorites', [], validate)).toEqual({
    value: [],
    status: 'invalid',
    exists: true,
  });
  expect(localStorage.getItem('favorites')).toBe(raw);
});

test('reads valid data', () => {
  localStorage.setItem('favorites', '["capital-dance"]');
  expect(readStorage('favorites', [], validate).value).toEqual(['capital-dance']);
});

test('handles blocked reads and writes without throwing', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Blocked', 'SecurityError');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Full', 'QuotaExceededError');
  });
  expect(readStorage('favorites', [], validate).status).toBe('unavailable');
  expect(writeStorage('favorites', [])).toBe(false);
});

test('handles a blocked localStorage property', () => {
  jest.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('Blocked', 'SecurityError');
  });
  expect(readStorage('favorites', [], validate).status).toBe('unavailable');
  expect(writeStorage('favorites', [])).toBe(false);
  expect(removeStorage('favorites')).toBe(false);
});

test('removes only the requested key and handles a failed removal', () => {
  localStorage.setItem('favorites', '[]');
  localStorage.setItem('unrelated', 'keep');
  expect(removeStorage('favorites')).toBe(true);
  expect(localStorage.getItem('unrelated')).toBe('keep');
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  expect(removeStorage('unrelated')).toBe(false);
});
