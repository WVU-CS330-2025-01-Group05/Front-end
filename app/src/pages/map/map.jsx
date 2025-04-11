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


const customIcon = L.icon({
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
         
        },

        // trigger on click (if needed)
        // click() {
        //   map.locate();
        //   },
    });


    useEffect(() => {
        map.locate({ setView: true, timeout: 20000 });
    }, [map]);

    return null;
}




function Map() {
    const [position, setPosition] = useState(null);
    // new
    const [geojsonData, setGeojsonData] = useState(null);

    useEffect(() => {
        fetch('/data/trail_lines.geojson')
            .then((res) => res.json())
            .then((data) => setGeojsonData(data))
            .catch((err) => console.error('GeoJSON load error:', err));
    }, []);

    // end

    //testing python 
    const [message, setMessage] = useState("");
    const [distance, setDistance] = useState(0);

    const runPythonScript = async () => {
        const res = await fetch("http://localhost:5000/run-script", {
            method: "POST",
        });
        const data = await res.json();
        setMessage(data.output || data.status);
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
                        <div className='filter'>
                            <label htmlFor='filter2'>Select Trail:</label>
                            <select id='filter2'>
                                <option>Location 1</option>
                                <option>Location 2</option>
                                <option>Location 3</option>
                                <option>Location 4</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={runPythonScript}>{message}</button>
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
                            <Marker position={position} icon={customIcon}>
                                <Popup>You are here</Popup>
                            </Marker>
                        )}

                        {/* new */}
                        {geojsonData && (
                            <GeoJSON
                                data={geojsonData}
                                style={() => ({
                                    color: '#006400',
                                    weight: 3,
                                })}
                                onEachFeature={(feature, layer) => {
                                    if (feature.properties && feature.properties.name) {
                                        layer.bindPopup(feature.properties.name);
                                    }
                                }}
                            />
                        )}

                        {/* end */}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

export default Map;
