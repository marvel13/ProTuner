import { PitchDetector } from 'pitchy'

const BUFFER_SIZE = 8192
const CLARITY_THRESHOLD = 0.9
const STABILITY_FRAMES = 2
const MEDIAN_WINDOW = 5

let activeStream = null
let activeContext = null
let activeProcessor = null

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === 'STOP_AUDIO') {
    stopAudio()
    sendResponse({ ok: true })
  }
})

startAudio().catch((e) => {
  chrome.runtime.sendMessage({ type: 'PITCH_ERROR', error: e.message })
})

async function startAudio() {
  stopAudio()
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  activeStream = stream

  const context = new AudioContext()
  activeContext = context

  const detector = PitchDetector.forFloat32Array(BUFFER_SIZE)
  const source = context.createMediaStreamSource(stream)
  const analyser = context.createAnalyser()
  analyser.fftSize = 256
  const processor = context.createScriptProcessor(BUFFER_SIZE, 1, 1)
  activeProcessor = processor

  source.connect(analyser)
  analyser.connect(processor)
  processor.connect(context.destination)

  let lastMidi = -1
  let stableFrames = 0
  const freqWindow = []

  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b)
    return s[Math.floor(s.length / 2)]
  }

  const freqBuf = new Uint8Array(analyser.frequencyBinCount)

  const send = (isSilent, hz) => {
    analyser.getByteFrequencyData(freqBuf)
    chrome.runtime.sendMessage({
      type: 'PITCH_DATA',
      isSilent,
      hz,
      freqData: Array.from(freqBuf),
    })
  }

  send(true, null)

  processor.addEventListener('audioprocess', (event) => {
    const input = event.inputBuffer.getChannelData(0)

    let sum = 0
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
    const rms = Math.sqrt(sum / input.length)

    if (rms < 0.001) {
      lastMidi = -1; stableFrames = 0; freqWindow.length = 0
      send(true, null)
      return
    }

    const [frequency, clarity] = detector.findPitch(input, context.sampleRate)

    if (frequency && clarity >= CLARITY_THRESHOLD) {
      const midi = Math.round(12 * Math.log2(frequency / 440) + 69)
      if (lastMidi !== -1 && Math.abs(midi - lastMidi) <= 2) stableFrames++
      else { stableFrames = 1; freqWindow.length = 0 }
      lastMidi = midi
      if (stableFrames >= STABILITY_FRAMES) {
        freqWindow.push(frequency)
        if (freqWindow.length > MEDIAN_WINDOW) freqWindow.shift()
        send(false, median(freqWindow))
      }
    } else {
      lastMidi = -1; stableFrames = 0; freqWindow.length = 0
      send(true, null)
    }
  })
}

function stopAudio() {
  if (activeProcessor) { activeProcessor.disconnect(); activeProcessor = null }
  if (activeStream) { activeStream.getTracks().forEach((t) => t.stop()); activeStream = null }
  if (activeContext) { activeContext.close(); activeContext = null }
}
