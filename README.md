# 🎨 Realtime Drawing Canvas

A real-time collaborative drawing application where multiple users can draw together on the same canvas.  
Built using *Node.js, **Express, **Socket.IO*, HTML5 Canvas, and vanilla JavaScript.

---

## 🚀 Setup Instructions

Follow these steps to run the project locally:

### 1. Clone the repository
bash
git clone https://github.com/Rahul07Kumar/realtime-drawing-canvas.git
cd realtime-drawing-canvas


### 2. Install dependencies
bash
npm install


### 3. Start the application
bash
npm start


### 4. Open in browser
Visit:

http://localhost:3000


Your real-time drawing app is now up and running.

---

## 👥 How to Test With Multiple Users

### *Method 1: Multiple Tabs*
1. Start the app
2. Open http://localhost:3000 in *two or more browser tabs*
3. Draw inside any tab — the strokes appear instantly in other tabs

### *Method 2: Multiple Devices*
1. Connect all devices to the same WiFi network  
2. Find your local IP address (e.g., 192.168.1.xx)  
3. Open:
   
   http://<your-local-ip>:3000
   
4. Draw from any device — all drawings sync in real-time

---

## 🐞 Known Limitations / Bugs

- No authentication — anyone can draw
- No rooms — all users share the same canvas
- Canvas is not saved — refreshing clears everything
- No undo/redo functionality
- Overlapping strokes may occur with many users drawing simultaneously
- Touch accuracy may vary on mobile devices
- Performance can degrade with very high user load

---

## ⏱ Time Spent on the Project

*Estimated total time spent: 10–12 hours*

- 3–4 hours — WebSocket setup & server-side events  
- 3 hours — Canvas drawing logic  
- 2 hours — Debugging & multi-user testing  
- 1 hour — UI adjustments  
- 1 hour — Documentation (README)

---

## 📌 Summary

This project demonstrates a simple yet effective real-time collaborative drawing canvas using Socket.IO.  
It sets a good foundation for future improvements including:

- Adding rooms  
- Undo/redo support  
- Additional drawing tools  
- Persistent canvas storage  
- User accounts  
- Better mobile responsiveness

Contributions and enhancements are welcome!

