import cv2
import mediapipe as mp
import numpy as np
import time
import threading
import queue
import pyttsx3
from datetime import datetime
import matplotlib.pyplot as plt
from fpdf import FPDF

# === Speech Engine Setup ===
engine = pyttsx3.init()
speech_queue = queue.Queue()

def speech_worker():
    while True:
        text = speech_queue.get()
        if text is None:
            break
        engine.say(text)
        engine.runAndWait()
        speech_queue.task_done()

speech_thread = threading.Thread(target=speech_worker, daemon=True)
speech_thread.start()

def speak(text):
    speech_queue.put(text)

def countdown_with_voice():
    for phrase in ["Three", "Two", "One", "Start"]:
        speak(phrase)
        time.sleep(1 if phrase != "Start" else 0.5)

# === PDF Report Generation ===
def generate_pdf_report(exercise_type, timestamps, correct_counts, filename):
    plt.figure(figsize=(8, 4))
    plt.plot(timestamps, correct_counts, marker='o', linestyle='-', color='green')
    plt.title(f'Correct {exercise_type} Count Over Time')
    plt.xlabel('Time (s)')
    plt.ylabel('Correct Count')
    plt.grid(True)
    graph_image = 'temp_progress_graph.png'
    plt.savefig(graph_image)
    plt.close()

    tips = "Great effort! Maintain consistency in your form."
    if correct_counts:
        avg_rate = correct_counts[-1] / timestamps[-1] if timestamps[-1] != 0 else 0
        if exercise_type == "Jumping Jack":
            if avg_rate < 0.5:
                tips = "Try to increase your pace for better cardio benefit."
            elif avg_rate > 1:
                tips = "Excellent pace! Keep it up."
        elif exercise_type == "Squat":
            if avg_rate < 0.3:
                tips = "Focus on form rather than speed. Keep your back straight."
            elif avg_rate > 0.7:
                tips = "Good pace! Make sure you're going deep enough."
        elif exercise_type == "Push-Up":
            if avg_rate < 0.4:
                tips = "Focus on full range of motion. Lower all the way down."
            elif avg_rate > 0.8:
                tips = "Great pace! Maintain control throughout."

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt=f"{exercise_type} Exercise Report", ln=True, align='C')
    pdf.ln(10)
    pdf.cell(200, 10, txt=f"Session End: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
    pdf.ln(10)
    pdf.image(graph_image, x=10, y=40, w=180)
    pdf.ln(85)
    pdf.multi_cell(0, 10, txt=f"Performance Tips:\n{tips}")

    pdf.output(filename)

# === Exercise Monitoring Function ===
def exe_launch(exercise_type):
    print(exercise_type)
    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose

    cap = cv2.VideoCapture(0)
    
    # Play exercise-specific instructions
    if exercise_type == "Jumping Jack":
        speak("Starting Jumping Jack exercise. Stand straight, jump while spreading your legs and raising your arms above your head, then return to starting position.")
    elif exercise_type == "Squat":
        speak("Starting Squat exercise. Stand with feet shoulder-width apart, lower your hips until thighs are parallel to the floor, then stand back up.")
    elif exercise_type == "Push-Up":
        speak("Starting Push-Up exercise. Keep your body straight, lower yourself until chest nearly touches the floor, then push back up.")
    elif exercise_type == "Downward Dog":
        speak("Starting Downward Dog exercise. Form an inverted V-shape with your body, hands and feet on the floor, hips raised high.")
    
    countdown_with_voice()

    # Exercise variables
    counter = 0 
    correct = 0
    incorrect = 0
    stage = None
    feedback = ""
    twinkle_phase = 0
    max_hand_height = 1.0  # For Jumping Jack
    step_evaluated = False  # For Jumping Jack

    # For progress tracking
    start_time = time.time()
    timestamps = []
    correct_counts_over_time = []

    def calculate_angle(a, b, c):
        a = np.array(a)  # First
        b = np.array(b)  # Mid
        c = np.array(c)  # End
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle 

    def get_y(landmark):
        return landmark.y if hasattr(landmark, 'y') else 1.0

    def hands_down(landmarks):
        left = get_y(landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value])
        right = get_y(landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value])
        shoulder_y = (get_y(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]) + 
                     get_y(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value])) / 2
        return left > shoulder_y and right > shoulder_y

    def hands_above_head(landmarks):
        left = get_y(landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value])
        right = get_y(landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value])
        head = get_y(landmarks[mp_pose.PoseLandmark.NOSE.value])
        return left < head and right < head

    def is_waving_sideways(landmarks):
        lw = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
        rw = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
        ls = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        rs = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]

        left_dx = abs(lw.x - ls.x)
        right_dx = abs(rw.x - rs.x)
        y_close = abs(lw.y - ls.y) < 0.1 and abs(rw.y - rs.y) < 0.1
        x_far = left_dx > 0.15 and right_dx > 0.15
        return y_close and x_far

    def draw_rounded_rect(img, top_left, bottom_right, color, radius=25, thickness=-1):
        x1, y1 = top_left
        x2, y2 = bottom_right
        overlay = img.copy()
        cv2.rectangle(overlay, (x1 + radius, y1), (x2 - radius, y2), color, thickness)
        cv2.rectangle(overlay, (x1, y1 + radius), (x2, y2 - radius), color, thickness)
        cv2.circle(overlay, (x1 + radius, y1 + radius), radius, color, thickness)
        cv2.circle(overlay, (x2 - radius, y1 + radius), radius, color, thickness)
        cv2.circle(overlay, (x1 + radius, y2 - radius), radius, color, thickness)
        cv2.circle(overlay, (x2 - radius, y2 - radius), radius, color, thickness)
        cv2.addWeighted(overlay, 1, img, 0, 0, img)

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
                    # Squat Exercise Logic
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
                            feedback = "Bend forward."
                            incorrect += 1
                            speak(feedback)
                        elif angle_hip_vertical > hip_vertical_bend_backward_threshold:
                            feedback = "Bend backward."
                            incorrect += 1
                            speak(feedback)
                        elif hip_knee_lower_hips_min <= angle_hip_knee <= hip_knee_lower_hips_max:
                            feedback = "Lower hips."
                            if not feedback_lower_hips_given:
                                correct += 1
                                feedback_lower_hips_given = True
                                speak("Good form!")
                        elif angle_knee_ankle > knee_ankle_falling_over_toes_threshold:
                            feedback = "Knee falling over toes."
                            incorrect += 1
                            speak(feedback)
                        elif angle_hip_knee > hip_knee_too_deep_threshold:
                            feedback = "Too deep squat."
                            if not feedback_too_deep_given:
                                incorrect += 1
                                feedback_too_deep_given = True
                                speak(feedback)
                        else:
                            correct += 1
                            feedback = "Good form!"
                        
                        now = int(time.time() - start_time)
                        timestamps.append(now)
                        correct_counts_over_time.append(correct)

                elif exercise_type == "Push-Up":
                    # Push-Up Exercise (Shoulder, Elbow, Wrist, Hip)
                    shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, 
                                landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                    elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, 
                            landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                    wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, 
                            landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                    hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, 
                        landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]

                    angle = calculate_angle(shoulder, elbow, wrist)
                    hip_angle = calculate_angle(shoulder, hip, knee) if hasattr(mp_pose.PoseLandmark, 'LEFT_KNEE') else 180

                    # Correct push-up logic
                    if angle > 160:
                        stage = "down"
                    if angle < 90 and stage == 'down':
                        stage = "up"
                        counter += 1
                        correct += 1
                        feedback = "Good push-up!"
                        now = int(time.time() - start_time)
                        timestamps.append(now)
                        correct_counts_over_time.append(correct)
                    else:
                        # Check Incorrect Form
                        if angle > 90 and stage == 'down':  # Not lowering enough
                            incorrect += 1
                            feedback = "Lower yourself more!"
                            speak(feedback)
                        elif hip_angle < 150:  # Hips sagging
                            incorrect += 1
                            feedback = "Keep your body straight!"
                            speak(feedback)

                elif exercise_type == "Downward Dog":
                    # Downward Dog Exercise (Feet, Hands)
                    shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, 
                    landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                    wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, 
                            landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                    ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, 
                            landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                    hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, 
                        landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                    
                    # Calculate angles
                    shoulder_angle = calculate_angle(shoulder, wrist, ankle)  # Measures arm and leg alignment
                    hip_angle = calculate_angle(shoulder, hip, ankle)  # Measures hip elevation

                    # Correct Downward Dog logic
                    if shoulder_angle > 160 and hip_angle > 120:
                        stage = "up"
                    if shoulder_angle < 45 and stage == "up":
                        stage = "down"
                        counter += 1
                        correct += 1
                        feedback = "Good form!"
                        now = int(time.time() - start_time)
                        timestamps.append(now)
                        correct_counts_over_time.append(correct)
                    else:
                        # Check Incorrect Form
                        if shoulder_angle < 160:  # Arms not fully extended
                            incorrect += 1
                            feedback = "Extend your arms fully!"
                            speak(feedback)
                        elif hip_angle < 100:  # Hips too low, back not straight
                            incorrect += 1
                            feedback = "Lift your hips higher!"
                            speak(feedback)

                elif exercise_type == "Jumping Jack":
                    # Jumping Jack Exercise Logic
                    left_y = get_y(landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value])
                    right_y = get_y(landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value])
                    hand_avg_y = (left_y + right_y) / 2

                    if stage == "up" and hand_avg_y < max_hand_height:
                        max_hand_height = hand_avg_y

                    if stage == "down" and not hands_down(landmarks):
                        stage = "up"
                        max_hand_height = hand_avg_y
                        step_evaluated = False
                        speak("Jump!")  # Audio cue for jumping

                    elif stage == "up" and hands_down(landmarks):
                        if not step_evaluated:
                            head_y = get_y(landmarks[mp_pose.PoseLandmark.NOSE.value])
                            if max_hand_height < head_y:
                                correct += 1
                                feedback = "Good form!"
                                speak("Good!")  # Positive reinforcement
                            else:
                                incorrect += 1
                                if is_waving_sideways(landmarks):
                                    feedback = "Don't wave sideways!"
                                    speak("Keep arms straight up and down!")
                                else:
                                    feedback = "Raise hands higher!"
                                    speak("Reach higher with your hands!")
                            step_evaluated = True
                            stage = "down"
                            now = int(time.time() - start_time)
                            timestamps.append(now)
                            correct_counts_over_time.append(correct)

                else:
                    # Handle undefined exercise types
                    cv2.rectangle(image, (0, 0), (640, 480), (0, 0, 255), -1)  # Red Box
                    cv2.putText(image, "Exercise Type not predefined", 
                                (20, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                    cv2.putText(image, "Press 'Q' to exit", 
                                (20, 280), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
            
            except Exception as e:
                print(f"Error: {e}")
                pass
            
            # Render exercise data (reps, stage)
            if exercise_type in ["Squat", "Push-Up", "Downward Dog", "Jumping Jack"]:
                # Menu bar at top
                cv2.rectangle(image, (0, 0), (image.shape[1], 50), (245, 117, 16), -1)
                
                # Exercise name
                cv2.putText(image, exercise_type, (20, 35), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2, cv2.LINE_AA)
                
                # Rep data
                cv2.putText(image, f'Reps: {counter}', 
                            (image.shape[1] - 200, 35), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2, cv2.LINE_AA)
                
                # Correct/Incorrect counters
                cv2.rectangle(image, (image.shape[1] - 400, image.shape[0] - 80), 
                             (image.shape[1] - 300, image.shape[0] - 30), (0, 255, 0), -1)
                cv2.putText(image, f'Correct: {correct}', 
                            (image.shape[1] - 390, image.shape[0] - 45), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                
                cv2.rectangle(image, (image.shape[1] - 290, image.shape[0] - 80), 
                             (image.shape[1] - 190, image.shape[0] - 30), (0, 0, 255), -1)
                cv2.putText(image, f'Incorrect: {incorrect}', 
                            (image.shape[1] - 280, image.shape[0] - 45), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
                
                # Timer display
                elapsed_time = int(time.time() - start_time)
                minutes = elapsed_time // 60
                seconds = elapsed_time % 60
                timer_display = f"{minutes:02}:{seconds:02}"
                cv2.putText(image, timer_display, 
                            (image.shape[1] - 120, 35), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2, cv2.LINE_AA)

                # Feedback twinkle
                if feedback:
                    twinkle_phase += 0.1
                    r = int((np.sin(twinkle_phase) + 1) / 2 * 255)
                    g = int((np.sin(twinkle_phase + 2) + 1) / 2 * 255)
                    b = int((np.sin(twinkle_phase + 4) + 1) / 2 * 255)
                    cv2.putText(image, feedback, (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 3)
                    cv2.putText(image, feedback, (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (b, g, r), 2)
            
            # Render detections
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                      mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2), 
                                      mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2) 
                                      )               
            
            cv2.imshow(f'{exercise_type} Monitor', image)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                filename_pdf = f"{exercise_type.lower()}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                generate_pdf_report(exercise_type, timestamps, correct_counts_over_time, filename_pdf)
                print(f"PDF Report saved as {filename_pdf}")
                break

        cap.release()
        cv2.destroyAllWindows()

# Example usage:
# exe_launch("Jumping Jack")
# exe_launch("Squat")
# exe_launch("Push-Up")
# exe_launch("Downward Dog")