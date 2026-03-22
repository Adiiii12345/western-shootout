import random
from .game_override import GameStateOverride
from src.events.events import EventConstants
from .game_calculations import GameCalculations
from .game_events import WesternShootoutEvents as Events

class GameState(GameStateOverride):
    def __init__(self, config):
        super().__init__(config)
        self.current_timeline = None
        self.calc = GameCalculations(self)

    def get_state_dict(self):
        state = super().get_state_dict()
        state["total_multiplier"] = self.win_manager.total_multiplier
        state["round_data"] = self.current_timeline
        return state

    def run_spin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.reset_book()

        # FONTOS: Az SDK a betmode változót belsőleg kezeli, 
        # de a biztonság kedvéért lekérjük az objektumot.
        bet_mode_obj = self.get_current_betmode()
        cost = bet_mode_obj._cost if hasattr(bet_mode_obj, '_cost') else 1.0
        
        conditions = {}
        if hasattr(bet_mode_obj, 'distributions') and len(bet_mode_obj.distributions) > 0:
            conditions = bet_mode_obj.distributions[0].conditions
        
        force_group = conditions.get("force_group_shootout", False)
        force_wincap = conditions.get("force_wincap", False)

        if force_group:
            event_type = Events.GROUP_SHOOTOUT
        else:
            rand_type = random.random()
            if rand_type < 0.02:
                event_type = Events.ANGEL_REVIVE
            elif rand_type < 0.15:
                event_type = Events.STANDARD_DRAW
            elif rand_type < 0.45:
                event_type = Events.STANDARD_WIN
            else:
                event_type = Events.STANDARD_LOSE

        duel_steps = []
        p_hp, e_hp = 100.0, 100.0
        final_multiplier = 0.0
        winner = "NONE"

        if event_type in [Events.STANDARD_WIN, Events.STANDARD_LOSE]:
            turn = Events.SHOOTER_PLAYER if random.random() > 0.5 else Events.SHOOTER_ENEMY
            
            while p_hp > 0 and e_hp > 0:
                attacker = turn
                is_p_atk = (attacker == Events.SHOOTER_PLAYER)
                
                # A számításoknak az aktuális objektumot adjuk át
                zone = self.calc.get_hit_target(is_p_atk, bet_mode_obj)
                
                if event_type == Events.STANDARD_WIN and not is_p_atk and p_hp <= 34:
                    zone = Events.TARGET_FAIL
                elif event_type == Events.STANDARD_LOSE and is_p_atk and e_hp <= 34:
                    zone = Events.TARGET_FAIL
                    
                damage = self.calc.calculate_damage(zone, not is_p_atk, bet_mode_obj)
                
                if zone != Events.TARGET_FAIL:
                    if is_p_atk:
                        e_hp = max(0.0, round(e_hp - damage, 1))
                    else:
                        p_hp = max(0.0, round(p_hp - damage, 1))

                duel_steps.append({
                    "Shooter": attacker,
                    "Target": zone,
                    "PlayerHP": p_hp,
                    "EnemyHP": e_hp
                })
                turn = Events.SHOOTER_ENEMY if turn == Events.SHOOTER_PLAYER else Events.SHOOTER_PLAYER

            winner = Events.SHOOTER_PLAYER if e_hp <= 0 else Events.SHOOTER_ENEMY
            final_multiplier = 2.0 if winner == Events.SHOOTER_PLAYER else 0.0

        elif event_type == Events.STANDARD_DRAW:
            turn = Events.SHOOTER_PLAYER if random.random() > 0.5 else Events.SHOOTER_ENEMY
            draw_length = random.randint(6, 10)
            
            while len(duel_steps) < draw_length:
                attacker = turn
                is_p_atk = (attacker == Events.SHOOTER_PLAYER)
                
                zone = self.calc.get_hit_target(is_p_atk, bet_mode_obj)
                
                if is_p_atk and e_hp <= 34:
                    zone = Events.TARGET_FAIL
                elif not is_p_atk and p_hp <= 34:
                    zone = Events.TARGET_FAIL
                    
                damage = self.calc.calculate_damage(zone, not is_p_atk, bet_mode_obj)
                
                if zone != Events.TARGET_FAIL:
                    if is_p_atk:
                        e_hp = max(0.0, round(e_hp - damage, 1))
                    else:
                        p_hp = max(0.0, round(p_hp - damage, 1))

                duel_steps.append({
                    "Shooter": attacker,
                    "Target": zone,
                    "PlayerHP": p_hp,
                    "EnemyHP": e_hp
                })
                turn = Events.SHOOTER_ENEMY if turn == Events.SHOOTER_PLAYER else Events.SHOOTER_PLAYER

            winner, final_multiplier = "DRAW", 1.0 

        elif event_type == Events.ANGEL_REVIVE:
            duel_steps = [
                {"Shooter": Events.SHOOTER_ENEMY, "Target": Events.TARGET_BODY, "PlayerHP": 50.0, "EnemyHP": 100.0},
                {"Shooter": Events.SHOOTER_ENEMY, "Target": Events.TARGET_BODY, "PlayerHP": 0.0, "EnemyHP": 100.0},
                {"Shooter": Events.SHOOTER_ANGEL, "Target": Events.SHOOTER_PLAYER, "PlayerHP": 100.0, "EnemyHP": 100.0},
                {"Shooter": Events.SHOOTER_PLAYER, "Target": Events.TARGET_HEAD, "PlayerHP": 100.0, "EnemyHP": 0.0}
            ]
            winner, final_multiplier = Events.SHOOTER_PLAYER, 5.0

        elif event_type == Events.GROUP_SHOOTOUT:
            num_enemies = random.randint(conditions.get("min_enemies", 3), conditions.get("max_enemies", 6))
            enemies = self.calc.calculate_group_shootout_hp(num_enemies)
            killed = 0
            
            while killed < num_enemies and p_hp > 0 and len(duel_steps) < 30:
                alive_enemies = [e for e, hp in enemies.items() if hp > 0]
                if not alive_enemies:
                    break
                    
                target_enemy = random.choice(alive_enemies)
                zone = self.calc.get_hit_target(True, bet_mode_obj)
                
                if force_wincap:
                    zone = Events.TARGET_HEAD
                    
                damage = self.calc.calculate_damage(zone, False, bet_mode_obj)
                
                if zone != Events.TARGET_FAIL:
                    enemies[target_enemy] = max(0.0, round(enemies[target_enemy] - damage, 1))
                    if enemies[target_enemy] == 0.0:
                        killed += 1
                        
                duel_steps.append({
                    "Shooter": Events.SHOOTER_PLAYER,
                    "Target": zone,
                    "PlayerHP": p_hp,
                    "EnemyHP": enemies.get(target_enemy, 0.0),
                    "enemiesHP": enemies.copy()
                })
                
                alive_enemies = [e for e, hp in enemies.items() if hp > 0]
                if alive_enemies and killed < num_enemies:
                    shooting_enemy = random.choice(alive_enemies)
                    
                    e_zone = self.calc.get_hit_target(False, bet_mode_obj)
                    if force_wincap:
                        e_zone = Events.TARGET_FAIL
                        
                    e_damage = self.calc.calculate_damage(e_zone, True, bet_mode_obj)
                    
                    if e_zone != Events.TARGET_FAIL:
                        p_hp = max(0.0, round(p_hp - e_damage, 1))
                        
                    duel_steps.append({
                        "Shooter": Events.SHOOTER_ENEMY,
                        "Target": e_zone,
                        "PlayerHP": p_hp,
                        "EnemyHP": enemies[shooting_enemy],
                        "enemiesHP": enemies.copy()
                    })

            if force_wincap:
                final_multiplier = self.config.wincap
            else:
                final_multiplier = killed * 3.0
            
            winner = Events.SHOOTER_PLAYER if killed == num_enemies else Events.SHOOTER_ENEMY

        if force_wincap:
            final_multiplier = self.config.wincap

        self.current_timeline = {
            "eventType": event_type, 
            "steps": duel_steps, 
            "winner": winner
        }

        total_win_amount = cost * final_multiplier

        self.book.add_event({
            "index": len(self.book.events),
            "type": EventConstants.WIN_DATA.value,
            "numberRolled": int(sim + 1),
            "round_data": self.current_timeline,
            "finalMultiplier": float(final_multiplier)
        })

        self.win_manager.update_spinwin(total_win_amount)
        self.win_manager.update_gametype_wins(self.gametype)
        self.update_final_win()
        self.imprint_wins()

    def run_freespin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.reset_book()
        self.update_final_win()
        self.imprint_wins()