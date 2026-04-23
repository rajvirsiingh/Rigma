# Multiplayer Whiteboard Client

A React + Vite whiteboard editor for drawing and managing shapes with rich selection, resizing, and measurement controls.

## Features

- Draw rectangles, circles, lines, and pen shapes
- Select and edit shape properties in a sidebar
- Resize shapes using corner and side handles
- Move selected shapes using arrow keys
- Rename and reorder shapes in the left sidebar
- Deselect shapes by clicking outside the canvas
- Hold `Alt` to display distance guides from the selected shape to canvas edges or hovered shapes
- Auto-delete empty shapes with no stroke and no fill

## Getting Started

### Prerequisites

- Node.js 18+ or compatible
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local development URL shown in the terminal.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

- `src/App.jsx` — main app shell and layout
- `src/components/CanvasBoard.jsx` — SVG canvas and pointer handling
- `src/components/Toolbar.jsx` — drawing mode controls
- `src/components/ShapeControls.jsx` — selected shape property editor
- `src/components/ShapeSidebar.jsx` — shape list with rename and ordering controls
- `src/components/ShapeRenderer.jsx` — dispatches rendering for each shape type
- `src/components/shapes/*` — individual shape renderers
- `src/hooks/useCanvas.js` — canvas state, selection, history, and interaction logic
- `src/utils/canvasUtils.js` — shape geometry, hit testing, and resize math

## Usage

1. Choose a drawing tool from the toolbar.
2. Draw a shape on the canvas.
3. Switch to select mode to edit a shape.
4. Use the property panel to adjust stroke, fill, size, and corner radius.
5. Hold `Alt` to view distance guides.
6. Use arrow keys to nudge the selected shape.

## Dependencies

- React 19
- Vite
- FontAwesome React icons

## Notes

This project is a lightweight whiteboard prototype focused on intuitive shape interaction and layout controls.

## License

MIT
