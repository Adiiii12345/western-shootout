class Distribution:
    def __init__(self, criteria, quota, conditions, win_criteria=None):
        self.criteria = criteria
        self.quota = quota
        self.conditions = conditions
        self.win_criteria = win_criteria

class BetMode:
    def __init__(self, name, cost, rtp, max_win, auto_close_disabled, is_feature, is_buybonus, distributions):
        self.name = name
        self.cost = cost
        self.rtp = rtp
        self.max_win = max_win
        self.auto_close_disabled = auto_close_disabled
        self.is_feature = is_feature
        self.is_buybonus = is_buybonus
        self.distributions = distributions

class GameConfig:
    def __init__(self, game_id: str = "stake_western_95"):
        self.game_id = game_id
        self.wincap = 500.0

        common_conditions = {
            "magnet_multiplier": 1.0,
            "armor_multiplier": 1.0,
            "force_group_shootout": False,
            "force_angel_revive": False,
            "force_wincap": False,
            "win_payouts": [
                0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
                1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0,
                2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
                3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 15.0,
                20.0, 25.0, 30.0, 50.0, 100.0
            ],
            "win_weights": [
                200, 200, 200, 200, 200, 200, 200, 200, 200, 231,
                300, 300, 300, 300, 300, 300, 300, 300, 300, 284,
                390, 390, 390, 355, 300, 300, 300, 300, 300, 300,
                250, 250, 200, 200, 150, 100, 100, 100, 100,  60,
                 50,  40,  30,  20,  10
            ],
            "draw_payouts": [0.1, 0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9],
            "draw_weights": [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
            "angel_multiplier": 5.0,
            "group_payouts": [15.0, 20.0, 25.0, 30.0, 35.0],
            "group_weights": [20, 20, 20, 20, 20]
        }

        self.bet_modes = [
            BetMode(
                name="base", cost=1.0, rtp=0.9600, max_win=self.wincap * 1.0, auto_close_disabled=False, is_feature=False, is_buybonus=False,
                distributions=[
                    Distribution("standard_duel", 0.98398, common_conditions),
                    Distribution("angel_revive", 0.01000, {**common_conditions, "force_angel_revive": True}),
                    Distribution("group_shootout", 0.00600, {**common_conditions, "force_group_shootout": True}),
                    Distribution("wincap", 0.00002, {**common_conditions, "force_wincap": True}, win_criteria=self.wincap)
                ]
            ),
            BetMode(
                name="armor", cost=1.5, rtp=0.9600, max_win=self.wincap * 1.5, auto_close_disabled=False, is_feature=True, is_buybonus=False,
                distributions=[
                    Distribution("standard_duel", 0.98398, common_conditions),
                    Distribution("angel_revive", 0.01000, {**common_conditions, "force_angel_revive": True}),
                    Distribution("group_shootout", 0.00600, {**common_conditions, "force_group_shootout": True}),
                    Distribution("wincap", 0.00002, {**common_conditions, "force_wincap": True}, win_criteria=self.wincap)
                ]
            ),
            BetMode(
                name="magnet", cost=1.8, rtp=0.9600, max_win=self.wincap * 1.8, auto_close_disabled=False, is_feature=True, is_buybonus=False,
                distributions=[
                    Distribution("standard_duel", 0.98398, common_conditions),
                    Distribution("angel_revive", 0.01000, {**common_conditions, "force_angel_revive": True}),
                    Distribution("group_shootout", 0.00600, {**common_conditions, "force_group_shootout": True}),
                    Distribution("wincap", 0.00002, {**common_conditions, "force_wincap": True}, win_criteria=self.wincap)
                ]
            ),
            BetMode(
                name="extreme", cost=2.3, rtp=0.9600, max_win=self.wincap * 2.3, auto_close_disabled=False, is_feature=True, is_buybonus=False,
                distributions=[
                    Distribution("standard_duel", 0.98398, common_conditions),
                    Distribution("angel_revive", 0.01000, {**common_conditions, "force_angel_revive": True}),
                    Distribution("group_shootout", 0.00600, {**common_conditions, "force_group_shootout": True}),
                    Distribution("wincap", 0.00002, {**common_conditions, "force_wincap": True}, win_criteria=self.wincap)
                ]
            )
        ]