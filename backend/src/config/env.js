const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_prep_kit',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_1234567890',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: 'token',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  // LLM Provider Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'auto' // 'gemini' | 'groq' | 'openai' | 'mock' | 'auto'
};

