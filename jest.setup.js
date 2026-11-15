/* global jest */
jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async key => values.get(key) ?? null),
      setItem: jest.fn(async (key, value) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async key => {
        values.delete(key);
      }),
      getAllKeys: jest.fn(async () => [...values.keys()]),
      clear: jest.fn(async () => values.clear()),
    },
  };
});
global.IS_REACT_ACT_ENVIRONMENT = true;
