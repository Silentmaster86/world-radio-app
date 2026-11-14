# Wydanie Google Play — budowanie i podpis

Wariant docelowy ma nazwę **World Radio App** i identyfikator
`io.github.silentmaster86.worldradioapp`. Konfiguracja wspólna pochodzi z
`twa-manifest.json`, a tożsamość i wersja wydania z `play-config.json`.
`-PworldRadioTarget=play` wybiera ten wariant; domyślny wariant Gradle nadal
buduje **World Radio Preview**. Oba używają wspólnych klas Java, ale mają osobne
identyfikatory instalacji. Nie zmieniamy modelu odtwarzania ani pamięci aplikacji.

## Wymagane narzędzia

Jak dla [Preview](README.md): Node 24, pełny JDK 21, SDK Platform 36 i Build-Tools
36.0.0. Dodatkowo pobierz oficjalny
[bundletool-all-1.18.3.jar](https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar)
poza repozytorium i sprawdź SHA-256:

```text
a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29
```

Skrypt porównuje tę sumę przed uruchomieniem JAR. Ustaw
`WORLD_RADIO_BUNDLETOOL_JAR` na pełną ścieżkę pliku.
Windows: `Get-FileHash -Algorithm SHA256 C:\Tools\bundletool-all-1.18.3.jar`.
Linux: `sha256sum /path/to/bundletool-all-1.18.3.jar`.

## Bez klucza — pełna kompilacja kontrolna

```sh
export WORLD_RADIO_BUNDLETOOL_JAR=/path/to/bundletool-all-1.18.3.jar
npm run play:bundle
```

PowerShell:

```powershell
$env:WORLD_RADIO_BUNDLETOOL_JAR = 'C:\Tools\bundletool-all-1.18.3.jar'
npm run play:bundle
```

Wynik: `android/artifacts/play/unsigned/WorldRadioApp-unsigned.aab`.
**Nie przesyłaj go do Play.** Nie ma podpisu przesyłania. CI buduje właśnie
ten wariant i udostępnia go jako `world-radio-play-unsigned-NOT-FOR-UPLOAD`.

Sprawdzamy lint wydania, strukturę AAB przez `bundletool validate`, efektywny
manifest pakietu (tożsamość, wersja, SDK 36/24, brak debug/testOnly, launcher,
uprawnienia), a także nazwę i origin w skompilowanym APK wydania. Nie jest to
zastępstwo weryfikacji Play Console ani testu na telefonie.

## Własny klucz przesyłania

Po weryfikacji konta skonfiguruj **Play App Signing**. Klucz przesyłania jest
Twoją stałą własnością; Play podpisuje instalowane paczki swoim kluczem
podpisywania aplikacji. Do Digital Asset Links potrzebny będzie publiczny
certyfikat **podpisu aplikacji**, nie tylko certyfikat klucza przesyłania.

Utwórz klucz na własnym komputerze przez Android Studio albo JDK `keytool`.
Przykład wywołania bez haseł w historii terminala (narzędzie zapyta o hasła
i dane certyfikatu):

```sh
keytool -genkeypair -storetype JKS -keystore /secure/path/world-radio-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Zachowaj zaszyfrowaną kopię poza repo i bezpiecznie zapisz hasła.
Nie używaj klucza Preview/debug. Skrypt nie generuje, nie odtwarza i nie wysyła
kluczy produkcyjnych. Nie udostępniaj prywatnego klucza w rozmowie.

Ustaw cztery zmienne wyłącznie dla lokalnego budowania:

| Zmienna                      | Wartość                                               |
| ---------------------------- | ----------------------------------------------------- |
| `WORLD_RADIO_KEYSTORE`       | Pełna, istniejąca ścieżka własnego pliku JKS/keystore |
| `WORLD_RADIO_KEY_ALIAS`      | Alias, np. `upload`                                   |
| `WORLD_RADIO_STORE_PASSWORD` | Hasło magazynu                                        |
| `WORLD_RADIO_KEY_PASSWORD`   | Hasło klucza                                          |

Na PowerShell można wczytać hasła bez wyświetlania i bez wpisywania ich w polecenie:

```powershell
$env:WORLD_RADIO_KEYSTORE = 'C:\PrivateKeys\world-radio-upload.jks'
$env:WORLD_RADIO_KEY_ALIAS = 'upload'
$env:WORLD_RADIO_STORE_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Hasło magazynu' -AsSecureString)).Password
$env:WORLD_RADIO_KEY_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Hasło klucza' -AsSecureString)).Password
try {
    npm run play:bundle -- --signed
} finally {
    Remove-Item Env:WORLD_RADIO_STORE_PASSWORD, Env:WORLD_RADIO_KEY_PASSWORD
}
```

Na Bash użyj `read -rs` do wczytania haseł do tych zmiennych i `export`, a po
budowaniu `unset WORLD_RADIO_STORE_PASSWORD WORLD_RADIO_KEY_PASSWORD`.
Zmienne środowiskowe są przekazywane lokalnym narzędziom — nie zapisuj ich do
śledzonego pliku ani nie wypisuj diagnostycznie całego środowiska.

Wynik podpisany: `android/artifacts/play/signed/WorldRadioApp-upload.aab`.
Skrypt weryfikuje podpis JAR oraz zgodność publicznego certyfikatu AAB z wybranym
kluczem. `build-info.json` i `SHA256SUMS` nie zawierają haseł ani klucza prywatnego.
Podpisany AAB jest kandydatem do przesłania do **testów wewnętrznych**, a nie
potwierdzeniem przyjęcia przez Play ani uprawnieniem do publikacji produkcyjnej.
CI w tym PR nie ma kluczy, sekretów Play ani automatycznego wysyłania.

## Weryfikacja domeny po konfiguracji Play

```sh
npm run play:assetlinks -- FULL_APP_SIGNING_CERTIFICATE_SHA256
```

Polecenie wypisuje JSON z docelowym pakietem. Nie zapisuje go na produkcji.
Można podać więcej publicznych odcisków, jeżeli Play wymaga obsługi rotacji.
Odcisk musi pochodzić z Play Console z sekcji **App signing key certificate**.
Wygenerowaną treść dodaj w osobnej zmianie do
`public/.well-known/assetlinks.json`, ustaw poprawny typ JSON w Netlify,
wdroż i sprawdź HTTP 200 bez przekierowania/SPA. Następnie przetestuj pakiet
zainstalowany przez Google Play. [Szczegóły relacji domeny](SIGNING.md).

Przy kolejnym przesłaniu zwiększ `appVersionCode` w `play-config.json`; nazwa
wersji jest przeznaczona dla użytkownika. Większość zmian strony trafia przez
Netlify/PWA, ale tożsamość Androida, ikony i konfiguracja natywna wymagają AAB.
