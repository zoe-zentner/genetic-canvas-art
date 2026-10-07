export function calculateFitness(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    targetPixels: Uint8ClampedArray
): number {
    const currentImageData = ctx.getImageData(0, 0, width, height);
    const currentPixels = currentImageData.data;

    let totalError = 0;

    for (let i = 0; i < targetPixels.length; i += 4) {
        // absolute differences
        const dr = Math.abs(targetPixels[i] - currentPixels[i]);
        const dg = Math.abs(targetPixels[i + 1] - currentPixels[i + 1]);
        const db = Math.abs(targetPixels[i + 2] - currentPixels[i + 2]);

        totalError += dr + dg + db;
    }

    return totalError;
}
