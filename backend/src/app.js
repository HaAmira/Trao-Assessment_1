const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const kitRoutes = require('./routes/kitRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration allowing cookies from frontend
app.use(cors({
  origin: [config.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
    llmProvider: config.LLM_PROVIDER
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;

