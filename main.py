# The main file for the actual project, containing all relevant code.
import cv2 as cv
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time
 
gesture_data = None

NUM_HANDS = 2
previous_gestures = [[] for _ in range(NUM_HANDS)]

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),       # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),       # Index
    (5, 9), (9, 10), (10, 11), (11, 12),  # Middle
    (9, 13), (13, 14), (14, 15), (15, 16),# Ring
    (13, 17), (17, 18), (18, 19), (19, 20),# Pinky
    (0, 17)                               # Palm base
]



COLOUR = [(0, 0, 255), (0, 255, 0), (255, 0, 0), (0, 255, 255)]

PATH = "custom_gesture_recognizer.task"

GESTURE_TYPE = ["None", "point_one", "point_two", "point_three", "point_four", "open_palm", "vertical_flat_palm_edge", "horizontal_flat_palm_edge", "diagonal_flat_palm_edge"]

def drawing_expressions(frame):

    global gesture_data
    global previous_gestures

def plot_gesture_data(frame):

    global gesture_data

    # return clean frame if no data
    if not gesture_data:
        return frame
    
    # getting frame structure data
    height, width, channels = frame.shape

    points_array = []

    # putting all point data into an array
    for hand in gesture_data.hand_landmarks:
        hand_array = []
        for point in hand:
            hand_array.append((int(point.x * width), int(point.y * height)))
        points_array.append(hand_array)

    # plotting the lines between the points
    for hand_array in range(len(points_array)):
        for line in HAND_CONNECTIONS:
            cv.line(frame, points_array[hand_array][line[0]], points_array[hand_array][line[1]], COLOUR[hand_array], 2)

    # plotting the points themselves
    for hand in range(len(points_array)):
        for point in points_array[hand]:
            cv.circle(frame, (point[0], point[1]), 5, COLOUR[hand], 30)
            cv.circle(frame, (point[0], point[1]), 5, COLOUR[hand-1], 20)


    # drawing expressions
    drawing_expressions(frame)
    
    return frame
    


def my_gesture_callback(result, output_image, timestamp_ms):
    
    if result.gestures:
        global previous_gestures
        print("Saw gestures: ", end="")
        for i in range(len(result.gestures)):
            name = result.gestures[i][0].category_name
            print(f"{name}  ", end="")
            # Check if this specific hand's history is populated
            if previous_gestures[i]: 
                
                if name == previous_gestures[i][0]:
                    # Same gesture: Add the time difference
                    previous_gestures[i][1] += timestamp_ms - previous_gestures[i][2]
                    # Update the 'last seen' timestamp so the next frame calculates correctly
                    previous_gestures[i][2] = timestamp_ms 
                else:
                    # Hand is still here, but gesture changed. Overwrite the whole list.
                    previous_gestures[i] = [name, 0, timestamp_ms]
                    
            else:
                # First time seeing this hand (or hand just returned). Populate the list.
                previous_gestures[i] = [name, 0, timestamp_ms]
        for i in range(len(result.gestures), NUM_HANDS):
            previous_gestures[i] = []
        print(f"  at {timestamp_ms}")
        
        global gesture_data
        result.timestamp = timestamp_ms
    
    gesture_data = result


cap = cv.VideoCapture(0)
 
width = int(cap.get(cv.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv.CAP_PROP_FRAME_HEIGHT))

# Define the codec and create VideoWriter object
fourcc = cv.VideoWriter_fourcc(*'MJPG')
out = cv.VideoWriter('output.avi', fourcc, 20, (width, height))

# creating gesturerecogniser object
# setting options
base_options = python.BaseOptions(model_asset_path=PATH)
running_mode = mp.tasks.vision.RunningMode.LIVE_STREAM
result_callback = my_gesture_callback

options = vision.GestureRecognizerOptions(  base_options=base_options,
                                            running_mode=running_mode,
                                            num_hands=NUM_HANDS,
                                            result_callback=result_callback)

recognizer = vision.GestureRecognizer.create_from_options(options)

start_time = int(time.time()*1000)

while cap.isOpened():

    ret, frame = cap.read()
    if not ret:
        print("Can't receive frame (stream end?). Exiting ...")
        break

    frame = cv.flip(frame, 1)
    rgb_frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    timestamp_ms = int(time.time()*1000) - start_time
    recognizer.recognize_async(mp_image, timestamp_ms)

    frame = plot_gesture_data(frame)
 
    # write the frame
    out.write(frame)
    cv.imshow('Gesture Recogniser', frame)

    if cv.waitKey(1) == ord('q'):
        break
 
# Release everything if job is finished
cap.release()
out.release()
cv.destroyAllWindows()