<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameEngine } from '../game/GameEngine';

    let canvas: HTMLCanvasElement;

    onMount(async () => {
        if (canvas) {
            await gameEngine.initialize(canvas);
        }
    });

    onDestroy(() => {
        gameEngine.destroy();
    });
</script>

<div class="canvas-container">
    <canvas bind:this={canvas}></canvas>
</div>