import './map.css'




function Map() {



    return (
        <div className='map'>
            <div className='header'>
                <span>Time:</span>
                <span>Plan Your Hike</span>
                <span>Account</span>
            </div>
            <div className='bottom'>
                <div className='left'>
                    <div className='filter'>
                        <span>Select Location</span>
                        <div className='select'>
                            <div className='selected-option'>
                                <span>Selected Location</span>
                            </div>
                            <div className='options'>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
                                <span>Location</span>
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
                    <div className='temp'>

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
                                <span>Stat</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='right'>
                    <img />
                </div>
            </div>
        </div>
    )
}

export default Map