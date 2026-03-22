import { Application, Container, Graphics, Text, BlurFilter, AnimatedSprite, Ticker } from 'pixi.js';
import { isMagnetActive, isArmorActive } from '../store/GameStore';
import { get } from 'svelte/store';
import { assetLoader } from './AssetLoader';

class GameEngine {
    private app: Application | null = null;
    private mainContainer = new Container();
    private worldContainer = new Container();
    private uiContainer = new Container();
    private powerupContainer = new Container();
    
    private player!: AnimatedSprite;
    private enemy!: Graphics;
    
    private playerHPBar!: Graphics;
    private enemyHPBar!: Graphics;
    private playerHPText!: Text;
    private enemyHPText!: Text;
    private resultText: Text | null = null;
    
    private hasDrawnGun = false;
    private shakeIntensity = 0;

    public async initialize(canvas: HTMLCanvasElement) {
        if (this.app) {
            this.destroy();
        }

        this.app = new Application();
        await this.app.init({
            canvas,
            width: 1280,
            height: 720,
            backgroundColor: 0x0a0f14,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        this.app.stage.addChild(this.mainContainer);
        this.mainContainer.addChild(this.worldContainer);
        this.mainContainer.addChild(this.powerupContainer);
        this.mainContainer.addChild(this.uiContainer);

        await assetLoader.initialize();
        this.setupScene();
        
        // Ticker kötése a példányhoz
        this.app.ticker.add(this.update, this);
    }

    private setupScene() {
        const skyGfx = new Graphics().rect(0, 0, 1280, 550).fill(0x0a0f14);
        this.worldContainer.addChild(skyGfx);

        const starsGfx = new Graphics();
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * 1280;
            const y = Math.random() * 450;
            const size = Math.random() * 1.5 + 0.5;
            starsGfx.circle(x, y, size).fill({ color: 0xffffff, alpha: Math.random() * 0.6 + 0.2 });
        }
        this.worldContainer.addChild(starsGfx);

        const groundGfx = new Graphics()
            .rect(0, 550, 1280, 170).fill(0x231a12)
            .rect(0, 550, 1280, 4).fill({ color: 0x000000, alpha: 0.4 });
        this.worldContainer.addChild(groundGfx);

        this.createCharacters();
        this.createHPBars();
    }

    private createCharacters() {
        this.player = new AnimatedSprite(assetLoader.getHeroTextures('idle'));
        this.player.animationSpeed = 0.15;
        this.player.scale.set(4);
        this.player.anchor.set(0.5, 1);
        this.player.x = 300;
        this.player.y = 560;
        this.player.play();
        this.worldContainer.addChild(this.player);

        this.enemy = new Graphics()
            .roundRect(-35, -130, 70, 130, 8)
            .fill(0xc0392b)
            .stroke({ width: 4, color: 0x000000, alpha: 0.5 });
        this.enemy.x = 980;
        this.enemy.y = 560;
        this.worldContainer.addChild(this.enemy);
    }

    private createHPBars() {
        const createBar = (x: number, y: number, isPlayer: boolean) => {
            const container = new Container();
            const bg = new Graphics().roundRect(0, 0, 240, 12, 6).fill({ color: 0x000000, alpha: 0.7 });
            const bar = new Graphics();
            const text = new Text({ 
                text: "100 HP", 
                style: { fill: 0xffffff, fontSize: 18, fontWeight: '900', stroke: { color: 0x000000, width: 4 } } 
            });
            text.y = -30;
            if (!isPlayer) text.x = 240 - text.width;
            container.addChild(bg, bar, text);
            container.x = x; container.y = y;
            this.uiContainer.addChild(container);
            return { bar, text };
        };

        const pUI = createBar(100, 450, true);
        this.playerHPBar = pUI.bar; this.playerHPText = pUI.text;
        const eUI = createBar(940, 450, false);
        this.enemyHPBar = eUI.bar; this.enemyHPText = eUI.text;
    }

    public updateHPVisuals(pVal: number, eVal: number) {
        const getHPColor = (val: number) => {
            if (val > 60) return 0x2ecc71;
            if (val > 30) return 0xf1c40f;
            return 0xe74c3c;
        };

        const drawBar = (g: Graphics, val: number) => {
            if (!g || g.destroyed) return;
            const color = getHPColor(val);
            g.clear().roundRect(0, 0, Math.max(0, (val / 100) * 240), 12, 6).fill(color);
        };

        drawBar(this.playerHPBar, pVal);
        drawBar(this.enemyHPBar, eVal);
        
        if (this.playerHPText && !this.playerHPText.destroyed) {
            this.playerHPText.text = `${Math.ceil(pVal)} HP`;
        }
        if (this.enemyHPText && !this.enemyHPText.destroyed) {
            this.enemyHPText.text = `${Math.ceil(eVal)} HP`;
            this.enemyHPText.x = 240 - this.enemyHPText.width;
        }
    }

    public async playShootSequence(attacker: string, targetName: string, hit: boolean, zone: string) {
        if (!this.app) return;
        const isPlayer = attacker === 'PLAYER';
        
        if (isPlayer && !this.player.destroyed) {
            const anim = 'draw_and_shoot'; 
            this.player.textures = assetLoader.getHeroTextures(anim as any);
            this.player.loop = false;
            this.player.gotoAndPlay(0);
            this.hasDrawnGun = true;

            await new Promise<void>(res => {
                const timeout = setTimeout(res, 450);
                this.player.onFrameChange = (frame) => {
                    if (frame >= 3) {
                        clearTimeout(timeout);
                        this.player.onFrameChange = undefined;
                        res();
                    }
                };
            });
        }

        const sX = isPlayer ? 360 : 940;
        const sY = 480;
        const eX = isPlayer ? 980 : 300;
        let eY = hit ? (zone === 'HEAD' ? 440 : (zone === 'LEGS' ? 540 : 490)) : 300;

        this.playMuzzleFlash(sX, sY);
        await this.fireTracer(sX, sY, eX, eY);

        if (hit) {
            const targetObj = isPlayer ? this.enemy : this.player;
            if (targetObj && !targetObj.destroyed) {
                targetObj.tint = 0xff0000;
                setTimeout(() => { if (targetObj && !targetObj.destroyed) targetObj.tint = 0xffffff; }, 80);
                this.applyHitEffect(targetObj, zone);
                this.shakeIntensity = isPlayer ? 5 : 12;
            }
        }
    }

    private async fireTracer(sx: number, sy: number, ex: number, ey: number) {
        if (!this.app) return;
        const tracer = new Graphics().setStrokeStyle({ width: 3, color: 0xfff0ad }).moveTo(sx, sy).lineTo(ex, ey);
        tracer.filters = [new BlurFilter({ strength: 2 })];
        this.worldContainer.addChild(tracer);

        return new Promise<void>(res => {
            let alpha = 1;
            const ticker = this.app?.ticker;
            const fade = (t: Ticker) => {
                if (tracer.destroyed) {
                    ticker?.remove(fade);
                    res();
                    return;
                }
                alpha -= 0.15 * t.deltaTime;
                tracer.alpha = alpha;
                if (alpha <= 0) {
                    ticker?.remove(fade);
                    tracer.destroy();
                    res();
                }
            };
            ticker?.add(fade);
        });
    }

    private applyHitEffect(target: any, zone: string) {
        if (!this.app || !target || target.destroyed) return;

        const label = new Text({ 
            text: zone === 'HEAD' ? 'CRITICAL!' : zone, 
            style: { fill: zone === 'HEAD' ? 0xffcc00 : 0xffffff, fontSize: 32, fontWeight: '900', stroke: {color: 0x000000, width: 4} } 
        });
        label.anchor.set(0.5);
        label.x = target.x;
        label.y = target.y - 180;
        this.uiContainer.addChild(label);

        const ticker = this.app.ticker;
        const anim = (t: Ticker) => {
            if (label.destroyed) {
                ticker.remove(anim);
                return;
            }
            label.y -= 1.8 * t.deltaTime;
            label.alpha -= 0.04 * t.deltaTime;
            if (label.alpha <= 0) {
                ticker.remove(anim);
                label.destroy();
            }
        };
        ticker.add(anim);
    }

    private playMuzzleFlash(x: number, y: number) {
        if (!this.app) return;
        const flash = new Graphics().circle(0, 0, 30).fill({ color: 0xffd700, alpha: 0.9 });
        flash.x = x; flash.y = y;
        flash.filters = [new BlurFilter({ strength: 8 })];
        this.worldContainer.addChild(flash);
        setTimeout(() => { if (!flash.destroyed) flash.destroy(); }, 50);
    }

    private update(ticker: Ticker) {
        if (!this.app) return;

        if (this.shakeIntensity > 0) {
            this.mainContainer.x = (Math.random() - 0.5) * this.shakeIntensity;
            this.mainContainer.y = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.88;
            if (this.shakeIntensity < 0.1) {
                this.shakeIntensity = 0;
                this.mainContainer.x = 0; this.mainContainer.y = 0;
            }
        }
    }

    public showResultText(msg: string, color: number) {
        this.cleanupResultText();
        this.resultText = new Text({ 
            text: msg, 
            style: { 
                fill: color, 
                fontSize: 84, 
                fontWeight: '900', 
                align: 'center', 
                stroke: { color: 0x000000, width: 10 },
                dropShadow: { color: 0x000000, blur: 4, distance: 4, alpha: 0.5 }
            } 
        });
        this.resultText.anchor.set(0.5); 
        this.resultText.x = 640; 
        this.resultText.y = 280;
        this.uiContainer.addChild(this.resultText);
    }

    public cleanupResultText() {
        if (this.resultText) {
            if (!this.resultText.destroyed) this.resultText.destroy();
            this.resultText = null;
        }
    }

    public cleanup() {
        this.cleanupResultText();
        this.uiContainer.children
            .filter(c => c instanceof Text && c !== this.playerHPText && c !== this.enemyHPText)
            .forEach(c => { if (!c.destroyed) c.destroy(); });
        
        this.powerupContainer.removeChildren();
        this.hasDrawnGun = false;
        
        if (this.player && !this.player.destroyed) {
            this.player.textures = assetLoader.getHeroTextures('idle');
            this.player.loop = true;
            this.player.play();
        }
        
        this.updateHPVisuals(100, 100);
        this.updateVisualsFromStores();
    }

    public updateVisualsFromStores() {
        if (!this.app) return;
        this.powerupContainer.removeChildren();
        
        // A páncél (Armor) matematikai szempontból csak a játékost (PLAYER) védi.
        const isArmor = get(isArmorActive);
        
        if (isArmor && this.player && !this.player.destroyed) {
            const armorGfx = new Graphics()
                .roundRect(-45, -140, 90, 150, 10)
                .fill({ color: 0x3498db, alpha: 0.3 })
                .stroke({ width: 4, color: 0xffffff, alpha: 0.6 });
            armorGfx.x = this.player.x;
            armorGfx.y = this.player.y;
            armorGfx.filters = [new BlurFilter({ strength: 2 })];
            this.powerupContainer.addChild(armorGfx);
        }
    }

    public destroy() {
        if (this.app) {
            this.app.ticker.remove(this.update, this);
            this.app.destroy(true, { children: true, texture: true });
            this.app = null;
        }
    }
}

export const gameEngine = new GameEngine();