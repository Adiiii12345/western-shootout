# Math Verification & RGS Data Format

Amikor statikus matematikai fájlokat (books) töltünk fel az RGS-be, a Stake Engine előzetes ellenőrzéseket hajt végre, hogy megbizonyosodjon a játéklogika elvárt formátumáról. A kifizetési szorzók és valószínűségek elemzésével a rendszer összefoglaló statisztikát készít a backend számára.

## Minimum Fájlkövetelmények

Egyetlen játékmóddal rendelkező játék esetén 3 fájl szükséges a sikeres publikáláshoz. A Western Shootout esetében ez minden aktív módra (base, armor, magnet, extreme) vonatkozik:

* **Index fájl**: Kötelezően `index.json` néven, amely tartalmazza a módok neveit, a költségszorzókat és a fájlneveket.
* **Lookup table (Súlytábla)**: CSV fájl, amely soronként tartalmazza az ID-t, a valószínűséget és a kifizetést.
* **Game logic**: zStandard (.zst) tömörítéssel ellátott JSON-lines fájl (`.jsonl.zst`).

## Index fájl formátum (index.json)

Az upload könyvtárban található `index.json` fájlnak szigorúan az alábbi struktúrát kell követnie:

```json
{
    "modes": [
        {
            "name": "base",
            "cost": 1.0,
            "events": "books_base.jsonl.zst",
            "weights": "lookUpTable_base.csv"
        },
        {
            "name": "armor",
            "cost": 1.5,
            "events": "books_armor.jsonl.zst",
            "weights": "lookUpTable_armor.csv"
        },
        {
            "name": "magnet",
            "cost": 1.8,
            "events": "books_magnet.jsonl.zst",
            "weights": "lookUpTable_magnet.csv"
        },
        {
            "name": "extreme",
            "cost": 2.3,
            "events": "books_extreme.jsonl.zst",
            "weights": "lookUpTable_extreme.csv"
        }
    ]
}
```
# CSV formátum (Weights)
A statisztikai számítások hatékonysága érdekében az RGS uint64 (előjel nélküli egész) értékekkel dolgozik. A CSV fájl harmadik oszlopában található payoutMultiplier értéknek karakterre pontosan meg kell egyeznie a JSONL fájlban található értékkel.

# A CSV felépítése:
szimulációs ID, kerekített valószínűség, kifizetési szorzó (integer)

Példa:

Kódrészlet
1,199895486317,0
2,25668581149,200
3,126752606,25000
Megjegyzés: A 200-as érték 2.0x-os kifizetést jelent az adott kör összköltségére (cost) vetítve.

Game Logic formátum (JSONL)
A /play API-n keresztül visszaadott körinformációk egyetlen szimulációs kimenetnek felelnek meg. A hatékonyság érdekében ezeket .jsonl.zst formátumban tároljuk. Minden egyes szimulációnak (sorral) tartalmaznia kell az alábbi kulcsmezőket:

"id": <int> (Egyedi azonosító)

"events": <list<dict>> (A párbaj lépései / steps)

"payoutMultiplier": <int> (Kifizetés szorzója 100-as bázison)

Példa egy Western Shootout körre a JSONL fájlban (tömörítés előtt):

```json
{
    "id": 1,
    "payoutMultiplier": 250,
    "events": [
        {
            "type": "STANDARD_WIN",
            "winner": "PLAYER",
            "steps": [
                { "Shooter": "ENEMY", "Target": "FAIL", "PlayerHP": 100, "EnemyHP": 100 },
                { "Shooter": "PLAYER", "Target": "HEAD", "PlayerHP": 100, "EnemyHP": 0 }
            ]
        }
    ]
}
```
Fontos: Az RGS API a payoutMultiplier / 100 * cost képletet használja a végső kifizetés kiszámításához.