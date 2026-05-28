let session = null;
let maxN = 0;
let isProcessing = false; // Flag to prevent frame stacking/freezing
const video = document.getElementById('sharkVideo');
const canvas = document.getElementById('detectionCanvas');
const ctx = canvas.getContext('2d');

// 1. Initialize ONNX Runtime with WebGL GPU Hardware Acceleration
async function initModel() {
    console.log("Initializing ONNX WebGL execution engine...");
    try {
        // FORCE THE BROWSER TO RUN COMPUTE ON YOUR GRAPHICS CARD
        const options = { executionProviders: ['webgl'] };
        session = await ort.InferenceSession.create('./my_model.onnx', options);
        console.log("GPU Acceleration active! WebGL engine running smoothly.");
    } catch (e) {
        console.warn("WebGL failed, falling back to CPU mode:", e);
        session = await ort.InferenceSession.create('./my_model.onnx');
    }
}

function transitionToAI() {
    document.getElementById('phaseTitle').innerText = "Phase 2: Automated AI MaxN Extraction";
    document.getElementById('phaseDesc').innerText = "YOLO11 is utilizing WebGL GPU channels to run matrix tracking loops natively.";
    document.getElementById('analyticsDisplay').style.display = "block";
    document.getElementById('actionBtn').style.display = "none";

    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 450;

    video.currentTime = 0;
    video.play();
    
    // Kick off the optimized frame-skipping rendering loop
    requestAnimationFrame(runInferenceLoop);
}

// 2. Optimized High-Speed Processing Loop
async function runInferenceLoop() {
    if (video.paused || video.ended) {
        isProcessing = false;
        return;
    }

    // IF THE GPU IS STILL BUSY WITH THE PREVIOUS FRAME, SKIP THIS TICK (Prevents Freezing!)
    if (isProcessing) {
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

        // Optimized flat channel array allocation
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
        
        // Inference step (runs fast on GPU)
        const outputMap = await session.run(feeds);
        const outputTensor = outputMap[session.outputNames[0]];
        
        // YOLO11 outputs shape dimensions [1, 5, 21504]
        const outputData = outputTensor.data;
        const numDetections = outputTensor.dims[2]; 
        
        let currentFrameSharkCount = 0;
        let candidates = [];

        // Parse coordinates and confidence thresholds
        for (let i = 0; i < numDetections; i++) {
            const confidence = outputData[4 * numDetections + i]; 
            
            if (confidence > 0.40) { // Set to 40% to clean up ghost boxes
                let cx = outputData[0 * numDetections + i] * (canvas.width / inputImgSize);
                let cy = outputData[1 * numDetections + i] * (canvas.height / inputImgSize);
                let w  = outputData[2 * numDetections + i] * (canvas.width / inputImgSize);
                let h  = outputData[3 * numDetections + i] * (canvas.height / inputImgSize);
                
                candidates.push({
                    x: cx - w / 2,
                    y: cy - h / 2,
                    w: w,
                    h: h,
                    score: confidence
                });
            }
        }

        // Apply Non-Maximum Suppression (NMS) to clear overlapping duplicate boxes
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

        // Clear and redraw canvas instantly
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

        // MaxN Calculation Update
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
        console.error("Inference loop breakdown:", err);
    }

    isProcessing = false; // Release lock for next frame pass
    requestAnimationFrame(runInferenceLoop);
}

initModel();
