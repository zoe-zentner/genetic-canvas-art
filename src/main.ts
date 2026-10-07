import './style.css';
import { Specimen } from './Specimen';

const canvas = document.getElementById('artCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

const targetCanvas = document.getElementById('targetCanvas') as HTMLCanvasElement;
const targetCtx = targetCanvas.getContext('2d');

const uiGen = document.getElementById('ui-gen');
const uiPoly = document.getElementById('ui-poly');
const uiScore = document.getElementById('ui-score');
const uiTemp = document.getElementById('ui-temp');
const toggleButton = document.getElementById('toggle-sim') as HTMLButtonElement | null;
const resetButton = document.getElementById('reset-sim') as HTMLButtonElement | null;
const exportButton = document.getElementById('export-svg') as HTMLButtonElement | null;
const uploadInput = document.getElementById('image-upload') as HTMLInputElement | null;

// we will store the target's raw pixel array here
let targetPixelData: Uint8ClampedArray;

const normalizeTargetImage = (img: HTMLImageElement) => {
    const normalizedCanvas = document.createElement('canvas');
    normalizedCanvas.width = 256;
    normalizedCanvas.height = 256;

    const normalizedCtx = normalizedCanvas.getContext('2d');
    if (!normalizedCtx || !targetCtx) {
        return;
    }

    normalizedCtx.fillStyle = 'white';
    normalizedCtx.fillRect(0, 0, 256, 256);

    const scale = Math.min(256 / img.width, 256 / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (256 - drawWidth) / 2;
    const offsetY = (256 - drawHeight) / 2;

    normalizedCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.drawImage(normalizedCanvas, 0, 0);
    targetPixelData = normalizedCtx.getImageData(0, 0, 256, 256).data;

    fitnessWorker.postMessage({
        type: 'init',
        targetPixels: targetPixelData,
    });
};

const fitnessWorker = new Worker(new URL('./FitnessWorker.ts', import.meta.url), {
    type: 'module',
});

let fitnessRequestId = 0;

const evaluateFitnessAsync = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): Promise<number> => {
    return new Promise((resolve) => {
        const requestId = ++fitnessRequestId;
        const currentPixels = ctx.getImageData(0, 0, width, height).data;

        const handleMessage = (event: MessageEvent<{ requestId: number; score: number }>) => {
            if (event.data.requestId !== requestId) {
                return;
            }

            resolve(event.data.score);
            fitnessWorker.removeEventListener('message', handleMessage);
        };

        fitnessWorker.addEventListener('message', handleMessage);
        fitnessWorker.postMessage({
            type: 'evaluate',
            requestId,
            currentPixels,
        });
    });
};

if (ctx) {
    const img = new Image();
    img.src = '/target.png';

    img.onload = async () => {
        // draw the original image to the comparison canvas
        if (targetCtx) {
            targetCtx.drawImage(img, 0, 0, targetCanvas.width, targetCanvas.height);
        }

        normalizeTargetImage(img);
        console.log('Target data loaded! Array length:', targetPixelData.length);

        // initialize our starting parent specimen and score it
        let bestSpecimen = new Specimen(canvas.width, canvas.height, 5);
        bestSpecimen.draw(ctx, canvas.width, canvas.height);

        let bestScore = await evaluateFitnessAsync(ctx, canvas.width, canvas.height);
        let initialScore = bestScore;
        console.log('Initial random specimen error score:', bestScore);

        let generation = 0;
        let generationsSinceImprovement = 0; // tracker for how long we've been stuck
        let isRunning = true;
        let animationFrameId = 0;
        let simulationVersion = 0;

        const updateHud = () => {
            if (uiGen && uiPoly && uiScore && uiTemp) {
                uiGen.innerText = generation.toString();
                uiPoly.innerText = bestSpecimen.polygons.length.toString();
                uiScore.innerText = bestScore.toLocaleString();
                const baselineScore = Math.max(initialScore, 1);
                const currentTemp = bestScore / baselineScore;
                uiTemp.innerText = currentTemp.toFixed(4);
            }
        };

        const resetSimulation = async () => {
            const runVersion = ++simulationVersion;
            generation = 0;
            generationsSinceImprovement = 0;
            bestSpecimen = new Specimen(canvas.width, canvas.height, 5);
            bestSpecimen.draw(ctx, canvas.width, canvas.height);
            bestScore = await evaluateFitnessAsync(ctx, canvas.width, canvas.height);

            if (simulationVersion !== runVersion) {
                return;
            }

            initialScore = bestScore;
            if (toggleButton) {
                toggleButton.textContent = 'Pause';
            }
            isRunning = true;
            updateHud();
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(evolveLoop);
        };

        const evolveLoop = async () => {
            const loopVersion = simulationVersion;

            if (!isRunning || simulationVersion !== loopVersion) {
                return;
            }

            // run multiple mutation attempts per frame so evolution happens fast
            for (let i = 0; i < 10; i++) {
                if (!isRunning || simulationVersion !== loopVersion) {
                    return;
                }

                generation++;
                generationsSinceImprovement++;

                // clone the current best and mutate the clone
                const temperature = bestScore / Math.max(initialScore, 1);
                const child = bestSpecimen.clone();
                child.mutate(canvas.width, canvas.height, temperature);

                // draw and grade the child
                child.draw(ctx, canvas.width, canvas.height);
                const childScore = await evaluateFitnessAsync(ctx, canvas.width, canvas.height);

                if (!isRunning || simulationVersion !== loopVersion) {
                    return;
                }

                // if the child has a lower error score, it becomes our new parent!
                if (childScore < bestScore) {
                    bestSpecimen = child;
                    bestScore = childScore;
                    generationsSinceImprovement = 0;

                    bestSpecimen.draw(ctx, canvas.width, canvas.height);

                    console.log(
                        `Gen ${generation} | New Best Score: ${bestScore} | Polygons: ${bestSpecimen.polygons.length}`
                    );
                }

                // plateau check: dynamically scale based on complexity
                // 5 polygons = wait ~75 gens, 50 polygons = wait ~750 gens
                const plateauThreshold = bestSpecimen.polygons.length * 8;

                if (generationsSinceImprovement > plateauThreshold) {
                    bestSpecimen.addPolygon(canvas.width, canvas.height);
                    generationsSinceImprovement = 0;

                    // we must redraw and recalculate the parent's score immediately.
                    bestSpecimen.draw(ctx, canvas.width, canvas.height);
                    bestScore = await evaluateFitnessAsync(ctx, canvas.width, canvas.height);

                    if (!isRunning || simulationVersion !== loopVersion) {
                        return;
                    }

                    console.log(
                        `Plateau reached! Added polygon. Total: ${bestSpecimen.polygons.length}`
                    );
                }
            }

            if (!isRunning || simulationVersion !== loopVersion) {
                return;
            }

            updateHud();
            animationFrameId = requestAnimationFrame(evolveLoop);
        };

        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                if (isRunning) {
                    isRunning = false;
                    toggleButton.textContent = 'Play';
                    cancelAnimationFrame(animationFrameId);
                    return;
                }

                simulationVersion++;
                isRunning = true;
                toggleButton.textContent = 'Pause';
                animationFrameId = requestAnimationFrame(evolveLoop);
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                cancelAnimationFrame(animationFrameId);
                resetSimulation();
            });
        }

        if (exportButton) {
            exportButton.addEventListener('click', () => {
                const svg = bestSpecimen.toSvg(canvas.width, canvas.height);
                const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'genetic-art.svg';
                link.click();
                URL.revokeObjectURL(url);
            });
        }

        if (uploadInput) {
            uploadInput.addEventListener('change', (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) {
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    const uploadedImage = new Image();
                    uploadedImage.onload = async () => {
                        normalizeTargetImage(uploadedImage);
                        console.log('Uploaded image normalized to target canvas.');
                        cancelAnimationFrame(animationFrameId);
                        await resetSimulation();
                    };
                    uploadedImage.src = String(reader.result);
                };
                reader.readAsDataURL(file);
            });
        }

        requestAnimationFrame(evolveLoop);
    };
}
