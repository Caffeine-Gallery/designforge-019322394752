import { backend } from "declarations/backend";

class DesignTool {
    constructor() {
        this.drawingCanvas = document.getElementById("drawing-canvas");
        this.designCanvas = document.getElementById("design-canvas");
        
        if (!this.drawingCanvas || !this.designCanvas) {
            throw new Error("Required canvas elements not found");
        }

        this.drawingContext = this.drawingCanvas.getContext("2d");
        this.isDragging = false;
        this.currentTool = 'select';
        this.currentPath = [];
        this.paths = [];
        this.shapes = [];
        
        this.initializeCanvas();
        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
    }

    initializeCanvas() {
        const container = this.drawingCanvas.parentElement;
        this.drawingCanvas.width = container.clientWidth;
        this.drawingCanvas.height = container.clientHeight;
        
        this.drawingContext.lineCap = 'round';
        this.drawingContext.lineJoin = 'round';
        this.drawingContext.strokeStyle = '#000000';
        this.drawingContext.lineWidth = 2;
    }

    initializeEventListeners() {
        this.drawingCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        window.addEventListener('resize', () => {
            this.initializeCanvas();
            this.redraw();
        });

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setCurrentTool(e.currentTarget.dataset.tool);
            });
        });

        document.getElementById('strokeColor').addEventListener('change', (e) => {
            this.drawingContext.strokeStyle = e.target.value;
        });

        document.getElementById('strokeWidth').addEventListener('change', (e) => {
            this.drawingContext.lineWidth = e.target.value;
        });
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'v':
                    this.setCurrentTool('select');
                    break;
                case 'b':
                    this.setCurrentTool('draw');
                    break;
                case 's':
                    this.setCurrentTool('shape');
                    break;
                case 't':
                    this.setCurrentTool('text');
                    break;
                case 'z':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.undo();
                    }
                    break;
                case 'y':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.redo();
                    }
                    break;
            }
        });
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        document.getElementById('tool-info').textContent = `Current Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`;
    }

    handleMouseDown(e) {
        this.isDragging = true;
        const pos = this.getMousePosition(e);
        
        if (this.currentTool === 'draw') {
            this.startDrawing(pos);
        }
        
        this.updateStatusBar(pos);
    }

    handleMouseMove(e) {
        const pos = this.getMousePosition(e);
        
        if (this.isDragging && this.currentTool === 'draw') {
            this.draw(pos);
        }
        
        this.updateStatusBar(pos);
    }

    handleMouseUp() {
        if (this.isDragging && this.currentTool === 'draw') {
            this.finishDrawing();
        }
        this.isDragging = false;
    }

    getMousePosition(e) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    updateStatusBar(pos) {
        document.getElementById('coordinates').textContent = 
            `X: ${Math.round(pos.x)} Y: ${Math.round(pos.y)}`;
    }

    startDrawing(pos) {
        this.currentPath = [pos];
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(pos.x, pos.y);
    }

    draw(pos) {
        this.currentPath.push(pos);
        this.drawingContext.lineTo(pos.x, pos.y);
        this.drawingContext.stroke();
    }

    finishDrawing() {
        if (this.currentPath.length > 1) {
            this.paths.push({
                points: this.currentPath,
                strokeStyle: this.drawingContext.strokeStyle,
                lineWidth: this.drawingContext.lineWidth
            });
        }
        this.currentPath = [];
    }

    redraw() {
        this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        this.paths.forEach(path => {
            this.drawingContext.strokeStyle = path.strokeStyle;
            this.drawingContext.lineWidth = path.lineWidth;
            
            this.drawingContext.beginPath();
            this.drawingContext.moveTo(path.points[0].x, path.points[0].y);
            
            path.points.forEach(point => {
                this.drawingContext.lineTo(point.x, point.y);
            });
            
            this.drawingContext.stroke();
        });
    }

    undo() {
        if (this.paths.length > 0) {
            this.paths.pop();
            this.redraw();
        }
    }

    redo() {
        // Implement redo functionality
    }
}

// Initialize the design tool
try {
    const designTool = new DesignTool();
} catch (error) {
    console.error("Failed to initialize design tool:", error);
}
