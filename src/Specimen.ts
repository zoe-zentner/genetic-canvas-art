import { Polygon } from './Polygon';

export class Specimen {
    polygons: Polygon[];

    constructor(canvasWidth: number, canvasHeight: number, numPolygons: number = 50) {
        this.polygons = [];

        // Instantiate 50 random polygons to form this specimen's DNA
        for (let i = 0; i < numPolygons; i++) {
            this.polygons.push(new Polygon(canvasWidth, canvasHeight, 3));
        }
    }

    // Draw the entire organism onto the canvas
    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.fillStyle = 'white'; // Matches our target's background
        ctx.fillRect(0, 0, width, height);

        for (const poly of this.polygons) {
            poly.draw(ctx);
        }
    }

    clone(): Specimen {
        const clonedSpecimen = new Specimen(0, 0, 0);
        clonedSpecimen.polygons = [];

        for (const poly of this.polygons) {
            const clonedPoly = new Polygon(0, 0, 0); // temporary setup

            clonedPoly.color = { ...poly.color };
            clonedPoly.points = poly.points.map((p) => ({ x: p.x, y: p.y }));

            clonedSpecimen.polygons.push(clonedPoly);
        }

        return clonedSpecimen;
    }

    mutate(canvasWidth: number, canvasHeight: number) {
        for (const poly of this.polygons) {
            if (Math.random() < 0.2) {
                // 20% chance per polygon
                poly.mutate(canvasWidth, canvasHeight);
            }
        }
    }
}
