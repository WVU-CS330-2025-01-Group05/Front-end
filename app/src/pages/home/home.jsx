import './home.css'

function Home(){
    return(
    <div className='home'>
        <div className='home-container'>
            <div className='home-top'>
                Hike of the Day
            </div>
            <div className='bottom'>
                <div className='item'>
                    <a href='/signup'><button className='sign-up-button'>Sign Up</button></a>
                </div>
                <div className='item'>
                    <span>Already have an account?</span>
                    <a href='/login'><button className='login-button'>Login</button></a>
                </div>
                <div className='item'>
                    <a href='/map'><button className='skip-button'>Skip To map</button></a>
                </div>
                
            </div>

        </div>
       
        
    </div>
    )
}

export default Home