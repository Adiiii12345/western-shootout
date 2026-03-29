import random
from .game_calculations import GameCalculations
from .game_events import WesternShootoutEvents as Events

class GameState:
    def __init__(self, config):
        self.config = config
        self.calc = GameCalculations(self)
        self.current_bet_mode = None

    def run_spin(self, sim):
        bet_mode_obj = self.current_bet_mode
        cost = getattr(bet_mode_obj, 'cost', 1.0)
        
        distributions = bet_mode_obj.distributions
        rand_val = random.random()
        cumulative = 0.0
        chosen_dist = distributions[-1]
        for dist in distributions:
            cumulative += dist.quota
            if rand_val <= cumulative:
                chosen_dist = dist
                break
                
        conditions = chosen_dist.conditions
        
        force_wincap = conditions.get("force_wincap", False)
        force_group = conditions.get("force_group_shootout", False)
        force_angel = conditions.get("force_angel_revive", False)

        is_wincap = False
        event_type_visual = None

        if force_wincap:
            event_type = "WINCAP"
            event_type_visual = Events.STANDARD_WIN
            is_wincap = True
        elif force_group:
            event_type = Events.GROUP_SHOOTOUT
            event_type_visual = Events.GROUP_SHOOTOUT
        elif force_angel:
            event_type = Events.ANGEL_REVIVE
            event_type_visual = Events.ANGEL_REVIVE
        else:
            sub_weights = [5000, 25000, 68398]
            sub_events = [Events.STANDARD_DRAW, Events.STANDARD_WIN, Events.STANDARD_LOSE]
            event_type = random.choices(sub_events, weights=sub_weights)[0]
            event_type_visual = event_type

        if is_wincap:
            final_multiplier = self.config.wincap * cost
            winner = Events.SHOOTER_PLAYER
        elif event_type == Events.STANDARD_WIN:
            win_payouts = conditions.get("win_payouts", [2.0])
            win_weights = conditions.get("win_weights", [100])
            base_multiplier = random.choices(win_payouts, weights=win_weights)[0]
            final_multiplier = base_multiplier * cost
            winner = Events.SHOOTER_PLAYER
        elif event_type == Events.STANDARD_DRAW:
            draw_payouts = conditions.get("draw_payouts", [1.0])
            draw_weights = conditions.get("draw_weights", [100])
            base_multiplier = random.choices(draw_payouts, weights=draw_weights)[0]
            final_multiplier = base_multiplier * cost
            winner = "DRAW"
        elif event_type == Events.STANDARD_LOSE:
            final_multiplier = 0.0
            winner = Events.SHOOTER_ENEMY
        elif event_type == Events.ANGEL_REVIVE:
            angel_mult = conditions.get("angel_multiplier", 5.0)
            final_multiplier = angel_mult * cost
            winner = Events.SHOOTER_PLAYER
        elif event_type == Events.GROUP_SHOOTOUT:
            group_payouts = conditions.get("group_payouts", [25.0])
            group_weights = conditions.get("group_weights", [100])
            base_multiplier = random.choices(group_payouts, weights=group_weights)[0]
            final_multiplier = base_multiplier * cost
            winner = Events.SHOOTER_PLAYER

        duel_steps = []
        p_hp, e_hp = 100.0, 100.0

        if event_type_visual in [Events.STANDARD_WIN, Events.STANDARD_LOSE, Events.STANDARD_DRAW]:
            turn = Events.SHOOTER_PLAYER if random.random() > 0.5 else Events.SHOOTER_ENEMY
            
            while p_hp > 0 and e_hp > 0 and len(duel_steps) < 12:
                attacker = turn
                is_p_atk = (attacker == Events.SHOOTER_PLAYER)
                zone = self.calc.get_hit_target(is_p_atk, conditions)
                damage = self.calc.calculate_damage(zone, not is_p_atk, conditions)
                
                if winner == Events.SHOOTER_PLAYER and not is_p_atk and p_hp - damage <= 0:
                    zone, damage = Events.TARGET_FAIL, 0.0
                elif winner == Events.SHOOTER_ENEMY and is_p_atk and e_hp - damage <= 0:
                    zone, damage = Events.TARGET_FAIL, 0.0
                elif winner == "DRAW" and ((not is_p_atk and p_hp - damage <= 0) or (is_p_atk and e_hp - damage <= 0)):
                    zone, damage = Events.TARGET_FAIL, 0.0
                
                if zone != Events.TARGET_FAIL:
                    if is_p_atk: e_hp = max(0.0, round(e_hp - damage, 1))
                    else: p_hp = max(0.0, round(p_hp - damage, 1))

                duel_steps.append({"Shooter": attacker, "Target": zone, "PlayerHP": float(p_hp), "EnemyHP": float(e_hp)})
                turn = Events.SHOOTER_ENEMY if turn == Events.SHOOTER_PLAYER else Events.SHOOTER_PLAYER

            if p_hp > 0 and e_hp > 0:
                if winner == Events.SHOOTER_PLAYER:
                    duel_steps.append({"Shooter": Events.SHOOTER_PLAYER, "Target": Events.TARGET_HEAD, "PlayerHP": float(p_hp), "EnemyHP": 0.0})
                elif winner == Events.SHOOTER_ENEMY:
                    duel_steps.append({"Shooter": Events.SHOOTER_ENEMY, "Target": Events.TARGET_HEAD, "PlayerHP": 0.0, "EnemyHP": float(e_hp)})

        elif event_type_visual == Events.ANGEL_REVIVE:
            duel_steps = [
                {"Shooter": Events.SHOOTER_ENEMY, "Target": Events.TARGET_BODY, "PlayerHP": 50.0, "EnemyHP": 100.0},
                {"Shooter": Events.SHOOTER_ENEMY, "Target": Events.TARGET_BODY, "PlayerHP": 0.0, "EnemyHP": 100.0},
                {"Shooter": Events.SHOOTER_ANGEL, "Target": Events.SHOOTER_PLAYER, "PlayerHP": 100.0, "EnemyHP": 100.0},
                {"Shooter": Events.SHOOTER_PLAYER, "Target": Events.TARGET_HEAD, "PlayerHP": 100.0, "EnemyHP": 0.0}
            ]

        elif event_type_visual == Events.GROUP_SHOOTOUT:
            num_enemies = random.randint(5, 8)
            enemies = self.calc.calculate_group_shootout_hp(num_enemies)
            duel_steps.append({"Shooter": Events.SHOOTER_PLAYER, "Target": Events.TARGET_HEAD, "PlayerHP": 100.0, "EnemyHP": 0.0, "enemiesHP": enemies.copy()})

        max_allowed_multiplier = self.config.wincap * cost
        if final_multiplier > max_allowed_multiplier:
            final_multiplier = max_allowed_multiplier

        timeline = {
            "eventType": event_type_visual, 
            "steps": duel_steps, 
            "winner": winner,
            "multiplier": float(final_multiplier) 
        }

        return {
            "id": int(sim + 1),
            "events": [timeline],
            "payoutMultiplier": int(round(final_multiplier * 100))
        }