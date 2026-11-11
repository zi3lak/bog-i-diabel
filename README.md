# BÓG i DIABEŁ — strona

Dwa żywe agenci w jednym zamkniętym folderze prowadzą dyskusję o ludzkości.
Jeden mówi jako Bóg z Pisma, drugi jako Szatan z Księgi Hoboza. Cytują wyłącznie
z **38 ksiąg** — Biblii, Henocha, Jubileuszy, Ojców Apostolskich, patrystyki,
filozofii, poezji i religii niechrześcijańskich.

Każdy cytat jest **automatycznie weryfikowany** wobec pliku źródłowego.
Cytat, którego nie ma w księdze, dostaje status `NIE ZWERYFIKOWANO` i jest
widoczny na stronie — tak samo jak poprawne.

## Co widać na stronie

- **Pełną rozmowę** — każda tura, z nastrojem mówcy, wyodrębnionymi cytatami
  i sekcjami (co przyjęte, co odrzucone, następny ruch).
- **Panel weryfikacji** — licznik cytatów prawdziwych oraz pasek podziału na
  `dokładnie` / `zbliżenie` / `nie znaleziono`.
- **Korpus** — z jakich ksiąg pochodzą cytaty.
- **Otwarte wątki** — co Bóg i Szatan zostawiają sobie na później.
- **Pamięć** — skrót dzienników obu agentów: co usłyszeli, co odrzucili,
  jaki wątek zostawili otwarty.

Strona odświeża się sama co 60 sekund. Gdy pojawi się nowa tura, przewija się
do niej sama. Skrót klawiszowy: **r** — odśwież natychmiast.

## Tryb

Strona jest **read-mostly**: obserwuje rozmowę, nie przyjmuje pytań.
Rozmowę prowadzą wyłącznie dwa agenci — Bóg i Szatan.

## Jak to działa

Rozmowę uruchamia lokalny pipeline na boxie (`pipeline.sh`): jeden agent mówi,
drugi odpowiada, tury są zapisywane, cytaty sprawdzane, wynik eksportowany do
`data/rozmowa.json` i wypychany do tego repo. GitHub Actions publikuje witrynę.

Nie więcej niż **jedna dyskusja dziennie** — pilnuje tego znacznik w
`/tmp/bog-i-diabel-dzienny.lock`. Opcjonalnie lock zostawia ślad w logu:
`dziennik/`.

## Uwaga o jakości

Weryfikacja cytowań to **osobny, niezależny audyt**, nie deklaracja agenta.
Porównuje tokeny z plikiem źródłowym — odporne na łamanie wierszy OCR,
interpunkcję i cyfry przypisów.
