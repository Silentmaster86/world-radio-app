# Google Play — przygotowanie World Radio App

Wydawca: **Silentmaster Apps**. Kontakt publiczny:
**przemyslaw.pietkun@gmail.com**. Pakiet docelowy:
`io.github.silentmaster86.worldradioapp`, wersja `1.0.0`, versionCode `1`.
To osobna tożsamość od działającego APK Preview. Identyfikator trzeba potwierdzić
przy pierwszym przyjętym przesłaniu do Play — później nie można go zmienić dla
tej samej aplikacji. W tym repo nie zweryfikowano jego dostępności w Play Console.

## Gotowe do przeglądu

- [Opisy PL/EN i dane wpisu](listing.json): tytuł, krótki i pełny opis.
- `assets/icon-512.png`: ikona sklepu; te same zasoby marki co w aplikacji.
- `assets/en-US/feature-1024x500.png` i `assets/pl-PL/feature-1024x500.png`:
  grafiki główne w językach sklepu.
- Po cztery zrzuty `assets/<język>/phone-*.png`, 1080 × 1920.
  [Pochodzenie i odtworzenie](assets/README.md).
- [Polityka prywatności PL/EN](../../public/privacy/index.html), dostępna w
  ustawieniach aplikacji. Docelowy URL: `https://worldradioapp.netlify.app/privacy/`.
  Zacznie działać na produkcji dopiero po scaleniu i wdrożeniu zmian.
- [Audyt przepływów i przygotowanie Data Safety](data-safety.md).
- [Budowanie i podpis wydania](../../android/PLAY.md).

Materiały opisują faktyczne funkcje. Nie deklarują gotowej publikacji w Play,
odtwarzania nagrań offline, tłumaczenia audycji ani natywnego Android Auto.

## Po weryfikacji konta — kolejność

1. Utwórz aplikację: World Radio App, aplikacja, bezpłatna, język domyślny en-US.
   Dodaj pl-PL do wpisu i skopiuj odpowiednie pola z `listing.json`.
2. Wybierz kategorię **Muzyka i dźwięk**, wpisz kontakt i stronę aplikacji.
3. Skonfiguruj **Play App Signing**. Utwórz i zachowaj własny klucz przesyłania
   poza repo. Nie wysyłaj klucza ani hasła w rozmowie. Instrukcja podpisu jest
   w `android/PLAY.md`.
4. Zbuduj `npm run play:bundle -- --signed`. W testach wewnętrznych przesyła się
   **WorldRadioApp-upload.aab**, nigdy pliku `unsigned` ani pakietu `.preview`.
5. Z Play Console pobierz publiczny odcisk SHA-256 **certyfikatu podpisywania
   aplikacji**. Wygeneruj `npm run play:assetlinks -- ODCISK`. Przejrzyj wynik
   i dodaj go w osobnej zmianie do `public/.well-known/assetlinks.json`.
   Wdróż na Netlify; endpoint musi zwracać JSON z HTTP 200 bez przekierowania
   i bez treści SPA. Sam certyfikat przesyłania zwykle nie wystarczy.
6. Zainstaluj aplikację przez link testów Google Play. Powtórz
   [test na Androidzie](../../android/TESTING.md), szczególnie tło, Bluetooth,
   timer, pliki i aktualizację. Sprawdź brak paska adresu po weryfikacji domeny.
7. Przed testami zamkniętymi/produkcją przejrzyj politykę oraz Data Safety,
   dostawców i retencję. Sprawdź zrzuty na wersji faktycznie dostarczanej z Play.
   Potwierdź uprawnienia do użycia treści i znaków stacji w aplikacji oraz
   materiałach sklepu — publiczny URL streamu nie jest sam w sobie zgodą nadawcy.
8. Uzupełnij dostęp do aplikacji (brak konta/logowania), ocenę treści, odbiorców,
   reklamę i pozostałe wymagane deklaracje według faktycznego zakresu aplikacji.
   Reklamy nadawców w streamach trzeba uwzględnić przy ocenie pola reklam.
   Nie przyjmuj automatycznie „brak reklam” tylko dlatego, że nie ma reklamowego SDK.
9. Jeżeli Play wymaga testów zamkniętych dla Twojego konta, wykonaj aktualne
   wymagania pokazane w panelu. Testy wewnętrzne ich nie zastępują. Dopiero później
   wnioskuj o dostęp do produkcji i prześlij wydanie do oceny.

## Co nadal czeka na właściciela / Play Console

- Weryfikacja konta, deklaracja przedsiębiorcy i dostęp do panelu.
- Własny stały klucz przesyłania, konfiguracja Play App Signing i publiczny
  certyfikat podpisu aplikacji z Play.
- Weryfikacja domeny i test pakietu dostarczonego przez Google Play.
- Potwierdzenie faktycznych ustawień logowania/retencji u dostawców, formularze
  Data Safety, reklamy/odbiorcy/ocena treści oraz kwestie praw do treści.
- Wymagane testy zamknięte i końcowa ocena Google. Żaden skrypt w repo nie
  publikuje automatycznie i nie gwarantuje akceptacji przez sklep.

Źródła wymagań sprawdzone 2026-11-14:
[materiały sklepu](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en),
[Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en),
[dane użytkownika i polityka](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en),
[podpisywanie aplikacji](https://developer.android.com/studio/publish/app-signing).
