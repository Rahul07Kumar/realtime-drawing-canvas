// CanvasManager handles all drawing operations on a single HTML canvas element
export class CanvasManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;                   // Reference to the HTML canvas
    this.ctx = this.canvas.getContext('2d');       // Canvas 2D drawing context
    this.isDrawing = false;                        // Flag for whether user is currently drawing
    this.currentTool = 'brush';                    // Current tool (brush or eraser)
    this.currentColor = '#000000';                 // Default drawing color
    this.strokeWidth = 2;                          // Default stroke width
    this.currentStroke = null;                     // Stores the stroke currently being drawn
    this.strokes = [];                             // All completed strokes on the canvas

    this.resizeCanvas();                           // Initial resize to match container
    window.addEventListener('resize', () => this.resizeCanvas()); // Resize canvas dynamically
  }

  // Resizes the canvas to match its parent container while preserving existing drawing
  resizeCanvas() {
    const container = this.canvas.parentElement;

    // Temporary canvas to save current drawing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    tempCtx.drawImage(this.canvas, 0, 0);

    // Resize main canvas to container size
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;

    // Restore previous drawing
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.redrawCanvas();
  }

  // Change the drawing tool (brush or eraser)
  setTool(tool) {
    this.currentTool = tool;
  }

  // Change the current color
  setColor(color) {
    this.currentColor = color;
  }

  // Change stroke width
  setStrokeWidth(width) {
    this.strokeWidth = width;
  }

  // Start a new stroke when user begins drawing
  startDrawing(x, y) {
    this.isDrawing = true;

    // Setup new stroke object with current settings
    this.currentStroke = {
      tool: this.currentTool,
      color: this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor,
      width: this.currentTool === 'eraser' ? this.strokeWidth * 2 : this.strokeWidth,
      points: [{ x, y }] // Initial point
    };
  }

  // Add a new point to the current stroke as user moves the pointer
  draw(x, y) {
    if (!this.isDrawing || !this.currentStroke) return;

    this.currentStroke.points.push({ x, y });
    this.drawStroke(this.currentStroke);
  }

  // Finish the current stroke and return it for sending to server
  stopDrawing() {
    if (this.isDrawing && this.currentStroke && this.currentStroke.points.length > 1) {
      const strokeToSend = { ...this.currentStroke };
      this.isDrawing = false;
      this.currentStroke = null;
      return strokeToSend;
    }

    // Reset if stroke is invalid or too short
    this.isDrawing = false;
    this.currentStroke = null;
    return null;
  }

  // Draw a single stroke on the canvas
  drawStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    this.ctx.stroke();
  }

  // Add a completed stroke to local strokes array and draw it
  addStroke(stroke) {
    this.strokes.push(stroke);
    this.drawStroke(stroke);
  }

  // Remove a stroke by ID (used for undo)
  removeStroke(strokeId) {
    this.strokes = this.strokes.filter(s => s.id !== strokeId);
    this.redrawCanvas();
  }

  // Load multiple strokes (e.g., when joining a room) and redraw
  loadStrokes(strokes) {
    this.strokes = strokes;
    this.redrawCanvas();
  }

  // Redraw all strokes (clears canvas and redraws everything)
  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokes.forEach(stroke => this.drawStroke(stroke));
  }

  // Clear all strokes and the canvas
  clear() {
    this.strokes = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Convert client (mouse/touch) coordinates to canvas coordinates
  getCanvasCoordinates(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
}
