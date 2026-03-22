<script lang="ts">
    import { serverSeedHash, clientSeed, currentNonce, gameState, previousServerSeed } from '../store/GameStore';
    import { stakeClient } from '../api/StakeClient';
    import PFVerifier from './PFVerifier.svelte';
    
    let isOpen = false;
    let copiedField: string | null = null;
    let isRotating = false;
    let showVerifier = false;

    async function copyToClipboard(text: string, field: string) {
        try {
            await navigator.clipboard.writeText(text);
            copiedField = field;
            setTimeout(() => copiedField = null, 2000);
        } catch (err) {
            console.error('Hiba a másolás során:', err);
        }
    }

    function randomizeClientSeed() {
        if ($gameState !== 'IDLE') return;
        const randomHash = Math.random().toString(36).substring(2, 15);
        clientSeed.set(randomHash);
    }

    async function handleRotate() {
        if ($gameState !== 'IDLE' || isRotating) return;
        isRotating = true;
        try {
            await stakeClient.rotateSeed();
        } finally {
            isRotating = false;
        }
    }
</script>

<div class="pf-container">
    <button 
        class="pf-toggle" 
        on:click={() => isOpen = !isOpen}
        aria-expanded={isOpen}
    >
        {isOpen ? '✖ Bezár' : '🛡 Provably Fair'}
    </button>

    {#if isOpen}
        <div class="pf-modal">
            <div class="pf-header">
                <h3>Forduló Ellenőrzése</h3>
                <span class="status-badge">Aktív</span>
            </div>
            
            <div class="field">
                <label for="serverSeedHashInput">Aktív Server Seed Hash (Következő):</label>
                <div class="input-group">
                    <input id="serverSeedHashInput" type="text" readonly value={$serverSeedHash} />
                    <button class="icon-btn" on:click={() => copyToClipboard($serverSeedHash, 'server')}>
                        {copiedField === 'server' ? '✓' : '📋'}
                    </button>
                </div>
            </div>

            <div class="field">
                <label for="clientSeedInput">Saját Kulcs (Client Seed):</label>
                <div class="input-group">
                    <input 
                        id="clientSeedInput" 
                        type="text" 
                        bind:value={$clientSeed} 
                        disabled={$gameState !== 'IDLE'} 
                    />
                    <button 
                        class="icon-btn" 
                        on:click={randomizeClientSeed} 
                        disabled={$gameState !== 'IDLE'} 
                        title="Véletlenszerű kulcs"
                    >
                        🎲
                    </button>
                </div>
            </div>

            <div class="field">
                <label for="nonceInput">Nonce (Fogadások száma):</label>
                <input id="nonceInput" type="number" readonly value={$currentNonce} />
            </div>

            <button 
                class="rotate-btn" 
                on:click={handleRotate} 
                disabled={$gameState !== 'IDLE' || isRotating}
            >
                {isRotating ? 'Váltás...' : 'Új Seed Generálása (Rotáció)'}
            </button>

            {#if $previousServerSeed}
                <div class="revealed-section">
                    <label for="prevServerSeedInput">Előző Server Seed (Felfedve):</label>
                    <div class="input-group">
                        <input id="prevServerSeedInput" type="text" readonly value={$previousServerSeed} class="revealed" />
                        <button class="icon-btn" on:click={() => copyToClipboard($previousServerSeed || '', 'prev')}>
                            {copiedField === 'prev' ? '✓' : '📋'}
                        </button>
                    </div>
                    <p class="verification-hint">Ezzel a kulccsal ellenőrizheted az előző játékaidat.</p>
                </div>
            {/if}

            <button class="toggle-verifier-btn" on:click={() => showVerifier = !showVerifier}>
                {showVerifier ? 'Ellenőrző elrejtése' : 'Manuális Ellenőrzés (Verifier) megnyitása'}
            </button>

            {#if showVerifier}
                <PFVerifier />
            {/if}

            <div class="pf-footer">
                <p class="info">
                    A biztonsági Hash SHA-256, míg a generált eredmény a <code>Server Seed</code>, <code>Client Seed</code> és <code>Nonce</code> <strong>HMAC-SHA512</strong> kódolásából származik.
                </p>
            </div>
        </div>
    {/if}
</div>