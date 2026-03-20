export type GameStateType = 'IDLE' | 'SHOOTING' | 'RESULT';

export type BetMode = 'base' | 'magnet_active' | 'armor_active' | 'magnet_armor_active';

export type HitLocation = 'head' | 'body' | 'legs' | 'miss';

export interface ShootoutEvent {
    hitLocation: HitLocation;
    isCritical: boolean;
    damage: number;
    multiplierApplied: number;
    payout: number;
}

export interface GameRoundResult {
    payoutMultiplier: number;
    payoutAmount: number;
    events: ShootoutEvent[];
    isWin: boolean;
}