import { Application, Container, Graphics, Text, BlurFilter, AnimatedSprite } from 'pixi.js';
import { gameState, currentBalance, betHistory, playerHP, enemyHP, selectedTarget, isMagnetActive, isArmorActive, duelCooldown } from '../store/GameStore';
import { assetLoader } from './AssetLoader';
import { get } from 'svelte/store';

class GameEngine {
    private app: Application;
    private mainContainer: Container;
    private uiContainer: Container;
    private worldContainer: Container;
    private player!: AnimatedSprite;
    private enemy!: Graphics;
    private playerHPBar!: Graphics;
    private enemyHPBar!: Graphics;
    private playerHPText!: Text;
    private enemyHPText!: Text;
    private powerupContainer: Container;
    private magnetIcon?: Graphics;
    private armorIcon?: Graphics;
    private hitZoneText?: Text;
    private hasDrawnGun = false;
    private isProcessingDuel = false;

    constructor() {
        this.app = new Application();
        this.mainContainer = new Container();
        this.worldContainer = new Container();
        this.powerupContainer = new Container();
        this.uiContainer = new Container();
    }

    private log(step: string, message: string) {
        console.log(`%cGameEngine.ts %c${step}/18: ${message}`, 'color: #888', 'color: #3498db; font-weight: bold');
    }

    public async initialize(canvas: HTMLCanvasElement) {
        await this.app.init({
            canvas: canvas,
            width: 1280,
            height: 720,
            backgroundColor: 0x1e1e1e,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        this.app.stage.addChild(this.mainContainer);
        this.mainContainer.addChild(this.worldContainer);
        this.mainContainer.addChild(this.powerupContainer);
        this.mainContainer.addChild(this.uiContainer);

        await assetLoader.initialize();
        this.setupScene();
        this.log("1", "Motor inicializálva, eszközök betöltve.");
    }

    private setupScene() {
        const bg = new Graphics().rect(0, 0, 1280, 720).fill(0x2c3e50);
        this.worldContainer.addChild(bg);

        const ground = new Graphics().rect(0, 550, 1280, 170).fill(0x7e4b1e);
        this.worldContainer.addChild(ground);

        this.createCharacters();
        this.createHPBars();
    }

    private createCharacters() {
        const idleTextures = assetLoader.getHeroTextures('idle');
        this.player = new AnimatedSprite(idleTextures);
        this.player.animationSpeed = 0.12;
        this.player.scale.set(3.5);
        this.player.anchor.set(0.5, 1);
        this.player.x = 250;
        this.player.y = 550;
        this.player.play();
        this.worldContainer.addChild(this.player);

        this.enemy = new Graphics().rect(-30, -120, 60, 120).fill(0xe74c3c);
        this.enemy.x = 1020;
        this.enemy.y = 550;
        this.worldContainer.addChild(this.enemy);
    }

    private playAnimation(name: 'idle' | 'draw_and_shoot' | 'consecutive_shoot' | 'gun_out_idle' | 'death', loop: boolean = true) {
        const tex = assetLoader.getHeroTextures(name);
        if (tex && tex.length > 0) {
            this.player.textures = tex;
            this.player.loop = loop;
            this.player.animationSpeed = (name === 'idle' || name === 'gun_out_idle') ? 0.12 : 0.15;
            this.player.gotoAndPlay(0);
        }
    }

    private createHPBars() {
        const pBg = new Graphics().rect(150, 380, 160, 15).fill({ color: 0x000000, alpha: 0.5 });
        this.worldContainer.addChild(pBg);
        this.playerHPBar = new Graphics();
        this.worldContainer.addChild(this.playerHPBar);

        this.playerHPText = new Text({
            text: "100/100",
            style: { fill: 0xffffff, fontSize: 14, fontWeight: 'bold', stroke: { color: 0x000000, width: 3 } }
        });
        this.playerHPText.x = 150;
        this.playerHPText.y = 360;
        this.worldContainer.addChild(this.playerHPText);

        const eBg = new Graphics().rect(970, 380, 160, 15).fill({ color: 0x000000, alpha: 0.5 });
        this.worldContainer.addChild(eBg);
        this.enemyHPBar = new Graphics();
        this.worldContainer.addChild(this.enemyHPBar);

        this.enemyHPText = new Text({
            text: "100/100",
            style: { fill: 0xffffff, fontSize: 14, fontWeight: 'bold', stroke: { color: 0x000000, width: 3 } }
        });
        this.enemyHPText.x = 1075;
        this.enemyHPText.y = 360;
        this.worldContainer.addChild(this.enemyHPText);

        this.updateHPVisuals(100, 100);
    }

    private updateHPVisuals(pVal: number, eVal: number) {
        this.playerHPBar.clear();
        this.playerHPBar.rect(150, 380, Math.max(0, (pVal / 100) * 160), 15).fill(0x2ecc71);
        this.playerHPText.text = `${Math.ceil(pVal)}/100`;

        this.enemyHPBar.clear();
        this.enemyHPBar.rect(970, 380, Math.max(0, (eVal / 100) * 160), 15).fill(0x2ecc71);
        this.enemyHPText.text = `${Math.ceil(eVal)}/100`;
    }

    public updateVisualsFromStores() {
        const config = {
            magnet: get(isMagnetActive),
            armor: get(isArmorActive),
            target: get(selectedTarget)
        };
        this.renderPowerups(config);
    }

    private renderPowerups(config: { magnet: boolean, armor: boolean, target: 'PLAYER' | 'ENEMY' }) {
        this.powerupContainer.removeChildren();
        
        if (config.armor) {
            const armorTarget = config.target === 'PLAYER' ? this.player : this.enemy;
            this.armorIcon = new Graphics()
                .rect(-40, -140, 80, 150)
                .fill({ color: 0x3498db, alpha: 0.4 })
                .stroke({ width: 4, color: 0xffffff, alpha: 0.8 });
            this.armorIcon.x = armorTarget.x;
            this.armorIcon.y = armorTarget.y;
            this.powerupContainer.addChild(this.armorIcon);
        }

        if (config.magnet) {
            const isTargetPlayer = config.target === 'PLAYER';
            const magnetX = isTargetPlayer ? 970 + 40 : 150 + 40; 
            const magnetY = 325;

            this.magnetIcon = new Graphics()
                .rect(0, 0, 80, 30)
                .fill(0x95a5a6)
                .stroke({ width: 3, color: 0xf1c40f });
            
            const magnetText = new Text({ 
                text: "MAGNET", 
                style: { fill: 0x000000, fontSize: 12, fontWeight: 'bold' }
            });
            magnetText.x = 12;
            magnetText.y = 6;
            this.magnetIcon.addChild(magnetText);
            
            this.magnetIcon.x = magnetX;
            this.magnetIcon.y = magnetY;
            this.powerupContainer.addChild(this.magnetIcon);
        }
    }

    public async handleShootResult(response: any, betAmount: number, activePowerups: { magnet: boolean, armor: boolean, target: 'PLAYER' | 'ENEMY' }) {
        if (!this.player || !this.enemy || this.isProcessingDuel) return;
        
        this.isProcessingDuel = true;
        this.log("2", "Párbaj szekvencia indítása.");
        gameState.set('SHOOTING');

        currentBalance.update(b => b - betAmount);
        this.log("15", "Tét levonva az egyenlegből (vizuális commit).");

        this.cleanupDuel(true); 
        this.renderPowerups(activePowerups);
        playerHP.set(100);
        enemyHP.set(100);
        this.updateHPVisuals(100, 100);
        this.log("3", "Életerő és vizuális állapotok alaphelyzetbe állítva.");

        const steps = response.round.duelSteps;
        const bulletPromises: Promise<void>[] = [];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const isPlayerAttacking = step.attacker === 'PLAYER';
            this.log("4", `Lépés ${i + 1}/${steps.length} indítása. Támadó: ${step.attacker}`);
            
            if (isPlayerAttacking) {
                const anim = !this.hasDrawnGun ? 'draw_and_shoot' : 'consecutive_shoot';
                this.log("5", `Játékos animáció indítva: ${anim}`);
                
                if (!this.hasDrawnGun) {
                    this.playAnimation('draw_and_shoot', false);
                    this.hasDrawnGun = true;
                } else {
                    this.playAnimation('consecutive_shoot', false);
                }

                await new Promise<void>(resolve => {
                    const timeout = setTimeout(resolve, 1000);
                    const sync = (frame: number) => {
                        const targetFrame = (this.player.textures.length === 9) ? 6 : 3; 
                        if (frame >= targetFrame) {
                            this.player.onFrameChange = undefined;
                            clearTimeout(timeout);
                            this.log("6", `Lövés frame (index ${targetFrame}) elérve.`);
                            resolve();
                        }
                    };
                    this.player.onFrameChange = sync;
                });
            }

            const startX = isPlayerAttacking ? 320 : 980;
            const startY = 480;
            const endX = isPlayerAttacking ? 1020 : 250;
            let endY = 480;

            if (step.hit) {
                if (step.zone === 'HEAD') endY = 440;
                if (step.zone === 'LEG') endY = 530;
            } else {
                endY = 300;
            }

            this.playMuzzleFlash(startX, startY);
            this.log("7", "Torkolattűz megjelenítve.");
            
            const bulletPromise = this.fireBullet(startX, startY, endX, endY);
            this.log("8", "Lövedék elindítva (500ms út).");
            bulletPromises.push(bulletPromise);

            bulletPromise.then(() => {
                this.log("9", "Lövedék becsapódott.");
                if (step.hit) {
                    const target = isPlayerAttacking ? this.enemy : this.player;
                    target.alpha = 0.5;
                    setTimeout(() => { if (!target.destroyed) target.alpha = 1; }, 40);
                    this.showHitZoneLabel(target, step.zone);

                    playerHP.set(step.pHP);
                    enemyHP.set(step.eHP);
                    this.updateHPVisuals(step.pHP, step.eHP);
                    this.log("10", `Találat! Új HP - P:${step.pHP} E:${step.eHP}`);
                }
            });

            await this.delay(400);
            if (isPlayerAttacking) this.playAnimation('gun_out_idle');
        }

        this.log("11", "Összes lövés leadva, várakozás a becsapódásokra.");
        await Promise.all(bulletPromises);
        this.log("12", "Golyók landoltak, feldolgozás indítása.");

        const winner = response.round.winner;
        const isWin = winner === activePowerups.target;

        if (winner === 'PLAYER') {
            this.enemy.rotation = 1.5;
            this.log("13", "Ellenség eldőlt.");
        } else {
            this.log("13", "Játékos halál animáció indítása.");
            this.playAnimation('death', false);
        }

        await this.delay(200);

        this.log("14", "Eredmény megjelenítve, visszaszámlálás indítva.");
        gameState.set('COOLDOWN');
        this.showResultText(isWin ? "GYŐZELEM!" : "VESZTETTÉL!", isWin ? 0x2ecc71 : 0xe74c3c);

        if (response.balance?.amount !== undefined) {
            currentBalance.set(response.balance.amount);
            this.log("15", "Egyenleg szinkronizálva.");
        }

        betHistory.update(history => [{
            id: Math.random().toString(36).substring(2, 9),
            time: new Date().toLocaleTimeString(),
            bet: betAmount,
            multiplier: response.round.payoutMultiplier,
            payout: betAmount * response.round.payoutMultiplier,
            target: activePowerups.target
        }, ...history].slice(0, 50));
        this.log("16", "Előzmények rögzítve.");

        duelCooldown.set(3);
        await this.delay(500);

        duelCooldown.set(2);
        await this.delay(500);

        this.log("17", "Eredmény elrejtve, pálya resetelve.");
        this.uiContainer.removeChildren();
        playerHP.set(100);
        enemyHP.set(100);
        this.cleanupDuel(true);
        this.updateVisualsFromStores();
        
        duelCooldown.set(1);
        await this.delay(500);
        
        duelCooldown.set(0);
        gameState.set('IDLE');
        this.isProcessingDuel = false;
        this.log("18", "Párbaj szekvencia lezárva, gomb újra aktív.");
    }

    private async fireBullet(startX: number, startY: number, endX: number, endY: number): Promise<void> {
        const bullet = new Graphics().circle(0, 0, 4).fill(0xffcc00);
        bullet.x = startX;
        bullet.y = startY;
        this.worldContainer.addChild(bullet);

        const duration = 500;
        const startTime = performance.now();

        return new Promise<void>(resolve => {
            const animate = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                bullet.x = startX + (endX - startX) * progress;
                bullet.y = startY + (endY - startY) * progress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.worldContainer.removeChild(bullet);
                    bullet.destroy();
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    private cleanupDuel(resetHP: boolean = false) {
        if (resetHP) this.hasDrawnGun = false;
        
        if (this.enemy && !this.enemy.destroyed) { 
            this.enemy.rotation = 0; 
            this.enemy.alpha = 1; 
        }
        
        if (this.player && !this.player.destroyed) { 
            this.player.rotation = 0; 
            this.player.alpha = 1; 
            this.player.onFrameChange = undefined;
            this.player.onComplete = undefined;
            this.playAnimation('idle');
        }
        
        this.powerupContainer.removeChildren();
        this.uiContainer.removeChildren();
        if (this.hitZoneText) { 
            this.uiContainer.removeChild(this.hitZoneText); 
            this.hitZoneText.destroy(); 
            this.hitZoneText = undefined; 
        }

        if (resetHP) {
            this.updateHPVisuals(100, 100);
        }
    }

    private playMuzzleFlash(x: number, y: number) {
        const flash = new Graphics().circle(x, y, 25).fill({ color: 0xffaa00, alpha: 0.9 });
        flash.filters = [new BlurFilter({ strength: 5 })];
        this.worldContainer.addChild(flash);
        setTimeout(() => { if (flash && !flash.destroyed) { this.worldContainer.removeChild(flash); flash.destroy(); }}, 40);
    }

    private showResultText(message: string, color: number) {
        const text = new Text({ text: message, style: { fill: color, fontSize: 84, fontWeight: 'bold', stroke: { color: 0x000000, width: 8 }, dropShadow: { alpha: 0.5, distance: 4, color: 0x000000 }}});
        text.x = (1280 - text.width) / 2; text.y = 150; this.uiContainer.addChild(text);
    }

    private showHitZoneLabel(target: Container, zone: string) {
        const label = new Text({ text: zone, style: { fill: 0xffffff, fontSize: 32, fontWeight: 'bold', stroke: { color: 0x000000, width: 4 }}});
        label.x = target.x + (target === this.player ? -120 : 60);
        label.y = target.y - 100;
        this.uiContainer.addChild(label);
        setTimeout(() => { if (label && !label.destroyed) { this.uiContainer.removeChild(label); label.destroy(); }}, 600);
    }

    private delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
    public destroy() { if (this.app) this.app.destroy(true, { children: true, texture: true }); }
}

export const gameEngine = new GameEngine();