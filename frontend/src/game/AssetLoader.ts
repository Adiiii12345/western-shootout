import * as PIXI from 'pixi.js';

class AssetLoader {
    private assetsLoaded = false;
    private sheets: Record<string, PIXI.Spritesheet> = {};

    public async initialize() {
        if (this.assetsLoaded) return;

        try {
            const manifest = [
                { alias: 'idle', src: '/src/assets/hero_idle.json' },
                { alias: 'das', src: '/src/assets/hero_draw_and_shoot.json' },
                { alias: 'death', src: '/src/assets/hero_death.json' }
            ];

            for (const item of manifest) {
                try {
                    PIXI.Assets.add({ alias: item.alias, src: item.src });
                    const sheet = await PIXI.Assets.load(item.alias);
                    this.sheets[item.alias] = sheet;
                } catch (e) {
                    console.warn(`AssetLoader: Could not load ${item.src}. Using fallbacks.`);
                }
            }

            this.assetsLoaded = true;
        } catch (error) {
            console.error("Asset loading failed:", error);
        }
    }

    public getHeroTextures(animation: 'idle' | 'draw_and_shoot' | 'consecutive_shoot' | 'gun_out_idle' | 'death'): PIXI.Texture[] {
        const mapping: Record<string, string> = {
            'idle': 'idle',
            'death': 'death',
            'draw_and_shoot': 'das',
            'consecutive_shoot': 'das',
            'gun_out_idle': 'das'
        };

        const sheetAlias = mapping[animation];
        const sheet = this.sheets[sheetAlias];

        if (!sheet || !sheet.animations) return [];

        return sheet.animations[animation] || [];
    }
}

export const assetLoader = new AssetLoader();