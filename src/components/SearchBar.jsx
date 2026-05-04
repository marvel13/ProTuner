import { useState, useEffect, useRef } from 'react'
import { midiToNote } from '../utils/midi'

const API_BASE = import.meta.env.DEV
  ? '/api/songsterr'
  : 'https://protuner-proxy.salwynm.workers.dev'

async function fetchSongs(query) {
  const url = `${API_BASE}/search?pattern=${encodeURIComponent(query)}&inst=undefined&tuning=undefined&difficulty=undefined&size=20&from=0&more=true`
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

function SongItem({ song, onClick }) {
  const noteNames = [...song.tuning].reverse().map(midiToNote)
  return (
    <button type="button" className="song-item" onMouseDown={onClick} onClick={onClick}>
      <div className="song-info">
        <p className="song-title">{song.title}</p>
        <p className="song-artist">{song.artist}</p>
      </div>
      <div className="song-meta">
        <p className="song-notes">{noteNames.join(' ')}</p>
        <p className="song-track">{song.trackName}</p>
      </div>
    </button>
  )
}

export function SearchBar({ onSongSelect, onResultsChange }) {
  const [query, setQuery] = useState('')
  const [dropdownResults, setDropdownResults] = useState([])
  const [pageResults, setPageResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  // Notify parent when page results change
  useEffect(() => {
    onResultsChange?.(pageResults.length > 0)
  }, [pageResults])

  // Live dropdown while typing
  useEffect(() => {
    if (!query.trim()) {
      setDropdownResults([])
      setDropdownOpen(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const songs = await fetchSongs(query)
        setDropdownResults(songs)
        setDropdownOpen(songs.length > 0)
      } catch {
        setDropdownResults([])
        setDropdownOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setDropdownOpen(false)
    setLoading(true)
    setSubmitted(false)
    try {
      const songs = await fetchSongs(query)
      setPageResults(songs)
      setSubmitted(true)
    } catch {
      setPageResults([])
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
    setPageResults([])
    setSubmitted(false)
    onResultsChange?.(false)
  }

  const handleDropdownSelect = (song) => {
    setDropdownOpen(false)
    setQuery('')
    setDropdownResults([])
    setPageResults([])
    setSubmitted(false)
    onResultsChange?.(false)
    onSongSelect(song)
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => dropdownResults.length > 0 && setDropdownOpen(true)}
          placeholder="Search for a song…"
          className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          style={{ fontSize: 16 }}
          autoComplete="off"
        />
        {loading && (
          <span style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280',
            fontSize: 12,
            pointerEvents: 'none',
          }}>
            …
          </span>
        )}

        {/* Dropdown — shown while typing, hidden once page results are listed */}
        {dropdownOpen && dropdownResults.length > 0 && pageResults.length === 0 && (
          <ul style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 8,
            zIndex: 50,
            maxHeight: 'min(280px, 55vh)',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            listStyle: 'none',
            padding: 0,
            margin: '6px 0 0',
          }}>
            {dropdownResults.map((song) => (
              <li key={song.songId} style={{ borderBottom: '1px solid #1f2937' }}>
                <SongItem song={song} onClick={() => handleDropdownSelect(song)} />
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Page results — shown after Enter */}
      {pageResults.length > 0 && (
        <ul style={{ marginTop: 12, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pageResults.map((song, idx) => (
            <li key={song.songId} className="result-item" style={{ animationDelay: `${idx * 40}ms` }}>
              <SongItem song={song} onClick={() => onSongSelect(song)} />
            </li>
          ))}
        </ul>
      )}

      {submitted && pageResults.length === 0 && !loading && (
        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
          No results found.
        </p>
      )}
    </div>
  )
}
