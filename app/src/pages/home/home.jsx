import { useEffect, useState } from 'react';
import './home.css'





function Home() {

    //check if user is logged in. If so, certain buttons won't be displayed


    const [showElement, setShowElement] = useState(true);

    const checkLocalStorage = () => {
        const myVar = localStorage.getItem('authenticated');
        setShowElement(myVar !== 'true');
    };

    useEffect(() => {
        checkLocalStorage();
    }, []);

    return (
        <div className='home'>
            <div className='home-container'>
                <div className='home-top'>
                    Hike of the Day
                </div>
                <div className='bottom'>
                    {showElement && (
                        <div className='item'>
                            <a href='/register'><button>Register</button></a>
                        </div>
                    )}
                    {showElement && (<div className='item'>
                        <span >Already have an account?</span>
                        <a href='/login'><button>Login</button></a>
                    </div>
                    )}
                    <div className='item'>
                        <a href='/map'><button>{localStorage.getItem('authenticated') ? 'Map' : 'Skip to Map'}</button></a>
                    </div>
                    <div className='item'>
                        <a href='/what-is-hotd'><button>What is HotD?</button></a>
                    </div>

                </div>

            </div>

        </div>
    )
}

export default Home