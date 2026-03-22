from pathlib import Path
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.config import BetMode

class GameConfig(Config):
    def __init__(self, game_id: str = "stake_western_95"):
        super().__init__()
        self.game_id = game_id
        
        current_dir = Path(__file__).resolve().parent
        lib_dir = current_dir / "library"
        
        self.library_path = str(lib_dir)
        self.config_path = str(lib_dir / "configs")
        self.book_path = str(lib_dir / "books")
        self.force_path = str(lib_dir / "forces")
        self.lut_path = str(lib_dir / "lookup_tables")
        
        for p in [self.config_path, self.book_path, self.force_path, self.lut_path]:
            Path(p).mkdir(parents=True, exist_ok=True)

        self.provider_number = 0
        self.working_name = "Western Shootout"
        self.wincap = 500.0
        self.win_type = "other"
        self.rtp = 0.9536
        
        self.construct_paths(self.game_id)

        self.num_reels = 0
        self.num_rows = []

        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="standard_duel",
                        quota=0.999,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.0,
                            "armor_multiplier": 1.0,
                            "force_group_shootout": False,
                            "force_wincap": False
                        },
                    ),
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.0,
                            "armor_multiplier": 1.0,
                            "force_group_shootout": False,
                            "force_wincap": True
                        },
                    ),
                ],
            ),
            BetMode(
                name="armor",
                cost=1.5,
                rtp=0.9576,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="standard_duel",
                        quota=0.999,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.0,
                            "armor_multiplier": 0.5,
                            "force_group_shootout": False,
                            "force_wincap": False
                        },
                    ),
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.0,
                            "armor_multiplier": 0.5,
                            "force_group_shootout": False,
                            "force_wincap": True
                        },
                    ),
                ],
            ),
            BetMode(
                name="magnet",
                cost=1.8,
                rtp=0.9556,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="standard_duel",
                        quota=0.999,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.5,
                            "armor_multiplier": 1.0,
                            "force_group_shootout": False,
                            "force_wincap": False
                        },
                    ),
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.5,
                            "armor_multiplier": 1.0,
                            "force_group_shootout": False,
                            "force_wincap": True
                        },
                    ),
                ],
            ),
            BetMode(
                name="extreme",
                cost=2.3,
                rtp=0.9580,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="group_shootout",
                        quota=0.10,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.5,
                            "armor_multiplier": 0.5,
                            "force_group_shootout": True,
                            "min_enemies": 3,
                            "max_enemies": 6,
                            "force_wincap": False
                        },
                    ),
                    Distribution(
                        criteria="standard_duel",
                        quota=0.899,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.5,
                            "armor_multiplier": 0.5,
                            "force_group_shootout": False,
                            "force_wincap": False
                        },
                    ),
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {},
                            "rtp_step": 0,
                            "magnet_multiplier": 1.5,
                            "armor_multiplier": 0.5,
                            "force_group_shootout": True,
                            "min_enemies": 5,
                            "max_enemies": 6,
                            "force_wincap": True
                        },
                    ),
                ],
            ),
        ]