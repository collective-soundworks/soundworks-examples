export default {
  xRange: {
    type: 'any',
    default: [0, 1],
  },
  yRange: {
    type: 'any',
    default: [0, 1],
  },
  radius: {
    type: 'float',
    min: 0,
    max: 0.5,
    default: 0.25,
  },
  rotateMap: {
    type: 'boolean',
    default: false,
  },
  pointers: {
    type: 'any',
    default: [],
  },
};
