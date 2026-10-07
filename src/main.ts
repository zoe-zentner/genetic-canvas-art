import './style.css';

const canvas = document.getElementById('artCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (ctx) {
    ctx.beginPath();
    ctx.moveTo(50, 50); // point 1: top left
    ctx.lineTo(200, 100); // point 2: middle right
    ctx.lineTo(100, 200); // point 3: buttom middle
    ctx.closePath();

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
} else {
    console.error('Browser doesnt support HTML5 Canvas');
}
