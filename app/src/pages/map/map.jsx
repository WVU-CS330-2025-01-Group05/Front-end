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
        map.locate({ setView: true, timeout: 20000 });
    }, [map]);

    return null;
}

function Map() {
    const [position, setPosition] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);
    const [selectedTrail, setSelectedTrail] = useState(null);

    useEffect(() => {
        fetch('/data/randomTrailsSelection/trail_lines.geojson')
            .then((res) => res.json())
            .then((data) => setGeojsonData(data))
            .catch((err) => console.error('GeoJSON load error:', err));
    }, []);

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
                                            {feature.properties.trailName
                                                ? `${feature.properties.trailName} (${feature.properties.trailLength?.toFixed(2) || "?"} km)`
                                                : `Trail ${idx + 1} (${feature.properties.trailLength?.toFixed(2) || "?"} km)`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

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
