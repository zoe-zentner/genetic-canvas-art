function calculateFitness(currentPixels: Uint8ClampedArray, targetPixels: Uint8ClampedArray): number {
    let totalError = 0;

    for (let i = 0; i < targetPixels.length; i += 4) {
        const dr = Math.abs(targetPixels[i] - currentPixels[i]);
        const dg = Math.abs(targetPixels[i + 1] - currentPixels[i + 1]);
        const db = Math.abs(targetPixels[i + 2] - currentPixels[i + 2]);

        totalError += dr + dg + db;
    }

    return totalError;
}

self.onmessage = (event: MessageEvent<{ currentPixels: Uint8ClampedArray; targetPixels: Uint8ClampedArray }>) => {
    const { currentPixels, targetPixels } = event.data;
    const score = calculateFitness(currentPixels, targetPixels);
    self.postMessage({ score });
};
