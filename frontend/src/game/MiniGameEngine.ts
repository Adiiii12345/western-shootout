import { Container, Graphics, Text, BlurFilter, Ticker } from 'pixi.js';
import { gameEngine } from './GameEngine';

interface EnemySprite extends Container {
    body: Graphics;
    hpBar: Graphics;
    hpLabel: Text;
}

class MiniGameEngine {
    private minigameContainer: Container;
    private enemies: Record<string, EnemySprite> = {};
    private activeTickers: Set<any> = new Set();

    constructor() {
        this.minigameContainer = new Container();
    }

    public init(parent: Container) {
        if (!parent.destroyed) {
            parent.addChild(this.minigameContainer);
        }
    }

    private getHPColor(val: number): number {
        if (val > 60) return 0x2ecc71;
        if (val > 30) return 0xf1c40f;
        return 0xe74c3c;
    }

    public async setupGroupShootout(enemiesHP: Record<string, number>) {
        this.cleanup();
        
        const enemyIds = Object.keys(enemiesHP);
        const count = enemyIds.length;
        const centerX = 1000;
        const centerY = 500;
        const spacing = 125;

        enemyIds.forEach((id, i) => {
            const container = new Container() as EnemySprite;
            
            const body = new Graphics()
                .roundRect(-30, -110, 60, 110, 8)
                .fill(0xc0392b)
                .stroke({ width: 3, color: 0x000000, alpha: 0.5 });
            
            const hpBg = new Graphics().roundRect(-30, -135, 60, 8, 4).fill(0x000000);
            const hpBar = new Graphics();
            
            const hpLabel = new Text({ 
                text: `${Math.ceil(enemiesHP[id])}`, 
                style: { fill: 0xffffff, fontSize: 12, fontWeight: '900', stroke: { color: 0x000000, width: 3 } } 
            });
            hpLabel.anchor.set(0.5);
            hpLabel.y = -145;

            container.addChild(body, hpBg, hpBar, hpLabel);
            container.body = body;
            container.hpBar = hpBar;
            container.hpLabel = hpLabel;
            
            container.x = centerX + (i - (count - 1) / 2) * spacing;
            container.y = centerY + Math.abs(i - (count - 1) / 2) * 25;
            
            this.enemies[id] = container;
            this.minigameContainer.addChild(container);
            
            this.updateEnemyHPVisuals(id, enemiesHP[id]);
        });
    }

    private updateEnemyHPVisuals(id: string, hp: number) {
        const enemy = this.enemies[id];
        if (!enemy || enemy.destroyed) return;

        const val = Math.max(0, hp);
        enemy.hpBar.clear().roundRect(-30, -135, (val / 100) * 60, 8, 4).fill(this.getHPColor(val));
        enemy.hpLabel.text = `${Math.ceil(val)}`;
    }

    public async handleGroupStep(step: any) {
        if (this.minigameContainer.destroyed) return;

        const shooterId = step.Shooter;
        const targetId = step.Target;
        
        const attacker = this.enemies[shooterId] || (shooterId === 'PLAYER' ? (gameEngine as any).player : null);
        const target = this.enemies[targetId] || (targetId === 'PLAYER' ? (gameEngine as any).player : null);

        if (!attacker || attacker.destroyed || !target || target.destroyed) return;

        if (shooterId === 'PLAYER') {
            await gameEngine.playShootSequence('PLAYER', targetId, targetId !== 'FAIL', step.Target);
        } else {
            const sX = attacker.x;
            const sY = attacker.y - 70;
            const eX = target.x;
            const eY = targetId !== 'FAIL' ? target.y - 60 : 300;

            this.playMuzzleFlash(sX, sY);
            await this.fireTracer(sX, sY, eX, eY);

            if (targetId !== 'FAIL') {
                this.applyHitFlash(target);
                (gameEngine as any).shakeIntensity = 10;
            }
        }

        if (step.enemiesHP) {
            Object.keys(step.enemiesHP).forEach(id => {
                const hp = step.enemiesHP[id];
                this.updateEnemyHPVisuals(id, hp);
                
                const enemy = this.enemies[id];
                if (enemy && hp <= 0 && enemy.alpha > 0.5) {
                    this.playDeathAnimation(enemy);
                }
            });
        }
    }

    public async playAngelSequence() {
        if (this.minigameContainer.destroyed) return;

        const container = new Container();
        const angelGfx = new Graphics()
            .poly([0, -70, 45, 0, 0, 70, -45, 0])
            .fill({ color: 0xffffff, alpha: 0.95 })
            .stroke({ width: 6, color: 0xf1c40f });
        
        const glow = new Graphics().circle(0, 0, 90).fill({ color: 0xf1c40f, alpha: 0.5 });
        glow.filters = [new BlurFilter({ strength: 20 })];
        
        container.addChild(glow, angelGfx);
        container.x = 300;
        container.y = 350;
        container.alpha = 0;
        this.minigameContainer.addChild(container);

        return new Promise<void>(res => {
            let time = 0;
            const anim = (ticker: Ticker) => {
                if (container.destroyed) {
                    Ticker.shared.remove(anim);
                    res();
                    return;
                }
                time += 0.1 * ticker.deltaTime;
                container.y = 350 + Math.sin(time) * 20;
                if (time < 15 && container.alpha < 1) container.alpha += 0.04 * ticker.deltaTime;
                
                if (time > 20) {
                    container.alpha -= 0.08 * ticker.deltaTime;
                    if (container.alpha <= 0) {
                        Ticker.shared.remove(anim);
                        container.destroy();
                        res();
                    }
                }
            };
            Ticker.shared.add(anim);
            this.activeTickers.add(anim);
        });
    }

    private async fireTracer(sx: number, sy: number, ex: number, ey: number) {
        if (this.minigameContainer.destroyed) return;

        const tracer = new Graphics().setStrokeStyle({ width: 3, color: 0xfff0ad }).moveTo(sx, sy).lineTo(ex, ey);
        tracer.filters = [new BlurFilter({ strength: 2 })];
        this.minigameContainer.addChild(tracer);

        return new Promise<void>(res => {
            let alpha = 1;
            const anim = (ticker: Ticker) => {
                if (tracer.destroyed) {
                    Ticker.shared.remove(anim);
                    res();
                    return;
                }
                alpha -= 0.18 * ticker.deltaTime;
                tracer.alpha = alpha;
                if (alpha <= 0) {
                    Ticker.shared.remove(anim);
                    tracer.destroy();
                    res();
                }
            };
            Ticker.shared.add(anim);
            this.activeTickers.add(anim);
        });
    }

    private applyHitFlash(target: any) {
        if (!target || target.destroyed) return;
        target.tint = 0xff0000;
        setTimeout(() => { 
            if (target && !target.destroyed) target.tint = 0xffffff; 
        }, 70);
    }

    private playDeathAnimation(enemy: EnemySprite) {
        if (!enemy || enemy.destroyed) return;
        enemy.alpha = 0.5;
        enemy.body.tint = 0x222222;
        
        const anim = (ticker: Ticker) => {
            if (enemy.destroyed) {
                Ticker.shared.remove(anim);
                return;
            }
            enemy.rotation += 0.12 * ticker.deltaTime;
            if (enemy.rotation >= 1.5) {
                Ticker.shared.remove(anim);
                enemy.rotation = 1.5;
            }
        };
        Ticker.shared.add(anim);
        this.activeTickers.add(anim);
    }

    private playMuzzleFlash(x: number, y: number) {
        if (this.minigameContainer.destroyed) return;
        const flash = new Graphics().circle(0, 0, 25).fill({ color: 0xffcc00, alpha: 0.9 });
        flash.x = x; flash.y = y;
        this.minigameContainer.addChild(flash);
        setTimeout(() => { if (!flash.destroyed) flash.destroy(); }, 50);
    }

    public cleanup() {
        this.activeTickers.forEach(anim => Ticker.shared.remove(anim));
        this.activeTickers.clear();
        this.minigameContainer.removeChildren().forEach(c => c.destroy());
        this.enemies = {};
    }
}

export const miniGameEngine = new MiniGameEngine();