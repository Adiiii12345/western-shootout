<script lang="ts">
  import { onMount } from 'svelte';
  import GameCanvas from './components/GameCanvas.svelte';
  import BetPanel from './components/BetPanel.svelte';
  import ProvablyFair from './components/ProvablyFair.svelte';
  import BetHistory from './components/BetHistory.svelte';
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
              <BetPanel />
              <BetHistory />
          </aside>
          
          <section class="game-container">
              <GameCanvas />
              <ProvablyFair />
          </section>
      </div>
  {:else}
      <div class="loading-screen">Hitelesítés folyamatban...</div>
  {/if}
</main>

<style>
  :global(html, body) {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0f0f0f;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  main {
      width: 100vw;
      height: 100vh;
      display: flex;
  }

  .game-layout {
      display: flex;
      width: 100%;
      height: 100%;
  }

  .sidebar {
      width: 320px;
      min-width: 320px;
      background: #1a1a1a;
      border-right: 1px solid #333;
      z-index: 10;
      display: flex;
      flex-direction: column;
  }

  .game-container {
      flex-grow: 1;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
      overflow: hidden;
  }

  .loading-screen {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #f1c40f;
      font-size: 1.5rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
  }
</style>