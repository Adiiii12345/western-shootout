import { 
    gameState, 
    playerHP, 
    enemyHP, 
    multiEnemiesHP, 
    currentRound, 
    spendBullet,
    resetDuelState,
    betHistory,
    currentBetMode
} from '../store/GameStore';
import { get } from 'svelte/store';
import { gameEngine } from './GameEngine';
import { miniGameEngine } from './MiniGameEngine';
import { stakeClient } from '../api/StakeClient';
import type { DuelResponse, RgsEvent, DuelTimeline } from '../types/rgs-schema';

class SequencePlayer {
    private isPlaying = false;

    private log(message: string) {
        console.log(`%c[SequencePlayer]%c ${message}`, 'color: #f1c40f; font-weight: bold', 'color: #ccc');
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async play(data: DuelResponse) {
        if (this.isPlaying) return;
        
        // 1. Az események kinyerése az RGS 'events' tömbből
        const winEvent = data.events?.find((e: RgsEvent) => e.round_data !== undefined);
        const timeline = winEvent?.round_data;

        if (!timeline || !timeline.steps) {
            console.error("[SequencePlayer] Érvénytelen válasz struktúra (Nincs round_data):", data);
            gameState.set('IDLE');
            return;
        }
        
        this.isPlaying = true;

        try {
            const steps = timeline.steps;
            this.log(`Indítás: ${timeline.eventType} | Lépések száma: ${steps.length}`);
            
            // 2. Előkészítés
            gameEngine.cleanup();
            resetDuelState();
            gameState.set('SHOOTING');

            // 3. Csoportos lövöldözés inicializálása ha szükséges
            if (timeline.eventType === 'GROUP_SHOOTOUT') {
                const firstWithEnemies = steps.find(s => s.enemiesHP);
                if (firstWithEnemies?.enemiesHP) {
                    multiEnemiesHP.set(firstWithEnemies.enemiesHP);
                    await miniGameEngine.setupGroupShootout(firstWithEnemies.enemiesHP);
                }
            }

            // 4. Lépések lejátszása
            let playerShotCount = 0;
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];

                // Körök kezelése: minden játékos lövésnél léptetjük a hengert
                if (step.Shooter === 'PLAYER') {
                    playerShotCount++;
                    currentRound.set(playerShotCount);
                }

                try {
                    // Megvárjuk az aktuális lépés animációját
                    await this.processStep(step, timeline.eventType);
                } catch (stepError) {
                    console.warn("[SequencePlayer] Hiba egy lépésnél, de folytatjuk:", stepError);
                }

                // Rövid szünet a lépések között a láthatóságért
                await this.delay(400);
            }

            this.log(`Párbaj vége. Győztes: ${timeline.winner}`);
            
            // 5. Eredmény megjelenítése és kör lezárása
            await this.handleResult(data, timeline);

        } catch (error) {
            console.error("[SequencePlayer] Kritikus hiba a lejátszás során:", error);
            gameEngine.showResultText("Rendszerhiba", 0xffffff);
            await this.delay(2000);
            gameState.set('IDLE');
        } finally {
            this.isPlaying = false;
        }
    }

    private async processStep(step: any, eventType: string) {
        const shooter = step.Shooter;
        const targetZone = step.Target;
        const isPlayerAttacking = shooter === 'PLAYER';
        const isAngel = shooter === 'ANGEL';
        const isHit = targetZone !== 'FAIL';

        // 1. Töltény elhasználása vizuálisan a RevolverUI-ban
        if (isPlayerAttacking) {
            const currentR = get(currentRound);
            spendBullet(currentR - 1);
        }

        // 2. Animáció kiválasztása és lejátszása
        if (isAngel) {
            await miniGameEngine.playAngelSequence();
        } else if (eventType === 'GROUP_SHOOTOUT') {
            await miniGameEngine.handleGroupStep(step);
        } else {
            await gameEngine.playShootSequence(shooter, 'TARGET', isHit, targetZone);
        }

        // 3. Store-ok és HP csíkok frissítése az animáció UTÁN
        if (step.PlayerHP !== undefined) {
            playerHP.set(step.PlayerHP);
        }
        if (step.EnemyHP !== undefined) {
            enemyHP.set(step.EnemyHP);
        }
        
        // HP vizuális szinkronizálása
        gameEngine.updateHPVisuals(get(playerHP), get(enemyHP));

        // Több ellenség esetén az ő HP-jukat is frissítjük
        if (step.enemiesHP) {
            multiEnemiesHP.set(step.enemiesHP);
        }
    }

    private async handleResult(data: DuelResponse, timeline: DuelTimeline) {
        const { payout, bet, multiplier } = data;
        
        // Előzmények mentése (A játékmódot mentjük a célpont helyett)
        betHistory.update(history => [
            {
                id: Math.random().toString(36).substring(2, 9),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                mode: get(currentBetMode),
                bet: bet,
                multiplier: multiplier,
                payout: payout
            },
            ...history
        ].slice(0, 50));

        // Vizuális eredmény szöveg
        if (timeline.winner === 'PLAYER') {
            gameEngine.showResultText(`GYŐZELEM!\n$${payout.toFixed(2)}`, 0x2ecc71);
        } else if (timeline.winner === 'DRAW') {
            gameEngine.showResultText(`DÖNTETLEN\n$${payout.toFixed(2)}`, 0xf1c40f);
        } else {
            gameEngine.showResultText("VESZTETTÉL!", 0xe74c3c);
        }

        gameState.set('RESULT');

        // Stake RGS Standard: Kör lezárása a backend felé, ha van kifizetés
        if (payout > 0) {
            try {
                await stakeClient.endRound(payout);
            } catch (e) {
                console.error("[SequencePlayer] Hiba a kör lezárásakor", e);
            }
        }
        
        // Várunk, hogy a játékos lássa az eredményt
        await this.delay(2500);
        
        // Visszaállunk alapállapotba
        gameState.set('IDLE');
        gameEngine.cleanupResultText();
    }
}

export const sequencePlayer = new SequencePlayer();