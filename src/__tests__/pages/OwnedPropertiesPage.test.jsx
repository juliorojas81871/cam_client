import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockFetchSuccess } from '../../testUtils';
import OwnedPropertiesPage from '../../pages/OwnedPropertiesPage';

// Mock Recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

// Mock PropertyMap component
jest.mock('../../components/PropertyMap', () => {
  return {
    __esModule: true,
    default: function MockPropertyMap({ properties }) {
      return <div data-testid="property-map">Property Map with {properties.length} properties</div>;
    }
  };
});

const mockOwnedData = [
  {
    id: 1,
    cleanedBuildingName: 'Test Building 1',
    streetAddress: '123 Test St',
    city: 'Test City',
    state: 'TX',
    zipCode: '12345',
    constructionDate: '2010',
    totalSquareFootage: 50000,
    availableSquareFootage: 10000,
    latitude: 32.7767,
    longitude: -96.7970,
  },
  {
    id: 2,
    realPropertyAssetName: 'Test Building 2',
    streetAddress: '456 Test Ave',
    city: 'Test City',
    state: 'TX',
    zipCode: '12346',
    constructionDate: '2015',
    totalSquareFootage: 75000,
    availableSquareFootage: 25000,
    latitude: 32.7857,
    longitude: -96.8089,
  },
];

describe('OwnedPropertiesPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(mockFetchSuccess(mockOwnedData))
      .mockResolvedValueOnce(mockFetchSuccess([])); // Empty leases for this test
  });

  test('shows loading state initially', () => {
    // Mock fetch to never resolve to keep loading state
    global.fetch = jest.fn(() => new Promise(() => {}));
    renderWithProviders(<OwnedPropertiesPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders basic dashboard structure when loaded', async () => {
    renderWithProviders(<OwnedPropertiesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Owned Properties Dashboard')).toBeInTheDocument();
    });
  });

  test('handles error state', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));
    
    renderWithProviders(<OwnedPropertiesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
}); 