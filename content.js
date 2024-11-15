// content.js
const buffer = 2048;
const pathData = [];
const dimensions = {
  height: 0,
  width: 0,
  top: 0,
  left: 0,
};
const strongestNoteCoords = [[]];
let checkCount = 0;
let videoElement = document.querySelector('video');
let minimized = false;
// Initialize Meyda Analyzer
let meydaAnalyzer;
let keyOctaveAmplitudes;
let source;
let audioContext;

function isYouTubeVideoPage() {
  const url = window.location.href;
  return /https:\/\/www\.youtube\.com\/watch\?v=/.test(url);
}

const resizeListener = () => {
  const box = videoElement.getBoundingClientRect();
  const overlay = document.getElementById('audio-visualizer-overlay');
  overlay.style.top = `${box.top}px`;
  overlay.style.left = `${box.left}px`;
  overlay.style.width = `${box.width}px`;
  overlay.style.height = `${box.height}px`;
};
const bodyClickListener = () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
};
const mouseMoveListener = () => {
  if (isYouTubeVideoPage()) {
    if (videoElement == null) {
      console.log("[Af] checking for video, since you're here");
      const videoElement = document.querySelector('video');
      if (videoElement) {
        initialize();
      }
    }
  }
};

const cleanup = () => {
  console.info('[AF] cleaning up audioforma');

  // Stop and disconnect audio processing
  if (meydaAnalyzer) {
    meydaAnalyzer.stop();
    meydaAnalyzer = null;
  }

  if (source) {
    source.disconnect();
    source = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  // Remove overlay
  const overlay = document.getElementById('audio-visualizer-overlay');
  if (overlay) {
    overlay.remove();
  }

  const svg = document.getElementById('audioForma-visual');
  if (svg) {
    svg.remove();
  }

  // Remove event listeners
  window.removeEventListener('resize', resizeListener);
  document.body.removeEventListener('click', bodyClickListener);
  window.removeEventListener('mousemove', mouseMoveListener);

  videoElement = null;
};

const initialize = () => {
  cleanup();
  console.info('[AF] initializing audioforma');
  videoElement = document.querySelector('video');
  const box = videoElement.getBoundingClientRect();

  // Inject an overlay element into the YouTube page
  const overlay = document.createElement('div');
  overlay.id = 'audio-visualizer-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = `${box.top}px`;
  overlay.style.left = `${box.left}px`;
  overlay.style.width = `${box.width}px`;
  overlay.style.height = `${box.height}px`;
  overlay.style.background = d3.rgb(0, 0, 0, 0.05);
  overlay.style.pointerEvents = 'none';
  document.body.appendChild(overlay);

  // addSlider(overlay);
  addResizeButton(overlay);

  window.addEventListener('resize', resizeListener);

  // Set up an AudioContext and MediaElementAudioSourceNode
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaElementSource(videoElement);

  document.body.addEventListener('click', bodyClickListener);

  try {
    meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: audioContext,
      source: source,
      bufferSize: buffer, // You can adjust this for performance
      featureExtractors: ['chroma', 'powerSpectrum'],
      callback: (features) => {
        if (features) {
          keyOctaveAmplitudes = processPowerSpectrum(
            features.powerSpectrum,
            audioContext,
          );
          // Handle the extracted audio features
          draw({ keyOctaveAmplitudes, videoElement, overlay });
        }
      },
    });
    meydaAnalyzer.start();
  } catch (e) {
    console.error('[AF] Meyda initialization failed:', e);
    cleanup();
  }

  // Connect the source to the audio context destination
  source.connect(audioContext.destination);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cleanup();
    }
  });
};

if (videoElement) {
  initialize();
  // Add cleanup handlers for navigation and video ended
  videoElement.addEventListener('ended', cleanup);
  videoElement.addEventListener('pause', cleanup);
}

window.addEventListener('mousemove', mouseMoveListener);

// Cleanup on extension unload
// Add cleanup handlers for page unload and visibility changes
window.addEventListener('unload', cleanup);
window.addEventListener('beforeunload', cleanup);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cleanup();
  }
});
