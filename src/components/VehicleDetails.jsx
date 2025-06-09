import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserPages.css';

const VehicleDetails = ({ setToken }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    model: '',
    insurance_status: '',
    insurance_expiry_date: '',
    puc_status: '',
    puc_expiry_date: ''
  });
  const [documents, setDocuments] = useState(null);
  const [currentDocuments, setCurrentDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'expired';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return expiry >= today ? 'active' : 'expired';
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError('One or more files exceed the 5MB size limit');
        e.target.value = null;
        return;
      }
      setDocuments(files);
      setError('');
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/vehicles/${id}/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrentDocuments(prev => prev.filter(doc => doc._id !== documentId));
    } catch (err) {
      setError('Failed to delete document. Please try again.');
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/vehicles/${id}/documents/${documentId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download document. Please try again.');
    }
  };

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // First try to get the vehicle
        const vehicleResponse = await axios.get(`http://localhost:5000/api/vehicles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Set vehicle data first
        setVehicle(vehicleResponse.data);
        
        // Determine status based on expiry dates
        const insuranceStatus = checkExpiryStatus(vehicleResponse.data.insurance_expiry_date);
        const pucStatus = checkExpiryStatus(vehicleResponse.data.puc_expiry_date);

        setFormData({
          vehicle_number: vehicleResponse.data.vehicle_number || '',
          vehicle_type: vehicleResponse.data.vehicle_type || '',
          model: vehicleResponse.data.model || '',
          insurance_status: insuranceStatus,
          insurance_expiry_date: vehicleResponse.data.insurance_expiry_date ? new Date(vehicleResponse.data.insurance_expiry_date).toISOString().substr(0,10) : '',
          puc_status: pucStatus === 'active' ? 'valid' : 'expired',
          puc_expiry_date: vehicleResponse.data.puc_expiry_date ? new Date(vehicleResponse.data.puc_expiry_date).toISOString().substr(0,10) : ''
        });

        // Only fetch documents if we found the vehicle
        try {
          const documentsResponse = await axios.get(`http://localhost:5000/api/vehicles/${id}/documents`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentDocuments(documentsResponse.data);
        } catch (docErr) {
          console.error('Error fetching documents:', docErr);
          setCurrentDocuments([]);
        }

      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          navigate('/login');
        } else if (err.response?.status === 404) {
          setVehicle(null);
          setCurrentDocuments([]);
        } else {
          setError('Failed to fetch vehicle details. Please try again later.');
          console.error('Error fetching vehicle details:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id, setToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing a date field, update the corresponding status
    if (name === 'insurance_expiry_date') {
      const status = checkExpiryStatus(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        insurance_status: status
      }));
    } else if (name === 'puc_expiry_date') {
      const status = checkExpiryStatus(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        puc_status: status === 'active' ? 'valid' : 'expired'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      // Update statuses based on current dates before sending
      const insuranceStatus = checkExpiryStatus(formData.insurance_expiry_date);
      const pucStatus = checkExpiryStatus(formData.puc_expiry_date);

      const updateData = {
        ...formData,
        insurance_status: insuranceStatus,
        puc_status: pucStatus === 'active' ? 'valid' : 'expired'
      };

      await axios.put(`http://localhost:5000/api/vehicles/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoading(false);
      setIsEditing(false);

      // Refresh vehicle details after update
      const response = await axios.get(`http://localhost:5000/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicle(response.data);

      // Update form data with new values and calculated statuses
      setFormData({
        vehicle_number: response.data.vehicle_number || '',
        vehicle_type: response.data.vehicle_type || '',
        model: response.data.model || '',
        insurance_status: checkExpiryStatus(response.data.insurance_expiry_date),
        insurance_expiry_date: response.data.insurance_expiry_date ? new Date(response.data.insurance_expiry_date).toISOString().substr(0,10) : '',
        puc_status: checkExpiryStatus(response.data.puc_expiry_date) === 'active' ? 'valid' : 'expired',
        puc_expiry_date: response.data.puc_expiry_date ? new Date(response.data.puc_expiry_date).toISOString().substr(0,10) : ''
      });
    } catch (err) {
      setLoading(false);
      setError('Failed to update vehicle details');
      console.error('Update error:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/vehicles');
      } catch (err) {
        setError('Failed to delete vehicle. Please try again later.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner-3d" />
      </div>
    );
  }

  if (!vehicle && !isLoading) {
    return (
      <div className="page-container">
        <div className="card-3d" style={{ 
          textAlign: 'center',
          padding: '3rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h3 style={{ 
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Vehicle Not Found
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)',
            marginBottom: '2rem'
          }}>
            The vehicle you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/vehicles" 
            className="button-3d"
            style={{ 
              textDecoration: 'none',
              padding: '0.75rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M15 10H5M5 10L10 15M5 10L10 5" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '1rem' }}>
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
            <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 8V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Vehicle Details
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
            Back
          </Link>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="button-3d success"
              style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M15.5 3.5L16.5 4.5M13.5 5.5L16.5 8.5M4 15H7L16 6L14 4L5 13V16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

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

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="form-3d" style={{ gap: '1.5rem' }}>
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
            <label htmlFor="documents" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 8V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 13v-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12l2 2 2-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Vehicle Documents
            </label>

            {currentDocuments.length > 0 && (
              <div style={{ 
                marginBottom: '1rem',
                display: 'grid',
                gap: '0.75rem'
              }}>
                <h4 style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem'
                }}>
                  Current Documents:
                </h4>
                {currentDocuments.map(doc => (
                  <div key={doc._id} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ color: 'var(--text-primary)' }}>{doc.fileName}</span>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => downloadDocument(doc._id, doc.fileName)}
                        className="button-3d"
                        style={{ 
                          padding: '0.5rem',
                          minWidth: 'auto'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDocumentDelete(doc._id)}
                        className="button-3d danger"
                        style={{ 
                          padding: '0.5rem',
                          minWidth: 'auto'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path d="M3 6h14M8 6V4c0-1.1.9-2 2-2h0c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              border: '2px dashed var(--border-color)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="file"
                id="documents"
                name="documents"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ 
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  position: 'absolute',
                  cursor: 'pointer'
                }}
              />
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" style={{ color: 'var(--text-secondary)' }}>
                  <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 8V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13v-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12l2 2 2-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <p style={{ 
                    color: 'var(--text-primary)',
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    Drop files here or click to upload
                  </p>
                  <p style={{ 
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem'
                  }}>
                    Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
            {documents && documents.length > 0 && (
              <div style={{ 
                marginTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <h4 style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  Selected files:
                </h4>
                {Array.from(documents).map((file, index) => (
                  <div key={index} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-submit" style={{ 
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.5rem',
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="button-3d"
              style={{ 
                padding: '0.75rem 1.25rem',
                minWidth: '120px',
                justifyContent: 'center'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="button-3d success"
              disabled={loading}
              style={{ 
                padding: '0.75rem 1.25rem',
                minWidth: '120px',
                position: 'relative'
              }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner-3d" style={{ width: '20px', height: '20px', margin: '0 0.5rem 0 0' }} />
                  Updating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path d="M5 10L8 13L15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="card-3d" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div className="vehicle-info-section" style={{ 
              background: 'var(--bg-secondary)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M13 2H7L2 7V13L7 18H13L18 13V7L13 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Basic Information
              </h3>
              <div style={{ 
                display: 'grid', 
                gap: '1rem',
                fontSize: '0.875rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M13 2H7L2 7V13L7 18H13L18 13V7L13 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Vehicle Number
                  </span>
                  <span style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: '500',
                    background: 'var(--bg-secondary)',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem'
                  }}>
                    {vehicle?.vehicle_number}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Vehicle Type
                  </span>
                  <span style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: '500',
                    background: 'var(--bg-secondary)',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem'
                  }}>
                    {vehicle?.vehicle_type}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Model
                  </span>
                  <span style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: '500',
                    background: 'var(--bg-secondary)',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem'
                  }}>
                    {vehicle?.model}
                  </span>
                </div>
              </div>
            </div>

            <div className="vehicle-info-section" style={{ 
              background: 'var(--bg-secondary)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M16 2V6M4 2V6M2 10H18M2 4H18M4 14H8M4 17H8M18 8V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6H16C17.1046 6 18 6.89543 18 8Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Status Information
              </h3>
              <div style={{ 
                display: 'grid', 
                gap: '1rem',
                fontSize: '0.875rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M9 12L11 14L15 10M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Insurance Status
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`status-badge ${formData.insurance_status}`}>
                      {formData.insurance_status === 'active' ? 'Active' : 'Expired'}
                    </span>
                    <span style={{ 
                      color: 'var(--text-primary)', 
                      fontWeight: '500',
                      background: 'var(--bg-secondary)',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}>
                      Expires: {vehicle?.insurance_expiry_date ? new Date(vehicle.insurance_expiry_date).toLocaleDateString() : 'Not Set'}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M9 12L11 14L15 10M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    PUC Status
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`status-badge ${formData.puc_status}`}>
                      {formData.puc_status === 'valid' ? 'Valid' : 'Expired'}
                    </span>
                    <span style={{ 
                      color: 'var(--text-primary)', 
                      fontWeight: '500',
                      background: 'var(--bg-secondary)',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}>
                      Expires: {vehicle?.puc_expiry_date ? new Date(vehicle.puc_expiry_date).toLocaleDateString() : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vehicle-info-section" style={{ 
              background: 'var(--bg-secondary)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 8V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Vehicle Documents
              </h3>

              {currentDocuments.length > 0 ? (
                <div style={{ 
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
                }}>
                  {currentDocuments.map(doc => (
                    <div key={doc._id} style={{ 
                      background: 'var(--bg-primary)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border-color)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{ 
                          color: 'var(--text-primary)',
                          fontWeight: '500',
                          flex: 1,
                          wordBreak: 'break-all'
                        }}>
                          {doc.fileName}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => downloadDocument(doc._id, doc.fileName)}
                          className="button-3d"
                          style={{ 
                            flex: 1,
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Download
                        </button>
                        <button
                          onClick={() => handleDocumentDelete(doc._id)}
                          className="button-3d danger"
                          style={{ 
                            padding: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path d="M3 6h14M8 6V4c0-1.1.9-2 2-2h0c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 20 20" fill="none" stroke="currentColor" style={{ margin: '0 auto 1rem' }}>
                    <path d="M4 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8l-4-4H6c-1.1 0-2 .9-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 8V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>No documents uploaded yet</p>
                  <p style={{ fontSize: '0.875rem' }}>Click the edit button to add vehicle documents</p>
                </div>
              )}
            </div>

            <div style={{ 
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.5rem'
            }}>
              <button
                onClick={handleDelete}
                className="button-3d danger"
                style={{ 
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M3 6h14M8 6V4c0-1.1.9-2 2-2h0c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Assistant Button */}
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
          boxShadow: 'var(--shadow-lg)',
          transition: 'transform 0.2s ease-in-out',
          zIndex: 1000,
          ':hover': {
            transform: 'scale(1.05)'
          }
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

export default VehicleDetails;