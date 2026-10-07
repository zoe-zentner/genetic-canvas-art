import './style.css';
import { Specimen } from './Specimen';
import { calculateFitness } from './Fitness';

const canvas = document.getElementById('artCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

// we will store the target's raw pixel array here
let targetPixelData: Uint8ClampedArray;

if (ctx) {
    const img = new Image();
    img.src = '/target.png';

    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        targetPixelData = imageData.data;
        console.log('Target data loaded! Array length:', targetPixelData.length);

        // initialize our starting parent specimen and score it
        let bestSpecimen = new Specimen(canvas.width, canvas.height, 5);
        bestSpecimen.draw(ctx, canvas.width, canvas.height);

        let bestScore = calculateFitness(ctx, canvas.width, canvas.height, targetPixelData);
        const initialScore = bestScore;
        console.log('Initial random specimen error score:', bestScore);

        let generation = 0;
        let generationsSinceImprovement = 0; // tracker for how long we've been stuck

        const evolveLoop = () => {
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
                const childScore = calculateFitness(
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

                // plateu check: if stuck for 500 generations, add a new polygon
                if (generationsSinceImprovement > 500) {
                    bestSpecimen.addPolygon(canvas.width, canvas.height);
                    generationsSinceImprovement = 0;

                    // we must redraw and recalculate the parent's score immediately.
                    // a new random triangle usually worsens the score initially,
                    // and we need the loop to accept this temporary dip.
                    bestSpecimen.draw(ctx, canvas.width, canvas.height);
                    bestScore = calculateFitness(ctx, canvas.width, canvas.height, targetPixelData);

                    console.log(
                        `Plateau reached! Added polygon. Total: ${bestSpecimen.polygons.length}`
                    );
                }
            }

            requestAnimationFrame(evolveLoop);
        };

        requestAnimationFrame(evolveLoop);
    };
}
