import './notFound.css'

function NotFound(){
    return(
    <div className='not-found'>
        <div className='container'>
            <div className='top'>404</div>
            <div className='bottom'>
                <div className='sorry'>Sorry, we were unable to load this page</div>
                <a href='/home'><button>Return to Home Page</button></a>
            </div>
        

        </div>
           
    </div>
    )
}

export default NotFound