# Carrie 🥕

An embedded audio-recording smart pen sharped like a carrot, featuring a custom pot docking station for charging and data transfer. Powered by the Luckfox Pico Mini B. 

## Project Overview

A personal carry device in the shape of a carrot, Carrie is an interpretation of the carrot pen used by Judy Hopps in Zootopia. It's built with a microphone and a camera, stuck into the tiny form factor of a pen, powered by an embedded Linux microcontroller on a PCB. With the click of a button, Carrie records 1030p footage at 30 FPS with audio, making sure you never forget to record those memorable moments. Then, just simply take off the cap and plug it into the pot, where you can transfer your video to your computer and also charge Carrie.  

## Why?

All 4 of the team members of this project are High School seniors. At the end of the year, many of the people who we have spent a majority of our lives with will be leaving to colleges across the world. It's easy to say that you'll keep in touch and commit to sending pictures and videos often of what you do everyday, but it's often a promise that is neglected not from a lack of care, but from the nature of experiencing an event; your first thought isn't always to start recording. With a personal carry device in such a form factor, Carrie serves as an always present, physical reminder of that promise. In this way, it helps old friends reconnect and stay connected. 


## Hardware Architecture - Carrot
### **Main Compute Module:** Embedded Luckfox Pico Mini B 

| Luckfox Pico Mini B (2D) | Luckfox Pico Mini B (3D) |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d243de09-778c-4d48-a652-383df001b6e8" alt="luckfox_2d" width="100%" /> | <img src="https://github.com/user-attachments/assets/f13b5a4d-605d-4a7c-87a0-da64d2e103ab" alt="luckfox_3d" width="100%" /> |


### **Audio Input:** SPH0655

<img width="766" height="708" alt="image" src="https://github.com/user-attachments/assets/de1b7129-3cad-43c9-9911-14325515e6ea" />


* **Visual Input:** SC3336 3MP
* **Status Indicator:** SunLED XZVGMDK53W-9
* **Power Management:** MCP73831T-2A
* **Display:** ILI9341 

## Hardware Architecture pt. 2 - Pot
* **ESP8266 board**

<p align="center">
  <img src="https://github.com/user-attachments/assets/a6e20dd5-2655-4d6c-89ee-21d4f95131a6" alt="ESP8266 Board schematic" width="80%" />
</p>


## Project Status

- [x] Initial hardware schematic
- [x] PCB
- [x] CAD
