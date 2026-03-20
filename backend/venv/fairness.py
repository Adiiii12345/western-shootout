import hmac
import hashlib
import secrets

class FairnessManager:
    @staticmethod
    def generate_server_seed() -> str:
        return secrets.token_hex(32)

    @staticmethod
    def hash_server_seed(server_seed: str) -> str:
        return hashlib.sha256(server_seed.encode()).hexdigest()

    @staticmethod
    def get_roll(server_seed: str, client_seed: str, nonce: int) -> float:
        combined_seed = f"{client_seed}:{nonce}".encode()
        hash_result = hmac.new(
            server_seed.encode(), 
            combined_seed, 
            hashlib.sha512
        ).hexdigest()

        # Az első 5 bájt (10 hex karakter) használata a 0-1 közötti számhoz
        # 16^10 = 1,099,511,627,776 (40-bit precizitás)
        index = int(hash_result[:10], 16)
        return index / (16**10)

# Modul szintű teszt (opcionális futtatáshoz)
if __name__ == "__main__":
    fm = FairnessManager()
    s_seed = fm.generate_server_seed()
    c_seed = "lucky-seed"
    n = 0
    
    print(f"Server Seed Hash: {fm.hash_server_seed(s_seed)}")
    print(f"Generated Roll: {fm.get_roll(s_seed, c_seed, n)}")