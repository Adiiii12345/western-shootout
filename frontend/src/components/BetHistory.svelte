<script lang="ts">
    import { betHistory } from '../store/GameStore';
</script>

<div class="history-container">
    <div class="header">ELŐZMÉNYEK</div>
    <div class="list">
        {#each $betHistory as entry (entry.id)}
            <div class="row" class:win={entry.payout > 0}>
                <span class="time">{entry.time}</span>
                <span class="bet">${entry.bet.toFixed(2)}</span>
                <span class="mult">{entry.multiplier}x</span>
                <span class="payout">${entry.payout.toFixed(2)}</span>
            </div>
        {/each}
        {#if $betHistory.length === 0}
            <div class="empty">Nincs rögzített kör.</div>
        {/if}
    </div>
</div>

<style>
    .history-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        border-top: 1px solid #333;
        overflow: hidden;
    }

    .header {
        padding: 10px 20px;
        font-size: 0.7rem;
        color: #555;
        font-weight: bold;
        letter-spacing: 1px;
    }

    .list {
        overflow-y: auto;
        padding: 0 10px 10px;
    }

    .row {
        display: grid;
        grid-template-columns: 1.5fr 1fr 1fr 1fr;
        padding: 8px 10px;
        margin-bottom: 4px;
        background: #222;
        border-radius: 4px;
        font-size: 0.75rem;
        align-items: center;
    }

    .row.win {
        background: rgba(46, 204, 113, 0.1);
        border: 1px solid rgba(46, 204, 113, 0.2);
    }

    .time { color: #555; font-size: 0.65rem; }
    .bet { color: #aaa; }
    .mult { font-weight: bold; text-align: center; }
    .payout { text-align: right; font-weight: bold; }

    .win .mult { color: #2ecc71; }
    .win .payout { color: #2ecc71; }

    .empty {
        text-align: center;
        padding: 20px;
        color: #444;
        font-size: 0.8rem;
    }

    .list::-webkit-scrollbar { width: 4px; }
    .list::-webkit-scrollbar-track { background: transparent; }
    .list::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
</style>