import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { TunerInterface } from './components/TunerInterface'

export default function App() {
  const [selectedSong, setSelectedSong] = useState(null)

  if (selectedSong) {
    return <TunerInterface song={selectedSong} onBack={() => setSelectedSong(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">ProTuner</h1>
          <p className="text-gray-500 text-sm mt-1">Search a song. Tune your guitar to match.</p>
        </div>
        <SearchBar onSongSelect={setSelectedSong} />
      </div>
    </div>
  )
}
