import './signup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import react-router-dom for redirection
import axios from 'axios';

function Signup() {

  const navigate = useNavigate(); // For navigating after successful signup


  // Set initial state for the form data
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  // Handle form data changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // Make HTTP POST request to PHP script
    axios
      .post("submit.php", formData)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  /*
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // For navigating after successful signup

  const [values, setValues] = useState({
    username: '',
    password: ''
  })

  const handleChange = (event) => {
    setValues({...values, [event.target.name]:[event.target.value]})
  }
  const handleSubmit = (event) => {
    event.preventDefault();
    axios.post('https://localhost:5000/upload', values)
    .then(res => console.log("Register success"))
    .catch(err => console.log(err));
  } */
  /*const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate('/login'); // Redirect to login page after successful registration
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    }
  };*/


  return (
    <div className='signup'>
      <div className="container">
        <h1>HIKE OF THE<br />DAY</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username:</label><br />
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          /><br />
          <label htmlFor="password">Password:</label><br />
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          /><br />
          <button id="back" type="button" onClick={() => navigate('/login')}>Back</button>
          <button id="signup" type="submit" onClick={() => navigate('/map')}>Sign Up</button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
