import './map.css'

function Map(){



    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    function dropDownMenu(){

    }


    return(
    <div className='map'>
        <div className='header'>
            <span>Time: </span>
            <span>Plan Your Hike</span>
            <span>Account</span>
        </div>
        <div className='bottom'>
            <div className='left'>
                <div className='filters'>
                    <div className='filter'>
                        <span>Select Location</span>
                        <div className='select'>
                            <button id='dropDownButton' className='selected-option' onClick='dropDownMenu'>
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
                            <span>Stat</span>
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