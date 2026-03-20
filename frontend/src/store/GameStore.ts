import { writable, derived } from 'svelte/store';

const savedBalance = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('mock_stake_balance') : null;
const initialBalance = savedBalance ? parseFloat(savedBalance) : 1000;

export const currentBalance = writable<number>(initialBalance);
export const gameState = writable<'IDLE' | 'SHOOTING' | 'RESULT' | 'COOLDOWN'>('IDLE');
export const duelCooldown = writable<number>(0);
export const baseBet = writable<number>(5.0);
export const isMagnetActive = writable<boolean>(false);
export const isArmorActive = writable<boolean>(false);

export const playerHP = writable<number>(100);
export const enemyHP = writable<number>(100);
export const selectedTarget = writable<'PLAYER' | 'ENEMY'>('ENEMY');

export const serverSeedHash = writable<string>("Ismeretlen");
export const clientSeed = writable<string>("lucky-seed");
export const currentNonce = writable<number>(0);

export const betHistory = writable<Array<{
    id: string;
    time: string;
    bet: number;
    multiplier: number;
    payout: number;
    target: string;
}>>([]);

currentBalance.subscribe(value => {
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('mock_stake_balance', value.toString());
    }
});

export const totalBet = derived(
    [baseBet, isMagnetActive, isArmorActive],
    ([$base, $magnet, $armor]) => {
        let feeMultiplier = 1.0;
        if ($magnet) feeMultiplier += 0.50;
        if ($armor) feeMultiplier += 0.25;
        return Number(($base * feeMultiplier).toFixed(2));
    }
);

export const potentialPayout = derived(
    [baseBet],
    ([$base]) => Number(($base * 2).toFixed(2))
);

export const currentBetMode = derived(
    [isMagnetActive, isArmorActive, selectedTarget],
    ([$magnet, $armor, $target]) => ({
        magnet: $magnet,
        armor: $armor,
        target: $target
    })
);

export function resetHP() {
    playerHP.set(100);
    enemyHP.set(100);
}

export function setTotalBetManually(newTotal: number) {
    baseBet.set(Number(newTotal.toFixed(2)));
}