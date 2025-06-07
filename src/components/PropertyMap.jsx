import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Box, Paper, Typography, Alert } from '@mui/material';

const MapComponent = ({ properties, center, zoom }) => {
  const [map, setMap] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const markersRef = useRef([]);

  const mapRef = useCallback((node) => {
    if (node !== null && !map) {
      const newMap = new window.google.maps.Map(node, {
        center,
        zoom,
        mapTypeId: 'satellite',
      });
      setMap(newMap);

      // Create info window
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

            // Add hover events
            markerContent.addEventListener('mouseover', () => {
              if (infoWindow) {
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

        // If AdvancedMarkerElement is not available, create a custom overlay
        class CustomMarker extends window.google.maps.OverlayView {
          constructor(position, map, property) {
            super();
            this.position = position;
            this.property = property;
            this.div = null;
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

            // Add hover events
            this.div.addEventListener('mouseover', () => {
              if (infoWindow) {
                infoWindow.setContent(`
                  <div style="padding: 8px; max-width: 250px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">${this.property.name}</h4>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> ${this.property.buildingStatus || 'Active'}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${this.property.realPropertyAssetType || 'Building'}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${this.property.address}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Congressional District Rep:</strong> ${this.property.congressionalDistrictRepresentativeName || 'N/A'}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Construction Date:</strong> ${this.property.constructionDate || 'N/A'}</p>
                  </div>
                `);
                infoWindow.setPosition(this.position);
                infoWindow.open(map);
              }
            });

            this.div.addEventListener('mouseout', () => {
              if (infoWindow) {
                infoWindow.close();
              }
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

        return new CustomMarker(position, map, property);
      }).filter(Boolean);

      markersRef.current = newMarkers;
    }
  }, [map, properties, infoWindow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker.map) {
          marker.map = null;
        }
      });
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
};

const PropertyMap = ({ properties }) => {
  // Calculate center point from properties
  const center = useMemo(() => {
    if (properties.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // Center of USA
    }

    const validProperties = properties.filter(p => p.latitude && p.longitude);
    if (validProperties.length === 0) {
      return { lat: 39.8283, lng: -98.5795 };
    }

    const avgLat = validProperties.reduce((sum, p) => sum + parseFloat(p.latitude), 0) / validProperties.length;
    const avgLng = validProperties.reduce((sum, p) => sum + parseFloat(p.longitude), 0) / validProperties.length;

    return { lat: avgLat, lng: avgLng };
  }, [properties]);

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

    return <MapComponent properties={properties} center={center} zoom={6} />;
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