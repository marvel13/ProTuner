import { midiToNote } from '../utils/midi'

export function TuningDisplay({ tuning, activeIndex, onStringSelect }) {
  return (
    <div className="flex justify-center gap-3">
      {[...tuning].reverse().map((midi, reversedI) => {
        const i = tuning.length - 1 - reversedI
        const note = midiToNote(midi)
        const isActive = i === activeIndex
        return (
          <button
            key={i}
            onClick={() => onStringSelect(i)}
            className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              isActive
                ? 'bg-gray-700 ring-2 ring-yellow-400'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <span className="text-gray-500 text-xs">S{i + 1}</span>
            <span
              className={`text-base font-bold font-mono ${
                isActive ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              {note.replace(/[0-9]/g, '')}
            </span>
            <span className="text-gray-600 text-xs">{midi}</span>
          </button>
        )
      })}
    </div>
  )
}
