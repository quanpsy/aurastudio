import { PHI } from '../constants';

export const calculateFibonacciSequence = (length: number): number[] => {
  const sequence = [1, 1];
  for (let i = 2; i < length; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }
  return sequence;
};

export const getGoldenRatioPoints = (length: number): number[] => {
  const points: number[] = [];
  let current = 0;
  for (let i = 0; i < length; i++) {
    current = (current + PHI) % 1;
    points.push(current);
  }
  return points.sort((a, b) => a - b);
};

export const euclideanRhythm = (onsets: number, totalPulses: number): number[] => {
  const pattern = new Array(totalPulses).fill(0);
  let bucket = 0;
  for (let i = 0; i < totalPulses; i++) {
    bucket += onsets;
    if (bucket >= totalPulses) {
      bucket -= totalPulses;
      pattern[i] = 1;
    }
  }
  return pattern;
};