#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>
#include <EEPROM.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Initialize LCD and Fingerprint sensor
LiquidCrystal_I2C lcd(0x27, 16, 2);
SoftwareSerial mySerial(2, 3); // Pin for fingerprint sensor
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// Bluetooth setup
SoftwareSerial bt(8, 9); // Bluetooth (Rx, Tx)

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  bt.begin(9600); // Define baud rate for Bluetooth
  mySerial.begin(57600); // Fingerprint sensor baud rate
  lcd.init();
  lcd.backlight();
  
  lcd.print("Initializing...");
  delay(2000);
  lcd.clear();
  
  if (finger.verifyPassword()) {
    lcd.print("Fingerprint: OK");
    Serial.println("Fingerprint sensor connected successfully.");
  } else {
    lcd.print("Fingerprint: Fail");
    Serial.println("Failed to connect fingerprint sensor.");
    while (1); // Stop if fingerprint sensor fails to connect
  }
  delay(2000);
  lcd.clear();
}

void loop() {
  // Bluetooth communication
  if (bt.available()) {
    char data = bt.read(); // Read data from Bluetooth
    Serial.print("Received from Bluetooth: ");
    Serial.println(data); // Print the received data to Serial Monitor
  }

  // Fingerprint verification process
  lcd.clear();
  lcd.print("Place your finger");
  lcd.setCursor(0, 1);
  lcd.print("to verify...");
  Serial.println("Place your fingerprint to verify...");
  
  if (finger.getImage() == FINGERPRINT_OK) {
    if (finger.image2Tz() == FINGERPRINT_OK) {
      if (finger.fingerFastSearch() == FINGERPRINT_OK) {
        uint8_t id = finger.fingerID;
        String name = readFromEEPROM(id, true);
        String studentId = readFromEEPROM(id, false);
        
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Name: " + name);
        lcd.setCursor(0, 1);
        lcd.print("ID: " + studentId);
        
        // Print recognized information to the Serial Monitor
        Serial.println("Recognized ID: " + String(id));
        Serial.println("Name: " + name);
        Serial.println("Student ID: " + studentId);
        delay(3000);
      } else {
        lcd.clear();
        lcd.print("Not Registered");
        lcd.setCursor(0, 1);
        lcd.print("Try Again");
        Serial.println("Fingerprint not registered.");
        delay(2000);
      }
    }
  }

  // Serial command handling (for enrolling fingerprints via Serial Monitor)
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    if (command.startsWith("enroll")) {
      int id = command.substring(6, command.indexOf(",")).toInt();
      String name = command.substring(command.indexOf(",") + 1, command.lastIndexOf(","));
      String studentId = command.substring(command.lastIndexOf(",") + 1);
      
      Serial.print("ID: ");
      Serial.println(id);
      Serial.print("Name: ");
      Serial.println(name);
      Serial.print("Student ID: ");
      Serial.println(studentId);
      
      if (id >= 1 && id <= 100) {
        Serial.print("Enrolling ID: ");
        Serial.println(id);
        enrollFingerprint(id);
        storeInEEPROM(id, name, studentId);
      } else {
        Serial.println("Enter an ID between 1 and 100.");
      }
    }
  }

  // Send data from Serial Monitor to Bluetooth
  if (Serial.available()) {
    char command = Serial.read(); // Read data from Serial Monitor
    bt.write(command); // Send data to Bluetooth
    Serial.print("Sent to Bluetooth: ");
    Serial.println(command); // Print sent data to Serial Monitor
  }
}

void enrollFingerprint(uint8_t id) {
  lcd.clear();
  lcd.print("Place your finger");
  lcd.setCursor(0, 1);
  lcd.print("on the sensor...");
  Serial.println("Place your finger on the sensor.");
  finger.deleteModel(id);
  while (finger.getImage() != FINGERPRINT_OK)
    delay(100);
  
  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    Serial.println("Error processing fingerprint.");
    lcd.clear();
    lcd.print("Error processing");
    lcd.setCursor(0, 1);
    lcd.print("fingerprint.");
    return;
  }
  
  lcd.clear();
  lcd.print("Remove your finger.");
  delay(2000);
  while (finger.getImage() != FINGERPRINT_NOFINGER)
    delay(100);
  
  lcd.clear();
  lcd.print("Place the same");
  lcd.setCursor(0, 1);
  lcd.print("finger again...");
  while (finger.getImage() != FINGERPRINT_OK)
    delay(100);
  
  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    Serial.println("Error processing fingerprint.");
    return;
  }
  
  if (finger.createModel() != FINGERPRINT_OK) {
    Serial.println("Failed to create fingerprint model.");
    return;
  }
  
  if (finger.storeModel(id) != FINGERPRINT_OK) {
    Serial.println("Failed to store fingerprint.");
    return;
  }
  
  Serial.println("Fingerprint successfully registered!");
  lcd.clear();
  lcd.print("Fingerprint stored");
  lcd.setCursor(0, 1);
  lcd.print("successfully!");
  delay(2000);
}

void storeInEEPROM(uint8_t id, String name, String studentId) {
  int address = id * 50;
  EEPROM.write(address, name.length());
  for (int i = 0; i < name.length(); i++) {
    EEPROM.write(address + 1 + i, name[i]);
  }
  EEPROM.write(address + 1 + name.length(), studentId.length());
  for (int i = 0; i < studentId.length(); i++) {
    EEPROM.write(address + 2 + name.length() + i, studentId[i]);
  }
}

String readFromEEPROM(uint8_t id, bool isName) {
  int address = id * 50;
  String result = "";
  byte length = EEPROM.read(address);
  
  if (isName) {
    for (int i = 0; i < length; i++) {
      result += char(EEPROM.read(address + 1 + i));
    }
  } else {
    byte studentIdLength = EEPROM.read(address + 1 + length);
    for (int i = 0; i < studentIdLength; i++) {
      result += char(EEPROM.read(address + 2 + length + i));
    }
  }
  return result;
}
