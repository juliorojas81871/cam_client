import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [buildings, setBuildings] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [buildingsResponse, leasesResponse] = await Promise.all([
        fetch('http://localhost:3001/api/buildings'),
        fetch('http://localhost:3001/api/leases')
      ]);

      if (!buildingsResponse.ok || !leasesResponse.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const buildingsData = await buildingsResponse.json();
      const leasesData = await leasesResponse.json();

      setBuildings(buildingsData.data || []);
      setLeases(leasesData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const value = {
    buildings,
    leases,
    loading,
    error,
    refetch: fetchData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 