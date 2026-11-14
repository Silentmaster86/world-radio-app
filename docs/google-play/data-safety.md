# Data Safety — audyt kodu, nie gotowa deklaracja w Play Console

Stan kodu: przygotowanie wydania 1.0.0, 2026-11-14. Kontakt publiczny:
przemyslaw.pietkun@gmail.com. Przed zgłoszeniem porównaj tę listę z końcowym AAB,
wdrożeniem webowym, konfiguracją Netlify i praktykami faktycznych nadawców.
TWA uruchamia aktualny kod strony: zmiana strony może wymagać aktualizacji
deklaracji nawet bez nowego AAB. Brak własnego backendu kont nie oznacza braku
przetwarzania danych poza urządzeniem.

| Przepływ                         | Co rzeczywiście się dzieje                                                                                                                                                           | Kod / dowód                                                        | Wniosek do sprawdzenia w formularzu                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Biblioteka i preferencje         | Ulubione, kolejność, ostatnie stacje, dodane stacje, język, motyw, głośność i wybór odtwarzacza pozostają w localStorage. Timer w pamięci.                                           | `src/lib/*Storage.js`, `playerPreferences.js`, `sleepTimer.js`     | Samo lokalne przetwarzanie bez wysłania poza urządzenie nie jest deklarowaną zbiórką według definicji Play.                                                                               |
| Wyszukiwanie                     | Nazwa, filtr kraju i strona wyników trafiają do funkcji Netlify, potem do Radio Browser. Oryginalny URL żądania może znaleźć się w logach hostingu.                                  | `src/pages/Discover.jsx`, `netlify/functions/radio-directory.mjs`  | Oceń „App activity → In-app search history”, cel funkcjonalny, opcjonalność użycia wyszukiwania oraz retencję. Nie zakładaj przetwarzania wyłącznie w pamięci bez potwierdzenia dostawcy. |
| Uruchomienia stacji katalogowych | Po zdarzeniu playing wysyłany jest UUID stacji przez funkcję Netlify do endpointu kliknięć Radio Browser. Nie ma osobnego opt-out. Nie jest przesyłana pełna lokalna historia.       | `src/components/DirectoryClickReporter.jsx`, funkcja katalogu      | Oceń „App activity → App interactions” i cel statystyk/analityki. Brak konta lub własnego identyfikatora nie dowodzi nieodwracalnej anonimowości żądania.                                 |
| Strona i funkcje                 | Dostawca hostingu widzi IP, user agent, ścieżki i czasy żądań. Funkcja nie dodaje własnego logowania ani nie przekazuje celowo klientowskiego IP we własnych nagłówkach do katalogu. | Netlify + funkcja                                                  | Zweryfikuj ustawienia logów, retencję, uprawnienia administratora i umowę powierzenia. Nie zakładaj, że wszystkie te dane są efemeryczne.                                                 |
| Streamy                          | Przeglądarka łączy się bezpośrednio z nadawcą/CDN, także dla playlist/segmentów HLS. Dostawcy widzą IP i dane techniczne oraz mogą przekierować stream.                              | `src/lib/audioPlayer.js`, `hlsPlayback.js`, `src/data/stations.js` | Ustal niezależne wykorzystanie, ewentualne ID, lokalizację wywodzoną z IP i reklamę po stronie dostawców. Sam brak uprawnienia lokalizacji nie rozstrzyga danych pochodnych.              |
| Kopia biblioteki                 | Eksport do pliku i import wybranego pliku odbywają się lokalnie.                                                                                                                     | `src/lib/libraryBackup.js`, `BackupPanel.jsx`                      | Nie deklaruj uploadu biblioteki, którego kod nie wykonuje. Plik eksportu usuwa użytkownik.                                                                                                |
| Udostępnianie                    | Link do stacji trafia do schowka lub do aplikacji wybranej w systemowym udostępnianiu.                                                                                               | `src/lib/stationLinks.js`                                          | Sprawdź wyjątek transferu zainicjowanego przez użytkownika i faktyczną zawartość linku.                                                                                                   |
| Kontakt e-mail                   | Kontakt odbywa się poza interfejsem aplikacji; operator odpowiada przez Gmail.                                                                                                       | Link mailto w polityce                                             | Rozróżnij dobrowolną korespondencję poza aplikacją od danych zbieranych automatycznie w niej. Ustal rzeczywistą retencję korespondencji.                                                  |

## Ustalone w kodzie

- Nie ma logowania, kont, płatności, reklamowego SDK, zewnętrznego SDK analitycznego
  ani automatycznego SDK raportowania awarii.
- Wrapper nie prosi o mikrofon, kontakty ani lokalizację Androida. Skrypt sprawdza
  uprawnienia faktycznego manifestu AAB, a nie tylko pliku źródłowego.
- Oryginalne requesty do aplikacji i dostawców są szyfrowane HTTPS; wspierane
  streamy/HLS są walidowane pod HTTPS. Nie jest to dowód całego późniejszego
  przetwarzania po stronie niezależnego odbiorcy ani zgodności jego polityki.
- Brak systemu kont oznacza brak procesu usuwania konta aplikacji, ale nie brak
  obowiązków dotyczących pozostałych danych. Bibliotekę usuwa się lokalnie.
- Formularz obejmuje także usługi/dane z kodu webowego kontrolowanego przez
  operatora; nie pomijaj go tylko dlatego, że opakowanie Android jest niewielkie.

## Przed wysłaniem deklaracji

1. Sprawdź realne żądania i przekierowania na paczce z Google Play, co najmniej
   wyszukiwanie, stację katalogową oraz dwa różne streamy. Nie da się zapewnić
   jednakowej polityki wszystkim stacjom z dynamicznego katalogu.
2. Ustal z dostawcami/ustawieniami hostingu retencję i dalsze wykorzystanie.
   Cel funkcjonalny nie oznacza automatycznie braku zbiórki, a usługa zewnętrzna
   nie jest automatycznie procesorem działającym wyłącznie na Twoje polecenie.
3. Dla każdego typu danych określ zbiórkę, udostępnianie, cel, wymagane/opcjonalne
   oraz efemeryczne przetwarzanie według aktualnych definicji Google. Nie wybieraj
   zbiorczo „nie zbieramy i nie udostępniamy danych” na podstawie tego audytu.
4. Potwierdź treść i kontakt [polityki](../../public/privacy/index.html), działający
   publiczny URL bez logowania oraz link w aplikacji. Operator powinien sprawdzić
   opisane praktyki, podstawy przetwarzania i obowiązki właściwe dla swojej sytuacji.
5. Wpis Data Safety nie zastępuje osobnej deklaracji reklam, oceny treści ani
   ustalenia praw do transmisji/logotypów. Stream może zawierać reklamę nadawcy.

Google wymaga uwzględniania transmisji poza urządzenie i kodu dostawców.
Wyłącznie wewnętrzny tor testowy jest zwolniony z sekcji Data Safety, ale przed
testami zamkniętymi/otwartymi i produkcją trzeba uzupełnić właściwą deklarację.
Źródło: [oficjalne definicje i instrukcja formularza](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
