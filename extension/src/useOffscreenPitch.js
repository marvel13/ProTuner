import { useState, useEffect, useRef } from 'react'

export function useOffscreenPitch() {
  const [detectedHz, setDetectedHz] = useState(null)
  const [isSilent, setIsSilent] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)

  const latestFreqData = useRef(null)
  const analyserRef = useRef({
    frequencyBinCount: 128,
    getByteFrequencyData: (arr) => {
      if (latestFreqData.current) arr.set(latestFreqData.current)
      else arr.fill(0)
    },
  })

  useEffect(() => {
    const handler = (msg) => {
      if (msg.type === 'PITCH_DATA') {
        if (msg.freqData) latestFreqData.current = new Uint8Array(msg.freqData)
        setIsListening(true)
        setIsSilent(msg.isSilent)
        setDetectedHz(msg.hz ?? null)
        setError(null)
      }
      if (msg.type === 'PITCH_ERROR') {
        setError(msg.error)
        setIsListening(false)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const start = () =>
    new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'START_OFFSCREEN' }, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
        else if (res?.ok) resolve()
        else reject(new Error(res?.error || 'Failed to start audio'))
      })
    })

  const stop = () => {
    chrome.runtime.sendMessage({ type: 'STOP_OFFSCREEN' })
    setIsListening(false)
    setIsSilent(true)
    setDetectedHz(null)
    setError(null)
  }

  return { detectedHz, isSilent, isListening, error, analyserRef, start, stop }
}
