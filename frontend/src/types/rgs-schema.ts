export type AttackerType = 'PLAYER' | 'ENEMY' | 'ANGEL' | string;
export type HitZone = 'HEAD' | 'BODY' | 'LEGS' | 'FAIL' | string; // 'LEG' javítva 'LEGS'-re
export type GameEventType = 'STANDARD_WIN' | 'STANDARD_LOSE' | 'STANDARD_DRAW' | 'GROUP_SHOOTOUT' | 'ANGEL_REVIVE';
export type DuelWinner = 'PLAYER' | 'ENEMY' | 'DRAW' | 'NONE';

export interface DuelStep {
    Shooter: AttackerType;
    Target: HitZone;
    PlayerHP: number;
    EnemyHP: number;
    enemiesHP?: Record<string, number>;
    isRevive?: boolean;
}

export interface DuelTimeline {
    eventType: GameEventType;
    winner: DuelWinner;
    steps: DuelStep[];
}

// Az RGS matematikai motor eseménye (events tömb eleme)
export interface RgsEvent {
    index?: number;
    type?: string;
    numberRolled?: number;
    finalMultiplier?: number;
    round_data?: DuelTimeline; 
    [key: string]: any; // Bármilyen egyéb mező, amit az RGS küldhet
}

export interface DuelResponse {
    bet: number;
    multiplier: number;
    payout: number;
    events: RgsEvent[]; // A 'round' lecserélve a hivatalos 'events' tömbre
    server_seed_hash: string;
    nonce: number;
    result_float?: number;
}

export interface GameStatus {
    status: string;
    server_seed_hash: string;
    nonce: number;
    client_seed: string;
}