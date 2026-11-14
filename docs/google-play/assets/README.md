# Materiały graficzne

- `icon-512.png`: 512 × 512, RGBA PNG, z istniejącej ikony aplikacji.
- `en-US/feature-1024x500.png`, `pl-PL/feature-1024x500.png`: 1024 × 500,
  grafika marki z hasłem w odpowiednim języku. Bez ocen, rankingów i badge'y sklepu.
- `*/phone-01-library-light.png`: główna lista stacji, motyw jasny.
- `*/phone-02-favorites-dark.png`: dwie stacje faktycznie dodane do ulubionych,
  motyw ciemny.
- `*/phone-03-player-dark.png`: pełny odtwarzacz w stanie wstrzymanym.
- `*/phone-04-help-light.png`: pomoc i FAQ z instrukcją przenoszenia biblioteki.

Zrzuty mają 1080 × 1920, po cztery na język. Nie zmieniano treści ekranu ani
nie symulowano odtwarzania. Źródłem jest rzeczywisty build aplikacji webowej
z gałęzi przygotowania Google Play, renderowany w Chromium przy viewport
360 × 640 i skali 3. Dane wyborów i ulubione powstają przez prawdziwy interfejs.
`capture-info.json` zapisuje parametry i commit bazowy użyty do wykonania zrzutów.

To materiały do oceny wpisu, **nie dowód testów na Androidzie**. Nie przedstawiają
interfejsu Google Play ani systemowego paska Androida. Przed publikacją porównaj
je z pakietem z Play i po konfiguracji Digital Asset Links wykonaj finalne
zrzuty na telefonie, jeśli widok lub elementy przeglądarki się różnią.
Logotypy stacji pozostają własnością nadawców; ich obecność nie dowodzi zgody
na wykorzystanie w reklamie. Potwierdź prawa przed użyciem materiałów w sklepie.

Odtworzenie po `npm run build` (z tymi samymi narzędziami Playwright co CI):

```sh
NODE_PATH=/path/to/browser-tools/node_modules PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers node scripts/capture-play-store.cjs
```

Nie wymaga kluczy Androida, konta Play ani mockowania strumieni. Regeneracja
nadpisuje wyłącznie materiały w tym katalogu.
