let session = null;
let maxN = 0;
let isProcessing = false;
let frameCounter = 0; // Tracks passing frames to handle skipping logic

const video = document.getElementById('sharkVideo');
const canvas = document.getElementById('detectionCanvas');
const ctx = canvas.getContext('2d');

// 1. Initialize ONNX Runtime with Auto-Fallback Engine
async function initModel() {
    console.log("Initializing Stable ONNX Engine...");
    try {
        session = await ort.InferenceSession.create('./my_model.onnx', { 
            executionProviders: ['webgl', 'wasm'] 
        });
        console.log("ONNX WebGL/WASM Session initialized successfully.");
    } catch (e) {
        console.warn("WebGL failed, switching to WASM Core CPU mode:", e);
        try {
            session = await ort.InferenceSession.create('./my_model.onnx', { 
                executionProviders: ['wasm'] 
            });
            console.log("WASM Core Engine active.");
        } catch (err) {
            console.error("Critical error: Unable to load ONNX model weights:", err);
        }
    }
}

function transitionToAI() {
    document.getElementById('phaseTitle').innerText = "Phase 2: Automated AI MaxN Extraction";
    document.getElementById('phaseDesc').innerText = "YOLO11 is actively decoding matrix tensor arrays to map real-time coordinates.";
    document.getElementById('analyticsDisplay').style.display = "block";
    document.getElementById('actionBtn').style.display = "none";

    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 450;

    video.currentTime = 0;
    video.play();
    
    runInferenceLoop();
}

// 2. High-Performance Frame-Skipping Parsing Engine
async function runInferenceLoop() {
    if (video.paused || video.ended) {
        isProcessing = false;
        return;
    }

    // --- HIGH SPEED FRAME SKIPPING PERFORMANCE ADJUSTMENT ---
    frameCounter++;
    if (frameCounter % 4 !== 0) {
        // Clear previous bounding lines so they don't stutter or stick over moving frames
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(runInferenceLoop);
        return;
    }

    if (isProcessing || !session) {
        requestAnimationFrame(runInferenceLoop);
        return;
    }

    isProcessing = true;

    try {
        const inputImgSize = 1024;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = inputImgSize;
        tempCanvas.height = inputImgSize;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0, inputImgSize, inputImgSize);
        
        const imgData = tempCtx.getImageData(0, 0, inputImgSize, inputImgSize);
        const { data } = imgData;

        const floatArray = new Float32Array(3 * inputImgSize * inputImgSize);
        let rIdx = 0;
        let gIdx = inputImgSize * inputImgSize;
        let bIdx = 2 * inputImgSize * inputImgSize;

        for (let i = 0; i < data.length; i += 4) {
            floatArray[rIdx++] = data[i] / 255.0;
            floatArray[gIdx++] = data[i + 1] / 255.0;
            floatArray[bIdx++] = data[i + 2] / 255.0;
        }

        const inputTensor = new ort.Tensor('float32', floatArray, [1, 3, inputImgSize, inputImgSize]);
        const feeds = { [session.inputNames[0]]: inputTensor };
        
        const outputMap = await session.run(feeds);
        const outputTensor = outputMap[session.outputNames[0]];
        const outputData = outputTensor.data;
        
        const dims = outputTensor.dims;
        let numDetections = dims[2];
        let numRows = dims[1];
        let isTransposed = false;

        if (dims[1] > dims[2]) {
            numDetections = dims[1];
            numRows = dims[2];
            isTransposed = true;
        }

        let currentFrameSharkCount = 0;
        let candidates = [];

        for (let i = 0; i < numDetections; i++) {
            let cx, cy, w, h, confidence;

            if (!isTransTransposed) {
                // Format layout structure: [1, 5, 21504]
                isTransposed = false; 
                confidence = outputData[4 * numDetections + i];
                if (confidence > 0.35) {
                    cx = outputData[0 * numDetections + i];
                    cy = outputData[1 * numDetections + i];
                    w  = outputData[2 * numDetections + i];
                    h  = outputData[3 * numDetections + i];
                }
            } else {
                // Format layout structure: [1, 21504, 5]
                const rowOffset = i * numRows;
                confidence = outputData[rowOffset + 4];
                if (confidence > 0.35) {
                    cx = outputData[rowOffset + 0];
                    cy = outputData[rowOffset + 1];
                    w  = outputData[rowOffset + 2];
                    h  = outputData[rowOffset + 3];
                }
            }

            if (confidence > 0.35) {
                let scaleX = canvas.width / inputImgSize;
                let scaleY = canvas.height / inputImgSize;

                candidates.push({
                    x: (cx - w / 2) * scaleX,
                    y: (cy - h / 2) * scaleY,
                    w: w * scaleX,
                    h: h * scaleY,
                    score: confidence
                });
            }
        }

        // Apply Non-Maximum Suppression (NMS) to eliminate overlapping duplicate boxes
        candidates.sort((a, b) => b.score - a.score);
        let selectedBoxes = [];
        while (candidates.length > 0) {
            let box = candidates.shift();
            selectedBoxes.push(box);
            candidates = candidates.filter(item => {
                let x1 = Math.max(box.x, item.x);
                let y1 = Math.max(box.y, item.y);
                let x2 = Math.min(box.x + box.w, item.x + item.w);
                let y2 = Math.min(box.y + box.h, item.y + item.h);
                let interW = Math.max(0, x2 - x1);
                let interH = Math.max(0, y2 - y1);
                let interArea = interW * interH;
                let unionArea = (box.w * box.h) + (item.w * item.h) - interArea;
                return (interArea / unionArea) < 0.45;
            });
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentFrameSharkCount = selectedBoxes.length;

        selectedBoxes.forEach(box => {
            ctx.strokeStyle = '#00ffcc'; 
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.w, box.h);

            ctx.fillStyle = 'rgba(0, 255, 204, 0.9)';
            ctx.font = 'bold 13px sans-serif';
            const text = `Blacktip Reef Shark: ${Math.round(box.score * 100)}%`;
            ctx.fillRect(box.x - 1, box.y - 22, ctx.measureText(text).width + 10, 22);
            
            ctx.fillStyle = '#0f172a';
            ctx.fillText(text, box.x + 4, box.y - 6);
        });

        if (currentFrameSharkCount > maxN) {
            maxN = currentFrameSharkCount;
            document.getElementById('maxnValue').innerText = maxN;
        }

        let label = document.getElementById('frameCounterLabel');
        if (!label) {
            label = document.createElement('p');
            label.id = 'frameCounterLabel';
            label.style.fontWeight = '700';
            label.style.fontSize = '1.2rem';
            label.style.color = '#38bdf8';
            document.getElementById('analyticsDisplay').insertBefore(label, document.getElementById('maxnValue').parentNode);
        }
        label.innerText = `Sharks Currently in Frame: ${currentFrameSharkCount}`;

    } catch (err) {
        console.error("Frame inference processing loop error caught:", err);
    }

    isProcessing = false;
    requestAnimationFrame(runInferenceLoop);
}

initModel();
