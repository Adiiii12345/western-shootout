# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import DuelRequest, DuelResponse
from duel_engine import DuelEngine
from fairness import FairnessManager
import secrets

app = FastAPI(title="Western Shootout API")

# CORS engedélyezése a frontend felé
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Élesben korlátozd a frontend URL-jére!
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = DuelEngine()
fm = FairnessManager()

# Mock adatbázis a Seed-eknek (Élesben Redis vagy SQL ajánlott)
# Itt generálunk egy kezdeti szerver seedet
current_server_seed = fm.generate_server_seed()

@app.post("/shoot", response_model=DuelResponse)
async def handle_shoot(request: DuelRequest):
    global current_server_seed
    
    try:
        # 1. A párbaj szimulálása a beküldött adatokkal
        # A request.mode tartalmazza a mágnest, páncélt és a célpontot
        duel_result = engine.simulate_duel(
            server_seed=current_server_seed,
            client_seed=request.clientSeed,
            start_nonce=request.activeNonce,
            bet_config=request.mode.dict()
        )

        # 2. Hash generálása a transzparenciához
        # Ezt látja a felhasználó a UI-on
        s_seed_hash = fm.hash_server_seed(current_server_seed)

        # 3. Válasz összeállítása a frontend által elvárt formátumban
        response = {
            "round": {
                "duelSteps": duel_result["duelSteps"],
                "winner": duel_result["winner"],
                "payoutMultiplier": duel_result["payoutMultiplier"]
            },
            "serverSeedHash": s_seed_hash,
            "newNonce": duel_result["endNonce"],
            "balance": {
                "amount": 0 # Itt vonhatod le/adhatod hozzá a pénzt az egyenlegkezelődben
            }
        }

        # MEGJEGYZÉS: Provably Fair rendszereknél a Server Seed-et csak 
        # a ciklus végén (vagy kérésre) cseréljük le és fedjük fel a régit.
        # Ebben a demóban minden lövésnél megtartjuk a folytonosságot a Nonce-al.
        
        return response

    except Exception as e:
        print(f"Hiba a szimuláció során: {e}")
        raise HTTPException(status_code=500, detail="Belső szerverhiba a párbaj során.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)