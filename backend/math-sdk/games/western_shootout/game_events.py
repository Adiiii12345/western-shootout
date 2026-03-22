class WesternShootoutEvents:
    # Timeline EventTypes (round szintű kimenetek)
    STANDARD_WIN = "STANDARD_WIN"
    STANDARD_LOSE = "STANDARD_LOSE"
    STANDARD_DRAW = "STANDARD_DRAW"
    ANGEL_REVIVE = "ANGEL_REVIVE"
    GROUP_SHOOTOUT = "GROUP_SHOOTOUT"

    # Shooter típusok
    SHOOTER_PLAYER = "PLAYER"
    SHOOTER_ENEMY = "ENEMY"
    SHOOTER_ANGEL = "ANGEL"

    # Target (találati zónák és rontás)
    TARGET_HEAD = "HEAD"
    TARGET_BODY = "BODY"
    TARGET_LEGS = "LEGS"
    TARGET_FAIL = "FAIL"