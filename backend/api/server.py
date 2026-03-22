from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from rgs_reader import rgs_reader
from provably_fair import ProvablyFair

app = FastAPI(title="Western Shootout RGS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Fejlesztési környezetben engedékenyebb
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PFState:
    def __init__(self):
        self.engine = ProvablyFair()
        self.client_seed = "default_client_seed"
        self.nonce = 0

pf = PFState()

class PlayRequest(BaseModel):
    bet: float = Field(..., gt=0)
    base_bet: float = Field(..., gt=0)
    mode: str
    client_seed: Optional[str] = None

class EndRoundRequest(BaseModel):
    # A Stake RGS architektúrában az end-round zárja le az aktív kört
    pass

@app.get("/status")
async def get_status():
    return {
        "status": "ready",
        "server_seed_hash": pf.engine.get_current_server_seed_hash(),
        "nonce": pf.nonce,
        "client_seed": pf.client_seed
    }

@app.post("/rotate-seed")
async def rotate_seed():
    old_seed = getattr(pf.engine, 'server_seed', getattr(pf.engine, 'current_server_seed', None))
    new_hash = pf.engine.rotate_server_seed()
    pf.nonce = 0
    
    return {
        "old_server_seed": old_seed,
        "new_server_seed_hash": new_hash,
        "nonce": pf.nonce
    }

@app.post("/play")
async def play(req: PlayRequest):
    pf.nonce += 1
    if req.client_seed:
        pf.client_seed = req.client_seed

    current_server_seed = getattr(pf.engine, 'server_seed', getattr(pf.engine, 'current_server_seed', None))

    # RNG (0.0 - 1.0) generálása a Provably Fair motorral
    result_float = pf.engine.generate_result(
        current_server_seed,
        pf.client_seed,
        pf.nonce
    )
    
    # Sor lekérése az rgs_reader segítségével (ami már a súlytáblát használja)
    outcome = rgs_reader.get_row_by_float(req.mode, result_float)
    
    if not outcome:
        raise HTTPException(status_code=500, detail=f"Mode '{req.mode}' simulation failed or not found.")

    # A data_format.md alapján a payoutMultiplier 100-as bázisú int (pl. 250 = 2.5x)
    payout_multiplier_int = outcome.get("payoutMultiplier", 0)
    multiplier_float = payout_multiplier_int / 100.0
    
    # A frontend a teljes events tömböt várja az animációkhoz
    events = outcome.get("events", [])

    return {
        "bet": req.bet,
        "multiplier": multiplier_float,
        "payout": round(req.bet * multiplier_float, 2), # Kifizetés = összköltség (bet) * szorzó
        "events": events,
        "server_seed_hash": pf.engine.get_current_server_seed_hash(),
        "nonce": pf.nonce,
        "result_float": result_float
    }

@app.post("/end-round")
async def end_round(req: EndRoundRequest):
    """
    A Stake keretrendszerben a nyertes köröket manuálisan le kell zárni 
    a kifizetés jóváírásához (ha auto_close_disabled=False, de frontendről ez a standard hívás).
    """
    return {"status": "success", "message": "Round closed successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)