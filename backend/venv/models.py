# models.py
from pydantic import BaseModel, Field
from typing import List, Optional

class BetConfig(BaseModel):
    magnet: bool
    armor: bool
    target: str = Field(..., pattern="^(PLAYER|ENEMY)$")

class DuelRequest(BaseModel):
    amount: float = Field(..., gt=0)
    baseBet: float = Field(..., gt=0)
    clientSeed: str
    activeNonce: int
    mode: BetConfig

class DuelStep(BaseModel):
    attacker: str
    hit: bool
    zone: str
    damage: float
    pHP: float
    eHP: float

class DuelResponse(BaseModel):
    round: dict = Field(description="A párbaj részletei: duelSteps, winner, payoutMultiplier")
    balance: Optional[dict] = None
    serverSeedHash: str
    newNonce: int

# Megjegyzés: A 'round' belső szerkezete a duel_engine.py kimenetéhez igazodik:
# {
#   "duelSteps": List[DuelStep],
#   "winner": str,
#   "payoutMultiplier": float
# }