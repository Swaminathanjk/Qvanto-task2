const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
  
// Middleware
app.use(cors()); 
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/policies', require('./routes/policies'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Insurance Policy Approval System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
