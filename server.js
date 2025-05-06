const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./server/routes/auth');
const chatRoutes = require('./server/routes/chat');
const reportRoutes = require('./server/routes/reports');
const generateReport = require('./server/services/analyse');
const reportAnalysis = require('./server/services/reportAnalyse');
const alertRoutes = require('./server/routes/alert');
const machineRoutes = require('./server/routes/machineRoutes');
const dbConfig = require('./server/config/db');
const adminRouter = require('./server/routes/adminRoutes');
require('dotenv').config();





const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

// Connect to the database
dbConfig();

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', generateReport);
app.use('/api', reportAnalysis);
app.use('/api', alertRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/adminRoute', adminRouter);

app.get('/', (req, res) => {
  res.send('Medical Chatbot Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Routes

