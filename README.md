# use-konva-snapping

A lightweight React hook for adding snapping functionality to Konva.js elements. It enables elements to snap to stage borders, the center of the stage, and other shapes, with customizable guidelines and snapping sensitivity.

> Fork of [faridmth/use-konva-snapping](https://github.com/faridmth/use-konva-snapping) by [Farid Methia](https://github.com/faridmth). This fork is written in TypeScript and ships its own type definitions. The snapping behaviour is unchanged.

---

# <a href="https://codesandbox.io/p/sandbox/ysz9q6" target="_blank">DEMO</a>

## Features

- **Snap to Stage Center**: Snap elements to the center of the Konva stage.
- **Snap to Stage Borders**: Snap elements to the edges of the stage.
- **Snap to Shapes**: Snap elements to other shapes within the Konva stage.
- **Guidelines**: Display visual guidelines when snapping, customizable in terms of color, thickness, and dash style.
- **Customizable Snap Range**: Define how close elements need to be to another object for snapping to occur.
- **Supports Dragging & Resizing**: Works with both dragging and resizing of Konva shapes.
- **Fully Configurable**: Customize snapping behavior, guidelines, and more with simple options.

---

## Installation

To install `use-konva-snapping`, you can use npm or yarn:

### Using npm:

```bash
npm install use-konva-snapping
```

### Using yarn:

```bash
yarn add use-konva-snapping
```

---

## Usage

Once installed, you can use the `useKonvaSnapping` hook to enable snapping for Konva elements in your React app. Here's how to set it up:

### Step 1: Import the Hook

Import the `useKonvaSnapping` hook into your React component.

```javascript
import { useKonvaSnapping } from "use-konva-snapping";
```

### Step 2: Use the Hook

Use the hook to get the snapping functionality and attach it to your Konva elements. Below is an example of a basic implementation where you can add draggable shapes and make them snap to the stage and other shapes.

```javascript
"use client";

import React, { useRef, useState } from "react";

import {
  Stage,
  Layer,
  Rect,
  Circle,
  RegularPolygon,
  Transformer,
} from "react-konva";

import { useKonvaSnapping } from "use-konva-snapping";

const App = () => {
  const transformerRef = useRef(null); // Initialize transformerRef

  const [shapes, setShapes] = useState([
    {
      type: "rect",
      x: 60,
      y: 160,
      width: 100,
      height: 50,
      fill: "red",
      draggable: true,
    },

    {
      type: "rect",
      x: 260,
      y: 260,
      width: 100,
      height: 50,
      fill: "red",
      draggable: true,
    },
    {
      type: "circle",
      x: 200,
      y: 100,
      radius: 40,
      fill: "green",
      draggable: true,
    },

    {
      type: "triangle",
      x: 300,
      y: 150,
      radius: 50,
      sides: 3,
      fill: "blue",
      draggable: true,
    },
  ]);

  const { handleDragging, handleDragEnd, handleResizing, handleResizeEnd } =
    useKonvaSnapping({
      guidelineColor: "blue",
      guidelineDash: true,
      snapToStageCenter: true,
      snapRange: 5,
      guidelineThickness: 1,
      showGuidelines: true,
      snapToShapes: true,
      snapToStageBorders: true,
    });

  const handleSelect = (e) => {
    transformerRef.current.nodes([e.target]);
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {shapes.map((shape, index) => {
          if (shape.type === "rect") {
            return (
              <Rect
                key={index}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={shape.fill}
                draggable={shape.draggable}
                onDragMove={handleDragging}
                onDragEnd={handleDragEnd}
                onClick={handleSelect}
              />
            );
          }

          if (shape.type === "circle") {
            return (
              <Circle
                key={index}
                x={shape.x}
                y={shape.y}
                radius={shape.radius}
                fill={shape.fill}
                draggable={shape.draggable}
                onClick={handleSelect}
                onDragMove={handleDragging}
                onDragEnd={handleDragEnd}
              />
            );
          }

          if (shape.type === "triangle") {
            return (
              <RegularPolygon
                key={index}
                x={shape.x}
                y={shape.y}
                radius={shape.radius}
                sides={shape.sides}
                fill={shape.fill}
                draggable={shape.draggable}
                onClick={handleSelect}
                onDragMove={handleDragging}
                onDragEnd={handleDragEnd}
              />
            );
          }

          return null;
        })}

        <Transformer
          ref={transformerRef}
          onTransform={handleResizing}
          onTransformEnd={handleResizeEnd}
          keepRatio={false}
        />
      </Layer>
    </Stage>
  );
};
export default App;
```

### Step 3: Customize Options (Optional)

### `useKonvaSnapping(params)`

#### Parameters:

- `snapRange`: (default: `3`) Distance in pixels for snapping sensitivity.
- `guidelineColor`: (default: `"rgb(0, 161, 255)"`) Color of the snapping guidelines.
- `guidelineDash`: (default: `true`) Whether the guidelines should be dashed.
- `showGuidelines`: (default: `true`) Whether the guidelines should be displayed.
- `guidelineThickness`: (default: `1`) Thickness of the guidelines.
- `snapToStageCenter`: (default: `true`) Whether to snap to the center of the stage.
- `snapToStageBorders`: (default: `true`) Whether to snap to the edges of the stage.
- `snapToShapes`: (default: `true`) Whether to snap to other shapes on the stage.

#### Methods Returned:

- `handleDragging`: Attach this method to `onDragMove` of Konva elements.
- `handleResizing`: Attach this method to `onResize` of Konva Transformer.
- `handleDragEnd`: Attach this method to `onDragEnd` of Konva elements.
- `handleResizeEnd`: Attach this method to `onResizeEnd` of Konva Transformer.

---

## TypeScript

Type definitions ship with the package, so no separate `@types/...` install is needed. Both the parameter and the return types are exported so you can reuse them:

```typescript
import { useKonvaSnapping } from "use-konva-snapping";
import type {
  UseKonvaSnappingParams,
  UseKonvaSnappingResult,
} from "use-konva-snapping";

const options: UseKonvaSnappingParams = {
  guidelineColor: "blue",
  snapRange: 5,
};

const handlers: UseKonvaSnappingResult = useKonvaSnapping(options);
```

The handlers are typed with Konva's own event types and can be passed directly to `react-konva`:

- `handleDragging` and `handleDragEnd` take a `Konva.KonvaEventObject<DragEvent>`, matching `onDragMove` and `onDragEnd`.
- `handleResizing` and `handleResizeEnd` take a `Konva.KonvaEventObject<Event>`, matching `onTransform` and `onTransformEnd`.

Every option is optional, but the parameter object itself is required. Call `useKonvaSnapping({})` to take all the defaults.

The package is ESM only (`"type": "module"` with an `exports` map). Import it; `require()` is not supported.

---

Author: <a href="https://www.linkedin.com/in/farid-methia/" target="_blank">Farid Methia</a>  
GitHub: <a href="https://github.com/faridmth" target="_blank">faridmth</a>  
Email: <a href="mailto:methia.farid2001@gmail.com" target="_blank">methia.farid2001@gmail.com</a>
