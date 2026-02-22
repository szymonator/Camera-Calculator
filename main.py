import numpy as np
import cv2 as cv
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time
 


def plot_gesture_data(gesture_data, frame):
    return frame

def my_gesture_callback(result, output_image, timestamp_ms):
    if result.gestures:
        print(f"Saw gesture: {result.gestures[0][0].category_name}")

    global variable = 5

cap = cv.VideoCapture(0)
 
width = int(cap.get(cv.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv.CAP_PROP_FRAME_HEIGHT))

# Define the codec and create VideoWriter object
fourcc = cv.VideoWriter_fourcc(*'MJPG')
out = cv.VideoWriter('output.avi', fourcc, 20, (width, height))

# creating gesturerecogniser object
# setting options
base_options = python.BaseOptions(model_asset_path='gesture_recognizer.task')
running_mode = mp.tasks.vision.RunningMode.LIVE_STREAM
num_hands = 2
result_callback = my_gesture_callback

options = vision.GestureRecognizerOptions(  base_options=base_options,
                                            running_mode=running_mode,
                                            num_hands=num_hands,
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

    print()
    print(timestamp_ms)
    print()

    gesture_data = recognizer.recognize_async(mp_image, timestamp_ms)

    frame = plot_gesture_data(gesture_data, frame)
 
    # write the frame
    out.write(frame)
    cv.imshow('frame', frame)

    if cv.waitKey(1) == ord('q'):
        break
 
# Release everything if job is finished
cap.release()
out.release()
cv.destroyAllWindows()