import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

let recognizer;
let runningMode = "VIDEO";

const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [9, 13], [13, 14], [14, 15], [15, 16],// Ring
    [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [0, 17]                               // Palm base
];

// downloading WASM takes time so it's async
async function initializeMediaPipe() {
    // fetching WASM binaries
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    // building custom recogniser
    recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "custom_gesture_recognizer.task", 
            delegate: "GPU" // gpu time for faster processing 
        },
        numHands: 2,
        runningMode: runningMode
    });

    console.log("MediaPipe is ready!");

}

const COLOURS = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"]; 

function drawLandmarks(results, ctx, canvasWidth, canvasHeight) {
    if (!results.landmarks || results.landmarks.length === 0) {
        return;
    }

    for (let handIndex = 0; handIndex < results.landmarks.length; handIndex++) {
        const hand = results.landmarks[handIndex];
        
        const color1 = COLOURS[handIndex % COLOURS.length];
        
        const color2Index = (handIndex - 1 + COLOURS.length) % COLOURS.length;
        const color2 = COLOURS[color2Index];

        // draw lines
        ctx.strokeStyle = color1;
        ctx.lineWidth = 2;
        
        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
            const startPoint = hand[startIdx];
            const endPoint = hand[endIdx];

            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvasWidth, startPoint.y * canvasHeight);
            ctx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
            ctx.stroke();
        }

        // draw points
        for (const point of hand) {
            const x = point.x * canvasWidth;
            const y = point.y * canvasHeight;

            // base cirlce
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = color1;
            ctx.fill();

            // inner circle
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = color2;
            ctx.fill();
        }
    }
}


const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const equationDisplay = document.getElementById('equation-display');

// Check if the browser supports webcam access
const hasGetUserMedia = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

if (hasGetUserMedia()) {
    // Request the camera
    const constraints = { 
        video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
        } 
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            // pipe the video stream into the HTML video element
            video.srcObject = stream;
            
            // size the canvas to match video
            video.addEventListener('loadeddata', async () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log("Webcam connected and playing!");
                
                await initializeMediaPipe() // wait till WASM ready
                predictWebcam(); // trigger infinite loop (recursive)
                
            });
        })
        .catch((err) => {
            console.error("Camera error: ", err);
            alert("Could not access the camera. Did you click 'Allow'?");
        });
} else {
    alert("Your browser does not support webcam access.");
}



let lastVideoTime = -1;

async function predictWebcam() {
    // skip processing if video frame not updated yet
    if (video.currentTime === lastVideoTime) {
        window.requestAnimationFrame(predictWebcam);
        return;
    }
    lastVideoTime = video.currentTime;

    // run inference
    let startTimeMs = performance.now();
    const results = recognizer.recognizeForVideo(video, startTimeMs);

    // setup canvas content, wipe prev frame
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw landmarks
    if (results) {
        drawLandmarks(results, ctx, canvas.width, canvas.height);
    }

    // recursive loop, synced to refresh rate of monitor
    window.requestAnimationFrame(predictWebcam);
}