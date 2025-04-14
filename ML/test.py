from flask import Flask, request, jsonify
import cv2
import os
import numpy as np
from skimage.metrics import structural_similarity as ssim
import base64

app = Flask(__name__)

# Folder containing the set of images to compare against
IMAGE_FOLDER = "img"

@app.route('/compare', methods=['POST'])
def compare_images():
    data = request.json
    image_data = data.get('file')

    if not image_data:
        return jsonify({'error': 'No image data received'}), 400

    # Strip base64 prefix
    if image_data.startswith('data:image/jpeg;base64,'):
        image_data = image_data.replace('data:image/jpeg;base64,', '')

    # Decode base64 string
    image_bytes = base64.b64decode(image_data)

    # Save the uploaded image temporarily
    uploaded_image_path = "uploaded_image.jpg"
    with open(uploaded_image_path, "wb") as f:
        f.write(image_bytes)

    # Load the uploaded image
    uploaded_image = cv2.imread(uploaded_image_path, cv2.IMREAD_GRAYSCALE)
    if uploaded_image is None:
        return jsonify({"error": "Failed to read uploaded image"}), 400

    # Initialize variables to track the best match
    best_person = None
    best_match_image = None
    highest_similarity = -1

    try:
        # Iterate through all subfolders (each representing a person)
        for person_folder in os.listdir(IMAGE_FOLDER):
            person_folder_path = os.path.join(IMAGE_FOLDER, person_folder)

            # Ensure it's a directory
            if not os.path.isdir(person_folder_path):
                continue

            # Iterate through all images in the person's folder
            for filename in os.listdir(person_folder_path):
                try:
                    folder_image_path = os.path.join(person_folder_path, filename)
                    folder_image = cv2.imread(folder_image_path, cv2.IMREAD_GRAYSCALE)

                    if folder_image is None:
                        continue

                    folder_image_resized = cv2.resize(folder_image, (uploaded_image.shape[1], uploaded_image.shape[0]))

                    similarity_score, _ = ssim(uploaded_image, folder_image_resized, full=True)

                    if similarity_score > highest_similarity:
                        highest_similarity = similarity_score
                        best_person = person_folder
                        best_match_image = filename
                except Exception as e:
                    print(f"Error processing {filename}: {e}")
    finally:
        # Clean up the temporary uploaded image
        if os.path.exists(uploaded_image_path):
            os.remove(uploaded_image_path)

    if best_person:
        if highest_similarity >= 0.3:
            return jsonify({
                "most_similar_person": best_person,
                "most_similar_image": best_match_image,
                "similarity_score": float(highest_similarity)
            })
        else:
            return jsonify({
                "error": "No matching images found",
                "similarity_score": float(highest_similarity)
            }), 404
    else:
        return jsonify({"error": "No matching images found"}), 404

@app.route('/save-images', methods=['POST'])
def save_images():
    data = request.json
    aadhaar = data.get('aadhaarNumber')
    images = data.get('images', {})

    folder_path = f'img/{aadhaar}'
    os.makedirs(folder_path, exist_ok=True)

    for key, base64_image in images.items():
        if base64_image:
            try:
                header, encoded = base64_image.split(",", 1)  # Handles data URL
                img_data = base64.b64decode(encoded)
                with open(f"{folder_path}/{key}.jpg", "wb") as f:
                    f.write(img_data)
            except Exception as e:
                print(f"Error saving {key}: {e}")

    return jsonify({'status': 'success'}), 200

if __name__ == '__main__':
    # Ensure the image folder exists
    if not os.path.exists(IMAGE_FOLDER):
        os.makedirs(IMAGE_FOLDER)

    # Run the Flask app
    app.run(debug=True)