# ProTuner

**Guitar tuning assistant powered by real-time pitch detection.**

Search any song, get the tuning it requires, and tune your guitar string-by-string with your microphone — available as both a web app and a Chrome extension that works right on YouTube.

---

https://github.com/user-attachments/assets/5507f5ee-f9eb-4905-b15f-5eef9fabe86a

---

## Features

- **Song search** — find any song via the Songsterr catalog and load its guitar tuning automatically
- **Real-time pitch detection** — microphone input analyzed with Aubio, displaying live frequency bars and a tuning needle
- **String-by-string guidance** — auto-detects which string you're playing; notifies you when each one lands in tune
- **Chrome extension** — installs a popup that pre-fills the search from the current YouTube tab title, so you can tune while watching a lesson
- **Offline-capable audio pipeline** — audio processing runs in an offscreen worker, keeping the popup responsive

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Pitch detection | Aubio (WASM) + Pitchy |
| Audio | Web Audio API |
| Song data | Songsterr API (via Cloudflare Workers proxy) |
| Extension | Manifest V3, offscreen document |

## Getting Started

### Web App

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Chrome Extension

```bash
npm run build:extension
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select `extension/dist`

## How It Works

1. Type a song name — results come from Songsterr's guitar catalog
2. Select a song to load the required tuning (e.g. Drop D, Open G)
3. Click **Start Tuning** and allow microphone access
4. Play each string one at a time — the needle and frequency display show how far off you are
5. A toast notification fires when a string is in tune; the app automatically moves to the next string

Audio processing runs in a Web Worker (extension) or directly on the `AudioContext` (web app), keeping the UI thread free.

## Project Structure

```
├── src/                  # Web app
│   ├── components/       # TunerInterface, SearchBar, StringDisplay, …
│   ├── hooks/            # usePitchDetector, useSongsterr
│   └── utils/            # MIDI / frequency helpers
├── extension/            # Chrome extension
│   ├── src/              # popup.jsx, offscreen.js, useOffscreenPitch.js
│   └── public/           # aubio.min.js, icons
└── protuner-promo/       # Promotional video (HyperFrames)
```
