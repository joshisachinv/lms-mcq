"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function Scratchpad({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineCap = "round";
    context.lineJoin = "round";

    if (value) {
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
      };
      image.src = value;
    } else {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    onChange(canvas.toDataURL("image/png"));
  };

  const getPosition = (
    event:
      React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ("clientX" in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    event:
      React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const position = getPosition(event);

    context.beginPath();
    context.moveTo(position.x, position.y);

    setIsDrawing(true);
  };

  const draw = (
    event:
      React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const position = getPosition(event);

    context.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    context.lineWidth = tool === "eraser" ? 16 : lineWidth;

    context.lineTo(position.x, position.y);
    context.stroke();

    saveCanvas();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    saveCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    onChange("");
  };

  return (
    <div className="scratchpad-box">
      <h3 className="scratchpad-title">Scratchpad</h3>

      <div className="scratchpad-toolbar">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setTool("pencil")}
        >
          Pencil
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setTool("eraser")}
        >
          Eraser
        </button>

        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          disabled={tool === "eraser"}
        />

        <select
          value={lineWidth}
          onChange={(event) => setLineWidth(Number(event.target.value))}
          disabled={tool === "eraser"}
        >
          <option value={2}>Thin</option>
          <option value={4}>Medium</option>
          <option value={8}>Thick</option>
        </select>

        <button type="button" className="danger-button" onClick={clearCanvas}>
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={1200}
        height={450}
        className="scratchpad-canvas"
        style={{
          cursor: tool === "pencil" ? "crosshair" : "cell",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}
