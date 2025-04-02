import Clock from './clock'
import './map.css' 
import { default as rain } from './icons/rain.svg';
import { default as clouds } from './icons/clouds.svg';
import { default as moon } from './icons/moon.svg';
import { default as humidity } from './icons/humidity.svg';
import { default as uv } from './icons/uv.svg';
import { default as leaf } from './icons/leaf.svg';



function Map(){

    



    return(
    <div className='map'>
        <div className='header'>
            <Clock/>
            <span id="plan">Plan Your Hike</span>
            <a href='/profile'><button id="account">Account</button></a>
        </div>
        <div className='bottom'>
            <div className='left'>
                <div className='filters'>
                    <div className='filter'>
                        <label for='filter1'>Select Something:</label>
                        <select id='filter1'>
                            <option>Location 1</option>
                            <option>Location 2</option>
                            <option>Location 3</option>
                            <option>Location 4</option>
                        </select>
                    </div>
                    <div className='filter'>
                        <label for='filter2'>Select Trail:</label>
                        <select id='filter2'>
                            <option>Location 1</option>
                            <option>Location 2</option>
                            <option>Location 3</option>
                            <option>Location 4</option>
                        </select>
                    </div>
                </div>
                <div className='temp'>

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
            <div className='right'>
                <img src='https://static-maps.alltrails.com/production/marker_maps/lists/10447222/lists-10447222-v2-1518639504-600w350h-en-US-i-1-style_3.png'/>
            </div>
        </div>
    </div>
    )
}

export default Map