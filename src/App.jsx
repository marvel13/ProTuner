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
