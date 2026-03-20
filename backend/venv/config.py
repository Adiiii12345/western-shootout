# config.py

# --- Találati esélyek és sebzések (Lookup Tables) ---
# A 'chance' értékeket a mnemoo-val számolt valószínűségeidre cserélheted.
HIT_ZONES = {
    "HEAD": {
        "chance": 0.20,        # 20% találati esély
        "min_dmg": 70,
        "max_dmg": 100,
        "label": "FEJ"
    },
    "BODY": {
        "chance": 0.65,        # 65% találati esély
        "min_dmg": 25,
        "max_dmg": 40,
        "label": "TEST"
    },
    "LEG": {
        "chance": 0.85,        # 85% találati esély
        "min_dmg": 10,
        "max_dmg": 20,
        "label": "LÁB"
    }
}

# --- Powerup módosítók ---
MODIFIERS = {
    "MAGNET_HIT_CHANCE_BOOST": 1.5,  # 1.5x-es szorzó a találati esélyre
    "ARMOR_DAMAGE_REDUCTION": 0.25,  # 25%-os sebzés csökkentés
}

# --- Game Rules ---
INITIAL_HP = 100
MAX_DUEL_STEPS = 10  # Fail-safe, ha senki nem találna el senkit (bár az esély kicsi)

# --- Payout Odds (Lookup Table) ---
# Ezeket a ház haszna (House Edge) alapján kell kalibrálni
PAYOUT_MULTIPLIERS = {
    "WIN": 2.0,     # Alapesetben a tét duplája
    "LOSS": 0.0,    # Bukta
    "DRAW": 1.0     # Döntetlen esetén visszajár (ritka, de lehetséges)
}

# --- Matematikai súlyozás a zónaválasztáshoz (RNG Sorsoláshoz) ---
# Amikor a szerver "lő", milyen eséllyel választja az adott zónát
ZONE_SELECTION_WEIGHTS = {
    "HEAD": 0.2,
    "BODY": 0.5,
    "LEG": 0.3
}