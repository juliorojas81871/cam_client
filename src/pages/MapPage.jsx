import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { 
  Box, 
  Paper, 
  Typography, 
  Alert, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  Snackbar,
} from '@mui/material';
import { useData } from '../contexts/DataContext';

const MapComponent = ({ properties, center, zoom }) => {
  const [map, setMap] = useState(null);
  const [streetView, setStreetView] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('info');
  const [showToast, setShowToast] = useState(false);
  const [isLoadingStreetView, setIsLoadingStreetView] = useState(false);
  const markersRef = useRef([]);
  const streetViewTimeoutRef = useRef(null);

  const mapRef = useCallback((node) => {
    if (node !== null && !map) {
      const newMap = new window.google.maps.Map(node, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: true,
        zoomControl: true,
      });
      setMap(newMap);

      // Create Street View service
      const streetViewService = new window.google.maps.StreetViewService();
      
      // Create info window
      const newInfoWindow = new window.google.maps.InfoWindow();
      setInfoWindow(newInfoWindow);
    }
  }, [map, center, zoom]);

  const openStreetView = useCallback((position, property) => {
    if (!map || isLoadingStreetView) return;

    // Prevent rapid clicks by setting loading state
    setIsLoadingStreetView(true);
    
    // Clear any existing timeout
    if (streetViewTimeoutRef.current) {
      clearTimeout(streetViewTimeoutRef.current);
    }

    const streetViewService = new window.google.maps.StreetViewService();
    
    // Show loading toast
    setToastMessage('Loading Street View...');
    setToastSeverity('info');
    setShowToast(true);
    
    // Check if Street View is available at this location
    streetViewService.getPanorama({
      location: position,
      radius: 100, // Increased search radius
      source: window.google.maps.StreetViewSource.OUTDOOR
    }, (data, status) => {
      if (status === 'OK') {
        // Close any existing info windows first
        if (infoWindow) {
          infoWindow.close();
        }
        
        // Hide the map temporarily and show street view
        const streetViewDiv = document.getElementById('street-view');
        streetViewDiv.style.height = '600px';
        streetViewDiv.style.overflow = 'visible';
        
        // Create or update Street View panorama
        if (!streetView) {
          const panorama = new window.google.maps.StreetViewPanorama(streetViewDiv, {
            position: position,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            visible: true,
            addressControl: true,
            enableCloseButton: true,
            panControl: true,
            zoomControl: true,
          });
          setStreetView(panorama);
          
          // Add close button functionality
          panorama.addListener('closeclick', () => {
            streetViewDiv.style.height = '0px';
            streetViewDiv.style.overflow = 'hidden';
            setToastMessage('Street View closed');
            setToastSeverity('info');
            setShowToast(true);
            setIsLoadingStreetView(false);
          });
          
        } else {
          // Wait a bit before changing position to ensure smooth transition
          streetViewTimeoutRef.current = setTimeout(() => {
            streetView.setPosition(position);
            streetView.setVisible(true);
          }, 300);
        }
        
        // Show success toast
        setToastMessage(`Street View opened for ${property.name}`);
        setToastSeverity('success');
        setShowToast(true);
        
        // Show info about the building in Street View
        const infoContent = `
          <div style="padding: 12px; max-width: 300px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${property.name}</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${property.address}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${property.type}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> ${property.status}</p>
            <div style="margin-top: 8px; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; font-size: 12px;">
              Click the X button to close Street View
            </div>
          </div>
        `;
        
        const streetViewInfoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });
        
        streetViewInfoWindow.open(streetView);
        
        // Auto-close info window after 7 seconds
        setTimeout(() => {
          streetViewInfoWindow.close();
        }, 7000);
        
        // Reset loading state after a short delay
        setTimeout(() => {
          setIsLoadingStreetView(false);
        }, 1000);
        
      } else {
        setToastMessage(`Street View not available for ${property.name}`);
        setToastSeverity('error');
        setShowToast(true);
        setIsLoadingStreetView(false);
      }
    });
  }, [map, streetView, isLoadingStreetView, infoWindow]);

  useEffect(() => {
    if (map) {
      // Always clear existing markers first to prevent accumulation
      markersRef.current.forEach(marker => {
        if (marker.setMap) {
          marker.setMap(null);
        } else if (marker.map) {
          marker.map = null;
        } else if (marker.onRemove) {
          marker.onRemove();
        }
      });
      markersRef.current = [];
      
      // Only add new markers if we have properties
      if (properties.length === 0) {
        return;
      }

      // Create new markers
      const newMarkers = properties.map(property => {
        if (!property.latitude || !property.longitude) return null;

        const position = {
          lat: parseFloat(property.latitude),
          lng: parseFloat(property.longitude)
        };

        // Try to use AdvancedMarkerElement with custom content
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
          try {
            // Create custom marker content with different colors for owned vs leased
            const markerColor = property.type === 'Owned' ? '#1976d2' : '#ff9800';
            const markerContent = document.createElement('div');
            markerContent.className = 'custom-marker';
            markerContent.innerHTML = `
              <div style="
                width: 24px; 
                height: 24px; 
                background: ${markerColor}; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                cursor: pointer;
                position: relative;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                <div style="
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 8px solid transparent;
                  border-right: 8px solid transparent;
                  border-top: 10px solid ${markerColor};
                "></div>
              </div>
            `;

            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              position,
              map,
              title: property.name,
              content: markerContent,
            });

            // Add click event for Street View
            markerContent.addEventListener('click', () => {
              openStreetView(position, property);
            });

            // Add hover events for info window
            markerContent.addEventListener('mouseover', () => {
              if (infoWindow) {
                infoWindow.setContent(`
                  <div style="padding: 12px; max-width: 280px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">${property.name}</h4>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> 
                      <span style="color: ${property.type === 'Owned' ? '#1976d2' : '#ff9800'}; font-weight: bold;">${property.type}</span>
                    </p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> ${property.status}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${property.address}</p>
                    ${property.constructionDate ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Built:</strong> ${property.constructionDate}</p>` : ''}
                    <div style="margin-top: 8px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #666;">
                      Click marker to view in Street View
                    </div>
                  </div>
                `);
                infoWindow.open({
                  anchor: marker,
                  map
                });
              }
            });

            markerContent.addEventListener('mouseout', () => {
              if (infoWindow) {
                infoWindow.close();
              }
            });

            return marker;
          } catch (error) {
            console.warn('AdvancedMarkerElement failed:', error);
          }
        }

        // Fallback to standard markers if AdvancedMarkerElement is not available
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: property.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: property.type === 'Owned' ? '#1976d2' : '#ff9800',
            fillOpacity: 0.8,
            strokeColor: 'white',
            strokeWeight: 3,
          }
        });

        // Add click event for Street View
        marker.addListener('click', () => {
          openStreetView(position, property);
        });

        // Add hover events
        marker.addListener('mouseover', () => {
          if (infoWindow) {
            infoWindow.setContent(`
              <div style="padding: 12px; max-width: 280px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${property.name}</h4>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> 
                  <span style="color: ${property.type === 'Owned' ? '#1976d2' : '#ff9800'}; font-weight: bold;">${property.type}</span>
                </p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> ${property.status}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${property.address}</p>
                ${property.constructionDate ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Built:</strong> ${property.constructionDate}</p>` : ''}
                <div style="margin-top: 8px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #666;">
                  Click marker to view in Street View
                </div>
              </div>
            `);
            infoWindow.open(map, marker);
          }
        });

        marker.addListener('mouseout', () => {
          if (infoWindow) {
            infoWindow.close();
          }
        });

        return marker;
      }).filter(Boolean);

      markersRef.current = newMarkers;
    }
  }, [map, properties, infoWindow, openStreetView]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker.map) {
          marker.map = null;
        } else if (marker.setMap) {
          marker.setMap(null);
        }
      });
      
      // Clear any pending timeouts
      if (streetViewTimeoutRef.current) {
        clearTimeout(streetViewTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseToast = () => {
    setShowToast(false);
  };

  return (
    <Box>
      <div ref={mapRef} style={{ width: '100%', height: '600px', borderRadius: '8px' }} />
      <div id="street-view" style={{ 
        width: '100%', 
        height: '0px', 
        overflow: 'hidden',
        borderRadius: '8px',
        transition: 'height 0.3s ease'
      }} />
      
      {/* Toast Notifications */}
      <Snackbar
        open={showToast}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseToast} 
          severity={toastSeverity}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const MapPage = () => {
  const { owned, leases, loading, error } = useData();
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const PROPERTIES_PER_PAGE = 200; // Limit markers for performance

  // Combine and process all properties
  const allProperties = useMemo(() => {
    // Add null checks to prevent errors when data is not yet loaded
    if (!owned || !leases) {
      return [];
    }

    // Ensure we have arrays to work with
    const ownedArray = Array.isArray(owned) ? owned : [];
    const leasesArray = Array.isArray(leases) ? leases : [];
    


    const ownedProperties = ownedArray.map(building => ({
      id: `owned-${building.id}`,
      name: building.realPropertyAssetName || building.buildingName || 'Unknown Building',
      latitude: building.latitude,
      longitude: building.longitude,
      address: `${building.streetAddress || ''}, ${building.city || ''}, ${building.state || ''} ${building.zipCode || ''}`.replace(/^,\s*/, ''),
      type: 'Owned',
      status: building.buildingStatus || 'Active',
      constructionDate: building.constructionDate,
      congressionalRep: building.congressionalDistrictRepresentativeName,
      assetType: building.realPropertyAssetType,
    }));

    const leasedProperties = leasesArray.map(lease => ({
      id: `leased-${lease.id}`,
      name: lease.cleanedBuildingName || lease.realPropertyAssetName || lease.buildingName || 'Unknown Building',
      latitude: lease.latitude,
      longitude: lease.longitude,
      address: `${lease.streetAddress || ''}, ${lease.city || lease.cityName || ''}, ${lease.state || lease.stateName || ''} ${lease.zipCode || ''}`.replace(/^,\s*/, ''),
      type: 'Leased',
      status: lease.status || 'Active',
      leaseNumber: lease.leaseNumber,
      effectiveDate: lease.leaseEffectiveDate,
      expirationDate: lease.leaseExpirationDate,
    }));

    return [...ownedProperties, ...leasedProperties].filter(property => 
      property.latitude && 
      property.longitude && 
      !isNaN(parseFloat(property.latitude)) && 
      !isNaN(parseFloat(property.longitude)) &&
      // Filter to continental US bounds (roughly)
      parseFloat(property.latitude) >= 24.396308 && 
      parseFloat(property.latitude) <= 49.384358 &&
      parseFloat(property.longitude) >= -125.0 && 
      parseFloat(property.longitude) <= -66.93457
    );
  }, [owned, leases]);

  // Apply filters
  const filteredProperties = useMemo(() => {
    return allProperties.filter(property => {
      if (propertyTypeFilter !== 'all' && property.type !== propertyTypeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && property.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [allProperties, propertyTypeFilter, statusFilter]);

  // Paginate properties for performance
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
    return filteredProperties.slice(startIndex, startIndex + PROPERTIES_PER_PAGE);
  }, [filteredProperties, currentPage, PROPERTIES_PER_PAGE]);

  const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handlePropertyTypeFilterChange = (event) => {
    setPropertyTypeFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const owned = filteredProperties.filter(p => p.type === 'Owned').length;
    const leased = filteredProperties.filter(p => p.type === 'Leased').length;
    return {
      total: filteredProperties.length,
      owned,
      leased,
    };
  }, [filteredProperties]);

  // Map center (continental US)
  const center = useMemo(() => {
    return { lat: 39.8283, lng: -98.5795 }; // Geographic center of USA
  }, []);

  const zoom = useMemo(() => {
    return 4; // Zoom level 4 shows the entire continental United States
  }, []);

  const render = (status) => {
    if (status === Status.LOADING) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="600px">
          <Typography>Loading map...</Typography>
        </Box>
      );
    }

    if (status === Status.FAILURE) {
      return (
        <Alert severity="error">
          Failed to load Google Maps. Please check your API key configuration.
        </Alert>
      );
    }

    return <MapComponent properties={paginatedProperties} center={center} zoom={zoom} />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading property data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Property Locations Map
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Interactive map showing all property locations with Street View integration
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Property Type</InputLabel>
          <Select
            value={propertyTypeFilter}
            label="Property Type"
            onChange={handlePropertyTypeFilterChange}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="Owned">Owned</MenuItem>
            <MenuItem value="Leased">Leased</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary">
          Showing {paginatedProperties.length} of {filteredProperties.length} properties (Page {currentPage} of {totalPages})
        </Typography>
      </Box>

      {/* Legend */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 20, 
            height: 20, 
            backgroundColor: '#1976d2', 
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }} />
          <Typography variant="body2">Owned Properties</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 20, 
            height: 20, 
            backgroundColor: '#ff9800', 
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }} />
          <Typography variant="body2">Leased Properties</Typography>
        </Box>
      </Box>

      {/* Map */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Interactive Property Map
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click on any marker to view the property in Google Street View. Hover for property details.
        </Typography>
        <Wrapper
          apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          render={render}
        />
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Page {currentPage} of {totalPages} • {PROPERTIES_PER_PAGE} properties per page
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MapPage; 