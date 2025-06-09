import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader, AlertCircle } from 'lucide-react';
import '../styles/UserPages.css';

const Register = ({ setToken }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/users/register', {
        email: formData.email,
        password: formData.password
      }, {
        baseURL: 'http://localhost:5000'
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        navigate('/vehicles');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-gradient"></div>
      </div>
      
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <h2>Create Account</h2>
          <p>Sign up to start managing your vehicles</p>
        </div>

        {error && (
          <motion.div 
            className="login-error"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label htmlFor="email">
              <Mail size={20} />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="login-input"
              required
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password">
              <Lock size={20} />
              <span>Password</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="login-input"
              required
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="confirmPassword">
              <Lock size={20} />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="login-input"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="login-spinner" size={20} />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Already have an account? {' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
