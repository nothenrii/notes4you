import { PianoKey } from '../types';

// Generate all 88 piano keys from A0 to C8
export const generatePianoKeys = (): PianoKey[] => {
  const keys: PianoKey[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // A0 to B0 (first 3 keys)
  keys.push({ note: 'A', octave: 0, isBlack: false, frequency: 27.5 });
  keys.push({ note: 'A#', octave: 0, isBlack: true, frequency: 29.14 });
  keys.push({ note: 'B', octave: 0, isBlack: false, frequency: 30.87 });

  // C1 to B7 (full octaves)
  for (let octave = 1; octave <= 7; octave++) {
    for (let i = 0; i < noteNames.length; i++) {
      const note = noteNames[i];
      const isBlack = note.includes('#');
      const frequency = 440 * Math.pow(2, (octave * 12 + i - 57) / 12);

      keys.push({
        note: note,
        octave,
        isBlack,
        frequency
      });
    }
  }

  // C8 (final key)
  keys.push({ note: 'C', octave: 8, isBlack: false, frequency: 4186.01 });

  return keys;
};

export const getNoteString = (key: PianoKey): string => {
  return `${key.note}${key.octave}`;
};