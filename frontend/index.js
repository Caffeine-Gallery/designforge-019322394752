// Add to the DesignTool class

class DesignTool {
    constructor() {
        // ... existing constructor code ...
        
        this.initializeDrawingCanvas();
        this.isDrawing = false;
        this.drawingMode = false;
        this.currentPath = [];
        this.paths = [];
        this.drawingContext = null;
    }

    initializeDrawingCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'drawing-canvas';
        this.canvas.appendChild(canvas);
        
        this.drawingCanvas = canvas;
        this.drawingContext = canvas.getContext('2d');
        
        this.resizeDrawingCanvas();
        window.addEventListener('resize', () => this.resizeDrawingCanvas());
        
        // Drawing event listeners
        canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        canvas.addEventListener('mousemove', this.draw.bind(this));
        canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        });
        
        canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    resizeDrawingCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.drawingCanvas.width = rect.width;
        this.drawingCanvas.height = rect.height;
        
        // Restore drawing context properties after resize
        this.setupDrawingContext();
    }

    setupDrawingContext() {
        const ctx = this.drawingContext;
        const brushSize = document.getElementById('brushSize').value;
        const color = document.getElementById('colorPicker').value;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    startDrawing(e) {
        if (!this.drawingMode) return;
        
        this.isDrawing = true;
        const pos = this.getDrawingPosition(e);
        this.currentPath = [pos];
        
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(pos.x, pos.y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getDrawingPosition(e);
        this.currentPath.push(pos);
        
        const smoothing = document.getElementById('brushSmoothing').value / 100;
        this.drawSmoothedPath(this.currentPath, smoothing);
    }

    drawSmoothedPath(points, smoothing) {
        if (points.length < 2) return;
        
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) * 0.5;
            const yc = (points[i].y + points[i + 1].y) * 0.5;
            
            const x1 = points[i].x;
            const y1 = points[i].y;
            
            const x2 = xc;
            const y2 = yc;
            
            this.drawingContext.quadraticCurveTo(x1, y1, x2, y2);
        }
        
        if (points.length > 2) {
            const last = points[points.length - 1];
            const secondLast = points[points.length - 2];
            this.drawingContext.quadraticCurveTo(
                secondLast.x,
                secondLast.y,
                last.x,
                last.y
            );
        }
        
        this.drawingContext.stroke();
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        if (this.currentPath.length > 1) {
            this.paths.push({
                points: this.currentPath,
                color: this.drawingContext.strokeStyle,
                size: this.drawingContext.lineWidth,
                type: 'drawing'
            });
            this.saveState();
        }
        this.currentPath = [];
    }

    getDrawingPosition(e) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    toggleDrawingMode() {
        this.drawingMode = !this.drawingMode;
        this.drawingCanvas.classList.toggle('active', this.drawingMode);
        document.querySelector('[data-tool="brush"]').classList.toggle('active', this.drawingMode);
        document.querySelector('.brush-settings').style.display = this.drawingMode ? 'block' : 'none';
    }

    // Add to existing saveDesign method
    async saveDesign(name) {
        const designData = {
            elements: Array.from(this.canvas.children).map(el => ({
                // ... existing element mapping ...
            })),
            paths: this.paths
        };
        
        await backend.saveDesign(name, JSON.stringify(designData));
    }

    // Add to existing loadDesign method
    async loadDesign(name) {
        const designData = await backend.loadDesign(name);
        if (designData) {
            const data = JSON.parse(designData);
            
            // Clear existing content
            this.canvas.innerHTML = '';
            this.paths = [];
            
            // Load elements
            // ... existing element loading ...
            
            // Load paths
            if (data.paths) {
                this.paths = data.paths;
                this.redrawPaths();
            }
        }
    }

    redrawPaths() {
        this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        for (const path of this.paths) {
            this.drawingContext.strokeStyle = path.color;
            this.drawingContext.lineWidth = path.size;
            this.drawSmoothedPath(path.points, 0.5);
        }
    }
}

// Initialize brush size preview
document.getElementById('brushSize').addEventListener('input', (e) => {
    const size = e.target.value;
    const preview = document.querySelector('.brush-preview::after');
    preview.style.width = size + 'px';
    preview.style.height = size + 'px';
});

// Add keyboard shortcut for drawing mode
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'b') {
        designTool.toggleDrawingMode();
    }
});
