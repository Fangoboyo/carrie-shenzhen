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


### **Input:** Audio & Video
| Microphone | CSI Camera |
| :---: | :---: |
| <img width="95%" alt="image" src="https://github.com/user-attachments/assets/de1b7129-3cad-43c9-9911-14325515e6ea" /> | <img width="597" height="666" alt="image" src="https://github.com/user-attachments/assets/9b011255-0841-4a2e-993e-1930c3bdcae8" /> |

### **Power Management:** MCP73831T-2A
| Controller | 2d | 3D |
| :---: | :---: | :---: |
| <img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/b539b5b1-740c-4f56-924c-8e0773f1a657" /> | <img width="1125" height="730" alt="image" src="https://github.com/user-attachments/assets/92c5daeb-05d5-4548-9375-149a480fa49f" /> | <img width="600" height="800" alt="image" src="https://github.com/user-attachments/assets/c2de3cf3-b8d9-475a-b32b-ba6da2ebc751" /> |

## THE SHELL
| Camera side | Button Side |
| :---: | :---: |
| <img width="387" height="880" alt="image" src="https://github.com/user-attachments/assets/1cbd6b13-2270-45ba-86aa-7f3c9cf20da6" /> | <img width="444" height="867" alt="image" src="https://github.com/user-attachments/assets/46324079-04cb-4bb5-9fd8-ac82943a969b" /> |

| Internals Overview |
| :---: |
| <img width="1786" height="448" alt="image" src="https://github.com/user-attachments/assets/23a48f19-ead9-4086-9ade-45f46cb0b856" /> |
<img width="1653" height="444" alt="image" src="https://github.com/user-attachments/assets/95493cf9-3da8-402e-b2b9-8857416245db" /> |

|  | Securing methods |  |
| :---: | :---: | :---: |
| <img width="1297" height="1035" alt="image" src="https://github.com/user-attachments/assets/64c82243-952b-4a4d-91f8-f722bb6a5b0e" /> | <img width="1246" height="1030" alt="image" src="https://github.com/user-attachments/assets/eeb18692-9e09-46c7-9a2a-906713e46083" /> | <img width="1273" height="802" alt="image" src="https://github.com/user-attachments/assets/9dc6b3f8-41db-439f-a548-f6f2b98c5625" /> |
<img width="1234" height="850" alt="image" src="https://github.com/user-attachments/assets/3b999cf2-482d-47e5-97e3-fa82ae836115" /> | <img width="1384" height="975" alt="image" src="https://github.com/user-attachments/assets/ad0fa894-6ced-4f59-ba31-448e94670393" /> | <img width="1051" height="709" alt="image" src="https://github.com/user-attachments/assets/0e970476-848a-4e4c-a938-803878373a72" /> | <img width="741" height="595" alt="image" src="https://github.com/user-attachments/assets/b03cd717-ace1-481b-a3e5-d171902490df" /> | 

### **Status Indicator:** SunLED XZVGMDK53W-9
  <img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/75f52bc2-a386-4882-b86c-cb7c24f693c7" />

## Hardware Architecture pt. 2 - Pot
### **Embedded ESP8266 board**
| 3D Model | 2D Design |
| :---: | :---: |
| <img width="1234" height="915" alt="image" src="https://github.com/user-attachments/assets/c73300b8-7550-4fc7-a2e0-ddb6dc06ee2d" /> | <img width="1165" height="915" alt="esp8266_2nd" src="https://github.com/user-attachments/assets/1359f316-cbce-4f08-98aa-600b92aa06ad" /> |

### **Display:** ILI9341 
<img width="80%" alt="image" src="https://github.com/user-attachments/assets/f399143a-ea69-4029-b35b-0bed4a2ec6be" />
