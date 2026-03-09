# This file is for taking a lot of pictures to train my own mediapipe classification model.
import cv2 as cv

cap = cv.VideoCapture(0)
 
width = int(cap.get(cv.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv.CAP_PROP_FRAME_HEIGHT))

# folders for the gestures = [none/noise, single thumb pointing out, thumb & index, thumb & index & middle, thumb & index & middle & ring, all fingers, vertical flat palm but edge is facing us, horizontal flat palm but edge is facing us, diagonal flat palm but edge is facing us]
path_list = ["None/", "point_one/", "point_two/", "point_three/", "point_four/", "open_palm/", "vertical_flat_palm_edge/", "horizontal_flat_palm_edge/", "diagonal_flat_palm_edge/"]
current_path = 0

image_number = 0

while cap.isOpened():

    key_press = cv.waitKey(1)

    ret, frame = cap.read()
    if not ret:
        print("Can't receive frame (stream end?). Exiting ...")
        break

    frame = cv.flip(frame, 1)

    # display the frame
    cv.imshow('Picture Taker', frame)

    if key_press == ord('p'): # take picture
        name = "my_gesture_dataset/"+path_list[current_path]+("00"+str(image_number))[-3:]+".jpg"
        cv.imwrite(name, frame)
        image_number += 1
        print()
        print(f"Picture {image_number} taken and saved as {name}")
        print()
    elif key_press == ord('n'): # go to next path
        current_path += 1
        image_number = 0
        print()
        print(f"Current path: {"my_gesture_dataset/"+path_list[current_path]}")
        print()
    elif key_press == ord('q'): # quit
        break

 
# Release everything if job is finished
cap.release()
cv.destroyAllWindows()