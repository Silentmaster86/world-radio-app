import { translate } from '../../i18n';
export const en = {
  language:
    'Could not load the imported language. Nothing was imported. Reconnect or import without settings.',
  title: 'Library backup',
  intro:
    'Save your added stations, favorites, recent stations and settings in a JSON file. The file stays on your device.',
  export: 'Download backup',
  file: 'Choose a backup file',
  reading: 'Reading backup…',
  preview: 'Import preview',
  counts: 'New stations: {stations} · New favorites: {favorites} · Recent stations: {recent}',
  merge:
    'Import combines libraries. Existing stations and favorites are kept; recent history keeps up to 20 stations. Playback and Sleep Timer continue.',
  settings: 'Also import language, appearance and volume settings',
  settingsHint:
    'This can change the interface language and playback volume. The current station stays selected.',
  apply: 'Import and combine',
  cancel: 'Cancel preview',
  success: 'Backup imported. Your library is up to date.',
  exported: 'Backup downloaded. Keep the file to restore your library on another device.',
  invalid: 'This is not a valid World Radio App backup. Nothing was imported.',
  version: 'This backup version is not supported. Nothing was imported.',
  size: 'Choose a JSON backup smaller than 1 MB.',
  limit: 'The combined library exceeds 100 added stations. Nothing was imported.',
  newer: 'Your saved data uses a newer format. Import is unavailable in this app version.',
  storage: 'The import could not be saved. Existing saved data was preserved.',
  recovery:
    'Saving failed and some saved data could not be restored. Download your current library before reloading.',
  read: 'The file could not be read. Choose it again.',
  exportError: 'The backup could not be downloaded. Try again.',
  unknown: 'The import failed. Try again.',
};
const pl = {
  language:
    'Nie udało się wczytać importowanego języka. Nic nie zaimportowano. Połącz się z internetem lub importuj bez ustawień.',
  title: 'Kopia biblioteki',
  intro:
    'Zapisz dodane stacje, ulubione, historię i ustawienia w pliku JSON. Plik pozostaje na Twoim urządzeniu.',
  export: 'Pobierz kopię',
  file: 'Wybierz plik kopii',
  reading: 'Wczytywanie kopii…',
  preview: 'Podgląd importu',
  counts: 'Nowe stacje: {stations} · Nowe ulubione: {favorites} · Historia: {recent}',
  merge:
    'Import łączy biblioteki. Zachowuje obecne stacje i ulubione; historia mieści do 20 stacji. Odtwarzanie i wyłącznik czasowy działają dalej.',
  settings: 'Importuj też język, wygląd i ustawienia głośności',
  settingsHint:
    'Może to zmienić język interfejsu i głośność odtwarzania. Obecna stacja pozostanie wybrana.',
  apply: 'Importuj i połącz',
  cancel: 'Anuluj podgląd',
  success: 'Kopia zaimportowana. Biblioteka jest aktualna.',
  exported: 'Kopia pobrana. Zachowaj plik, aby odtworzyć bibliotekę na innym urządzeniu.',
  invalid: 'To nie jest prawidłowa kopia World Radio App. Nic nie zaimportowano.',
  version: 'Ta wersja kopii nie jest obsługiwana. Nic nie zaimportowano.',
  size: 'Wybierz kopię JSON o rozmiarze do 1 MB.',
  limit: 'Połączona biblioteka przekracza limit 100 dodanych stacji. Nic nie zaimportowano.',
  newer: 'Zapisane dane mają nowszy format. Import jest niedostępny w tej wersji aplikacji.',
  storage: 'Nie udało się zapisać importu. Dotychczasowe zapisane dane zostały zachowane.',
  recovery:
    'Zapis nie powiódł się i części danych nie udało się przywrócić. Pobierz obecną bibliotekę przed odświeżeniem strony.',
  read: 'Nie udało się odczytać pliku. Wybierz go ponownie.',
  exportError: 'Nie udało się pobrać kopii. Spróbuj ponownie.',
  unknown: 'Import nie powiódł się. Spróbuj ponownie.',
};
export function backupMessage(language, key, params = {}) {
  const message =
    language === 'pl'
      ? pl[key] || en[key] || en.unknown
      : translate(language, `backup.${key}`, {}, en[key] || en.unknown);
  return message.replace(/\{(\w+)\}/g, (token, key) => String(params[key] ?? token));
}
