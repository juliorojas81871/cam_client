import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import { renderApp, mockFetchSuccess, mockOwnedProperties, mockLeases } from '../testUtils';
import App from '../App';

// Mock the fetch calls
beforeEach(() => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(mockFetchSuccess(mockOwnedProperties))
    .mockResolvedValueOnce(mockFetchSuccess(mockLeases));
});

describe('App Component', () => {
  test('renders without crashing', () => {
    // Mock fetch to never resolve to avoid async issues
    global.fetch = jest.fn(() => new Promise(() => {}));
    expect(() => renderApp(<App />)).not.toThrow();
  });

  test('renders navigation bar', () => {
    // Mock fetch to never resolve to avoid async issues
    global.fetch = jest.fn(() => new Promise(() => {}));
    renderApp(<App />);
    
    expect(screen.getByText('CAM Ventures')).toBeInTheDocument();
  });
}); 