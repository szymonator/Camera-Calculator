# The main file for the actual project, containing all relevant code.
import cv2 as cv
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time
import re
import math
 
gesture_data = None

NUM_HANDS = 2
OPERATORS = ['+', '-', '/', '*', '=']
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

GESTURE_TYPE = {"point_one":"1", "point_two":"2", "point_three":"3", "point_four":"4", "open_palm":"5", "vertical_flat_palm_edge":"V", "horizontal_flat_palm_edge":"H", "diagonal_flat_palm_edge":"D"}

equation = "="

def get_operand(equation, pos):
    num = ""
    more_digits = True
    while more_digits:
        if not(re.search("[0-9]", str(equation[pos])) is None):
            num += equation[pos]

        else:
            more_digits = False
        pos += 1
        if pos == len(equation) :
            more_digits = False
    if num == "":
        return -1, pos
    else:
        return int(num), pos

def rpn_converter(equation) :
    pos = 0
    precedence = {"+": 2, "-": 2, "*": 4,"/": 4}
    operators = []
    operand, pos = get_operand(equation, pos)
    rpn = []
    rpn.append(str(operand))
    operators.append(equation[pos-1])
    while pos < len(equation):
        operand, pos = get_operand(equation, pos)
        rpn.append(str(operand))
        if pos < len(equation):
            CurrentOperator = equation[pos-1]
            while len(operators) > 0 and precedence[operators[-1]] > precedence[CurrentOperator]:
                rpn.append(operators [-1])
                operators.pop()
            if len(operators) > 0 and precedence[operators [-1]] == precedence[CurrentOperator]:
                rpn.append(operators[-1])
                operators.pop()
            operators.append(CurrentOperator)
        else:
            while len(operators) > 0:
                rpn.append(operators[-1])
                operators.pop()
    return rpn

def evaluate_rpn(rpn):
    stack = []
    while len(rpn) > 0:
        while rpn[0] not in ["+", "-", "*", "/"]:
            stack.append(rpn[0])
            rpn.pop(0)
        num2 = float(stack[-1])
        stack.pop()
        num1 = float(stack[-1])
        stack.pop()
        Result = 0.0
        if rpn[0] == "+":
            Result = num1 + num2
        elif rpn[0] == "-":
            Result = num1 - num2
        elif rpn[0] == "*":
            Result = num1 * num2
        elif rpn[0] == "/" and num2 != 0:
            Result = num1 / num2
        rpn.pop(0)
        stack.append(str(Result))
    if float(stack[0]) - math.floor (float(stack[0])) == 0.0:
        return math.floor(float (stack[0]))

def solve():
    global equation

    rpn = rpn_converter(equation[1:])
    result = evaluate_rpn(rpn)
    if result != None:
        return result


def equation_management():

    global previous_gestures
    global equation

    # assuming NUM_HANDS remains as 2
    if (not previous_gestures[1]) and previous_gestures[0]: # if there is only 1 hand
        name = previous_gestures[0][0]
        if (previous_gestures[0][1] > 2000) and (name in GESTURE_TYPE):
            try:
                # if gesture is number
                number = int(GESTURE_TYPE[name])
                if equation[-1] in OPERATORS:
                    equation += str(number)
                    previous_gestures[0][1] = 0
            except ValueError:
                if (equation[-1] not in OPERATORS):
                    if GESTURE_TYPE[name] == "H":
                        equation += '-'
                    elif GESTURE_TYPE[name] == "D":
                        equation += '/'
                    previous_gestures[0][1] = 0
    elif previous_gestures[1] and previous_gestures[0]: # both hands
        name1 = previous_gestures[0][0]
        name2 = previous_gestures[1][0]
        if (name1 in GESTURE_TYPE) and (name2 in GESTURE_TYPE) and (previous_gestures[0][1] > 2000) and (previous_gestures[1][1] > 2000):
            try:
                # if gestures are numbers
                number1 = int(GESTURE_TYPE[name1])
                number2 = int(GESTURE_TYPE[name2])
                if equation[-1] in OPERATORS:
                    equation += str(number1 + number2)
                    previous_gestures[0][1] = 0
                    previous_gestures[1][1] = 0
            except ValueError:
                if (equation[-1] not in OPERATORS):
                    if GESTURE_TYPE[name1] == "D" and GESTURE_TYPE[name2] == "D":
                        equation += '*'
                    elif (GESTURE_TYPE[name1] == "H" and GESTURE_TYPE[name2] == "V") or (GESTURE_TYPE[name1] == "V" and GESTURE_TYPE[name2] == "H"):
                        equation += '+'
                    elif GESTURE_TYPE[name1] == "H" and GESTURE_TYPE[name2] == "H":
                        equation += '='
                    
                    previous_gestures[0][1] = 0
                    previous_gestures[1][1] = 0

                


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

results = []

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
    equation_management()

    if equation[-1] == '=' and len(equation) > 1:
        results.append(solve())
        equation = '='
 
    # write the frame
    out.write(frame)
    cv.imshow('Gesture Recogniser', frame)

    if cv.waitKey(1) == ord('q'):
        print(equation)
        print(results)
        break
 
# Release everything if job is finished
cap.release()
out.release()
cv.destroyAllWindows()