import { useEffect, useRef } from 'react'

const LENGTH = 32

export function FrequencyBars({ analyserRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight / 2
    }
    resize()
    window.addEventListener('resize', resize)

    const ctx = canvas.getContext('2d')
    let raf

    const draw = () => {
      const analyser = analyserRef.current
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)

        const barWidth = canvas.width / LENGTH - 0.5
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#1f2937'

        for (let i = 0; i < LENGTH; i++) {
          ctx.fillRect(
            i * (barWidth + 0.5),
            canvas.height - data[i],
            barWidth,
            data[i]
          )
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [analyserRef])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
