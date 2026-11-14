import { translate } from '../../i18n';
export const en = {
  language:
    'Could not load the imported language. Nothing was imported. Reconnect or import without settings.',
  title: 'Backup',
  intro:
    'Save your stations, favorites and preferences. Restore your collection later or move it to another device.',
  export: 'Save backup',
  file: 'Choose a backup file',
  reading: 'Reading backup…',
  preview: 'Import preview',
  counts: 'New stations: {stations} · New favorites: {favorites} · Recent stations: {recent}',
  merge:
    'Import combines libraries. Existing stations and favorites are kept; recent history keeps up to 20 stations. Playback and Sleep Timer continue.',
  settings: 'Also import language, appearance and volume settings',
  settingsHint:
    'This can change the interface language and playback volume. The current station stays selected.',
  apply: 'Add from backup',
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
  faqTitle: 'Help and library transfer',
  transferQ: 'How do I move my stations to another device?',
  transfer1:
    'On the old device: Settings → Backup → Save backup. The file is usually saved in Downloads.',
  transfer2:
    'Send that file to yourself by email, cloud storage or Bluetooth. Keep it as a file; you do not need to open or edit it.',
  transfer3:
    'On the new device, open World Radio App in the browser you will use. Go to Settings → Backup and choose the saved file.',
  transfer4:
    'Review the preview and select Add from backup. Existing stations and favorites stay. Tick the settings option only to also copy language, appearance and volume.',
  contentsQ: 'What does a backup contain?',
  contentsA:
    'Added stations, favorites and their order, recent stations, language, appearance and volume. It contains station information, not audio recordings. The background-animation preference stays on each device.',
  recoveryQ: 'Can I recover my library without a backup?',
  recoveryA:
    'Your library is saved in this browser. There is no account or automatic sync. Clearing site data or changing browsers can remove access to it. Save a backup before changing devices.',
  offlineQ: 'Can I listen without internet?',
  offlineA:
    'Radio audio requires internet. After the app has prepared its offline files, your saved library and interface can open offline.',
  unknown: 'The import failed. Try again.',
};
const pl = {
  language:
    'Nie udało się wczytać importowanego języka. Nic nie zaimportowano. Połącz się z internetem lub importuj bez ustawień.',
  title: 'Kopia zapasowa',
  intro:
    'Zachowaj swoje stacje, ulubione i preferencje. Odtwórz kolekcję później lub przenieś ją na inne urządzenie.',
  export: 'Zapisz kopię zapasową',
  file: 'Wybierz plik kopii',
  reading: 'Wczytywanie kopii…',
  preview: 'Podgląd importu',
  counts: 'Nowe stacje: {stations} · Nowe ulubione: {favorites} · Historia: {recent}',
  merge:
    'Import łączy biblioteki. Zachowuje obecne stacje i ulubione; historia mieści do 20 stacji. Odtwarzanie i wyłącznik czasowy działają dalej.',
  settings: 'Importuj też język, wygląd i ustawienia głośności',
  settingsHint:
    'Może to zmienić język interfejsu i głośność odtwarzania. Obecna stacja pozostanie wybrana.',
  apply: 'Dodaj z kopii',
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
  faqTitle: 'Pomoc i przenoszenie biblioteki',
  transferQ: 'Jak przenieść swoje stacje na inne urządzenie?',
  transfer1:
    'Na starym urządzeniu: Ustawienia → Kopia zapasowa → Zapisz kopię zapasową. Plik zwykle trafia do folderu Pobrane.',
  transfer2:
    'Prześlij ten plik sobie e-mailem, przez dysk w chmurze lub Bluetooth. Zachowaj go jako plik — nie musisz go otwierać ani edytować.',
  transfer3:
    'Na nowym urządzeniu otwórz World Radio App w przeglądarce, której będziesz używać. Wejdź w Ustawienia → Kopia zapasowa i wybierz zapisany plik.',
  transfer4:
    'Sprawdź podgląd i wybierz Dodaj z kopii. Obecne stacje i ulubione zostają. Opcję ustawień zaznacz tylko wtedy, gdy chcesz też przenieść język, wygląd i głośność.',
  contentsQ: 'Co zawiera kopia zapasowa?',
  contentsA:
    'Dodane stacje, ulubione i ich kolejność, historię, język, wygląd i głośność. Zawiera informacje o stacjach, a nie nagrania dźwięku. Preferencja animacji tła pozostaje osobna na każdym urządzeniu.',
  recoveryQ: 'Czy odzyskam bibliotekę bez kopii?',
  recoveryA:
    'Biblioteka jest zapisana w tej przeglądarce. Nie ma konta ani automatycznej synchronizacji. Wyczyszczenie danych witryny lub zmiana przeglądarki może usunąć dostęp do niej. Zapisz kopię przed zmianą urządzenia.',
  offlineQ: 'Czy mogę słuchać bez internetu?',
  offlineA:
    'Dźwięk radia wymaga internetu. Po przygotowaniu plików offline zapisaną bibliotekę i interfejs można otwierać bez sieci.',
  unknown: 'Import nie powiódł się. Spróbuj ponownie.',
};
export function backupMessage(language, key, params = {}) {
  const message =
    language === 'pl'
      ? pl[key] || en[key] || en.unknown
      : translate(language, `backup.${key}`, {}, en[key] || en.unknown);
  return message.replace(/\{(\w+)\}/g, (token, key) => String(params[key] ?? token));
}
