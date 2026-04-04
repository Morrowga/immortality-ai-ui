import { useRainCanvas } from "@/hooks/useRainCanvas"

export function RainCanvas() {
  const ref = useRainCanvas()
  return <canvas ref={ref} className="rain-canvas" />
}