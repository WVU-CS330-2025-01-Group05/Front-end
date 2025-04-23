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
import { getClimateData } from './request.js';

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    /* Trail click function */
    const handleTrailClick = (feature, idx) => {
        setSelectedTrail(idx);
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



/* Function runs python script that generates random trails and updates the map with the newly generated data. 
const res- sends post request to run python script
const data- parses data recieved as json
Then script is checked for execution, and if it excecuted, then a timeout occurs to allow the new file data to load and then fetches and sets the new data
*/
   

    //  const runPythonScript = async () => {
    //      const res = await fetch("http://localhost:5000/run-script", {
    //     method: "POST",
    //      });
    //      const data = await res.json();
        
    //     console.log("Script response:", data);
    //     if (data.status === 'Script executed') {
            
    //         setTimeout(() => {
    //             fetch("/data/randomTrailsSelection/trail_lines_full.geojson")
    //                 .then((res) => res.json())
    //                 .then((data) => {
    //                     setGeojsonData(data);
    //                 })
    //                 .catch((err) => console.error('GeoJSON load error after script:', err));
    //         }, 500); 
    //     }


    //  };

    return (
        <div className='map'>
            <div className='header'>
                <Clock />
                <span id="plan">Plan Your Hike</span>
                 {/* Button to run script to get random trails */}
               
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

                    {/* Climate Data Section */}
                    <div className='climate-data'>
                        {error ? (
                            <div className="error-message">{error}</div>
                        ) : (
                            <>
                                <h3>{isLoading ? "Loading climate data..." : `Climate Averages for ${climateData?.month}`}</h3>
                                {climateData?.status && <div className="status-message">{climateData.status}</div>}
                                <div className='item'>
                                    <img src={rain} className='prcp-icon' alt="Rain" />
                                    <span className="label-text">| Precipitation |</span>
                                </div>
                                <div className='item'>
                                    <span className="label-text"></span> {isLoading ? "Loading..." : <span className="col">{climateData?.precipitation} ml/day</span>}
                                </div>
                                <div className='item temperature-item'>
                                    <p>---------------------------------</p>
                                </div>
                                <div className='item temperature-item'>
                                    <img src={thermometer} className='therm-icon' alt="Thermometer" />
                                    <span className="label-text">| Temperature |</span>
                                </div>
                                <div className='item temperature-item'>
                                    <p className="temperature-label">Average: {isLoading ? "Loading..." : <span className="col">{climateData?.temperature?.average}°C</span>}</p>
                                </div>
                                <div className='item temperature-item'>
                                    <p className="temperature-label" style={{ whiteSpace: 'nowrap' }}>Range: {isLoading ? "Loading..." : <span className="col">{climateData?.temperature?.min}°C - {climateData?.temperature?.max}°C</span>}</p>
                                </div>
                                <div className='item temperature-item'>
                                    <p>---------------------------------</p>
                                </div>
                                <div className='item'>
                                    <img src={humidity} className='hum-icon' alt="Humidity" />
                                    <span className="label-text">| Relative Humidity | </span> 
                                </div>
                                <div className='item'>
                                    <span className="label-text"></span> {isLoading ? "Loading..." : <span className="col">{climateData?.humidity}%</span>}
                                </div>
                            </>
                        )}
                    </div>
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

export default Map;