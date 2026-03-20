<script lang="ts">
    import { serverSeedHash, clientSeed, currentNonce } from '../store/GameStore';
    
    let isOpen = false;
</script>

<div class="pf-container">
    <button class="pf-toggle" on:click={() => isOpen = !isOpen}>
        {isOpen ? '✖ Bezár' : '🛡 Provably Fair'}
    </button>

    {#if isOpen}
        <div class="pf-modal">
            <h3>Forduló Ellenőrzése</h3>
            
            <div class="field">
                <label for="serverSeed">Server Seed Hash:</label>
                <input id="serverSeed" type="text" readonly value={$serverSeedHash} />
            </div>

            <div class="field">
                <label for="clientSeed">Client Seed:</label>
                <input id="clientSeed" type="text" bind:value={$clientSeed} />
            </div>

            <div class="field">
                <label for="nonce">Nonce:</label>
                <input id="nonce" type="number" readonly value={$currentNonce} />
            </div>

            <p class="info">Ezek az adatok garantálják, hogy az eredmény már a lövés előtt eldőlt, és nem módosítható.</p>
        </div>
    {/if}
</div>

<style>
    .pf-container {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 200;
    }

    .pf-toggle {
        background: rgba(0, 0, 0, 0.6);
        color: #aaa;
        border: 1px solid #444;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
    }

    .pf-toggle:hover {
        color: #fff;
        border-color: #666;
    }

    .pf-modal {
        position: absolute;
        top: 45px;
        right: 0;
        background: #1a1a1a;
        border: 1px solid #444;
        padding: 20px;
        border-radius: 8px;
        width: 300px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }

    h3 { color: #f1c40f; margin-top: 0; font-size: 1rem; }

    .field { margin-bottom: 12px; }

    label { display: block; font-size: 0.7rem; color: #888; margin-bottom: 4px; }

    input {
        width: 100%;
        background: #000;
        border: 1px solid #333;
        color: #2ecc71;
        padding: 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.8rem;
    }

    .info { font-size: 0.65rem; color: #666; line-height: 1.4; margin-bottom: 0; }
</style>