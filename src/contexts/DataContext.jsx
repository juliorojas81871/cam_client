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
  const [owned, setOwned] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ownedResponse, leasesResponse] = await Promise.all([
        fetch(process.env.REACT_APP_OWNED_API_URL),
        fetch(process.env.REACT_APP_LEASES_API_URL)
      ]);

      if (!ownedResponse.ok || !leasesResponse.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const ownedData = await ownedResponse.json();
      const leasesData = await leasesResponse.json();

      setOwned(ownedData.data || []);
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
    owned,
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