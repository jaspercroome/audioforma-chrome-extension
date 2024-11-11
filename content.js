// content.js
const buffer = 2048;
const pathData = [];

// Set up an AudioContext and MediaElementAudioSourceNode
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const videoElement = document.querySelector('video');

const {height,width,top,left} = videoElement.getBoundingClientRect()

// Inject an overlay element into the YouTube page
const overlay = document.createElement('div');
overlay.id = 'audio-visualizer-overlay';
overlay.style.position = 'absolute';
overlay.style.top = top;
overlay.style.left = left;
overlay.style.width = width;
overlay.style.height = height;
overlay.style.background = d3.rgb(0,0,0,.2)
overlay.style.pointerEvents = 'none'; // Make sure it doesn't block clicks
document.body.appendChild(overlay);
addSlider(overlay)

const strongestNoteCoords = [[width/2,height/2]]

document.body.addEventListener('click', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
});

if (videoElement) {
  // Create a MediaElementAudioSourceNode from the video element
  const source = audioContext.createMediaElementSource(videoElement);

  // Initialize Meyda Analyzer
  let meydaAnalyzer;
  let keyOctaveAmplitudes;
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
            draw({keyOctaveAmplitudes, videoElement});
        }
      },
    });
    meydaAnalyzer.start();
  } catch (e) {
    console.error('Meyda initialization failed:', e);
  }

  // Connect the source to the audio context destination
  source.connect(audioContext.destination);
}
