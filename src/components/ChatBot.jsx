import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Upload, LogOut, History, X, Sun, Moon, ArrowLeft, Trash2, MessageSquare } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import logo from './logo.png';
import '../styles/UserPages.css';

const Card = ({ children, className }) => <div className={className}>{children}</div>;
const CardContent = ({ children, className }) => <div className={className}>{children}</div>;
const Button = ({ children, className, onClick, variant }) => (
  <button className={`${className} ${variant === 'destructive' ? 'bg-red-500' : ''}`} onClick={onClick}>
    {children}
  </button>
);
const Input = ({ value, onChange, placeholder, type, className, onKeyDown }) => (
  <input 
    type={type || 'text'} 
    value={value} 
    onChange={onChange} 
    placeholder={placeholder}
    className={className}
    onKeyDown={onKeyDown}
  />
);
const ScrollArea = ({ children, className }) => (
  <div className={`overflow-y-auto h-full ${className}`} style={{ scrollbarWidth: 'thin' }}>
    {children}
  </div>
);

const ChatBotInner = () => {
  const navigate = useNavigate();
  const endOfMessages = useRef(null);

  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I can help you with vehicle-related queries. Ask me anything about cars, bikes, engines, etc." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [error, setError] = useState('');

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    setHistory(savedHistory);
  }, []);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    // Save chat history to localStorage
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    // Scroll to bottom
    endOfMessages.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('chatHistory');
      navigate('/login');
      window.location.reload(); // Ensure complete reset
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login'; // Fallback
    }
  };

  const isVehicleRelated = (text) => {
    const keywords = [
      // Vehicle types
      "car", "bike", "truck", "vehicle", "automobile", "scooter", "motorcycle", "auto", "van", "suv", "bus",
      
      // Vehicle parts and systems
      "engine", "motor", "gear", "transmission", "brake", "tire", "wheel", "battery", "fuel", "oil", "filter",
      "clutch", "steering", "suspension", "exhaust", "radiator", "ac", "light", "wiper", "horn", "seat",
      
      // Documents and compliance
      "puc", "insurance", "registration", "license", "permit", "document", "certificate", "renewal", "expiry",
      "pollution", "emission", "test", "inspection", "maintenance", "service",
      
      // Common actions and issues
      "repair", "fix", "check", "change", "replace", "install", "remove", "clean", "wash", "paint",
      "start", "stop", "drive", "park", "crash", "accident", "damage", "noise", "problem", "issue",
      
      // Measurements and specifications
      "speed", "mileage", "power", "capacity", "weight", "pressure", "temperature", "level", "performance"
    ];

    // Convert text to lowercase for case-insensitive matching
    const lowercaseText = text.toLowerCase();
    
    // Check if any keyword is present in the text
    return keywords.some(word => lowercaseText.includes(word)) || 
           // Also check for numbers followed by common units
           /\d+\s*(km|kmpl|cc|hp|mph|kg|liter|ml|psi)/.test(lowercaseText) ||
           // Check for common vehicle number patterns
           /[a-z]{2}\s*\d{2}\s*[a-z]{1,2}\s*\d{4}/.test(lowercaseText);
  };

  const saveToHistory = (messages) => {
    const newItem = {
      id: Date.now(),
      preview: messages.find(m => m.sender === 'user')?.text?.slice(0, 30) || "Conversation",
      time: new Date().toLocaleString(),
      messages,
    };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem("chatHistory", JSON.stringify(updated));
  };

  const sendMessage = async (customInput = null) => {
    const inputToSend = customInput || input;
    if (!inputToSend.trim() && !file) return;

    const newMessages = [...messages];

    if (file) {
      newMessages.push({ sender: "user", text: `📎 Uploaded a file: ${file.name}` });
      setFile(null);
    } else {
      newMessages.push({ sender: "user", text: inputToSend });
    }

    setMessages(newMessages);
    setInput("");

    if (!isVehicleRelated(inputToSend || file?.name || "")) {
      const updatedMessages = [...newMessages, { sender: "bot", text: "🚫 Sorry, I only handle vehicle-related queries." }];
      setMessages(updatedMessages);
      saveToHistory(updatedMessages);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login to use the chat");

      const response = await axios.post(
        'http://localhost:5000/api/chat',
        { query: inputToSend },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const botReply = response.data?.response || "⚠ Unexpected server reply.";
      const updatedMessages = [...newMessages, { sender: "bot", text: botReply }];
      setMessages(updatedMessages);
      saveToHistory(updatedMessages);
    } catch (error) {
      const errorMessage = error?.response?.status === 401
        ? "⚠ Please login to continue chatting"
        : error?.message?.includes("login")
          ? "⚠ Please login to use the chat"
          : "⚠ Oops! Something went wrong.";
      const updatedMessages = [...newMessages, { sender: "bot", text: errorMessage }];
      setMessages(updatedMessages);
      saveToHistory(updatedMessages);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (item) => {
    setMessages(item.messages);
    setShowHistory(false);
  };

  const handleDeleteHistory = (idToDelete) => {
    const updated = history.filter(item => item.id !== idToDelete);
    setHistory(updated);
    localStorage.setItem("chatHistory", JSON.stringify(updated));
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      localStorage.removeItem('chatHistory');
    }
  };

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* Header */}
      <header className="header-3d" style={{ 
        padding: '1rem',
        marginBottom: '0',
        borderRadius: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        backgroundColor: darkMode ? 'var(--background-darker)' : 'var(--background-lighter)',
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div className="flex items-center gap-3">
          <Link 
            to="/vehicles" 
            className="button-3d"
            style={{ 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <ArrowLeft size={20} color={darkMode ? '#fff' : '#000'} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageSquare size={20} color="white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Vehicle Assistant</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ask me anything about vehicles</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="button-3d"
            style={{ 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
              backgroundColor: darkMode ? 'var(--background-lighter)' : 'var(--background-darker)',
              color: darkMode ? 'var(--text-primary)' : '#fff'
            }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="button-3d"
            style={{ 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
              backgroundColor: darkMode ? 'var(--background-lighter)' : 'var(--background-darker)',
              color: darkMode ? 'var(--text-primary)' : '#fff'
            }}
          >
            <History size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="button-3d danger"
            style={{ 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <LogOut size={20} color="white" />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="chatbot-messages">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`chatbot-message ${message.sender}`}
            >
              {message.text}
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="chatbot-loading"
            >
              <div className="chatbot-loading-dots">
                <div className="chatbot-loading-dot" />
                <div className="chatbot-loading-dot" />
                <div className="chatbot-loading-dot" />
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Thinking...</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endOfMessages} />
      </div>

      {/* Input Area */}
      <div className="chatbot-input-container" style={{ 
        backgroundColor: darkMode ? 'var(--background-darker)' : 'var(--background-lighter)' 
      }}>
        <div className="chatbot-input-wrapper">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="chatbot-input"
            style={{
              backgroundColor: darkMode ? 'var(--background-darker)' : 'var(--background-lighter)',
              color: 'var(--text-primary)'
            }}
          />
          <Button
            onClick={() => sendMessage()}
            className="chatbot-button"
            disabled={loading || (!input.trim() && !file)}
          >
            <SendHorizonal size={20} color="white" />
          </Button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="chatbot-history"
            style={{
              backgroundColor: darkMode ? 'var(--background-darker)' : 'var(--background-lighter)'
            }}
          >
            <div className="chatbot-history-header">
              <h2 className="chatbot-history-title">Chat History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="chatbot-history-close"
                style={{ color: 'var(--text-primary)' }}
              >
                <X size={24} />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="empty-state">
                <p style={{ color: 'var(--text-secondary)' }}>No chat history yet</p>
              </div>
            ) : (
              history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="chatbot-history-item"
                  onClick={() => handleHistoryClick(item)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.preview}...
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {item.time}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(item.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded-full"
                      style={{
                        backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                      }}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatBot = () => (
  <div className="h-screen">
    <ChatBotInner />
  </div>
);

export default ChatBot;
