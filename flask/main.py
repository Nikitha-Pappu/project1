# train_yolo.py
import os
import cv2
import shutil
import torch
from ultralytics import YOLO
from sklearn.model_selection import train_test_split

# Paths
dataset_root = 'dataset'
yolo_dataset = 'yolo_dataset'
os.makedirs(yolo_dataset, exist_ok=True)

# YOLO dirs
os.makedirs(f'{yolo_dataset}/images/train', exist_ok=True)
os.makedirs(f'{yolo_dataset}/images/val', exist_ok=True)
os.makedirs(f'{yolo_dataset}/labels/train', exist_ok=True)
os.makedirs(f'{yolo_dataset}/labels/val', exist_ok=True)

# Class names
class_names = ['person1', 'person2', 'person3', 'person4']
class_map = {name: idx for idx, name in enumerate(class_names)}

# Dummy label generator
def create_dummy_annotation(image_path, label_path, class_id):
    img = cv2.imread(image_path)
    h, w = img.shape[:2]
    x_center, y_center = 0.5, 0.5
    box_width, box_height = 0.5, 0.5
    with open(label_path, 'w') as f:
        f.write(f"{class_id} {x_center} {y_center} {box_width} {box_height}\n")

# Organize
for person in class_names:
    person_folder = os.path.join(dataset_root, person)
    images = [f for f in os.listdir(person_folder) if f.lower().endswith(('jpg', 'jpeg', 'png'))]
    train_imgs, val_imgs = train_test_split(images, test_size=0.2, random_state=42)

    for img in train_imgs:
        src = os.path.join(person_folder, img)
        dst = f'{yolo_dataset}/images/train/{person}_{img}'
        shutil.copy(src, dst)
        create_dummy_annotation(
            dst,
            f'{yolo_dataset}/labels/train/{person}_{img.rsplit(".", 1)[0]}.txt',
            class_map[person]
        )

    for img in val_imgs:
        src = os.path.join(person_folder, img)
        dst = f'{yolo_dataset}/images/val/{person}_{img}'
        shutil.copy(src, dst)
        create_dummy_annotation(
            dst,
            f'{yolo_dataset}/labels/val/{person}_{img.rsplit(".", 1)[0]}.txt',
            class_map[person]
        )

# Create YAML file
yaml_content = f"""
path: {yolo_dataset}
train: images/train
val: images/val
names:
  0: person1
  1: person2
  2: person3
  3: person4
nc: 4
"""
with open(f'{yolo_dataset}/dataset.yaml', 'w') as f:
    f.write(yaml_content)

# Train model
model = YOLO('yolo11n.pt')  # or yolov11n.pt if supported
model.train(
    data=f'{yolo_dataset}/data.yaml',
    epochs=30,
    imgsz=640,
    batch=8,
    name='custom_yolov11',
    device='cuda' if torch.cuda.is_available() else 'cpu'
)

# Save best model
best_model_path = './runs/detect/custom_yolov114/weights/best.pt'
shutil.copy(best_model_path, './custom_yolov11.pt')
print("Model saved as custom_yolov11.pt")
