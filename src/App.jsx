import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatBot from './components/ChatBot';
import Login from './components/Login';
import Register from './components/Register';
import Vehicles from './components/Vehicles';
import AddVehicle from './components/AddVehicle';
import VehicleDetails from './components/VehicleDetails';
import AdminPanel from './components/AdminPanel';
import AdminRegister from './components/AdminRegister';
import AdminLogin from './components/AdminLogin';
import { AuthProvider, AuthContext } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <AuthContext.Consumer>
        {({ token, isAdmin, setToken, setIsAdmin }) => (
          <Router>
            <Routes>
              <Route path="/login" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/vehicles" />) : <Login setToken={setToken} />
              } />
              <Route path="/register" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/vehicles" />) : <Register setToken={setToken} />
              } />
              <Route path="/admin_register" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/vehicles" />) : <AdminRegister />
              } />
              <Route path="/admin_login" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/login" />) : <AdminLogin setIsAdmin={setIsAdmin} setToken={setToken} />
              } />
              <Route path="/" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/vehicles" />) : <Navigate to="/register" />
              } />
              <Route path="/vehicles" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <Vehicles setToken={setToken} />) : <Navigate to="/login" />
              } />
              <Route path="/vehicle/:id" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <VehicleDetails setToken={setToken} />) : <Navigate to="/login" />
              } />
              <Route path="/add-vehicle" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <AddVehicle />) : <Navigate to="/login" />
              } />
              <Route path="/chat" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <ChatBot />) : <Navigate to="/login" />
              } />
              <Route path="/admin" element={
                token ? (isAdmin ? <AdminPanel setToken={setToken} setIsAdmin={setIsAdmin} /> : <Navigate to="/vehicles" />) : <Navigate to="/admin_login" />
              } />
              <Route path="*" element={
                token ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/vehicles" />) : <Navigate to="/register" />
              } />
            </Routes>
          </Router>
        )}
      </AuthContext.Consumer>
    </AuthProvider>
  );
}

export default App;
