import os
import sys
import json
from pathlib import Path

try:
    import zstandard as zstd
except ImportError:
    print("Kérlek telepítsd a zstandard csomagot: pip install zstandard")
    sys.exit(1)

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

game_id = sys.argv[1] if len(sys.argv) > 1 else "western_shootout"
stake_game_id = f"stake_{game_id}_95"

try:
    gamestate_module = __import__(f"games.{game_id}.gamestate", fromlist=["GameState"])
    config_module = __import__(f"games.{game_id}.game_config", fromlist=["GameConfig"])
    GameState = gamestate_module.GameState
    GameConfig = config_module.GameConfig
except ImportError as e:
    print(f"Hiba a játék fájljainak betöltésekor: {e}")
    sys.exit(1)

def generate_math_files():
    config = GameConfig(stake_game_id)
    gamestate = GameState(config)
    
    output_dir = CURRENT_DIR / "games" / stake_game_id / "library" / "publish_files"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    index_data = {"modes": []}
    SIM_COUNT = 1000000
    PROB_WEIGHT = 10000000  # Konstans uint64 érték, az RGS normalizálja

    print(f"Indítás: {stake_game_id} szimuláció, {SIM_COUNT} kör/mód...")

    for mode in config.bet_modes:
        mode_name = mode.name
        gamestate.current_bet_mode = mode
        
        logic_filename = f"books_{mode_name}.jsonl.zst"
        csv_filename = f"lookUpTable_{mode_name}_0.csv"
        
        logic_path = output_dir / logic_filename
        csv_path = output_dir / csv_filename
        
        print(f"[{mode_name.upper()}] Fájlok generálása folyamatban...")
        
        cctx = zstd.ZstdCompressor(level=3)
        with open(logic_path, "wb") as f_logic, open(csv_path, "w", encoding="utf-8") as f_csv:
            with cctx.stream_writer(f_logic) as writer:
                for sim in range(SIM_COUNT):
                    round_data = gamestate.run_spin(sim)
                    
                    json_str = json.dumps(round_data, separators=(',', ':')) + "\n"
                    writer.write(json_str.encode('utf-8'))
                    
                    f_csv.write(f"{round_data['id']},{PROB_WEIGHT},{round_data['payoutMultiplier']}\n")
        
        index_data["modes"].append({
            "name": mode_name,
            "cost": float(mode.cost),
            "events": logic_filename,
            "weights": csv_filename
        })
        
    with open(output_dir / "index.json", "w", encoding="utf-8") as f_index:
        json.dump(index_data, f_index, indent=4)
        
    print(f"\nSikeres generálás! A Stake Engine fájlok helye:\n{output_dir}")

if __name__ == "__main__":
    generate_math_files()