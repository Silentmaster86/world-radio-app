# World Radio App — Android Preview

To jest testowy pakiet **Trusted Web Activity (TWA)** uruchamiający
`https://worldradioapp.netlify.app/`. Nazwa w telefonie: **World Radio Preview**.
Identyfikator: `io.github.silentmaster86.worldradioapp.preview`.

## Pobranie i instalacja na telefonie

1. Na GitHubie otwórz **Actions → Android preview** i wybierz udane uruchomienie
   dla tego PR lub gałęzi `main`.
2. W sekcji **Artifacts** pobierz `world-radio-android-preview`. GitHub może
   wymagać zalogowania. Rozpakuj ZIP i skopiuj `WorldRadioPreview.apk` na telefon.
3. Otwórz APK w menedżerze plików Androida. Jeśli system poprosi, zezwól tej
   aplikacji na instalowanie z tego źródła. Po instalacji możesz wyłączyć tę zgodę.
4. Uruchom **World Radio Preview**. Użyj aktualnego Chrome lub innej przeglądarki
   obsługującej TWA. Wybierz stację i rozpocznij odtwarzanie ręcznie.
5. Przejdź [test na urządzeniu](TESTING.md) i zapisz model telefonu, Android,
   przeglądarkę oraz wynik poszczególnych prób.

W katalogu artefaktów są też sumy SHA-256 i `build-info.json`, zawierający
identyfikator pakietu, efektywny SDK, uprawnienia oraz odcisk certyfikatu APK.
Klucze prywatne nie są dołączane. Każde czyste uruchomienie CI tworzy osobny
podpis testowy; aktualizacja starszego APK może wymagać jego odinstalowania.
Przed zmianą instalacji wyeksportuj ważną bibliotekę do JSON.

## Pełny widok TWA i pasek przeglądarki

**Na tym etapie weryfikacja domeny jest oczekująca.** Dopóki domena nie potwierdzi
certyfikatu pakietu, przeglądarka może wyświetlać pasek adresu i uruchamiać stronę
jako Custom Tab. Jest to przewidziany fallback. Samo zbudowanie APK nie potwierdza
tej relacji ani gotowości do Google Play.

`assetlinks-preview.json` w artefakcie zawiera prawdziwy odcisk podpisu **tego
konkretnego APK**, a nie gotowy podpis aplikacji z Google Play. Plik jest
materiałem do sprawdzenia. Ten PR nie publikuje delegacji pakietu testowego na
domenie produkcyjnej. Szczegóły: [weryfikacja i podpisy](SIGNING.md).

Odtwarzanie pozostaje w silniku przeglądarki. Testy tła, blokady ekranu,
Bluetooth i zarządzania baterią muszą być wykonane na prawdziwym telefonie.
Pakiet nie dodaje natywnego Android Auto; „Car Mode” pozostaje widokiem aplikacji.

## Budowanie lokalnie

Wymagane: Node 24, pełny **JDK 21** z `javac`, Android SDK Platform 36,
Build-Tools **36.0.0** i dostęp do repozytoriów Gradle/Google/Maven Central.
Pakiety SDK można zainstalować przez Android Studio → SDK Manager.
Gradle 8.11.1 jest pobierany przez wrapper i sprawdzany sumą SHA-256.

Na Windows można użyć JDK dołączonego do aktualnego Android Studio, jeśli jest to
JDK 21. W PowerShell ustaw ścieżki odpowiednie dla własnej instalacji:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run android:build
```

Linux/macOS, przykładowo po ustawieniu własnych ścieżek:

```sh
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk
npm run android:build
```

Polecenie działa z katalogu głównego repozytorium i nie wymaga instalowania
Bubblewrap. Tworzy lokalny klucz testowy w `android/.local/`, uruchamia lint,
buduje APK oraz niepodpisany bundle, sprawdza faktyczny pakiet/SDK/flagę debug,
uprawnienia, adres strony i podpis gotowego APK. Wyniki zapisuje do
`android/artifacts/`. Te katalogi są ignorowane przez Git.

`WorldRadioPreview-unsigned.aab` to wynik kompilacji **testowej tożsamości**.
Nie jest pakietem produkcyjnym do zgłoszenia w Google Play. Docelowy identyfikator,
podpis wydania, polityka prywatności, formularze Play Console oraz testy zamknięte
pozostają kolejnym etapem.

## Konfiguracja i aktualizacje

- `twa-manifest.json`: źródło identyfikatora, hosta, wersji i kolorów używanych
  przez `app/build.gradle`. Skrypt pilnuje granic wariantu Preview.
- `app/src/main/AndroidManifest.xml`: uruchamianie, filtry linków i delegacja TWA.
- `gradle/wrapper/gradle-wrapper.properties`: przypięta dystrybucja i suma Gradle.
- `scripts/android-preview.cjs`: budowanie i kontrola artefaktów; nie publikuje
  aplikacji, nie wysyła jej do Play i nie instaluje pliku assetlinks na serwerze.
- `.github/workflows/android-preview.yml`: budowanie APK w osobnym zadaniu CI.

Zmiany strony wdrożone na Netlify są widoczne w wrapperze zgodnie z istniejącym
mechanizmem aktualizacji PWA. Zmiana pakietu, ikon lub konfiguracji Androida wymaga
nowego APK. Ikony natywne są zapisanym wynikiem generatora; zmiany ikon PWA trzeba
przenieść również do zasobów Androida. Pochodzenie źródeł: [NOTICE.md](NOTICE.md).
