import serial
import time
import sys
import os
import codecs

def enroll_new_fingerprint(user_id, name, university_id):
    """
    Function to send new fingerprint data to Arduino.
    """
    print("Starting fingerprint enrollment...")
    try:
        # Validate user_id
        if not user_id.isdigit() or not (1 <= int(user_id) <= 100):
            print("Error: ID must be a number between 1 and 100.")
            return
        
        # Prepare serial connection
        ser = serial.Serial('COM6', 9600)  # Update with the correct COM port
        time.sleep(2)  # Wait for the connection to initialize

        # Encode the command in UTF-8
        command = f"enroll{int(user_id):02},{name},{university_id}\n"
        print(f"Sending command: {command.strip()}")
        ser.write(command.encode('utf-8'))  # Send the command

        # Wait for Arduino response
        while True:
            try:
                response = ser.readline().decode('utf-8').strip()
                if response:
                    print(response)
                if "Fingerprint successfully registered" in response or "Failed to save fingerprint" in response:
                    break
            except UnicodeDecodeError:
                # If decoding fails, print a warning and skip to the next iteration
                print("Warning: Unable to decode response. Skipping.")
                continue

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Ensure serial connection is always closed
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("Serial connection closed.")
        else:
            print("No serial connection to close.")

if __name__ == "__main__":
    # Ensure the terminal environment uses UTF-8 encoding
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

    if len(sys.argv) != 4:
        print("Usage: python newfinger.py <user_id> <name> <university_id>")
        sys.exit(1)

    user_id = sys.argv[1]
    name = sys.argv[2]
    university_id = sys.argv[3]

    enroll_new_fingerprint(user_id, name, university_id)
