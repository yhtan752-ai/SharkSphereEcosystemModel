let session = null;
let maxN = 0;
const video = document.getElementById('sharkVideo');
const canvas = document.getElementById('detectionCanvas');
const ctx = canvas.getContext('2d');

// 1. Initialize and load the 36MB ONNX model into browser memory
async function initModel() {
    console.log("Loading high-res 1024px ONNX shark weights...");
    try {
        // Direct root-relative path execution
        session = await ort.InferenceSession.create('./my_model.onnx');
        console.log("Shark model loaded successfully! WebGL/WASM engine active.");
    } catch (e) {
        console.error("Failed to initialize ONNX runtime session:", e);
    }
}

// 2. Handle Phase 1 to Phase 2 presentation transition state
function transitionToAI() {
    document.getElementById('phaseTitle').innerText = "Phase 2: Automated AI MaxN Extraction";
    document.getElementById('phaseDesc').innerText = "YOLO11 is actively standardizing canvas pixel matrices to calculate real-time spatial density.";
    document.getElementById('analyticsDisplay').style.display = "block";
    document.getElementById('actionBtn').style.display = "none";

    // Sync canvas sizing parameters directly with the live HTML video player frame layout
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 450;

    video.currentTime = 0;
    video.play();

    // Fire off the recursive frames processing matrix loop
    video.requestVideoFrameCallback(runInferenceLoop);
}

// 3. Core Computer Vision Processing Loop
async function runInferenceLoop() {
    if (video.paused || video.ended) return;

    // Clear previous drawing frames canvas layers to eliminate phantom boxes
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        // --- PRE-PROCESSING: Convert HTML Video Frame to a 1024x1024 Model Tensor ---
        const inputImgSize = 1024;
        
        // Create an offscreen temporary memory canvas to square-preprocess image coordinates
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = inputImgSize;
        tempCanvas.height = inputImgSize;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0, inputImgSize, inputImgSize);
        
        const imgData = tempCtx.getImageData(0, 0, inputImgSize, inputImgSize);
        const { data } = imgData;

        // Construct standardized Float32 structural arrays (RGB Channel Isolation)
        const rChannel = [];
        const gChannel = [];
        const bChannel = [];

        for (let i = 0; i < data.length; i += 4) {
            rChannel.push(data[i] / 255.0);     // Normalize R
            gChannel.push(data[i + 1] / 255.0); // Normalize G
            gChannel.push(data[i + 2] / 255.0); // Normalize B
        }

        // Merge channels to match YOLOv11 input dimension formats: [1, 3, 1024, 1024]
        const formattedInputFloatArray = Float32Array.from([...rChannel, ...gChannel, ...bChannel]);
        const inputTensor = new ort.Tensor('float32', formattedInputFloatArray, [1, 3, inputImgSize, inputImgSize]);

        // --- INFERENCE: Run frame matrix multiplication through the ONNX network weights ---
        const feeds = { [session.inputNames[0]]: inputTensor };
        const outputMap = await session.run(feeds);
        const outputTensor = outputMap[session.outputNames[0]];
        
        // --- POST-PROCESSING: Isolate bounding arrays from output tensors ---
        // YOLO outputs shape data structure array format. Let's parse boxes with conf > 0.25
        let currentFrameSharkCount = 0;
        const rawOutputData = outputTensor.data; 
        
        // Loop variables to trace prediction boxes
        const totalOutputElements = outputTensor.dims[2]; // Number of candidate bounding locations
        
        for (let i = 0; i < totalOutputElements; i++) {
            // Check confidence score
            const confidence = rawOutputData[4 * totalOutputElements + i];
            
            if (confidence > 0.25) { 
                currentFrameSharkCount++;

                // Map relative network coordinates back onto live HTML layout dimensions
                let cx = rawOutputData[0 * totalOutputElements + i] * (canvas.width / inputImgSize);
                let cy = rawOutputData[1 * totalOutputElements + i] * (canvas.height / inputImgSize);
                let w  = rawOutputData[2 * totalOutputElements + i] * (canvas.width / inputImgSize);
                let h  = rawOutputData[3 * totalOutputElements + i] * (canvas.height / inputImgSize);
                
                let x = cx - w / 2;
                let y = cy - h / 2;

                // --- RENDERING: Draw tracking targets onto user UI canvas elements ---
                ctx.strokeStyle = '#00ffcc'; // Clean neon marine border lines
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);

                // Draw background box text label anchoring frames
                ctx.fillStyle = 'rgba(0, 255, 204, 0.85)';
                ctx.font = 'bold 12px sans-serif';
                const labelText = `Blacktip Reef Shark: ${Math.round(confidence * 100)}%`;
                const textWidth = ctx.measureText(labelText).width;
                
                ctx.fillRect(x - 1, y - 20, textWidth + 10, 20);
                ctx.fillStyle = '#0f172a';
                ctx.fillText(labelText, x + 4, y - 6);
            }
        }

        // --- MATHEMATICAL MAXN OVERRIDE EVALUATION ---
        if (currentFrameSharkCount > maxN) {
            maxN = currentFrameSharkCount;
            document.getElementById('maxnValue').innerText = maxN;
        }

        // Update real-time active frame element indicator labels dynamically
        let dynamicCounterLabel = document.getElementById('frameCounterLabel');
        if (!dynamicCounterLabel) {
            dynamicCounterLabel = document.createElement('p');
            dynamicCounterLabel.id = 'frameCounterLabel';
            dynamicCounterLabel.style.fontWeight = '600';
            dynamicCounterLabel.style.color = '#38bdf8';
            document.getElementById('analyticsDisplay').insertBefore(dynamicCounterLabel, document.getElementById('maxnValue').parentNode);
        }
        dynamicCounterLabel.innerText = `Sharks Currently in Frame: ${currentFrameSharkCount}`;

    } catch (err) {
        console.error("Frame inference tracking error exception caught:", err);
    }

    // Recursively handle the next native video frame render index pass
    video.requestVideoFrameCallback(runInferenceLoop);
}

// Fire loading procedure sequence on page visibility load init
initModel();
