import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import { AuthContext } from '../AuthContext';
import '../styles/AdminPanel.css';
import { motion } from 'framer-motion';

const AdminPanel = () => {
  const [usersWithVehicles, setUsersWithVehicles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activePanel, setActivePanel] = useState('users');
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Updated theme implementation
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [showEditModal, setShowEditModal] = useState(false);
  
  // Updated theme effect
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.remove('dark');
      body.classList.add('light');
      localStorage.setItem('theme', 'light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isDarkMode]);

  // Updated theme toggle function
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    model: '',
    insurance_status: '',
    insurance_expiry_date: '',
    puc_status: '',
    puc_expiry_date: ''
  });

  const { token, setToken, setIsAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Add pagination states for users and chat history
  const [userPageSize, setUserPageSize] = useState(10);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [chatPageSize, setChatPageSize] = useState(10);
  const [chatCurrentPage, setChatCurrentPage] = useState(1);

  // Add paginateData function
  const paginateData = useCallback((data, currentPage, pageSize) => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, []);

  // Update useEffect to handle component mount/unmount
  useEffect(() => {
    if (!token) {
      navigate('/admin_login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, chatRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/admin/chat-history', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsersWithVehicles(usersRes.data);
        setChatHistory(chatRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      setUsersWithVehicles([]);
      setChatHistory([]);
      setLoading(false);
      setError('');
    };
  }, [token, navigate]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleEditClick = async (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      model: vehicle.model || '',
      insurance_status: vehicle.insurance_status,
      insurance_expiry_date: vehicle.insurance_expiry_date.split('T')[0],
      puc_status: vehicle.puc_status,
      puc_expiry_date: vehicle.puc_expiry_date.split('T')[0]
    });
    setShowEditModal(true);
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await axios.put(
        `http://localhost:5000/api/admin/vehicles/${editingVehicle._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsersWithVehicles(prev => prev.map(({ user, vehicles }) => ({
        user,
        vehicles: vehicles.map(v => v._id === editingVehicle._id ? res.data : v)
      })));
      
      setShowEditModal(false);
      setEditingVehicle(null);
      setFormData({
        vehicle_number: '',
        vehicle_type: '',
        model: '',
        insurance_status: '',
        insurance_expiry_date: '',
        puc_status: '',
        puc_expiry_date: ''
      });
      setSuccessMessage('Vehicle updated successfully!');
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      setIsLoading(true);
      setError('');
      
      await axios.delete(
        `http://localhost:5000/api/admin/vehicles/${vehicleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsersWithVehicles(prev => prev.map(({ user, vehicles }) => ({
        user,
        vehicles: vehicles.filter(v => v._id !== vehicleId)
      })));

      setSuccessMessage('Vehicle deleted successfully!');
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVehicles = (userId) => {
    setSelectedUser(userId);
    setActivePanel('vehicles');
  };

  // Memoize filtered users
  const filteredUsers = useMemo(() => {
    return usersWithVehicles.filter(({ user }) => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersWithVehicles, searchTerm]);

  const filteredVehicles = usersWithVehicles
    .filter(({ user }) => !selectedUser || user._id === selectedUser)
    .flatMap(({ user, vehicles }) =>
      vehicles.filter(v => 
        v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(v => ({ ...v, userEmail: user.email }))
    );

  const totalVehicles = usersWithVehicles.reduce((acc, { vehicles }) => acc + vehicles.length, 0);
  const activeVehicles = usersWithVehicles.reduce((acc, { vehicles }) => 
    acc + vehicles.filter(v => v.insurance_status === 'active' && v.puc_status === 'active').length, 0
  );
  const expiringVehicles = usersWithVehicles.reduce((acc, { vehicles }) => 
    acc + vehicles.filter(v => {
      const today = new Date();
      const insuranceExpiry = new Date(v.insurance_expiry_date);
      const pucExpiry = new Date(v.puc_expiry_date);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      return (insuranceExpiry - today < sevenDays && insuranceExpiry > today) ||
             (pucExpiry - today < sevenDays && pucExpiry > today);
    }).length, 0
  );

  const sortData = (data, key) => {
    if (!key) return data;
    
    return [...data].sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      }
      return a[key] < b[key] ? 1 : -1;
    });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = filteredVehicles;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(vehicle => {
        if (filterStatus === 'active') {
          return vehicle.insurance_status === 'active' && vehicle.puc_status === 'active';
        } else if (filterStatus === 'expired') {
          return vehicle.insurance_status === 'expired' || vehicle.puc_status === 'expired';
        } else if (filterStatus === 'expiring') {
          const today = new Date();
          const insuranceExpiry = new Date(vehicle.insurance_expiry_date);
          const pucExpiry = new Date(vehicle.puc_expiry_date);
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          return (insuranceExpiry - today < sevenDays && insuranceExpiry > today) ||
                 (pucExpiry - today < sevenDays && pucExpiry > today);
        }
        return true;
      });
    }

    return sortData(filtered, sortConfig.key);
  }, [filteredVehicles, filterStatus, sortConfig]);

  const handleViewVehicleDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const checkExpiringDocuments = () => {
    const today = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const newNotifications = [];

    usersWithVehicles.forEach(({ user, vehicles }) => {
      vehicles.forEach(vehicle => {
        const insuranceExpiry = new Date(vehicle.insurance_expiry_date);
        const pucExpiry = new Date(vehicle.puc_expiry_date);

        if (insuranceExpiry - today < thirtyDays && insuranceExpiry > today) {
          newNotifications.push({
            id: `${vehicle._id}-insurance`,
            type: 'warning',
            message: `Insurance for vehicle ${vehicle.vehicle_number} will expire on ${insuranceExpiry.toLocaleDateString()}`,
            user: user.email
          });
        }

        if (pucExpiry - today < thirtyDays && pucExpiry > today) {
          newNotifications.push({
            id: `${vehicle._id}-puc`,
            type: 'warning',
            message: `PUC for vehicle ${vehicle.vehicle_number} will expire on ${pucExpiry.toLocaleDateString()}`,
            user: user.email
          });
        }
      });
    });

    setNotifications(newNotifications);
  };

  useEffect(() => {
    checkExpiringDocuments();
  }, [usersWithVehicles]);

  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedVehicles.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedVehicles, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedVehicles.length / pageSize);

  const [showNotifications, setShowNotifications] = useState(false);

  const NotificationBell = () => (
    <div className="notification-container">
      <button 
        className="notification-bell"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label="Toggle notifications"
      >
        <div className="bell-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notifications.length > 0 && (
            <span className="notification-badge">
              {notifications.length}
            </span>
          )}
        </div>
      </button>
      
      {showNotifications && (
        <motion.div 
          className="notifications-dropdown"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="notifications-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all"
                onClick={() => setNotifications([])}
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No new notifications
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className="notification-item"
                >
                  <div className="notification-icon">
                    {notification.type === 'expiry' ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </div>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {notification.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );

  // Add click outside handler to close notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationContainer = document.querySelector('.notification-container');
      if (notificationContainer && !notificationContainer.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Pagination = ({ currentPage, setCurrentPage, pageSize, setPageSize, totalItems }) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4 sm:mb-0">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="mx-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {[10, 20, 30, 50].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            entries
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Previous
          </button>
          <div className="hidden sm:flex items-center space-x-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="sm:hidden text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const switchPanel = (panelId) => {
    setActivePanel(panelId);
    setSearchTerm('');
    setIsMobileMenuOpen(false);
    if (panelId === 'vehicles') {
      setSelectedUser(null);
      setCurrentPage(1);
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Memoize filtered chat history
  const filteredChatHistory = useMemo(() => {
    return chatHistory.filter(chat => 
      chat.userId?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.response.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatHistory, searchTerm]);

  // Update panels with memoized data
  const panels = {
    users: (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{usersWithVehicles.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Total Vehicles</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalVehicles}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Active Vehicles</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeVehicles}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Users List</h2>
              <div className="w-full lg:w-64 relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-4">
              {error}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vehicles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginateData(filteredUsers, userCurrentPage, userPageSize).map(({ user, vehicles }) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{vehicles.length} vehicles</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicles.some(v => v.insurance_status === 'expired' || v.puc_status === 'expired') ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                            Has Expired Documents
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                            All Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => switchPanel('vehicles')}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          View Vehicles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            currentPage={userCurrentPage}
            setCurrentPage={setUserCurrentPage}
            pageSize={userPageSize}
            setPageSize={setUserPageSize}
            totalItems={filteredUsers.length}
          />
        </div>
      </div>
    ),
    vehicles: (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Total Vehicles</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalVehicles}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Active Vehicles</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeVehicles}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Expiring Soon</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{expiringVehicles}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All', color: 'indigo' },
                  { id: 'active', label: 'Active', color: 'green' },
                  { id: 'expired', label: 'Expired', color: 'red' },
                  { id: 'expiring', label: 'Expiring Soon', color: 'yellow' }
                ].map(({ id, label, color }) => (
                  <button
                    key={id}
                    onClick={() => handleFilterChange(id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                      filterStatus === id
                        ? `bg-${color}-100 dark:bg-${color}-900/20 text-${color}-800 dark:text-${color}-200`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="w-full lg:w-64 relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {[
                    { key: 'vehicle_number', label: 'Vehicle Number' },
                    { key: 'vehicle_type', label: 'Type' },
                    { key: 'insurance_status', label: 'Insurance' },
                    { key: 'puc_status', label: 'PUC' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => requestSort(key)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{label}</span>
                        {renderSortIcon(key)}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {paginatedVehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleViewVehicleDetails(vehicle)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.vehicle_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{vehicle.vehicle_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vehicle.insurance_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.insurance_status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Expires: {new Date(vehicle.insurance_expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vehicle.puc_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.puc_status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Expires: {new Date(vehicle.puc_expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(vehicle);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(vehicle._id);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              totalItems={filteredAndSortedVehicles.length}
            />
          </div>
        </div>
      </div>
    ),
    chat: (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chat History</h2>
              <div className="w-full lg:w-64 relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-4">
              {error}
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              {searchTerm ? 'No messages found matching your search.' : 'No chat history found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Response
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginateData(filteredChatHistory, chatCurrentPage, chatPageSize).map(chat => (
                    <tr key={chat._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {chat.userId?.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="chat-message">
                          <div className="chat-query">
                            {chat.query}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="chat-message">
                          <div className="chat-response">
                            {chat.response}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="chat-time">
                          {new Date(chat.createdAt).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            currentPage={chatCurrentPage}
            setCurrentPage={setChatCurrentPage}
            pageSize={chatPageSize}
            setPageSize={setChatPageSize}
            totalItems={filteredChatHistory.length}
          />
        </div>
      </div>
    )
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAdmin(false);
    navigate('/admin_login', { replace: true });
  };

  const EditModal = () => (
    showEditModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    Edit Vehicle
                  </h3>
                  
                  {error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleUpdateVehicle} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Vehicle Number
                        </label>
                        <input
                          type="text"
                          name="vehicle_number"
                          value={formData.vehicle_number}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Vehicle Type
                        </label>
                        <input
                          type="text"
                          name="vehicle_type"
                          value={formData.vehicle_type}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Model
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Insurance Status
                        </label>
                        <select
                          name="insurance_status"
                          value={formData.insurance_status}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          required
                        >
                          <option value="">Select status</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Insurance Expiry Date
                        </label>
                        <input
                          type="date"
                          name="insurance_expiry_date"
                          value={formData.insurance_expiry_date}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          PUC Status
                        </label>
                        <select
                          name="puc_status"
                          value={formData.puc_status}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          required
                        >
                          <option value="">Select status</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          PUC Expiry Date
                        </label>
                        <input
                          type="date"
                          name="puc_expiry_date"
                          value={formData.puc_expiry_date}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleUpdateVehicle}
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const DeleteConfirmationModal = () => (
    confirmDelete && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confirm Delete
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete this vehicle? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteVehicle(confirmDelete)}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )
  );

  const SuccessToast = () => (
    successMessage && (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
        {successMessage}
      </div>
    )
  );

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen bg-gray-100 dark:bg-gray-900`}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 z-50 w-64 transition duration-200 ease-in-out`}
      >
        <div className="h-full bg-white dark:bg-gray-800 shadow-lg flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="text-xl font-bold text-indigo-600">Admin Panel</h2>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            {/* Sidebar Navigation */}
            <div className="space-y-2">
              {[
                { id: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Users' },
                { id: 'vehicles', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Vehicles' },
                { id: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chat History' }
              ].map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setSearchTerm('');
                    setActivePanel(id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activePanel === id 
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                  </svg>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                {activePanel === 'users' ? 'User Management' : 
                 activePanel === 'vehicles' ? 'Vehicle Management' : 
                 'Chat History'}
              </h1>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              <NotificationBell />
              <button
                onClick={toggleTheme}
                type="button"
                className="theme-toggle-button"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <span className="hidden lg:inline text-gray-900 dark:text-white">Admin</span>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="p-4 lg:p-6 space-y-6">
            {panels[activePanel]}
          </div>
        </div>

        <EditModal />
        <DeleteConfirmationModal />
        <SuccessToast />
      </main>
    </div>
  );
};

export default AdminPanel;