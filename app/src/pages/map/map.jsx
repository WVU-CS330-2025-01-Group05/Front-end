import React, {useState, useEffect, useRef} from 'react';
import Clock from './clock';
import './map.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { default as rain } from './icons/rain.svg';
import { default as thermometer } from './icons/thermometer.png';
import { default as humidity } from './icons/humidity.svg';
import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getClimateData, getTrailClimateData } from './request.js';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_BACKEND_API_URL;

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

//center map based on selected trail
//this is a custom hook that will center the map on the selected trail
//it will also zoom in on the trail
function TrailCenterHandler({ selectedTrail, geojsonData }) {
    const map = useMap();
    
    useEffect(() => {
        if (selectedTrail !== null && geojsonData && geojsonData.features) {
            const selectedFeature = geojsonData.features[selectedTrail];
            
            if (selectedFeature && selectedFeature.geometry) {
                //gets coordinates based on geometry type
                let coordinates;
                
                if (selectedFeature.geometry.type === "MultiLineString") {
                    // For MultiLineString, get center point of first line segment
                    if (selectedFeature.geometry.coordinates[0].length > 0) {
                        const line = selectedFeature.geometry.coordinates[0];
                        const midIndex = Math.floor(line.length / 2);
                        coordinates = [line[midIndex][1], line[midIndex][0]]; //flips long lat to lat long
                    }
                } else if (selectedFeature.geometry.type === "LineString") {
                    const line = selectedFeature.geometry.coordinates;
                    const midIndex = Math.floor(line.length / 2);
                    coordinates = [line[midIndex][1], line[midIndex][0]]; 
                }
                
                // if coordinates are found the map will ""fly"" to them
                //this is a smooth transition to the new coordinates
                if (coordinates) {
                    map.flyTo(coordinates, 14); //zoom level 14, can be changed!
                }
            }
        }
    }, [selectedTrail, geojsonData, map]);
    
    return null;
}

// New component for searchable dropdown
function SearchableTrailDropdown({ trails, selectedTrail, onTrailSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    //filters based on what was searched in the input box
    const filteredTrails = trails?.filter(trail => {
        const trailName = trail.properties.Name 
            ? trail.properties.Name 
            : `Trail ${trails.indexOf(trail) + 1}`;
        return trailName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    //close dropdown when clicking outside
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


    //gets name of the selected trail based on the index
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
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [selectedTrailRating, setSelectedTrailRating] = useState(null);
    const [selectedTrailRatingCount, setSelectedTrailRatingCount] = useState(null);


    const [position, setPosition] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);
    const [selectedTrail, setSelectedTrail] = useState(null);
    const [climateData, setClimateData] = useState(null);
    const [trailClimateData, setTrailClimateData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showStartTrailModal, setShowStartTrailModal] = useState(false);
    const [trailClimateDataMap, setTrailClimateDataMap] = useState({});
    const [activeFilter, setActiveFilter] = useState(""); 
    const [status, setStatus] = useState(1);
    const [rating, setRating] = useState(0);
    const [trailData, setTrailData] = useState(null);
    const [userData, setUserData] = useState({});
    const [selectedTrailName, setSelectedTrailName] = useState('');


    //custom trigger alert because the toast thing was not working for some reason
    //this is a custom alert that will show up for 2.5 seconds when a trail is started
    const triggerAlert = (message) => {
        setAlertMessage(message);
        setShowAlert(true);
      
        setTimeout(() => {
          setShowAlert(false);
        }, 2500); // disappears after 2.5 seconds
      };
      
      //handles trail click for data pulling
    const handleTrailClick = (trail) => {
        console.log('Trail clicked:', trail);
      
        if (trail && trail.properties && trail.properties.Name) {
          setSelectedTrailName(trail.properties.Name);
          console.log('Selected trail:', trail.properties.Name);
        } else {
          console.log('No valid trail name found.');
          setSelectedTrailName(''); //clear if no name found
        }
      };

      const handleTrailSelect = (trailIdx) => {
        setSelectedTrail(trailIdx);
      
        if (geojsonData?.features?.[trailIdx]) {
          const trailId = geojsonData.features[trailIdx].properties.trail_id;
          fetchTrailRating(trailId);
        }
      };
      
      const fetchTrailRating = async (trailId) => {
  if (!trailId) {
    console.warn('Trail ID is undefined, not fetching rating.');
    return;
  }

  try {
    const response = await axios.post(`${API_URL}/auth/fetch-trails`, { trailId }, { withCredentials: true });
    const trail = response.data;

    if (trail.rating_count > 0) {
      const avg = trail.total_rating / trail.rating_count;
      const cleanAvg = Math.round(avg); // <<< round to nearest whole number
      setSelectedTrailRating(cleanAvg);
      setSelectedTrailRatingCount(trail.rating_count);
    } else {
      setSelectedTrailRating(0);
      setSelectedTrailRatingCount(0);
    }
  } catch (error) {
    console.error('Error fetching trail rating:', error);
  }
};

      
      
    
      const handleStartTrail = async () => {
        if (selectedTrail === null || !geojsonData?.features?.[selectedTrail]) {
          triggerAlert('Please select a trail first!');
          return;
        }
      
        const currentSelectedTrailName = geojsonData.features[selectedTrail].properties.Name || `Trail ${selectedTrail + 1}`;
      
        try {
          const response = await axios.post(`${API_URL}/auth/upload-trail`, {
            trailName: currentSelectedTrailName,
            status: 'in-progress',
          }, { withCredentials: true });
      
          //save trailid to memory if backend returns trailid
          if (response.data.trailId) {
            geojsonData.features[selectedTrail].properties.trail_id = response.data.trailId;
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
      };
      
      
      
    

    useEffect(() => {
        async function fetchClimateData() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getClimateData();
                setClimateData(data);
            } catch (error) {
                console.error("Error fetching climate data:", error);
                setError("Failed to load climate data");
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchClimateData();
    }, []);

    useEffect(() => {
        fetch('/data/randomTrailsSelection/trail_lines_full.geojson')
            .then((res) => res.json())
            .then((data) => setGeojsonData(data))
            .catch((err) => {
                console.error('GeoJSON load error:', err);
            });

    }, []);

    useEffect(() => {
        const fetchTrailIds = async () => {
          if (!geojsonData) return;
      
          try {
            const response = await axios.get(`${API_URL}/auth/all-trails`, { withCredentials: true });
            const trailsFromDb = response.data; // [{ id, name }, { id, name }, ...]
      
            const updatedGeojson = { ...geojsonData };
            updatedGeojson.features.forEach(feature => {
              const trailName = feature.properties.Name;
              const matchedTrail = trailsFromDb.find(dbTrail => dbTrail.name === trailName);
      
              if (matchedTrail) {
                feature.properties.trail_id = matchedTrail.id;
              }
            });
      
            setGeojsonData(updatedGeojson);
          } catch (error) {
            console.error('Failed to fetch trails from database:', error);
          }
        };
      
        fetchTrailIds();
      }, [geojsonData]);
      

    //fetch climate data for the selected trail
    useEffect(() => {
        async function fetchTrailClimateData() {
            if (selectedTrail !== null && geojsonData && geojsonData.features) {
                try {
                    setIsLoading(true);
                    const selectedFeature = geojsonData.features[selectedTrail];
                    if (selectedFeature) {
                        //checks if we already have the data in our map
                        if (trailClimateDataMap[selectedTrail]) {
                            setTrailClimateData(trailClimateDataMap[selectedTrail]);
                        } else {
                            const data = await getTrailClimateData(selectedFeature);
                            setTrailClimateData(data);
                            setTrailClimateDataMap(prevMap => ({
                                ...prevMap,
                                [selectedTrail]: data
                            }));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching trail climate data:", error);
                    setTrailClimateData(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setTrailClimateData(null);
            }
        }
        
        fetchTrailClimateData();
    }, [selectedTrail, geojsonData]);

    //load data for all traisl to filter
    useEffect(() => {
        async function loadAllTrailsClimateData() {
            if (geojsonData && geojsonData.features && position) {
                const dataMap = {};
                
                for (let i = 0; i < geojsonData.features.length; i++) {
                    try {
                        const feature = geojsonData.features[i];
                        const data = await getTrailClimateData(feature);
                        dataMap[i] = data;
                    } catch (error) {
                        console.error(`Error loading climate data for trail ${i}:`, error);
                    }
                }
                
                setTrailClimateDataMap(dataMap);
            }
        }
        
        if (geojsonData && position && Object.keys(trailClimateDataMap).length === 0) {
            loadAllTrailsClimateData();
        }
    }, [geojsonData, position, trailClimateDataMap]);

    const handleFilterChange = (e) => {
        const filterValue = e.target.value;
        setActiveFilter(filterValue);
        
        if (!geojsonData || !geojsonData.features || !position) {
            return;
        }
        
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
            case "lowest-humidity":
                selectedIdx = findTrailByHumidity("lowest");
                break;
            case "highest-humidity":
                selectedIdx = findTrailByHumidity("highest");
                break;
            default:
                return;
        }
        
        if (selectedIdx !== null) {
            setSelectedTrail(selectedIdx);
        }
    };
    
    const findClosestTrail = () => {
        if (!position || !geojsonData || !geojsonData.features) return null;
        
        let closestIdx = null;
        let minDistance = Infinity;
        
        geojsonData.features.forEach((feature, idx) => {
            const coords = getTrailCenterCoordinates(feature);
            if (coords) {

                //uses haversine formula to calculate distance between two points on the earth
                //according to stack overflow and wikipedia this is a good idea? - grace
                const distance = calculateDistance(
                    position.lat, position.lng,
                    coords[0], coords[1]
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIdx = idx;
                }
            }
        });
        
        return closestIdx;
    };
    
    const findFarthestTrail = () => {
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
                
                if (distance > maxDistance) {
                    maxDistance = distance;
                    farthestIdx = idx;
                }
            }
        });
        
        return farthestIdx;
    };
    
    const findTrailByTemperature = (type) => {
        if (!trailClimateDataMap || Object.keys(trailClimateDataMap).length === 0) return null;
        
        let selectedIdx = null;
        let compareTemp = type === "lowest" ? Infinity : -Infinity;
        
        Object.entries(trailClimateDataMap).forEach(([idx, data]) => {
            if (data && data.temperature && data.temperature.average) {
                const temp = parseFloat(data.temperature.average);
                
                if ((type === "lowest" && temp < compareTemp) || 
                    (type === "highest" && temp > compareTemp)) {
                    compareTemp = temp;
                    selectedIdx = parseInt(idx);
                }
            }
        });
        
        return selectedIdx;
    };
    
    const findTrailByHumidity = (type) => {
        if (!trailClimateDataMap || Object.keys(trailClimateDataMap).length === 0) return null;
        
        let selectedIdx = null;
        let compareHumidity = type === "lowest" ? Infinity : -Infinity;
        
        Object.entries(trailClimateDataMap).forEach(([idx, data]) => {
            if (data && data.humidity) {
                const humidity = parseFloat(data.humidity);
                
                if ((type === "lowest" && humidity < compareHumidity) || 
                    (type === "highest" && humidity > compareHumidity)) {
                    compareHumidity = humidity;
                    selectedIdx = parseInt(idx);
                }
            }
        });
        
        return selectedIdx;
    };
    
    //helper func to get trail center coordinates
    const getTrailCenterCoordinates = (feature) => {
        if (!feature || !feature.geometry) return null;
        
        if (feature.geometry.type === "MultiLineString") {
            if (feature.geometry.coordinates[0].length > 0) {
                const line = feature.geometry.coordinates[0];
                const midIndex = Math.floor(line.length / 2);
                return [line[midIndex][1], line[midIndex][0]]; //flip again
            }
        } else if (feature.geometry.type === "LineString") {
            const line = feature.geometry.coordinates;
            const midIndex = Math.floor(line.length / 2);
            return [line[midIndex][1], line[midIndex][0]]; 
        }
        
        return null;
    };
    
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; //earths radius in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1); 
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c; // Distance in km
        return distance;
    };
    
    const deg2rad = (deg) => {
        return deg * (Math.PI/180);
    };

    //Get trail name from selected trail
    const getSelectedTrailName = () => {
        if (selectedTrail !== null && geojsonData && geojsonData.features) {
            const feature = geojsonData.features[selectedTrail];
            if (feature) {
                return feature.properties.Name || 
                       feature.properties.trailName || 
                       `Trail ${selectedTrail + 1}`;
            }
        }
        return "Select a trail";
    };

    //Get trail length from selected trail
    const getSelectedTrailLength = () => {
        if (selectedTrail !== null && geojsonData && geojsonData.features) {
            const feature = geojsonData.features[selectedTrail];
            if (feature && feature.properties.miles) {
                return `${feature.properties.miles.toFixed(2)} miles`;
            }
        }
        return "Unknown length";
    };
    useEffect(() => {
        refreshProfileData();
      }, []);
      
      const refreshProfileData = async () => {
        try {
          const trailResponse = await axios.post(`${API_URL}/auth/trails`, {}, { withCredentials: true });
          setTrailData(trailResponse.data || {});
      
          const userResponse = await axios.get(`${API_URL}/auth/profile`, { withCredentials: true });
          setUserData(userResponse.data);
      
        } catch (error) {
          console.error('Failed to refresh profile data:', error);
        }
      };
      

    return (
        //sorry its spaced so bad - grace :)
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
                                <option value="lowest-humidity">Lowest humidity</option>
                                <option value="highest-humidity">Highest humidity</option>
                            </select>
                        </div>

                        {/* Replace the regular dropdown w/ searchable dropdown */}
                        {geojsonData && (
                            <SearchableTrailDropdown 
                            trails={geojsonData.features}
                            selectedTrail={selectedTrail}
                            onTrailSelect={handleTrailSelect}
                          />
                          
                        )}
                    </div>
                    {selectedTrailName && (
  <div className="trail-info">
    <p><strong>Selected Trail:</strong> {selectedTrailName}</p>
 {selectedTrailRatingCount > 0 ? (
  <div className="star-rating-display">
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
  <div className="star-rating-display">
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


  </div>
)}


                    {/* Trail weather infobox (im sorry its indented so poorly forgive me - grace)*/}
                    <div className='trail-weather-box'>
                        {selectedTrail !== null ? (
                            <>
                                <h3 className='trail-name-header'>{getSelectedTrailName()}</h3>
                                <div className='weather-data-content'>
                                    <p className='trail-length'>{getSelectedTrailLength()}</p>
                                    {selectedTrailRatingCount > 0 ? (
                                  <p className='trail-rating'>⭐ {selectedTrailRating} ({selectedTrailRatingCount} ratings)</p>
                                                    ) : (
                                        <p className='trail-rating'>No ratings yet</p>
                                    )}

                                    
                                    {isLoading ? (
                                        <div className="loading"></div>
                                    ) : trailClimateData ? (
                                        <div className='trail-weather-data'>
                                            <div className='weather-section'>
                                                <h4>Weather ({trailClimateData.month} Monthly Average)</h4>
                                                
                                                <div className='weather-item'>
                                                    <img src={rain} className='weather-icon' alt="Rain" />
                                                    <span className='weather-label'>Precipitation:</span>
                                                    <span className='weather-value'>{trailClimateData.precipitation} ml/day</span>
                                                </div>
                                                
                                                <div className='weather-item'>
                                                    <img src={thermometer} className='weather-icon' alt="Temperature" />
                                                    <span className='weather-label'>Temperature:</span>
                                                    <span className='weather-value'>{trailClimateData.temperature.average}°C</span>
                                                </div>
                                                
                                                <div className='weather-item'>
                                                    <span className='weather-label'>Range:</span>
                                                    <span className='weather-value'>{trailClimateData.temperature.min}°C - {trailClimateData.temperature.max}°C</span>
                                                </div>
                                                
                                                <div className='weather-item'>
                                                    <img src={humidity} className='weather-icon' alt="Humidity" />
                                                    <span className='weather-label'>Humidity:</span>
                                                    <span className='weather-value'>{trailClimateData.humidity}%</span>
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

                <div className='right' style={{ height: "80vh", width: "70vw" }}>
                    <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationHandler setPosition={setPosition} />
                        
                        {/* Center map on selected trail */}
                        {geojsonData && <TrailCenterHandler selectedTrail={selectedTrail} geojsonData={geojsonData} />}

                        {position && (
                            <Marker position={position} icon={userIcon}>
                                <Popup>You are here</Popup>
                            </Marker>
                        )}

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
                                    const featureIndex = geojsonData.features.findIndex(f => f === feature);
                                  
                                    layer.on({
                                      click: () => {
                                        setSelectedTrail(featureIndex);
                                        handleTrailClick(feature); // <-- ADD THIS
                                      },
                                    });
                                  
                                    const popup = `
                                      <div>
                                        <div class="starRating" style="font-size: 24px; color: gold; cursor: pointer;">
                                            <span data-value="1">☆</span>
                                            <span data-value="2">☆</span>
                                            <span data-value="3">☆</span>
                                            <span data-value="4">☆</span>
                                            <span data-value="5">☆</span>
                                        </div>
                                        <button>Add to Profile</button>
                                      </div>
                                    `;
                                    layer.bindPopup(popup);
                                  
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

//helper function
//generates a hiking recommendation based on what the weather is looking like
function getHikingRecommendation(weatherData) {
    if (!weatherData) return "";
    
    const temp = parseFloat(weatherData.temperature.average);
    const humidity = parseFloat(weatherData.humidity);
    const precip = parseFloat(weatherData.precipitation);
    
    if (precip > 10) {
        return "High precipitation expected. Consider waterproof gear or choosing another day.";
    } else if (temp > 30) {
        return "Very hot conditions. Bring plenty of water and sun protection.";
    } else if (temp < 5) {
        return "Cold conditions. Dress in layers and bring extra warm clothing.";
    } else if (humidity > 80) {
        return "High humidity. Stay hydrated and take breaks as needed.";
    } else if (temp >= 15 && temp <= 25 && humidity < 70 && precip < 5) {
        return "Excellent hiking conditions! Enjoy your trek.";
    } else {
        return "Moderate conditions. Prepare appropriately for your hike.";
    }
}

export default Map;