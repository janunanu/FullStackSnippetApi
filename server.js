// 1. IMPORTS
const express = require('express');   // The web framework
const mongoose = require('mongoose'); // The database tool
const cors = require('cors');         // Allows browser requests from other domains
require('dotenv').config();           // Load variables from .env file

// 2. CONFIGURATION
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARE
app.use(cors());              // Enable Cross-Origin Resource Sharing
app.use(express.json());      // Allow server to read JSON data in POST/PUT requests

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
  description: String,    // Optional field
  tags: [String],         // An array of strings, e.g., ['web', 'db']
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

// GET ALL SNIPPETS (with Filtering and Limits) (CRUD: READ)
// Example call: GET /api/snippets?lang=javascript&limit=5
app.get('/api/snippets', async (req, res) => {
  try {
    const filter = {};
    if (req.query.lang) {
      filter.language = req.query.lang.toLowerCase();
    }

    const limit = parseInt(req.query.limit) || 0; // 0 means no limit if not specified

    const snippets = await Snippet.find(filter)
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE NEW SNIPPET (CRUD: CREATE)
app.post('/api/snippets', async (req, res) => {
  try {
    const newSnippet = new Snippet(req.body);
    const savedSnippet = await newSnippet.save();
    res.status(201).json(savedSnippet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET ONE SNIPPET BY ID (CRUD: READ DETAIL)
app.get('/api/snippets/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: 'Not found' });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE ONE SNIPPET BY ID (CRUD: UPDATE)
// Handles PUT requests from the client's Edit component
app.put('/api/snippets/:id', async (req, res) => {
  try {
    // FindByIdAndUpdate performs the find, update, and save operations atomically
    const updatedSnippet = await Snippet.findByIdAndUpdate(
      req.params.id, 
      req.body,      
      { 
        new: true,          // Returns the updated document
        runValidators: true // Runs schema validation before update
      } 
    );

    if (!updatedSnippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    res.json(updatedSnippet);
  } catch (err) {
    // 400 status for validation errors or bad input
    res.status(400).json({ message: err.message });
  }
});

// DELETE ONE SNIPPET BY ID (CRUD: DELETE)
app.delete('/api/snippets/:id', async (req, res) => {
  try {
    const result = await Snippet.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    // 204 No Content is standard for a successful DELETE
    res.status(204).send(); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 7. START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
