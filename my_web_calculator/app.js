import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";
import { rpnConverter, evaluateRpn } from "./calculator.js"

let recognizer;
let runningMode = "VIDEO";
let justSolved = true;
let lastRenderedEquation = null;
const equationDisplay = document.getElementById('equation-display');


const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [9, 13], [13, 14], [14, 15], [15, 16],// Ring
    [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [0, 17]                               // Palm base
];

const GESTURE_TYPE = { "point_one":"1", "point_two":"2", "point_three":"3", "point_four":"4", "open_palm":"5", "vertical_flat_palm_edge":"V", "horizontal_flat_palm_edge":"H", "diagonal_flat_palm_edge":"D" };
const OPERATORS = ['+', '-', '/', '*', '='];

// downloading WASM takes time so it's async
async function initializeMediaPipe() {
    // fetching WASM binaries
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    // building custom recogniser
    recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "./custom_gesture_recognizer.task", 
            delegate: "GPU" // gpu time for faster processing 
        },
        numHands: 2,
        runningMode: runningMode
    });

    console.log("MediaPipe is ready!");;

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

// array to hold state objects: { name: "open_palm", duration: 0, lastSeen: timestamp }
let previousGestures = [null, null]; 
let equation = "";


function updateGestureTimers(results, currentTimeMs) {
    for (let i = 0; i < 2; i++) {
        // check if hand i exists
        if (results.gestures && results.gestures[i] && results.gestures[i].length > 0) {
            let name = results.gestures[i][0].categoryName;
            
            if (previousGestures[i] && previousGestures[i].name === name) {
                // same gesture
                previousGestures[i].duration += (currentTimeMs - previousGestures[i].lastSeen);
                previousGestures[i].lastSeen = currentTimeMs;
            } else {
                // new or changed gesture
                previousGestures[i] = { name: name, duration: 0, lastSeen: currentTimeMs };
            }
        } else {
            // hand is off-screen
            previousGestures[i] = null;
        }
    }
}

function equationManagement() {
    if (previousGestures[0] && !previousGestures[1]) { // if there is only one hand
        const name = previousGestures[0].name
        if ((previousGestures[0].duration > 2000) && (name in GESTURE_TYPE)) {
            const number = parseInt(GESTURE_TYPE[name]);
            if (!isNaN(number) && (OPERATORS.includes(equation.slice(-1)) || justSolved)) {
                // is a valid number and last element is an operator or equation is empty
                if (justSolved) {
                    justSolved = false
                    equation = ""
                }
                equation += number.toString()
                previousGestures[0].duration = 0
            } else if (!OPERATORS.includes(equation.slice(-1)) && !justSolved) {
                // is an operator and last element is an operand 
                if (GESTURE_TYPE[name] === "H") {
                    equation += '-'
                } else if (GESTURE_TYPE[name] === "D") {
                    equation += '/'
                }
                previousGestures[0].duration = 0
            }
        }
    } else if (previousGestures[0] && previousGestures[1]) {// both hands
        const name1 = previousGestures[0].name
        const name2 = previousGestures[1].name
        if ((name1 in GESTURE_TYPE) && (name2 in GESTURE_TYPE) && (previousGestures[0].duration > 2000) && (previousGestures[1].duration > 2000)) {
            const number1 = parseInt(GESTURE_TYPE[name1])
            const number2 = parseInt(GESTURE_TYPE[name2])
            if (!isNaN(number1) && !isNaN(number2) && (OPERATORS.includes(equation.slice(-1)) || justSolved)) {
                // is a valid number and last element is an operator or equation is empty
                if (justSolved) {
                    justSolved = false
                    equation = ""
                }
                equation += (number1+number2).toString()
                previousGestures[0].duration = 0
                previousGestures[1].duration = 0
            } else if (!OPERATORS.includes(equation.slice(-1)) && !justSolved) {
                // is an operator and last element is an operand 
                if ((GESTURE_TYPE[name1] === "D") && (GESTURE_TYPE[name2] === "D")) {
                    equation += '*'
                } else if (((GESTURE_TYPE[name1] === "H") && (GESTURE_TYPE[name2] === "V")) || ((GESTURE_TYPE[name1] === "V") && (GESTURE_TYPE[name2] === "H"))) {
                    equation += '+'
                } else if ((GESTURE_TYPE[name1] === "H") && (GESTURE_TYPE[name2] === "H")) {
                    let rpn = rpnConverter(equation);
                    let finalAnswer = evaluateRpn(rpn);
                    equation += '=' + finalAnswer;
                    justSolved = true;
                }
                previousGestures[0].duration = 0
                previousGestures[1].duration = 0
            }
        }

    }
}

let lastVideoTime = -1;
const ctx = canvas.getContext('2d');

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

    // wipe prev frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw landmarks
    if (results) {
        drawLandmarks(results, ctx, canvas.width, canvas.height);
    }

    // manage Logic and ui
    updateGestureTimers(results, startTimeMs);
    equationManagement(); 

    if (equation !== lastRenderedEquation) {
        equationDisplay.innerText = equation === "" ? "Click ? for help!" : equation;
        lastRenderedEquation = equation;
    }

    // recursive loop, synced to refresh rate of monitor
    window.requestAnimationFrame(predictWebcam);
}