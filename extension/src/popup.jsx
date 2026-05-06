import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { TunerInterface } from '../../src/components/TunerInterface'
import { midiToNote } from '../../src/utils/midi'
import { useOffscreenPitch } from './useOffscreenPitch'
import './popup.css'

const API_BASE = 'https://protuner-proxy.salwynm.workers.dev'

async function fetchSongs(query) {
  const url = `${API_BASE}/search?pattern=${encodeURIComponent(query)}&inst=undefined&tuning=undefined&difficulty=undefined&size=10&from=0&more=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  const records = Array.isArray(data) ? data : (data.records ?? [])
  return records
    .filter((s) => !s.isJunk)
    .map((s) => {
      const guitarTracks = s.tracks.filter((t) =>
        t.instrument && t.instrument.toLowerCase().includes('guitar')
      )
      if (guitarTracks.length === 0) return null
      const trackIndex = s.popularTrackGuitar ?? 0
      const track = s.tracks[trackIndex] ?? guitarTracks[0]
      if (!track || !track.tuning) return null
      return {
        songId: s.songId,
        title: s.title,
        artist: s.artist,
        tuning: track.tuning,
        trackName: track.name,
      }
    })
    .filter(Boolean)
}

function parseYouTubeTitle(title) {
  return title
    .replace(/[-–|]\s*youtube\s*$/i, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\((official\s*(video|audio|lyric|music\s*video)|lyrics?|hd|hq|4k|live(\s*(version|session))?|remaster(ed)?)\)/gi, '')
    .replace(/\b(guitar|bass|drum)\s*(lesson|tutorial|tab|cover|playthrough|solo|lick)\b/gi, '')
    .replace(/\bhow\s+to\s+play\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function Popup() {
  const [view, setView] = useState('loading')
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)
  const [micState, setMicState] = useState('idle') // idle | requesting
  const offscreenPitch = useOffscreenPitch()

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      const parsed = parseYouTubeTitle(tab?.title || '')
      setQuery(parsed)
      if (parsed) {
        try {
          const results = await fetchSongs(parsed)
          setSongs(results)
          setView('results')
        } catch {
          setSongs([])
          setView('results')
        }
      } else {
        setView('results')
      }
    })
  }, [])

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setView('loading')
    try {
      const results = await fetchSongs(query)
      setSongs(results)
      setView('results')
    } catch {
      setSongs([])
      setView('results')
    }
  }

  const handleSongSelect = (song) => {
    setSelectedSong(song)
    setMicState('idle')
    setView('tuner')
  }

  const handleEnableMic = async () => {
    setMicState('requesting')
    try {
      await offscreenPitch.start()
    } catch {
      setMicState('idle')
    }
  }

  const handleBack = () => {
    offscreenPitch.stop()
    setMicState('idle')
    setView('results')
  }

  if (view === 'tuner' && selectedSong) {
    if (!offscreenPitch.isListening) {
      return (
        <div className="popup-shell">
          <div className="popup-header">🎸 ProTuner</div>
          <div className="mic-gate">
            <button className="popup-back-link" onClick={handleBack}>← Back</button>
            <p className="mic-gate-song">{selectedSong.title}</p>
            <p className="mic-gate-artist">{selectedSong.artist}</p>
            {micState === 'requesting' ? (
              <p className="popup-status">Waiting for microphone permission…</p>
            ) : (
              <button className="mic-btn" onClick={handleEnableMic}>
                🎙 Enable Microphone
              </button>
            )}
            {offscreenPitch.error && (
              <p className="mic-error">
                {offscreenPitch.error.includes('NotAllowed')
                  ? 'Microphone was blocked. Go to Chrome Settings → Privacy → Site Settings → Microphone and allow this extension.'
                  : offscreenPitch.error}
              </p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div style={{ width: 380, height: 600, position: 'relative', overflow: 'hidden' }}>
        <TunerInterface
          song={selectedSong}
          onBack={handleBack}
          pitchOverride={offscreenPitch}
        />
      </div>
    )
  }

  return (
    <div className="popup-shell">
      <div className="popup-header">🎸 ProTuner</div>

      <form className="popup-search" onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song…"
          autoComplete="off"
        />
        <button type="submit">Search</button>
      </form>

      {view === 'loading' && (
        <p className="popup-status">Searching…</p>
      )}

      {view === 'results' && songs.length === 0 && (
        <p className="popup-status">No results found.</p>
      )}

      {view === 'results' && songs.length > 0 && (
        <ul className="popup-results">
          {songs.map((song) => {
            const noteNames = [...song.tuning].reverse().map(midiToNote)
            return (
              <li key={song.songId}>
                <button
                  className="popup-song"
                  onClick={() => handleSongSelect(song)}
                >
                  <div className="popup-song-info">
                    <span className="popup-song-title">{song.title}</span>
                    <span className="popup-song-artist">{song.artist}</span>
                  </div>
                  <span className="popup-song-tuning">{noteNames.join(' ')}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Popup />)
