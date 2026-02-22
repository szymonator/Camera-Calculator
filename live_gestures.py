import cv2
import mediapipe as mp

# MediaPipe Setup
BaseOptions = mp.tasks.BaseOptions
GestureRecognizer = mp.tasks.vision.GestureRecognizer
GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
VisionTaskRunningMode = mp.tasks.vision.RunningMode

# Initialize the drawing tools
mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands

# 1. Load the model
options = GestureRecognizerOptions(
    base_options=BaseOptions(model_asset_path='gesture_recognizer.task'),
    running_mode=VisionTaskRunningMode.IMAGE # We will process the video frame-by-frame as images
)

print("Loading model and starting camera...")

with GestureRecognizer.create_from_options(options) as recognizer:
    # 2. Start the webcam
    cap = cv2.VideoCapture(0)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Ignoring empty camera frame.")
            break
            
        # Flip the frame horizontally for a selfie-view display
        frame = cv2.flip(frame, 1)

        # 3. Convert the BGR frame to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # 4. Run the gesture recognizer
        recognition_result = recognizer.recognize(mp_image)

        # 5. Draw the results on the original 'frame'
        if recognition_result.gestures:
            # Get the top gesture recognized
            top_gesture = recognition_result.gestures[0][0]
            gesture_name = top_gesture.category_name
            gesture_score = top_gesture.score
            
            # Write the gesture name on the screen
            cv2.putText(frame, f"{gesture_name} ({gesture_score:.2f})", 
                        (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

            # Draw the hand landmarks
            for hand_landmarks in recognition_result.hand_landmarks:
                # Convert the raw landmark data into a format the drawing utility understands
                hand_landmarks_proto = mp.framework.formats.landmark_pb2.NormalizedLandmarkList()
                hand_landmarks_proto.landmark.extend([
                    mp.framework.formats.landmark_pb2.NormalizedLandmark(x=landmark.x, y=landmark.y, z=landmark.z) 
                    for landmark in hand_landmarks
                ])
                
                mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks_proto,
                    mp_hands.HAND_CONNECTIONS,
                    mp.solutions.drawing_styles.get_default_hand_landmarks_style(),
                    mp.solutions.drawing_styles.get_default_hand_connections_style()
                )

        # 6. Show the final image to the user
        cv2.imshow('Live Gesture Recognition', frame)

        # Press 'q' to quit
        if cv2.waitKey(1) == ord('q'):
            break

# Clean up
cap.release()
cv2.destroyAllWindows()