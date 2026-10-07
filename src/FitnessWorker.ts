let cachedTargetPixels: Uint8ClampedArray | null = null;

function calculateFitness(currentPixels: Uint8ClampedArray): number {
    if (!cachedTargetPixels) {
        return 0;
    }

    let totalError = 0;

    for (let i = 0; i < cachedTargetPixels.length; i += 4) {
        const dr = Math.abs(cachedTargetPixels[i] - currentPixels[i]);
        const dg = Math.abs(cachedTargetPixels[i + 1] - currentPixels[i + 1]);
        const db = Math.abs(cachedTargetPixels[i + 2] - currentPixels[i + 2]);

        totalError += dr + dg + db;
    }

    return totalError;
}

self.onmessage = (
    event: MessageEvent<
        | {
              type: 'init';
              targetPixels: Uint8ClampedArray;
          }
        | {
              type: 'evaluate';
              requestId: number;
              currentPixels: Uint8ClampedArray;
          }
    >
) => {
    const { type } = event.data;

    if (type === 'init') {
        cachedTargetPixels = event.data.targetPixels;
        return;
    }

    const { requestId, currentPixels } = event.data;
    const score = calculateFitness(currentPixels);
    self.postMessage({ requestId, score });
};
