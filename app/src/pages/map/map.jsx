import Clock from './clock';
import './map.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { default as rain } from './icons/rain.svg';
import { default as clouds } from './icons/clouds.svg';
import { default as moon } from './icons/moon.svg';
import { default as humidity } from './icons/humidity.svg';
import { default as uv } from './icons/uv.svg';
import { default as leaf } from './icons/leaf.svg';


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
                    <div className='left-stats'>
                        <div className='item'>
                            <img src={rain} className='icon'/>
                            <span>% Rain</span>
                        </div>
                        <div className='item'>
                            <img src={moon} className='icon'/>
                            <span>Moon</span>
                        </div>
                        <div className='item'>
                            <img src={clouds} className='icon'/>
                            <span>% Cloud</span>
                        </div>
                        <div className='right-stats'>
                        <div className='item'>
                            <img src={humidity} className='icon'/>
                            <span>Humidity: </span>
                        </div>
                        <div className='item'>
                            <img src={uv} className='icon'/>
                            <span>UV: </span>
                        </div>
                        <div className='item'>
                            <img src={leaf} className='icon'/>
                            <span>Leaf</span>
                        </div>
                    </div>

                    </div>
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
