import './map.css'

function Map(){



    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  

    document.addEventListener("DOMContentLoaded", function() {
        var element = document.getElementById('time');
        element.innerHTML = "This worked";
    })

    return(
    <div className='map'>
        <div className='header'>
            <span id='time'></span>
            <span>Plan Your Hike </span>
            <a href='/profile'><span>Account</span></a>
        </div>
        <div className='bottom'>
            <div className='left'>
                <div className='filters'>
                    <div className='filter'>
                        <span>Select Location</span>
                        <div className='select'>
                            <button id='dropDownButton' className='selected-option'>
                                <span>Location</span>
                            </button>
                            <div className='options'>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                            </div>
                        </div>
                    </div>
                    <div className='filter'>
                        <span>Select Trail</span>
                        <div className='select'>
                            <div className='options'>
                                <span>Trail</span>
                                <span>Trail</span>
                                <span>Trail</span>
                                <span>Trail</span>
                                <span>Trail</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='temp'>
                    45^
                </div>

                <div className='stats'>
                    <div className='left-stats'>
                        <div className='item'>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H260Zm0-80h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41Zm220-240Z"/></svg>
                            <span>Cloud Coverage</span>
                        </div>
                        <div className='item'>
                            <span>Stat</span>
                        </div>
                        <div className='item'>
                            <span>Stat</span>
                        </div>
                    </div>
                    <div className='right-stats'>
                        <div className='item'>
                            <span>Stat</span>
                        </div>
                        <div className='item'>
                            <span>Stat</span>
                        </div>
                        <div className='item'>
                            <span>Stat</span>``
                        </div>
                    </div>
                </div>
            </div>
            <div className='right'>
                <img className='map-image' src='https://static-maps.alltrails.com/production/marker_maps/lists/15507574/lists-15507574-v2-1631409590-600w350h-en-US-i-1-style_3.png' alt='Map'/>
            </div>
        </div>
    </div>
    )
}

export default Map