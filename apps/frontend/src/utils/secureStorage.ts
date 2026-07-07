// Encrypted Storage implementation using Web Crypto API (AES-GCM)
// Ensures data is stored opaquely in the browser.

const DEVICE_KEY_STORAGE = 'findpals_device_identity';

async function getEncryptionKey(): Promise<CryptoKey> {
    let rawKey = localStorage.getItem(DEVICE_KEY_STORAGE);
    if (!rawKey) {
        // Generate a new device-bound key
        const key = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        localStorage.setItem(DEVICE_KEY_STORAGE, JSON.stringify(exported));
        return key;
    }
    return window.crypto.subtle.importKey(
        "jwk",
        JSON.parse(rawKey),
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encrypt(data: string): Promise<string> {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    // Convert to Base64
    return btoa(String.fromCharCode(...combined));
}

async function decrypt(encryptedBase64: string): Promise<string | null> {
    try {
        const key = await getEncryptionKey();
        const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        return null;
    }
}

export const secureStorage = {
    setItem: async (key: string, value: string) => {
        const encrypted = await encrypt(value);
        localStorage.setItem(key, encrypted);
    },
    getItem: async (key: string): Promise<string | null> => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        return decrypt(item);
    },
    removeItem: (key: string) => localStorage.removeItem(key)
};
