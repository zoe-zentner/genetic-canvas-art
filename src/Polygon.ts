export class Polygon {
    // A polygon is a list of coordinates and a color
    points: { x: number; y: number }[];
    color: { r: number; g: number; b: number; a: number };

    constructor(canvasWidth: number, canvasHeight: number, numPoints: number = 3) {
        this.points = [];
        this.color = { r: 0, g: 0, b: 0, a: 1 };

        for (let i = 0; i < numPoints; i++) {
            this.points.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
            });
        }

        this.color = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256),
            a: Math.random() * 0.4 + 0.1,
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.points.length === 0) return;

        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        if (this.points.length === 1) {
            ctx.closePath;
        }
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath;

        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        ctx.fill();
    }

    mutate(canvasWidth: number, canvasHeight: number) {
        // 30% change to mutate a color property
        if (Math.random() < 0.3) {
            const property = ['r', 'g', 'b', 'a'][Math.floor(Math.random() * 4)];
            if (property === 'a') {
                this.color.a = Math.min(
                    1,
                    Math.max(0.05, this.color.a + (Math.random() - 0.5) * 0.2)
                );
            } else {
                const channel = property as 'r' | 'g' | 'b';
                this.color[channel] = Math.min(
                    255,
                    Math.max(0, Math.floor(this.color[channel] + (Math.random() - 0.5) * 50))
                );
            }
        }

        // 30% chance to mutate a point coordinate
        if (Math.random() < 0.3 && this.points.length > 0) {
            const pIndex = Math.floor(Math.random() * this.points.length);
            this.points[pIndex].x = Math.min(
                canvasWidth,
                Math.max(0, this.points[pIndex].x + (Math.random() - 0.5) * 40)
            );
            this.points[pIndex].y = Math.min(
                canvasHeight,
                Math.max(0, this.points[pIndex].y + (Math.random() - 0.5) * 40)
            );
        }
    }
}
