export async function calculatePFResult(serverSeed: string, clientSeed: string, nonce: number): Promise<number> {
    const combinedSeed = `${clientSeed}:${nonce}:0`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(serverSeed);
    const messageData = encoder.encode(combinedSeed);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        messageData
    );

    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const resultInt = parseInt(hashHex.substring(0, 8), 16);
    // A backenddel megegyező osztó (0x100000000), hogy az eredmény szigorúan < 1.0 legyen
    return resultInt / 4294967296;
}