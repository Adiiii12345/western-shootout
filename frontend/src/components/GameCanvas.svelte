<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameEngine } from '../game/GameEngine';

    // Referencia a HTML canvas elemre
    let canvasElement: HTMLCanvasElement;

    // Amikor a Svelte komponens betöltődik a böngészőbe
    onMount(async () => {
        if (canvasElement) {
            // Átadjuk a vásznat a PixiJS motornak inicializálásra
            await gameEngine.initialize(canvasElement);
        }
    });

    // Amikor a komponens megsemmisül (pl. a játékos bezárja a játékot)
    onDestroy(() => {
        // A memóriaszivárgások (memory leaks) elkerülése érdekében 
        // kritikus a Pixi.Application példány megfelelő törlése
        gameEngine.destroy();
    });
</script>

<div class="canvas-container">
    <canvas bind:this={canvasElement}></canvas>
</div>

<style>
   .canvas-container {
        /* Középre igazítjuk a játékot a képernyőn */
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        /* Egy kis sötét háttér, amíg a PixiJS betölt */
        background-color: #1a1a1a; 
    }

    canvas {
        display: block;
        max-width: 100%;
        max-height: 100%;
        /* Lekerekített sarkok és árnyék a profi megjelenésért */
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
</style>