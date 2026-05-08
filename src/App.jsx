import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { TunerInterface } from './components/TunerInterface'

export default function App() {
  const [selectedSong, setSelectedSong] = useState(null)
  const [hasResults, setHasResults] = useState(false)

  if (selectedSong) {
    return <TunerInterface song={selectedSong} onBack={() => setSelectedSong(null)} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      color: '#e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: hasResults ? '6vh' : '30vh',
      paddingBottom: 40,
      transition: 'padding-top 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      boxSizing: 'border-box',
    }}>
      <a
        href="https://github.com/marvel13/ProTuner"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#9ca3af',
          fontSize: 13,
          textDecoration: 'none',
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: 20,
          padding: '6px 12px',
          transition: 'color 0.2s',
          zIndex: 10,
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'}
        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        GitHub
      </a>
      <div style={{ width: '100%', maxWidth: 560, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: hasResults ? 20 : 32, transition: 'margin-bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontVariationSettings: '"opsz" 144, "SOFT" 50, "wght" 300',
              letterSpacing: '-0.1rem',
              lineHeight: 1.375,
              fontSize: hasResults ? 'clamp(2rem, 7vw, 3.5rem)' : 'clamp(3.5rem, 12vw, 6rem)',
              fontWeight: 300,
              margin: 0,
              transition: 'font-size 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            🎸 ProTuner
          </h1>
          {!hasResults && (
            <p style={{ color: '#6b7280', fontSize: 'clamp(12px, 3.5vw, 14px)', marginTop: 4 }}>
              Search a song. Tune your guitar to match.
            </p>
          )}
        </div>
        <SearchBar onSongSelect={setSelectedSong} onResultsChange={setHasResults} />
      </div>
    </div>
  )
}
