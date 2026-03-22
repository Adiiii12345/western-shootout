<script lang="ts">
    import { 
        currentBalance, 
        baseBet, 
        totalBet, 
        gameState, 
        isMagnetActive, 
        isArmorActive,
        potentialMaxWin,
        duelCooldown
    } from '../store/GameStore';
    import { stakeClient } from '../api/StakeClient';
    import { sequencePlayer } from '../game/SequencePlayer';
    import { gameEngine } from '../game/GameEngine';

    // Dinamikusan meghatározzuk a mód nevét a backend számára
    $: backendMode = (() => {
        if ($isMagnetActive && $isArmorActive) return 'extreme';
        if ($isMagnetActive) return 'magnet';
        if ($isArmorActive) return 'armor';
        return 'base';
    })();

    // Vizuális frissítés, ha változnak a beállítások
    $: {
        if (gameEngine && $gameState === 'IDLE') {
            try {
                gameEngine.updateVisualsFromStores();
            } catch (e) {
                // Silent catch inicializálási fázisra
            }
        }
    }

    async function handleBet() {
        if ($gameState !== 'IDLE' || $currentBalance < $totalBet) return;

        const activeBaseBet = $baseBet;
        const activeTotalBet = $totalBet;
        const modeToSend = backendMode;
        
        try {
            // Frissítve a standard Stake RGS '/play' hívásra
            const response = await stakeClient.play(activeTotalBet, activeBaseBet, modeToSend);
            await sequencePlayer.play(response);
        } catch (error) {
            console.error("Bet hiba:", error);
            gameState.set('IDLE');
        }
    }

    function quickBet(mult: number) {
        if ($gameState !== 'IDLE') return;
        baseBet.update(v => {
            const newVal = Number((v * mult).toFixed(2));
            return newVal < 0.1 ? 0.1 : newVal;
        });
    }
</script>

<div class="bet-panel">
    <div class="balance-display">
        <span class="label">Egyenleg</span>
        <span class="value">${$currentBalance.toFixed(2)}</span>
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
            Mágnes (+80%)
        </button>
        <button 
            class="mod-btn" 
            class:active={$isArmorActive}
            on:click={() => isArmorActive.update(v => !v)}
            disabled={$gameState !== 'IDLE'}
        >
            Páncél (+50%)
        </button>
    </div>

    <div class="total-info">
        <div class="info-row">
            <span>Összes levonás:</span>
            <span>${$totalBet.toFixed(2)}</span>
        </div>
        <div class="info-row highlight">
            <span>Alap nyeremény (2x):</span>
            <span>${($totalBet * 2).toFixed(2)}</span>
        </div>
        <div class="info-row extra">
            <span>Max Win (500x):</span>
            <span>${$potentialMaxWin.toFixed(2)}</span>
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