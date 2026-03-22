from src.executables.executables import Executables
from .game_calculations import GameCalculations

class GameExecutables(Executables):
    def __init__(self, gamestate):
        super().__init__(gamestate.config)
        self.gamestate = gamestate
        self.calculations = GameCalculations(gamestate)

    def assign_special_sym_function(self):
        pass

    def run_spin(self, sim):
        pass

    def run_freespin(self):
        pass