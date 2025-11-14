import { CanvasManager } from './canvas.js';
import { WebSocketManager } from './websocket.js';

// Main class to handle the drawing application
class DrawingApp {
  constructor() {
    this.canvas = null;           // Canvas manager instance
    this.websocket = null;        // WebSocket manager instance
    this.cursors = new Map();     // Track cursors of other users
    this.throttleTimeout = null;  // Throttle for cursor updates
    this.roomName = '';           // Current room name
    this.username = '';           // Current user's name

    // Show the join room screen initially
    this.initJoinScreen();
  }

  // Initialize the join screen where user enters username and room
  initJoinScreen() {
    const joinButton = document.getElementById('join-button');
    const usernameInput = document.getElementById('username-input');
    const roomInput = document.getElementById('room-input');

    const handleJoin = () => {
      const username = usernameInput.value.trim();
      const roomName = roomInput.value.trim();

      if (username && roomName) {
        this.username = username;
        this.roomName = roomName;
        this.joinRoom(roomName, username);
      } else {
        alert('Please enter both username and room name');
      }
    };

    // Trigger join on button click or Enter key
    joinButton.addEventListener('click', handleJoin);
    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleJoin(); });
    roomInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleJoin(); });
  }

  // Join the selected room, initialize canvas and WebSocket
  async joinRoom(roomName, username) {
    // Hide join screen and show main app screen
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    document.getElementById('room-title').textContent = `Room: ${roomName}`;

    // Initialize canvas manager and WebSocket connection
    this.canvas = new CanvasManager(document.getElementById('canvas'));
    this.websocket = new WebSocketManager();
    await this.websocket.connect(roomName, username);

    // Setup UI and event listeners
    this.initToolbar();
    this.initCanvasEvents();
    this.initWebSocketEvents();
  }

  // Initialize toolbar controls for brush, eraser, color, stroke width, undo/redo, and clear
  initToolbar() {
    const brushBtn = document.getElementById('brush-btn');
    const eraserBtn = document.getElementById('eraser-btn');
    const colorPicker = document.getElementById('color-picker');
    const strokeWidth = document.getElementById('stroke-width');
    const strokeWidthLabel = document.getElementById('stroke-width-label');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Brush selection
    brushBtn.addEventListener('click', () => {
      this.canvas.setTool('brush');
      brushBtn.classList.add('active');
      eraserBtn.classList.remove('active');
    });

    // Eraser selection
    eraserBtn.addEventListener('click', () => {
      this.canvas.setTool('eraser');
      eraserBtn.classList.add('active');
      brushBtn.classList.remove('active');
    });

    // Change brush color
    colorPicker.addEventListener('input', (e) => this.canvas.setColor(e.target.value));

    // Change stroke width
    strokeWidth.addEventListener('input', (e) => {
      const width = parseInt(e.target.value);
      this.canvas.setStrokeWidth(width);
      strokeWidthLabel.textContent = `${width}px`;
    });

    // Undo, redo, and clear canvas actions via WebSocket
    undoBtn.addEventListener('click', () => this.websocket.sendUndo());
    redoBtn.addEventListener('click', () => this.websocket.sendRedo());
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear the entire canvas for all users?')) this.websocket.sendClear();
    });
  }

  // Setup drawing events for mouse and touch
  initCanvasEvents() {
    const canvas = this.canvas.canvas;

    const startDrawing = (e) => {
      const coords = this.canvas.getCanvasCoordinates(
        e.clientX || e.touches[0].clientX,
        e.clientY || e.touches[0].clientY
      );
      this.canvas.startDrawing(coords.x, coords.y);
    };

    const draw = (e) => {
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      const coords = this.canvas.getCanvasCoordinates(clientX, clientY);
      this.canvas.draw(coords.x, coords.y);

      // Send cursor position to server (throttled to 50ms)
      if (!this.throttleTimeout) {
        this.throttleTimeout = setTimeout(() => {
          this.websocket.sendCursorMove(coords);
          this.throttleTimeout = null;
        }, 50);
      }
    };

    const stopDrawing = () => {
      const stroke = this.canvas.stopDrawing();
      if (stroke) this.websocket.sendDrawing(stroke);
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
  }

  // Listen to server events via WebSocket
  initWebSocketEvents() {
    this.websocket.onLoadStrokes((strokes) => this.canvas.loadStrokes(strokes));
    this.websocket.onDraw((stroke) => this.canvas.addStroke(stroke));
    this.websocket.onUsersUpdate((users) => this.updateUsersList(users));
    this.websocket.onCursorUpdate(({ userId, username, cursor }) => this.updateCursor(userId, username, cursor));
    this.websocket.onUndo((strokeId) => this.canvas.removeStroke(strokeId));
    this.websocket.onRedo((stroke) => this.canvas.addStroke(stroke));
    this.websocket.onClearCanvas(() => this.canvas.clear());
    this.websocket.onUserJoined(({ username }) => this.showNotification(`${username} joined the room`));
    this.websocket.onUserLeft(({ username }) => this.showNotification(`${username} left the room`));
  }

  // Render the list of users in the sidebar
  updateUsersList(users) {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';

    users.forEach(user => {
      const badge = document.createElement('div');
      badge.className = 'user-badge';
      badge.textContent = user.username;
      usersList.appendChild(badge);
    });
  }

  // Update cursor positions of other users on the canvas
  updateCursor(userId, username, cursor) {
    let cursorElement = this.cursors.get(userId);

    if (!cursorElement) {
      cursorElement = document.createElement('div');
      cursorElement.className = 'cursor';
      cursorElement.innerHTML = `
        <div class="cursor-dot"></div>
        <div class="cursor-label">${username}</div>
      `;
      document.getElementById('cursors-container').appendChild(cursorElement);
      this.cursors.set(userId, cursorElement);
    }

    cursorElement.style.left = `${cursor.x}px`;
    cursorElement.style.top = `${cursor.y}px`;

    // Remove cursor if no update in 3 seconds
    setTimeout(() => {
      if (this.cursors.has(userId)) {
        const lastUpdate = cursorElement.dataset.lastUpdate;
        if (lastUpdate && Date.now() - parseInt(lastUpdate) > 3000) {
          cursorElement.remove();
          this.cursors.delete(userId);
        }
      }
    }, 3000);

    cursorElement.dataset.lastUpdate = Date.now();
  }

  // Placeholder for notifications, can be replaced with UI popup
  showNotification(message) {
    console.log(message);
  }
}

// Initialize the application
new DrawingApp();
