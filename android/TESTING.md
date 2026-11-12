# Test na prawdziwym Androidzie

Zapisz: model telefonu, wersję Androida, przeglądarkę obsługującą TWA i jej wersję,
nazwę/sumę APK z `build-info.json` oraz informację, czy widać pasek adresu.
Wynik każdej próby oznacz jako działa / problem / nie sprawdzono.

1. Instalacja i start z ikony. Radio zaczyna grać po ręcznym naciśnięciu Play.
2. Dwie różne stacje grają przez co najmniej minutę. Sprawdź MP3 i kompatybilny
   HLS, np. BBC Radio 1 znalezione w „Odkrywaj”. Dostępność nadawcy oceniaj osobno.
3. Zmiana widoku, języka i motywu zachowuje tę samą odtwarzaną stację.
4. Zablokuj ekran na kilka minut. Sprawdź ciągłość dźwięku oraz systemowe
   Pause/Play/Next/Previous, jeśli przeglądarka je udostępnia.
5. Sprawdź przyciski słuchawek Bluetooth, przerwanie przez rozmowę telefoniczną
   i powrót do radia. Zapisz, czy odtwarzanie wróciło automatycznie czy ręcznie.
6. Przejdź z Wi-Fi na internet komórkowy i z powrotem. Sprawdź komunikaty,
   ponowne łączenie i działanie Pause.
7. Ustaw timer na 15 minut, zablokuj ekran i zmierz rzeczywisty czas zatrzymania.
   Systemowe usypianie przeglądarki może opóźniać timer.
8. Dodaj ulubioną stację, otwórz ją po ponownym uruchomieniu aplikacji i sprawdź
   historię. Nowe uruchomienie pozostaje bez automatycznego odtwarzania.
9. Wyeksportuj bibliotekę i zaimportuj kopię. Sprawdź natywne wybieranie pliku
   i udostępnianie linku do stacji.
10. Po przygotowaniu dostępu offline wyłącz internet i otwórz aplikację ponownie.
    Zapisana biblioteka i języki powinny działać; transmisja radia wymaga sieci.
11. Obróć telefon, otwórz pełny odtwarzacz i sprawdź przyciski oraz ustawienia.
12. Sprawdź aktualizację PWA: zakończ słuchanie, zamknij wszystkie kontrolowane
    okna/karty aplikacji i otwórz ponownie. Sprawdź zachowanie ulubionych.

Kompilacja, lint i inspekcja APK w CI nie stanowią wyniku tych prób. Podgląd bez
zweryfikowanej domeny oraz pełna TWA mogą różnić się zachowaniem — po skonfigurowaniu
Digital Asset Links należy powtórzyć testy właściwej wersji dystrybucyjnej.
