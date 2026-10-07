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

// we will store the target's raw pixel array here
let targetPixelData: Uint8ClampedArray;

const fitnessWorker = new Worker(new URL('./FitnessWorker.ts', import.meta.url), {
    type: 'module',
});

const evaluateFitnessAsync = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    targetPixels: Uint8ClampedArray
): Promise<number> => {
    return new Promise((resolve) => {
        const currentPixels = ctx.getImageData(0, 0, width, height).data;

        const handleMessage = (event: MessageEvent<{ score: number }>) => {
            resolve(event.data.score);
            fitnessWorker.removeEventListener('message', handleMessage);
        };

        fitnessWorker.addEventListener('message', handleMessage);
        fitnessWorker.postMessage({ currentPixels, targetPixels });
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

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        targetPixelData = imageData.data;
        console.log('Target data loaded! Array length:', targetPixelData.length);

        // initialize our starting parent specimen and score it
        let bestSpecimen = new Specimen(canvas.width, canvas.height, 5);
        bestSpecimen.draw(ctx, canvas.width, canvas.height);

        let bestScore = await evaluateFitnessAsync(
            ctx,
            canvas.width,
            canvas.height,
            targetPixelData
        );
        const initialScore = bestScore;
        console.log('Initial random specimen error score:', bestScore);

        let generation = 0;
        let generationsSinceImprovement = 0; // tracker for how long we've been stuck
        let isRunning = true;
        let animationFrameId = 0;

        const updateHud = () => {
            if (uiGen && uiPoly && uiScore && uiTemp) {
                uiGen.innerText = generation.toString();
                uiPoly.innerText = bestSpecimen.polygons.length.toString();
                uiScore.innerText = bestScore.toLocaleString();
                const currentTemp = bestScore / initialScore;
                uiTemp.innerText = currentTemp.toFixed(4);
            }
        };

        const resetSimulation = async () => {
            generation = 0;
            generationsSinceImprovement = 0;
            bestSpecimen = new Specimen(canvas.width, canvas.height, 5);
            bestSpecimen.draw(ctx, canvas.width, canvas.height);
            bestScore = await evaluateFitnessAsync(
                ctx,
                canvas.width,
                canvas.height,
                targetPixelData
            );
            if (toggleButton) {
                toggleButton.textContent = 'Pause';
            }
            isRunning = true;
            updateHud();
            animationFrameId = requestAnimationFrame(evolveLoop);
        };

        const evolveLoop = async () => {
            if (!isRunning) {
                return;
            }

            // run multiple mutation attempts per frame so evolution happens fast
            for (let i = 0; i < 10; i++) {
                generation++;
                generationsSinceImprovement++;

                // clone the current best and mutate the clone
                const temperature = bestScore / initialScore;
                const child = bestSpecimen.clone();
                child.mutate(canvas.width, canvas.height, temperature);

                // draw and grade the child
                child.draw(ctx, canvas.width, canvas.height);
                const childScore = await evaluateFitnessAsync(
                    ctx,
                    canvas.width,
                    canvas.height,
                    targetPixelData
                );

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

                // plateau check: if stuck for 500 generations, add a new polygon
                if (generationsSinceImprovement > 500) {
                    bestSpecimen.addPolygon(canvas.width, canvas.height);
                    generationsSinceImprovement = 0;

                    // we must redraw and recalculate the parent's score immediately.
                    // a new random triangle usually worsens the score initially,
                    // and we need the loop to accept this temporary dip.
                    bestSpecimen.draw(ctx, canvas.width, canvas.height);
                    bestScore = await evaluateFitnessAsync(
                        ctx,
                        canvas.width,
                        canvas.height,
                        targetPixelData
                    );

                    console.log(
                        `Plateau reached! Added polygon. Total: ${bestSpecimen.polygons.length}`
                    );
                }
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

        requestAnimationFrame(evolveLoop);
    };
}
