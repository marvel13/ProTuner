const SCALES = Array.from({ length: 11 }, (_, i) => ({
  deg: i * 9 - 45,
  strong: i % 5 === 0,
}))

export function TunerDial({ needleDeg, isSilent, needleColor, detectedNote }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: '50%',
        width: '100%',
        height: '33%',
        marginBottom: '5vh',
        zIndex: 1,
      }}
    >
      {/* Scale marks */}
      {SCALES.map(({ deg, strong }) => (
        <div
          key={deg}
          style={{
            position: 'absolute',
            bottom: 0,
            right: '50%',
            width: strong ? 2 : 1,
            height: '100%',
            transform: `rotate(${deg}deg)`,
            transformOrigin: 'bottom',
            boxSizing: 'border-box',
            borderTop: `${strong ? 20 : 10}px solid ${strong ? '#6b7280' : '#374151'}`,
          }}
        />
      ))}

      {/* Detected note */}
      {detectedNote && (() => {
        const hasSharp = detectedNote[1] === '#'
        const noteName = hasSharp ? detectedNote.slice(0, 2) : detectedNote[0]
        const octave = detectedNote.slice(hasSharp ? 2 : 1)
        return (
          <div
            style={{
              position: 'absolute',
              bottom: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(64px, 22vw, 90px)',
              fontWeight: 'bold',
              color: '#9ca3af',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              lineHeight: 1,
            }}
          >
            {noteName}
            <span style={{ fontSize: '40%', marginBottom: '0.15em', marginLeft: '0.05em', color: '#6b7280' }}>
              {octave}
            </span>
          </div>
        )
      })()}

      {/* Pivot dot */}
      <div
        style={{
          position: 'absolute',
          bottom: -5,
          right: '50%',
          marginRight: -4,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#6b7280',
        }}
      />

      {/* Needle */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: '50%',
          width: 2,
          height: '100%',
          transform: `rotate(${needleDeg}deg)`,
          transformOrigin: 'bottom',
          background: isSilent ? '#374151' : needleColor,
          transition: isSilent ? 'none' : 'transform 0.5s, background 0.15s',
        }}
      />
    </div>
  )
}
