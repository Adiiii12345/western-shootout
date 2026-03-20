from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import DuelRequest, DuelResponse
from duel_engine import DuelEngine
from fairness import FairnessManager

app = FastAPI(title="Western Shootout API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = DuelEngine()
fm = FairnessManager()

# Kezdő állapot
current_server_seed = fm.generate_server_seed()
# Példa egyenleg (élesben adatbázisból jönne)
user_balance = 1000.0

@app.get("/status")
async def get_status():
    """A frontend inicializálásakor hívódik meg."""
    return {
        "serverSeedHash": fm.hash_server_seed(current_server_seed),
        "status": "ready"
    }

@app.post("/shoot", response_model=DuelResponse)
async def handle_shoot(request: DuelRequest):
    global current_server_seed, user_balance
    
    # 1. Alapvető ellenőrzés
    if user_balance < request.amount:
        raise HTTPException(status_code=400, detail="Nincs elég egyenleg!")

    try:
        # 2. Szimuláció futtatása
        duel_result = engine.simulate_duel(
            server_seed=current_server_seed,
            client_seed=request.clientSeed,
            start_nonce=request.activeNonce,
            bet_config=request.mode.dict()
        )

        # 3. Egyenleg módosítása a szerveren
        # Levonjuk a tétet, hozzáadjuk a nyereményt
        payout = request.baseBet * duel_result["payoutMultiplier"]
        user_balance = user_balance - request.amount + payout

        return {
            "round": {
                "duelSteps": duel_result["duelSteps"],
                "winner": duel_result["winner"],
                "payoutMultiplier": duel_result["payoutMultiplier"]
            },
            "serverSeedHash": fm.hash_server_seed(current_server_seed),
            "newNonce": duel_result["endNonce"],
            "balance": {
                "amount": round(user_balance, 2)
            }
        }

    except Exception as e:
        print(f"Backend hiba: {e}")
        raise HTTPException(status_code=500, detail="Hiba a párbaj generálása közben.")