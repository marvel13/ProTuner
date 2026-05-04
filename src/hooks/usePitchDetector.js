import { useState, useRef, useCallback } from 'react'
import { PitchDetector } from 'pitchy'

const BUFFER_SIZE = 8192
const STABILITY_FRAMES = 2
const MEDIAN_WINDOW = 5

export function usePitchDetector() {
  const [detectedHz, setDetectedHz] = useState(null)
  const [isSilent, setIsSilent] = useState(true)
  const [isListening, setIsListening] = useState(false)

  const contextRef = useRef(null)
  const streamRef = useRef(null)
  const processorRef = useRef(null)
  const analyserRef = useRef(null)

  const stop = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (contextRef.current) {
      contextRef.current.close()
      contextRef.current = null
    }
    analyserRef.current = null
    setIsListening(false)
    setDetectedHz(null)
    setIsSilent(true)
  }, [])

  const start = useCallback(async () => {
    stop()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const context = new AudioContext()
      contextRef.current = context

      const aubioInstance = await window.aubio()
      const pitchDetector = new aubioInstance.Pitch('default', BUFFER_SIZE, 1, context.sampleRate)

      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyserRef.current = analyser

      const processor = context.createScriptProcessor(BUFFER_SIZE, 1, 1)
      processorRef.current = processor

      source.connect(analyser)
      analyser.connect(processor)
      processor.connect(context.destination)

      let lastMidi = -1
      let stableFrames = 0
      const freqWindow = []

      const median = (arr) => {
        const s = [...arr].sort((a, b) => a - b)
        return s[Math.floor(s.length / 2)]
      }

      processor.addEventListener('audioprocess', (event) => {
        const input = event.inputBuffer.getChannelData(0)

        // RMS energy gate
        let sum = 0
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
        const rms = Math.sqrt(sum / input.length)
        if (rms < 0.001) {
          lastMidi = -1
          stableFrames = 0
          freqWindow.length = 0
          setIsSilent(true)
          return
        }

        const frequency = pitchDetector.do(input)
        if (frequency) {
          // Use full MIDI note (including octave) so E2 vs E3 are treated as different
          const midi = Math.round(12 * Math.log2(frequency / 440) + 69)

          if (lastMidi !== -1 && Math.abs(midi - lastMidi) <= 2) {
            stableFrames++
          } else {
            stableFrames = 1
            freqWindow.length = 0
          }
          lastMidi = midi

          if (stableFrames >= STABILITY_FRAMES) {
            freqWindow.push(frequency)
            if (freqWindow.length > MEDIAN_WINDOW) freqWindow.shift()
            setDetectedHz(median(freqWindow))
            setIsSilent(false)
          }
        } else {
          lastMidi = -1
          stableFrames = 0
          freqWindow.length = 0
          setIsSilent(true)
        }
      })

      setIsListening(true)
    } catch (err) {
      console.error('Mic access failed:', err)
      setIsListening(false)
    }
  }, [stop])

  return { detectedHz, isSilent, isListening, analyserRef, start, stop }
}
