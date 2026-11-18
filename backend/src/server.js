const app = require('./app');
const { connectDB } = require('./config/db');
const config = require('./config/env');

async function startServer() {
  // Connect to MongoDB (graceful fallback if offline)
  await connectDB();

  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`[Server] AI Interview Prep Kit Backend listening on port ${PORT}`);
    console.log(`[Server] Environment: ${config.NODE_ENV}`);
    console.log(`[Server] LLM Provider: ${config.LLM_PROVIDER}`);
  });
}

startServer();

