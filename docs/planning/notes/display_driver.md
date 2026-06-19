```c++
#include <SPI.h>
#include <TFT_eSPI.h>

// Invoke the library. It automatically pulls the pins from User_Setup.h
TFT_eSPI tft = TFT_eSPI(); 

void setup() {
  Serial.begin(115200);

  // 1. Initialize the hardware SPI bus and the display
  tft.init();

  // 2. Set screen rotation 
  // 0 = Portrait, 1 = Landscape, 2 = Portrait Inverted, 3 = Landscape Inverted
  tft.setRotation(1);

  // 3. Clear the screen to a solid color
  tft.fillScreen(TFT_BLACK);

  // --- DRAWING THE INTERFACE ---

  // Draw a top status bar
  tft.fillRect(0, 0, 320, 30, TFT_BLUE); 

  // Setup text formatting
  tft.setTextColor(TFT_WHITE, TFT_BLUE); // Foreground, Background (prevents text overlapping mess)
  tft.setTextSize(2); // Multiplier of the base font size
  
  // Print text to the status bar
  tft.setCursor(10, 8);
  tft.println("SYSTEM ONLINE");

  // Placeholder
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setTextSize(3);
  tft.setCursor(10, 60);
  tft.println("Temp: 42 C");
}

void loop() {
}
```