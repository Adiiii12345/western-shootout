import { currentBalance, serverSeedHash, currentNonce, clientSeed } from '../store/GameStore';
import { get } from 'svelte/store';

export class StakeClient {
    private readonly BASE_URL = 'http://localhost:8000';

    public async initialize() {
        // Inicializálásnál lekérhetjük az alapértelmezett serverSeedHash-t
        // Mivel a backend main.py-ban a hash csak a /shoot után jön vissza alapból, 
        // egy üres kéréssel vagy egy dedikált /status végponttal szinkronizálhatunk.
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

            // Az egyenleget a GameEngine.ts handleShootResult-ja fogja frissíteni a data.balance alapján,
            // de itt is elvégezhetjük a biztonság kedvéért, ha a backend küld adatot.
            if (data.balance?.amount !== undefined && data.balance.amount > 0) {
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