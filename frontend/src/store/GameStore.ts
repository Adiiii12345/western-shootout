import { writable, derived } from 'svelte/store';

const savedBalance = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('mock_stake_balance') : null;
const initialBalance = savedBalance ? parseFloat(savedBalance) : 1000;

export const currentBalance = writable<number>(initialBalance);
export const gameState = writable<'IDLE' | 'SHOOTING' | 'RESULT' | 'COOLDOWN'>('IDLE');
export const duelCooldown = writable<number>(0);
export const baseBet = writable<number>(1.0);

export const isMagnetActive = writable<boolean>(false);
export const isArmorActive = writable<boolean>(false);

export const chambers = writable<boolean[]>([true, true, true, true, true, true]);
export const currentRound = writable<number>(1);
export const showRevolver = writable<boolean>(true);

export const playerHP = writable<number>(100);
export const enemyHP = writable<number>(100);
export const multiEnemiesHP = writable<Record<string, number>>({});

export const serverSeedHash = writable<string>("Ismeretlen");
export const previousServerSeed = writable<string | null>(null);
export const clientSeed = writable<string>("lucky-seed");
export const currentNonce = writable<number>(0);

export const betHistory = writable<Array<{
    id: string;
    time: string;
    mode: string;
    bet: number;
    multiplier: number;
    payout: number;
}>>([]);

currentBalance.subscribe(value => {
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('mock_stake_balance', value.toString());
    }
});

// Total Bet kiszámítása a költségszorzók alapján (a game_config.py szerint)
export const totalBet = derived(
    [baseBet, isMagnetActive, isArmorActive],
    ([$base, $magnet, $armor]) => {
        let multiplier = 1.0;
        if ($magnet && $armor) multiplier = 2.3;
        else if ($magnet) multiplier = 1.8;
        else if ($armor) multiplier = 1.5;
        
        return Number(($base * multiplier).toFixed(2));
    }
);

// Potenciális Max Win a config wincap (500x) alapján
export const potentialMaxWin = derived(
    [totalBet],
    ([$total]) => Number(($total * 500).toFixed(2))
);

// Játékmód meghatározása a flag-ek alapján
export const currentBetMode = derived(
    [isMagnetActive, isArmorActive],
    ([$magnet, $armor]) => {
        if ($magnet && $armor) return 'extreme';
        if ($magnet) return 'magnet';
        if ($armor) return 'armor';
        return 'base';
    }
);

export function resetDuelState() {
    playerHP.set(100);
    enemyHP.set(100);
    multiEnemiesHP.set({});
    chambers.set([true, true, true, true, true, true]);
    currentRound.set(1);
    showRevolver.set(true);
}

export function spendBullet(index: number) {
    chambers.update(c => {
        const newChambers = [...c];
        if (index >= 0 && index < 6) newChambers[index] = false;
        return newChambers;
    });
}

export function setTotalBetManually(newTotal: number) {
    baseBet.set(Number(newTotal.toFixed(2)));
}