import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader, AlertCircle } from 'lucide-react';
import '../styles/UserPages.css';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/users/login', {
        email,
        password
      }, {
        baseURL: 'http://localhost:5000'
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        navigate('/vehicles');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
          <h2>Welcome Back</h2>
          <p>Sign in to manage your vehicles</p>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? {' '}
            <Link to="/register" className="login-link">
              Register here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
