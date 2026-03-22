# Western Shootout - Gyorsútmutató (Quickstart)

Ez az útmutató bemutatja, hogyan futtathatja első szimulációit a Math SDK segítségével, hogyan ellenőrizheti az eredményeket, és hogyan készítheti elő a játékot a publikálásra.

## Az első játék futtatása

A `/games/` könyvtárban több példajáték található, amelyek bemutatják a gyakori slot mechanikákat. Példaként tekintsük a `games/0_0_lines/` mappát, amely egy 3 soros, 5 tárcsás, 20 nyerővonalas játékot tartalmaz.

### A futtató fájl (run.py)

A szimulációs paraméterek — beleértve a szimulációk számát, a kifizetési statisztikákat, az optimalizálási feltételeket és a futtatandó módokat — a `run.py` fájlban találhatók.

Az alapértelmezett beállításokkal a futtatáshoz használja a következő parancsot:

```sh
make run GAME=0_0_lines
```

Vagy hívja meg a szkriptet manuálisan a virtuális környezet aktiválása után:

```Bash
python3 games/0_0_lines/run.py 
```

A futtatás után az RGS által igényelt összes fájl a library/publish_files/ mappába kerül. Ez magában foglalja a books (logika), lookup-tables (súlytáblák) és az index fájlokat, amelyek elengedhetetlenek a publikáláshoz.

# Kimenetek tesztelése
A kimeneti fájlok emberi fogyasztásra alkalmas formátumú megtekintéséhez érdemes kis számú (pl. 100) eredményt generálni tömörítés nélkül. Ehhez módosítsa a run.py alábbi változóit:

```Python
num_threads = 1
compression = False

num_sim_args = {
    "base": 100,
    "extreme": 100, # A Western Shootout módjaihoz igazítva
}

run_conditions = {
    "run_sims": True,
    "run_optimization": False,
    "run_analysis": False
}
```
# Eredmények ellenőrzése
JSONL Logika: A library/books/books_base.jsonl fájl tartalmazza az egyes szimulációkat. Minden szimuláció rendelkezik egy id-val és egy events taggel, amely közli a frontenddel a megjelenítendő eseményeket (lövés, találat, HP változás).

Kifizetési szorzó: Minden szimulációhoz tartozik egy payoutMultiplier érték, amely a kör végső kifizetését határozza meg.

CSV Súlytábla: A library/lookup_tables/lookUpTable_base.csv fájlban ellenőrizheti, hogy a szimuláció azonosítója és kifizetése megegyezik-e a JSONL fájlban találhatóval.

# Nagyobb szimulációs batch-ek
A fejlesztés elején javasolt kis szimulációs számokat használni a hibakereséshez. Ha a játékmotor kimenete megfelelő, a produkcióra kész állapothoz módonként legalább 100.000+ szimuláció futtatása ajánlott. Ez biztosítja a kifizetési szorzók széles választékát és csökkenti annak esélyét, hogy a játékosok ugyanazt a kört többször lássák.

Nagy szimuláció futtatásához és az RTP optimalizálásához állítsa be az alábbiakat:

```Python
num_sim_args = {
    "base": int(1e5),
    "extreme": int(1e5),
}

run_conditions = {
    "run_sims": True,
    "run_optimization": True,
    "run_analysis": True,
    "upload_data": False,
}
```
Az optimalizáló algoritmus (run_optimization: True) állítja be a súlyokat a CSV fájlokban, hogy a játékmód pontosan a megadott RTP-t hozza.

# Statisztikai elemzés (PAR sheet)
A run_analysis: True beállítással generálhat egy PAR sheet-et, amely összefoglalja a játék kulcsstatisztikáit, a találati arányokat (hit-rates) és a frekvenciákat. Ez a program a library/lookup_tables/ és a library/forces/ fájlokat használja az adatok összesítéséhez.