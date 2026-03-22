# Western Shootout - Game Event Structures

Az események (Events) az RGS `play/` API-ja által visszaadott JSON objektumok, amelyek a játék könyvtárának (library) döntő többségét alkotják. Ezek az objektumok tartalmaznak minden olyan adatot, amely a frontend számára szükséges a játék aktuális állapotának megjelenítéséhez. Ami nem szerepel az eseményekben, vagy azokból nem következik közvetlenül, azt a játékos nem láthatja.

A Western Shootout esetében az események a következőket tartalmazzák:
* Aktuális életerő (HP) értékek
* Lövési szekvenciák adatai (ki lő, kire és melyik zónára)
* Speciális akciók (pl. Angyal általi feltámasztás)
* Csoportos párbaj (Extreme mód) állapota és ellenfelek életereje

# Esemény Struktúra

Minden szimulációs lépés (step) egy-egy eseménynek felel meg. A Western Shootout eseményei a következő formátumot követik:

```json
{
    "Shooter": "str",      // "PLAYER", "ENEMY", "ANGEL"
    "Target": "str",       // "HEAD", "BODY", "LEGS", "FAIL" (miss)
    "PlayerHP": "float",   // Aktuális HP a lövés után (0.0 - 100.0)
    "EnemyHP": "float",    // Aktuális HP a lövés után (0.0 - 100.0)
    "enemiesHP": "dict"    // (Opcionális) Csoportos párbaj esetén minden ellenfél HP-ja
}
```

Az eseményeket a matematikai motor generálja és fűzi hozzá a szimuláció "events" mezőjéhez a gamestate.book.add_event(event) metódussal.

# Események Kezelése
Az események kezelése elválik a játékmenet kalkulációitól. Amint a matematikai motor elvégez egy akciót (pl. sebzéskalkuláció vagy állapotváltozás), az eseményt azonnal ki kell bocsátani, mivel ez szolgáltatja a játék aktuális állapotának pillanatképét (snapshot).

Példa az esemény kibocsátására a motorban:

```Python
from src.Events.Events import update_duel_event

def run_shoot_sequence(self):
    # Kalkulációk...
    update_duel_event(self)
    # További folyamatok...
```

# Timeline EventTypes
A szekvenciák vizuális kontextusát a round objektum eventType mezője határozza meg:

STANDARD_WIN / STANDARD_LOSE: Hagyományos 1v1 párbaj kimenete.

STANDARD_DRAW: Döntetlen, amikor mindkét fél kifogy a lőszerből (6-6 lövés után).

ANGEL_REVIVE: A játékos életereje elfogy, de egy "Angyal" esemény visszaállítja azt.

GROUP_SHOOTOUT: Több ellenfél elleni harc, amely az Extreme játékmódban érhető el.

Ezeket az eseményeket minden alkalommal el kell küldeni, amikor új információt kell közölni a játékossal a frontend felé.