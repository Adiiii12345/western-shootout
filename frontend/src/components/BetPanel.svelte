<script lang="ts">
    import { 
        currentBalance, 
        baseBet, 
        totalBet, 
        gameState, 
        isMagnetActive, 
        isArmorActive,
        potentialPayout,
        selectedTarget,
        currentBetMode,
        duelCooldown
    } from '../store/GameStore';
    import { stakeClient } from '../api/StakeClient';
    import { gameEngine } from '../game/GameEngine';

    $: {
        $isMagnetActive; 
        $isArmorActive; 
        $selectedTarget;
        if (gameEngine && $gameState === 'IDLE') {
            gameEngine.updateVisualsFromStores();
        }
    }

    async function handleBet() {
        if ($gameState !== 'IDLE' || $currentBalance < $totalBet) return;

        const activeBaseBet = $baseBet;
        const activeTotalBet = $totalBet;
        const activePowerups = { 
            magnet: $isMagnetActive, 
            armor: $isArmorActive, 
            target: $selectedTarget 
        };
        
        try {
            const response = await stakeClient.shoot(activeTotalBet, activeBaseBet, $currentBetMode);
            await gameEngine.handleShootResult(response, activeBaseBet, activePowerups);
        } catch (error) {
            console.error("Bet hiba:", error);
            gameState.set('IDLE');
        }
    }

    function quickBet(mult: number) {
        if ($gameState !== 'IDLE') return;
        baseBet.update(v => Number((v * mult).toFixed(2)));
    }

    function selectTarget(target: 'PLAYER' | 'ENEMY') {
        if ($gameState !== 'IDLE') return;
        selectedTarget.set(target);
    }
</script>

<div class="bet-panel">
    <div class="balance-display">
        <span class="label">Egyenleg</span>
        <span class="value">${$currentBalance.toFixed(2)}</span>
    </div>

    <div class="target-selection">
        <span class="input-label">Kire fogadsz?</span>
        <div class="toggle-group">
            <button 
                class="target-btn player" 
                class:active={$selectedTarget === 'PLAYER'}
                on:click={() => selectTarget('PLAYER')}
                disabled={$gameState !== 'IDLE'}
            >
                Játékos
            </button>
            <button 
                class="target-btn enemy" 
                class:active={$selectedTarget === 'ENEMY'}
                on:click={() => selectTarget('ENEMY')}
                disabled={$gameState !== 'IDLE'}
            >
                Ellenfél
            </button>
        </div>
    </div>

    <div class="input-group">
        <label for="betAmount">Alaptét összege</label>
        <div class="input-wrapper">
            <input 
                id="betAmount"
                type="number" 
                bind:value={$baseBet} 
                min="0.1" 
                step="0.1"
                disabled={$gameState !== 'IDLE'}
            />
            <button disabled={$gameState !== 'IDLE'} on:click={() => quickBet(0.5)}>1/2</button>
            <button disabled={$gameState !== 'IDLE'} on:click={() => quickBet(2)}>2x</button>
        </div>
    </div>

    <div class="modifiers">
        <button 
            class="mod-btn" 
            class:active={$isMagnetActive}
            on:click={() => isMagnetActive.update(v => !v)}
            disabled={$gameState !== 'IDLE'}
        >
            Mágnes (+50%)
        </button>
        <button 
            class="mod-btn" 
            class:active={$isArmorActive}
            on:click={() => isArmorActive.update(v => !v)}
            disabled={$gameState !== 'IDLE'}
        >
            Páncél (+25%)
        </button>
    </div>

    <div class="total-info">
        <div class="info-row">
            <span>Összes levonás:</span>
            <span>${$totalBet}</span>
        </div>
        <div class="info-row highlight">
            <span>Várható nyeremény:</span>
            <span>${$potentialPayout}</span>
        </div>
    </div>

    <button 
        class="shoot-btn" 
        class:cooldown={$gameState === 'COOLDOWN'}
        disabled={$gameState !== 'IDLE' || $currentBalance < $totalBet}
        on:click={handleBet}
    >
        {#if $gameState === 'IDLE'}
            LÖVÉS
        {:else if $gameState === 'COOLDOWN'}
            {$duelCooldown}...
        {:else}
            PÁRBAJ...
        {/if}
    </button>
</div>

<style>
    .bet-panel { padding: 20px; display: flex; flex-direction: column; gap: 15px; color: white; }
    .balance-display { background: #000; padding: 12px; border-radius: 8px; border: 1px solid #333; display: flex; flex-direction: column; }
    .balance-display .label { font-size: 0.75rem; color: #888; }
    .balance-display .value { font-size: 1.3rem; color: #2ecc71; font-weight: bold; }
    .input-label, label { display: block; font-size: 0.75rem; color: #888; margin-bottom: 6px; }
    .toggle-group { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #000; padding: 4px; border-radius: 6px; }
    .target-btn { background: transparent; border: none; color: #666; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: all 0.2s; }
    .target-btn.player.active { background: #3498db; color: white; }
    .target-btn.enemy.active { background: #e74c3c; color: white; }
    .target-btn:disabled { cursor: not-allowed; opacity: 0.5; }
    .input-wrapper { display: flex; gap: 5px; }
    input { flex-grow: 1; background: #000; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; width: 60px; }
    input:disabled { color: #666; }
    .input-wrapper button { background: #333; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
    .input-wrapper button:disabled { color: #555; cursor: not-allowed; }
    .modifiers { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .mod-btn { background: #222; border: 1px solid #444; color: #888; padding: 8px 4px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; }
    .mod-btn.active { background: #f1c40f; color: #000; border-color: #f1c40f; font-weight: bold; }
    .mod-btn:disabled { cursor: not-allowed; opacity: 0.5; }
    .total-info { background: rgba(255, 255, 255, 0.03); padding: 10px; border-radius: 6px; display: flex; flex-direction: column; gap: 5px; }
    .info-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: #aaa; }
    .info-row.highlight { color: #2ecc71; font-weight: bold; border-top: 1px solid #333; padding-top: 5px; margin-top: 2px; }
    .shoot-btn { background: #e67e22; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: bold; font-size: 1.1rem; cursor: pointer; margin-top: 5px; transition: background 0.3s; }
    .shoot-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
    .shoot-btn.cooldown { background: #444; color: #aaa; }
</style>