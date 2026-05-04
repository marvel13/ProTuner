import { useState, useCallback } from 'react'

export function useSongsterr() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = useCallback(async (query) => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const url = `https://www.songsterr.com/api/search?pattern=${encodeURIComponent(query)}&inst=undefined&tuning=undefined&difficulty=undefined&size=20&from=0&more=true`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Songsterr request failed')
      const data = await res.json()

      const songs = data
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
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, search }
}
