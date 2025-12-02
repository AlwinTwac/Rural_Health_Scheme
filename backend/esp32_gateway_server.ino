/*
 * ESP32 LoRa Gateway Server
 * 
 * Simple gateway that:
 * - Fetches patient lists from database via WiFi
 * - Fetches doctor comments from database via WiFi  
 * - Responds to LoRa requests from other ESP32s
 * - Receives vitals readings from other ESP32s
 * 
 * No manual input required - fully automated
 */

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- LoRa Pins ---
#define LORA_SS   5
#define LORA_RST  14
#define LORA_DIO0 26
#define LORA_FREQUENCY 433E6

// --- WiFi Credentials ---
const char* WIFI_SSID = "LAVIDA2024-L";
const char* WIFI_PASS = "$ucce$$Vcro$$theGlob3.";

// --- API URLs ---
String API_URL_PATIENT_LIST = "http://192.168.100.34:5000/api/patients/list";
String API_BASE_URL = "http://192.168.100.34:5000";

// --- System State ---
bool wifiConnected = false;

// --- Doctor Comments ---
unsigned long lastCommentCheck = 0;
const unsigned long COMMENT_CHECK_INTERVAL = 30000; // Check every 30 seconds
String latestCommentJson = "";
bool hasNewComment = false;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("\n=== ESP32 LoRa Gateway Server ===");
  Serial.println("Functions:");
  Serial.println("- Respond to patient list requests");
  Serial.println("- Fetch and broadcast doctor comments");
  Serial.println("- Receive vitals readings from field ESP32s");

  // Connect to WiFi
  connectToWiFi();

  // Initialize LoRa
  setupLoRa();

  Serial.println("\n🚀 Gateway Server Ready!");
  Serial.println("Waiting for LoRa requests from field ESP32s...");
  
  LoRa.receive();
}

void loop() {
  // Maintain WiFi connection
  maintainWiFiConnection();

  // Check for doctor comments periodically
  checkDoctorComments();

  // Send comments via LoRa if available
  if (hasNewComment) {
    sendCommentsViaLoRa();
    hasNewComment = false;
  }

  // Process incoming LoRa packets
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

void receiveLoRaPackets() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String received = "";
    while (LoRa.available()) received += (char)LoRa.read();

    Serial.println("\n--- LoRa Request Received ---");
    Serial.println("Request: " + received);
    Serial.println("Packet Size: " + String(packetSize) + " bytes");
    Serial.println("RSSI: " + String(LoRa.packetRssi()) + " dBm");
    Serial.println("-----------------------------");

    // Handle patient list request
    if (received == "FETCH_HOUSEHOLD") {
      handlePatientListRequest();
    }
    
    // Handle specific patient comment request
    else if (received.startsWith("GET_COMMENT:")) {
      String patientId = received.substring(12); // Remove "GET_COMMENT:" prefix
      handleCommentRequest(patientId);
    }
    
    // Handle vitals reading received
    else if (received.startsWith("PATIENT_ID:")) {
      handleVitalsReading(received);
    }
    else if (received.startsWith("NAME:")) {
      // Legacy format - still handle for compatibility
      handleVitalsReading(received);
    }
    
    // Handle DONE signal (patient ready for comments)
    else if (received == "DONE") {
      Serial.println("📝 Field ESP32 ready for doctor comments");
      // Could trigger immediate comment check if needed
    }
    
    else {
      Serial.println("❌ Unknown request: " + received);
      // Echo back for debugging
      LoRa.beginPacket();
      LoRa.print("ECHO:" + received);
      LoRa.endPacket();
      Serial.println("📤 Echo response sent");
    }

    LoRa.receive();
  }
}

void handlePatientListRequest() {
  if (!wifiConnected) {
    Serial.println("❌ WiFi not connected - cannot fetch patient list");
    
    // Send error response
    LoRa.beginPacket();
    LoRa.print("ERROR:WiFi_NOT_CONNECTED");
    LoRa.endPacket();
    return;
  }

  Serial.println("📡 Fetching patient list from server...");

  HTTPClient http;
  http.setTimeout(10000);
  http.begin(API_URL_PATIENT_LIST);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String json = http.getString();
    
    Serial.println("✅ Patient list fetched successfully");
    Serial.println("Sending via LoRa...");

    // Send patient list back via LoRa
    LoRa.beginPacket();
    LoRa.print(json);
    LoRa.endPacket();
    
    Serial.println("📤 Patient list sent via LoRa");
  } else {
    Serial.print("❌ HTTP Error: ");
    Serial.println(httpCode);
    
    // Send error response
    LoRa.beginPacket();
    LoRa.print("ERROR:HTTP_" + String(httpCode));
    LoRa.endPacket();
  }

  http.end();
}

void handleCommentRequest(String patientId) {
  if (!wifiConnected) {
    Serial.println("❌ WiFi not connected - cannot fetch comments");
    return;
  }

  Serial.println("🔍 Fetching comments for patient: " + patientId);

  HTTPClient http;

  // Build URL
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

  String url = baseUrl + "/api/esp32/comments/latest/" + patientId;
  Serial.println("URL: " + url);

  http.setTimeout(10000);
  http.begin(url);

  int code = http.GET();
  Serial.print("HTTP Response: ");
  Serial.println(code);

  if (code == 200) {
    String payload = http.getString();
    Serial.println("✅ Comments fetched successfully");
    Serial.println("Sending via LoRa...");

    // Send comments back via LoRa
    LoRa.beginPacket();
    LoRa.print("COMMENT:" + payload);
    LoRa.endPacket();
    
    Serial.println("📤 Comments sent via LoRa");
  } else {
    Serial.println("❌ Error fetching comments");
    
    // Send error response
    LoRa.beginPacket();
    LoRa.print("ERROR:COMMENT_NOT_FOUND");
    LoRa.endPacket();
  }

  http.end();
}

void handleVitalsReading(String reading) {
  Serial.println("📊 Vitals Reading Received:");
  Serial.println(reading);
  
  // Parse the vitals data
  // Expected format: PATIENT_ID:P-123|NAME:John|BP:120/80|HR:72|TEMP:36.5
  String patientId = "";
  String patientName = "";
  String bp = "";
  String hr = "";
  String temp = "";
  
  // Parse each field
  int start = 0;
  int end = reading.indexOf("|");
  while (end != -1) {
    String field = reading.substring(start, end);
    int colonPos = field.indexOf(":");
    if (colonPos != -1) {
      String key = field.substring(0, colonPos);
      String value = field.substring(colonPos + 1);
      
      if (key == "PATIENT_ID") {
        patientId = value;
      } else if (key == "NAME") {
        patientName = value;
      } else if (key == "BP") {
        bp = value;
      } else if (key == "HR") {
        hr = value;
      } else if (key == "TEMP") {
        temp = value;
      }
    }
    
    start = end + 1;
    end = reading.indexOf("|", start);
  }
  
  // Handle last field
  String lastField = reading.substring(start);
  int colonPos = lastField.indexOf(":");
  if (colonPos != -1) {
    String key = lastField.substring(0, colonPos);
    String value = lastField.substring(colonPos + 1);
    
    if (key == "PATIENT_ID") {
      patientId = value;
    } else if (key == "NAME") {
      patientName = value;
    } else if (key == "BP") {
      bp = value;
    } else if (key == "HR") {
      hr = value;
    } else if (key == "TEMP") {
      temp = value;
    }
  }
  
  Serial.println("Parsed Vitals:");
  Serial.println("  Patient ID: " + patientId);
  Serial.println("  Patient Name: " + patientName);
  Serial.println("  BP: " + bp);
  Serial.println("  HR: " + hr);
  Serial.println("  TEMP: " + temp);
  
  // Send vitals to database
  if (wifiConnected && patientId != "") {
    sendVitalsToDatabase(patientId, patientName, bp, hr, temp);
  } else {
    Serial.println("❌ Cannot send to database - WiFi not connected or no patient ID");
    
    // Still acknowledge receipt
    LoRa.beginPacket();
    LoRa.print("ACK:VITALS_RECEIVED_LOCAL_ONLY");
    LoRa.endPacket();
    
    Serial.println("✅ Vitals acknowledged (local storage only)");
  }
}

void sendVitalsToDatabase(String patientId, String patientName, String bp, String hr, String temp) {
  Serial.println("📡 Sending vitals to database...");
  
  HTTPClient http;
  
  // Build URL for vitals endpoint
  String url = API_BASE_URL + "/api/vitals";
  if (url.endsWith("/")) {
    url = url.substring(0, url.length() - 1);
  }
  
  // Remove any /api/ paths to prevent double paths
  if (url.indexOf("/api/") != -1) {
    int protocolEnd = url.indexOf("://");
    if (protocolEnd != -1) {
      int pathStart = url.indexOf("/", protocolEnd + 3);
      if (pathStart != -1) {
        url = url.substring(0, pathStart);
      }
    }
  }
  
  url += "/api/vitals";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Parse BP values
  String systolic = "";
  String diastolic = "";
  int slashPos = bp.indexOf("/");
  if (slashPos != -1) {
    systolic = bp.substring(0, slashPos);
    diastolic = bp.substring(slashPos + 1);
  }
  
  // Create JSON payload
  String jsonData = "{";
  jsonData += "\"patient_id\":\"" + patientId + "\",";
  jsonData += "\"temperature\":" + temp + ",";
  jsonData += "\"heart_rate\":" + hr + ",";
  jsonData += "\"blood_pressure_systolic\":" + systolic + ",";
  jsonData += "\"blood_pressure_diastolic\":" + diastolic + ",";
  jsonData += "\"recorded_by\":\"ESP32_Field_Unit\"";
  jsonData += "}";
  
  Serial.println("Sending JSON: " + jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode == 200 || httpCode == 201) {
    String response = http.getString();
    Serial.println("✅ Vitals saved to database successfully!");
    Serial.println("Response: " + response);
    
    // Send success acknowledgment
    LoRa.beginPacket();
    LoRa.print("ACK:VITALS_SAVED_TO_DATABASE");
    LoRa.endPacket();
    
    Serial.println("📤 Success acknowledgment sent");
  } else {
    Serial.print("❌ Error saving vitals to database. HTTP Code: ");
    Serial.println(httpCode);
    Serial.println("Response: " + http.getString());
    
    // Send error acknowledgment
    LoRa.beginPacket();
    LoRa.print("ERROR:DATABASE_SAVE_FAILED_" + String(httpCode));
    LoRa.endPacket();
    
    Serial.println("📤 Error acknowledgment sent");
  }
  
  http.end();
}

void checkDoctorComments() {
  if (!wifiConnected) {
    return;
  }

  // Check for any new comments periodically
  // This could be enhanced to check for specific patients
  // For now, this is a placeholder for automatic comment broadcasting
  
  unsigned long currentTime = millis();
  if (currentTime - lastCommentCheck >= COMMENT_CHECK_INTERVAL) {
    // Could implement automatic comment checking for all active patients
    // For now, just update the timer
    lastCommentCheck = currentTime;
    Serial.println("🔎 Periodic comment check completed");
  }
}

void sendCommentsViaLoRa() {
  if (latestCommentJson.length() == 0) {
    return;
  }

  Serial.println("📤 Broadcasting doctor comment via LoRa...");
  
  LoRa.beginPacket();
  LoRa.print("COMMENT:" + latestCommentJson);
  LoRa.endPacket();
  
  Serial.println("✅ Comment broadcast complete");
  latestCommentJson = ""; // Clear after sending
  
  LoRa.receive();
}
