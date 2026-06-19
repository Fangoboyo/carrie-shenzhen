# Carrie 🥕 — Embedded Audio/Video Recording Smart Pen

An embedded audio-recording smart pen shaped like a carrot, featuring a custom pot docking station for charging and data transfer. Powered by the Luckfox Pico Mini B (RV1103).

---

## Project Overview

A personal carry device in the shape of a carrot, Carrie is an interpretation of the carrot pen used by Judy Hopps in Zootopia. It's built with a microphone and a camera, integrated into the tiny form factor of a pen, and powered by an embedded Linux microcontroller (Luckfox Pico Mini B) on a custom PCB. With the click of a button, Carrie records 1080p footage at 30 FPS with audio. Then, simply take off the cap and plug the pen into the pot docking station to transfer your video files to a host computer and charge Carrie's battery.

### Web Platform Dashboard
The frontend dashboard is built with React, presenting recorded videos in a responsive, modern "scrapbook" layout. A PocketBase backend running on Bun handles session data and pipes incoming video streams directly to the Google Drive API.

<img width="800" style="max-width: 100%; height: auto;" alt="Web Platform Dashboard Mockup" src="https://github.com/user-attachments/assets/b4aa056f-c928-4af2-94ae-6bbb59a2d7f5" />

*Figure 1: React-based web dashboard displaying scrapbook video feeds synced from the carrot pen.*

---

## Directory Structure

The repository is organized into a clean, modular structure:

```
├── docs/                           # Project documentation, Zines, and planning
│   ├── planning/                   # Vault planning notes and Technical Canvas
│   │   ├── notes/                  # Detailed engineering notes (display, GPIO, recording, etc.)
│   │   └── technical_overview.canvas # Visual concept overview
│   ├── bill_of_materials.csv       # Master Bill of Materials (BOM) with links & costs
│   └── zine.pdf                    # Creative project documentation
├── hardware/                       # Mechanical and Electrical designs
│   ├── cad/                        # Fusion 360 & STEP models
│   │   ├── individual_parts/       # Separate CAD files for components
│   │   └── README.md               # CAD specific notes & instructions
│   └── pcb/                        # KiCad PCB designs
│       ├── battery_charger/        # Carrot power regulation and battery charger PCB
│       ├── carry/                  # Main controller and breakout board PCB
│       ├── dirt/                   # Pot wiring junction PCB (V1)
│       └── dirt2/                  # Pot wiring junction PCB (V2)
├── firmware/                       # Source code for microcontrollers
│   ├── carrot/                     # RV1103 C code (Camera, Audio, and GPIO controls)
│   └── pot/                        # ESP8266 display driver code (.ino)
├── materials/                      # Detailed component datasheet notes & summaries
│   ├── bms/                        # Battery Management System notes (MCP73831, DW01A, etc.)
│   ├── images/                     # Component reference photos
│   └── *.md                        # Individual parts summaries (LCD, Microphone, Pogo, etc.)
└── platform/                       # React frontend & PocketBase/Bun backend dashboard
```

---

## Step-by-Step Build & Replication Guide

Follow this guide to replicate both the carrot pen (Carrie) and the docking station (Pot).

---

### 1. Bill of Materials (BOM)
Refer to the detailed master [Bill of Materials](docs/bill_of_materials.csv) for pricing, sourcing links, and specifications.

*   **Compute (Pen):** [Luckfox Pico Mini B (RV1103)](materials/esp32.md) - Linux SBC
*   **Sensor (Pen):** [SC3336 3MP Camera Module](materials/lcd_display.md) (CSI interface)
*   **Audio (Pen):** [SPH0655 Digital MEMS Microphone](materials/microphone.md)
*   **Battery (Pen):** 3.7V 800mAh Li-ion battery (size 14500 cell)
*   **Power (Pen):** Custom charger PCB with [MCP73831T-2A Charger IC](materials/bms/mcp73831.md)
*   **Indicator (Pen):** SunLED XZVGMDK53W-9 (bi-color Red/Green SMD LED)
*   **Compute (Pot):** [ESP8266 Dev Board](materials/esp32.md) (Wemos D1 Mini or similar)
*   **Display (Pot):** [ILI9341 320x240 SPI Touchscreen Display](materials/lcd_display.md)
*   **Docking Junction:** 4-pin Magnetic Contact POGO pins (5V, GND, D+, D-)
*   **Enclosure:** Orange/Green PLA filament, PLA glue.

---

### 2. Schematics & Electrical Design
The electrical system is divided between the Pen and the Pot. Schematics can be reviewed inside the [KiCad PCB Projects](hardware/pcb/).

#### A. The Pen (Carrie)
The pen uses two PCBs:
1.  **Main Board (`hardware/pcb/carry/`):** Hosts the Luckfox Pico Mini B. Routes the camera CSI ribbon, digital MEMS microphone (SPH0655), recording button, and status indicator LEDs.
2.  **Battery Charger Board (`hardware/pcb/battery_charger/`):** Features the [MCP73831T](materials/bms/mcp73831.md) charge controller, protection circuit (DW01A + FS8205A), and matches the bottom shape of the pen where the 4 magnetic contact pads reside.

##### Main Compute Module: Embedded Luckfox Pico Mini B

| Luckfox Pico Mini B (2D Layout) | Luckfox Pico Mini B (3D Render) |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d243de09-778c-4d48-a652-383df001b6e8" alt="luckfox_2d" width="300" style="max-width:100%;" /> | <img src="https://github.com/user-attachments/assets/f13b5a4d-605d-4a7c-87a0-da64d2e103ab" alt="luckfox_3d" width="300" style="max-width:100%;" /> |

*Figure 2: The RV1103-based Luckfox Pico Mini B development board used as the central Linux-based camera controller.*

##### Input: Audio & Video

| Microphone Breakout | CSI Camera Module |
| :---: | :---: |
| <img alt="Microphone Pinout" src="https://github.com/user-attachments/assets/de1b7129-3cad-43c9-9911-14325515e6ea" width="280" style="max-width:100%;" /> | <img alt="SC3336 CSI Camera" src="https://github.com/user-attachments/assets/9b011255-0841-4a2e-993e-1930c3bdcae8" width="280" style="max-width:100%;" /> |

*Figure 3: Layouts for the digital SPH0655 MEMS Microphone and the SC3336 3MP CSI camera module.*

##### Power Management: MCP73831T-2A

| Charge Controller Chip | 2D Layout Routing | 3D Board Design |
| :---: | :---: | :---: |
| <img alt="MCP73831 Chip" src="https://github.com/user-attachments/assets/b539b5b1-740c-4f56-924c-8e0773f1a657" width="180" style="max-width:100%;" /> | <img alt="PCB 2D Layout" src="https://github.com/user-attachments/assets/92c5daeb-05d5-4548-9375-149a480fa49f" width="280" style="max-width:100%;" /> | <img alt="PCB 3D Design" src="https://github.com/user-attachments/assets/c2de3cf3-b8d9-475a-b32b-ba6da2ebc751" width="220" style="max-width:100%;" /> |

*Figure 4: The custom power board containing the MCP73831 charge management IC and protection circuits to safely regulate the 14500 Li-ion battery.*

##### Status Indicator: SunLED XZVGMDK53W-9
<img alt="XZVGMDK53W-9 SMD LED" src="https://github.com/user-attachments/assets/75f52bc2-a386-4882-b86c-cb7c24f693c7" width="180" style="max-width:100%;" />

*Figure 5: Bi-color (Red/Green) SMD status indicator LED for tracking recording states.*

---

#### B. The Pot (Docking Station)
The pot PCB (`hardware/pcb/dirt2/`) aggregates connections for the ESP8266 Dev Board, ILI9341 SPI Display, and a Y-Junction cable to split power and USB data signals.

##### Embedded ESP8266 Board

| 3D Model | 2D Design |
| :---: | :---: |
| <img alt="ESP8266 3D Model" src="https://github.com/user-attachments/assets/c73300b8-7550-4fc7-a2e0-ddb6dc06ee2d" width="300" style="max-width:100%;" /> | <img alt="ESP8266 2D Design" src="https://github.com/user-attachments/assets/1359f316-cbce-4f08-98aa-600b92aa06ad" width="300" style="max-width:100%;" /> |

*Figure 6: Custom PCB interface housing the ESP8266, routing signals to the LCD and decoupling incoming USB lines.*

##### Display: ILI9341
<img alt="ILI9341 SPI TFT Module" src="https://github.com/user-attachments/assets/f399143a-ea69-4029-b35b-0bed4a2ec6be" width="350" style="max-width:100%;" />

*Figure 7: SPI Serial TFT display used to display system telemetry and connection feedback.*

---

### 3. CAD & Mechanical Assembly
All model assets are stored in [hardware/cad/](hardware/cad/).

#### The Shell

| Camera Side Cutout | Button Side Cutout |
| :---: | :---: |
| <img alt="Camera Front Face" src="https://github.com/user-attachments/assets/1cbd6b13-2270-45ba-86aa-7f3c9cf20da6" width="220" style="max-width:100%;" /> | <img alt="Button Rear Face" src="https://github.com/user-attachments/assets/46324079-04cb-4bb5-9fd8-ac82943a969b" width="220" style="max-width:100%;" /> |

*Figure 8: Outer mechanical CAD model of the carrot-shaped casing showing camera aperture and button positioning.*

#### Internals

<img alt="Internal Placement Top" src="https://github.com/user-attachments/assets/23a48f19-ead9-4086-9ade-45f46cb0b856" width="650" style="max-width:100%;" />

<img alt="Internal Placement Isometric" src="https://github.com/user-attachments/assets/95493cf9-3da8-402e-b2b9-8857416245db" width="650" style="max-width:100%;" />

*Figure 9: Exploded and internal CAD views highlighting the structural ribs, battery clip, and PCB slots inside the carrot pen.*

#### Flowerpot Dock

| Isometric View | Front Cutaway | Back Enclosure |
| :---: | :---: | :---: |
| <img alt="Pot Iso" src="https://github.com/user-attachments/assets/64c82243-952b-4a4d-91f8-f722bb6a5b0e" width="220" style="max-width:100%;" /> | <img alt="Pot Cutaway" src="https://github.com/user-attachments/assets/eeb18692-9e09-46c7-9a2a-906713e46083" width="220" style="max-width:100%;" /> | <img alt="Pot Back" src="https://github.com/user-attachments/assets/9dc6b3f8-41db-439f-a548-f6f2b98c5625" width="220" style="max-width:100%;" /> |

| Display Bezel Fitting | Base Enclosure Layout | Underneath Routing |
| :---: | :---: | :---: |
| <img alt="Pot Display Bezel" src="https://github.com/user-attachments/assets/3b999cf2-482d-47e5-97e3-fa82ae836115" width="220" style="max-width:100%;" /> | <img alt="Pot Inner Board" src="https://github.com/user-attachments/assets/ad0fa894-6ced-4f59-ba31-448e94670393" width="220" style="max-width:100%;" /> | <img alt="Pot Routing" src="https://github.com/user-attachments/assets/0e970476-848a-4e4c-a938-803878373a72" width="220" style="max-width:100%;" /> |

| Receptacle Neck Alignment | | |
| :---: | :---: | :---: |
| <img alt="Pot Interface" src="https://github.com/user-attachments/assets/b03cd717-ace1-481b-a3e5-d171902490df" width="220" style="max-width:100%;" /> | | |

*Figure 10: Assembly CAD breakdowns of the flowerpot dock housing the display, wiring channels, and internal board mounts.*

#### POGO Pins for Data Transfer
We use a magnetic, spring-loaded POGO pin port at the bottom interface of the carrot and inside the pot neck to route data and charge signals.

<img alt="POGO Pin Configuration" src="https://github.com/user-attachments/assets/b3b1ca1b-d923-4061-82ba-9893d12ce9ae" width="400" style="max-width:100%;" />

*Figure 11: The 4-pin magnetic layout routing 5V, GND, D+, and D- for toolless charging and storage connection.*

---

### 4. Firmware Build & Flashing Guide

#### A. Pen Firmware (RV1103)
The pen runs Buildroot Linux. Its C firmware is compiled inside a Docker Dev Container to manage target environment dependencies.

1.  **Launch Container:**
    Open the [firmware/carrot/](firmware/carrot/) directory in VS Code. It will prompt you to reopen in the dev container. Under the hood, this loads the `Dockerfile` from [firmware/carrot/.devcontainer/Dockerfile](firmware/carrot/.devcontainer/Dockerfile) which installs the cross-compiler toolchain `arm-rockchip830-linux-uclibcgnueabihf` and Rockchip Media Process Interface (RKMPI) headers.
2.  **Build Code:**
    Run the compile script:
    ```bash
    ./build.sh main
    ```
    This script cross-compiles:
    *   `main.c` (Core thread controller)
    *   `gpio/gpio.c` (Button interrupt and state control)
    *   `recorder/camera_recorder.c` (Uses RKMPI to fetch H.264 video streams from hardware framebuffers)
3.  **Deployment via ADB:**
    The script automatically runs `adb push` over the USB bridge to load the executable into the Luckfox:
    ```bash
    # Pushes binary and marks executable
    adb push main /root/
    adb shell "chmod +x /root/main"
    ```
    To test instantly, run:
    ```bash
    adb shell /root/main
    ```

#### B. Pot Display Firmware (ESP8266)
1.  Open the [firmware/pot/](firmware/pot/) folder in Arduino IDE.
2.  Install the **TFT_eSPI** library through the Library Manager.
3.  Copy/configure the correct pin assignments (CS, DC, RST, LED) in the `User_Setup.h` file located inside the `TFT_eSPI` library folder directory to match the ESP8266 pinout.
4.  Build and upload [displaydriver.ino](firmware/pot/displaydriver.ino) to your ESP8266 over serial USB.

---

### 5. Testing & Verification

1.  **Hardware Self-Test:** Connect the carrot pen to your PC. A solid green light indicates full charge; red/orange indicates active charging.
2.  **GPIO Check:** Run the compiled binary [gpio_input](firmware/carrot/gpio/gpio_input.c) to verify button state changes:
    ```bash
    ./build.sh gpio
    ```
3.  **Video Stream Test:** Run the `recorder` profile to verify image sensor capture and H.264 stream writing:
    ```bash
    ./build.sh recorder
    # Run on board: adb shell /root/camera_recorder_demo
    ```
4.  **Full Loop Recording:** Tap the physical button on the carrot casing. The indicator LED flashes to signal recording. Push the button again to stop.
5.  **Docking & Transfer:** Dock the pen in the Pot. The LCD screen should light up, showing connection telemetry. The PC will recognize a USB mass storage device or an ADB network interface. 
6.  **Web Dashboard Sync:** Start the React platform. Use the dashboard to fetch files from the docked pen and stream them directly onto Google Drive.

For more details on the design, code operations, and custom hardware modules, see the docs folder.
