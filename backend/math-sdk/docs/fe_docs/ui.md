# Western Shootout - UI & Layout Specifikáció

A Stake SDK két alapvető megoldást kínál a felhasználói felület kezelésére: a `/packages/components-ui-pixi` (PixiJS alapú grafikus elemek) és a `/packages/components-ui-html` (HTML/DOM alapú modális ablakok és overlay-ek) csomagokat. 

Ezek a komponensek biztosítják az alapvető funkcionalitást, de a végső branding és stílus kialakítása a fejlesztő feladata.

## Főbb Funkciók

Az SDK UI csomagjai beépítve támogatják az alábbi funkciókat:
* **Auto Gaming**: Automatikus pörgetések/lövések kezelése.
* **Turbo Mode**: Gyorsított animációs fázisok.
* **Bonus Button**: Bónusz vásárlás vagy speciális játékmód (pl. Extreme) indítása.
* **Responsiveness**: Automatikus igazodás a különböző kijelzőméretekhez.

## Integrációs Példa

A UI elemek deklaratív módon, Svelte snippetek segítségével illeszthetők be a játékba:

```svelte
<script lang="ts">
  import { UI, UiGameName } from 'components-ui-pixi';
  import { GameVersion, Modals } from 'components-ui-html';
</script>

<App>
  <UI>
    {#snippet gameName()}
      <UiGameName name="WESTERN SHOOTOUT" />
    {/snippet}
    
    {#snippet logo()}
      <Text
        anchor={{ x: 1, y: 0 }}
        text="YOUR LOGO"
        style={{
          fontFamily: 'proxima-nova',
          fontSize: 24,
          fontWeight: '600',
          fill: 0xffffff,
        }}
      />
    {/snippet}
  </UI>
</App>

<Modals>
  {#snippet version()}
    <GameVersion version="1.0.0" />
  {/snippet}
</Modals>
```

# Branding és Testreszabás
Branding szempontból javasolt az SDK által biztosított csomagokra példaként tekinteni, nem pedig kész termékként. A Western Shootout egyedi hangulatának eléréséhez:

Stílusmódosítás: Használja ki a meglévő komponenseket kiindulópontként, és adjon hozzájuk egyedi stílusokat (CSS/Pixi filters).

Egyedi UI: Teljesen elfogadható a gyári csomagok mellőzése és egy teljesen egyedi, nulláról felépített UI használata is, amennyiben az illeszkedik a gameState és a eventEmitter logikájába.

Reszponzivitás: A PixiJS vászon méretezését mindig hangolja össze a HTML overlay-ek elhelyezkedésével a zökkenőmentes felhasználói élmény érdekében.