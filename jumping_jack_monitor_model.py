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

def get_downloads_folder():
    home = Path.home()
    if os.name == 'nt':
        return home / "Downloads"
    elif os.name == 'posix':
        return home / "Downloads"
    else:
        return home / "Downloads"

def start_jumping_jack():
    pygame.mixer.init()
    
    def generate_pdf_report(timestamps, correct_counts, filename):
        plt.figure(figsize=(8, 4))
        plt.plot(timestamps, correct_counts, marker='o', linestyle='-', color='green')
        plt.title('Correct Jumping Jacks Over Time')
        plt.xlabel('Time (s)')
        plt.ylabel('Correct Count')
        plt.grid(True)
        graph_image = 'temp_progress_graph.png'
        plt.savefig(graph_image)
        plt.close()

        tips = "Great effort! Maintain consistency and aim for higher hand raises."
        if correct_counts:
            avg_rate = correct_counts[-1] / timestamps[-1] if timestamps[-1] != 0 else 0
            if avg_rate < 0.5:
                tips = "Try to increase your pace for better cardio benefit."
            elif avg_rate > 1:
                tips = "Excellent pace! Keep it up."

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=14)
        pdf.cell(200, 10, txt="Jumping Jack Exercise Report", ln=True, align='C')
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

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose()

    correct_count = 0
    incorrect_count = 0
    stage = "down"
    max_hand_height = 1.0
    step_evaluated = False
    feedback = ""

    start_time = time.time()
    countdown_seconds = 3600
    twinkle_phase = 0

    timestamps = []
    correct_counts_over_time = []

    def get_y(landmark):
        return landmark.y if landmark else 1.0

    def hands_down(landmarks):
        left = get_y(landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value])
        right = get_y(landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value])
        shoulder_y = (get_y(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]) + get_y(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value])) / 2
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

        if results.pose_landmarks:
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            landmarks = results.pose_landmarks.landmark

            left_y = get_y(landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value])
            right_y = get_y(landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value])
            hand_avg_y = (left_y + right_y) / 2

            if stage == "up" and hand_avg_y < max_hand_height:
                max_hand_height = hand_avg_y

            if stage == "down" and not hands_down(landmarks):
                stage = "up"
                max_hand_height = hand_avg_y
                step_evaluated = False

            elif stage == "up" and hands_down(landmarks):
                if not step_evaluated:
                    head_y = get_y(landmarks[mp_pose.PoseLandmark.NOSE.value])
                    if max_hand_height < head_y:
                        correct_count += 1
                        feedback = "Good Job!"
                    else:
                        incorrect_count += 1
                        if is_waving_sideways(landmarks):
                            feedback = "Don't wave your hands sideways!"
                            speak(feedback)
                        else:
                            feedback = "Raise your hands higher!"
                            speak(feedback)
                    step_evaluated = True
                    stage = "down"
                    now = int(time.time() - start_time)
                    timestamps.append(now)
                    correct_counts_over_time.append(correct_count)

        elapsed_time = int(time.time() - start_time)
        remaining_time = max(0, countdown_seconds - elapsed_time)
        minutes = remaining_time // 60
        seconds = remaining_time % 60
        timer_display = f"{minutes:02}:{seconds:02}"

        draw_rounded_rect(frame, (10, 10), (680, 100), (30, 30, 30))
        cv2.rectangle(frame, (30, 25), (230, 80), (0, 255, 0), -1)
        cv2.putText(frame, f"Correct: {correct_count}", (45, 65), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

        cv2.rectangle(frame, (250, 25), (450, 80), (0, 0, 255), -1)
        cv2.putText(frame, f"Incorrect: {incorrect_count}", (265, 65), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        cv2.rectangle(frame, (470, 25), (600, 80), (0, 255, 255), -1)
        cv2.putText(frame, timer_display, (490, 65), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

        bar_x1, bar_y1 = 20, frame.shape[0] - 50
        bar_x2, bar_y2 = frame.shape[1] - 20, frame.shape[0] - 20
        cv2.rectangle(frame, (bar_x1, bar_y1), (bar_x2, bar_y2), (50, 50, 50), -1)
        progress_fraction = elapsed_time / countdown_seconds
        fill_width = int((bar_x2 - bar_x1) * progress_fraction)
        cv2.rectangle(frame, (bar_x1, bar_y1), (bar_x1 + fill_width, bar_y2), (0, 255, 0), -1)
        cv2.putText(frame, f"Time Progress: {int(progress_fraction * 100)}%", (bar_x1 + 10, bar_y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        if feedback:
            twinkle_phase += 0.1
            r = int((np.sin(twinkle_phase) + 1) / 2 * 255)
            g = int((np.sin(twinkle_phase + 2) + 1) / 2 * 255)
            b = int((np.sin(twinkle_phase + 4) + 1) / 2 * 255)
            cv2.putText(frame, feedback, (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 4)
            cv2.putText(frame, feedback, (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (b, g, r), 2)

        cv2.imshow("Jumping Jack Monitor", frame)

        key = cv2.waitKey(5) & 0xFF
        if key == 27 or remaining_time == 0:
            filename_pdf = f"jumping_jack_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
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