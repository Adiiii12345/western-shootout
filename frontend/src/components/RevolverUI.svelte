<script lang="ts">
    import { chambers, currentRound } from '../store/GameStore';
    import { fade, scale } from 'svelte/transition';

    const positions = [
        { x: 50, y: 15 },  // 12 óra (1. töltény)
        { x: 80, y: 32 },  // 2 óra
        { x: 80, y: 68 },  // 4 óra
        { x: 50, y: 85 },  // 6 óra
        { x: 20, y: 68 },  // 8 óra
        { x: 20, y: 32 }   // 10 óra
    ];

    // Minden lövés után 60 fokot fordul a henger.
    $: rotation = ($currentRound - 1) * 60;

    // Ciklikus indexelés (0-5), hogy végtelen lövésnél is működjön
    $: activeIndex = ($currentRound - 1) % 6;

    // Vizuális újratöltés: ha a kör átlépi a 6-ot, egy virtuális új hengert mutatunk
    $: displayChambers = positions.map((_, i) => {
        if ($currentRound <= 6) return $chambers[i];
        // Új henger esetén: az aktuális és a még hátralévő kamrák telik (kivéve, ha a store mást mond az aktuálisról)
        return i > activeIndex || (i === activeIndex && $chambers[activeIndex]);
    });
</script>

<div class="revolver-container" in:fade>
    <div class="cylinder" style="transform: rotate({rotation}deg)">
        <div class="axis"></div>

        {#each positions as pos, i}
            <div 
                class="chamber" 
                class:empty={!displayChambers[i]}
                class:active={activeIndex === i}
                style="left: {pos.x}%; top: {pos.y}%; transform: translate(-50%, -50%);"
            >
                {#if displayChambers[i]}
                    <div class="bullet" in:scale={{duration: 200, start: 0.5}}>
                        <div class="primer"></div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
    
    <div class="round-indicator">
        KÖR: <span class="count">{$currentRound}</span>
    </div>
</div>