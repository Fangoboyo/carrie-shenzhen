#include <SPI.h>
#include <TFT_eSPI.h>
TFT_eSPI tft = TFT_eSPI(); 

void setup() {
  Serial.begin(115200);
  tft.init();

  // Set rotation
  tft.setRotation(1);

  tft.fillScreen(TFT_BLACK);


  // Draw status bar
  tft.fillRect(0, 0, 320, 30, TFT_BLUE); 

  // Setup text formatting
  tft.setTextColor(TFT_WHITE, TFT_BLUE); 
  tft.setTextSize(2); // Multiplier of the base font size
  
  tft.setCursor(10, 8);
  tft.println("SYSTEM ONLINE");

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setTextSize(3);
  tft.setCursor(10, 60);
}

void loop() {
  // To avoid flicker on the ESP8266, NEVER use tft.fillScreen() in the loop.
  // Only overwrite the exact pixels that are changing.
}
