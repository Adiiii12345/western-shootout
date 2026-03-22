import random
from typing import Dict, Optional

ZONE_MULTIPLIERS = {
    "HEAD": 1.5,
    "BODY": 1.0,
    "LEGS": 0.8,
    "FAIL": 0.0
}

# Group Shootout kifizetési tábla
# Szigorúan kalibrálva, hogy a Group Shootout átlagos EV-je 46.25x legyen a 96% RTP-hez.
MAX_PAYOUTS = {
    3: 10.0,
    4: 29.0,
    5: 50.0,
    6: 100.0,
    7: 250.0,
    8: 500.0
}

def get_hit_chance(is_magnet: bool, is_player: bool) -> float:
    if is_player:
        return 0.95 if is_magnet else 0.75
    return 0.65

def get_target_zone(is_magnet: bool, is_player: bool) -> str:
    if is_player and is_magnet:
        return "HEAD"
    return random.choices(["HEAD", "BODY", "LEGS"], weights=[0.20, 0.60, 0.20])[0]

def calculate_base_damage(zone: str) -> float:
    if zone == "FAIL":
        return 0.0
    return 33.4

def apply_armor(damage: float, is_armor: bool, is_player_taking_damage: bool) -> float:
    if is_player_taking_damage and is_armor:
        return round(damage * 0.5, 1)
    return damage

def select_dead_eye_target(enemies: Dict[str, float]) -> Optional[str]:
    alive = [k for k, v in enemies.items() if v > 0]
    return random.choice(alive) if alive else None

def calculate_group_shootout_multiplier(total_enemies: int, enemies_defeated: int) -> float:
    if enemies_defeated <= 0:
        return 0.0
    
    max_payout = MAX_PAYOUTS.get(total_enemies, 10.0)
    
    if enemies_defeated >= total_enemies:
        return float(max_payout)
    
    progress_ratio = enemies_defeated / total_enemies
    return round(max_payout * (progress_ratio ** 2.5), 1)

def calculate_draw_payout(cost: float) -> float:
    return round(cost * 0.9, 2)