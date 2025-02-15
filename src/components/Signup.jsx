import React, { useState } from 'react';
import axios from '@/utils/axios';
import Cookies from 'js-cookie';

const Signup = ({ setLoggedIn }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/register', formData);
      console.log("response", response);
      if (response.user) {
        // The cookie is automatically set by Laravel's response
        // But we can also set it manually to ensure it's available immediately
        const token = response.token;
        if (token) {
          Cookies.set('auth_token', token);
        }
        
        // Update the logged-in state
        setLoggedIn(true);
        // Redirect to dashboard or home page
        window.location.reload();
      }
    } catch (err) {
      // Handle validation errors
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessage = Object.values(errors).flat().join('\n');
        setError(errorMessage);
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="card shadow">
      <div className="signup-card-body">
        <h2 className="text-center mb-4">Sign Up</h2>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup; 