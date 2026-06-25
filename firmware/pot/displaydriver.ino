#include <SPI.h>
#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI();

// UI State variables
enum SystemState {
  STATE_DISCONNECTED,
  STATE_CONNECTED,
  STATE_SYNCING,
  STATE_SYNC_COMPLETE,
  STATE_EJECTED
};

SystemState currentState = STATE_CONNECTED;
SystemState previousState = STATE_DISCONNECTED;

// Telemetry state
int batteryPercent = 78;
float batteryVoltage = 3.92;
int chargeCurrent = 420; // mA
int syncProgress = 0;
String currentSyncFile = "video_03.h264";

// Interactive Backlight dummy state
bool backlightOn = true;

// Timing variables for simulation
unsigned long lastUpdate = 0;
unsigned long lastTouchDebounce = 0;

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1); // Landscape (320x240)
  tft.fillScreen(TFT_BLACK);
  
  // Calibrate touch sensor (default coordinates mapping)
  uint16_t calData[5] = { 275, 3620, 264, 3532, 1 };
  tft.setTouch(calData);

  drawBaseLayout();
}

void drawBaseLayout() {
  tft.fillScreen(TFT_BLACK);
  
  // Header Status Bar
  tft.fillRect(0, 0, 320, 30, TFT_NAVY);
  tft.setTextColor(TFT_WHITE, TFT_NAVY);
  tft.setTextSize(2);
  tft.setCursor(10, 8);
  tft.print("CARRIE DOCK v1.0");

  // Draw Bottom Action Buttons
  // Button 1: SYNC (Blue)
  tft.fillRect(10, 185, 90, 45, TFT_BLUE);
  tft.drawRect(10, 185, 90, 45, TFT_WHITE);
  tft.setTextColor(TFT_WHITE, TFT_BLUE);
  tft.setTextSize(2);
  tft.setCursor(30, 200);
  tft.print("SYNC");

  // Button 2: EJECT (Red)
  tft.fillRect(115, 185, 90, 45, TFT_RED);
  tft.drawRect(115, 185, 90, 45, TFT_WHITE);
  tft.setTextColor(TFT_WHITE, TFT_RED);
  tft.setCursor(132, 200);
  tft.print("EJECT");

  // Button 3: LIGHTS (Green)
  tft.fillRect(220, 185, 90, 45, TFT_DARKGREEN);
  tft.drawRect(220, 185, 90, 45, TFT_WHITE);
  tft.setTextColor(TFT_WHITE, TFT_DARKGREEN);
  tft.setCursor(235, 200);
  tft.print("LIGHTS");
}

void drawTelemetry() {
  // Update header status text on the right
  tft.fillRect(200, 0, 120, 30, TFT_NAVY);
  tft.setTextSize(2);
  tft.setCursor(210, 8);
  if (currentState == STATE_DISCONNECTED) {
    tft.setTextColor(TFT_LIGHTGREY, TFT_NAVY);
    tft.print("OFFLINE");
  } else if (currentState == STATE_CONNECTED) {
    tft.setTextColor(TFT_GREEN, TFT_NAVY);
    tft.print("CONNECTED");
  } else if (currentState == STATE_SYNCING) {
    tft.setTextColor(TFT_YELLOW, TFT_NAVY);
    tft.print("SYNCING");
  } else if (currentState == STATE_SYNC_COMPLETE) {
    tft.setTextColor(TFT_GREEN, TFT_NAVY);
    tft.print("COMPLETE");
  } else if (currentState == STATE_EJECTED) {
    tft.setTextColor(TFT_RED, TFT_NAVY);
    tft.print("EJECTED");
  }

  // Draw Left Card: Charging Telemetry
  tft.drawRoundRect(10, 40, 140, 135, 8, TFT_DARKGREY);
  tft.fillRect(11, 41, 138, 133, TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(20, 50);
  tft.print("POWER STATUS");

  if (currentState != STATE_DISCONNECTED && currentState != STATE_EJECTED) {
    // Battery Percentage Large
    tft.setTextSize(3);
    tft.setTextColor(TFT_GREEN, TFT_BLACK);
    tft.setCursor(20, 68);
    tft.print(batteryPercent);
    tft.print("%");

    // Voltage & Current
    tft.setTextSize(1);
    tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
    tft.setCursor(20, 105);
    tft.print("Volts: ");
    tft.print(batteryVoltage);
    tft.print("V");

    tft.setCursor(20, 125);
    tft.print("Current: ");
    tft.print(chargeCurrent);
    tft.print("mA");

    tft.setCursor(20, 145);
    tft.print(chargeCurrent > 0 ? "State: Charging" : "State: Full");
  } else {
    tft.setTextSize(2);
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.setCursor(20, 85);
    tft.print("NO PEN");
    tft.setTextSize(1);
    tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
    tft.setCursor(20, 120);
    tft.print("Insert device to");
    tft.setCursor(20, 135);
    tft.print("initiate docking");
  }

  // Draw Right Card: Data & Sync Status
  tft.drawRoundRect(170, 40, 140, 135, 8, TFT_DARKGREY);
  tft.fillRect(171, 41, 138, 133, TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(180, 50);
  tft.print("DATA ARCHIVE");

  if (currentState == STATE_SYNCING) {
    tft.setTextSize(1);
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);
    tft.setCursor(180, 75);
    tft.print("UPLOADING FILES");
    
    tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
    tft.setCursor(180, 95);
    tft.print(currentSyncFile);

    // Custom Progress Bar
    tft.drawRect(180, 120, 120, 12, TFT_WHITE);
    tft.fillRect(181, 121, (syncProgress * 118) / 100, 10, TFT_GREEN);
    
    tft.setCursor(180, 140);
    tft.print("Progress: ");
    tft.print(syncProgress);
    tft.print("%");
  } else if (currentState == STATE_SYNC_COMPLETE) {
    tft.setTextSize(2);
    tft.setTextColor(TFT_GREEN, TFT_BLACK);
    tft.setCursor(180, 80);
    tft.print("SYNC OK");
    tft.setTextSize(1);
    tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
    tft.setCursor(180, 115);
    tft.print("All files backed up");
    tft.setCursor(180, 130);
    tft.print("to Google Drive");
  } else if (currentState == STATE_CONNECTED) {
    tft.setTextSize(2);
    tft.setTextColor(TFT_BLUE, TFT_BLACK);
    tft.setCursor(180, 80);
    tft.print("READY");
    tft.setTextSize(1);
    tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
    tft.setCursor(180, 115);
    tft.print("Pending updates:");
    tft.setCursor(180, 130);
    tft.print("3 new recordings");
  } else {
    tft.setTextSize(2);
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.setCursor(180, 85);
    tft.print("INACTIVE");
    tft.setTextSize(1);
    tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
    tft.setCursor(180, 120);
    tft.print("Link connection");
    tft.setCursor(180, 135);
    tft.print("is disconnected");
  }
}

void handleTouch() {
  uint16_t x = 0, y = 0;
  
  if (tft.getTouch(&x, &y)) {
    // Debounce touch events
    if (millis() - lastTouchDebounce < 350) return;
    lastTouchDebounce = millis();

    Serial.print("Touch coordinates: X=");
    Serial.print(x);
    Serial.print(" Y=");
    Serial.println(y);

    // Touch boundaries map directly to landscape screen dimensions (320x240)
    // Check Y axis of the bottom buttons (Y: 185 to 230)
    if (y >= 185 && y <= 230) {
      // Button 1: SYNC (X: 10 to 100)
      if (x >= 10 && x <= 100) {
        Serial.println("Sync button pressed");
        if (currentState == STATE_CONNECTED || currentState == STATE_SYNC_COMPLETE) {
          currentState = STATE_SYNCING;
          syncProgress = 0;
          currentSyncFile = "video_04.h264";
        } else if (currentState == STATE_EJECTED || currentState == STATE_DISCONNECTED) {
          currentState = STATE_CONNECTED; // simulate hotplug
          batteryPercent = 78;
          batteryVoltage = 3.92;
          chargeCurrent = 420;
        }
      }
      // Button 2: EJECT (X: 115 to 205)
      else if (x >= 115 && x <= 205) {
        Serial.println("Eject button pressed");
        currentState = STATE_EJECTED;
      }
      // Button 3: LIGHTS (X: 220 to 310)
      else if (x >= 220 && x <= 310) {
        Serial.println("Lights button pressed");
        backlightOn = !backlightOn;
        // Visual indicator feedback: toggle button color state
        if (backlightOn) {
          tft.fillRect(220, 185, 90, 45, TFT_DARKGREEN);
        } else {
          tft.fillRect(220, 185, 90, 45, TFT_DARKGREY);
        }
        tft.drawRect(220, 185, 90, 45, TFT_WHITE);
        tft.setTextColor(TFT_WHITE);
        tft.setTextSize(2);
        tft.setCursor(235, 200);
        tft.print("LIGHTS");
      }
    }
  }
}

void loop() {
  handleTouch();

  // Run simulation updates every 1.5 seconds
  if (millis() - lastUpdate > 1500) {
    lastUpdate = millis();

    if (currentState == STATE_SYNCING) {
      syncProgress += 15;
      if (syncProgress >= 100) {
        syncProgress = 100;
        currentState = STATE_SYNC_COMPLETE;
      }
      
      // Simulate voltage drop during high CPU operation
      batteryVoltage = 3.85;
      chargeCurrent = 580; // drawing more power during sync
    } 
    else if (currentState == STATE_CONNECTED) {
      // Simulate standard trickle charging telemetry
      batteryPercent += 1;
      if (batteryPercent > 100) batteryPercent = 100;
      
      batteryVoltage = 4.15;
      chargeCurrent = 120; // low charging current as battery reaches top capacity
    }

    // Always redraw telemetry changes
    drawTelemetry();
  }

  // Redraw complete telemetry immediately on state change
  if (currentState != previousState) {
    drawTelemetry();
    previousState = currentState;
  }
}
