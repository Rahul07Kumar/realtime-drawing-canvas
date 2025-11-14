// Class to manage all WebSocket (Socket.IO) interactions
export class WebSocketManager {
  constructor() {
    // Connect to the backend Socket.IO server
    this.socket = io("https://realtime-drawing-canvas-backend-k4x8.onrender.com"); // change port if your backend uses a different one

    this.isConnected = false; // Track connection status
    this.handlers = {};       // Store event handlers for easy reference
  }

  // Join a room with a username
  connect(roomName, username) {
    return new Promise((resolve) => {
      this.socket.emit('join-room', { roomName, username });
      this.isConnected = true;
      resolve();
    });
  }

  // Generic method to attach event handlers
  on(event, handler) {
    this.handlers[event] = handler;
    this.socket.on(event, handler);
  }

  // Generic method to emit events to the server
  emit(event, data) {
    if (this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // --- Methods to send events to the server ---

  sendDrawing(strokeData) {
    this.emit('draw', strokeData);
  }

  sendCursorMove(cursorData) {
    this.emit('cursor-move', cursorData);
  }

  sendUndo() {
    this.emit('undo');
  }

  sendRedo() {
    this.emit('redo');
  }

  sendClear() {
    this.emit('clear-canvas');
  }

  // --- Methods to register handlers for incoming events ---

  onDraw(handler) {
    this.on('draw', handler);
  }

  onLoadStrokes(handler) {
    this.on('load-strokes', handler);
  }

  onUsersUpdate(handler) {
    this.on('users-update', handler);
  }

  onCursorUpdate(handler) {
    this.on('cursor-update', handler);
  }

  onUndo(handler) {
    this.on('undo', handler);
  }

  onRedo(handler) {
    this.on('redo', handler);
  }

  onClearCanvas(handler) {
    this.on('clear-canvas', handler);
  }

  onUserJoined(handler) {
    this.on('user-joined', handler);
  }

  onUserLeft(handler) {
    this.on('user-left', handler);
  }

  // Disconnect from the server
  disconnect() {
    this.isConnected = false;
    this.socket.disconnect();
  }
}
