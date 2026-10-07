import './style.css';
import { Polygon } from './Polygon';

const canvas = document.getElementById('artCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (ctx) {
    // paint the background solid black so the translucent colors pop
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // generate and draw 50 random polygons (triangles)
    for (let i = 0; i < 50; i++) {
        const poly = new Polygon(canvas.width, canvas.height, 3);
        poly.draw(ctx);
    }
}
