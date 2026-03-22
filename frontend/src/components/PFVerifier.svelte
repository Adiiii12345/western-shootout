<script lang="ts">
    import { previousServerSeed, clientSeed, currentNonce } from '../store/GameStore';
    import { calculatePFResult } from '../utils/pf-calculations';
    import { fade, slide } from 'svelte/transition';

    let inputServerSeed = $previousServerSeed || '';
    let inputClientSeed = $clientSeed;
    let inputNonce = $currentNonce > 0 ? $currentNonce - 1 : 0;
    
    let calculatedFloat: number | null = null;

    $: {
        if (inputServerSeed && inputClientSeed && inputNonce !== undefined) {
            calculatePFResult(inputServerSeed, inputClientSeed, inputNonce)
                .then((res: number) => {
                    calculatedFloat = res;
                })
                .catch((err: Error) => {
                    console.error("PF Calculation error:", err);
                    calculatedFloat = null;
                });
        } else {
            calculatedFloat = null;
        }
    }

    function useLatestValues() {
        inputServerSeed = $previousServerSeed || '';
        inputClientSeed = $clientSeed;
        inputNonce = Math.max(0, $currentNonce - 1);
    }
</script>

<div class="verifier-box" transition:slide>
    <div class="v-header">
        <h4><span class="icon">🔍</span> Külső Ellenőrző</h4>
        <button class="text-btn" on:click={useLatestValues}>Legutóbbi adatok betöltése</button>
    </div>

    <div class="v-grid">
        <div class="v-field">
            <label for="vServerSeed">Felfedett Server Seed</label>
            <input id="vServerSeed" type="text" bind:value={inputServerSeed} placeholder="Nyers server seed..." />
        </div>

        <div class="v-field">
            <label for="vClientSeed">Client Seed</label>
            <input id="vClientSeed" type="text" bind:value={inputClientSeed} />
        </div>

        <div class="v-field">
            <label for="vNonce">Nonce</label>
            <input id="vNonce" type="number" bind:value={inputNonce} />
        </div>
    </div>

    {#if calculatedFloat !== null}
        <div class="v-result" in:fade>
            <div class="res-label">Generált Float Érték (0.0 - 1.0):</div>
            <div class="res-value">{calculatedFloat.toFixed(10)}</div>
            <p class="res-info">Ez a szám határozza meg a kimenetet a matematikai könyv {Math.floor(calculatedFloat * 10000)}. sorában.</p>
        </div>
    {/if}
</div>