import Clock from './clock';
import './map.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function Map() {
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
                            <label htmlFor='filter1'>Select Something:</label>
                            <select id='filter1'>
                                <option>Location 1</option>
                                <option>Location 2</option>
                                <option>Location 3</option>
                                <option>Location 4</option>
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
                    <div className='stats'>
                        {/* Weather Stats Section */}
                    </div>
                </div>
                <div className='right' style={{ height: "80vh", width: "70vw" }}>
                <MapContainer center={[39.6295, -79.9559]} zoom={13} style={{ height: "100%", width: "100%" }}>

                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

export default Map;
