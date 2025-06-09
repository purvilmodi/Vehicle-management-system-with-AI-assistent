import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = ({ onLogout }) => {
  return (
    <button
      onClick={onLogout}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
