# 🚗 Vehicle Management System with AI Assistant 🤖

A complete web-based Vehicle Management System enhanced with an AI-powered assistant to streamline operations such as vehicle registration, management, monitoring, and intelligent interaction using voice/text input. This project is suitable for admins, users, and developers who want a smart interface for managing fleet systems efficiently.

## 📌 Features

- 🚘 **Vehicle Management**
  - Add, update, delete vehicle records
  - Assign vehicles to users
  - View detailed vehicle information

- 👥 **User Management**
  - Admin dashboard with user list
  - Vehicle-to-user mapping
  - Secure login/logout functionality

- 🤖 **AI Assistant**
  - Voice/text interface for tasks like:
    - "Show my vehicles"
    - "Add a new vehicle"
    - "Generate report"
  - Powered by Natural Language Processing (NLP)

- 📊 **Dashboard**
  - Admin dashboard for analytics and reports
  - Visualize vehicle status and usage

- 🔒 **Authentication**
  - Role-based access control (Admin/User)
  - JWT-based secure login

- 🌐 **Responsive UI**
  - Built with React.js
  - Clean and mobile-friendly design

## 🛠️ Tech Stack

**Frontend:**
- React.js
- TailwindCSS / Bootstrap
- Axios for API calls

**Backend:**
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT for authentication

**AI/NLP:**
- OpenAI / Dialogflow (for assistant integration)

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- MongoDB instance (local or Atlas)
- OpenAI API Key (optional, for AI assistant)

### Installation

# Clone the repository
git clone [https://github.com/your-username/vehicle-management-ai.git](https://github.com/purvilmodi/Vehicle-management-system-with-AI-assistent)
cd vehicle-management-ai

# Install backend dependencies
cd server
npm install

# Start backend
npm run dev

# Install frontend dependencies
cd ../client
npm install

# Start frontend
npm start

# env file

MONGO_URI=mongodb url

JWT_SECRET=your-secret-key-here 

OPENAI_API_KEY=openai key 



