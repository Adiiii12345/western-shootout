import { currentBalance, serverSeedHash, currentNonce, clientSeed } from '../store/GameStore';
import { get } from 'svelte/store';

export class StakeClient {
    private readonly BASE_URL = 'http://localhost:8000';

    public async initialize() {
        // Inicializálásnál lekérhetjük az alapértelmezett állapotot
        try {
            const response = await fetch(`${this.BASE_URL}/status`);
            if (response.ok) {
                const data = await response.json();
                if (data.serverSeedHash) serverSeedHash.set(data.serverSeedHash);
            }
        } catch (e) {
            console.warn("Backend nem elérhető inicializáláskor, default értékek használata.");
        }
        return { status: "ready" };
    }

    public async shoot(totalBet: number, baseBet: number, mode: any) {
        try {
            const payload = {
                amount: totalBet,
                baseBet: baseBet,
                clientSeed: get(clientSeed),
                activeNonce: get(currentNonce),
                mode: {
                    magnet: mode.magnet,
                    armor: mode.armor,
                    target: mode.target
                }
            };

            const response = await fetch(`${this.BASE_URL}/shoot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Hiba a szerver oldali párbaj során');
            }

            const data = await response.json();

            // Store-ok frissítése a backend válasza alapján
            if (data.serverSeedHash) {
                serverSeedHash.set(data.serverSeedHash);
            }

            if (data.newNonce !== undefined) {
                currentNonce.set(data.newNonce);
            }

            // Ha a backend küld balance-ot, frissítjük
            if (data.balance?.amount !== undefined) {
                currentBalance.set(data.balance.amount);
            }

            return data;
        } catch (error) {
            console.error("Stake API Error:", error);
            throw error;
        }
    }
}

export const stakeClient = new StakeClient();