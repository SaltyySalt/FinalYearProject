import sys
import cv2
import face_recognition
from pymongo import MongoClient
import numpy as np
import base64
import time

uid = sys.argv[1]

# MongoDB Setup
client = MongoClient("your_mongo_uri")
db = client["your_db"]
collection = db["users"]

# Function to capture and process face
def capture_and_encode():
    cam = cv2.VideoCapture(0)
    time.sleep(2)  # Let camera warm up
    ret, frame = cam.read()
    cam.release()

    if not ret:
        print("❌ Failed to capture image from camera.")
        return None

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb_frame)

    if len(encodings) == 0:
        print("⚠️ No face detected.")
        return None

    return encodings[0]

# Retry logic
max_attempts = 3
face_encoding = None

for attempt in range(1, max_attempts + 1):
    print(f"🔁 Attempt {attempt} of {max_attempts}")
    face_encoding = capture_and_encode()
    if face_encoding is not None:
        break
    time.sleep(2)

# Fallback: Give up if still no face detected
if face_encoding is None:
    print("❌ Face capture failed after multiple attempts.")
    sys.exit(1)

# Encode and store in DB
encoded_bytes = base64.b64encode(np.array(face_encoding, dtype=np.float64).tobytes()).decode('utf-8')

collection.update_one(
    {"uid": uid},
    {"$set": {"face_encoding": encoded_bytes}}
)

print("✅ Face encoding saved to MongoDB.")
