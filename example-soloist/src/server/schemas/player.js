export default {
  id: {
    type: 'integer',
    min: 0,
    max: Infinity,
    step: 1,
    nullable: true,
    default: null,
  },
  position: {
    type: 'any',
    default: null,
    nullable: true,
  },
  distance: {
    type: 'float',
    default: 1,
  },
};
