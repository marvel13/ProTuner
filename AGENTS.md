# ProTuner

A web app that lets users search for songs, see the guitar tuning used, and interactively tune their guitar to match — using their device microphone.

## What It Does

1. User searches for a song (e.g. "Down With The Sickness by Disturbed")
2. App displays the guitar tuning for that song (e.g. Drop C# → C# Ab Db Gb Bb Eb)
3. User clicks **"Tune My Guitar To This"**
4. A tuner interface activates, using the microphone to detect pitch string-by-string and guide the user to match the song's exact tuning

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Song + Tuning Data | Songsterr API |
| Pitch Detection | [pitchy](https://github.com/ianprime0509/pitchy) |
| Mic Access | Web Audio API (`getUserMedia`) |

---

## Songsterr API

### Search Endpoint

```
GET https://www.songsterr.com/api/search?pattern={query}&inst=undefined&tuning=undefined&difficulty=undefined&size=20&from=0&more=true
```

No authentication required.

### Response Schema

```json
{
  "songId": 297,
  "artistId": 137,
  "artist": "Goo Goo Dolls",
  "title": "Iris",
  "hasChords": true,
  "hasPlayer": true,
  "isJunk": false,
  "defaultTrack": 1,
  "popularTrack": 1,
  "popularTrackGuitar": 1,
  "popularTrackBass": 4,
  "popularTrackDrum": 10,
  "popularTrackVocals": 0,
  "tracks": [
    {
      "instrumentId": 25,
      "instrument": "Acoustic Guitar (steel)",
      "views": 155881,
      "name": "John Rzeznik (Ac. Guitar)",
      "tuning": [62, 62, 50, 50, 38, 35],
      "difficulty": 3,
      "hash": "guitar_fPxsBZVI"
    }
  ]
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `popularTrackGuitar` | Index into `tracks[]` for the most-viewed guitar track — use this to auto-select the right track |
| `tracks[n].tuning` | MIDI note array, ordered **high string → low string** (string 1 to string 6) |
| `tracks[n].difficulty` | 1–5 scale, not always present |
| `tracks[n].views` | Use to rank search results by popularity |
| `tracks[n].instrument` | Filter by strings containing `"Guitar"` to exclude bass/drums |
| `isJunk` | Filter out low-quality user-submitted entries |
| `hash` | Unique track ID — may allow fetching full tab data |

### Tuning Format

Tuning arrays contain **MIDI note numbers**, high string first:

```
Standard:  [64, 59, 55, 50, 45, 40]  →  E4 B3 G3 D3 A2 E2
Drop D:    [64, 59, 55, 50, 45, 38]  →  E4 B3 G3 D3 A2 D2
Drop C#:   [63, 58, 54, 49, 44, 37]  →  Eb4 Bb3 Gb3 Db3 Ab2 C#2  (Down With The Sickness)
Eb Std:    [63, 58, 54, 49, 44, 39]  →  Eb4 Bb3 Gb3 Db3 Ab2 Eb2
Drop B:    [61, 56, 52, 47, 42, 35]  →  B3 Ab3 E3 B2 F#2 B1
BDDDDD:    [62, 62, 50, 50, 38, 35]  →  D4 D4 D3 D3 D2 B1        (Iris - Goo Goo Dolls)
```

### MIDI Conversions

**MIDI → Frequency (Hz):**
```js
const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12)
```

**MIDI → Note Name:**
```js
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const midiToNote = (midi) => {
  const octave = Math.floor(midi / 12) - 1
  return NOTE_NAMES[midi % 12] + octave
}
```

---

## Tuner Logic

- Access mic via `navigator.mediaDevices.getUserMedia({ audio: true })`
- Feed audio into Web Audio API `AnalyserNode`
- Use **pitchy** to detect fundamental frequency from the audio buffer
- Compare detected Hz against target Hz for the current string
- Show: in tune / sharp / flat with a needle/indicator UI
- Walk user through strings one at a time (or let them tap to select)

---

## Example Songs Researched

| Song | Artist | Tuning | Notes |
|------|--------|--------|-------|
| Down With The Sickness | Disturbed | Drop C# | `[63,58,54,49,44,37]` — Eb standard, low string dropped to C# |
| Iris | Goo Goo Dolls | B D D D D D | `[62,62,50,50,38,35]` — 5 strings all D, low string B |
| Sweet Child O' Mine | Guns N' Roses | Eb Standard | `[63,58,54,49,44,39]` — all strings down 1 semitone |
| Master of Puppets | Metallica | Standard | `[64,59,55,50,45,40]` |
