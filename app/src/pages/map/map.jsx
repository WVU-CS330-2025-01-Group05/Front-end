import React, { useState, useEffect } from 'react';
import Clock from './clock';
import './map.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { default as rain } from './icons/rain.svg';
import { default as clouds } from './icons/clouds.svg';
import { default as moon } from './icons/moon.svg';
import { default as humidity } from './icons/humidity.svg';
import { default as uv } from './icons/uv.svg';
import { default as leaf } from './icons/leaf.svg';
import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

/* Sets properties for the icon layer */
const userIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

/*  Sets center to Morgantown*/
const defaultCenter = [39.6295, -79.9559];

/*@param setPosition is the position that we are setting from user location

Const map- sets up event listeners for the map, zooming in on the correct location
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
        map.locate({ setView: true, timeout: 20000 });
    }, [map]);

    return null;
}




function Map() {
    /* 
  
    sets state of the position and state to null 
    useEffect sets trails to null 
    then the response is sent, and then the data is pulled and is set
    @catch throws error if data doesn't show up
    */
    const [position, setPosition] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);
    const [selectedTrail, setSelectedTrail] = useState(null);

    /* Trail click function */
    const handleTrailClick = (feature, idx) => {
        setSelectedTrail(idx);
    };

    useEffect(() => {
        fetch('/data/randomTrailsSelection/trail_lines.geojson')
            .then((res) => res.json())
            .then((data) => setGeojsonData(data))
            .catch((err) => console.error('GeoJSON load error:', err));
    }, []);



    //testing python 
    //  const [message, setMessage] = useState("");

    //  const runPythonScript = async () => {
    //      const res = await fetch("http://localhost:5000/run-script", {
    //     method: "POST",
    //      });
    //      const data = await res.json();
    //     setMessage(data.output || data.status);

    //  };

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
                        {/* Function for making trails red when selecting the button */}
                        {geojsonData && (
                            <div className="trail-buttons">
                                {geojsonData.features.map((feature, idx) => (
                                    <button
                                        key={idx}
                                        className={`trail-button ${selectedTrail === idx ? 'active' : ''}`}
                                        onClick={() => handleTrailClick(feature, idx)}>
                                        {feature.properties.trailName 
                                            ? `${feature.properties.trailName} (${feature.properties.trailLength ? feature.properties.trailLength.toFixed(2) : "?"} km)`
                                            : `Trail ${idx + 1} (${feature.properties.trailLength ? feature.properties.trailLength.toFixed(2) : "?"} km)`
                                        }
                                    </button>
                                ))}
                            </div>
                        )}

                    </div>
                    {/* <button onClick={runPythonScript}>{message}</button>  */}
                    <div className='stats'>

                        <div className='item'>
                            <img src={rain} className='icon' />
                            <span>% Rain:</span>
                        </div>
                        <div className='item'>
                            <img src={moon} className='icon' />
                            <span>Moon:</span>
                        </div>
                        <div className='item'>
                            <img src={clouds} className='icon' />
                            <span>% Cloud:</span>
                        </div>


                        <div className='item'>
                            <img src={humidity} className='icon' />
                            <span>Humidity: </span>
                        </div>
                        <div className='item'>
                            <img src={uv} className='icon' />
                            <span>UV: </span>
                        </div>
                        <div className='item'>
                            <img src={leaf} className='icon' />
                            <span>Pollen:</span>
                        </div>


                    </div>
                </div>
                <div className='right' style={{ height: "80vh", width: "70vw" }}>
                    <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>

                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationHandler setPosition={setPosition} />



                        {position && (
                            <Marker position={position} icon={userIcon}>
                                <Popup>You are here</Popup>
                            </Marker>
                        )}

                        {/* displays the geojson data and applies a style on each line.
                        Covers making trails red when selecting the buttons */}
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