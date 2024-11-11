const noteNames = {
  0: 'C',
  1: 'C#',
  2: 'D',
  3: 'D#',
  4: "E",
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'G#',
  9: 'A',
  10: 'A#',
  11: 'B',
};
 const noteAngles = {
  'C': 0,
  'C#': 210,
  'D': 60,
  'D#': 270,
  'E': 120,
  'F': 330,
  'F#': 180,
  'G': 30,
  'G#': 240,
  'A': 90,
  'A#': 300,
  'B': 150,
};
 const NOTE_FREQUENCIES = {
  'C': 16.35,
  'D': 18.35,
  'E': 20.6,
  'F': 21.83,
  'G': 24.5,
  'A': 27.5,
  'B': 30.87,
  'C#': 17.32,
  'D#': 19.45,
  'F#': 23.12,
  'G#': 25.96,
  'A#': 29.14,
};

const octaves = [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) => b - a);

const frequencyToNote = (frequency) => {
  // Find the base frequency (C0) and calculate how many semitones above it our frequency is
  const baseFreq = NOTE_FREQUENCIES['C'];
  const semitones = 12 * Math.log2(frequency / baseFreq);

  // Calculate the octave and the note within that octave
  const octave = Math.floor(semitones / 12);
  const noteIndex = Math.round(semitones % 12);

  // Get the actual note name
  const note = noteNames[noteIndex];

  // Calculate cents (how far off from the exact note frequency we are)
  const exactFrequency =
    NOTE_FREQUENCIES[note] *
    Math.pow(2, octave);
  const cents = Math.round(1200 * Math.log2(frequency / exactFrequency));

  return { note, octave, cents };
};

const processPowerSpectrum = (
  amplitudeSpectrum,
  audioContext,
) => {
  const sampleRate = audioContext.sampleRate;
  const binSize = sampleRate / (2 * amplitudeSpectrum.length);

  const keyOctaveAmps = {};

  amplitudeSpectrum.forEach((amplitude, index) => {
    const frequency = index * binSize;

    // Only process frequencies within the range of musical instruments
    if (frequency >= 20 && frequency <= 20000) {
      const { note, octave, cents } = frequencyToNote(frequency);
      const key = `${note}${octave}`;

      // Only consider amplitudes above a certain threshold to reduce noise
      if (amplitude > 0.01) {
        if (!keyOctaveAmps[key]) {
          keyOctaveAmps[key] = 0;
        }
        // Weight the amplitude based on how close it is to the exact note frequency
        const weight = 1 - Math.abs(cents) / 50; // 50 cents = quarter tone
        keyOctaveAmps[key] += amplitude * weight;
      }
    }
  });

  return keyOctaveAmps;
};

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}