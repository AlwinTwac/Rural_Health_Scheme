// ESP32 LoRa to API Bridge
// Posts patient readings from LoRa to the database API

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration
const char* serverUrl = "http://YOUR_IP_ADDRESS:5000/api/esp32/readings";

// LoRa Configuration (adjust based on your setup)
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

void setup() {
  Serial.begin(115200);
  
  // Initialize LoRa (you'll need to add LoRa library)
  // LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  // if (!LoRa.begin(433E6)) {
  //   Serial.println("Starting LoRa failed!");
  //   while (1);
  // }
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Simulate receiving LoRa data (replace with actual LoRa code)
  String loraData = "NAME:Batsi Guyo|BP:120/80|HR:72|TEMP:36.5";
  
  // Process received data
  if (loraData.length() > 0) {
    Serial.println("Received LoRa data: " + loraData);
    
    // Send to API
    if (sendToAPI(loraData)) {
      Serial.println("Data sent successfully!");
    } else {
      Serial.println("Failed to send data");
    }
  }
  
  delay(5000); // Wait before next reading
}

bool sendToAPI(String readingData) {
  HTTPClient http;
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["reading"] = readingData;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send HTTP POST request
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  Serial.print("Sending to API: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    http.end();
    return httpResponseCode == 200;
  } else {
    Serial.print("Error on sending POST: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

// Alternative: Simple version without JSON library
bool sendToAPISimple(String readingData) {
  HTTPClient http;
  
  // Create JSON manually
  String jsonPayload = "{\"reading\":\"" + readingData + "\"}";
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  return httpResponseCode == 200;
}

// Function to parse LoRa data (if you need to process it before sending)
void parseLoRaData(String data) {
  // Example: NAME:Batsi Guyo|BP:120/80|HR:72|TEMP:36.5
  
  int nameStart = data.indexOf("NAME:") + 5;
  int nameEnd = data.indexOf("|", nameStart);
  String name = data.substring(nameStart, nameEnd);
  
  int bpStart = data.indexOf("BP:") + 3;
  int bpEnd = data.indexOf("|", bpStart);
  String bp = data.substring(bpStart, bpEnd);
  
  int hrStart = data.indexOf("HR:") + 3;
  int hrEnd = data.indexOf("|", hrStart);
  String hr = data.substring(hrStart, hrEnd);
  
  int tempStart = data.indexOf("TEMP:") + 5;
  String temp = data.substring(tempStart);
  
  Serial.println("Parsed data:");
  Serial.println("Name: " + name);
  Serial.println("BP: " + bp);
  Serial.println("HR: " + hr);
  Serial.println("Temp: " + temp);
}
