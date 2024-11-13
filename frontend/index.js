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
        this.currentTool = 'draw'; // Set draw as default tool
        this.currentPath = [];
        this.paths = [];
        this.shapes = [];
        
        this.initializeCanvas();
        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
        
        // Set initial tool
        this.setCurrentTool('draw');
    }

    initializeCanvas() {
        const container = this.drawingCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size to match container
        this.drawingCanvas.width = rect.width;
        this.drawingCanvas.height = rect.height;
        
        // Set initial drawing context properties
        this.drawingContext.lineCap = 'round';
        this.drawingContext.lineJoin = 'round';
        this.drawingContext.strokeStyle = '#000000';
        this.drawingContext.lineWidth = 2;
        
        // Enable anti-aliasing
        this.drawingContext.imageSmoothingEnabled = true;
        this.drawingContext.imageSmoothingQuality = 'high';
    }

    initializeEventListeners() {
        // Mouse events
        this.drawingCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.drawingCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch events
        this.drawingCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.drawingCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.drawingCanvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Prevent scrolling while drawing
        this.drawingCanvas.addEventListener('touchstart', (e) => e.preventDefault());

        // Window resize
        window.addEventListener('resize', () => {
            this.initializeCanvas();
            this.redraw();
        });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setCurrentTool(e.currentTarget.dataset.tool);
            });
        });

        // Color picker
        const strokeColor = document.getElementById('strokeColor');
        if (strokeColor) {
            strokeColor.addEventListener('change', (e) => {
                this.drawingContext.strokeStyle = e.target.value;
            });
        }

        // Stroke width
        const strokeWidth = document.getElementById('strokeWidth');
        if (strokeWidth) {
            strokeWidth.addEventListener('change', (e) => {
                this.drawingContext.lineWidth = parseInt(e.target.value);
            });
        }
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            } else {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        this.setCurrentTool('draw');
                        break;
                    case 'v':
                        this.setCurrentTool('select');
                        break;
                    case 's':
                        this.setCurrentTool('shape');
                        break;
                    case 't':
                        this.setCurrentTool('text');
                        break;
                }
            }
        });
    }

    handleMouseDown(e) {
        if (this.currentTool !== 'draw') return;
        
        this.isDragging = true;
        const pos = this.getMousePosition(e);
        this.startDrawing(pos);
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

    handleTouchStart(e) {
        e.preventDefault();
        if (this.currentTool !== 'draw') return;
        
        const touch = e.touches[0];
        this.isDragging = true;
        const pos = this.getTouchPosition(touch);
        this.startDrawing(pos);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || this.currentTool !== 'draw') return;
        
        const touch = e.touches[0];
        const pos = this.getTouchPosition(touch);
        this.draw(pos);
    }

    handleTouchEnd() {
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

    getTouchPosition(touch) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    updateStatusBar(pos) {
        const coordinates = document.getElementById('coordinates');
        if (coordinates) {
            coordinates.textContent = `X: ${Math.round(pos.x)} Y: ${Math.round(pos.y)}`;
        }
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
        
        // Update cursor style
        this.drawingCanvas.style.cursor = tool === 'draw' ? 'crosshair' : 'default';
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update tool info
        const toolInfo = document.getElementById('tool-info');
        if (toolInfo) {
            toolInfo.textContent = `Current Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`;
        }
    }

    startDrawing(pos) {
        this.currentPath = [pos];
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(pos.x, pos.y);
    }

    draw(pos) {
        this.currentPath.push(pos);
        this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        // Redraw all previous paths
        this.redraw();
        
        // Draw current path
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(this.currentPath[0].x, this.currentPath[0].y);
        
        for (let i = 1; i < this.currentPath.length; i++) {
            this.drawingContext.lineTo(this.currentPath[i].x, this.currentPath[i].y);
        }
        
        this.drawingContext.stroke();
    }

    finishDrawing() {
        if (this.currentPath.length > 1) {
            this.paths.push({
                points: [...this.currentPath],
                strokeStyle: this.drawingContext.strokeStyle,
                lineWidth: this.drawingContext.lineWidth
            });
        }
        this.currentPath = [];
    }

    redraw() {
        this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        for (const path of this.paths) {
            this.drawingContext.beginPath();
            this.drawingContext.strokeStyle = path.strokeStyle;
            this.drawingContext.lineWidth = path.lineWidth;
            
            this.drawingContext.moveTo(path.points[0].x, path.points[0].y);
            
            for (let i = 1; i < path.points.length; i++) {
                this.drawingContext.lineTo(path.points[i].x, path.points[i].y);
            }
            
            this.drawingContext.stroke();
        }
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
window.addEventListener('load', () => {
    try {
        window.designTool = new DesignTool();
    } catch (error) {
        console.error("Failed to initialize design tool:", error);
    }
});
