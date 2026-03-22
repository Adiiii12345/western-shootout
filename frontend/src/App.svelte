<script lang="ts">
    import { onMount } from 'svelte';
    import './app.css'; // Külső stíluslap importálása
    
    import GameCanvas from './components/GameCanvas.svelte';
    import BetPanel from './components/BetPanel.svelte';
    import ProvablyFair from './components/ProvablyFair.svelte';
    import BetHistory from './components/BetHistory.svelte';
    import RevolverUI from './components/RevolverUI.svelte';
    import { stakeClient } from './api/StakeClient';
  
    let isInitialized = false;
  
    onMount(async () => {
        try {
            await stakeClient.initialize();
            isInitialized = true;
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    });
</script>
  
<main>
    {#if isInitialized}
        <div class="game-layout">
            <aside class="sidebar">
                <div class="panel-section top-panel">
                    <BetPanel />
                </div>
                <div class="panel-section history-panel">
                    <BetHistory />
                </div>
            </aside>
            
            <section class="game-container">
                <div class="game-wrapper">
                    <GameCanvas />
                </div>
                
                <div class="revolver-wrapper">
                    <RevolverUI />
                </div>

                <div class="pf-wrapper">
                    <ProvablyFair />
                </div>
            </section>
        </div>
    {:else}
        <div class="loading-screen">
            <span>Hitelesítés folyamatban...</span>
        </div>
    {/if}
</main>