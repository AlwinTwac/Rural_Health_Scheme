/*
 * ESP32 Unified LoRa System
 * 
 * Combines patient vitals sending, household fetching, and doctor comments
 * 
 * Hardware:
 * - ESP32 with LoRa module (SX1276/1278)
 * - DS18B20 temperature sensor
 * - LoRa frequency: 433MHz
 */

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// --- LoRa Pins ---
#define LORA_SS   5
#define LORA_RST  14
#define LORA_DIO0 26
#define LORA_FREQUENCY 433E6

// DS18B20 Temperature Sensor
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// --- WiFi Credentials ---
const char* WIFI_SSID = "LAVIDA2024-L";
const char* WIFI_PASS = "$ucce$$Vcro$$theGlob3.";

// --- API URLs ---
String API_URL_PATIENT_LIST = "http://192.168.100.34:5000/api/patients/list";
String API_BASE_URL = "http://192.168.100.34:5000";
String PATIENT_ID = "";  // Will be set dynamically based on current patient

// --- Patient Data Storage ---
String patientList[20];
int patientCount = 0;
bool commentMode = false;

// --- Vitals Data ---
String userName = "";
String bpValue = "";
String heartRate = "";

// --- System State ---
bool waitingForComment = false;
bool waitingForReply = false;
bool wifiConnected = false;

// --- Doctor Comments ---
unsigned long lastCommentCheck = 0;
unsigned long lastLoRaSend = 0;
const unsigned long COMMENT_CHECK_INTERVAL = 30000; // Check every 30 seconds
const unsigned long LORA_SEND_INTERVAL = 5000; // Send via LoRa every 5 seconds

String latestCommentJson = "";
bool hasNewComment = false;

// --- Function to extract patient ID from patient data ---
String extractPatientId(String patientData) {
  // Look for patient ID in the format "ID:XXXXX|" or similar
  int idIndex = patientData.indexOf("ID:");
  if (idIndex != -1) {
    int endIndex = patientData.indexOf("|", idIndex);
    if (endIndex != -1) {
      return patientData.substring(idIndex + 3, endIndex);
    }
  }
  
  // If no ID found, look for other patterns or return empty
  return "";
}

// --- Function to get current active patient ID ---
String getCurrentPatientId() {
  // If we have stored patients, use the most recent one
  if (patientCount > 0) {
    return extractPatientId(patientList[patientCount - 1]);
  }
  
  // If we have current user data, try to extract from there
  if (userName != "") {
    // For now, return empty - in a real system you'd have a mapping
    // This could be enhanced to match names to patient IDs
    return "";
  }
  
  return "";
}

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("\n=== ESP32 Unified LoRa System ===");
  Serial.println("Features:");
  Serial.println("- Send patient vitals");
  Serial.println("- Fetch household data via WiFi");
  Serial.println("- Receive doctor comments via LoRa");
  Serial.println("- Fetch doctor comments from API");
  
  // Show initial system status
  Serial.println("\n📊 System Status:");
  Serial.println("- WiFi: " + String(wifiConnected ? "Connected" : "Not Connected"));
  Serial.println("- Doctor Comments: " + String(getCurrentPatientId() != "" ? "Active" : "Waiting for patient"));
  
  if (getCurrentPatientId() == "") {
    Serial.println("💡 Tip: Use 'SET_PATIENT_ID' to manually set a patient ID, or");
    Serial.println("        receive patient data via LoRa to enable automatic comment fetching.");
  }

  // Initialize DS18B20 sensor
  sensors.begin();

  // Connect to WiFi
  connectToWiFi();

  // Initialize LoRa
  setupLoRa();

  Serial.println("\nCommands:");
  Serial.println("  NEXT → Enter new patient vitals");
  Serial.println("  DONE → Stop sending and wait for doctor comments");
  Serial.println("  view household → fetch household data from WiFi LoRa node");
  Serial.println("  FETCH_HOUSEHOLD → Request household list");
  Serial.println("  LIST → Show stored patients");
  Serial.println("  SET_PATIENT_ID → Manually set patient ID for comment fetching");
  Serial.println("  EXIT → Exit comment mode");

  LoRa.receive();
}

void loop() {
  // Maintain WiFi connection
  maintainWiFiConnection();

  // Check for doctor comments periodically
  checkDoctorComments();

  // Send comments via LoRa if available
  if (hasNewComment && millis() - lastLoRaSend >= LORA_SEND_INTERVAL) {
    sendCommentsViaLoRa();
    lastLoRaSend = millis();
  }

  // Handle serial input and LoRa packets
  handleSerialInput();
  receiveLoRaPackets();

  delay(10);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
    if (millis() - start > 20000) {
      Serial.println("\nWiFi connection timeout. Will retry later.");
      wifiConnected = false;
      return;
    }
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  wifiConnected = true;
}

void maintainWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED && wifiConnected) {
    Serial.println("WiFi lost. Reconnecting...");
    connectToWiFi();
  }
}

void setupLoRa() {
  Serial.println("Initializing LoRa...");
  
  SPI.begin();
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa initialization failed!");
    while (1);
  }

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

    // COMMENT MODE HANDLING
    if (commentMode) {
      if (command.equalsIgnoreCase("EXIT")) {
        commentMode = false;
        patientCount = 0;
        Serial.println("\n➡ Back to receive mode...");
        LoRa.receive();
        return;
      }

      int index = command.toInt();
      if (index >= 0 && index < patientCount) {
        Serial.println("\nSelected Patient:\n" + patientList[index]);
        Serial.print("Enter Doctor Comment: ");
        while (!Serial.available());
        String comment = Serial.readStringUntil('\n');
        comment.trim();

        String message = "PATIENT#" + String(index) + "|" + comment;

        LoRa.beginPacket();
        LoRa.print(message);
        LoRa.endPacket();

        Serial.println("\n✅ Comment Sent to Patient!");
        Serial.println("Select another patient or type EXIT.\n");
        LoRa.receive();
      } else {
        Serial.println("❌ Invalid choice. Enter a valid number or EXIT.");
      }
      return;
    }

    // NORMAL COMMANDS
    if (command.equalsIgnoreCase("NEXT")) {
      waitingForComment = false;

      sensors.requestTemperatures();
      float temperatureC = sensors.getTempCByIndex(0);

      Serial.print("\nEnter Patient Name: ");
      while (!Serial.available());
      userName = Serial.readStringUntil('\n');
      userName.trim();

      Serial.print("Enter BP: ");
      while (!Serial.available());
      bpValue = Serial.readStringUntil('\n');
      bpValue.trim();

      Serial.print("Enter Heart Rate: ");
      while (!Serial.available());
      heartRate = Serial.readStringUntil('\n');
      heartRate.trim();

      String message =
        "NAME:" + userName +
        "|BP:" + bpValue +
        "|HR:" + heartRate +
        "|TEMP:" + String(temperatureC, 1);

      Serial.println("\nSending Packet:");
      Serial.println(message);

      LoRa.beginPacket();
      LoRa.print(message);
      LoRa.endPacket();

      Serial.println("Packet Sent!\nType NEXT, DONE, view household, or FETCH_HOUSEHOLD.");
      LoRa.receive();
    }

    else if (command.equalsIgnoreCase("DONE")) {
      Serial.println("\nSending DONE to doctor…");

      LoRa.beginPacket();
      LoRa.print("DONE");
      LoRa.endPacket();

      Serial.println("\n=== WAITING FOR DOCTOR COMMENTS ===");
      waitingForComment = true;
      LoRa.receive();
    }

    else if (command.equalsIgnoreCase("view household") || command.equalsIgnoreCase("FETCH_HOUSEHOLD")) {
      if (wifiConnected) {
        Serial.println("\nFetching patient list from server...");
        fetchPatientList();
      } else {
        Serial.println("\nSending request via LoRa to fetch household...");
        LoRa.beginPacket();
        LoRa.print("FETCH_HOUSEHOLD");
        LoRa.endPacket();
        waitingForReply = true;
        LoRa.receive();
      }
    }

    else if (command.equalsIgnoreCase("SET_PATIENT_ID")) {
      Serial.print("Enter Patient ID (e.g., P-4209444A): ");
      while (!Serial.available());
      String newPatientId = Serial.readStringUntil('\n');
      newPatientId.trim();
      
      if (newPatientId != "") {
        PATIENT_ID = newPatientId;
        Serial.println("✅ Patient ID set to: " + PATIENT_ID);
        Serial.println("Now checking for comments for this patient...");
        
        // Immediately check for comments
        fetchDoctorComments();
      } else {
        Serial.println("❌ Invalid Patient ID");
      }
    }

    else if (command.equalsIgnoreCase("LIST")) {
      if (patientCount == 0) {
        Serial.println("No patients stored.");
      } else {
        Serial.println("\nStored Patients:");
        for (int i = 0; i < patientCount; i++) {
          int nameStart = patientList[i].indexOf("NAME:") + 5;
          int nameEnd = patientList[i].indexOf("|", nameStart);
          if (nameEnd == -1) nameEnd = patientList[i].length();
          String name = patientList[i].substring(nameStart, nameEnd);
          
          // Extract patient ID if available
          String patientId = extractPatientId(patientList[i]);
          String display = String(i) + " → " + name;
          if (patientId != "") {
            display += " (ID: " + patientId + ")";
          }
          Serial.println(display);
        }
        
        // Show current active patient ID
        String currentId = getCurrentPatientId();
        if (currentId != "") {
          Serial.println("\n📍 Current Active Patient ID: " + currentId);
        } else {
          Serial.println("\nℹ️  No active patient ID set");
        }
      }
    }

    else {
      Serial.println("Invalid command. Type NEXT, DONE, view household, FETCH_HOUSEHOLD, LIST, SET_PATIENT_ID, or EXIT.");
    }
  }
}

void receiveLoRaPackets() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String received = "";
    while (LoRa.available()) received += (char)LoRa.read();

    Serial.println("\n--- RECEIVED LoRa ---");
    Serial.println(received);
    Serial.println("---------------------");

    // Handle FETCH_HOUSEHOLD request
    if (received == "FETCH_HOUSEHOLD") {
      if (wifiConnected) {
        fetchPatientList();
      } else {
        Serial.println("❌ WiFi not connected for household fetch");
      }
      return;
    }

    // Store patient data
    else if (patientCount < 20 && received.startsWith("NAME:")) {
      patientList[patientCount++] = received;
      Serial.println("✔ Patient stored (" + String(patientCount) + ")");
      Serial.println("Type LIST to view patients, or select a patient number to comment.");
      return;
    }

    // Enter comment mode
    else if (received == "DONE") {
      activateCommentMode();
      return;
    }

    // Handle doctor comments
    if (waitingForComment && received.startsWith("COMMENT:")) {
      String jsonPart = received.substring(8);
      Serial.println("\n--- DOCTOR COMMENT RECEIVED ---");
      Serial.println(jsonPart);
      Serial.println("-------------------------------");
      waitingForComment = false;
    }

    // Handle household JSON responses
    else if (waitingForReply) {
      const size_t capacity = 2*JSON_ARRAY_SIZE(10) + 10*JSON_OBJECT_SIZE(5) + 1024;
      DynamicJsonDocument doc(capacity);

      DeserializationError error = deserializeJson(doc, received);

      if (!error) {
        Serial.println("\n--- Household List ---");
        for (JsonObject patient : doc.as<JsonArray>()) {
          const char* name = patient["name"];
          const char* household = patient["household"];
          Serial.print("Patient: ");
          Serial.print(name);
          Serial.print(" | Household: ");
          Serial.println(household);
        }
        Serial.println("---------------------");
      } else {
        Serial.print("JSON Parse Error: ");
        Serial.println(error.c_str());
      }

      waitingForReply = false;
    }

    LoRa.receive();
  }
}

void fetchPatientList() {
  if (!wifiConnected) {
    Serial.println("❌ WiFi not connected");
    return;
  }

  HTTPClient http;
  http.setTimeout(10000);
  http.begin(API_URL_PATIENT_LIST);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String json = http.getString();

    Serial.println("\n--- SERVER RESPONSE ---");
    Serial.println(json);
    Serial.println("-----------------------");

    LoRa.beginPacket();
    LoRa.print(json);
    LoRa.endPacket();

    Serial.println("JSON sent back via LoRa.");
  } else {
    Serial.print("HTTP Request Failed: ");
    Serial.println(httpCode);
  }

  http.end();
  LoRa.receive();
}

void activateCommentMode() {
  commentMode = true;
  Serial.println("\n=== COMMENT MODE ACTIVATED ===");
  
  if (patientCount == 0) {
    Serial.println("No patients received.");
    return;
  }

  Serial.println(String(patientCount) + " patient(s) recorded.\nSelect patient number to comment:");
  for (int i = 0; i < patientCount; i++) {
    int start = patientList[i].indexOf("NAME:") + 5;
    int end = patientList[i].indexOf("|", start);
    if (end == -1) end = patientList[i].length();
    String name = patientList[i].substring(start, end);
    Serial.println(String(i) + " → " + name);
  }
}

void checkDoctorComments() {
  if (!wifiConnected) {
    return;
  }

  // Only check if we have a patient ID to check for
  String currentPatientId = getCurrentPatientId();
  if (currentPatientId == "") {
    // Don't print anything - just skip silently until we have a patient
    return;
  }

  unsigned long currentTime = millis();
  if (currentTime - lastCommentCheck >= COMMENT_CHECK_INTERVAL) {
    fetchDoctorComments();
    lastCommentCheck = currentTime;
  }
}

void fetchDoctorComments() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  // Get current patient ID dynamically
  PATIENT_ID = getCurrentPatientId();
  
  HTTPClient http;

  // Ensure clean URL construction
  String baseUrl = API_BASE_URL;
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
  }

  // Remove any /api/ paths to prevent double paths
  if (baseUrl.indexOf("/api/") != -1) {
    int protocolEnd = baseUrl.indexOf("://");
    if (protocolEnd != -1) {
      int pathStart = baseUrl.indexOf("/", protocolEnd + 3);
      if (pathStart != -1) {
        baseUrl = baseUrl.substring(0, pathStart);
      }
    }
  }

  String url = baseUrl + "/api/esp32/comments/latest/" + PATIENT_ID;

  Serial.println("🔎 Checking doctor comments...");
  Serial.print("Patient ID: ");
  Serial.println(PATIENT_ID);
  Serial.print("URL -> ");
  Serial.println(url);

  http.setTimeout(10000);
  http.begin(url);

  int code = http.GET();
  Serial.print("HTTP code: ");
  Serial.println(code);

  if (code == 200) {
    String payload = http.getString();
    Serial.println("Payload:");
    Serial.println(payload);

    DynamicJsonDocument doc(2048);
    DeserializationError err = deserializeJson(doc, payload);
    if (err) {
      Serial.print("JSON parse error: ");
      Serial.println(err.c_str());
      http.end();
      return;
    }

    if (doc.containsKey("hasComment") && doc["hasComment"] == true) {
      String compact = createLoRaCommentJson(doc);

      if (compact != latestCommentJson) {
        latestCommentJson = compact;
        hasNewComment = true;
        Serial.println("🆕 New comment found!");
        Serial.println(compact);
      } else {
        Serial.println("No new comment (same as last).");
      }
    } else {
      Serial.println("No doctor comments available for this patient.");
    }
  } else if (code == 404) {
    Serial.println("ℹ️  Patient not found in database (404)");
  } else {
    Serial.println("❌ Error fetching comments → " + String(code));
  }

  http.end();
}

String createLoRaCommentJson(JsonDocument& doc) {
  String json = "{";
  if (doc.containsKey("patientId")) {
    json += "\"pid\":\"" + String(doc["patientId"].as<String>()) + "\",";
  } else {
    json += "\"pid\":\"\",";
  }
  if (doc.containsKey("patientName")) {
    json += "\"pn\":\"" + String(doc["patientName"].as<String>()) + "\",";
  } else {
    json += "\"pn\":\"\",";
  }
  if (doc.containsKey("comment")) {
    json += "\"c\":\"" + String(doc["comment"].as<String>()) + "\",";
  } else {
    json += "\"c\":\"\",";
  }
  if (doc.containsKey("commentedBy")) {
    json += "\"cb\":\"" + String(doc["commentedBy"].as<String>()) + "\",";
  } else {
    json += "\"cb\":\"\",";
  }
  if (doc.containsKey("commentedAt")) {
    json += "\"ca\":\"" + String(doc["commentedAt"].as<String>()) + "\"";
  } else {
    json += "\"ca\":\"\"";
  }

  if (doc.containsKey("vitals")) {
    JsonObject v = doc["vitals"];
    json += ",\"v\":{";

    bool first = true;
    if (v.containsKey("temperature")) {
      json += "\"t\":" + String(v["temperature"].as<float>());
      first = false;
    }
    if (v.containsKey("heartRate")) {
      if (!first) json += ",";
      json += "\"hr\":" + String(v["heartRate"].as<int>());
      first = false;
    }
    if (v.containsKey("bloodPressure")) {
      if (!first) json += ",";
      JsonObject bp = v["bloodPressure"];
      json += "\"bp\":\"" + String(bp["systolic"].as<int>()) + "/" +
              String(bp["diastolic"].as<int>()) + "\"";
    }

    json += "}";
  }

  json += "}";
  return json;
}

void sendCommentsViaLoRa() {
  if (!hasNewComment || latestCommentJson.length() == 0) {
    return;
  }

  Serial.println("📤 Sending doctor comment via LoRa...");
  String msg = latestCommentJson;
  Serial.println("Message length: " + String(msg.length()));

  const int maxSize = 200; // conservative packet size

  if (msg.length() <= maxSize) {
    LoRa.beginPacket();
    LoRa.print("COMMENT:" + msg);
    LoRa.endPacket();
    Serial.println("✔ Sent in single packet");
  } else {
    int total = (msg.length() + maxSize - 1) / maxSize;
    for (int i = 0; i < total; i++) {
      int start = i * maxSize;
      int endIdx = (i + 1) * maxSize;
      if (endIdx > (int)msg.length()) endIdx = msg.length();

      String part = msg.substring(start, endIdx);

      LoRa.beginPacket();
      LoRa.print("COMMENT:" + String(i + 1) + "/" + String(total) + ":" + part);
      LoRa.endPacket();

      Serial.println("Sent packet " + String(i + 1) + "/" + String(total));
      delay(100);
    }
  }

  hasNewComment = false;
  Serial.println("✔ Comment transmission complete");
  LoRa.receive();
}
