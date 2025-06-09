import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Security-Policy'],
  credentials: true
}));

// Set Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' http://localhost:5000 http://localhost:5173"
  );
  next();
});
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Models
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

const Admin = mongoose.model('Admin', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle_number: { type: String, required: true },
  vehicle_type: { type: String, required: true },
  model: { type: String, required: true },
  insurance_status: { type: String, enum: ['active', 'expired'], required: true },
  insurance_expiry_date: { type: Date, required: true },
  puc_status: { type: String, enum: ['valid', 'expired'], required: true },
  puc_expiry_date: { type: Date, required: true },
  documents: [{
    fileName: String,
    filePath: String,
    uploadDate: Date
  }],
  createdAt: { type: Date, default: Date.now }
}));

const ChatHistory = mongoose.model('ChatHistory', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

// Middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');

  try {
    const decoded = jwt.verify(token, 'fixed-development-secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

const authenticateAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');

  try {
    const decoded = jwt.verify(token, 'fixed-development-secret');
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).send('Access denied: Admins only');
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

// Routes
app.post('/api/users/register', async (req, res) => {
  try {
    console.log('Received user registration request:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    const savedUser = await user.save();
    console.log('User registered successfully:', savedUser._id);
    
    const token = jwt.sign({ id: user._id }, 'fixed-development-secret');
    res.status(201).json({ token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid credentials');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid credentials');

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, 'fixed-development-secret');
    res.send({ token, isAdmin: user.isAdmin });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.post('/api/admin/register', async (req, res) => {
  try {
    console.log('Received admin registration request:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists:', email);
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword });
    const savedAdmin = await admin.save();
    console.log('Admin registered successfully:', savedAdmin._id);

    const token = jwt.sign({ id: admin._id, isAdmin: true }, 'fixed-development-secret');
    res.status(201).json({ token, isAdmin: true });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).send('Invalid credentials');

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) return res.status(400).send('Invalid credentials');

    const token = jwt.sign({ id: admin._id }, 'fixed-development-secret');
    res.send({ token });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Vehicle routes
app.post('/api/vehicles', authenticate, upload.single('documents'), async (req, res) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      model,
      insurance_status,
      insurance_expiry_date,
      puc_status,
      puc_expiry_date
    } = req.body;

    if (
      !vehicle_number || !vehicle_type || !model ||
      !insurance_status || !insurance_expiry_date ||
      !puc_status || !puc_expiry_date
    ) {
      return res.status(400).send('All fields are required.');
    }

    const vehicle = new Vehicle({
      userId: req.user.id,
      vehicle_number,
      vehicle_type,
      model,
      insurance_status,
      insurance_expiry_date: new Date(insurance_expiry_date),
      puc_status,
      puc_expiry_date: new Date(puc_expiry_date),
      documents: req.file ? [{
        fileName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        uploadDate: new Date()
      }] : []
    });

    await vehicle.save();
    res.status(201).send(vehicle);
  } catch (err) {
    console.error('Error saving vehicle:', err.message);
    res.status(400).send('Server error: ' + err.message);
  }
});

app.get('/api/vehicles', authenticate, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user.id });
    res.send(vehicles);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get('/api/vehicles/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }
    res.send(vehicle);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.put('/api/vehicles/:id', authenticate, async (req, res) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      model,
      insurance_status,
      insurance_expiry_date,
      puc_status,
      puc_expiry_date
    } = req.body;

    if (
      !vehicle_number || !vehicle_type || !model ||
      !insurance_status || !insurance_expiry_date ||
      !puc_status || !puc_expiry_date
    ) {
      return res.status(400).send('All fields are required.');
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        vehicle_number,
        vehicle_type,
        model,
        insurance_status,
        insurance_expiry_date: new Date(insurance_expiry_date),
        puc_status,
        puc_expiry_date: new Date(puc_expiry_date)
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }

    res.send(vehicle);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.delete('/api/vehicles/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }
    res.send({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Document routes
app.get('/api/vehicles/:id/documents', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }
    
    // Return the documents array from the vehicle
    res.send(vehicle.documents || []);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.post('/api/vehicles/:id/documents', authenticate, upload.array('documents', 5), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files uploaded');
    }

    const newDocuments = req.files.map(file => ({
      fileName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      uploadDate: new Date()
    }));

    // Add new documents to the vehicle's documents array
    if (!vehicle.documents) {
      vehicle.documents = [];
    }
    vehicle.documents.push(...newDocuments);
    await vehicle.save();

    res.status(201).send(newDocuments);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.delete('/api/vehicles/:id/documents/:documentId', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }

    const documentIndex = vehicle.documents.findIndex(doc => doc._id.toString() === req.params.documentId);
    if (documentIndex === -1) {
      return res.status(404).send('Document not found');
    }

    // Remove the document from the array
    vehicle.documents.splice(documentIndex, 1);
    await vehicle.save();

    res.send({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get('/api/vehicles/:id/documents/:documentId/download', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }

    const document = vehicle.documents.find(doc => doc._id.toString() === req.params.documentId);
    if (!document) {
      return res.status(404).send('Document not found');
    }

    // Send the file
    res.download(path.join(__dirname, document.filePath));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Admin routes
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersWithVehicles = await Promise.all(users.map(async (user) => {
      const vehicles = await Vehicle.find({ userId: user._id });
      return { user, vehicles };
    }));
    res.send(usersWithVehicles);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get('/api/admin/chat-history', authenticateAdmin, async (req, res) => {
  try {
    const histories = await ChatHistory.find().populate('userId', 'email');
    res.send(histories);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Chat route
app.post('/api/chat', authenticate, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Here you would typically integrate with a chatbot service
    // For now, we'll provide a simple response based on the query
    let response = '';
    
    if (query.toLowerCase().includes('insurance')) {
      response = 'Insurance is crucial for your vehicle. Make sure to keep it up to date and carry necessary documents.';
    } else if (query.toLowerCase().includes('puc')) {
      response = 'PUC (Pollution Under Control) certificate is mandatory. It needs to be renewed periodically.';
    } else if (query.toLowerCase().includes('maintenance') || query.toLowerCase().includes('service')) {
      response = 'Regular maintenance is key to vehicle longevity. Schedule service based on your vehicle\'s manual recommendations.';
    } else if (query.toLowerCase().includes('document') || query.toLowerCase().includes('papers')) {
      response = 'Important vehicle documents include: Registration Certificate, Insurance Policy, PUC Certificate, and Driving License.';
    } else {
      response = 'I understand your query about ' + query + '. Please provide more specific details about your vehicle-related question.';
    }

    // Save the chat history
    const chatHistory = new ChatHistory({
      userId: req.user.id,
      query,
      response
    });
    await chatHistory.save();

    res.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Port configuration
const PORT = 5000;

// Error handling for server startup
const startServer = async () => {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/vahaan_db';
    console.log('Attempting to connect with URI:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
