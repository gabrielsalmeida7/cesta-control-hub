// src/__mocks__/localStorage.ts
let store: { [key: string]: string } = {};

const localStorageMock = {
  getItem: (key: string): string | null => {
    return store[key] || null;
  },
  setItem: (key: string, value: string) => {
    store[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
  key: (index: number): string | null => {
    return Object.keys(store)[index] || null;
  },
  get length(): number {
    return Object.keys(store).length;
  }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true // Allow tests to override if necessary
});

export default localStorageMock;
