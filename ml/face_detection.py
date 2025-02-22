import face_recognition
import os
import cv2
import numpy as np
import math

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

                if face_encodings:  # Check if the list is not empty
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
            if self.process_current_frame:
                small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
                rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

                # Detect faces
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

                    # Extract the base name (without extension) for comparison
                    recognized_name = os.path.splitext(name)[0]
                    self.face_names.append(f'{recognized_name} ({confidence})')
                    print(recognized_name+'---'+input_username)

                    # Compare with the input username
                    confidence_value = float(confidence.strip('%'))
                    if recognized_name == input_username and confidence_value > 98:
                        detected = True
                        break  # Exit the loop if a match is found

            self.process_current_frame = not self.process_current_frame

            # Display annotations
            for (top, right, bottom, left), name in zip(self.face_locations, self.face_names):
                top *= 4
                left *= 4
                right *= 4
                bottom *= 4

                cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), -1)
                cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 1)

            cv2.imshow('Face Recognition', frame)

            if detected:
                print("Match detected!")
                break

            if cv2.waitKey(1) == ord('q'):
                break

        video_capture.release()
        cv2.destroyAllWindows()
        return detected
