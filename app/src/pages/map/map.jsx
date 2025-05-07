import React, {useState, useEffect, useRef, useCallback} from 'react';
import './map.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { default as rain } from './icons/rain.svg';
import { default as thermometer } from './icons/thermometer.png';
import { default as wind } from './icons/wind.png';
import { default as humidity } from './icons/humidity.svg';
import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getTrailClimateData, getTrailClimateDataByCounty, generateSyntheticWeatherData } from './request.js';
import axios from 'axios';


const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://cs330-2025-01-group05-backend-fceefzc8c5gfemc7.eastus2-01.azurewebsites.net';


// Cache for API responses
const apiCache = {};


// Custom axios instance with cache
const cachedAxios = {
  get: async (url, config = {}) => {
    const cacheKey = `${url}-${JSON.stringify(config)}`;
   
    // Check cache (valid for 10 minutes)
    if (apiCache[cacheKey]) {
      const now = new Date();
      const cachedTime = new Date(apiCache[cacheKey].timestamp);
      const ageInMs = now - cachedTime;
      const tenMinutesMs = 10 * 60 * 1000;
     
      if (ageInMs < tenMinutesMs) {
        console.log(`Using cached response for ${url}`);
        return apiCache[cacheKey].data;
      }
    }
   
    // Make actual request
    const response = await axios.get(url, config);
   
    // Cache the result
    apiCache[cacheKey] = {
      data: response,
      timestamp: new Date().toISOString()
    };
   
    return response;
  },
 
  post: async (url, data = {}, config = {}) => {
    // For POST requests, only cache certain endpoints
    const cacheable = url.includes('/auth/fetch-trails') ||
                     url.includes('/auth/trails') ||
                     url.includes('/auth/profile');
   
    if (cacheable) {
      const cacheKey = `${url}-${JSON.stringify(data)}-${JSON.stringify(config)}`;
     
      // Check cache (valid for 10 minutes)
      if (apiCache[cacheKey]) {
        const now = new Date();
        const cachedTime = new Date(apiCache[cacheKey].timestamp);
        const ageInMs = now - cachedTime;
        const tenMinutesMs = 10 * 60 * 1000;
       
        if (ageInMs < tenMinutesMs) {
          console.log(`Using cached response for ${url}`);
          return apiCache[cacheKey].data;
        }
      }
     
      // Make actual request
      const response = await axios.post(url, data, config);
     
      // Cache the result
      apiCache[cacheKey] = {
        data: response,
        timestamp: new Date().toISOString()
      };
     
      return response;
    }
   
    // Non-cacheable endpoints go straight to axios
    return axios.post(url, data, config);
  }
};


const userIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});


const defaultCenter = [39.6295, -79.9559];


function LocationHandler({ setPosition }) {
    const map = useMapEvents({
        locationfound(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
        locationerror(e) {
            alert(`Unable to determine location: ${e.message}`);
        },
    });
   
    useEffect(() => {
        map.locate({ setView: true, timeout: 20000});
    }, [map]);
 
    return null;
}


// Center map based on selected trail
function TrailCenterHandler({ selectedTrail, geojsonData }) {
    const map = useMap();
    console.log(`using ${API_URL}`);
   
    useEffect(() => {
        if (selectedTrail !== null && geojsonData && geojsonData.features) {
            const selectedFeature = geojsonData.features[selectedTrail];
           
            if (selectedFeature && selectedFeature.geometry) {
                // Gets coordinates based on geometry type
                let coordinates;
               
                if (selectedFeature.geometry.type === "MultiLineString") {
                    // For MultiLineString, get center point of first line segment
                    if (selectedFeature.geometry.coordinates[0].length > 0) {
                        const line = selectedFeature.geometry.coordinates[0];
                        const midIndex = Math.floor(line.length / 2);
                        coordinates = [line[midIndex][1], line[midIndex][0]]; // Flips long lat to lat long
                    }
                } else if (selectedFeature.geometry.type === "LineString") {
                    const line = selectedFeature.geometry.coordinates;
                    const midIndex = Math.floor(line.length / 2);
                    coordinates = [line[midIndex][1], line[midIndex][0]];
                }
               
                // If coordinates are found the map will "fly" to them
                if (coordinates) {
                    map.flyTo(coordinates, 14); // Zoom level 14
                }
            }
        }
    }, [selectedTrail, geojsonData, map]);
   
    return null;
}


// Searchable dropdown component
function SearchableTrailDropdown({ trails, selectedTrail, onTrailSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);


    // Filters based on what was searched in the input box
    const filteredTrails = trails?.filter(trail => {
        const trailName = trail.properties.Name
            ? trail.properties.Name
            : `Trail ${trails.indexOf(trail) + 1}`;
        return trailName.toLowerCase().includes(searchTerm.toLowerCase());
    });


    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
       
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);


    // Gets name of the selected trail based on the index
    const getSelectedTrailName = () => {
        if (selectedTrail !== null && trails) {
            const feature = trails[selectedTrail];
            if (feature) {
                return feature.properties.Name || `Trail ${selectedTrail + 1}`;
            }
        }
        return "Select a trail";
    };


    return (
        <div className='filter trail-search-dropdown' ref={dropdownRef}>
            <label htmlFor='trailSearch'>Select Trail:</label>
            <div className="search-dropdown-container">
                <div
                    className="selected-trail-display"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    {getSelectedTrailName()}
                </div>
               
                {isDropdownOpen && (
                    <div className="dropdown-content">
                        <input
                            type="text"
                            placeholder="Search trails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="trail-options">
                            {filteredTrails && filteredTrails.length > 0 ? (
                                filteredTrails.map((trail, idx) => {
                                    const trailIndex = trails.indexOf(trail);
                                    return (
                                        <div
                                            key={idx}
                                            className={`trail-option ${trailIndex === selectedTrail ? 'selected' : ''}`}
                                            onClick={() => {
                                                onTrailSelect(trailIndex);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {trail.properties.Name
                                                ? `${trail.properties.Name} (${trail.properties.miles?.toFixed(2) || "?"} mi)`
                                                : `Trail ${trailIndex + 1} (${trail.properties.miles?.toFixed(2) || "?"} mi)`}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="no-trails-found">No trails found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


function Map() {
    // Use REF for data that shouldn't trigger re-renders
    const lastFetchedMapRef = useRef({});
    const trailsLoadedRef = useRef(false);
    const assigningTrailIdsRef = useRef(false);
    const locationInitializedRef = useRef(false);
    const cancelTokenSourceRef = useRef(null);
    const syntheticDataGeneratedRef = useRef(false);
    const lastSyntheticGenerationDateRef = useRef(null);
   
    // State variables
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [selectedTrailRating, setSelectedTrailRating] = useState(null);
    const [selectedTrailRatingCount, setSelectedTrailRatingCount] = useState(null);
    const [debounceTimer, setDebounceTimer] = useState(null);
    const [searchRadiusMiles, setSearchRadiusMiles] = useState(10);
    const [position, setPosition] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);
    const [selectedTrail, setSelectedTrail] = useState(null);
    const [trailClimateData, setTrailClimateData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showStartTrailModal, setShowStartTrailModal] = useState(false);
    const [trailClimateDataMap, setTrailClimateDataMap] = useState({});
    const [syntheticClimateDataMap, setSyntheticClimateDataMap] = useState({}); // Separate map for synthetic data
    const [activeFilter, setActiveFilter] = useState("");
    const [trailData, setTrailData] = useState(null);
    const [userData, setUserData] = useState({});
    const [selectedTrailName, setSelectedTrailName] = useState('');
    const [filteredTrailIndexes, setFilteredTrailIndexes] = useState([]);


    // Custom trigger alert
    const triggerAlert = (message) => {
        setAlertMessage(message);
        setShowAlert(true);
     
        setTimeout(() => {
          setShowAlert(false);
        }, 2500); // Disappears after 2.5 seconds
    };


    // Load GeoJSON data only once
    useEffect(() => {
        if (trailsLoadedRef.current) return;
       
        trailsLoadedRef.current = true;
       
        fetch('/data/randomTrailsSelection/trail_lines_full.geojson')
            .then((res) => res.json())
            .then((data) => {
                console.log("GeoJSON data loaded");
                setGeojsonData(data);
            })
            .catch((err) => {
                console.error('GeoJSON load error:', err);
                trailsLoadedRef.current = false; // Allow retry on error
            });
    }, []);


    // Assign trail IDs without triggering infinite loop
    useEffect(() => {
        const assignTrailIds = async () => {
            if (!geojsonData || !geojsonData.features || assigningTrailIdsRef.current) return;
           
            // Mark as processing to prevent concurrent requests
            assigningTrailIdsRef.current = true;
           
            // Check if we need to get IDs (if any trail is missing a trail_id)
            const needsTrailIds = geojsonData.features.some(
                feature => !feature.properties.trail_id
            );
           
            if (!needsTrailIds) {
                assigningTrailIdsRef.current = false;
                return;
            }
           
            try {
                console.log("Fetching trail IDs from database");
                const response = await cachedAxios.get(`${API_URL}/auth/all-trails`, { withCredentials: true });
                const trailsFromDb = response.data;
               
                // Keep track if any changes were made
                let hasChanges = false;
               
                const updatedFeatures = geojsonData.features.map((feature) => {
                    // Skip if already has trail_id
                    if (feature.properties.trail_id) return feature;
                   
                    const trailName = feature.properties.Name;
                    const matchedTrail = trailsFromDb.find(dbTrail => dbTrail.name === trailName);
                   
                    if (matchedTrail) {
                        hasChanges = true;
                        return {
                            ...feature,
                            properties: {
                                ...feature.properties,
                                trail_id: matchedTrail.id
                            }
                        };
                    }
                    return feature;
                });
               
                // Only update state if changes were made
                if (hasChanges) {
                    console.log("Updated trail IDs from database");
                    setGeojsonData(prevData => ({
                        ...prevData,
                        features: updatedFeatures
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch trails from database:', error);
            } finally {
                assigningTrailIdsRef.current = false;
            }
        };
       
        assignTrailIds();
    }, [geojsonData]);


    // Generate synthetic data for filtering
    useEffect(() => {
      if (!geojsonData || !geojsonData.features) return;
     
      // Check if we need to regenerate data (new day or no data yet)
      const needsGeneration = !syntheticDataGeneratedRef.current ||
          !lastSyntheticGenerationDateRef.current ||
          new Date().toDateString() !== lastSyntheticGenerationDateRef.current.toDateString();
     
      if (needsGeneration && geojsonData.features.length > 0) {
          console.log("Generating synthetic climate data for filtering");
          const syntheticData = {};
         
          geojsonData.features.forEach((feature, idx) => {
              syntheticData[idx] = generateSyntheticWeatherData(feature, idx);
          });
         
          setSyntheticClimateDataMap(syntheticData);
          syntheticDataGeneratedRef.current = true;
          lastSyntheticGenerationDateRef.current = new Date();
      }
    }, [geojsonData]);


    // Fetch climate data for selected trail with proper cleanup
    useEffect(() => {
        let isMounted = true;
       
        const fetchTrailClimateData = async () => {
            if (selectedTrail === null || !geojsonData || !geojsonData.features) {
                if (isMounted) setTrailClimateData(null);
                return;
            }
           
            try {
                if (isMounted) setIsLoading(true);
                const selectedFeature = geojsonData.features[selectedTrail];
               
                console.log(`Requesting climate data for trail index ${selectedTrail}`);
               
                if (selectedFeature) {
                    // Check if we already have the data in our cache
                    const cached = lastFetchedMapRef.current[selectedTrail];
                   
                    if (cached) {
                        const now = new Date();
                        const fetchedTime = new Date(cached.fetchedAt);
                        const ageInMs = now - fetchedTime;
                        const oneHourMs = 60 * 60 * 1000;
                       
                        if (ageInMs < oneHourMs) {
                            console.log("Using cached trail climate data (fresh, <1hr)");
                            if (isMounted) setTrailClimateData(cached.data);
                            return;
                        } else {
                            console.log("Cached data is older than 1 hour. Re-fetching...");
                        }
                    }
                   
                    // Cancel any previous requests
                    if (cancelTokenSourceRef.current) {
                        cancelTokenSourceRef.current.cancel('New request made');
                    }
                   
                    // Create new cancel token
                    cancelTokenSourceRef.current = axios.CancelToken.source();
                   
                    // Fetch new data
                    const data = await getTrailClimateDataByCounty(selectedFeature);
                   
                    if (!isMounted) return;
                   
                    console.log("Received new trail climate data:", data);
                   
                    // Update ref directly without setting state that would trigger re-render
                    const now = new Date().toISOString();
                    lastFetchedMapRef.current[selectedTrail] = { data, fetchedAt: now };
                   
                    // Update visible state
                    setTrailClimateData(data);
                }
            } catch (error) {
                if (axios.isCancel(error)) {
                    console.log('Request canceled:', error.message);
                } else {
                    console.error("Error fetching trail climate data:", error);
                    if (isMounted) setTrailClimateData(null);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
       
        fetchTrailClimateData();
       
        return () => {
            isMounted = false;
            if (cancelTokenSourceRef.current) {
                cancelTokenSourceRef.current.cancel('Component unmounted');
            }
        };
    }, [selectedTrail, geojsonData]);


    // Handle filter change with debounce
    const handleFilterChange = useCallback((e) => {
        const filterValue = e.target.value;
        setActiveFilter(filterValue);
       
        if (!geojsonData || !geojsonData.features || !position) {
            return;
        }
       
        // Clear any existing timer 
        if (debounceTimer) clearTimeout(debounceTimer);
       
        // Set a new timer
        const timer = setTimeout(() => {
            console.log("Applying filter:", filterValue);
           
            if (filterValue === "easy" || filterValue === "medium" ||
                filterValue === "hard" || filterValue === "very-hard") {
                const indexes = geojsonData.features
                    .map((feature, idx) => {
                        if (feature.properties.miles !== undefined) {
                            const { label } = getTrailDifficulty(feature.properties.miles);
                           
                            // Radius checking
                            const coords = getTrailCenterCoordinates(feature);
                            if (!coords) return null;
                            const distance = calculateDistance(position.lat, position.lng, coords[0], coords[1]);
                            if (distance > searchRadiusMiles) return null;
                           
                            if (
                                (filterValue === "easy" && label === "Easy") ||
                                (filterValue === "medium" && label === "Medium") ||
                                (filterValue === "hard" && label === "Hard") ||
                                (filterValue === "very-hard" && label === "Very Hard")
                            ) {
                                return idx; // Save the index
                            }
                        }
                        return null;
                    })
                    .filter((idx) => idx !== null); // Remove non-matches
               
                setFilteredTrailIndexes(indexes);
                setSelectedTrail(null);

            } else if (filterValue === "Best-Views") {
              const indexes = geojsonData.features
                  .map((feature, idx) => {
                      if (feature.properties.goodView === true) {
                          // Radius checking
                          const coords = getTrailCenterCoordinates(feature);
                          if (!coords) return null;
                          const distance = calculateDistance(position.lat, position.lng, coords[0], coords[1]);
                          if (distance > searchRadiusMiles) return null;
          
                          return idx; // Only return index if within radius
                      }
                      return null;
                  })
                  .filter((idx) => idx !== null); // Remove non-matches
          
              setFilteredTrailIndexes(indexes);
              setSelectedTrail(null);
          }
          
           else {
                setFilteredTrailIndexes([]);
                let selectedIdx = null;
               
                switch (filterValue) {
                    case "closest":
                        selectedIdx = findClosestTrail();
                        break;
                    case "farthest":
                        selectedIdx = findFarthestTrail();
                        break;
                    case "lowest-temp":
                        selectedIdx = findTrailByTemperature("lowest");
                        break;
                    case "highest-temp":
                        selectedIdx = findTrailByTemperature("highest");
                        break;
                    case "lowest-humidty":
                        break;
                    case "Best-Views":
                        break;
                    case "highest-humidity":
                        break;
                    default:
                        return;
                }
               
                if (selectedIdx !== null) {
                    setSelectedTrail(selectedIdx);
                }
            }
        }, 300); // Debounce delay
       
        setDebounceTimer(timer);
    }, [debounceTimer, geojsonData, position, searchRadiusMiles]);


    // Handle trail click for data pulling
    const handleTrailClick = useCallback((feature) => {
        if (!geojsonData) return;
       
        const featureIndex = geojsonData.features.findIndex(f => f === feature);
        if (featureIndex !== -1) {
            setSelectedTrail(featureIndex);
            const trailId = geojsonData.features[featureIndex]?.properties?.trail_id;
            if (trailId) {
                fetchTrailRating(trailId);
            }
            else {
                //makes sure ratings default to 0 if trailId doesn't exist
                setSelectedTrailRating(0);
                setSelectedTrailRatingCount(0);
            }
            if (feature.properties?.Name) {
                setSelectedTrailName(feature.properties.Name);
            } else {
                setSelectedTrailName('');
            }
        }
    }, [geojsonData]);


    // Handle trail selection from dropdown
    const handleTrailSelect = useCallback((trailIdx) => {
        setSelectedTrail(trailIdx);
       
        if (geojsonData?.features?.[trailIdx]) {
            const trailId = geojsonData.features[trailIdx].properties.trail_id;
            fetchTrailRating(trailId);
        }
    }, [geojsonData]);


    // Fetch trail rating with caching
    const fetchTrailRating = useCallback(async (trailId) => {
        setSelectedTrailRating(null);
        setSelectedTrailRatingCount(null);
       
        if (!trailId) {
            console.warn('Trail ID is undefined, not fetching rating.');
            return;
        }
       
        try {
            const response = await cachedAxios.post(
                `${API_URL}/auth/fetch-trails`,
                { trailId },
                { withCredentials: true }
            );
           
            const trail = response.data;
           
            if (trail.rating_count > 0) {
                const avg = trail.total_rating / trail.rating_count;
                const cleanAvg = Math.round(avg); // Round to nearest whole number
                setSelectedTrailRating(cleanAvg);
                setSelectedTrailRatingCount(trail.rating_count);
            } else {
                setSelectedTrailRating(0);
                setSelectedTrailRatingCount(0);
            }
        } catch (error) {
            console.error('Error fetching trail rating:', error);
        }
    }, []);


    // Handle starting a trail
    const handleStartTrail = useCallback(async () => {
        if (selectedTrail === null || !geojsonData?.features?.[selectedTrail]) {
            triggerAlert('Please select a trail first!');
            return;
        }
       
        const currentSelectedTrailName = geojsonData.features[selectedTrail].properties.Name ||
                                        `Trail ${selectedTrail + 1}`;
       
        try {
            const response = await cachedAxios.post(
                `${API_URL}/auth/upload-trail`,
                {
                    trailName: currentSelectedTrailName,
                    status: 'in-progress',
                },
                { withCredentials: true }
            );
           
            // Save trailid to memory if backend returns trailid
            if (response.data.trailId) {
                // Update the ref directly to avoid unnecessary re-renders
                const updatedFeatures = [...geojsonData.features];
                updatedFeatures[selectedTrail] = {
                    ...updatedFeatures[selectedTrail],
                    properties: {
                        ...updatedFeatures[selectedTrail].properties,
                        trail_id: response.data.trailId
                    }
                };
               
                setGeojsonData(prevData => ({
                    ...prevData,
                    features: updatedFeatures
                }));
            }
           
            triggerAlert(`🏞️ Trail "${currentSelectedTrailName}" started!`);
            await refreshProfileData();
        } catch (error) {
            console.error('Error starting new trail:', error);
            if (error.response && error.response.data.error) {
                triggerAlert(error.response.data.error);
            } else {
                triggerAlert('Failed to start trail.');
            }
        }
    }, [geojsonData, selectedTrail]);


    // Refresh profile data
    const refreshProfileData = useCallback(async () => {
        try {
            const trailResponse = await cachedAxios.post(
                `${API_URL}/auth/trails`,
                {},
                { withCredentials: true }
            );
            setTrailData(trailResponse.data || {});
           
            const userResponse = await cachedAxios.get(
                `${API_URL}/auth/profile`,
                { withCredentials: true }
            );
            setUserData(userResponse.data);
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    }, []);


    // Initial data load after component mounts
    useEffect(() => {
        if (!locationInitializedRef.current && position) {
            locationInitializedRef.current = true;
            refreshProfileData();
        }
    }, [position, refreshProfileData]);


    // Find closest trail helper
    const findClosestTrail = useCallback(() => {
        if (!position || !geojsonData || !geojsonData.features) return null;
       
        let closestIdx = null;
        let minDistance = Infinity;
       
        geojsonData.features.forEach((feature, idx) => {
            const coords = getTrailCenterCoordinates(feature);
            if (coords) {
                const distance = calculateDistance(
                    position.lat, position.lng,
                    coords[0], coords[1]
                );
               
                if (distance <= searchRadiusMiles && distance < minDistance) {
                    minDistance = distance;
                    closestIdx = idx;
                }
            }
        });
       
        return closestIdx;
    }, [geojsonData, position, searchRadiusMiles]);


    // Find farthest trail helper
    const findFarthestTrail = useCallback(() => {
        if (!position || !geojsonData || !geojsonData.features) return null;
       
        let farthestIdx = null;
        let maxDistance = -1;
       
        geojsonData.features.forEach((feature, idx) => {
            const coords = getTrailCenterCoordinates(feature);
            if (coords) {
                const distance = calculateDistance(
                    position.lat, position.lng,
                    coords[0], coords[1]
                );
               
                if (distance <= searchRadiusMiles && distance > maxDistance) {
                    maxDistance = distance;
                    farthestIdx = idx;
                }
            }
        });
       
        return farthestIdx;
    }, [geojsonData, position, searchRadiusMiles]);

    


    // Find trail by temperature helper - USES SYNTHETIC DATA
    const findTrailByTemperature = useCallback((type) => {
        if (!syntheticClimateDataMap || Object.keys(syntheticClimateDataMap).length === 0 ||
            !position || !geojsonData) return null;
    
        let selectedIdx = null;
        let compareTemp = type === "lowest" ? Infinity : -Infinity;
    
        Object.entries(syntheticClimateDataMap).forEach(([idx, data]) => {
            if (data && data.temperature &&
                (data.temperature.average || data.temperature.avg)) {
            
                const temp = parseFloat(data.temperature.average || data.temperature.avg);
            
                // Check within radius
                const feature = geojsonData.features[idx];
                const coords = getTrailCenterCoordinates(feature);
                if (!coords) return;
            
                const distance = calculateDistance(
                    position.lat, position.lng,
                    coords[0], coords[1]
                );
            
                if (distance > searchRadiusMiles) return;
                
                if ((type === "lowest" && temp < compareTemp) ||
                    (type === "highest" && temp > compareTemp)) {
                    compareTemp = temp;
                    selectedIdx = parseInt(idx);
                }
            }
        });
        return selectedIdx;
    }, [geojsonData, position, searchRadiusMiles, syntheticClimateDataMap]);



    // Helper to get trail center coordinates
    const getTrailCenterCoordinates = useCallback((feature) => {
        if (!feature || !feature.geometry) return null;
       
        if (feature.geometry.type === "MultiLineString") {
            if (feature.geometry.coordinates[0]?.length > 0) {
                const line = feature.geometry.coordinates[0];
                const midIndex = Math.floor(line.length / 2);
                return [line[midIndex][1], line[midIndex][0]]; // Flip coordinates
            }
        } else if (feature.geometry.type === "LineString") {
            const line = feature.geometry.coordinates;
            const midIndex = Math.floor(line.length / 2);
            return [line[midIndex][1], line[midIndex][0]];
        }
       
        return null;
    }, []);


    // Calculate distance between coordinates
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
    }, []);
   
    // Convert degrees to radians
    const deg2rad = useCallback((deg) => {
        return deg * (Math.PI/180);
    }, []);


    // Get trail difficulty based on length
    const getTrailDifficulty = useCallback((miles) => {
        if (miles <= 1.5) return { label: "Easy", color: "green" };
        if (miles <= 5) return { label: "Medium", color: "goldenrod" };
        if (miles <= 10) return { label: "Hard", color: "orange" };
        return { label: "Very Hard", color: "red" };
    }, []);


    // Get selected trail name
    const getSelectedTrailName = useCallback(() => {
        if (selectedTrail !== null && geojsonData && geojsonData.features) {
            const feature = geojsonData.features[selectedTrail];
            if (feature) {
                return feature.properties.Name ||
                       feature.properties.trailName ||
                       `Trail ${selectedTrail + 1}`;
            }
        }
        return "Select a trail";
    }, [geojsonData, selectedTrail]);


    // Get selected trail length
    const getSelectedTrailLength = useCallback(() => {
        if (selectedTrail !== null && geojsonData && geojsonData.features) {
            const feature = geojsonData.features[selectedTrail];
            if (feature && feature.properties.miles) {
                return `${feature.properties.miles.toFixed(2)} miles`;
            }
        }
        return "Unknown length";
    }, [geojsonData, selectedTrail]);


    return (
        <div className='map'>
            {showAlert && (
                <div className="custom-alert">
                    {alertMessage}
                </div>
            )}


            <div className='header'>
                <a href='/home'><button id='home'>Home</button></a>
                <span id="plan">Plan Your Hike</span>
                <a href='/profile'><button id="account">Account</button></a>
            </div>
            <div className='bottom'>
                <div className='left'>
                    <div className='filters'>
                        <div className='filter'>
                            {/* Search radius slider */}
                            <div style={{ marginBottom: "0px" }}>
                                <label htmlFor="search-radius-slider" style={{ display: "block", marginBottom: "8px" }}>
                                    Search Radius: {searchRadiusMiles} miles
                                </label>
                                <input
                                    id="search-radius-slider"
                                    type="range"
                                    min="5"
                                    max="100"
                                    step="5"
                                    value={searchRadiusMiles}
                                    onChange={(e) => {
                                        const miles = Number(e.target.value);
                                        setSearchRadiusMiles(miles);
                                     
                                        // Debounce the re-filter
                                        if (debounceTimer) {
                                            clearTimeout(debounceTimer);
                                        }
                                     
                                        const timer = setTimeout(() => {
                                            if (activeFilter) {
                                                handleFilterChange({ target: { value: activeFilter } });
                                            }
                                        }, 300); // wait 300ms after user stops moving
                                     
                                        setDebounceTimer(timer);
                                    }}
                                    style={{ width: "100%" }}
                                />
                            </div>
                            {/* Filter dropdown */}
                            <label htmlFor='filter1'>Filter:</label>
                            <select
                                id='filter1'
                                value={activeFilter}
                                onChange={handleFilterChange}
                            >
                                <option value="">Select a filter</option>
                                <option value="closest">Closest to me</option>
                                <option value="farthest">Farthest from me</option>
                                <option value="lowest-temp">Lowest temperature</option>
                                <option value="highest-temp">Highest temperature</option>
                                <option value="Best-Views">Best Views</option>
                                <option value="easy">Easy Difficulty</option>
                                <option value="medium">Medium Difficulty</option>
                                <option value="hard">Hard Difficulty</option>
                                <option value="very-hard">Very Hard Difficulty</option>
                            </select>
                        </div>


                        {/* Searchable trail dropdown */}
                        {geojsonData && (
                            <SearchableTrailDropdown
                                trails={
                                    filteredTrailIndexes.length > 0
                                        ? filteredTrailIndexes.map(idx => geojsonData.features[idx])
                                        : geojsonData.features
                                }
                                selectedTrail={selectedTrail}
                                onTrailSelect={(idx) => {
                                    if (filteredTrailIndexes.length > 0) {
                                        handleTrailSelect(filteredTrailIndexes[idx]);
                                    } else {
                                        handleTrailSelect(idx);
                                    }
                                }}
                            />
                        )}
                    </div>
                   
                    {/* Trail weather infobox */}
                    <div className='trail-weather-box'>
                        {selectedTrail !== null ? (
                            <>
                                <h3 className='trail-name-header'>{getSelectedTrailName()}</h3>
                                <div className='weather-data-content'>
                                    <p className='trail-length'>
                                        {selectedTrail !== null && geojsonData && geojsonData.features ? (
                                            <>
                                                {geojsonData.features[selectedTrail].properties.miles
                                                    ? `${geojsonData.features[selectedTrail].properties.miles.toFixed(2)} miles `
                                                    : "Unknown length "}
                                                {geojsonData.features[selectedTrail].properties.miles && (
                                                    <span style={{ color: getTrailDifficulty(geojsonData.features[selectedTrail].properties.miles).color, fontWeight: 'bold' }}>
                                                        ({getTrailDifficulty(geojsonData.features[selectedTrail].properties.miles).label})
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            "Unknown length"
                                        )}
                                    </p>


                                    {/* Star rating display */}
                                    {selectedTrailRatingCount > 0 ? (
                                        <div className="star-rating-display" style={{ textAlign: 'center', marginTop: '5px' }}>
                                            {Array.from({ length: 5 }, (_, index) => (
                                                <span key={index} style={{ fontSize: '24px', color: index < selectedTrailRating ? 'gold' : 'lightgray' }}>
                                                    ★
                                                </span>
                                            ))}          
                                            <span style={{ marginLeft: '8px', fontSize: '16px', color: 'gray' }}>
                                                ({selectedTrailRatingCount})
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="star-rating-display" style={{ textAlign: 'center', marginTop: '5px' }}>
                                            {Array.from({ length: 5 }, (_, index) => (
                                                <span key={index} style={{ fontSize: '24px', color: 'lightgray' }}>
                                                    ★
                                                </span>
                                            ))}
                                            <span style={{ marginLeft: '8px', fontSize: '16px', color: 'gray' }}>
                                                (0)
                                            </span>
                                        </div>
                                    )}          


                                    {/* Weather data display */}
                                    {isLoading ? (
                                        <div className="loading"></div>
                                    ) : trailClimateData ? (
                                        <div className='trail-weather-data'>
                                            <div className='weather-section'>
                                                <h4>Recent Weather Data:</h4>
                                               
                                                <div className='weather-item'>
                                                    <img src={rain} className='weather-icon' alt="Rain" />
                                                    <span className='weather-label'>Precipitation:</span>
                                                    <span className='weather-value'>{trailClimateData.precipitation} ml/day</span>
                                                </div>
                                               
                                                <div className='weather-item'>
                                                    <img src={thermometer} className='weather-icon' alt="Temperature" />
                                                    <span className='weather-label'>Temperature:</span>
                                                    <span className='weather-value'>{trailClimateData.temperature.average}°F</span>
                                                </div>
                                               
                                                <div className='weather-item'>
                                                    <span className='weather-label'>Range:</span>
                                                    <span className='weather-value'>{trailClimateData.temperature.min}°F - {trailClimateData.temperature.max}°F</span>
                                                </div>
                                               
                                                <div className='weather-item'>
                                                    <img src={humidity} className='weather-icon' alt="Humidity" />
                                                    <span className='weather-label'>Humidity:</span>
                                                    <span className='weather-value'>{trailClimateData.humidity}%</span>
                                                </div>
                                               
                                                <div className='weather-item'>
                                                    <img src={wind} className='weather-icon' alt="Wind" />
                                                    <span className='weather-label'>Wind Speed:</span>
                                                    <span className='weather-value'>{trailClimateData.windSpeed} mph</span>
                                                </div>
                                            </div>
                                           
                                            <div className='trail-recommendation'>
                                                <h4>Hiking Recommendation</h4>
                                                <p>{getHikingRecommendation(trailClimateData)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>No weather data available for this trail</div>
                                    )}
                                   
                                    <button className='start-trail-button' onClick={handleStartTrail}>
                                        Start Trail
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className='select-trail-prompt'>
                                <h3 className='trail-name-header'>Trail Information</h3>
                                <div className="please-select-message">
                                    <p>Please select a trail to view weather information</p>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Start Trail Modal */}
                    {showStartTrailModal && (
                        <div className='start-trail-modal'>
                            <div className='modal-content'>
                                <span className='close-button' onClick={() => setShowStartTrailModal(false)}>×</span>
                                <h3>Trail started! Good luck!</h3>
                                <p>{getSelectedTrailLength()}</p>
                            </div>
                        </div>
                    )}
                </div>


                {/* Map container */}
                <div className='right' style={{ height: "80vh", width: "70vw" }}>
                    <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationHandler setPosition={setPosition} />
                       
                        {/* Center map on selected trail */}
                        {geojsonData && <TrailCenterHandler selectedTrail={selectedTrail} geojsonData={geojsonData} />}


                        {/* User location marker */}
                        {position && (
                            <Marker position={position} icon={userIcon}>
                                <Popup>You are here</Popup>
                            </Marker>
                        )}


                        {/* Trail GeoJSON data */}
                        {geojsonData && (
                            <GeoJSON
                                data={geojsonData}
                                style={(feature) => {
                                    const featureIndex = geojsonData.features.findIndex(f => f === feature);
                                    return {
                                        color: featureIndex === selectedTrail ? 'red' : '#006400',
                                        weight: featureIndex === selectedTrail ? 5 : 3,
                                    };
                                }}
                                onEachFeature={(feature, layer) => {
                                    layer.on({
                                        click: () => {
                                            handleTrailClick(feature);
                                        },
                                    });
                                   
                                    layer.on('popupopen', () => {
                                        const starsContainer = document.querySelector('.starRating');
                                        if (starsContainer) {
                                            starsContainer.addEventListener('click', (event) => {
                                                if (!event.target.dataset.value) return;
                                                const rating = parseInt(event.target.dataset.value);
                                                const stars = starsContainer.querySelectorAll('span');
                                                stars.forEach((star, index) => {
                                                    star.textContent = index < rating ? '★' : '☆';
                                                });
                                            });
                                        }
                                    });
                                }}
                            />
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}


// Helper function for hiking recommendations
function getHikingRecommendation(weatherData) {
    if (!weatherData) return "";
   
    const temp = parseFloat(weatherData.temperature.average);
    const humidity = parseFloat(weatherData.humidity);
    const precip = parseFloat(weatherData.precipitation);
   
    if (precip > 7.5) {
        return "High precipitation expected. Consider waterproof gear or choosing another day.";
    } else if (temp > 80) {
        return "Very hot conditions. Bring plenty of water and sun protection.";
    } else if (temp < 40) {
        return "Cold conditions. Dress in layers and bring extra warm clothing.";
    } else if (humidity > 70) {
        return "High humidity. Stay hydrated and take breaks as needed.";
    } else if (temp >= 55 && temp <= 70 && humidity < 60 && humidity > 45 && precip < 5) {
        return "Excellent hiking conditions! Enjoy your trek.";
    } else {
        return "Moderate conditions. Prepare appropriately for your hike.";
    }
}


export default Map;
               

