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
    max: 4,
    default: 2,
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
