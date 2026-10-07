import './style.css';
import { Polygon } from './Polygon';

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
    };
}
