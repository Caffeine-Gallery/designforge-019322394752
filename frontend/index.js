import { backend } from "declarations/backend";

class DesignTool {
    constructor() {
        this.canvas = document.getElementById("design-canvas");
        this.drawingCanvas = document.getElementById("drawing-canvas");
        this.drawingContext = this.drawingCanvas.getContext("2d");
        this.selectedElement = null;
        this.isDragging = false;
        this.isRotating = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.rotation = 0;
        this.scale = 1;
        this.undoStack = [];
        this.redoStack = [];
        this.layers = [];
        this.currentLayer = null;
        this.clipboard = null;
        this.gridEnabled = false;
        this.snapEnabled = false;
        this.rulersEnabled = false;
        this.drawingMode = false;
        this.currentTool = 'select';
        this.shapes = [];
        this.paths = [];
        this.currentPath = [];
        this.recentColors = [];
        this.lastAutoSave = null;
        this.autoSaveInterval = 30000;
        this.zoomLevel = 1;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySteps = 50;

        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
        this.setupAutoSave();
        this.initializeCanvas();
        this.loadUserPreferences();
    }

    initializeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.drawingCanvas.width = rect.width;
        this.drawingCanvas.height = rect.height;
        this.setupDrawingContext();
        this.createInitialLayer();
    }

    createInitialLayer() {
        this.addLayer("Background");
        this.currentLayer = this.layers[0];
    }

    setupDrawingContext() {
        const ctx = this.drawingContext;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = document.getElementById('strokeColor').value;
        ctx.lineWidth = document.getElementById('strokeWidth').value;
    }

    initializeEventListeners() {
        // Mouse Events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch Events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Tool Selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setCurrentTool(e.currentTarget.dataset.tool);
            });
        });

        // Color Selection
        document.getElementById('fillColor').addEventListener('change', (e) => {
            this.setFillColor(e.target.value);
        });

        document.getElementById('strokeColor').addEventListener('change', (e) => {
            this.setStrokeColor(e.target.value);
        });

        // Zoom Controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.1));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.9));

        // Layer Controls
        document.getElementById('addLayerBtn').addEventListener('click', () => {
            this.addLayer(`Layer ${this.layers.length + 1}`);
        });

        // Save/Load
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDesign());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportDesign());
    }

    handleMouseDown(e) {
        if (e.target === this.canvas) {
            const pos = this.getMousePosition(e);
            
            if (this.currentTool === 'draw') {
                this.startDrawing(pos);
            } else if (this.currentTool === 'select') {
                this.startSelection(pos);
            }
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePosition(e);
        
        if (this.isDragging) {
            if (this.currentTool === 'draw') {
                this.draw(pos);
            } else if (this.currentTool === 'select' && this.selectedElement) {
                this.moveSelectedElement(pos);
            }
        }

        this.updateStatusBar(pos);
    }

    handleMouseUp() {
        if (this.isDragging) {
            if (this.currentTool === 'draw') {
                this.finishDrawing();
            } else if (this.currentTool === 'select') {
                this.finishMoving();
            }
        }
        
        this.isDragging = false;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown({
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: e.target
        });
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp();
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoomLevel,
            y: (e.clientY - rect.top) / this.zoomLevel
        };
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        this.updateCursor();
    }

    updateCursor() {
        switch (this.currentTool) {
            case 'select':
                this.canvas.style.cursor = 'default';
                break;
            case 'draw':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'move':
                this.canvas.style.cursor = 'move';
                break;
            default:
                this.canvas.style.cursor = 'default';
        }
    }

    startDrawing(pos) {
        this.isDragging = true;
        this.currentPath = [pos];
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(pos.x, pos.y);
    }

    draw(pos) {
        if (!this.isDragging) return;
        
        this.currentPath.push(pos);
        this.drawingContext.lineTo(pos.x, pos.y);
        this.drawingContext.stroke();
    }

    finishDrawing() {
        if (this.currentPath.length > 1) {
            this.paths.push({
                points: this.currentPath,
                strokeStyle: this.drawingContext.strokeStyle,
                lineWidth: this.drawingContext.lineWidth,
                layerId: this.currentLayer.id
            });
            this.saveState();
        }
        this.currentPath = [];
    }

    addLayer(name) {
        const layer = {
            id: Date.now(),
            name: name,
            visible: true,
            locked: false,
            elements: []
        };
        this.layers.push(layer);
        this.updateLayersList();
        return layer;
    }

    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        layersList.innerHTML = '';
        
        this.layers.forEach(layer => {
            const layerElement = document.createElement('div');
            layerElement.className = 'layer-item';
            if (layer === this.currentLayer) {
                layerElement.classList.add('selected');
            }
            
            layerElement.innerHTML = `
                <input type="checkbox" ${layer.visible ? 'checked' : ''}>
                <span>${layer.name}</span>
                <button class="layer-lock-btn">
                    <i class="fas fa-${layer.locked ? 'lock' : 'lock-open'}"></i>
                </button>
            `;
            
            layersList.appendChild(layerElement);
        });
    }

    async saveDesign() {
        const designName = document.getElementById('designName').value;
        if (!designName) {
            this.showNotification('Please enter a design name', 'error');
            return;
        }

        this.showLoading();
        try {
            const designData = {
                layers: this.layers,
                paths: this.paths,
                version: 1,
                timestamp: Date.now()
            };

            await backend.saveDesign(designName, JSON.stringify(designData));
            this.showNotification('Design saved successfully', 'success');
        } catch (error) {
            console.error('Error saving design:', error);
            this.showNotification('Error saving design', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.getElementById('notifications').appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    setupAutoSave() {
        setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.autoSave();
            }
        }, this.autoSaveInterval);
    }

    hasUnsavedChanges() {
        return this.undoStack.length > 0;
    }

    async autoSave() {
        const designData = {
            layers: this.layers,
            paths: this.paths,
            version: 1,
            timestamp: Date.now()
        };

        localStorage.setItem('autoSave', JSON.stringify(designData));
    }

    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel));
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        document.getElementById('zoomLevel').value = Math.round(this.zoomLevel * 100) + '%';
    }

    saveState() {
        const state = {
            layers: JSON.parse(JSON.stringify(this.layers)),
            paths: JSON.parse(JSON.stringify(this.paths))
        };

        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistorySteps) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentState = {
            layers: JSON.parse(JSON.stringify(this.layers)),
            paths: JSON.parse(JSON.stringify(this.paths))
        };
        
        this.redoStack.push(currentState);
        const previousState = this.undoStack.pop();
        
        this.layers = previousState.layers;
        this.paths = previousState.paths;
        this.redraw();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentState = {
            layers: JSON.parse(JSON.stringify(this.layers)),
            paths: JSON.parse(JSON.stringify(this.paths))
        };
        
        this.undoStack.push(currentState);
        const nextState = this.redoStack.pop();
        
        this.layers = nextState.layers;
        this.paths = nextState.paths;
        this.redraw();
    }

    redraw() {
        this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        this.layers.forEach(layer => {
            if (!layer.visible) return;
            
            layer.elements.forEach(element => {
                this.drawElement(element);
            });
        });

        this.paths.forEach(path => {
            const layer = this.layers.find(l => l.id === path.layerId);
            if (layer && layer.visible) {
                this.drawPath(path);
            }
        });
    }

    drawElement(element) {
        switch (element.type) {
            case 'shape':
                this.drawShape(element);
                break;
            case 'text':
                this.drawText(element);
                break;
        }
    }

    drawShape(shape) {
        this.drawingContext.save();
        
        this.drawingContext.fillStyle = shape.fillStyle;
        this.drawingContext.strokeStyle = shape.strokeStyle;
        this.drawingContext.lineWidth = shape.lineWidth;
        
        this.drawingContext.beginPath();
        
        switch (shape.shapeType) {
            case 'rectangle':
                this.drawingContext.rect(shape.x, shape.y, shape.width, shape.height);
                break;
            case 'circle':
                this.drawingContext.arc(shape.x + shape.width/2, shape.y + shape.height/2, 
                    Math.min(shape.width, shape.height)/2, 0, Math.PI * 2);
                break;
        }
        
        if (shape.fillStyle) this.drawingContext.fill();
        if (shape.strokeStyle) this.drawingContext.stroke();
        
        this.drawingContext.restore();
    }

    drawText(text) {
        this.drawingContext.save();
        
        this.drawingContext.font = `${text.fontSize}px ${text.fontFamily}`;
        this.drawingContext.fillStyle = text.fillStyle;
        this.drawingContext.textAlign = text.textAlign;
        
        this.drawingContext.fillText(text.content, text.x, text.y);
        
        this.drawingContext.restore();
    }

    drawPath(path) {
        this.drawingContext.save();
        
        this.drawingContext.strokeStyle = path.strokeStyle;
        this.drawingContext.lineWidth = path.lineWidth;
        
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(path.points[0].x, path.points[0].y);
        
        for (let i = 1; i < path.points.length; i++) {
            this.drawingContext.lineTo(path.points[i].x, path.points[i].y);
        }
        
        this.drawingContext.stroke();
        this.drawingContext.restore();
    }
}

// Initialize the design tool
const designTool = new DesignTool();
