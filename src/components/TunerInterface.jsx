import { useState, useEffect, useMemo, useRef } from 'react'
import { usePitchDetector } from '../hooks/usePitchDetector'
import { midiToHz, midiToNote } from '../utils/midi'
import { TunerDial } from './TunerDial'
import { FrequencyBars } from './FrequencyBars'

function parseNote(midi) {
  const full = midiToNote(midi)        // e.g. "C#3", "E2", "A#1"
  const letter = full[0]
  const hasSharp = full[1] === '#'
  const sharp = hasSharp ? '#' : ''
  const octave = full.slice(hasSharp ? 2 : 1)
  return { letter, sharp, octave }
}

export function TunerInterface({ song, onBack }) {
  const [activeIndex, setActiveIndex] = useState(song.tuning.length - 1)
  const [tunedStrings, setTunedStrings] = useState(new Set())
  const [toastNote, setToastNote] = useState(null)
  const [inTuneStartKey, setInTuneStartKey] = useState(0)
  const prevInTuneRef = useRef(false)
  const { detectedHz, isSilent, isListening, analyserRef, start, stop } = usePitchDetector()

  useEffect(() => {
    start()
    return () => stop()
  }, [])

  const targetHz = midiToHz(song.tuning[activeIndex])

  const cents = useMemo(() => {
    if (!detectedHz || isSilent) return 0
    return Math.floor(1200 * Math.log2(detectedHz / targetHz))
  }, [detectedHz, targetHz, isSilent])

  const clampedCents = Math.max(-50, Math.min(50, cents))
  const needleDeg = (clampedCents / 50) * 45
  const inTune = !isSilent && !!detectedHz && Math.abs(cents) < 5
  const needleColor = inTune ? '#22c55e' : '#e74c3c'

  // Track inTune onset to restart the ring animation
  useEffect(() => {
    if (inTune && !prevInTuneRef.current) {
      setInTuneStartKey((k) => k + 1)
    }
    prevInTuneRef.current = inTune
  }, [inTune])

  // Mark string as tuned after holding in tune for 2s
  useEffect(() => {
    if (!inTune) return
    const timer = setTimeout(() => {
      setTunedStrings((prev) => new Set(prev).add(activeIndex))
      setToastNote(midiToNote(song.tuning[activeIndex]))
    }, 1500)
    return () => clearTimeout(timer)
  }, [inTune, activeIndex])

  // Auto-clear toast after 2s
  useEffect(() => {
    if (!toastNote) return
    const timer = setTimeout(() => setToastNote(null), 2000)
    return () => clearTimeout(timer)
  }, [toastNote])

  const handleStringSelect = (i) => {
    setActiveIndex(i)
  }

  // tuning array is high→low; reverse to show low→high
  const stringsLowToHigh = song.tuning.map((midi, i) => ({ midi, i })).reverse()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#030712',
        color: '#e5e7eb',
        fontFamily: 'sans-serif',
        userSelect: 'none',
        cursor: 'default',
        overflow: 'hidden',
      }}
    >
      {/* Back + song info */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1, lineHeight: 1.4 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
            display: 'block',
            marginBottom: 4,
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{song.title}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>{song.artist}</div>
      </div>

      {/* Listening indicator */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontSize: 11,
          color: isListening ? '#22c55e' : '#6b7280',
          zIndex: 1,
        }}
      >
        {isListening ? '● live' : '○ mic off'}
      </div>

      {/* Toast notification */}
      {toastNote && (
        <div className="toast" style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          background: '#22c55e',
          color: '#030712',
          borderRadius: 20,
          padding: '6px 18px',
          fontWeight: 600,
          fontSize: 14,
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          ✅ {toastNote} tuned!
        </div>
      )}

      {/* Meter */}
      <TunerDial needleDeg={needleDeg} isSilent={isSilent} needleColor={needleColor} />

      {/* Notes / string selector — top: 50%, mirrors original .notes */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: 0,
          right: 0,
          width: '100%',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        {/* String list */}
        <div
          style={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, #000 15%, #000 85%, transparent)',
          }}
        >
          {stringsLowToHigh.map(({ midi, i }) => {
            const { letter, sharp, octave } = parseNote(midi)
            const isActive = i === activeIndex
            const isTuned = tunedStrings.has(i)
            const color = isActive
              ? (inTune ? '#22c55e' : '#e74c3c')
              : isTuned
              ? '#16a34a'
              : '#6b7280'
            return (
              <div
                key={i}
                onClick={() => handleStringSelect(i)}
                style={{
                  fontSize: 'clamp(20px, 11vw, 90px)',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  position: 'relative',
                  paddingRight: 'clamp(12px, 3.5vw, 30px)',
                  paddingLeft: 'clamp(4px, 1.2vw, 10px)',
                  color,
                  transition: 'color 0.3s ease',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Letter wrapped so ring can center on it alone */}
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  {letter}
                  {isActive && inTune && (
                    <svg
                      key={inTuneStartKey}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '1.35em',
                        height: '1.35em',
                        pointerEvents: 'none',
                        overflow: 'visible',
                      }}
                      viewBox="0 0 80 80"
                    >
                      <circle
                        cx="40" cy="40" r="36"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeDasharray="226"
                        strokeDashoffset="226"
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                        className="tune-ring"
                      />
                    </svg>
                  )}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    right: '0.25em',
                    fontSize: '40%',
                    fontWeight: 'normal',
                    top: '0.3em',
                  }}
                >
                  {sharp}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    right: '0.25em',
                    fontSize: '40%',
                    fontWeight: 'normal',
                    bottom: '0.3em',
                  }}
                >
                  {octave}
                </span>
              </div>
            )
          })}
        </div>

        {/* Frequency readout */}
        <div style={{ fontSize: 'clamp(14px, 4vw, 32px)' }}>
          {isSilent || !detectedHz ? ' ' : detectedHz.toFixed(1)}
          <span style={{ fontSize: '50%', marginLeft: '0.25em', color: '#6b7280' }}>Hz</span>
        </div>
      </div>

      {/* Frequency bars */}
      <FrequencyBars analyserRef={analyserRef} />
    </div>
  )
}
