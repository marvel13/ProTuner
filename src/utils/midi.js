const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12)

export const midiToNote = (midi) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1)

export const tuningToNotes = (arr) => arr.map(midiToNote)
