// Import the DrawingState class which manages the list of strokes (drawn paths)
const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() {
    // Map to store all active rooms
    // Each room is identified by its name and holds its users and drawing state
    this.rooms = new Map();
  }

  // Creates a new room if it doesn’t exist already
  createRoom(roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, {
        users: new Map(),           // Stores connected users in the room
        drawingState: new DrawingState(), // Keeps track of strokes on the canvas
        redoStack: []               // Used for managing redo operations
      });
    }
    return this.rooms.get(roomName);
  }

  // Returns a specific room object
  getRoom(roomName) {
    return this.rooms.get(roomName);
  }

  // Adds a new user to a room (creates the room if it doesn’t exist)
  addUserToRoom(roomName, socketId, username) {
    const room = this.createRoom(roomName);
    room.users.set(socketId, {
      id: socketId,
      username: username,
      cursor: { x: 0, y: 0 } // Initial cursor position
    });
    return room;
  }

  // Removes a user from a room
  // If the room becomes empty, delete it completely
  removeUserFromRoom(roomName, socketId) {
    const room = this.rooms.get(roomName);
    if (room) {
      room.users.delete(socketId);
      if (room.users.size === 0) {
        this.rooms.delete(roomName);
      }
    }
  }

  // Returns an array of all users currently in the given room
  getRoomUsers(roomName) {
    const room = this.rooms.get(roomName);
    if (room) {
      return Array.from(room.users.values());
    }
    return [];
  }

  // Updates the cursor position of a user (for live pointer tracking)
  updateUserCursor(roomName, socketId, cursor) {
    const room = this.rooms.get(roomName);
    if (room && room.users.has(socketId)) {
      room.users.get(socketId).cursor = cursor;
    }
  }

  // Adds a new stroke (drawing line) to the room’s drawing state
  // Clears redo history since a new stroke was drawn
  addStroke(roomName, stroke) {
    const room = this.rooms.get(roomName);
    if (room) {
      room.redoStack = [];
      return room.drawingState.addStroke(stroke);
    }
    return null;
  }

  // Retrieves all strokes currently drawn in the room
  getStrokes(roomName) {
    const room = this.rooms.get(roomName);
    return room ? room.drawingState.getStrokes() : [];
  }

  // Removes the most recent stroke (undo)
  // The removed stroke is saved in redoStack for potential reapplication
  undo(roomName) {
    const room = this.rooms.get(roomName);
    if (room) {
      const removed = room.drawingState.undo();
      if (removed) {
        room.redoStack.push(removed);
      }
      return removed;
    }
    return null;
  }

  // Reapplies the most recently undone stroke (redo)
  redo(roomName) {
    const room = this.rooms.get(roomName);
    if (room && room.redoStack.length > 0) {
      const stroke = room.redoStack.pop();
      room.drawingState.addStroke(stroke);
      return stroke;
    }
    return null;
  }
}

// Export a single instance of RoomManager for use across the server
module.exports = new RoomManager();
