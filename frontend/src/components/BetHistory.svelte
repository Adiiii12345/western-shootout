<script lang="ts">
    import { betHistory } from '../store/GameStore';

    const modeNames: Record<string, string> = {
        'base': 'Alap',
        'armor': 'Páncél',
        'magnet': 'Mágnes',
        'extreme': 'Extrém'
    };
</script>

<div class="history-container">
    <h3>Előzmények</h3>
    <div class="history-list">
        {#if $betHistory.length === 0}
            <div class="empty-msg">Nincsenek még fogadások.</div>
        {/if}
        {#each $betHistory as bet (bet.id)}
            <div 
                class="history-item" 
                class:win={bet.multiplier > 1} 
                class:draw={bet.multiplier > 0 && bet.multiplier <= 1} 
                class:loss={bet.multiplier === 0}
            >
                <div class="header">
                    <span class="time">{bet.time}</span>
                    <span class="mode">{modeNames[bet.mode] || bet.mode} mód</span>
                </div>
                <div class="details">
                    <span class="bet">Tét: ${bet.bet.toFixed(2)}</span>
                    <span class="mult">{bet.multiplier.toFixed(2)}x</span>
                    <span class="payout">${bet.payout.toFixed(2)}</span>
                </div>
            </div>
        {/each}
    </div>
</div>