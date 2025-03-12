import './signup.css'

function Signup(){


    //document.getElementId("login").addEventListener('click', function() {window.locaton.href = "http://localhost:3000/map" });



    return(
        <div class="container">
        <h1>HIKE OF THE<br/>DAY</h1>
      <form>
        <label for="username">Username:</label><br/>
        <input type="text" id="username" name="username"/><br/>
        <label for="password">Password:</label><br/>
        <input type="password" id="password" name="password"/><br/>
        <a href='/'><button id="back" type="button">Back</button></a>
        <a href='/map'><button id="login" type="button">Sign Up</button></a>
      </form>
      </div>
    )
}

export default Signup