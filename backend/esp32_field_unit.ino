/*
 * ESP32 Field Unit
 * 
 * Sends requests to gateway ESP32 and receives responses
 * - Sends patient vitals to gateway
 * - Requests patient lists from gateway
 * - Requests doctor comments from gateway
 */

#include <SPI.h>
#include <LoRa.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// --- LoRa Pins (MUST match gateway) ---
#define LORA_SS   5
#define LORA_RST  14
#define LORA_DIO0 26
#define LORA_FREQUENCY 433E6

// DS18B20 Temperature Sensor
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// --- Patient Data ---
String patientList[20];
int patientCount = 0;
String selectedPatientId = "";
String selectedPatientName = "";
String userName = "";
String bpValue = "";
String heartRate = "";

// --- System State ---
bool waitingForResponse = false;
bool patientListReceived = false;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("\n=== ESP32 Field Unit ===");
  Serial.println("Functions:");
  Serial.println("- Send patient vitals to gateway");
  Serial.println("- Request patient lists from gateway");
  Serial.println("- Request doctor comments from gateway");

  // Initialize DS18B20
  sensors.begin();

  // Initialize LoRa
  setupLoRa();

  Serial.println("\n🚀 Field Unit Ready!");
  Serial.println("Commands:");
  Serial.println("  LIST → Request patient list from gateway");
  Serial.println("  SELECT N → Select patient number N from list");
  Serial.println("  NEXT → Enter and send vitals for selected patient");
  Serial.println("  COMMENT → Request latest comment for selected patient");
  Serial.println("  TEST → Send test message to gateway");
  Serial.println("  STATUS → Show current status");
  
  LoRa.receive();
}

void loop() {
  handleSerialInput();
  receiveLoRaPackets();
  delay(10);
}

void setupLoRa() {
  Serial.println("Initializing LoRa...");
  
  SPI.begin();
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa initialization failed!");
    while (1);
  }

  // MUST match gateway settings exactly
  LoRa.setSyncWord(0xF3);
  LoRa.setTxPower(17);
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E6);
  
  Serial.println("LoRa Ready.\n");
}

void handleSerialInput() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command.equalsIgnoreCase("LIST")) {
      requestPatientList();
    }
    
    else if (command.startsWith("SELECT ")) {
      int patientNum = command.substring(7).toInt();
      selectPatient(patientNum);
    }
    
    else if (command.equalsIgnoreCase("NEXT")) {
      sendPatientVitals();
    }
    
    else if (command.equalsIgnoreCase("COMMENT")) {
      requestCommentsForSelectedPatient();
    }
    
    else if (command.equalsIgnoreCase("TEST")) {
      sendTestMessage();
    }
    
    else if (command.equalsIgnoreCase("STATUS")) {
      showStatus();
    }
    
    else {
      Serial.println("Invalid command. Use LIST, SELECT N, NEXT, COMMENT, TEST, or STATUS");
    }
  }
}

void sendPatientVitals() {
  if (selectedPatientId == "") {
    Serial.println("❌ No patient selected. Use 'LIST' then 'SELECT N' first.");
    return;
  }

  sensors.requestTemperatures();
  float temperatureC = sensors.getTempCByIndex(0);

  Serial.print("\nSelected Patient: " + selectedPatientName);
  Serial.print(" (ID: " + selectedPatientId + ")");
  Serial.print("\nEnter BP: ");
  while (!Serial.available());
  bpValue = Serial.readStringUntil('\n');
  bpValue.trim();

  Serial.print("Enter Heart Rate: ");
  while (!Serial.available());
  heartRate = Serial.readStringUntil('\n');
  heartRate.trim();

  String message =
    "PATIENT_ID:" + selectedPatientId +
    "|NAME:" + selectedPatientName +
    "|BP:" + bpValue +
    "|HR:" + heartRate +
    "|TEMP:" + String(temperatureC, 1);

  Serial.println("\nSending vitals to gateway:");
  Serial.println(message);

  LoRa.beginPacket();
  LoRa.print(message);
  LoRa.endPacket();

  Serial.println("✅ Vitals sent to gateway for patient: " + selectedPatientName);
  waitingForResponse = true;
  LoRa.receive();
}

void requestPatientList() {
  Serial.println("\n📡 Requesting patient list from gateway...");

  LoRa.beginPacket();
  LoRa.print("FETCH_HOUSEHOLD");
  LoRa.endPacket();

  Serial.println("✅ Patient list request sent");
  waitingForResponse = true;
  LoRa.receive();
}

void requestCommentsForSelectedPatient() {
  if (selectedPatientId == "") {
    Serial.println("❌ No patient selected. Use 'LIST' then 'SELECT N' first.");
    return;
  }

  Serial.println("\n📡 Requesting comments for patient: " + selectedPatientName);
  
  String request = "GET_COMMENT:" + selectedPatientId;
  
  LoRa.beginPacket();
  LoRa.print(request);
  LoRa.endPacket();

  Serial.println("✅ Comment request sent for: " + selectedPatientName);
  waitingForResponse = true;
  LoRa.receive();
}

void selectPatient(int patientNum) {
  Serial.println("\n🔍 Selecting patient #" + String(patientNum));
  Serial.println("Patient list received: " + String(patientListReceived ? "Yes" : "No"));
  Serial.println("Patient count: " + String(patientCount));
  
  if (!patientListReceived) {
    Serial.println("❌ No patient list received. Use 'LIST' first.");
    Serial.println("💡 Debug: Try 'LIST' again and check if you see patient data");
    return;
  }
  
  if (patientNum < 0 || patientNum >= patientCount) {
    Serial.println("❌ Invalid patient number. Available: 0-" + String(patientCount-1));
    return;
  }
  
  Serial.println("📋 Patient data at index " + String(patientNum) + ":");
  Serial.println(patientList[patientNum]);
  
  // Parse patient data to extract ID and name
  String patientData = patientList[patientNum];
  
  // Expected format: {"name":"John","patient_id":"P-123","household":"House1"}
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, patientData);
  
  if (!error) {
    // Handle different possible field names for patient ID
    if (doc.containsKey("patient_id")) {
      selectedPatientId = doc["patient_id"].as<String>();
    } else if (doc.containsKey("patientId")) {
      selectedPatientId = doc["patientId"].as<String>();
    } else if (doc.containsKey("id")) {
      selectedPatientId = "P-" + String(doc["id"].as<int>());
    }
    
    selectedPatientName = doc["name"].as<String>();
    
    Serial.println("✅ Selected patient: " + selectedPatientName + " (ID: " + selectedPatientId + ")");
    Serial.println("Now you can use 'NEXT' to send vitals or 'COMMENT' to get comments.");
  } else {
    Serial.println("❌ Error parsing patient data");
    Serial.println("DeserializationError: " + String(error.c_str()));
    Serial.println("Raw patient data: " + patientData);
  }
}

void showStatus() {
  Serial.println("\n=== FIELD UNIT STATUS ===");
  Serial.println("WiFi: Not used (communicates via LoRa)");
  Serial.println("LoRa: " + String(LoRa.beginPacket() ? "Ready" : "Error"));
  
  if (selectedPatientId == "") {
    Serial.println("Selected Patient: None");
    Serial.println("Patients Available: " + String(patientCount) + " (use 'LIST' to see)");
  } else {
    Serial.println("Selected Patient: " + selectedPatientName + " (ID: " + selectedPatientId + ")");
  }
  
  Serial.println("Waiting for Response: " + String(waitingForResponse ? "Yes" : "No"));
  Serial.println("========================");
}

void sendTestMessage() {
  Serial.println("\n📡 Sending test message to gateway...");

  LoRa.beginPacket();
  LoRa.print("TEST_MESSAGE_FROM_FIELD");
  LoRa.endPacket();

  Serial.println("✅ Test message sent");
  waitingForResponse = true;
  LoRa.receive();
}

void receiveLoRaPackets() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String received = "";
    while (LoRa.available()) received += (char)LoRa.read();

    Serial.println("\n--- Response from Gateway ---");
    Serial.println("Response: " + received);
    Serial.println("Packet Size: " + String(packetSize) + " bytes");
    Serial.println("RSSI: " + String(LoRa.packetRssi()) + " dBm");
    Serial.println("---------------------------");

    waitingForResponse = false;

    // Handle different response types
    if (received.startsWith("ERROR:")) {
      Serial.println("❌ Gateway Error: " + received.substring(6));
    }
    else if (received.startsWith("COMMENT:")) {
      String commentJson = received.substring(8);
      Serial.println("📝 Doctor Comments Received:");
      Serial.println(commentJson);
      
      // Parse and display nicely
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, commentJson);
      if (!error) {
        Serial.println("Patient: " + doc["patientName"].as<String>());
        Serial.println("Comment: " + doc["comment"].as<String>());
        Serial.println("By: " + doc["commentedBy"].as<String>());
        Serial.println("At: " + doc["commentedAt"].as<String>());
      }
    }
    else if (received.startsWith("ACK:")) {
      Serial.println("✅ Acknowledgment: " + received.substring(4));
    }
    else if (received.startsWith("ECHO:")) {
      Serial.println("🔊 Echo: " + received.substring(5));
    }
    else if (received.startsWith("[") || received.startsWith("{")) {
      // Handle patient list JSON
      Serial.println("👥 Patient List Received:");
      Serial.println("Raw received data: " + received);
      Serial.println("Data length: " + String(received.length()));
      Serial.println("Starts with [: " + String(received.startsWith("[") ? "Yes" : "No"));
      Serial.println("Starts with {: " + String(received.startsWith("{") ? "Yes" : "No"));
      
      DynamicJsonDocument doc(2048);
      DeserializationError error = deserializeJson(doc, received);
      
      Serial.println("JSON Parse Error: " + String(error.c_str()));
      Serial.println("Is Array: " + String(doc.is<JsonArray>() ? "Yes" : "No"));
      
      if (!error && doc.is<JsonArray>()) {
        patientCount = 0;
        patientListReceived = true;
        
        Serial.println("Available Patients:");
        for (JsonObject patient : doc.as<JsonArray>()) {
          // Handle different possible field names for patient ID
          String patientId = "";
          if (patient.containsKey("patient_id")) {
            patientId = patient["patient_id"].as<String>();
          } else if (patient.containsKey("patientId")) {
            patientId = patient["patientId"].as<String>();
          } else if (patient.containsKey("id")) {
            patientId = "P-" + String(patient["id"].as<int>());
          }
          
          String name = patient["name"].as<String>();
          String household = patient["household"].as<String>();
          
          // Store patient data as JSON string for later selection
          patientList[patientCount] = "";
          serializeJson(patient, patientList[patientCount]);
          
          Serial.println(String(patientCount) + " → " + name + " (ID: " + patientId + ", Household: " + household + ")");
          patientCount++;
        }
        
        Serial.println("\n💡 Use 'SELECT N' to choose a patient, then 'NEXT' to send vitals.");
      } else {
        Serial.println("❌ Error parsing patient list JSON");
        Serial.println("Raw data: " + received);
      }
    }
    else {
      Serial.println("📄 Unknown response format");
      Serial.println("Raw data: " + received);
      Serial.println("Data length: " + String(received.length()));
      
      // Check if this might be JSON data that didn't start with [ or {
      if (received.contains("\"name\"") && received.contains("\"patientId\"")) {
        Serial.println("⚠️  This looks like patient data but didn't start with [ or {");
        Serial.println("💡 Might be fragmented JSON or different format");
      }
    }

    LoRa.receive();
  }
}
