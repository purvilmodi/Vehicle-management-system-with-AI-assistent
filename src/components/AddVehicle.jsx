import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserPages.css';

const AddVehicle = ({ setToken }) => {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    model: '',
    insurance_status: 'active',
    insurance_expiry_date: '',
    puc_status: 'valid',
    puc_expiry_date: ''
  });
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should not exceed 5MB');
        e.target.value = null;
        return;
      }
      setDocuments(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      if (documents) {
        formDataToSend.append('documents', documents);
      }

      await axios.post('http://localhost:5000/api/vehicles', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/vehicles');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="header-3d" style={{ 
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5M12 19V5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add New Vehicle
        </h2>
        <Link 
          to="/vehicles" 
          className="button-3d"
          style={{ 
            textDecoration: 'none',
            padding: '0.625rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M15 10H5M5 10L10 15M5 10L10 5" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Vehicles
        </Link>
      </div>

      <div className="card-3d" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div className="error-message" style={{ 
            animation: 'shake 0.5s ease-in-out',
            marginBottom: '1.5rem'
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M10 12V10M10 8H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-3d">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div className="input-group-3d">
              <label htmlFor="vehicle_number">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M13 2H7L2 7V13L7 18H13L18 13V7L13 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicle_number"
                name="vehicle_number"
                className="input-3d"
                value={formData.vehicle_number}
                onChange={handleChange}
                required
                placeholder="Enter vehicle number"
              />
            </div>

            <div className="input-group-3d">
              <label htmlFor="vehicle_type">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M15 4H17C18.1046 4 19 4.89543 19 6V14C19 15.1046 18.1046 16 17 16H15M9 16V4M9 4L5 8M9 4L13 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Vehicle Type
              </label>
              <input
                type="text"
                id="vehicle_type"
                name="vehicle_type"
                className="input-3d"
                value={formData.vehicle_type}
                onChange={handleChange}
                required
                placeholder="Enter vehicle type"
              />
            </div>

            <div className="input-group-3d">
              <label htmlFor="model">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M17.1817 8H2.81826C2.36637 8 2 8.36637 2 8.81826V17.1817C2 17.6336 2.36637 18 2.81826 18H17.1817C17.6336 18 18 17.6336 18 17.1817V8.81826C18 8.36637 17.6336 8 17.1817 8Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 8V5C5 3.34315 6.34315 2 8 2H12C13.6569 2 15 3.34315 15 5V8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Model
              </label>
              <input
                type="text"
                id="model"
                name="model"
                className="input-3d"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder="Enter vehicle model"
              />
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div className="input-group-3d">
              <label htmlFor="insurance_status">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M9 12L11 14L15 10M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Insurance Status
              </label>
              <select
                id="insurance_status"
                name="insurance_status"
                className="input-3d"
                value={formData.insurance_status}
                onChange={handleChange}
                required
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="input-group-3d">
              <label htmlFor="insurance_expiry_date">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M16 2V6M4 2V6M2 10H18M2 4H18M4 14H8M4 17H8M18 8V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6H16C17.1046 6 18 6.89543 18 8Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Insurance Expiry Date
              </label>
              <input
                type="date"
                id="insurance_expiry_date"
                name="insurance_expiry_date"
                className="input-3d"
                value={formData.insurance_expiry_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div className="input-group-3d">
              <label htmlFor="puc_status">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M9 12L11 14L15 10M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                PUC Status
              </label>
              <select
                id="puc_status"
                name="puc_status"
                className="input-3d"
                value={formData.puc_status}
                onChange={handleChange}
                required
              >
                <option value="valid">Valid</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="input-group-3d">
              <label htmlFor="puc_expiry_date">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M16 2V6M4 2V6M2 10H18M2 4H18M4 14H8M4 17H8M18 8V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6H16C17.1046 6 18 6.89543 18 8Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                PUC Expiry Date
              </label>
              <input
                type="date"
                id="puc_expiry_date"
                name="puc_expiry_date"
                className="input-3d"
                value={formData.puc_expiry_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group-3d" style={{ marginBottom: '2rem' }}>
            <label htmlFor="documents">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 8V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 13v-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12l2 2 2-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Vehicle Documents (Optional)
            </label>
            <input
              type="file"
              id="documents"
              name="documents"
              className="input-3d"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              style={{ padding: '0.75rem' }}
            />
            <span className="helper-text">Max file size: 5MB. Supported formats: PDF, DOC, DOCX, JPG, PNG</span>
          </div>

          <div className="form-submit" style={{ 
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.5rem',
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <Link 
              to="/vehicles" 
              className="button-3d"
              style={{ 
                textDecoration: 'none',
                padding: '0.75rem 1.25rem',
                minWidth: '120px',
                justifyContent: 'center'
              }}
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="button-3d success"
              disabled={isLoading}
              style={{ 
                padding: '0.75rem 1.25rem',
                minWidth: '120px',
                position: 'relative'
              }}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner-3d" style={{ width: '20px', height: '20px', margin: '0 0.5rem 0 0' }} />
                  Adding...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path d="M10 4V16M4 10H16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
