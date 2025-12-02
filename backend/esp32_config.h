/*
 * ESP32 Doctor Comments Configuration
 * 
 * Configure this file with your specific settings
 */

#ifndef ESP32_COMMENTS_CONFIG_H
#define ESP32_COMMENTS_CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// API Configuration
#define API_BASE_URL "http://192.168.1.100:5000"  // Replace with your PC's IP
#define PATIENT_ID "P001"  // Patient ID to fetch comments for

// LoRa Configuration
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2
#define LORA_FREQUENCY 433E6  // 433MHz (adjust for your region)

// Timing Configuration
#define COMMENT_CHECK_INTERVAL 30000  // Check every 30 seconds (in milliseconds)
#define LORA_SEND_INTERVAL 5000       // Send via LoRa every 5 seconds

// LoRa Advanced Settings
#define LORA_SYNC_WORD 0xF3
#define LORA_TX_POWER 17      // Max power (17 dBm)
#define LORA_SPREADING_FACTOR 7
#define LORA_SIGNAL_BANDWIDTH 125E6

// Packet Configuration
#define MAX_PACKET_SIZE 200   // Conservative packet size for LoRa

// Debug Configuration
#define DEBUG_ENABLED true    // Set to false to disable debug output

#endif // ESP32_COMMENTS_CONFIG_H
