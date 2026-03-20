const STORAGE_KEY = 'mock_stake_balance';

const getBalance = (): number => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? parseFloat(saved) : 1000;
};

const saveBalance = (amount: number) => {
    sessionStorage.setItem(STORAGE_KEY, amount.toFixed(2));
};

export const authenticate = async () => {
    return {
        balance: { amount: getBalance(), currency: 'USD' },
        status: { 
            statusCode: 'SUCCESS',
            activeRound: {
                nonce: 0,
                serverSeedHash: "mock_hash_f8a9b2c1"
            }
        }
    };
};

export const play = async (options: { amount: number; baseBet: number; mode: any }) => {
    console.log("[Stub] Play hívva:", options);
    let currentBalance = getBalance();
    
    // 1. Levonjuk a teljes összeget (alaptét + powerup felárak)
    currentBalance -= options.amount;

    const chosenTarget = options.mode.target; // 'PLAYER' vagy 'ENEMY'
    console.log(`[Stub] Fogadás célpontja: ${chosenTarget}`);

    // Párbaj szimuláció adatai
    let pHP = 100;
    let eHP = 100;
    const duelSteps: Array<{
        attacker: 'PLAYER' | 'ENEMY';
        hit: boolean;
        zone: 'HEAD' | 'TORSO' | 'LEG' | 'MISS';
        damage: number;
        pHP: number;
        eHP: number;
    }> = [];

    // Szimuláció futtatása a halálig
    while (pHP > 0 && eHP > 0) {
        // Véletlenszerűen dől el, ki lő éppen (50-50%)
        const turn = Math.random() > 0.5 ? 'PLAYER' : 'ENEMY';
        const isAttackerChosen = (turn === chosenTarget);
        
        // --- MÁGNES LOGIKA JAVÍTÁSA ---
        // Alap találati arány 50%
        let hitRate = 0.5;
        
        // Ha a Mágnes aktív, ÉS az lő, akire fogadtunk, akkor 90% az esélye
        if (options.mode.magnet && isAttackerChosen) {
            console.log(`[Stub] Mágnes hatása: ${turn} 90% eséllyel talál.`);
            hitRate = 0.9;
        }
        
        const isHit = Math.random() < hitRate;
        let zone: 'HEAD' | 'TORSO' | 'LEG' | 'MISS' = 'MISS';
        let damage = 0;

        if (isHit) {
            const zones: ('HEAD' | 'TORSO' | 'LEG')[] = ['HEAD', 'TORSO', 'LEG'];
            zone = zones[Math.floor(Math.random() * zones.length)];
            const victim = (turn === 'PLAYER' ? 'ENEMY' : 'PLAYER');
            const isVictimChosen = (victim === chosenTarget);

            // Alap sebzés kalkuláció
            if (zone === 'HEAD' || zone === 'TORSO') damage = 100;
            else damage = 50; // LEG = 2 lövés

            // --- PÁNCÉL LOGIKA JAVÍTÁSA ---
            // Ha a Páncél aktív, ÉS az kapna sebet, akire fogadtunk, csökkentjük a sebzést
            if (options.mode.armor && isVictimChosen) {
                console.log(`[Stub] Páncél hatása: ${victim} sebzése csökkentve a(z) ${zone} zónán.`);
                if (zone === 'TORSO') damage = 50; // 1 -> 2 lövés kell
                else if (zone === 'LEG') damage = 34; // 2 -> 3 lövés kell
            }

            if (turn === 'PLAYER') eHP = Math.max(0, eHP - damage);
            else pHP = Math.max(0, pHP - damage);
        }

        duelSteps.push({
            attacker: turn,
            hit: isHit,
            zone,
            damage,
            pHP,
            eHP
        });
    }

    const winner = eHP <= 0 ? 'PLAYER' : 'ENEMY';
    const isBetWin = winner === chosenTarget;
    
    // Nyeremény: Csak az alaptét 2-szerese (powerup fee elveszik)
    const multiplier = isBetWin ? 2.0 : 0;
    const winAmount = options.baseBet * multiplier;
    const newBalance = currentBalance + winAmount;

    saveBalance(newBalance);

    console.log(`[Stub] Párbaj vége. Győztes: ${winner}, Fogadás: ${chosenTarget}, Eredmény: ${isBetWin ? 'NYERT' : 'VESZTETT'}`);

    return {
        balance: { amount: newBalance, currency: 'USD' },
        round: { 
            payoutMultiplier: multiplier,
            duelSteps,
            winner,
            nonce: Math.floor(Math.random() * 1000),
            serverSeedHash: "mock_hash_" + Math.random().toString(16).slice(2, 10)
        },
        status: { statusCode: 'SUCCESS' }
    };
};