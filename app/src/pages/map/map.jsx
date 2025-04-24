import React, {useState, useEffect} from 'react';
import Clock from './clock';
import './map.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents} from 'react-leaflet';
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

/*@param setPosition is the position that we are setting from user location

const map- sets up event listeners for the map, zooming in on the correct location
@param e is the location that is returned by leaflet
locationfound is triggered when leaflet finds the user location
locationerror happens if leaflet returns an error
useEffect sets the map view to center on the user location

 */
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

function Map() {
    /* 
    Set up states for position, trails, and climate data
    */
    const [position, setPosition] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);
    const [selectedTrail, setSelectedTrail] = useState(null);
    const [climateData, setClimateData] = useState(null);
    const [trailClimateData, setTrailClimateData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showStartTrailModal, setShowStartTrailModal] = useState(false);

    /* Trail click function */
    const handleTrailClick = (feature, idx) => {
        setSelectedTrail(idx);
    };

    // Handle starting a trail
    const handleStartTrail = () => {
        if (selectedTrail !== null) {
            setShowStartTrailModal(true);
            
            // Auto-close the modal after 3 seconds
            setTimeout(() => {
                setShowStartTrailModal(false);
            }, 3000);
        }
    };

    // Fetch climate data when component mounts
    useEffect(() => {
        async function fetchClimateData() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getClimateData();
                setClimateData(data);
                console.log("Climate data fetched:", data);
            } catch (error) {
                console.error("Error fetching climate data:", error);
                setError("Failed to load climate data");
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchClimateData();
    }, []);

    // Fetch trail data when component mounts
    useEffect(() => {
        fetch('/data/randomTrailsSelection/trail_lines_full.geojson')
            .then((res) => res.json())
            .then((data) => setGeojsonData(data))
            .catch((err) => {
                console.error('GeoJSON load error:', err);
                // Handle GeoJSON error if needed
            });
    }, []);

    // Fetch trail-specific climate data when a trail is selected
    useEffect(() => {
        async function fetchTrailClimateData() {
            if (selectedTrail !== null && geojsonData && geojsonData.features) {
                try {
                    setIsLoading(true);
                    const selectedFeature = geojsonData.features[selectedTrail];
                    if (selectedFeature) {
                        const data = await getTrailClimateData(selectedFeature);
                        setTrailClimateData(data);
                        console.log("Trail climate data fetched:", data);
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

    // Get trail name from selected trail
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

    // Get trail length from selected trail
    const getSelectedTrailLength = () => {
        if (selectedTrail !== null && geojsonData && geojsonData.features) {
            const feature = geojsonData.features[selectedTrail];
            if (feature && feature.properties.miles) {
                return `${feature.properties.miles.toFixed(2)} miles`;
            }
        }
        return "Unknown length";
    };

    return (
        <div className='map'>
            <div className='header'>
                <Clock />
                <span id="plan">Plan Your Hike</span>
                <a href='/profile'><button id="account">Account</button></a>
            </div>
            <div className='bottom'>
                <div className='left'>
                    <div className='filters'>
                        <div className='filter'>
                            <label htmlFor='filter1'>Filter:</label>
                            <select id='filter1'>
                                <option>Lowest UV</option>
                                <option>Lowest Pollen</option>
                                <option>Closest</option>
                                <option>Longest</option>
                            </select>
                        </div>

                        {geojsonData && (
                            <div className='filter'>
                                <label htmlFor='trailSelect'>Select Trail:</label>
                                <select
                                    id='trailSelect'
                                    onChange={(e) => setSelectedTrail(parseInt(e.target.value))}
                                    value={selectedTrail ?? ''}
                                >
                                    <option value="" disabled>Select a trail</option>
                                    {geojsonData.features.map((feature, idx) => (
                                        <option key={idx} value={idx}>
                                            {feature.properties.Name
                                                ? `${feature.properties.Name} (${feature.properties.miles?.toFixed(2) || "?"} mi)`
                                                : `Trail ${idx + 1} (${feature.properties.miles?.toFixed(2) || "?"} mi)`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Updated Trail Weather Info Box */}
                    <div className='trail-weather-box'>
                        {selectedTrail !== null ? (
                            <>
                                <h3 className='trail-name-header'>{getSelectedTrailName()}</h3>
                                <div className='weather-data-content'>
                                    <p className='trail-length'>{getSelectedTrailLength()}</p>
                                    
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
                                    
                                    <button className='start-trail-button' onClick={() => handleStartTrail()}>
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
                                        click: () => setSelectedTrail(featureIndex),
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
//generates a hiking recommendation besed on what the weather is looking like
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