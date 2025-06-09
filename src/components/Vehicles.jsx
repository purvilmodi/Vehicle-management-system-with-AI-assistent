import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserPages.css';
import logo from './logo.png';

const Vehicles = ({ setToken }) => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/vehicles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehicles(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          navigate('/login');
        } else {
          setError('Failed to fetch vehicles. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [setToken, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner-3d" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '1rem' }}>
      {/* Header */}
      <div className="header-3d" style={{ 
        padding: '0.75rem', 
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src={logo} 
            alt="Vahaan Logo" 
            style={{ 
              height: '50px',
              width: 'auto',
              objectFit: 'contain',
              maxWidth: '180px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link 
            to="/add-vehicle" 
            className="button-3d success"
            style={{ 
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add
          </Link>
          <button 
            onClick={handleLogout} 
            className="button-3d danger"
            style={{ 
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M13 3H16C17.1046 3 18 3.89543 18 5V15C18 16.1046 17.1046 17 16 17H13M7 14L3 10M3 10L7 6M3 10H13" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ 
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M10 12V10M10 8H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" 
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Vehicles Table */}
      <div className="table-wrapper" style={{ 
        backgroundColor: 'var(--background-secondary)',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <table className="table-3d" style={{ fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem 1rem' }}>Vehicle Number</th>
              <th style={{ padding: '0.75rem 1rem' }}>Insurance Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Insurance Expiry</th>
              <th style={{ padding: '0.75rem 1rem' }}>PUC Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>PUC Expiry</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => {
              const insuranceExpired = new Date(vehicle.insurance_expiry_date) < new Date();
              const pucExpired = new Date(vehicle.puc_expiry_date) < new Date();

              return (
                <tr key={vehicle._id}>
                  <td style={{ padding: '0.75rem 1rem' }}>{vehicle.vehicle_number}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`status-badge ${!insuranceExpired ? 'active' : 'expired'}`}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      {!insuranceExpired ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{new Date(vehicle.insurance_expiry_date).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`status-badge ${!pucExpired ? 'valid' : 'expired'}`}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      {!pucExpired ? 'Valid' : 'Expired'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{new Date(vehicle.puc_expiry_date).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Link 
                      to={`/vehicle/${vehicle._id}`}
                      className="button-3d"
                      style={{ 
                        textDecoration: 'none',
                        padding: '0.375rem 0.625rem',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.5 10C2.5 10 5.83333 5 10 5C14.1667 5 17.5 10 17.5 10C17.5 10 14.1667 15 10 15C5.83333 15 2.5 10 2.5 10Z" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {vehicles.length === 0 && !error && (
        <div className="empty-state" style={{ 
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)'
          }}>No Vehicles Found</h3>
          <p style={{ marginBottom: '1rem' }}>Get started by adding your first vehicle</p>
          <Link 
            to="/add-vehicle" 
            className="button-3d success"
            style={{ 
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Your First Vehicle
          </Link>
        </div>
      )}

      {/* Chat Button */}
      <Link 
        to="/chat"
        className="chat-button-3d"
        title="Chat Support"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          backgroundColor: 'var(--primary)',
          color: 'white',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" 
            fill="currentColor"
          />
        </svg>
      </Link>
    </div>
  );
};

export default Vehicles;
