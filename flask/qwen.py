import os
import face_recognition
import numpy as np
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Paths
known_faces_dir = "known_faces"

# Load known faces and labels
known_face_encodings = []
known_face_labels = []

for person_name in os.listdir(known_faces_dir):
    person_dir = os.path.join(known_faces_dir, person_name)
    if os.path.isdir(person_dir):
        for image_file in os.listdir(person_dir):
            image_path = os.path.join(person_dir, image_file)
            try:
                # Load image and generate face encoding
                image = face_recognition.load_image_file(image_path)
                face_encoding = face_recognition.face_encodings(image)[0]  # Assume one face per image
                known_face_encodings.append(face_encoding)
                known_face_labels.append(person_name)
            except IndexError:
                print(f"No face detected in {image_path}. Skipping...")

# Convert to NumPy arrays
X = np.array(known_face_encodings)
y = np.array(known_face_labels)

# Split into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train an SVM classifier
clf = SVC(kernel='linear', probability=True)
clf.fit(X_train, y_train)

# Evaluate the model
y_pred = clf.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# Save the trained model
import joblib
joblib.dump(clf, "face_recognition_model.pkl")
print("Model saved as face_recognition_model.pkl")