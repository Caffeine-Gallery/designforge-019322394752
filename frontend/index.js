import { backend } from "declarations/backend";

let selectedElement = null;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const canvas = document.getElementById("design-canvas");
const loadingSpinner = document.getElementById("loading");

function showLoading() {
    loadingSpinner.style.display = "block";
}

function hideLoading() {
    loadingSpinner.style.display = "none";
}

function createShape(type) {
    const shape = document.createElement("div");
    shape.className = `shape ${type}`;
    shape.style.backgroundColor = document.getElementById("colorPicker").value;
    shape.style.left = "50px";
    shape.style.top = "50px";
    
    shape.addEventListener("mousedown", startDragging);
    shape.addEventListener("click", (e) => {
        if (selectedElement) {
            selectedElement.classList.remove("selected");
        }
        selectedElement = shape;
        shape.classList.add("selected");
        e.stopPropagation();
    });

    canvas.appendChild(shape);
    return shape;
}

function startDragging(e) {
    if (e.target === canvas) return;
    
    selectedElement = e.target;
    isDragging = true;
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === canvas) {
        selectedElement = null;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(currentX, currentY, selectedElement);
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.left = `${xPos}px`;
    el.style.top = `${yPos}px`;
}

function stopDragging() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

document.getElementById("rectangleBtn").addEventListener("click", () => {
    createShape("rectangle");
});

document.getElementById("circleBtn").addEventListener("click", () => {
    createShape("circle");
});

document.getElementById("deleteBtn").addEventListener("click", () => {
    if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
    }
});

document.getElementById("saveBtn").addEventListener("click", async () => {
    const designName = document.getElementById("designName").value;
    if (!designName) {
        alert("Please enter a design name");
        return;
    }

    showLoading();
    const elements = Array.from(canvas.children).map(el => ({
        type: el.classList.contains("rectangle") ? "rectangle" : "circle",
        color: el.style.backgroundColor,
        x: el.style.left,
        y: el.style.top
    }));

    try {
        await backend.saveDesign(designName, JSON.stringify(elements));
        alert("Design saved successfully!");
        loadDesignList();
    } catch (error) {
        console.error("Error saving design:", error);
        alert("Error saving design");
    } finally {
        hideLoading();
    }
});

async function loadDesignList() {
    showLoading();
    try {
        const designs = await backend.listDesigns();
        const loadList = document.getElementById("loadList");
        loadList.innerHTML = "";
        designs.forEach(name => {
            const item = document.createElement("button");
            item.className = "list-group-item list-group-item-action";
            item.textContent = name;
            item.onclick = () => loadDesign(name);
            loadList.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading design list:", error);
    } finally {
        hideLoading();
    }
}

async function loadDesign(name) {
    showLoading();
    try {
        const designData = await backend.loadDesign(name);
        if (designData) {
            canvas.innerHTML = "";
            const elements = JSON.parse(designData);
            elements.forEach(el => {
                const shape = createShape(el.type);
                shape.style.backgroundColor = el.color;
                shape.style.left = el.x;
                shape.style.top = el.y;
            });
        }
    } catch (error) {
        console.error("Error loading design:", error);
        alert("Error loading design");
    } finally {
        hideLoading();
    }
}

document.getElementById("loadBtn").addEventListener("click", loadDesignList);

canvas.addEventListener("mousedown", startDragging);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", stopDragging);
canvas.addEventListener("click", () => {
    if (selectedElement) {
        selectedElement.classList.remove("selected");
        selectedElement = null;
    }
});

// Initial load of design list
loadDesignList();
