
// 1. IMPORTS
const express = require('express');   // The web framework
const mongoose = require('mongoose'); // The database tool
const cors = require('cors');         // Allows browser requests from other domains
require('dotenv').config();            // Load variables from .env file

// 2. CONFIGURATION
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARE
app.use(cors());             // Enable Cross-Origin Resource Sharing
app.use(express.json());     // Allow server to read JSON data in POST requests

// 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('DB Connection Error:', err));

  // 5. SCHEMA DEFINITION
const snippetSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true // Title is mandatory
  },
  language: { 
    type: String, 
    required: true, 
    lowercase: true // Stores 'JavaScript' as 'javascript' for easier searching
  },
  code: { 
    type: String, 
    required: true 
  },
  description: String,   // Optional field
  tags: [String],        // An array of strings, e.g., ['web', 'db']
  created_at: { 
    type: Date, 
    default: Date.now // Automatically sets current date
  }
});

// Create the Model
const Snippet = mongoose.model('Snippet', snippetSchema);

// 6. ROUTES

// TEST ROUTE
app.get('/', (req, res) => {
  res.send('Snippet API is running!');
});

// GET ALL SNIPPETS (with Filtering and Limits)
// Example call: GET /api/snippets?lang=javascript&limit=5
app.get('/api/snippets', async (req, res) => {
  try {
    // 1. Check if user provided a 'lang' query parameter
    const filter = {};
    if (req.query.lang) {
      filter.language = req.query.lang.toLowerCase();
    }

    // 2. Check if user provided a limit (default to 10)
    const limit = parseInt(req.query.limit) || 10;

    // 3. Find snippets matching the filter, sort by newest, and limit results
    const snippets = await Snippet.find(filter)
      .sort({ created_at: -1 }) // -1 means descending order (newest first)
      .limit(limit);

    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE NEW SNIPPET
app.post('/api/snippets', async (req, res) => {
  try {
    // Create a new snippet using data from the request body
    const newSnippet = new Snippet(req.body);
    // Save it to the database
    const savedSnippet = await newSnippet.save();
    // Return the saved object with 201 Created status
    res.status(201).json(savedSnippet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET ONE SNIPPET BY ID
app.get('/api/snippets/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: 'Not found' });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});