import sys
import cv2
import face_recognition
import pandas as pd
import os
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import threading
import time
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Get the courseId from the command-line arguments
seconds = 0
print(sys.argv)
if len(sys.argv) > 1:
    course_id = sys.argv[1]
    lecturer_email = sys.argv[2]
    seconds = sys.argv[3]
    attendance_count = sys.argv[4]
    print(seconds)
    print(f"Course ID received: {course_id}")

def send_email(session_date_time, course_data):
    sender_email = "waseemabunada202@gmail.com"  # Replace with your email
    sender_password = "fved pbwk gjvu ytfh"  # Replace with your email password

    # Set up the email server and login
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, sender_password)

    # Compose the email
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = lecturer_email
    message["Subject"] = "Session Attendance for (" + course_data + ")"

    # Email body content
    body = f"""
    Hello,

    the attendance summary for this session is finished.
    
    - Date: {session_date_time.strftime('%Y-%m-%d')}
    - Time: {session_date_time.strftime('%H:%M:%S')}
    
    Best regards,
    Attendance System
    """
    message.attach(MIMEText(body, "plain"))

    # Send the email and close the server connection
    server.send_message(message)
    server.quit()

    print("Email sent successfully.")


# Step 1: Connect to MongoDB
client = MongoClient("mongodb+srv://waseemabunada202:Waseem12345@cluster0.rwpecbs.mongodb.net/attendanceSystem?retryWrites=true&w=majority&appName=Cluster0")
db = client['attendanceSystem']
collection = db['students']

# Step 2: Fetch the course using the course_id
course_data = db['courses'].find_one({'_id': ObjectId(course_id)})

if course_data:
    print(f"Course found: {course_data['course_name']}")

    # Ensure the 'sessions' array exists
    if 'sessions' not in course_data:
        course_data['sessions'] = []
        db['courses'].update_one(
            {'_id': ObjectId(course_id)},
            {'$set': {'sessions': []}}
        )

    # Step 3: Create a new session every time this script is run
    new_session_time = datetime.now()
    new_session = {
        '_id': ObjectId(),
        'date': datetime.now(),
        'attendance_max_count': int(attendance_count),
        'attendance': []
    }
    db['courses'].update_one(
        {'_id': ObjectId(course_id)},
        {'$push': {'sessions': new_session}}
    )

    # Refresh course_data to reflect the new session in the database
    course_data = db['courses'].find_one({'_id': ObjectId(course_id)})
    print(f"New session created at: {new_session_time.strftime('%Y-%m-%d %H:%M:%S')}")

    # Setting up paths for student images
    students_folder_path = "./students/"

    # Load student images and encodings
    student_encodings, student_images = [], []
    for filename in os.listdir(students_folder_path):
        if filename.endswith(".jpg") or filename.endswith(".png"):
            student_image_path = os.path.join(students_folder_path, filename)
            student_image = face_recognition.load_image_file(student_image_path)
            try:
                student_encoding = face_recognition.face_encodings(student_image)[0]
                student_encodings.append(student_encoding)
                student_images.append(filename)
            except IndexError:
                print(f"No face found in the image: {filename}")

    student_attendance_list = []
    recorded_students = set()

    # Open laptop camera
    rtsp_url = "rtsp://admin:waseemabunada1@169.254.41.0:554/Streaming/Channels/101"
    camera = cv2.VideoCapture( rtsp_url)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not camera.isOpened():
        print("Failed to open the camera.")
    else:
        try:
            print("Press 'c' to capture a group photo and analyze attendance.")

            # Create the stop capture event
            stop_capture_event = threading.Event()

            # Function to analyze the image# Function to analyze the image
            def analyze_image(frame):
                if frame is None:
                    print("No frame available for analysis.")
                    return

                print("Analyzing the image...")
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(rgb_frame)

                if not face_locations:
                    print("No faces detected. Skipping attendance update.")
                    return

                for face_location in face_locations:
                    face_encoding = face_recognition.face_encodings(rgb_frame, [face_location])[0]
                    matches_students = face_recognition.compare_faces(student_encodings, face_encoding, tolerance=0.6)
                    if True in matches_students:
                        matched_student_index = matches_students.index(True)
                        matched_image = student_images[matched_student_index]

                        # Fetch student data from the database using the image
                        student_data = collection.find_one({"student_image": matched_image})

                        if student_data:
                            student_id = student_data['_id']
                            # Only mark attendance if the student is part of the course
                            if student_id not in recorded_students and student_id in course_data['students']:
                                recorded_students.add(student_id)

                                attendance_time = datetime.now()
                                student_attendance_list.append([
                                    student_data['student_name'],
                                    student_data['student_number'],
                                    attendance_time,
                                ])
                                print(f"Student {student_data['student_name']} recognized at {attendance_time}!")

                                # Update today's session with the student's attendance
                                db['courses'].update_one(
                                    {'_id': ObjectId(course_id), 'sessions.date': new_session['date']},
                                    {
                                        '$addToSet': {
                                            'sessions.$.attendance': {
                                                'student': student_id,
                                                'time_of_attendance': attendance_time,
                                                'attendance_count': 1
                                            }
                                        }
                                    }
                                )
                            else:
                                # Increment the attendance_count if the student is already recorded
                                db['courses'].update_one(
                                    {
                                        '_id': ObjectId(course_id),
                                        'sessions.date': new_session['date'],
                                        'sessions.attendance.student': student_id
                                    },
                                    {
                                        '$inc': {'sessions.$.attendance.$[elem].attendance_count': 1}
                                    },
                                    array_filters=[{'elem.student': student_id}]
                                )
                                print(f"Attendance count incremented for student {student_data['student_name']}!")
                    else:
                        print("No matching student found for the detected face.")
                print("Image analysis complete.")

            # Function to simulate auto-capture
            def auto_capture():
                for attempt in range(int(attendance_count)): 
                    if stop_capture_event.is_set():  # Check if the event is set
                        break
                    time.sleep(int(seconds))  # Wait for selected seconds before the next capture
                    if last_frame is not None:
                        print(f"Auto capturing attendance: Attempt {attempt + 1}")
                        analyze_image(last_frame)  # Use the last captured frame for analysis
                    else:
                        print("No valid frame for auto-capture.")
                print("Auto capture finished. Exiting...")
                stop_capture_event.set()  # Signal the main loop to stop

            # Start the auto capture in a separate thread
            threading.Thread(target=auto_capture).start()

            last_frame = None  # Variable to store the last captured frame

            while True:
                ret, frame = camera.read()
                if not ret:
                    print("Failed to capture video!")
                    break
                
                last_frame = frame  # Update last frame

                cv2.imshow('Camera', frame)

                key = cv2.waitKey(1)
                if key == ord('q') or stop_capture_event.is_set():  # Check if 'q' is pressed or stop event is set
                    print("Exiting program.")
                    stop_capture_event.set()  # Set the event to signal all threads to stop
                    break

                # if key == ord('c'):  # Manual capture
                #     analyze_image(frame)  # Analyze the currently displayed frame

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            camera.release()
            cv2.destroyAllWindows()
            print("Camera closed.")

    # Save attendance to Excel
    student_attendance_df = pd.DataFrame(
        student_attendance_list,
        columns=["Student Name", "Student Number", "Attendance Time"]
    )
    attendace_file_path = f"attendance_{course_data['course_number']}_{course_data['course_name']}_{course_data['section_number']}_{new_session_time.strftime('%Y-%m-%d')}.xlsx"
    student_attendance_df.to_excel("C:/Users/LENOVO/Desktop/" + attendace_file_path, index=False)
    send_email(
        session_date_time=new_session_time,  # The session creation time you recorded earlier
        course_data=str(course_data['course_number']) + "_" + course_data['course_name'] + "_" + str(course_data['section_number']),  # Course name and section number
    )
    print("Attendance data saved successfully.")

else:
    print(f"No course found with ID: {course_id}")