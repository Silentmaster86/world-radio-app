# Publikacja World Radio App na LinkedIn

Pakiet zawiera nowe README, autentyczne zrzuty działającej aplikacji, grafikę
podglądu linku oraz dwie wersje tekstu posta. Wybierz język pasujący do swoich
odbiorców. Teksty są szkicami do publikacji z Twojego profilu.

## Kolejność publikacji

1. Scal PR z README i metadanymi udostępniania. Poczekaj na zakończenie wdrożenia
   Netlify — grafika podglądu musi być dostępna na produkcji.
2. Otwórz [aplikację](https://worldradioapp.netlify.app/) oraz
   [README na GitHubie](https://github.com/Silentmaster86/world-radio-app).
   Sprawdź, czy widzisz nową dokumentację i czy grafika
   [podglądu linku](https://worldradioapp.netlify.app/social/world-radio-preview.jpg)
   otwiera się bez logowania.
3. Wklej adres `https://worldradioapp.netlify.app/` do
   [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
   Użyj Inspect, aby odświeżyć zapisany podgląd. LinkedIn może przechowywać starszy
   opis i obraz; ten krok odświeża je po wdrożeniu.
4. W LinkedIn wybierz **Rozpocznij publikację** i wklej jedną wersję:
   [tekst po polsku](linkedin-pl.md) albo [tekst po angielsku](linkedin-en.md).
   Dopasuj osobiste sformułowania do swojego sposobu pisania.
5. Dołącz grafikę [World Radio App](../../public/social/world-radio-preview.jpg)
   jako pierwszy obraz. Opcjonalnie dodaj
   [jasny widok mobilny](../media/mobile-light.jpg) i
   [pełny odtwarzacz](../media/mobile-player-dark.jpg).
   Przy własnych zdjęciach LinkedIn może pokazać galerię zamiast karty linku.
   Oba adresy w tekście prowadzą do aplikacji i repozytorium.
6. Dodaj tekst alternatywny obrazów, sprawdź podgląd oraz docelowych odbiorców
   i opublikuj z własnego profilu.

Po publikacji warto zebrać zgłoszenia z nazwą stacji, modelem telefonu i przeglądarką — ułatwią odtworzenie
problemów. Błędy można zgłaszać przez
[GitHub Issues](https://github.com/Silentmaster86/world-radio-app/issues).

## Proponowane opisy alternatywne

- **Grafika główna:** World Radio App — aplikacja do radia internetowego.
  Widok desktopowy i mobilny, osiem języków interfejsu, instalacja jako PWA.
- **Widok mobilny:** Jasny motyw aplikacji na telefonie. Zwarta lista stacji,
  wyszukiwarka, ulubione oraz odtwarzacz z aktywnym wyłącznikiem czasowym.
- **Pełny odtwarzacz:** Ciemny motyw z logo Capital Dance, przyciskami odtwarzania,
  regulacją głośności i odliczaniem wyłącznika czasowego.

## Materiały i zakres

Zrzuty w `docs/media/` wykonano na produkcji 11 listopada 2026 podczas prawdziwego
odtwarzania Capital Dance, przy szerokości 1440 px i 390 px. Nie przedstawiają
fikcyjnych danych o utworach ani makiety niedostępnej funkcji. Grafika 1200 × 630
w `public/social/` łączy te rzeczywiste widoki z tytułem aplikacji; jest używana
przez statyczne metadane Open Graph i karty społecznościowe.

Nazwy i logotypy stacji należą do ich nadawców. Pakiet dotyczy aplikacji webowej/PWA;
nie deklaruje publikacji w Google Play, tłumaczenia transmisji ani nagrywania
radia do słuchania offline. Dokładny zakres funkcji opisuje główne README.
