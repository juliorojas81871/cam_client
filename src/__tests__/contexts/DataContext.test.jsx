import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DataProvider, useData } from '../../contexts/DataContext';
import { mockFetchSuccess, mockFetchError, mockOwnedProperties, mockLeases } from '../../testUtils';

// Test component that uses the context
const TestComponent = () => {
  const { owned, leases, loading, error, refetch } = useData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <div>Owned: {owned.length}</div>
      <div>Leases: {leases.length}</div>
      <button onClick={refetch}>Refetch</button>
    </div>
  );
};

describe('DataContext', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('provides initial loading state', () => {
    global.fetch
      .mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state

    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('fetches and provides data successfully', async () => {
    global.fetch
      .mockResolvedValueOnce(mockFetchSuccess(mockOwnedProperties))
      .mockResolvedValueOnce(mockFetchSuccess(mockLeases));

    await act(async () => {
      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Owned: 2')).toBeInTheDocument();
      expect(screen.getByText('Leases: 2')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(process.env.REACT_APP_OWNED_API_URL);
    expect(global.fetch).toHaveBeenCalledWith(process.env.REACT_APP_LEASES_API_URL);
  });

  test('handles fetch errors', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  test('handles non-ok responses', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false });

    await act(async () => {
      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch data from server')).toBeInTheDocument();
    });
  });

  test('handles missing data property in response', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}), // No data property
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}), // No data property
      });

    await act(async () => {
      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Owned: 0')).toBeInTheDocument();
      expect(screen.getByText('Leases: 0')).toBeInTheDocument();
    });
  });

  test('refetch functionality works', async () => {
    global.fetch
      .mockResolvedValueOnce(mockFetchSuccess(mockOwnedProperties))
      .mockResolvedValueOnce(mockFetchSuccess(mockLeases))
      .mockResolvedValueOnce(mockFetchSuccess([...mockOwnedProperties, { id: 3, name: 'New Building' }]))
      .mockResolvedValueOnce(mockFetchSuccess(mockLeases));

    await act(async () => {
      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );
    });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Owned: 2')).toBeInTheDocument();
    });

    // Click refetch button
    await act(async () => {
      screen.getByText('Refetch').click();
    });

    // Wait for refetch to complete
    await waitFor(() => {
      expect(screen.getByText('Owned: 3')).toBeInTheDocument();
    });
  });

  test('throws error when useData is used outside DataProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useData must be used within a DataProvider');

    console.error = originalError;
  });
}); 