// src/integrations/local-db/__mocks__/client.ts
export const mockDbClient = {
  query: jest.fn(),
  // Add any other methods from your actual db client that are used
};

export const db = mockDbClient;
