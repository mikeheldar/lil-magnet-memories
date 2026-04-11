/**
 * Geolocation Utilities
 * Functions for working with user location and distance calculations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return Math.round(distance);
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}m`;
  } else if (meters < 10000) {
    return `${(meters / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(meters / 1000)}km`;
  }
};

/**
 * Get user's current location using HTML5 Geolocation API
 * @returns {Promise<{lat: number, lng: number}>} User's coordinates
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    // SSR Safety: navigator is only available on client
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
};

/**
 * Get distance description based on meters
 * @param {number} meters - Distance in meters
 * @returns {string} Description of distance
 */
export const getDistanceDescription = (meters) => {
  if (meters < 100) {
    return 'Very close!';
  } else if (meters < 500) {
    return 'Nearby';
  } else if (meters < 1000) {
    return 'Short walk';
  } else if (meters < 5000) {
    return 'Close by';
  } else {
    return 'Distance';
  }
};

/**
 * Geocode an address to get coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}>} Coordinates
 */
export const geocodeAddress = async (address) => {
  if (!address || address.trim() === '') {
    throw new Error('Address is required');
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'LilMagnetMemories/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();

    if (data.length === 0) {
      throw new Error('Address not found');
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to a human-readable address.
 * Uses OpenStreetMap Nominatim (same service as geocodeAddress).
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} display_name from Nominatim
 */
export const reverseGeocodeCoordinates = async (lat, lng) => {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (
    lat == null ||
    lng == null ||
    Number.isNaN(latN) ||
    Number.isNaN(lngN) ||
    latN < -90 ||
    latN > 90 ||
    lngN < -180 ||
    lngN > 180
  ) {
    throw new Error('Valid coordinates are required');
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latN)}&lon=${encodeURIComponent(lngN)}&format=json`,
      {
        headers: {
          'User-Agent': 'LilMagnetMemories/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding service unavailable');
    }

    const data = await response.json();
    const name = typeof data.display_name === 'string' ? data.display_name.trim() : '';
    if (name) {
      return name;
    }
    throw new Error('No address found for this location');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};
