import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Box, Paper, Typography, Alert } from '@mui/material';

const MapComponent = ({ properties, center, zoom }) => {
  const [map, setMap] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const markersRef = useRef([]);
  const hoverTimeoutRef = useRef(null);
  const currentHoveredMarker = useRef(null);

  // Helper functions for stable hover behavior
  const showInfoWindow = useCallback((property, marker, position = null) => {
    if (!infoWindow) return;
    
    // Clear any pending hide timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Don't show if we're already showing this marker
    if (currentHoveredMarker.current === marker) return;
    
    currentHoveredMarker.current = marker;
    
    infoWindow.setContent(`
      <div style="padding: 8px; max-width: 250px;">
        <h4 style="margin: 0 0 8px 0; color: #333;">${property.name}</h4>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> ${property.buildingStatus || 'Active'}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${property.realPropertyAssetType || 'Building'}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${property.address}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Congressional District Rep:</strong> ${property.congressionalDistrictRepresentativeName || 'N/A'}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Construction Date:</strong> ${property.constructionDate || 'N/A'}</p>
      </div>
    `);
    
    if (position) {
      infoWindow.setPosition(position);
      infoWindow.open(map);
    } else {
      infoWindow.open({
        anchor: marker,
        map
      });
    }
  }, [infoWindow, map]);
  
  const hideInfoWindow = useCallback(() => {
    // Add a small delay before hiding to prevent flickering
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      if (infoWindow) {
        infoWindow.close();
        currentHoveredMarker.current = null;
      }
    }, 100); // 100ms delay
  }, [infoWindow]);

  const mapRef = useCallback((node) => {
    if (node !== null && !map) {
      const newMap = new window.google.maps.Map(node, {
        center,
        zoom,
        mapTypeId: 'satellite',
      });
      setMap(newMap);
  
      // 🔧 Inject styles to fix InfoWindow behavior
      const style = document.createElement('style');
      style.innerHTML = `
        .gm-style .gm-style-iw {
          pointer-events: none !important;
        }
        .gm-style .gm-ui-hover-effect {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
  
      const newInfoWindow = new window.google.maps.InfoWindow();
      setInfoWindow(newInfoWindow);
    }
  }, [map, center, zoom]);
  
  

  useEffect(() => {
    if (map && properties.length > 0) {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker.map) {
          marker.map = null;
        } else if (marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // Create new markers using AdvancedMarkerElement or custom HTML markers
      const newMarkers = properties.map(property => {
        if (!property.latitude || !property.longitude) return null;

        const position = {
          lat: parseFloat(property.latitude),
          lng: parseFloat(property.longitude)
        };

        // Try to use AdvancedMarkerElement with custom content
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
          try {
            // Create custom marker content
            const markerContent = document.createElement('div');
            markerContent.className = 'custom-marker';
            markerContent.innerHTML = `
              <div style="
                width: 20px; 
                height: 20px; 
                background: #dc004e; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                position: relative;
              ">
                <div style="
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 8px solid #dc004e;
                "></div>
              </div>
            `;

            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              position,
              map,
              title: property.name,
              content: markerContent,
            });

            // Add stable hover events
            markerContent.addEventListener('mouseenter', () => {
              showInfoWindow(property, marker);
            });

            markerContent.addEventListener('mouseleave', () => {
              hideInfoWindow();
            });
            
            // Also handle the info window hover to prevent closing when user hovers over it
            markerContent.addEventListener('mouseover', (e) => {
              e.stopPropagation();
            });

            return marker;
          } catch (error) {
            console.warn('AdvancedMarkerElement failed:', error);
          }
        }

        // If AdvancedMarkerElement is not available, create a custom overlay
        class CustomMarker extends window.google.maps.OverlayView {
          constructor(position, map, property, showInfoCallback, hideInfoCallback) {
            super();
            this.position = position;
            this.property = property;
            this.div = null;
            this.showInfoCallback = showInfoCallback;
            this.hideInfoCallback = hideInfoCallback;
            this.setMap(map);
          }

          onAdd() {
            this.div = document.createElement('div');
            this.div.style.position = 'absolute';
            this.div.style.cursor = 'pointer';
            this.div.innerHTML = `
              <div style="
                width: 20px; 
                height: 20px; 
                background: #dc004e; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                position: relative;
              ">
                <div style="
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 8px solid #dc004e;
                "></div>
              </div>
            `;

            // Add stable hover events for custom overlay
            this.div.addEventListener('mouseenter', () => {
              this.showInfoCallback(this.property, this, this.position);
            });

            this.div.addEventListener('mouseleave', () => {
              this.hideInfoCallback();
            });

            const panes = this.getPanes();
            panes.overlayMouseTarget.appendChild(this.div);
          }

          draw() {
            const overlayProjection = this.getProjection();
            const pos = overlayProjection.fromLatLngToDivPixel(this.position);
            
            if (pos && this.div) {
              this.div.style.left = (pos.x - 13) + 'px';
              this.div.style.top = (pos.y - 33) + 'px';
            }
          }

          onRemove() {
            if (this.div) {
              this.div.parentNode.removeChild(this.div);
              this.div = null;
            }
          }
        }

        return new CustomMarker(position, map, property, showInfoWindow, hideInfoWindow);
      }).filter(Boolean);

      markersRef.current = newMarkers;
    }
  }, [map, properties, infoWindow, showInfoWindow, hideInfoWindow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker.map) {
          marker.map = null;
        }
      });
      
      // Clear any pending timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
};

const PropertyMap = ({ properties }) => {
  // Always center on USA for initial view
  const center = useMemo(() => {
    return { lat: 39.8283, lng: -98.5795 }; // Geographic center of USA
  }, []);

  // Calculate zoom level to show all of USA
  const zoom = useMemo(() => {
    return 4; // Zoom level 4 shows the entire continental United States
  }, []);

  const render = (status) => {
    if (status === Status.LOADING) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="500px">
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

    return <MapComponent properties={properties} center={center} zoom={zoom} />;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Property Locations Map
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Hover over markers to see building details
      </Typography>
      <Wrapper
        apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        render={render}
      />
    </Paper>
  );
};

export default PropertyMap; 