# Western Shootout - Distribution Conditions

Minden `BetMode`-on belül található egy `Distribution` osztályokból álló készlet, amely meghatározza az adott játékmód nyerési kritériumait és az események eloszlását.

## Kötelező Mezők

1. **Criteria**
    * Egy rövid, egyszavas azonosító, amely leírja a nyerési kondíciót (pl. `wincap`, `standard`, `angel`, `group_shootout`).
2. **Quota**
    * Ez határozza meg a szimulációk mennyiségét az összes szimuláció arányában. A kvóták normalizálásra kerülnek a kiosztáskor, így az összegüknek nem kell 1-nek lennie. Kritériumszinten minimum 1 szimuláció mindig hozzárendelésre kerül.
3. **Conditions**
    * A feltételek tetszőleges számú kulcsot tartalmazhatnak. A Western Shootout motorjában a leggyakoribb kulcsok:
        * `magnet_multiplier`: Befolyásolja a találati valószínűséget.
        * `armor_multiplier`: Módosítja a bekapott sebzést.
        * `force_group_shootout`: Kényszeríti a többszereplős párbajt.
        * `force_wincap`: Ha `True`, a motor a maximális (500x) szorzót kényszeríti ki.
    
    Megjegyzés: A `force_wincap` és a `force_freegame` (itt `force_angel`) alapértelmezetten `False`.

## Felhasználási Példák

A feltételeket leggyakrabban véletlenszerű értékek sorsolásakor használjuk a `get_distribution_conditions()` metóduson keresztül:

```python
# Sorsolás a konfigurált súlyozott szorzók alapján
multiplier = get_random_outcome(betmode.get_distribution_conditions()['mult_values'])
```
Vagy specifikus játékelemek kényszerítéséhez:

```python
if get_distribution_conditions()['force_group_shootout']:
    # Speciális párbaj logika indítása
    self.trigger_group_shootout()
```
# Win Criteria (Opcionális)
A win_criteria mező lehetővé teszi egy konkrét kifizetési szorzó beépítését a szimuláció elfogadási folyamatába. A két leggyakoribb érték:

win_criteria = 0.0 (Vesztes kör kényszerítése)

win_criteria = self.wincap (Max Win kényszerítése)

A szimuláció végén a self.check_repeat() hívásakor a motor ellenőrzi, hogy a végső kifizetés pontosan megegyezik-e a megadott értékkel. Ha nem, a szimulációt elveti és újra futtatja.

# Cél és Optimalizáció
A Distribution rendszer célja, hogy a játékmenetet az elvárt szimulációs kimenettől függően kezelje. Ez különösen hasznos Max-Win szcenáriók esetén: ahelyett, hogy véletlenszerűen próbálnánk generálni egy ritka kimenetet (amit a motor folyamatosan elutasítana a win_criteria miatt), módosíthatjuk a valószínűségeket (pl. bias a fejlövések irányába, nagyobb sebzés szorzók), így a motor sokkal hatékonyabban talál valid szimulációt.