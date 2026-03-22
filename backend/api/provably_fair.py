import hashlib
import hmac
import secrets

class ProvablyFair:
    def __init__(self):
        self.server_seed = secrets.token_hex(32)
        self.next_server_seed = secrets.token_hex(32)
        self.client_seed = "default_client_seed"
        self.nonce = 0

    def get_server_seed(self):
        """Visszaadja az aktuális szerver seed-et."""
        return self.server_seed

    def get_current_state(self):
        return {
            "server_seed_hash": self.get_current_server_seed_hash(),
            "client_seed": self.client_seed,
            "nonce": self.nonce
        }

    def get_current_server_seed_hash(self):
        return hashlib.sha256(self.server_seed.encode()).hexdigest()

    def rotate_server_seed(self):
        """
        Kicseréli a szerver seed-et a következőre, generál egy újat,
        nullázza a nonce-ot, és visszaadja az új seed hash-ét.
        """
        self.server_seed = self.next_server_seed
        self.next_server_seed = secrets.token_hex(32)
        self.nonce = 0
        return self.get_current_server_seed_hash()

    def generate_result(self, server_seed: str, client_seed: str, nonce: int) -> float:
        """
        HMAC-SHA512 alapú véletlenszám generálás.
        A kimenet egy egyenletes eloszlású float [0, 1) között.
        """
        combined_message = f"{client_seed}:{nonce}:0"
        
        hash_result = hmac.new(
            server_seed.encode(),
            combined_message.encode(),
            hashlib.sha512
        ).hexdigest()

        # Az első 8 karakter (32 bit) konvertálása
        # Az osztó 0x100000000 (2^32), hogy az eredmény szigorúan < 1.0 legyen
        return int(hash_result[:8], 16) / 0x100000000

    def verify_result(self, server_seed: str, client_seed: str, nonce: int, result_float: float) -> bool:
        calculated = self.generate_result(server_seed, client_seed, nonce)
        return abs(calculated - result_float) < 1e-10