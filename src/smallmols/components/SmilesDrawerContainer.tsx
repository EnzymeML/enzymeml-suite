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
  const pixelRatio = useMemo(() => window.devicePixelRatio || 1, []); // Only compute once
  const darkMode = useAppStore((state) => state.darkMode) ? "dark" : "light";

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawerRef = useRef<any>(null);

  // Styling
  const { token } = theme.useToken();

  // Initialize drawer and canvas only once
  useEffect(() => {
    if (!drawerRef.current) {
      drawerRef.current = new SmilesDrawer.Drawer({
        width: width,
        height: height,
        offsetX: width / 2,
        offsetY: height / 2,
      });
    }

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = width * pixelRatio * 2;
        canvas.height = height * pixelRatio * 2;
        canvas.style.width = `${width / 2}px`;
        canvas.style.height = `${height / 2}px`;

        ctx.scale(pixelRatio, pixelRatio);
      }
    }

    // Cleanup drawer on unmount
    return () => {
      drawerRef.current = null;
    };
  }, []); // Empty dependency array - only run once

  // Only redraw when smilesStr or darkMode changes
  useEffect(() => {
    if (!smilesStr || !canvasRef.current || !drawerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      SmilesDrawer.parse(smilesStr, function (tree: any) {
        if (drawerRef.current) {
          // Check if drawer still exists
          drawerRef.current.draw(tree, canvas, darkMode, false);
        }
      });
    }
  }, [smilesStr, darkMode]); // Only depend on smilesStr and darkMode

  return (
    <div className="flex items-center justify-center w-full h-full">
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
