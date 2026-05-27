let session = null;
let maxN = 0;
const video = document.getElementById('sharkVideo');
const canvas = document.getElementById('detectionCanvas');
const ctx = canvas.getContext('2d');

// 1. Initialize ONNX Runtime with WebGL GPU Hardware Acceleration
async function initModel() {
    console.log("Initializing ONNX WebGL execution engine...");
    try {
        // FORCE THE BROWSER TO RUN COMPUTE ON YOUR GRAPHICS CARD (WebGL)
        const options = { executionProviders: ['webgl'] };
        session = await ort.InferenceSession.create('./my_model.onnx', options);
        console.log("GPU Acceleration active! Model loaded successfully.");
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
    
    // Begin the high-framerate processing loop
    runInferenceLoop();
}

// 2. Optimized Processing Loop
async function runInferenceLoop() {
    if (video.paused || video.ended) return;

    try {
        const inputImgSize = 1024;
        
        // Setup temporary high-speed rendering matrix
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
        const outputMap = await session.run(feeds);
        const outputTensor = outputMap[session.outputNames[0]];
        
        // --- FIXED POST-PROCESSING PARSING LOGIC ---
        // Reshape calculations: YOLO11 outputs shape dimensions [1, 5, 21504]
        // Row 0: cx, Row 1: cy, Row 2: width, Row 3: height, Row 4: Shark Confidence
        const outputData = outputTensor.data;
        const numDetections = outputTensor.dims[2]; 
        
        let currentFrameSharkCount = 0;
        let candidates = [];

        // Isolate valid targets passing confidence filtering threshold 
        for (let i = 0; i < numDetections; i++) {
            const confidence = outputData[4 * numDetections + i]; // Row 4
            
            if (confidence > 0.35) { // 35% Confidence constraint thresholds
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

        // Apply Non-Maximum Suppression (NMS) simulation to filter duplicate overlapping boxes
        candidates.sort((a, b) => b.score - a.score);
        let selectedBoxes = [];
        while (candidates.length > 0) {
            let box = candidates.shift();
            selectedBoxes.push(box);
            candidates = candidates.filter(item => {
                // Calculate Intersection over Union (IoU)
                let x1 = Math.max(box.x, item.x);
                let y1 = Math.max(box.y, item.y);
                let x2 = Math.min(box.x + box.w, item.x + item.w);
                let y2 = Math.min(box.y + box.h, item.y + item.h);
                let interW = Math.max(0, x2 - x1);
                let interH = Math.max(0, y2 - y1);
                let interArea = interW * interH;
                let boxArea = box.w * box.h;
                let itemArea = item.w * item.h;
                let unionArea = boxArea + itemArea - interArea;
                return (interArea / unionArea) < 0.45; // Filter box overlaps greater than 45%
            });
        }

        // --- CLEAR CANVAS & RENDER SMOOTH ALIGNED BOXES ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentFrameSharkCount = selectedBoxes.length;

        selectedBoxes.forEach(box => {
            // Draw smooth bounding outline box
            ctx.strokeStyle = '#00ffcc'; 
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.w, box.h);

            // Text tag layout settings
            ctx.fillStyle = 'rgba(0, 255, 204, 0.9)';
            ctx.font = 'bold 13px sans-serif';
            const text = `Shark: ${Math.round(box.score * 100)}%`;
            ctx.fillRect(box.x - 1, box.y - 22, ctx.measureText(text).width + 10, 22);
            
            ctx.fillStyle = '#0f172a';
            ctx.fillText(text, box.x + 4, box.y - 6);
        });

        // --- LIVE METRICS RE-EVALUATION CONTROLS ---
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
            label.style.margin = '15px 0 5px 0';
            document.getElementById('analyticsDisplay').insertBefore(label, document.getElementById('maxnValue').parentNode);
        }
        label.innerText = `Sharks Currently in Frame: ${currentFrameSharkCount}`;

    } catch (err) {
        console.error("Inference processing error:", err);
    }

    // Force high-framerate refresh execution matching screen tick timing
    requestAnimationFrame(runInferenceLoop);
}

initModel();
