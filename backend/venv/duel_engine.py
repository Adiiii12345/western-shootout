# duel_engine.py
import random
from fairness import FairnessManager
from config import HIT_ZONES, MODIFIERS, INITIAL_HP, PAYOUT_MULTIPLIERS, ZONE_SELECTION_WEIGHTS

class DuelEngine:
    def __init__(self):
        self.fm = FairnessManager()

    def simulate_duel(self, server_seed: str, client_seed: str, start_nonce: int, bet_config: dict):
        """
        Egy teljes párbaj szimulálása lépésről lépésre.
        bet_config: { 'magnet': bool, 'armor': bool, 'target': 'PLAYER'|'ENEMY' }
        """
        p_hp = INITIAL_HP
        e_hp = INITIAL_HP
        nonce = start_nonce
        steps = []
        
        # Ki támad először? (50-50%)
        # Az első roll dönti el a kezdőt
        first_attacker_roll = self.fm.get_roll(server_seed, client_seed, nonce)
        attacker = "PLAYER" if first_attacker_roll > 0.5 else "ENEMY"
        nonce += 1

        while p_hp > 0 and e_hp > 0:
            # 1. Zóna választása (Súlyozott sorsolás a ZONE_SELECTION_WEIGHTS alapján)
            zone_roll = self.fm.get_roll(server_seed, client_seed, nonce)
            nonce += 1
            zone_key = self._get_zone_by_roll(zone_roll)
            zone_data = HIT_ZONES[zone_key]

            # 2. Találat ellenőrzése
            hit_roll = self.fm.get_roll(server_seed, client_seed, nonce)
            nonce += 1
            
            # Esély kalkuláció + Magnet módosító
            hit_chance = zone_data["chance"]
            if attacker == "PLAYER" and bet_config["magnet"]:
                hit_chance *= MODIFIERS["MAGNET_HIT_CHANCE_BOOST"]
            
            is_hit = hit_roll <= hit_chance

            # 3. Sebzés kalkuláció
            damage = 0
            if is_hit:
                # Sebzés roll (min-max között)
                dmg_roll = self.fm.get_roll(server_seed, client_seed, nonce)
                nonce += 1
                base_dmg = zone_data["min_dmg"] + (dmg_roll * (zone_data["max_dmg"] - zone_data["min_dmg"]))
                
                # Armor módosító
                target_is_armored = (attacker == "PLAYER" and bet_config["target"] == "ENEMY" and bet_config["armor"]) or \
                                   (attacker == "ENEMY" and bet_config["target"] == "PLAYER" and bet_config["armor"])
                
                damage = base_dmg
                if target_is_armored:
                    damage *= (1 - MODIFIERS["ARMOR_DAMAGE_REDUCTION"])
                
                damage = round(damage, 2)
                
                # HP levonás
                if attacker == "PLAYER":
                    e_hp = max(0, e_hp - damage)
                else:
                    p_hp = max(0, p_hp - damage)

            # Lépés mentése
            steps.append({
                "attacker": attacker,
                "hit": is_hit,
                "zone": zone_key,
                "damage": damage,
                "pHP": round(p_hp, 2),
                "eHP": round(e_hp, 2)
            })

            # Támadó váltása
            attacker = "ENEMY" if attacker == "PLAYER" else "PLAYER"

        # Végeredmény kalkuláció
        winner = "PLAYER" if e_hp <= 0 else "ENEMY"
        is_bet_won = winner == bet_config["target"]
        multiplier = PAYOUT_MULTIPLIERS["WIN"] if is_bet_won else PAYOUT_MULTIPLIERS["LOSS"]

        return {
            "duelSteps": steps,
            "winner": winner,
            "payoutMultiplier": multiplier,
            "endNonce": nonce
        }

    def _get_zone_by_roll(self, roll: float) -> str:
        cumulative = 0
        for zone, weight in ZONE_SELECTION_WEIGHTS.items():
            cumulative += weight
            if roll <= cumulative:
                return zone
        return "BODY"

# Debug teszt
if __name__ == "__main__":
    engine = DuelEngine()
    test_config = {"magnet": True, "armor": False, "target": "PLAYER"}
    res = engine.simulate_duel("test-server-seed", "test-client-seed", 0, test_config)
    print(f"Winner: {res['winner']} | Steps: {len(res['duelSteps'])}")
    for s in res['duelSteps']:
        print(s)