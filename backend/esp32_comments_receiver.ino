/*
 * ESP32 Doctor Comments Receiver
 * 
 * This ESP32 receives doctor comments from another ESP32 via LoRa
 * and displays them on an LCD or Serial Monitor.
 * 
 * Hardware:
 * - ESP32 with LoRa module (SX1276/1278)
 * - Optional: LCD display (I2C 16x2 or 20x4)
 * - LoRa frequency: 433MHz (must match sender)
 */

#include <WiFi.h>
#include <ArduinoJson.h>
#include <LoRa.h>
#include <SPI.h>

// LoRa Configuration (must match sender)
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2
#define LORA_FREQUENCY 433E6 // 433MHz

// LCD Configuration (optional)
// Uncomment if using LCD
// #include <LiquidCrystal_I2C.h>
// #define LCD_ADDRESS 0x27
// #define LCD_COLUMNS 16
// #define LCD_ROWS 2
// LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLUMNS, LCD_ROWS);

// Comment storage
String latestComment = "";
String latestPatientName = "";
String latestDoctorName = "";
String latestTimestamp = "";
bool hasNewComment = false;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Doctor Comments Receiver");
  
  // Initialize LoRa
  setupLoRa();
  
  // Initialize LCD (if used)
  // setupLCD();
  
  Serial.println("Ready to receive doctor comments via LoRa...");
}

void loop() {
  // Check for incoming LoRa packets
  receiveLoRaPackets();
  
  // Display new comments
  if (hasNewComment) {
    displayComment();
    hasNewComment = false;
  }
  
  delay(100);
}

void setupLoRa() {
  Serial.println("Initializing LoRa receiver...");
  
  // Use default SPI pins for ESP32 (more compatible)
  SPI.begin();
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa initialization failed!");
    while (1);
  }
  
  LoRa.setSyncWord(0xF3); // Must match sender
  LoRa.setTxPower(17);
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E6);
  
  Serial.println("LoRa receiver initialized successfully!");
}

// void setupLCD() {
//   lcd.init();
//   lcd.backlight();
//   lcd.clear();
//   lcd.print("Doctor Comments");
//   lcd.setCursor(0, 1);
//   lcd.print("Receiver Ready");
//   delay(2000);
// }

void receiveLoRaPackets() {
  int packetSize = LoRa.parsePacket();
  
  if (packetSize > 0) {
    String incoming = "";
    
    // Read packet
    while (LoRa.available()) {
      incoming += (char)LoRa.read();
    }
    
    Serial.println("Received packet: " + incoming);
    Serial.println("RSSI: " + String(LoRa.packetRssi()));
    Serial.println("SNR: " + String(LoRa.packetSnr()));
    
    // Check if this is a comment packet
    if (incoming.startsWith("COMMENT:")) {
      processCommentPacket(incoming);
    } else {
      Serial.println("Non-comment packet received");
    }
  }
}

void processCommentPacket(String packet) {
  // Remove "COMMENT:" prefix
  String commentData = packet.substring(8); // Remove "COMMENT:"
  
  // Check if this is a multi-part message
  if (commentData.indexOf(":") != -1 && commentData.indexOf("/") != -1) {
    // Multi-part message format: "1/3:{json_chunk}"
    int slashIndex = commentData.indexOf("/");
    int colonIndex = commentData.indexOf(":");
    
    if (colonIndex > slashIndex) {
      // This is a multi-part message
      String partInfo = commentData.substring(0, colonIndex);
      String jsonChunk = commentData.substring(colonIndex + 1);
      
      // For now, we'll handle single packets only
      // Multi-packet assembly would require additional state management
      Serial.println("Multi-part message detected (not fully implemented)");
      processSingleComment(jsonChunk);
    } else {
      // Single message
      processSingleComment(commentData);
    }
  } else {
    // Single message without part info
    processSingleComment(commentData);
  }
}

void processSingleComment(String jsonString) {
  // Parse JSON
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, jsonString);
  
  if (!error) {
    // Extract comment data
    String patientId = doc["pid"] | "";
    String patientName = doc["pn"] | "";
    String comment = doc["c"] | "";
    String commentedBy = doc["cb"] | "";
    String commentedAt = doc["ca"] | "";
    
    // Only update if this is a new comment
    if (comment != latestComment) {
      latestPatientName = patientName;
      latestComment = comment;
      latestDoctorName = commentedBy;
      latestTimestamp = commentedAt;
      hasNewComment = true;
      
      Serial.println("\n=== NEW DOCTOR COMMENT RECEIVED ===");
      Serial.println("Patient: " + patientName + " (" + patientId + ")");
      Serial.println("Doctor: " + commentedBy);
      Serial.println("Time: " + commentedAt);
      Serial.println("Comment: " + comment);
      
      // Display vitals if available
      if (doc.containsKey("v")) {
        JsonObject vitals = doc["v"];
        Serial.print("Vitals: ");
        
        if (vitals.containsKey("t")) {
          Serial.print("Temp=" + String(vitals["t"].as<float>()) + "°C ");
        }
        if (vitals.containsKey("hr")) {
          Serial.print("HR=" + String(vitals["hr"].as<int>()) + "bpm ");
        }
        if (vitals.containsKey("bp")) {
          Serial.print("BP=" + vitals["bp"].as<String>());
        }
        Serial.println();
      }
      
      Serial.println("=====================================\n");
    }
  } else {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    Serial.println("Raw data: " + jsonString);
  }
}

void displayComment() {
  // Display on Serial Monitor
  Serial.println("\n--- LATEST COMMENT ---");
  Serial.println("Patient: " + latestPatientName);
  Serial.println("Doctor: " + latestDoctorName);
  Serial.println("Time: " + latestTimestamp);
  Serial.println("Comment: " + latestComment);
  Serial.println("----------------------\n");
  
  // Display on LCD (if connected)
  // displayOnLCD();
}

// void displayOnLCD() {
//   if (!latestComment.isEmpty()) {
//     lcd.clear();
    
//     // Line 1: Patient name (truncated)
//     lcd.setCursor(0, 0);
//     String line1 = latestPatientName.substring(0, 15);
//     lcd.print(line1);
    
//     // Line 2: First part of comment (truncated)
//     lcd.setCursor(0, 1);
//     String line2 = latestComment.substring(0, 15);
//     lcd.print(line2);
//     
//     // For longer comments, you might want to scroll or use multiple screens
//   }
// }

// Optional: Add a button to scroll through comments or clear display
void checkUserInput() {
  // Check for serial input to clear display or show previous comments
  if (Serial.available()) {
    String input = Serial.readString();
    input.trim();
    
    if (input == "clear") {
      latestComment = "";
      hasNewComment = false;
      Serial.println("Comments cleared");
      
      // lcd.clear();
      // lcd.print("Comments Cleared");
    } else if (input == "show") {
      displayComment();
    }
  }
}

// Enhanced error handling and signal strength monitoring
void monitorLoRaSignal() {
  static unsigned long lastSignalCheck = 0;
  unsigned long currentTime = millis();
  
  if (currentTime - lastSignalCheck >= 10000) { // Check every 10 seconds
    int rssi = LoRa.packetRssi();
    Serial.println("Current RSSI: " + String(rssi) + " dBm");
    
    if (rssi < -120) {
      Serial.println("Warning: Weak LoRa signal!");
    }
    
    lastSignalCheck = currentTime;
  }
}
