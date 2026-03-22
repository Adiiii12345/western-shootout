# Western Shootout - Bet Modes Configuration

A `self.bet_modes` tömb definiálja a játék érvényes fogadási módjait. A `BetMode` osztály konfigurálja a matematikai motor viselkedését, beleértve az RTP-t, a költség-szorzót, a maximális nyereményt és az eseményeloszlási feltételeket.

## Fogadási Módok és Költségek

A Western Shootout négy technikai módot használ. A végfelhasználói költség az alaptét és a `cost` szorzata.

| Név | Technikai kulcs | Költség (Cost) | Funkció |
| :--- | :--- | :--- | :--- |
| **Base** | `base` | 1.0 | Alap párbaj logika. |
| **Armor** | `armor` | 1.5 | Megnövelt védelem (alacsonyabb sebzés bekapás). |
| **Magnet** | `magnet` | 1.8 | Megnövelt találati esély (pontosabb lövések). |
| **Extreme** | `extreme` | 2.3 | Armor + Magnet + Group Shootout esély. |

## Konfigurációs Flag-ek

A Western Shootout implementációja az alábbi specifikus beállításokat alkalmazza:

1. **auto_close_disabled**: Alapértelmezetten `False`. A `/endround` hívás automatikusan lezárja a fogadást a kifizetés után.
2. **is_feature**: `True` értékre állítva az Armor, Magnet és Extreme módoknál. Ez jelzi a frontendnek, hogy a módválasztás maradjon aktív egymást követő lövések között is, nem igényel minden kör után újabb megerősítést.
3. **is_buybonus**: `False`. Ebben a játékban nincsenek közvetlen bónuszvásárlások, a módok az alapjáték variációi.

## Példa Konfiguráció (Western Shootout)

Az alábbi Python példa az `extreme` mód konfigurációját mutatja be a matematikai motorban:

```python
    BetMode(
        name="extreme",
        cost=2.3,
        rtp=0.96,
        max_win=500.0,
        auto_close_disabled=False,
        is_feature=True,
        is_buybonus=False,
        distributions=[
            Distribution(
                criteria="group_shootout",
                quota=0.10,
                conditions={
                    "force_group_shootout": True,
                    "min_enemies": 3,
                    "max_enemies": 6
                }
            ),
            Distribution(
                criteria="standard_duel",
                quota=0.90,
                conditions={
                    "magnet_multiplier": 1.5,
                    "armor_multiplier": 0.5,
                    "force_group_shootout": False
                }
            )
        ]
    )
```

# Frontend Szinkronizáció
A frontend a is_feature flag alapján kezeli a UI állapotát. Ha a kiválasztott mód is_feature = True, a BetPanel nem vált vissza base módra a RESULT állapot lefutása után, biztosítva a folyamatos játékmenetet a kiválasztott módosítókkal.