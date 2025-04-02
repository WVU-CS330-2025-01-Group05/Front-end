import './signup.css'
import { useState } from 'react';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        //either or show success message
        alert(data.message);
        //may also redirect or perform other actions
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    }
  };

  return (
    <div className='signup'>
      <div className="container">
        <h1>HIKE OF THE<br />DAY</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username:</label><br />
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          /><br />
          <label htmlFor="password">Password:</label><br />
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br />
          <button id="back" type="button">Back</button>
          <button id="signup" type="submit">Sign Up</button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
