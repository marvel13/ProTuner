import { useState, useEffect, useMemo } from 'react'
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
  const inTune = !isSilent && !!detectedHz && Math.abs(cents) < 10
  const needleColor = inTune ? '#22c55e' : '#e74c3c'

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
            return (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                style={{
                  fontSize: 'clamp(20px, 11vw, 90px)',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  position: 'relative',
                  paddingRight: 'clamp(12px, 3.5vw, 30px)',
                  paddingLeft: 'clamp(4px, 1.2vw, 10px)',
                  color: isActive ? '#e74c3c' : '#374151',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {letter}
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
