from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import matplotlib.pyplot as plt

# Load trained YOLO model
model = YOLO("custom_yolov11.pt")

# Define class names (adjust according to your actual model's classes)
class_names = ['person1', 'person2', 'person3', 'person4']

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    # Get the uploaded image
    file = request.files['image']
    img_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({'error': 'Invalid image format'}), 400

    # Resize the image to match YOLO's expected input size
    img_resized = cv2.resize(img, (640, 640))

    # Perform inference with a low confidence threshold (0.1)
    results = model(img_resized, conf=0.1)  # Lower threshold to catch all potential detections

    # Extract the results
    detections = results[0].boxes
    output = []

    # Process detections
    if detections:
        for box in detections:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = class_names[cls_id]
            output.append({
                'class': name,
                'confidence': round(conf, 3)
            })
        
        # Save image with bounding boxes drawn (for visualization)
        img_with_boxes = results[0].plot()  # Plot bounding boxes
        img_with_boxes = cv2.cvtColor(img_with_boxes, cv2.COLOR_BGR2RGB)
        
        # Save the processed image
        cv2.imwrite('detected_result.jpg', img_with_boxes)

        # Optionally, visualize the result
        plt.imshow(img_with_boxes)
        plt.axis('off')  # Don't show axis for the image
        plt.show()

    else:
        return jsonify({'error': 'No objects detected in image'}), 200

    # Return detection results
    return jsonify({
        'results': output,
        'detected_image': 'detected_result.jpg'  # Path to the processed image
    })


if __name__ == '__main__':
    app.run(debug=True)
