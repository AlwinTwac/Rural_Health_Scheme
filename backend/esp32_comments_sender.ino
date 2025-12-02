/*
 * ESP32 Doctor Comments Retrieval System
 * 
 * This ESP32 connects to WiFi, fetches doctor comments from the API,
 * and sends them to another ESP32 via LoRa.
 * 
 * Hardware:
 * - ESP32 with WiFi and LoRa module (SX1276/1278)
 * - LoRa frequency: 433MHz (adjust as needed for your region)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LoRa.h>
#include <SPI.h>

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// API Configuration
String API_URL_PATIENT_LIST = "http://192.168.100.34:5000/api/patients/list";
String API_BASE_URL = "http://192.168.100.34:5000";  // IMPORTANT: NO /api/ path!
String PATIENT_ID = "P-4209444A";  // REAL patient ID from database (Clyde Butcher)

// LoRa Configuration
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2
#define LORA_FREQUENCY 433E6 // 433MHz

// Timing Configuration
const unsigned long COMMENT_CHECK_INTERVAL = 30000; // Check every 30 seconds
const unsigned long LORA_SEND_INTERVAL = 5000; // Send via LoRa every 5 seconds

// Global variables
unsigned long lastCommentCheck = 0;
unsigned long lastLoRaSend = 0;
String latestCommentJson = "";
bool hasNewComment = false;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Doctor Comments Retrieval System");
  
  // Initialize LoRa
  setupLoRa();
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("System ready. Starting comment retrieval...");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check for new comments periodically
  if (currentTime - lastCommentCheck >= COMMENT_CHECK_INTERVAL) {
    fetchDoctorComments();
    lastCommentCheck = currentTime;
  }
  
  // Send comments via LoRa if there are new ones
  if (currentTime - lastLoRaSend >= LORA_SEND_INTERVAL && hasNewComment) {
    sendCommentsViaLoRa();
    lastLoRaSend = currentTime;
  }
  
  delay(1000);
}

void setupLoRa() {
  Serial.println("Initializing LoRa...");
  
  // Use default SPI pins for ESP32 (more compatible)
  SPI.begin();
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa initialization failed!");
    while (1);
  }
  
  LoRa.setSyncWord(0xF3);
  LoRa.setTxPower(17); // Max power
  LoRa.setSpreadingFactor(7); // Faster transmission
  LoRa.setSignalBandwidth(125E3);
  
  Serial.println("LoRa initialized successfully!");
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void fetchDoctorComments() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
    return;
  }
  
  HTTPClient http;
  
  // Ensure clean URL construction
  String baseUrl = String(API_BASE_URL);
  // Remove trailing slash if present
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
  }
  
  // Check if baseUrl already contains /api/ and remove it to prevent double paths
  if (baseUrl.indexOf("/api/") != -1) {
    Serial.println("⚠️  WARNING: API_BASE_URL should not include /api/ path");
    Serial.println("    Please set API_BASE_URL to just: http://IP:PORT");
    Serial.println("    Current URL will be corrected...");
    
    // Extract just the base URL (protocol + host + port)
    int protocolEnd = baseUrl.indexOf("://");
    if (protocolEnd != -1) {
      int pathStart = baseUrl.indexOf("/", protocolEnd + 3);
      if (pathStart != -1) {
        baseUrl = baseUrl.substring(0, pathStart);
      }
    }
  }
  
  String url = baseUrl + "/api/esp32/comments/latest/" + PATIENT_ID;
  
  Serial.print("Fetching comments from: ");
  Serial.println(url);
  Serial.print("Base URL: ");
  Serial.println(baseUrl);
  Serial.print("Patient ID: ");
  Serial.println(PATIENT_ID);
  
  http.begin(url);
  http.setTimeout(10000); // 10 second timeout
  
  int httpResponseCode = http.GET();
  
  Serial.print("HTTP Response Code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    Serial.println("Response received:");
    Serial.println(payload);
    
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      if (doc["hasComment"] == true) {
        // Create a compact JSON for LoRa transmission
        String commentJson = createLoRaCommentJson(doc);
        
        // Check if this is a new comment
        if (commentJson != latestCommentJson) {
          latestCommentJson = commentJson;
          hasNewComment = true;
          Serial.println("New comment received!");
          Serial.println(commentJson);
        } else {
          Serial.println("No new comments");
        }
      } else {
        Serial.println("No doctor comments available");
      }
    } else {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("HTTP request failed with code: ");
    Serial.println(httpResponseCode);
    Serial.println("Response: " + http.getString());
  }
  
  http.end();
}

String createLoRaCommentJson(JsonDocument& doc) {
  // Create a compact JSON format for LoRa transmission
  String json = "{";
  json += "\"pid\":\"" + String(doc["patientId"].as<String>()) + "\",";
  json += "\"pn\":\"" + String(doc["patientName"].as<String>()) + "\",";
  json += "\"c\":\"" + String(doc["comment"].as<String>()) + "\",";
  json += "\"cb\":\"" + String(doc["commentedBy"].as<String>()) + "\",";
  json += "\"ca\":\"" + String(doc["commentedAt"].as<String>()) + "\"";
  
  // Add vitals if available
  if (doc.containsKey("vitals")) {
    JsonObject vitals = doc["vitals"];
    json += ",\"v\":{";
    
    if (vitals.containsKey("temperature")) {
      json += "\"t\":" + String(vitals["temperature"].as<float>()) + ",";
    }
    if (vitals.containsKey("heartRate")) {
      json += "\"hr\":" + String(vitals["heartRate"].as<int>()) + ",";
    }
    if (vitals.containsKey("bloodPressure")) {
      JsonObject bp = vitals["bloodPressure"];
      json += "\"bp\":\"" + String(bp["systolic"].as<int>()) + "/" + String(bp["diastolic"].as<int>()) + "\"";
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
  
  Serial.println("Sending comment via LoRa...");
  Serial.println("Message: " + latestCommentJson);
  
  // Split long messages if needed (LoRa has packet size limits)
  int maxPacketSize = 200; // Conservative packet size
  String message = latestCommentJson;
  
  if (message.length() <= maxPacketSize) {
    // Send in one packet
    LoRa.beginPacket();
    LoRa.print("COMMENT:" + message);
    LoRa.endPacket();
    Serial.println("Comment sent in single packet");
  } else {
    // Split into multiple packets
    int totalPackets = (message.length() + maxPacketSize - 1) / maxPacketSize;
    
    for (int i = 0; i < totalPackets; i++) {
      int start = i * maxPacketSize;
      int end = min(start + maxPacketSize, (int)message.length());
      String chunk = message.substring(start, end);
      
      LoRa.beginPacket();
      LoRa.print("COMMENT:" + String(i + 1) + "/" + String(totalPackets) + ":" + chunk);
      LoRa.endPacket();
      
      delay(100); // Small delay between packets
      Serial.println("Sent packet " + String(i + 1) + "/" + String(totalPackets));
    }
  }
  
  hasNewComment = false; // Mark as sent
  Serial.println("Comment transmission completed");
}

// WiFi reconnection handler
void maintainWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    connectToWiFi();
  }
}
