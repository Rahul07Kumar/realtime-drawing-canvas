// The DrawingState class manages all the strokes (lines or shapes) 
// drawn on a collaborative canvas for a specific room.
class DrawingState {
  constructor() {
    this.strokes = [];          // Stores all strokes currently drawn
    this.currentStrokeId = 0;   // Unique ID counter for each stroke
  }

  // Adds a new stroke to the canvas and assigns it a unique ID
  addStroke(stroke) {
    const strokeWithId = { ...stroke, id: this.currentStrokeId++ };
    this.strokes.push(strokeWithId);
    return strokeWithId;
  }

  // Returns all strokes (used when a new user joins to load existing drawings)
  getStrokes() {
    return this.strokes;
  }

  // Removes the most recent stroke (used for undo operations)
  undo() {
    if (this.strokes.length > 0) {
      const removed = this.strokes.pop();
      return removed;
    }
    return null;
  }

  // Clears all strokes and resets stroke ID counter
  clear() {
    this.strokes = [];
    this.currentStrokeId = 0;
  }
}

// Export the class so it can be used by the RoomManager
module.exports = DrawingState;
