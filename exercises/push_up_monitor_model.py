# -*- coding: utf-8 -*-
import cv2
import mediapipe as mp
import numpy as np
import time
import threading
import queue
from datetime import datetime
import matplotlib.pyplot as plt
from fpdf import FPDF
from gtts import gTTS
import os
import pygame
from io import BytesIO
from pathlib import Path

# Initialize pygame mixer for audio playback
pygame.mixer.init()

def get_downloads_folder():
    """Returns the path to the user's downloads folder cross-platform"""
    home = Path.home()
    if os.name == 'nt':
        return home / "Downloads"
    elif os.name == 'posix':
        return home / "Downloads"
    else:
        return home / "Downloads"

# === PDF Report Generation Function ===
def generate_pdf_report(timestamps, correct_counts, filename):
    plt.figure(figsize=(8, 4))
    plt.plot(timestamps, correct_counts, marker='o', linestyle='-', color='blue')
    plt.title('Correct Push-ups Over Time')
    plt.xlabel('Time (s)')
    plt.ylabel('Correct Count')
    plt.grid(True)
    graph_image = 'temp_pushup_graph.png'
    plt.savefig(graph_image)
    plt.close()

    tips = "Good work! Focus on maintaining proper form throughout."
    if correct_counts:
        avg_rate = correct_counts[-1] / timestamps[-1] if timestamps[-1] != 0 else 0
        if avg_rate < 0.3:
            tips = "Focus on quality over quantity - maintain proper form."
        elif avg_rate > 0.7:
            tips = "Excellent pace and form! Consider increasing difficulty."

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt="Push-up Exercise Report", ln=True, align='C')
    pdf.ln(10)
    pdf.cell(200, 10, txt=f"Session End: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
    pdf.ln(10)
    pdf.image(graph_image, x=10, y=40, w=180)
    pdf.ln(85)
    pdf.multi_cell(0, 10, txt=f"Performance Tips:\n{tips}")

    save_folder = get_downloads_folder()
    save_path = save_folder / filename
    pdf.output(save_path)
    if os.path.exists(graph_image):
        os.remove(graph_image)
    return str(save_path)

# === Setup Speech Engine ===
speech_queue = queue.Queue()

def speech_worker():
    while True:
        text = speech_queue.get()
        if text is None:
            break
        try:
            tts = gTTS(text=text, lang='en')
            audio_file = BytesIO()
            tts.write_to_fp(audio_file)
            audio_file.seek(0)
            pygame.mixer.music.load(audio_file)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                time.sleep(0.1)
        except Exception as e:
            print(f"Error in speech synthesis: {e}")
        speech_queue.task_done()

speech_thread = threading.Thread(target=speech_worker, daemon=True)
speech_thread.start()

def speak(text):
    speech_queue.put(text)

def countdown_with_voice():
    for phrase in ["Three", "Two", "One", "Start"]:
        speak(phrase)
        time.sleep(1 if phrase != "Start" else 0.5)

# === Mediapipe Pose Setup ===
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7)

# === Global Variables ===
correct_count = 0
incorrect_count = 0
stage = "up"  # 'up' or 'down'
feedback = ""
last_feedback_time = 0
feedback_cooldown = 3  # seconds

start_time = time.time()
countdown_seconds = 600  # 10 minutes session
twinkle_phase = 0

timestamps = []
correct_counts_over_time = []

# === Utility Functions ===
def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    
    if angle > 180.0:
        angle = 360-angle
        
    return angle

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

# === Start Capture ===
cap = cv2.VideoCapture(0)
countdown_with_voice()

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    frame = cv2.flip(frame, 1)
    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)
    frame = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

    try:
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            
            # Get key points
            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, 
                       landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                  landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                   landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            
            # Calculate angles
            arm_angle = calculate_angle(shoulder, elbow, wrist)
            body_angle = calculate_angle(shoulder, hip, knee)
            leg_angle = calculate_angle(hip, knee, ankle)
            
            # Visualize angles
            cv2.putText(frame, f"Arm: {int(arm_angle)}°", 
                        tuple(np.multiply(elbow, [640, 480]).astype(int)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(frame, f"Body: {int(body_angle)}°", 
                        tuple(np.multiply(hip, [640, 480]).astype(int)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(frame, f"Leg: {int(leg_angle)}°", 
                        tuple(np.multiply(knee, [640, 480]).astype(int)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            # Push-up logic
            if arm_angle > 160 and body_angle > 160:
                stage = "up"
            elif arm_angle < 70 and body_angle > 160 and stage == "up":
                stage = "down"
                
                # Check for proper form
                proper_legs = leg_angle > 160  # Legs should be straight
                proper_body = 160 < body_angle < 190  # Body should be straight
                full_range = arm_angle < 70  # Full range of motion
                
                if proper_legs and proper_body and full_range:
                    correct_count += 1
                    feedback = "Perfect form!"
                    now = int(time.time() - start_time)
                    timestamps.append(now)
                    correct_counts_over_time.append(correct_count)
                else:
                    incorrect_count += 1
                    current_time = time.time()
                    if current_time - last_feedback_time > feedback_cooldown:
                        if not proper_legs:
                            feedback = "Keep your legs straight!"
                            speak(feedback)
                        elif not proper_body:
                            feedback = "Keep your body straight!"
                            speak(feedback)
                        elif not full_range:
                            feedback = "Go lower for full range!"
                            speak(feedback)
                        last_feedback_time = current_time
            
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                
    except Exception as e:
        print(f"Error in pose processing: {e}")

    elapsed_time = int(time.time() - start_time)
    remaining_time = max(0, countdown_seconds - elapsed_time)
    minutes = remaining_time // 60
    seconds = remaining_time % 60
    timer_display = f"{minutes:02}:{seconds:02}"

    # UI Elements
    draw_rounded_rect(frame, (10, 10), (680, 100), (30, 30, 30))
    cv2.rectangle(frame, (30, 25), (230, 80), (0, 255, 0), -1)
    cv2.putText(frame, f"Correct: {correct_count}", (45, 65), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

    cv2.rectangle(frame, (250, 25), (450, 80), (0, 0, 255), -1)
    cv2.putText(frame, f"Incorrect: {incorrect_count}", (265, 65), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    cv2.rectangle(frame, (470, 25), (600, 80), (0, 255, 255), -1)
    cv2.putText(frame, timer_display, (490, 65), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

    # Bottom progress bar
    bar_x1, bar_y1 = 20, frame.shape[0] - 50
    bar_x2, bar_y2 = frame.shape[1] - 20, frame.shape[0] - 20
    cv2.rectangle(frame, (bar_x1, bar_y1), (bar_x2, bar_y2), (50, 50, 50), -1)
    progress_fraction = elapsed_time / countdown_seconds
    fill_width = int((bar_x2 - bar_x1) * progress_fraction)
    cv2.rectangle(frame, (bar_x1, bar_y1), (bar_x1 + fill_width, bar_y2), (0, 255, 0), -1)
    cv2.putText(frame, f"Time Progress: {int(progress_fraction * 100)}%", 
                (bar_x1 + 10, bar_y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Feedback twinkle
    if feedback:
        twinkle_phase += 0.1
        r = int((np.sin(twinkle_phase) + 1) / 2 * 255)
        g = int((np.sin(twinkle_phase + 2) + 1) / 2 * 255)
        b = int((np.sin(twinkle_phase + 4) + 1) / 2 * 255)
        cv2.putText(frame, feedback, (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 4)
        cv2.putText(frame, feedback, (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (b, g, r), 2)

    cv2.imshow("Push-up Monitor", frame)

    key = cv2.waitKey(5) & 0xFF
    if key == 27 or remaining_time == 0:
        filename_pdf = f"pushup_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        saved_path = generate_pdf_report(timestamps, correct_counts_over_time, filename_pdf)
        print(f"PDF Report saved to: {saved_path}")
        speak(f"Your exercise report has been saved to your downloads folder")
        break

speech_queue.put(None)
speech_thread.join()
cap.release()
cv2.destroyAllWindows()
pose.close()
pygame.mixer.quit()