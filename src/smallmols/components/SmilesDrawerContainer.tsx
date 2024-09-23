import {useEffect, useRef, useState} from "react"
// @ts-ignore
import SmilesDrawer from "smiles-drawer"
import {theme} from "antd";
import useAppStore from "../../stores/appstore.ts";

export const WIDTH = 200;
const HEIGHT = WIDTH;

interface SmileDrawerContainerProps {
    smilesStr: string
    width?: number
    height?: number
}

export default function SmileDrawerContainer({smilesStr, width = WIDTH, height = HEIGHT}: SmileDrawerContainerProps) {

    // States
    const [pixelRatio, setPixelRatio] = useState(1)
    const darkMode = useAppStore(state => state.darkMode) ? "dark" : "light";

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Styling
    const {token} = theme.useToken();

    useEffect(() => {
        setPixelRatio(window.devicePixelRatio || 1)
    }, [])

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')

            if (ctx) {
                // Set canvas size accounting for pixel ratio
                canvas.width = width * pixelRatio * 2
                canvas.height = height * pixelRatio * 2
                canvas.style.width = `${width / 2}px`
                canvas.style.height = `${height / 2}px`

                // Scale the context to ensure correct drawing operations
                ctx.scale(pixelRatio, pixelRatio)

                // Clear the canvas
                ctx.clearRect(0, 0, width, height)

                // Create the drawer with updated options
                const drawer = new SmilesDrawer.Drawer({
                    width: width,
                    height: height,
                    offsetX: width / 2,
                    offsetY: height / 2,
                })

                // Parse and draw
                SmilesDrawer.parse(smilesStr, function (tree: any) {
                    drawer.draw(tree, canvas, darkMode, false)
                })
            }
        }
    }, [smilesStr, width, height, pixelRatio, darkMode])

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
    )
}