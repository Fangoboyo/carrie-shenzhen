# Carrie 🥕

An embedded audio-recording smart pen sharped like a carrot, featuring a custom pot docking station for charging and data transfer. Powered by the Luckfox Pico Mini B. 

## Project Overview

A personal carry device in the shape of a carrot, Carrie is an interpretation of the carrot pen used by Judy Hopps in Zootopia. It's built with a microphone and a camera, stuck into the tiny form factor of a pen, powered by an embedded Linux microcontroller on a PCB. With the click of a button, Carrie records 1030p footage at 30 FPS with audio, making sure you never forget to record those memorable moments. Then, just simply take off the cap and plug it into the pot, where you can transfer your video to your computer and also charge Carrie.  

## Why?

All 4 of the team members of this project are High School seniors. At the end of the year, many of the people who we have spent a majority of our lives with will be leaving to colleges across the world. It's easy to say that you'll keep in touch and commit to sending pictures and videos often of what you do everyday, but it's often a promise that is neglected not from a lack of care, but from the nature of experiencing an event; your first thought isn't always to start recording. With a personal carry device in such a form factor, Carrie serves as an always present, physical reminder of that promise. In this way, it helps old friends reconnect and stay connected. 

## Software
### Pen Firmware
With the hardware restrictions we put ourselves under, being a camera that could record video in 1080p 30fps, it would be extremely difficult to find a microcontroller that had those capabilities while fitting those size restrictions. After a ton of research, we landed on the RV1103 Pico Mini B, an embeded linux development board that ran buildroot linux, capable encoding h.264 at 1080p30fps. However, this choice came with it's own issues, so the firmware for the carrot's microcontroller was absurdly complex to engineer, and I had to spend a lot of time reading docs and (admittedly) using AI to summarize and research documentation. This all culminates in our [Software](software) folder, which builds to buildroot linux through a docker dev container and pushes code through an ADB bridge.

### Pot Firmware
Comparatively, our pot firmware for the ESP8266 in our [Display](display/displaydriver) folder was incredibly easy, being a very documented and easy to interact with.


### **WEBSITE**
My (Esean) **pride and joy** of this project, the website that could display the results of our carrot pen while taking a USB payload from the pot/holster, the [platform](platform) folder hosts the website that displays the uploaded videos in a "scrapbook" ish feel while keeping a clean and modern UI mentality. <img width="2284" height="1488" alt="image" src="https://github.com/user-attachments/assets/b4aa056f-c928-4af2-94ae-6bbb59a2d7f5" />

## Hardware Architecture - Carrot
### **Main Compute Module:** Embedded Luckfox Pico Mini B 

| Luckfox Pico Mini B (2D) | Luckfox Pico Mini B (3D) |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d243de09-778c-4d48-a652-383df001b6e8" alt="luckfox_2d" width="100%" /> | <img src="https://github.com/user-attachments/assets/f13b5a4d-605d-4a7c-87a0-da64d2e103ab" alt="luckfox_3d" width="100%" /> |


### **Input:** Audio & Video
| Microphone | CSI Camera |
| :---: | :---: |
| <img width="95%" alt="image" src="https://github.com/user-attachments/assets/de1b7129-3cad-43c9-9911-14325515e6ea" /> | <img width="597" height="666" alt="image" src="https://github.com/user-attachments/assets/9b011255-0841-4a2e-993e-1930c3bdcae8" /> |

Camera and Microphone to capture data.

### **Power Management:** MCP73831T-2A
| Controller | 2d | 3D |
| :---: | :---: | :---: |
| <img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/b539b5b1-740c-4f56-924c-8e0773f1a657" /> | <img width="1125" height="730" alt="image" src="https://github.com/user-attachments/assets/92c5daeb-05d5-4548-9375-149a480fa49f" /> | <img width="600" height="800" alt="image" src="https://github.com/user-attachments/assets/c2de3cf3-b8d9-475a-b32b-ba6da2ebc751" /> |

Power and Charging managment are managed by this module, which regulates power intake towards the battery and available power in the battery to dicate graceful shutdown in the main controller before full power drainage.

## THE SHELL
| Camera side | Button Side |
| :---: | :---: |
| <img width="387" height="880" alt="image" src="https://github.com/user-attachments/assets/1cbd6b13-2270-45ba-86aa-7f3c9cf20da6" /> | <img width="444" height="867" alt="image" src="https://github.com/user-attachments/assets/46324079-04cb-4bb5-9fd8-ac82943a969b" /> |

One hole on the outside for the camera, one hole for the button

## Internals
| Internals Overview |
| :---: |
| <img width="1786" height="448" alt="image" src="https://github.com/user-attachments/assets/23a48f19-ead9-4086-9ade-45f46cb0b856" /> |
<img width="1653" height="444" alt="image" src="https://github.com/user-attachments/assets/95493cf9-3da8-402e-b2b9-8857416245db" /> |

The internals of the pen are specifically designed to be percisely capable of encapsulating the components with little wiggle room, so chances for wear and tear are diminished.



### **Status Indicator:** SunLED XZVGMDK53W-9
  <img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/75f52bc2-a386-4882-b86c-cb7c24f693c7" />

## Hardware Architecture pt. 2 - Pot
### **Embedded ESP8266 board**
| 3D Model | 2D Design |
| :---: | :---: |
| <img width="1234" height="915" alt="image" src="https://github.com/user-attachments/assets/c73300b8-7550-4fc7-a2e0-ddb6dc06ee2d" /> | <img width="1165" height="915" alt="esp8266_2nd" src="https://github.com/user-attachments/assets/1359f316-cbce-4f08-98aa-600b92aa06ad" /> |

Our PCB design embeds the ESP8266, exposes the necessary display pins, and integrates our power + data intake system. The pot which the controller resides in is designed to transfer data and power directly to and from the computer through a Y Junction, with the ESP8266 board only driving the display that oversees this data transfer.

## Pot
|  | Securing methods |  |
| :---: | :---: | :---: |
| <img width="1297" height="1035" alt="image" src="https://github.com/user-attachments/assets/64c82243-952b-4a4d-91f8-f722bb6a5b0e" /> | <img width="1246" height="1030" alt="image" src="https://github.com/user-attachments/assets/eeb18692-9e09-46c7-9a2a-906713e46083" /> | <img width="1273" height="802" alt="image" src="https://github.com/user-attachments/assets/9dc6b3f8-41db-439f-a548-f6f2b98c5625" /> |
<img width="1234" height="850" alt="image" src="https://github.com/user-attachments/assets/3b999cf2-482d-47e5-97e3-fa82ae836115" /> | <img width="1384" height="975" alt="image" src="https://github.com/user-attachments/assets/ad0fa894-6ced-4f59-ba31-448e94670393" /> | <img width="1051" height="709" alt="image" src="https://github.com/user-attachments/assets/0e970476-848a-4e4c-a938-803878373a72" /> | <img width="741" height="595" alt="image" src="https://github.com/user-attachments/assets/b03cd717-ace1-481b-a3e5-d171902490df" /> | 

The pot secures and holds both the carrot and the microcontroller, facilitating data transfer through our POGO pin system.

## POGO pins for data transfer
4 pin magnetic contact ports that allow for charging and data transfer through 5V, GND, D+/- Pins.
<img width="751" height="695" alt="image" src="https://github.com/user-attachments/assets/b3b1ca1b-d923-4061-82ba-9893d12ce9ae" />



### **Display:** ILI9341 
<img width="80%" alt="image" src="https://github.com/user-attachments/assets/f399143a-ea69-4029-b35b-0bed4a2ec6be" />
