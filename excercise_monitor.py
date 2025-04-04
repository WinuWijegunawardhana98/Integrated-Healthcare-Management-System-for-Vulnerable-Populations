import cv2
import mediapipe as mp
import numpy as np

def exe_launch(exercise_type):
    print(exercise_type)
    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose

    cap = cv2.VideoCapture(0)

    # Curl counter variables
    counter = 0 
    correct = 0
    incorrect = 0
    stage = None

    def calculate_angle(a, b, c):
        a = np.array(a)  # First
        b = np.array(b)  # Mid
        c = np.array(c)  # End
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle 

    ## Setup mediapipe instance
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            
            # Recolor image to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
        
            # Make detection
            results = pose.process(image)
        
            # Recolor back to BGR
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            try:
                landmarks = results.pose_landmarks.landmark
                
                # Exercise logic
                if exercise_type == "Squat":
                    # Exercise logics 
                    hip_vertical_bend_forward_threshold = 20  # Bend forward if below this angle
                    hip_vertical_bend_backward_threshold = 45  # Bend backward if above this angle
                    hip_knee_lower_hips_min = 50  # Lower hips feedback if between 50° and 80°
                    hip_knee_lower_hips_max = 80
                    knee_ankle_falling_over_toes_threshold = 30  # Knee falling over toes if above this angle
                    hip_knee_too_deep_threshold = 95  # Too deep squat feedback if above this angle

                    # Feedback flags
                    feedback_lower_hips_given = False
                    feedback_too_deep_given = False

                    shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                    elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                    wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                    knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                    ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                    hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]

                    # Calculate angles
                    angle_elbow_wrist = calculate_angle(shoulder, elbow, wrist)
                    angle_knee_ankle = calculate_angle(hip, knee, ankle)
                    vertical_reference = [hip[0], 0]  # Vertical reference for angle calculation
                    angle_hip_vertical = calculate_angle(hip, shoulder, vertical_reference)
                    angle_hip_knee = calculate_angle(hip, knee, vertical_reference)

                    # Track squat state
                    if angle_knee_ankle < 90:  # Knee should be bent below 90 degrees for squat depth
                        stage = "down"
                    
                    # Detect squat transition (up and down)
                    if angle_knee_ankle > 160 and stage == 'down':
                        stage = "up"
                        counter += 1
                        
                        # Evaluate correctness of the squat
                        if angle_hip_vertical < hip_vertical_bend_forward_threshold:
                            print("Feedback 1: Bend forward.")
                            incorrect += 1  # Incorrect because the squat is too bent forward
                        elif angle_hip_vertical > hip_vertical_bend_backward_threshold:
                            print("Feedback 2: Bend backward.")
                            incorrect += 1  # Incorrect because the squat is too bent backward
                        elif hip_knee_lower_hips_min <= angle_hip_knee <= hip_knee_lower_hips_max:
                            print("Feedback 3: Lower hips.")
                            if not feedback_lower_hips_given:
                                correct += 1  # Correct because the hips are lowered within the ideal range
                                feedback_lower_hips_given = True
                        elif angle_knee_ankle > knee_ankle_falling_over_toes_threshold:
                            print("Feedback 4: Knee falling over toes.")
                            incorrect += 1  # Incorrect because the knee is falling over the toes
                        elif angle_hip_knee > hip_knee_too_deep_threshold:
                            print("Feedback 5: Too deep squat.")
                            if not feedback_too_deep_given:
                                incorrect += 1  # Incorrect because the squat is too deep
                                feedback_too_deep_given = True
                        else:
                            correct += 1

                elif exercise_type == "Push-Up":
                    # Push-Up Exercise (Shoulder, Elbow, Wrist)
                    shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                    elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                    wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                    angle = calculate_angle(shoulder, elbow, wrist)

                    # Push-up logic (using angle of elbow-wrist for simplicity)
                    if angle > 160:
                        stage = "down"
                    if angle < 90 and stage == 'down':
                        stage = "up"
                        counter += 1

                elif exercise_type == "Downward Dog":
                    # Downward Dog Exercise (Feet, Hands)
                    shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                    wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                    ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                    
                    # Calculate angles for Downward Dog (Wrist-Shoulder-Ankle)
                    shoulder_angle = calculate_angle(shoulder, wrist, ankle)

                    # Downward Dog logic
                    if shoulder_angle > 160:
                        stage = "up"
                    if shoulder_angle < 45 and stage == "up":
                        stage = "down"
                        counter += 1

                else:
                    # Handle undefined exercise types
                    cv2.rectangle(image, (0, 0), (640, 480), (0, 0, 255), -1)  # Red Box
                    cv2.putText(image, "Exercise Type not predefined", 
                                (20, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                    cv2.putText(image, "Press 'Q' to exit", 
                                (20, 280), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
            
            except:
                pass
            
            # Render exercise data (reps, stage)
            if exercise_type in ["Squat", "Push-Up", "Downward Dog"]:
                # Blue container (height reduced)
                cv2.rectangle(image, (0, 0), (225, 50), (245, 117, 16), -1)
                
                # Rep data
                cv2.putText(image, 'REPS', (15, 12), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
                cv2.putText(image, str(counter), 
                            (10, 60), 
                            cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2, cv2.LINE_AA)
                
                # Stage data (smaller font size)
                cv2.putText(image, 'STAGE', (65, 12), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
                cv2.putText(image, stage, 
                            (60, 40),  # Adjusted vertical position for "STAGE"
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

                # Red box for incorrect moves
                box_x1 = image.shape[1] - 220  # Moved a bit to the left
                box_x2 = image.shape[1] - 20   # Adjusting width
                box_y1 = 0
                box_y2 = 50

                # Draw rounded corners manually (using polylines to form rounded corners)
                cv2.rectangle(image, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 255), -1)  # Basic rectangle

                # Adding text to the red box
                cv2.putText(image, f'Incorrect: {incorrect}', 
                (box_x1 + 10, box_y2 - 10),  # Adjust text position within the box
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
            
            # Render detections
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                      mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2), 
                                      mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2) 
                                      )               
            
            cv2.imshow(f'{exercise_type} Feed', image)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
