declare module 'stake-engine-client' {
    export interface BalanceObject {
        amount: number;
        currency?: string;
    }

    export interface AuthenticateResponse {
        balance?: BalanceObject;
        config?: any;
        round?: any;
        status?: any;
    }

    export interface PlayResponse {
        balance?: BalanceObject;
        round?: any;
        status?: any;
    }

    export function authenticate(options?: any): Promise<AuthenticateResponse>;
    
    export function play(options: {
        amount: number;
        mode: string;
        currency?: string;
        sessionID?: string;
        rgsUrl?: string;
    }): Promise<PlayResponse>;

    export const API_AMOUNT_MULTIPLIER: number;
    export const BOOK_AMOUNT_MULTIPLIER: number;
}