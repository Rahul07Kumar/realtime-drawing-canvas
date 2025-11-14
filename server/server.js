// Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const roomManager = require('./rooms'); // Handles room and drawing data
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Create a Socket.IO server with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: 'https://realtime-drawing-canvas-p4oh.onrender.com/', // Allow requests only from your frontend
    methods: ['GET', 'POST'],
  },
});

// Enable CORS for Express as well
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST'],
}));

// Serve static frontend files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Default route to load the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Handle Socket.IO connections
io.on('connection', (socket) => {

  // When a user joins a room
  socket.on('join-room', ({ roomName, username }) => {
    // Add the user to the specified room
    socket.join(roomName);
    socket.roomName = roomName;
    socket.username = username;

    // Save the user to the room manager
    roomManager.addUserToRoom(roomName, socket.id, username);

    // Send existing drawing data (strokes) to the new user
    const existingStrokes = roomManager.getStrokes(roomName);
    socket.emit('load-strokes', existingStrokes);

    // Notify everyone in the room about the updated user list
    const users = roomManager.getRoomUsers(roomName);
    io.to(roomName).emit('users-update', users);

    // Inform other users that a new user joined
    socket.to(roomName).emit('user-joined', {
      id: socket.id,
      username: username
    });
  });

  // When a user draws on the canvas
  socket.on('draw', (strokeData) => {
    if (socket.roomName) {
      const stroke = roomManager.addStroke(socket.roomName, strokeData);
      // Broadcast the stroke to other users in the room
      socket.to(socket.roomName).emit('draw', stroke);
    }
  });

  // When a user moves their cursor (for live cursor tracking)
  socket.on('cursor-move', (cursorData) => {
    if (socket.roomName) {
      roomManager.updateUserCursor(socket.roomName, socket.id, cursorData);
      // Share the cursor position with other users in the same room
      socket.to(socket.roomName).emit('cursor-update', {
        userId: socket.id,
        username: socket.username,
        cursor: cursorData
      });
    }
  });

  // Handle undo operation (remove last stroke)
  socket.on('undo', () => {
    if (socket.roomName) {
      const removed = roomManager.undo(socket.roomName);
      if (removed) {
        // Notify all users to remove the same stroke
        io.to(socket.roomName).emit('undo', removed.id);
      }
    }
  });

  // Handle redo operation (reapply the last undone stroke)
  socket.on('redo', () => {
    if (socket.roomName) {
      const stroke = roomManager.redo(socket.roomName);
      if (stroke) {
        io.to(socket.roomName).emit('redo', stroke);
      }
    }
  });

  // Handle canvas clear event (clear for all users)
  socket.on('clear-canvas', () => {
    if (socket.roomName) {
      const room = roomManager.getRoom(socket.roomName);
      if (room) {
        room.drawingState.clear();
        room.redoStack = [];
        io.to(socket.roomName).emit('clear-canvas');
      }
    }
  });

  // When a user disconnects (closes tab or leaves)
  socket.on('disconnect', () => {
    if (socket.roomName) {
      // Remove user from room tracking
      roomManager.removeUserFromRoom(socket.roomName, socket.id);

      // Update remaining users in the room
      const users = roomManager.getRoomUsers(socket.roomName);
      io.to(socket.roomName).emit('users-update', users);

      // Notify others that the user left
      socket.to(socket.roomName).emit('user-left', {
        id: socket.id,
        username: socket.username
      });
    }
  });
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  // Server successfully started
});
