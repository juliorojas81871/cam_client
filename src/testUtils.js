import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { DataProvider } from './contexts/DataContext';

// Create theme for testing
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <DataProvider>
          {children}
        </DataProvider>
      </BrowserRouter>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Custom render without DataProvider (for isolated component testing)
export const renderWithThemeAndRouter = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {children}
      </BrowserRouter>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock data for testing
export const mockOwnedProperties = [
  {
    id: 1,
    name: 'Test Building 1',
    address: '123 Test St, Test City, TX 12345',
    constructionDate: '2010-01-01',
    totalSquareFootage: 50000,
    availableSquareFootage: 10000,
    latitude: 32.7767,
    longitude: -96.7970,
  },
  {
    id: 2,
    name: 'Test Building 2',
    address: '456 Test Ave, Test City, TX 12346',
    constructionDate: '2015-06-15',
    totalSquareFootage: 75000,
    availableSquareFootage: 25000,
    latitude: 32.7857,
    longitude: -96.8089,
  },
];

export const mockLeases = [
  {
    id: 1,
    tenant: 'Test Tenant 1',
    buildingName: 'Test Building 1',
    buildingAddress: '123 Test St, Test City, TX 12345',
    leaseStart: '2023-01-01',
    leaseEnd: '2025-12-31',
    status: 'Active',
    squareFootage: 5000,
    monthlyRent: 10000,
  },
  {
    id: 2,
    tenant: 'Test Tenant 2',
    buildingName: 'Test Building 2',
    buildingAddress: '456 Test Ave, Test City, TX 12346',
    leaseStart: '2023-06-01',
    leaseEnd: '2024-05-31',
    status: 'Expired',
    squareFootage: 3000,
    monthlyRent: 7500,
  },
];

// Mock fetch responses
export const mockFetchSuccess = (data) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data }),
  });
};

export const mockFetchError = (error = 'Network error') => {
  return Promise.reject(new Error(error));
};

// Custom render for App component (no router since App includes it)
export const renderApp = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event'; 