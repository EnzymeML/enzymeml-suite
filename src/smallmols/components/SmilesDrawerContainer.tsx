import { useEffect, useRef, useMemo } from "react";
// @ts-ignore
import SmilesDrawer from "smiles-drawer";
import { theme } from "antd";
import useAppStore from "../../stores/appstore.ts";

export const WIDTH = 200;
const HEIGHT = WIDTH;

interface SmileDrawerContainerProps {
  smilesStr: string;
  width?: number;
  height?: number;
}

export default function SmileDrawerContainer({
  smilesStr,
  width = WIDTH,
  height = HEIGHT,
}: SmileDrawerContainerProps) {
  // States
  const pixelRatio = useMemo(() => window.devicePixelRatio || 1, []);
  const darkMode = useAppStore((state) => state.darkMode) ? "dark" : "light";

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawerRef = useRef<any>(null);

  // Styling
  const { token } = theme.useToken();

  // Initialize drawer only once
  useEffect(() => {
    if (!drawerRef.current) {
      // Configure drawer for the actual canvas resolution
      drawerRef.current = new SmilesDrawer.Drawer({
        width: width * pixelRatio,
        height: height * pixelRatio,
        offsetX: (width * pixelRatio) / 2,
        offsetY: (height * pixelRatio) / 2,
      });
    }

    // Cleanup drawer on unmount
    return () => {
      drawerRef.current = null;
    };
  }, [width, height, pixelRatio]);

  // Setup canvas and redraw when needed
  useEffect(() => {
    if (!smilesStr || !canvasRef.current || !drawerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Set canvas internal dimensions for high-DPI displays
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;

      // Set canvas display size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Clear the canvas (no context scaling needed since drawer handles the resolution)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Parse and draw the SMILES string
      SmilesDrawer.parse(smilesStr, function (tree: any) {
        if (drawerRef.current) {
          drawerRef.current.draw(tree, canvas, darkMode, false);
        }
      });
    }
  }, [smilesStr, darkMode, width, height, pixelRatio]); // Include all dependencies

  return (
    <div className="flex justify-center items-center w-full h-full">
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: 1,
          borderStyle: "solid",
          borderColor: token.colorBorder,
          borderRadius: token.borderRadiusLG,
        }}
      />
    </div>
  );
}
