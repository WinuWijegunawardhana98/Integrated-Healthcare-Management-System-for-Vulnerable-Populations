import face_recognition
import os
import cv2
import numpy as np
import math
import datetime
from silent_face_anti_spoofing.test import test  # Import anti-spoofing function
import util 

def face_confidence(face_distance, face_match_threshold=0.6):
    range = (1.0 - face_match_threshold)
    linear_val = (1.0 - face_distance) / (range * 2.0)

    if face_distance > face_match_threshold:
        return str(round(linear_val * 100)) + '%'
    else:
        value = (linear_val + ((1.0 - linear_val) * math.pow((linear_val - 0.5) * 2, 0.2))) * 100
        return str(round(value, 2)) + '%'


class FaceRecognition:
    face_locations = []
    face_encodings = []
    face_names = []
    known_face_encodings = []
    known_face_names = []
    process_current_frame = True

    def __init__(self):
        self.encode_faces()

    def encode_faces(self):
        for image in os.listdir('uploads'):
            try:
                face_image = face_recognition.load_image_file(f'uploads/{image}')
                face_encodings = face_recognition.face_encodings(face_image)

                if face_encodings:
                    self.known_face_encodings.append(face_encodings[0])
                    self.known_face_names.append(image)
                else:
                    print(f"No face found in image: {image}")

            except Exception as e:
                print(f"Error processing image {image}: {e}")

    def run_recognition(self, input_username):
        video_capture = cv2.VideoCapture(0)
        if not video_capture.isOpened():
            raise Exception("Video source not found")

        detected = False

        while True:
            ret, frame = video_capture.read()
            if not ret:
                continue

            # **Step 1: Perform anti-spoofing detection**
            label = test(
                image=frame,
                model_dir='/home/phillip/Desktop/todays_tutorial/27_face_recognition_spoofing/code/face-attendance-system/Silent-Face-Anti-Spoofing/resources/anti_spoof_models',
                device_id=0
            )

            if label != 1:  # If spoofing is detected
                print("Spoofing attempt detected! Access Denied.")
                util.msg_box('Hey, you are a spoofer!', 'You are fake !')
                continue  # Skip recognition

            # **Step 2: Proceed with Face Recognition if real**
            if self.process_current_frame:
                small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
                rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

                self.face_locations = face_recognition.face_locations(rgb_small_frame)
                self.face_encodings = face_recognition.face_encodings(rgb_small_frame, self.face_locations)

                self.face_names = []
                for face_encoding in self.face_encodings:
                    matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
                    name = 'Unknown'
                    confidence = 'Unknown'

                    face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)

                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]
                        confidence = face_confidence(face_distances[best_match_index])

                    recognized_name = os.path.splitext(name)[0]
                    self.face_names.append(f'{recognized_name} ({confidence})')
                    print(recognized_name + ' --- ' + input_username)

                    if recognized_name == input_username:
                        detected = True
                        break  # Exit loop if match found

            self.process_current_frame = not self.process_current_frame

            # Display recognized face
            for (top, right, bottom, left), name in zip(self.face_locations, self.face_names):
                top *= 4
                left *= 4
                right *= 4
                bottom *= 4

                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), -1)
                cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 1)

            cv2.imshow('Face Recognition', frame)

            if detected:
                print("Match detected! Logging in user.")
                util.msg_box('Welcome back!', f'Welcome, {input_username}.')

                # Log successful login
                with open("access_log.txt", "a") as f:
                    f.write(f"{input_username},{datetime.datetime.now()},in\n")

                break

            if cv2.waitKey(1) == ord('q'):
                break

        video_capture.release()
        cv2.destroyAllWindows()
        return detected
