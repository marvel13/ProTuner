import { useState } from 'react'
import { midiToNote } from '../utils/midi'

export function SearchBar({ onSongSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    setSearched(false)
    try {
      const url = `/api/songsterr/search?pattern=${encodeURIComponent(query)}&inst=undefined&tuning=undefined&difficulty=undefined&size=20&from=0&more=true`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      const records = Array.isArray(data) ? data : (data.records ?? [])

      const songs = records
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

      setResults(songs)
      setSearched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song…"
          className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 text-gray-950 font-semibold rounded-lg px-5 py-3 text-sm hover:bg-yellow-300 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      {searched && results.length === 0 && !loading && (
        <p className="text-gray-500 text-sm mt-4 text-center">No results found.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((song) => {
            const noteNames = song.tuning.map(midiToNote)
            return (
              <li key={song.songId}>
                <button
                  onClick={() => onSongSelect(song)}
                  className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{song.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{song.artist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 text-xs font-mono">
                        {noteNames.join(' ')}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">{song.trackName}</p>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
