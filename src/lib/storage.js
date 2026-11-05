// Access to localStorage itself can throw, for example when storage is blocked.
export function readStorage(key, fallback, validate) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { value: fallback, status: 'ready', exists: false };
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      return { value: fallback, status: 'invalid', exists: true };
    }
    if (!validate(value)) return { value: fallback, status: 'invalid', exists: true };
    return { value, status: 'ready', exists: true };
  } catch {
    return { value: fallback, status: 'unavailable', exists: false };
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
