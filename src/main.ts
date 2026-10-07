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
        let bestSpecimen = new Specimen(canvas.width, canvas.height, 50);
        bestSpecimen.draw(ctx, canvas.width, canvas.height);

        let bestScore = calculateFitness(ctx, canvas.width, canvas.height, targetPixelData);
        console.log('Initial random specimen error score:', bestScore);

        let generation = 0;

        const evolveLoop = () => {
            // run multiple mutation attempts per frame so evolution happens fast
            for (let i = 0; i < 10; i++) {
                generation++;

                // clone the current best and mutate the clone
                const child = bestSpecimen.clone();
                child.mutate(canvas.width, canvas.height);

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

                    bestSpecimen.draw(ctx, canvas.width, canvas.height);

                    console.log(`Gen ${generation} | New Best Score: ${bestScore}`);
                }
            }

            requestAnimationFrame(evolveLoop);
        };

        requestAnimationFrame(evolveLoop);
    };
}
