import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, mockFetchSuccess, mockOwnedProperties, mockLeases, userEvent } from '../../testUtils';
import PropertiesPage from '../../pages/PropertiesPage';

// Mock data that matches the expected structure
const testOwnedData = [
  {
    id: 1,
    cleanedBuildingName: 'Test Building 1',
    streetAddress: '123 Test St',
    city: 'Test City',
    state: 'TX',
    zipCode: '12345',
    constructionDate: '2010',
    ownedOrLeased: 'F',
  },
  {
    id: 2,
    realPropertyAssetName: 'Test Building 2',
    streetAddress: '456 Test Ave',
    city: 'Test City',
    state: 'TX',
    zipCode: '12346',
    constructionDate: '2015',
    ownedOrLeased: 'F',
  },
];

const testLeasesData = [
  {
    id: 1,
    cleanedBuildingName: 'Test Leased Building 1',
    streetAddress: '789 Lease St',
    city: 'Test City',
    state: 'TX',
    zipCode: '12347',
    constructionDate: '2020',
  },
];

describe('PropertiesPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(mockFetchSuccess(testOwnedData))
      .mockResolvedValueOnce(mockFetchSuccess(testLeasesData));
  });

  test('shows loading state initially', () => {
    // Mock fetch to never resolve to keep loading state
    global.fetch = jest.fn(() => new Promise(() => {}));
    renderWithProviders(<PropertiesPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders basic page structure when loaded', async () => {
    renderWithProviders(<PropertiesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Properties Overview')).toBeInTheDocument();
    });
  });

  test('handles error state', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));
    
    renderWithProviders(<PropertiesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
}); 