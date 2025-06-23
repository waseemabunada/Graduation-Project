import sys
import time
import serial
import requests  # You need to install this library: pip install requests
import os

# Setup serial communication with Arduino
ser = serial.Serial('COM6', 9600)
time.sleep(2)

attendance_data = []
seen_ids = set()
seconds = 0

# Function to send attendance data to Node.js
def send_to_nodejs(attendance_data, courseId, sessionId):
    try:
        url = f'http://localhost:8000/get-attendance-from-fingerprint/{courseId}/{sessionId}'
        payload = {
            'fingerprint_data': attendance_data
        }
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print("Data successfully sent to Node.js.")
        else:
            print(f"Failed to send data to Node.js: {response.status_code}")
    except Exception as e:
        print(f"Error sending data to Node.js: {e}")

# Start reading from Arduino and collecting attendance data
courseId = sys.argv[1]
sessionId = sys.argv[2]
seconds = sys.argv[3]
print(f"Course ID: {courseId}, Session ID: {sessionId}, seconds to work: {int(seconds)}")

# Track the start time
start_time = time.time()
end_time = start_time + int(seconds)  # selected seconds duration

try:
    # Extract student data
    student_id = None
    name = None
    studentid = None
    while time.time() < end_time:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').strip()
            print(f"Received line: {line}")
            print("line")
            # print(line.split(":")[1].strip())



            if "Recognized ID:" in line:
                student_id = line.split(":")[1].strip()
                print(f"student_id={student_id}")
            elif "Name:" in line:
                name = line.split(":")[1].strip()
                print(f"name={name}")
            elif "Student ID:" in line:
                studentid = line.split(":")[1].strip()
                print(f"studentid={studentid}")
            elif "Place your fingerprint to verify..." in line:
                # Collect and send to Node.js when all data is available
                print(f"Before checking condition: student_id={student_id}, name={name}, studentid={studentid}, seen_ids={seen_ids}")
                if student_id and name and studentid and student_id not in seen_ids:
                    current_time = time.strftime('%Y-%m-%d %H:%M:%S')
                    attendance_data.append({
                        "ID": student_id,
                        "Name": name,
                        "studentid": studentid,
                        "Time": current_time
                    })
                    seen_ids.add(student_id)
                    print(f"Data collected: ID={student_id}, Name={name}, studentid={studentid}, Time={current_time}")
                # else:
                    # print("Skipping attendance data due to missing values or already seen student_id.")

                    seen_ids.add(student_id)
                    print(f"Data collected: ID={student_id}, Name={name}, studentid={studentid}, Time={current_time}")

    # Send data to Node.js after 10 seconds, even if it's empty
    print("Sending data to Node.js (even if empty). Clearing collected data.")
    send_to_nodejs(attendance_data, courseId, sessionId)
    attendance_data.clear()  # Clear data after sending

except KeyboardInterrupt:
    print("Program stopped.")
finally:
    ser.close()
    sys.exit()  # Exit the program after sending the data
