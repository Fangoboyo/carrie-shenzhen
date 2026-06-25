#include <SPI.h>
#include <TFT_eSPI.h>
TFT_eSPI tft = TFT_eSPI(); 

void setup() {
  Serial.begin(115200);
  tft.init();

  // 2. Set screen rotation 
  // 0 = Portrait, 1 = Landscape, 2 = Portrait Inverted, 3 = Landscape Inverted
  tft.setRotation(1);

  // 3. Clear the screen to a solid color
  tft.fillScreen(TFT_BLACK);


  // Draw a top status bar
  tft.fillRect(0, 0, 320, 30, TFT_BLUE); 

  // Setup text formatting
  tft.setTextColor(TFT_WHITE, TFT_BLUE); 
  tft.setTextSize(2); // Multiplier of the base font size
  
  // Print text to the status bar
  tft.setCursor(10, 8); // X, Y coordinates
  tft.println("SYSTEM ONLINE");

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setTextSize(3);
  tft.setCursor(10, 60);
}

void loop() {
  // To avoid flicker on the ESP8266, NEVER use tft.fillScreen() in the loop.
  // Only overwrite the exact pixels that are changing.
}
