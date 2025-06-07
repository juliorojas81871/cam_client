import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { DataProvider } from './contexts/DataContext';
import Navbar from './components/Navbar';
import PropertiesPage from './pages/PropertiesPage';
import MapPage from './pages/MapPage';
import OwnedPropertiesPage from './pages/OwnedPropertiesPage';
import LeasedPropertiesPage from './pages/LeasedPropertiesPage';

// Create a theme instance
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

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DataProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Navbar />
          <Container sx={{ mt: 4 }}>
            <Routes>
              <Route path="/" element={<PropertiesPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/owned" element={<OwnedPropertiesPage />} />
              <Route path="/leased" element={<LeasedPropertiesPage />} />
            </Routes>
          </Container>
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App; 