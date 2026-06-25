#include <SPI.h>
#include <TFT_eSPI.h>

// Initialize TFT_eSPI instance
TFT_eSPI tft = TFT_eSPI(); 

void setup() {
  Serial.begin(115200);

  // Initialize display
  tft.init();

  // Set rotation
  tft.setRotation(1);

  tft.fillScreen(TFT_BLACK);

  // --- DRAWING THE INTERFACE ---

  // Draw status bar
  tft.fillRect(0, 0, 320, 30, TFT_BLUE); 

  tft.setTextColor(TFT_WHITE, TFT_BLUE);
  tft.setTextSize(2);
  
  tft.setCursor(10, 8);
  tft.println("SYSTEM ONLINE");

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setTextSize(3);
  tft.setCursor(10, 60);
  tft.println("Temp: 42 C");
}

void loop() {
  // Update changing pixels directly to avoid screen flickering
}