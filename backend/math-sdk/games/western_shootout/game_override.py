# backend/math-sdk/games/western_shootout/game_override.py
from src.state.state import GeneralGameState as StakeEngineState
from .game_executables import GameExecutables
from src.calculations.statistics import get_random_outcome

class GameStateOverride(StakeEngineState):
    """
    This class is used to override or extend universal state.py functions.
    e.g: A specific game may have custom book properties to reset
    """

    def __init__(self, config):
        # Az SDK alap State osztályát inicializáljuk
        super().__init__(config)
        self.executables = GameExecutables(self)

    def reset_book(self):
        """Reset game specific properties"""
        super().reset_book()

    def assign_special_sym_function(self):
        pass

    def check_game_repeat(self):
        if not self.repeat:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True

    def get_current_bet_cost(self):
        """Returns the actual cost based on bet mode multipliers"""
        return self.get_current_betmode().cost

    # FONTOS: evaluate_finalwin helyett update_final_win az SDK elvárása szerint
    def update_final_win(self):
        """Ensure final win is calculated in currency units, not just multipliers"""
        super().update_final_win() # Hívjuk az eredeti (wincap validáló) metódust
        
        # Opcionális plusz védelem, ha a final_win már beállt
        if hasattr(self, 'final_win') and self.final_win > self.config.wincap:
            self.final_win = self.config.wincap