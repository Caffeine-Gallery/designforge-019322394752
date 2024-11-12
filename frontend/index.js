import { backend } from "declarations/backend";

class DesignTool {
    constructor() {
        this.canvas = document.getElementById("design-canvas");
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
        this.undoStack = [];
        this.redoStack = [];
        this.gridEnabled = false;
        this.snapEnabled = false;
        this.recentColors = [];

        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
        this.setupAutoSave();
    }

    initializeEventListeners() {
        // Shape creation buttons
        document.getElementById("rectangleBtn").onclick = () => this.createShape("rectangle");
        document.getElementById("circleBtn").onclick = () => this.createShape("circle");
        document.getElementById("triangleBtn").onclick = () => this.createShape("triangle");
        document.getElementById("starBtn").onclick = () => this.createShape("star");
        document.getElementById("lineBtn").onclick = () => this.createShape("line");
        document.getElementById("textBtn").onclick = () => this.createTextElement();

        // Canvas events
        this.canvas.addEventListener("mousedown", this.startDragging.bind(this));
        document.addEventListener("mousemove", this.drag.bind(this));
        document.addEventListener("mouseup", this.stopDragging.bind(this));
        
        // Color picker
        const colorPicker = document.getElementById("colorPicker");
        colorPicker.addEventListener("change", (e) => {
            if (this.selectedElement) {
                this.selectedElement.style.backgroundColor = e.target.value;
                this.addToRecentColors(e.target.value);
            }
        });

        // Grid and snap controls
        document.getElementById("gridBtn").onclick = this.toggleGrid.bind(this);
        document.getElementById("snapBtn").onclick = this.toggleSnap.bind(this);

        // Undo/Redo
        document.getElementById("undoBtn").onclick = this.undo.bind(this);
        document.getElementById("redoBtn").onclick = this.redo.bind(this);

        // Save/Export
        document.getElementById("saveBtn").onclick = this.saveDesign.bind(this);
        document.getElementById("exportBtn").onclick = this.exportDesign.bind(this);
    }

    initializeKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey) {
                switch(e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.saveDesign();
                        break;
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copyElement();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.pasteElement();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.duplicateElement();
                        break;
                }
            } else if (e.key === "Delete") {
                this.deleteSelectedElement();
            }
        });
    }

    createShape(type) {
        const shape = document.createElement("div");
        shape.className = `shape ${type}`;
        shape.style.backgroundColor = document.getElementById("colorPicker").value;
        shape.style.left = "50px";
        shape.style.top = "50px";
        
        const rotationHandle = document.createElement("div");
        rotationHandle.className = "rotation-handle";
        shape.appendChild(rotationHandle);

        this.addElementListeners(shape);
        this.canvas.appendChild(shape);
        this.selectElement(shape);
        this.saveState();
        
        return shape;
    }

    createTextElement() {
        const text = document.createElement("div");
        text.className = "shape text-element";
        text.contentEditable = true;
        text.innerHTML = "Double click to edit";
        text.style.fontSize = document.getElementById("fontSize").value + "px";
        text.style.fontFamily = document.getElementById("fontFamily").value;
        text.style.color = document.getElementById("colorPicker").value;

        this.addElementListeners(text);
        this.canvas.appendChild(text);
        this.selectElement(text);
        this.saveState();
    }

    addElementListeners(element) {
        element.addEventListener("mousedown", this.startDragging.bind(this));
        element.addEventListener("click", (e) => {
            e.stopPropagation();
            this.selectElement(element);
        });

        if (element.classList.contains("text-element")) {
            element.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                element.focus();
            });
        }
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove("selected");
        }
        this.selectedElement = element;
        element.classList.add("selected");
    }

    startDragging(e) {
        if (e.target.classList.contains("rotation-handle")) {
            this.isRotating = true;
            return;
        }

        if (e.target === this.canvas) {
            this.selectedElement = null;
            return;
        }

        this.isDragging = true;
        this.selectedElement = e.target.classList.contains("shape") ? e.target : e.target.closest(".shape");
        
        this.initialX = e.clientX - this.xOffset;
        this.initialY = e.clientY - this.yOffset;
    }

    drag(e) {
        if (this.isDragging && this.selectedElement) {
            e.preventDefault();
            
            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;

            if (this.snapEnabled) {
                this.currentX = Math.round(this.currentX / 20) * 20;
                this.currentY = Math.round(this.currentY / 20) * 20;
            }

            this.xOffset = this.currentX;
            this.yOffset = this.currentY;

            this.selectedElement.style.left = `${this.currentX}px`;
            this.selectedElement.style.top = `${this.currentY}px`;
        } else if (this.isRotating && this.selectedElement) {
            const rect = this.selectedElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            this.rotation = angle * (180 / Math.PI);
            
            this.selectedElement.style.transform = `rotate(${this.rotation}deg)`;
        }
    }

    stopDragging() {
        if (this.isDragging || this.isRotating) {
            this.saveState();
        }
        this.isDragging = false;
        this.isRotating = false;
    }

    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        document.getElementById("grid-overlay").style.display = 
            this.gridEnabled ? "block" : "none";
    }

    toggleSnap() {
        this.snapEnabled = !this.snapEnabled;
        document.getElementById("snapBtn").classList.toggle("active");
    }

    saveState() {
        this.undoStack.push(this.canvas.innerHTML);
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.canvas.innerHTML);
            this.canvas.innerHTML = this.undoStack.pop();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.canvas.innerHTML);
            this.canvas.innerHTML = this.redoStack.pop();
        }
    }

    async saveDesign() {
        const designName = document.getElementById("designName").value;
        if (!designName) {
            alert("Please enter a design name");
            return;
        }

        showLoading();
        const designData = {
            html: this.canvas.innerHTML,
            timestamp: Date.now()
        };

        try {
            await backend.saveDesign(designName, JSON.stringify(designData));
            alert("Design saved successfully!");
            this.loadDesignList();
        } catch (error) {
            console.error("Error saving design:", error);
            alert("Error saving design");
        } finally {
            hideLoading();
        }
    }

    exportDesign() {
        const data = {
            html: this.canvas.innerHTML,
            css: document.getElementById("design-canvas").style.cssText
        };
        
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'design.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    addToRecentColors(color) {
        if (!this.recentColors.includes(color)) {
            this.recentColors.unshift(color);
            if (this.recentColors.length > 10) {
                this.recentColors.pop();
            }
            this.updateRecentColors();
        }
    }

    updateRecentColors() {
        const container = document.querySelector('.recent-colors');
        container.innerHTML = '';
        this.recentColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.onclick = () => {
                document.getElementById('colorPicker').value = color;
                if (this.selectedElement) {
                    this.selectedElement.style.backgroundColor = color;
                }
            };
            container.appendChild(swatch);
        });
    }

    setupAutoSave() {
        setInterval(() => {
            if (this.canvas.innerHTML !== this.lastAutoSave) {
                this.lastAutoSave = this.canvas.innerHTML;
                localStorage.setItem('autoSave', this.lastAutoSave);
            }
        }, 30000); // Auto-save every 30 seconds

        // Restore auto-saved content
        const autoSaved = localStorage.getItem('autoSave');
        if (autoSaved) {
            this.canvas.innerHTML = autoSaved;
        }
    }
}

// Initialize the design tool
const designTool = new DesignTool();

// Show/hide loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
}
