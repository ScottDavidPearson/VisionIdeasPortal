const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const XLSX = require('xlsx');
const DocumentStore = require('./DocumentStore');
require('dotenv').config();

// Add process event handlers to prevent unexpected shutdowns
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION - Server will NOT crash:', error);
  console.error('Stack trace:', error.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION - Server will NOT crash:', reason);
  console.error('Promise:', promise);
  // Don't exit - keep server running
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT (Ctrl+C). Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

console.log('🔒 Process event handlers installed - server should be more stable');

const app = express();
const PORT = process.env.PORT || 5002;

// Enable CORS for all routes - permissive for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Parse JSON bodies
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET || 'vision-ideas-portal-secret-key';

// Admin users (in production, this would be in a database with hashed passwords)
const adminUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123', // Plain text for demo - hash in production
    name: 'Product Manager',
    role: 'admin'
  },
  {
    id: 2,
    username: 'product',
    password: 'admin123', // Plain text for demo - hash in production
    name: 'Product Owner',
    role: 'admin'
  }
];

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  console.log(`🔐 Authentication check for ${req.method} ${req.path}`);
  const authHeader = req.headers['authorization'];
  console.log(`   Auth header: ${authHeader ? 'Present' : 'Missing'}`);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log(`   Token: ${token ? 'Present' : 'Missing'}`);

  if (!token) {
    console.log(`❌ Authentication failed: No token provided`);
    return res.status(401).json({ error: 'Access token required', success: false });
  }

  // Check if it's a mock token
  if (token.startsWith('mock-token-')) {
    console.log(`✅ Mock authentication successful for token: ${token.substring(0, 20)}...`);
    // Create a mock user object for mock authentication
    req.user = {
      id: 1,
      username: 'admin',
      name: 'Mock Admin User',
      role: 'admin'
    };
    return next();
  }

  // Otherwise, verify as JWT token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`❌ Authentication failed: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired token', success: false });
    }
    console.log(`✅ Authentication successful for user: ${user.username}`);
    req.user = user;
    next();
  });
};

// Middleware to verify JWT token for admin routes
const authenticateAdmin = (req, res, next) => {
  console.log(`🔐 Admin authentication check for ${req.method} ${req.path}`);
  const authHeader = req.headers['authorization'];
  console.log(`   Auth header: ${authHeader ? 'Present' : 'Missing'}`);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log(`   Token: ${token ? 'Present' : 'Missing'}`);

  if (!token) {
    console.log(`❌ Admin authentication failed: No token provided`);
    return res.status(401).json({ error: 'Access token required', success: false });
  }

  // Check if it's a mock token
  if (token.startsWith('mock-token-')) {
    console.log(`✅ Mock authentication successful for token: ${token.substring(0, 20)}...`);
    // Create a mock user object for mock authentication
    req.user = {
      id: 1,
      username: 'admin',
      name: 'Mock Admin User',
      role: 'admin'
    };
    return next();
  }

  // Otherwise, verify as JWT token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`❌ Admin authentication failed: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired token', success: false });
    }
    console.log(`✅ Admin authentication successful for user: ${user.username}`);
    req.user = user;
    next();
  });
};

// Initialize document store
const docStore = new DocumentStore();

// Initialize with sample data if no ideas exist
const initializeSampleData = async () => {
  const existingIdeas = await docStore.getAllIdeas();
  if (existingIdeas.length === 0) {
    console.log('📝 Initializing with sample data...');
    
    const sampleIdeas = [
      {
        id: await docStore.getNextId(),
        title: "AI-Powered Code Review Assistant",
        description: "Develop an intelligent code review system that uses machine learning to automatically detect bugs, security vulnerabilities, and suggest improvements in pull requests.",
        category: "SCM Suite - OMS",
        source: "Tech Debt",
        status: "submitted",
        priority: "high",
        authorName: "John Developer",
        authorEmail: "john@company.com",
        attachments: [],
        voteCount: 8,
        commentCount: 3,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: await docStore.getNextId(),
        title: "Employee Wellness Dashboard",
        description: "Create a comprehensive wellness platform that tracks employee health metrics, provides personalized wellness recommendations, and integrates with company benefits.",
        category: "Retail Management Suite - POS",
        source: "Market Gap",
        status: "under_review",
        priority: "medium",
        authorName: "Sarah Wilson",
        authorEmail: "sarah@company.com",
        attachments: [],
        voteCount: 12,
        commentCount: 5,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: await docStore.getNextId(),
        title: "Automated Customer Support Chatbot",
        description: "Build an intelligent chatbot that can handle 80% of customer inquiries automatically, reducing support ticket volume and improving response times.",
        category: "SCM Suite - WMS",
        source: "RFP/RFI",
        status: "approved",
        authorName: "Mike Chen",
        authorEmail: "mike@company.com",
        attachments: [],
        voteCount: 15,
        commentCount: 8,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const idea of sampleIdeas) {
      await docStore.saveIdea(idea);
    }
    
    await docStore.updateTotalCount();
    console.log('✅ Sample data initialized');
  }
};

// In-memory votes storage (could also be document-based)
let votes = {
  1: new Set(['user1', 'user2', 'user3']),
  2: new Set(['user1', 'user4', 'user5', 'user6']),
  3: new Set(['user2', 'user3', 'user4', 'user7', 'user8'])
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add permissive CSP for development
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;");
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.method === 'POST') {
    console.log(`   Body keys: ${Object.keys(req.body || {}).join(', ')}`);
  }
  next();
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Serve test upload page
app.get('/test-upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-upload.html'));
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📁 Multer destination called for file:', file.originalname);
    cb(null, 'data/uploads/');
  },
  filename: (req, file, cb) => {
    const extension = mime.extension(file.mimetype) || 'bin';
    const uniqueName = `${uuidv4()}.${extension}`;
    console.log('📝 Generated filename:', uniqueName, 'for', file.originalname);
    cb(null, uniqueName);
  }
});

// File filter for PDFs, images, and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // PDFs
    'application/pdf',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo', // .avi
    'video/x-ms-wmv',  // .wmv
    'video/webm',
    'video/ogg',
    'video/3gpp',      // .3gp
    'video/x-flv'      // .flv
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only PDFs, images, and videos are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (increased for videos)
    files: 5 // Maximum 5 files per upload
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint to check ideas data
app.get('/api/test/ideas', async (req, res) => {
  try {
    const ideas = await docStore.getAllIdeas();
    console.log('Debug - Ideas count:', ideas.length);
    console.log('Debug - First idea:', ideas[0]);
    res.json({
      success: true,
      count: ideas.length,
      ideas: ideas.slice(0, 2), // Just return first 2 for testing
      dataPath: path.join(__dirname, 'data'),
      ideaFiles: require('fs').readdirSync(path.join(__dirname, 'data', 'ideas')).length
    });
  } catch (error) {
    console.error('Debug - Error getting ideas:', error);
    res.status(500).json({
      error: error.message,
      success: false,
      stack: error.stack
    });
  }
});

// Super simple test endpoint
app.post('/api/test/basic', (req, res) => {
  console.log('=== BASIC TEST ENDPOINT ===');
  res.json({ success: true, message: 'Basic test works!', timestamp: new Date().toISOString() });
});

// Serve the CSV import test page
app.get('/test-import', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-csv-import.html'));
});

// Debug endpoint to check server status
app.get('/api/debug/status', (req, res) => {
  console.log('Debug status endpoint called');
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    dataDirectory: path.join(__dirname, 'data'),
    uploadsDirectory: path.join(__dirname, 'uploads')
  });
});

// Simplified roadmap report endpoint (no auth for testing)
app.post('/api/reports/roadmap-simple', (req, res) => {
  console.log('=== SIMPLE ROADMAP REPORT (NO AUTH) ===');
  console.log('Request received at:', new Date().toISOString());
  
  try {
    const { ideas = [] } = req.body;
    console.log('Ideas received:', ideas.length);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Roadmap Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: #f5f5f5; padding: 15px; text-align: center; border-radius: 8px; }
        .summary-card h3 { margin: 0; font-size: 1.5em; color: #1976d2; }
        .idea-card { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .idea-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .idea-meta { color: #666; font-size: 0.9em; margin-bottom: 10px; }
        .idea-description { color: #555; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Vision Ideas Portal</h1>
        <h2>Product Roadmap Report</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>${ideas.length}</h3>
            <p>Total Items</p>
        </div>
        <div class="summary-card">
            <h3>${ideas.filter(i => i.status === 'approved').length}</h3>
            <p>Approved</p>
        </div>
        <div class="summary-card">
            <h3>${ideas.filter(i => i.status === 'in_progress').length}</h3>
            <p>In Progress</p>
        </div>
        <div class="summary-card">
            <h3>${ideas.filter(i => i.status === 'completed').length}</h3>
            <p>Completed</p>
        </div>
    </div>

    <h2>Ideas Details</h2>
    ${ideas.map(idea => `
        <div class="idea-card">
            <div class="idea-title">${idea.title || 'Untitled'}</div>
            <div class="idea-meta">
                Status: ${(idea.status || 'unknown').replace('_', ' ')} | 
                Category: ${idea.category || 'No Category'} | 
                Votes: ${idea.voteCount || 0}
            </div>
            <div class="idea-description">${idea.description || 'No description available'}</div>
        </div>
    `).join('')}

    <div style="margin-top: 50px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
        <p>Vision Ideas Portal - Roadmap Report</p>
        <p>Use Ctrl+P to print or save as PDF</p>
    </div>
</body>
</html>`;

    console.log('HTML generated, sending response');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    console.log('Response sent successfully');
    
  } catch (error) {
    console.error('Simple report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint for PDF generation
app.post('/api/admin/reports/test', authenticateToken, (req, res) => {
  console.log('Test PDF endpoint called');
  console.log('Request body:', req.body);
  
  const simpleHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Test Report</title></head>
    <body>
      <h1>Test Report</h1>
      <p>Generated at: ${new Date().toISOString()}</p>
      <p>This is a simple test to verify HTML generation works.</p>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(simpleHtml);
  console.log('Test HTML sent successfully');
});

// Authentication endpoints

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        success: false
      });
    }

    // Check if user already exists
    const existingUser = await docStore.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        success: false
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (role is automatically set based on email domain)
    const user = await docStore.createUser({
      email,
      password: hashedPassword,
      name: name || ''
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ New user registered: ${email} (${user.role})`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      success: false
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        success: false
      });
    }

    // Find user by email
    const user = await docStore.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        success: false
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        success: false
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ User logged in: ${email} (${user.role})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      success: false
    });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Get all ideas
app.get('/api/ideas', async (req, res) => {
  try {
    const { category, status, source, search, tags, sortBy = 'newest' } = req.query;
    
    let filteredIdeas = await docStore.getAllIdeas();
    
    // Filter by category
    if (category) {
      filteredIdeas = filteredIdeas.filter(idea => idea.category === category);
    }
    
    // Filter by status
    if (status) {
      filteredIdeas = filteredIdeas.filter(idea => idea.status === status);
    }
    
    // Filter by source
    if (source) {
      filteredIdeas = filteredIdeas.filter(idea => idea.source === source);
    }
    
    // Filter by tags
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      filteredIdeas = filteredIdeas.filter(idea => {
        if (!idea.tags || !Array.isArray(idea.tags)) return false;
        return tagList.some(tag => idea.tags.includes(tag));
      });
    }
    
    // Search in title and description
    if (search) {
      const searchLower = search.toLowerCase();
      filteredIdeas = filteredIdeas.filter(idea => 
        idea.title.toLowerCase().includes(searchLower) || 
        idea.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort ideas
    switch (sortBy) {
      case 'oldest':
        filteredIdeas.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'most_voted':
        filteredIdeas.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
        break;
      case 'newest':
      default:
        filteredIdeas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    res.json({
      success: true,
      ideas: filteredIdeas,
      total: filteredIdeas.length
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({
      error: 'Failed to fetch ideas',
      success: false
    });
  }
});

// Get single idea
app.get('/api/ideas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idea = await docStore.getIdea(parseInt(id));
    
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }
    
    res.json({
      success: true,
      idea: idea
    });
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({
      error: 'Failed to fetch idea',
      success: false
    });
  }
});

// Create new idea
app.post('/api/ideas', async (req, res) => {
  try {
    const { title, description, category, source, authorName, authorEmail, attachments, tags } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        error: 'Title and description are required',
        success: false
      });
    }
    
    const newIdea = {
      id: await docStore.getNextId(),
      title,
      description,
      category: category || 'General',
      source: source || 'General',
      status: 'submitted',
      authorName: authorName || 'Anonymous',
      authorEmail: authorEmail || '',
      attachments: attachments || [],
      tags: tags || [],
      voteCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await docStore.saveIdea(newIdea);
    await docStore.updateTotalCount();
    
    res.status(201).json({
      success: true,
      message: 'Idea created successfully',
      idea: newIdea
    });
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({
      error: 'Failed to create idea',
      success: false
    });
  }
});

// Vote on idea
app.post('/api/ideas/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const ideaId = parseInt(id);
    
    console.log('🗳️ Vote request received:');
    console.log('  - Idea ID:', ideaId);
    console.log('  - Request body:', req.body);
    console.log('  - User ID from body:', userId);
    
    if (!userId) {
      console.log('❌ Vote failed: User ID is required');
      return res.status(400).json({
        error: 'User ID is required',
        success: false
      });
    }
    
    const idea = await docStore.getIdea(ideaId);
    
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }
    
    // Initialize votes set if not exists
    if (!votes[ideaId]) {
      votes[ideaId] = new Set();
    }
    
    const hasVoted = votes[ideaId].has(userId);
    
    if (hasVoted) {
      // Remove vote
      votes[ideaId].delete(userId);
      idea.voteCount = Math.max(0, (idea.voteCount || 0) - 1);
    } else {
      // Add vote
      votes[ideaId].add(userId);
      idea.voteCount = (idea.voteCount || 0) + 1;
    }
    
    // Save updated idea
    await docStore.saveIdea(idea);
    
    res.json({
      success: true,
      message: hasVoted ? 'Vote removed' : 'Vote added',
      voteCount: idea.voteCount,
      hasVoted: !hasVoted
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      error: 'Failed to process vote',
      success: false
    });
  }
});

// Admin endpoint to update idea (general update including category)
app.put('/api/admin/ideas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ideaId = parseInt(id);
    const updateData = req.body;
    
    console.log(`Admin ${req.user.username} updating idea ${ideaId} with data:`, updateData);
    
    const idea = await docStore.getIdea(ideaId);
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }

    // Update the idea with new data
    const updatedIdea = {
      ...idea,
      ...updateData,
      id: idea.id, // Preserve original ID
      createdAt: idea.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    console.log(`Updating idea ${ideaId} category to: "${updatedIdea.category}"`);

    await docStore.saveIdea(updatedIdea);
    
    res.json({
      success: true,
      message: 'Idea updated successfully',
      idea: updatedIdea
    });
  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({
      error: 'Failed to update idea',
      success: false
    });
  }
});

// Admin endpoint to update idea status
app.put('/api/admin/ideas/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ideaId = parseInt(id);

    if (!status) {
      return res.status(400).json({
        error: 'Status is required',
        success: false
      });
    }

    const validStatuses = ['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'parked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        success: false
      });
    }

    const idea = await docStore.getIdea(ideaId);
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }

    // Update idea status
    idea.status = status;
    idea.updatedAt = new Date().toISOString();
    idea.updatedBy = req.user.username;

    await docStore.saveIdea(idea);

    res.json({
      success: true,
      message: 'Idea status updated successfully',
      idea: idea
    });

  } catch (error) {
    console.error('Update idea status error:', error);
    res.status(500).json({
      error: 'Failed to update idea status',
      success: false
    });
  }
});

// Admin endpoint to update idea internal data (effort, requirements, features, use cases)
app.put('/api/admin/ideas/:id/internal', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedEffort, effortUnit, detailedRequirements, features, useCases } = req.body;
    const ideaId = parseInt(id);

    const idea = await docStore.getIdea(ideaId);
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }

    // Update internal data fields
    idea.estimatedEffort = estimatedEffort || '';
    idea.effortUnit = effortUnit || 'story_points';
    idea.detailedRequirements = detailedRequirements || '';
    idea.features = features || [];
    idea.useCases = useCases || [];
    idea.updatedAt = new Date().toISOString();
    idea.updatedBy = req.user.username;

    await docStore.saveIdea(idea);

    res.json({
      success: true,
      message: 'Internal data updated successfully',
      idea: idea
    });

  } catch (error) {
    console.error('Update idea internal data error:', error);
    res.status(500).json({
      error: 'Failed to update internal data',
      success: false
    });
  }
});

// Admin endpoint to promote idea to Azure DevOps (Epic or Feature)
app.post('/api/admin/ideas/:id/promote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { promotionType, additionalNotes, plannedRelease, azureProject } = req.body;
    const ideaId = parseInt(id);

    console.log('🚀 Promoting idea to Azure DevOps:');
    console.log('  - Idea ID:', ideaId);
    console.log(`Admin ${req.user.username} promoting idea ${ideaId} as ${promotionType}`);
    console.log('Request body:', { promotionType, additionalNotes, plannedRelease, azureProject });

    // Function to convert URLs to clickable HTML links with smart labeling
    const convertUrlsToLinks = (text) => {
      if (!text) return text;
      
      // Handle URLs with preceding descriptive text (e.g., "see enclosed SharePoint document https://...")
      const labeledUrlRegex = /(.{10,}?)\s+(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
      
      let result = text.replace(labeledUrlRegex, (match, precedingText, url) => {
        // Use the preceding text as the label, cleaned up
        let label = precedingText.trim();
        
        // Remove common prefixes to make it cleaner
        label = label.replace(/^(see\s+|view\s+|check\s+|visit\s+)/i, '');
        
        return `<a href="${url}">${label}</a>`;
      });
      
      // Handle any remaining standalone URLs
      const standaloneUrlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
      
      result = result.replace(standaloneUrlRegex, (url) => {
        // Skip if this URL is already part of a link
        if (result.includes(`href="${url}"`)) {
          return url; // Don't replace if already processed
        }
        
        let smartLabel = 'View Link';
        
        if (url.includes('sharepoint') || url.includes('onedrive')) {
          smartLabel = 'SharePoint/OneDrive Document';
        } else if (url.includes('loop.microsoft.com')) {
          smartLabel = 'Loop Workspace';
        } else if (url.includes('github.com')) {
          smartLabel = 'GitHub Repository';
        } else if (url.includes('teams.microsoft.com')) {
          smartLabel = 'Teams Meeting/Channel';
        } else if (url.includes('outlook.office.com')) {
          smartLabel = 'Outlook Item';
        }
        
        return `<a href="${url}">${smartLabel}</a>`;
      });
      
      return result;
    };

    const idea = await docStore.getIdea(ideaId);
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }

    // Check if idea is approved
    if (idea.status !== 'approved') {
      return res.status(400).json({
        error: 'Only approved ideas can be promoted',
        success: false
      });
    }

    // Check if already promoted
    if (idea.promoted) {
      return res.status(400).json({
        error: 'Idea has already been promoted',
        success: false
      });
    }

    // Get Azure DevOps settings from file
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    let azureConfig = null;
    
    try {
      const settingsData = await fs.promises.readFile(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      azureConfig = settings.azureDevOps;
    } catch (error) {
      console.log('No settings file found or error reading settings');
    }

    if (!azureConfig || !azureConfig.enabled || !azureConfig.organizationUrl || !azureConfig.personalAccessToken) {
      return res.status(400).json({
        error: 'Azure DevOps integration not configured',
        success: false
      });
    }

    // Create work item in Azure DevOps
    const workItemType = promotionType === 'epic' ? 'Epic' : 'Feature';
    const createUrl = `${azureConfig.organizationUrl}/${azureProject}/_apis/wit/workitems/$${workItemType}?api-version=6.0`;
    
    console.log('🌐 Creating work item URL:', createUrl);

    const auth = Buffer.from(`:${azureConfig.personalAccessToken}`).toString('base64');
    
    // Prepare work item data with all required fields
    const workItemData = [
      {
        "op": "add",
        "path": "/fields/System.Title",
        "value": idea.title || 'Untitled Idea'
      },
      {
        "op": "add",
        "path": "/fields/System.Description",
        "value": `<div><strong>Description:</strong><br/>${convertUrlsToLinks(idea.description) || 'No description provided'}</div><br/><div><strong>Original Idea Details:</strong><br/>Category: ${idea.category || 'Unknown'}<br/>Source: ${idea.source || 'Unknown'}<br/>Author: ${idea.author || 'Unknown'}<br/>Submitted: ${idea.createdAt || 'Unknown'}</div><br/><div><strong>Additional Notes:</strong><br/>${convertUrlsToLinks(additionalNotes) || 'None'}</div>`
      },
      {
        "op": "add",
        "path": "/fields/System.State",
        "value": "New"
      },
      {
        "op": "add",
        "path": "/fields/Microsoft.VSTS.Common.ValueArea",
        "value": "Business"
      },
      {
        "op": "add",
        "path": "/fields/Custom.Bucket",
        "value": "Roadmap"
      }
    ];

    // Add planned release quarter to the description or tags
    if (plannedRelease) {
      workItemData.push({
        "op": "add",
        "path": "/fields/System.Tags",
        "value": `Planned Release: ${plannedRelease}`
      });
    }

    console.log('✅ Including all required fields: Title, State, ValueArea, and Custom.Bucket');

    console.log('📋 Work item data being sent:', JSON.stringify(workItemData, null, 2));

    const azureResponse = await axios.post(createUrl, workItemData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json-patch+json'
      },
      timeout: 15000
    });

    if (azureResponse.status === 200 || azureResponse.status === 201) {
      const workItem = azureResponse.data;
      console.log('✅ Work item created successfully:', workItem.id);

      // Update idea with promotion data AND Azure DevOps work item ID
      idea.promoted = true;
      idea.promotionType = promotionType;
      idea.promotionNotes = additionalNotes || '';
      idea.plannedRelease = plannedRelease;
      idea.promotedAt = new Date().toISOString();
      idea.promotedBy = req.user.username;
      idea.status = 'in_progress';
      idea.updatedAt = new Date().toISOString();
      idea.updatedBy = req.user.username;
      
      // Store Azure DevOps work item details
      idea.azureWorkItem = {
        id: workItem.id,
        url: workItem.url,
        project: azureProject,
        type: workItemType,
        createdAt: new Date().toISOString()
      };

      await docStore.saveIdea(idea);

      res.json({
        success: true,
        message: `Idea promoted as ${promotionType} successfully. Work item #${workItem.id} created in Azure DevOps.`,
        idea: idea,
        workItem: {
          id: workItem.id,
          url: workItem.url,
          type: workItemType
        }
      });
    } else {
      throw new Error(`Azure DevOps API returned status ${azureResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Promote idea error:');
    console.error('  - Error message:', error.message);
    console.error('  - Response status:', error.response?.status);
    console.error('  - Response data:', error.response?.data);
    
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Failed to promote idea to Azure DevOps',
      success: false,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText
      }
    });
  }
});

// Admin endpoint to delete an idea
app.delete('/api/admin/ideas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Admin ${req.user.username} attempting to delete idea ${id}`);
    
    // Get the idea first to verify it exists
    const idea = await docStore.getIdea(id);
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }
    
    // Delete the idea
    const success = await docStore.deleteIdea(id);
    
    if (success) {
      console.log(`Idea ${id} deleted successfully by ${req.user.username}`);
      res.json({
        success: true,
        message: 'Idea deleted successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete idea',
        success: false
      });
    }

  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({
      error: 'Failed to delete idea',
      success: false
    });
  }
});

// Admin endpoint to get system settings
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    // Default configuration
    const defaultSettings = {
      productSuites: {
        'SCM Suite': ['WMS', 'OMS', 'Sourcing', 'Demand', 'Misc'],
        'Retail Management Suite': ['Merchandising', 'POS', 'Omni', 'WMS', 'Planning', 'TMP']
      },
      sources: [
        'Market Gap',
        'Tech Debt', 
        'RFP/RFI',
        'Client',
        'Analyst'
      ],
      statuses: {
        'submitted': {
          title: 'Submitted',
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        'under_review': {
          title: 'Under Review',
          color: '#ed6c02',
          bgColor: '#fff3e0'
        },
        'approved': {
          title: 'Approved',
          color: '#2e7d32',
          bgColor: '#e8f5e8'
        },
        'in_progress': {
          title: 'In Progress',
          color: '#0288d1',
          bgColor: '#e1f5fe'
        },
        'completed': {
          title: 'Completed',
          color: '#388e3c',
          bgColor: '#f1f8e9'
        },
        'parked': {
          title: 'Parking Lot',
          color: '#d32f2f',
          bgColor: '#ffebee'
        },
      },
      azureDevOps: {
        enabled: false,
        organizationUrl: '',
        project: '',
        personalAccessToken: '',
        areaPath: '',
        iterationPath: ''
      }
    };

    // Try to read existing settings from file
    const fs = require('fs');
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    let settings = defaultSettings;
    try {
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        settings = { ...defaultSettings, ...JSON.parse(settingsData) };
      }
    } catch (error) {
      console.log('Using default settings');
    }

    res.json({
      success: true,
      settings: settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Failed to get settings',
      success: false
    });
  }
});

// Admin endpoint to update system settings
app.put('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    
    // Save settings to file
    const fs = require('fs');
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: settings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      success: false
    });
  }
});

// Admin endpoint to test Azure DevOps connection
app.post('/api/admin/azure/test', authenticateToken, async (req, res) => {
  try {
    const { organizationUrl, project, personalAccessToken } = req.body;

    console.log('🔍 Azure DevOps Test Request:');
    console.log('  - Organization URL:', organizationUrl);
    console.log('  - Project:', project);
    console.log('  - PAT provided:', personalAccessToken ? 'Yes (length: ' + personalAccessToken.length + ')' : 'No');

    if (!organizationUrl || !project || !personalAccessToken) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        error: 'Organization URL, project, and PAT are required',
        success: false
      });
    }

    // Simple test - try to get project info
    // Correct Azure DevOps REST API format
    const testUrl = `${organizationUrl}/_apis/projects/${project}?api-version=6.0`;
    console.log('🌐 Test URL:', testUrl);
    
    const auth = Buffer.from(`:${personalAccessToken}`).toString('base64');
    console.log('🔐 Auth header created (length):', auth.length);
    
    const response = await axios.get(testUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      res.json({
        success: true,
        message: 'Azure DevOps connection successful',
        projectInfo: {
          name: response.data.name,
          id: response.data.id,
          state: response.data.state
        }
      });
    } else {
      res.status(400).json({
        error: 'Failed to connect to Azure DevOps',
        success: false
      });
    }

  } catch (error) {
    console.error('❌ Azure DevOps test error:');
    console.error('  - Error message:', error.message);
    console.error('  - Response status:', error.response?.status);
    console.error('  - Response data:', error.response?.data);
    console.error('  - Full error:', error);
    
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Azure DevOps connection failed',
      success: false,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url
      }
    });
  }
});

// Admin endpoint to fetch Azure DevOps projects
app.post('/api/admin/azure/projects', authenticateToken, async (req, res) => {
  try {
    const { organizationUrl, personalAccessToken } = req.body;

    console.log('🔍 Fetching Azure DevOps projects:');
    console.log('  - Organization URL:', organizationUrl);

    if (!organizationUrl || !personalAccessToken) {
      return res.status(400).json({
        error: 'Organization URL and PAT are required',
        success: false
      });
    }

    // Fetch all projects in the organization
    const projectsUrl = `${organizationUrl}/_apis/projects?api-version=6.0`;
    console.log('🌐 Projects URL:', projectsUrl);
    
    const auth = Buffer.from(`:${personalAccessToken}`).toString('base64');
    
    const response = await axios.get(projectsUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      const projects = response.data.value.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        state: project.state,
        url: project.url
      }));

      console.log(`✅ Found ${projects.length} projects`);
      
      res.json({
        success: true,
        message: `Found ${projects.length} projects`,
        projects: projects
      });
    } else {
      res.status(400).json({
        error: 'Failed to fetch projects from Azure DevOps',
        success: false
      });
    }

  } catch (error) {
    console.error('❌ Azure DevOps projects fetch error:');
    console.error('  - Error message:', error.message);
    console.error('  - Response status:', error.response?.status);
    console.error('  - Response data:', error.response?.data);
    
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Failed to fetch projects',
      success: false
    });
  }
});

// Admin endpoint to fetch work item type fields from Azure DevOps
app.post('/api/admin/azure/workitemtype', authenticateToken, async (req, res) => {
  try {
    const { organizationUrl, project, personalAccessToken, workItemType } = req.body;

    console.log('🔍 Fetching work item type definition:');
    console.log('  - Organization URL:', organizationUrl);
    console.log('  - Project:', project);
    console.log('  - Work Item Type:', workItemType);

    if (!organizationUrl || !project || !personalAccessToken || !workItemType) {
      return res.status(400).json({
        error: 'Organization URL, project, PAT, and work item type are required',
        success: false
      });
    }

    // Fetch work item type definition
    const typeUrl = `${organizationUrl}/${project}/_apis/wit/workitemtypes/${workItemType}?api-version=6.0`;
    console.log('🌐 Work item type URL:', typeUrl);
    
    const auth = Buffer.from(`:${personalAccessToken}`).toString('base64');
    
    const response = await axios.get(typeUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.status === 200) {
      const workItemTypeDef = response.data;
      const requiredFields = workItemTypeDef.fields?.filter(field => field.alwaysRequired || field.required) || [];
      
      console.log(`✅ Found work item type definition with ${requiredFields.length} required fields`);
      console.log('📋 Required fields details:', JSON.stringify(requiredFields, null, 2));
      
      res.json({
        success: true,
        message: `Found work item type definition for ${workItemType}`,
        workItemType: workItemTypeDef.name,
        requiredFields: requiredFields.map(field => ({
          name: field.name,
          referenceName: field.referenceName,
          type: field.type,
          required: field.alwaysRequired || field.required,
          allowedValues: field.allowedValues || field.allowedValuesList || 'No restrictions',
          defaultValue: field.defaultValue,
          helpText: field.helpText
        }))
      });
    } else {
      res.status(400).json({
        error: 'Failed to fetch work item type definition from Azure DevOps',
        success: false
      });
    }

  } catch (error) {
    console.error('❌ Azure DevOps work item type fetch error:');
    console.error('  - Error message:', error.message);
    console.error('  - Response status:', error.response?.status);
    console.error('  - Response data:', error.response?.data);
    
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Failed to fetch work item type definition',
      success: false
    });
  }
});

// Admin endpoint to fetch specific field definition from Azure DevOps
app.post('/api/admin/azure/field', authenticateToken, async (req, res) => {
  try {
    const { organizationUrl, personalAccessToken, fieldName } = req.body;

    console.log('🔍 Fetching field definition:');
    console.log('  - Organization URL:', organizationUrl);
    console.log('  - Field Name:', fieldName);

    if (!organizationUrl || !personalAccessToken || !fieldName) {
      return res.status(400).json({
        error: 'Organization URL, PAT, and field name are required',
        success: false
      });
    }

    // Fetch specific field definition
    const fieldUrl = `${organizationUrl}/_apis/wit/fields/${fieldName}?api-version=6.0`;
    console.log('🌐 Field URL:', fieldUrl);
    
    const auth = Buffer.from(`:${personalAccessToken}`).toString('base64');
    
    const response = await axios.get(fieldUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.status === 200) {
      const fieldDef = response.data;
      
      console.log(`✅ Found field definition for ${fieldName}`);
      console.log('📋 Field details:', JSON.stringify(fieldDef, null, 2));
      
      res.json({
        success: true,
        message: `Found field definition for ${fieldName}`,
        field: {
          name: fieldDef.name,
          referenceName: fieldDef.referenceName,
          type: fieldDef.type,
          isPicklist: fieldDef.isPicklist,
          picklistId: fieldDef.picklistId,
          allowedValues: fieldDef.allowedValues,
          defaultValue: fieldDef.defaultValue,
          description: fieldDef.description
        }
      });
    } else {
      res.status(400).json({
        error: 'Failed to fetch field definition from Azure DevOps',
        success: false
      });
    }

  } catch (error) {
    console.error('❌ Azure DevOps field fetch error:');
    console.error('  - Error message:', error.message);
    console.error('  - Response status:', error.response?.status);
    console.error('  - Response data:', error.response?.data);
    
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Failed to fetch field definition',
      success: false
    });
  }
});

// Admin endpoint to fetch picklist values from Azure DevOps
app.post('/api/admin/azure/picklist', authenticateToken, async (req, res) => {
  try {
    const { organizationUrl, personalAccessToken, picklistId } = req.body;

    console.log('🔍 Fetching picklist values:');
    console.log('  - Organization URL:', organizationUrl);
    console.log('  - Picklist ID:', picklistId);

    if (!organizationUrl || !personalAccessToken || !picklistId) {
      return res.status(400).json({
        error: 'Organization URL, PAT, and picklist ID are required',
        success: false
      });
    }

    // Fetch picklist values
    const picklistUrl = `${organizationUrl}/_apis/work/processes/lists/${picklistId}?api-version=6.0`;
    console.log('🌐 Picklist URL:', picklistUrl);
    
    const auth = Buffer.from(`:${personalAccessToken}`).toString('base64');
    
    const response = await axios.get(picklistUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.status === 200) {
      const picklistData = response.data;
      
      console.log(`✅ Found picklist with ${picklistData.items?.length || 0} items`);
      console.log('📋 Picklist details:', JSON.stringify(picklistData, null, 2));
      
      res.json({
        success: true,
        message: `Found picklist with ${picklistData.items?.length || 0} items`,
        picklist: {
          id: picklistData.id,
          name: picklistData.name,
          type: picklistData.type,
          items: picklistData.items || []
        }
      });
    } else {
      res.status(400).json({
        error: 'Failed to fetch picklist from Azure DevOps',
        success: false
      });
    }

  } catch (error) {
    console.error('❌ Azure DevOps picklist fetch error:');
    console.error('  - Error message:', error.message);
    console.error('  - Response status:', error.response?.status);
    console.error('  - Response data:', error.response?.data);
    
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Failed to fetch picklist',
      success: false
    });
  }
});

// Admin endpoint to get all ideas for dashboard
app.get('/api/admin/ideas', authenticateToken, async (req, res) => {
  try {
    console.log(`Admin ${req.user.username} fetching all ideas for dashboard`);
    
    const ideas = await docStore.getAllIdeas();
    console.log(`Found ${ideas.length} total ideas for admin dashboard`);
    
    // Normalize status values for all ideas
    const normalizedIdeas = ideas.map(idea => {
      const validStatuses = ['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'parked'];
      let status = idea.status || 'submitted';
      
      // Normalize common status variations
      status = status.toLowerCase().replace(/\s+/g, '_');
      if (!validStatuses.includes(status)) {
        console.log(`Normalizing invalid status "${idea.status}" to "submitted" for idea ${idea.id}`);
        status = 'submitted';
      }
      
      return {
        ...idea,
        status: status
      };
    });
    
    // Log some debug info about the ideas
    const statusCounts = {};
    normalizedIdeas.forEach(idea => {
      const status = idea.status || 'no_status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('Ideas by status after normalization:', statusCounts);
    
    res.json({
      success: true,
      ideas: normalizedIdeas,
      totalCount: normalizedIdeas.length,
      statusBreakdown: statusCounts
    });
  } catch (error) {
    console.error('Admin get ideas error:', error);
    res.status(500).json({
      error: 'Failed to fetch ideas',
      success: false
    });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    console.log('🔍 Categories API called');
    const fs = require('fs');
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    let categories = [];
    
    // Try to read from settings first
    if (fs.existsSync(settingsPath)) {
      try {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);
        
        // Generate categories from product suites configuration
        if (settings.productSuites && Object.keys(settings.productSuites).length > 0) {
          Object.entries(settings.productSuites).forEach(([suite, modules]) => {
            if (Array.isArray(modules) && modules.length > 0) {
              modules.forEach(module => {
                const category = `${suite} - ${module}`;
                categories.push(category);
              });
            }
          });
        }
      } catch (settingsError) {
        console.log('Could not read settings, falling back to ideas-based categories:', settingsError.message);
      }
    }
    
    // Only fall back to existing ideas if no valid settings found
    if (categories.length === 0) {
      const ideas = await docStore.getAllIdeas();
      categories = [...new Set(ideas.map(idea => idea.category).filter(Boolean))];
    }
    
    // If still no categories, provide default ones to ensure filters work
    if (categories.length === 0) {
      categories = [
        'Foundation - Infrastructure',
        'Foundation - Integration', 
        'Foundation - Components',
        'Retail Management Suite - POS',
        'Retail Management Suite - Planning',
        'SCM Suite - OMS',
        'SCM Suite - WMS'
      ];
      console.log('📂 Using default categories as fallback');
    }
    
    // Sort categories for consistent ordering
    categories.sort();
    
    console.log('📋 Returning categories:', categories);
    
    res.json({
      success: true,
      categories: categories,
      source: categories.length > 0 ? (fs.existsSync(settingsPath) ? 'settings' : 'ideas') : 'none'
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      success: false
    });
  }
});

// Get all sources
app.get('/api/sources', async (req, res) => {
  try {
    const fs = require('fs');
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    let sources = [];
    
    // Try to read from settings first
    if (fs.existsSync(settingsPath)) {
      try {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);
        
        // Use configured sources if available
        if (settings.sources && Array.isArray(settings.sources)) {
          sources = settings.sources;
        }
      } catch (settingsError) {
        console.log('Could not read settings, falling back to ideas-based sources');
      }
    }
    
    // If no sources from settings, fall back to existing ideas
    if (sources.length === 0) {
      const ideas = await docStore.getAllIdeas();
      sources = [...new Set(ideas.map(idea => idea.source).filter(Boolean))];
    }
    
    // Add default sources if none exist
    if (sources.length === 0) {
      sources = ['Market Gap', 'Tech Debt', 'RFP/RFI', 'Client', 'Analyst'];
    }
    
    // Sort sources for consistent ordering
    sources.sort();
    
    res.json({
      success: true,
      sources: sources
    });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({
      error: 'Failed to fetch sources',
      success: false
    });
  }
});

// Get all tags
app.get('/api/tags', async (req, res) => {
  try {
    const ideas = await docStore.getAllIdeas();
    const allTags = new Set();
    
    // Collect all tags from all ideas
    ideas.forEach(idea => {
      if (idea.tags && Array.isArray(idea.tags)) {
        idea.tags.forEach(tag => {
          if (tag && tag.trim()) {
            allTags.add(tag.trim());
          }
        });
      }
    });
    
    // Convert to array and sort
    const sortedTags = Array.from(allTags).sort();
    
    console.log(`📋 Found ${sortedTags.length} unique tags`);
    
    res.json({
      success: true,
      tags: sortedTags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      error: 'Failed to fetch tags',
      success: false
    });
  }
});

// Get ideas statistics
app.get('/api/stats', async (req, res) => {
  try {
    const ideas = await docStore.getAllIdeas();
    const totalIdeas = ideas.length;
    const totalVotes = Object.values(votes).reduce((sum, voteSet) => sum + voteSet.size, 0);
    const ideasByStatus = ideas.reduce((acc, idea) => {
      acc[idea.status] = (acc[idea.status] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      stats: {
        totalIdeas,
        totalVotes,
        ideasByStatus
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      success: false
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
        success: false
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Maximum 5 files allowed.',
        success: false
      });
    }
  }

  res.status(500).json({
    error: error.message || 'Internal server error',
    success: false
  });
});

// Create uploads directory if it doesn't exist (handled above in multer config)

// Debug upload endpoint
app.post('/api/debug/upload', upload.single('file'), (req, res) => {
  console.log('🧪 DEBUG UPLOAD - File received:', req.file ? 'YES' : 'NO');
  if (req.file) {
    console.log('🧪 DEBUG UPLOAD - File details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Check if file actually exists and read first few bytes
    const fs = require('fs');
    if (fs.existsSync(req.file.path)) {
      const buffer = fs.readFileSync(req.file.path);
      console.log('🧪 DEBUG UPLOAD - File size on disk:', buffer.length);
      console.log('🧪 DEBUG UPLOAD - First 50 bytes:', buffer.toString('utf8', 0, 50));
      
      // Check if file is corrupted (contains XML error)
      const content = buffer.toString('utf8');
      if (content.includes('<Error><Code>AccessDenied</Code>')) {
        console.log('❌ DEBUG UPLOAD - File is corrupted with Access Denied error');
        // Delete the corrupted file
        fs.unlinkSync(req.file.path);
        console.log('🗑️ DEBUG UPLOAD - Deleted corrupted file');
      }
    }
  }
  
  res.json({
    success: true,
    file: req.file,
    message: 'Debug upload complete'
  });
});

// Test route for debugging authentication
app.get('/api/admin/test', authenticateToken, (req, res) => {
  console.log('🧪 Admin test route accessed by:', req.user.username);
  res.json({
    success: true,
    message: 'Authentication working',
    user: req.user.username
  });
});

// Test Excel processing without file upload
app.post('/api/admin/test-excel', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testing Excel processing with sample data');
    
    // Create test CSV data
    const testData = [
      { Title: 'Test Idea', Description: 'This is a test idea' },
      { Title: 'Another Test', Description: 'Another test description' }
    ];
    
    console.log('Processing test data:', testData);
    
    const processedIdeas = [];
    for (let i = 0; i < testData.length; i++) {
      const row = testData[i];
      const idea = {
        title: row.Title,
        description: row.Description,
        category: '',
        source: 'Test Import',
        authorName: 'Test User',
        authorEmail: '',
        status: 'submitted',
        estimatedEffort: null,
        effortUnit: 'story_points',
        detailedRequirements: '',
        features: [],
        useCases: []
      };
      
      idea.id = await docStore.getNextId();
      idea.createdAt = new Date().toISOString();
      idea.updatedAt = new Date().toISOString();
      idea.voteCount = 0;
      idea.commentCount = 0;
      idea.attachments = [];
      idea.promoted = false;
      
      await docStore.saveIdea(idea);
      processedIdeas.push(idea);
    }
    
    await docStore.updateTotalCount();
    
    console.log('✅ Test Excel processing completed successfully');
    return res.json({
      success: true,
      message: `Successfully processed ${processedIdeas.length} test ideas`,
      ideas: processedIdeas
    });
    
  } catch (error) {
    console.error('❌ Test Excel processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process test Excel data',
      details: error.message
    });
  }
});

// Admin endpoint to import pre-mapped data
app.post('/api/admin/import/mapped-data', authenticateToken, async (req, res) => {
  try {
    console.log(`Admin ${req.user.username} importing mapped data`);
    const { data, mapping } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        error: 'No data array provided',
        success: false
      });
    }
    
    console.log(`Processing ${data.length} mapped rows`);
    console.log('Column mapping:', mapping);
    
    const processedIdeas = [];
    const processedComments = [];
    const errors = [];
    
    // First pass: Import all ideas
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;
      
      try {
        // Skip if this is a comment-only row (has comment but no idea data)
        if (row.isCommentOnly) continue;
        
        // Create idea from mapped data
        const idea = {
          title: (row.title || '').toString().trim(),
          description: (row.description || '').toString().trim(),
          category: (row.category || '').toString().trim(),
          source: (row.source || 'Mapped Import').toString().trim(),
          authorName: (row.authorName || 'Mapped Import').toString().trim(),
          authorEmail: (row.authorEmail || '').toString().trim(),
          status: row.status || 'submitted',
          priority: row.priority || 'medium',
          estimatedEffort: row.estimatedEffort || null,
          effortUnit: row.effortUnit || 'story_points',
          detailedRequirements: (row.detailedRequirements || '').toString().trim(),
          notes: (row.notes || '').toString().trim(),
          features: [],
          useCases: [],
          externalId: row.externalId || null, // Store external ID for comment reference
          originalRowIndex: i // Store original row index for comment reference
        };

        // Process features if provided
        if (row.features && typeof row.features === 'string') {
          idea.features = row.features.split(',').map(f => f.trim()).filter(f => f.length > 0);
        }

        // Process use cases if provided
        if (row.useCases && typeof row.useCases === 'string') {
          idea.useCases = row.useCases.split(',').map(u => u.trim()).filter(u => u.length > 0);
        }

        // Validate required fields
        if (!idea.title || idea.title === '') {
          errors.push({
            row: rowNum,
            error: 'Missing required field: Title',
            isComment: false
          });
          continue;
        }

        if (!idea.description || idea.description === '') {
          errors.push({
            row: rowNum,
            error: 'Missing required field: Description',
            isComment: false
          });
          continue;
        }

        // Generate ID and timestamps
        idea.id = await docStore.getNextId();
        idea.createdAt = new Date().toISOString();
        idea.updatedAt = new Date().toISOString();
        idea.voteCount = row.voteCount || 0;
        idea.commentCount = 0; // Will be updated when comments are added
        idea.attachments = [];
        idea.promoted = false;

        await docStore.saveIdea(idea);
        processedIdeas.push(idea);
        
        console.log(`✅ Saved mapped idea: ${idea.title}`);
        
      } catch (error) {
        errors.push({
          row: rowNum,
          error: `Processing error: ${error.message}`,
          isComment: false
        });
      }
    }
    
    // Second pass: Import comments and associate with ideas
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;
      
      try {
        // Skip if no comment data or if it's not a comment row
        if (!row.commentContent && !row.isCommentOnly) continue;
        
        let ideaId;
        
        // If this is a comment-only row, it should have a reference to an existing idea
        if (row.isCommentOnly) {
          if (row.ideaExternalId) {
            // Find idea by external ID
            const allIdeas = await docStore.getAllIdeas();
            const targetIdea = allIdeas.find(idea => idea.externalId === row.ideaExternalId);
            if (!targetIdea) {
              errors.push({
                row: rowNum,
                error: `Could not find idea with external ID: ${row.ideaExternalId}`,
                isComment: true
              });
              continue;
            }
            ideaId = targetIdea.id;
          } else if (row.ideaRowIndex !== undefined) {
            // Find idea by original row index
            const targetIdea = processedIdeas.find(idea => idea.originalRowIndex === row.ideaRowIndex);
            if (!targetIdea) {
              errors.push({
                row: rowNum,
                error: `Could not find idea at row index: ${row.ideaRowIndex}`,
                isComment: true
              });
              continue;
            }
            ideaId = targetIdea.id;
          } else {
            errors.push({
              row: rowNum,
              error: 'Comment row is missing idea reference (need ideaExternalId or ideaRowIndex)',
              isComment: true
            });
            continue;
          }
        } else {
          // This is a regular row with a comment
          const idea = processedIdeas.find(idea => idea.originalRowIndex === i);
          if (!idea) continue; // Skip if the idea wasn't created
          ideaId = idea.id;
        }
        
        // Create the comment
        const commentData = {
          content: row.commentContent || '',
          authorName: row.commentAuthor || 'Imported User',
          authorEmail: row.commentAuthorEmail || '',
          createdAt: row.commentDate || new Date().toISOString(),
          updatedAt: row.commentDate || new Date().toISOString()
        };
        
        const comment = await createComment(ideaId, commentData);
        processedComments.push({
          id: comment.id,
          ideaId: ideaId,
          content: comment.content
        });
        
        console.log(`💬 Added comment to idea ${ideaId}`);
        
      } catch (error) {
        errors.push({
          row: rowNum,
          error: `Comment processing error: ${error.message}`,
          isComment: true
        });
      }
    }
    
    // Clean up temporary fields from ideas
    for (const idea of processedIdeas) {
      if (idea.externalId !== undefined) delete idea.externalId;
      if (idea.originalRowIndex !== undefined) delete idea.originalRowIndex;
      await docStore.saveIdea(idea);
    }
    
    // Update total count
    await docStore.updateTotalCount();
    
    console.log(`Import completed: ${processedIdeas.length} ideas and ${processedComments.length} comments saved, ${errors.length} errors`);
    
    res.json({
      success: true,
      message: `Successfully imported ${processedIdeas.length} ideas and ${processedComments.length} comments`,
      importedIdeas: processedIdeas.length,
      importedComments: processedComments.length,
      errorCount: errors.length,
      errors: errors
    });
    
  } catch (error) {
    console.error('Mapped import error:', error);
    res.status(500).json({
      error: 'Failed to import mapped data',
      details: error.message,
      success: false
    });
  }
});

// Clean up categories - remove invalid categories from ideas
app.post('/api/admin/cleanup-categories', authenticateToken, async (req, res) => {
  try {
    console.log(`Admin ${req.user.username} cleaning up categories`);
    
    const fs = require('fs');
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    // Get valid categories from settings
    let validCategories = [];
    if (fs.existsSync(settingsPath)) {
      try {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);
        
        if (settings.productSuites && Object.keys(settings.productSuites).length > 0) {
          Object.entries(settings.productSuites).forEach(([suite, modules]) => {
            if (Array.isArray(modules) && modules.length > 0) {
              modules.forEach(module => {
                validCategories.push(`${suite} - ${module}`);
              });
            }
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Could not read settings configuration',
          success: false
        });
      }
    }

    if (validCategories.length === 0) {
      return res.status(400).json({
        error: 'No valid categories found in settings',
        success: false
      });
    }

    // Get all ideas and find ones with invalid categories
    const allIdeas = await docStore.getAllIdeas();
    const ideasToUpdate = allIdeas.filter(idea => 
      idea.category && 
      idea.category.trim() !== '' && 
      !validCategories.includes(idea.category)
    );

    console.log(`Found ${ideasToUpdate.length} ideas with invalid categories`);
    console.log('Valid categories:', validCategories);
    console.log('Invalid categories found:', [...new Set(ideasToUpdate.map(idea => idea.category))]);

    // Update ideas to remove invalid categories
    let updatedCount = 0;
    for (const idea of ideasToUpdate) {
      try {
        const updatedIdea = {
          ...idea,
          category: '', // Clear invalid category
          updatedAt: new Date().toISOString()
        };
        
        await docStore.saveIdea(updatedIdea);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update idea ${idea.id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${updatedCount} ideas with invalid categories`,
      statistics: {
        totalIdeas: allIdeas.length,
        invalidCategories: ideasToUpdate.length,
        updated: updatedCount,
        validCategories: validCategories
      }
    });

  } catch (error) {
    console.error('Category cleanup error:', error);
    res.status(500).json({
      error: 'Failed to clean up categories',
      details: error.message,
      success: false
    });
  }
});

// Simple CSV import endpoint - accepts CSV text data instead of file upload
app.post('/api/admin/import/csv-text', authenticateToken, async (req, res) => {
  try {
    console.log(`Admin ${req.user.username} importing CSV text data`);
    const { csvText } = req.body;
    
    if (!csvText || csvText.trim() === '') {
      return res.status(400).json({
        error: 'No CSV text provided',
        success: false
      });
    }
    
    console.log('Processing CSV text data...');
    
    // Parse CSV text manually
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1);
    
    console.log('Headers found:', headers);
    console.log('Data rows:', dataRows.length);
    
    const processedIdeas = [];
    const errors = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i].split(',').map(d => d.trim());
      const rowNum = i + 2; // Excel row number
      
      try {
        // Create row object
        const row = {};
        headers.forEach((header, index) => {
          row[header] = rowData[index] || '';
        });
        
        console.log(`Processing row ${rowNum}:`, row);
        
        // Map to idea object
        const idea = {
          title: row.Title || row.title || '',
          description: row.Description || row.description || '',
          category: row.Category || row.category || '',
          source: row.Source || row.source || 'CSV Import',
          authorName: row.Author || row.author || 'CSV Import',
          authorEmail: row.Email || row.email || '',
          status: 'submitted',
          estimatedEffort: null,
          effortUnit: 'story_points',
          detailedRequirements: '',
          features: [],
          useCases: []
        };
        
        // Validate required fields
        if (!idea.title || idea.title.trim() === '') {
          errors.push({
            row: rowNum,
            error: 'Missing required field: Title'
          });
          continue;
        }
        
        if (!idea.description || idea.description.trim() === '') {
          errors.push({
            row: rowNum,
            error: 'Missing required field: Description'
          });
          continue;
        }
        
        // Generate ID and timestamps
        idea.id = await docStore.getNextId();
        idea.createdAt = new Date().toISOString();
        idea.updatedAt = new Date().toISOString();
        idea.voteCount = 0;
        idea.commentCount = 0;
        idea.attachments = [];
        idea.promoted = false;
        
        await docStore.saveIdea(idea);
        processedIdeas.push(idea);
        
        console.log(`✅ Saved idea: ${idea.title}`);
        
      } catch (error) {
        errors.push({
          row: rowNum,
          error: `Processing error: ${error.message}`
        });
      }
    }
    
    // Update total count
    await docStore.updateTotalCount();
    
    console.log(`CSV import completed: ${processedIdeas.length} ideas saved, ${errors.length} errors`);
    
    res.json({
      success: true,
      message: `Successfully imported ${processedIdeas.length} ideas from CSV`,
      statistics: {
        totalRows: dataRows.length,
        processed: processedIdeas.length,
        saved: processedIdeas.length,
        errors: errors.length
      },
      errors: errors
    });
    
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({
      error: 'Failed to import CSV data',
      details: error.message,
      success: false
    });
  }
});

// Admin endpoint to import ideas from Excel spreadsheet
app.post('/api/admin/import/excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
  try {
    console.log(`Admin ${req.user.username} attempting to import ideas from Excel`);
    console.log('Request file:', req.file ? 'Present' : 'Missing');
    console.log('Request body keys:', Object.keys(req.body));
    
    if (!req.file) {
      console.log('❌ No file provided in request');
      return res.status(400).json({
        error: 'No Excel file provided',
        success: false
      });
    }

    console.log('📁 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.',
        success: false
      });
    }

    // Read the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Parsed ${jsonData.length} rows from Excel file`);

    // Validate and process ideas
    const processedIdeas = [];
    const errors = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // Excel row number (accounting for header)
      
      try {
        // Map Excel columns to idea fields (flexible column names)
        const idea = {
          title: row.Title || row.title || row.TITLE || row['Idea Title'] || row['title'] || '',
          description: row.Description || row.description || row.DESCRIPTION || row['Idea Description'] || row['desc'] || '',
          category: row.Category || row.category || row.CATEGORY || row['Product Suite'] || row['Suite'] || '',
          source: row.Source || row.source || row.SOURCE || row['Idea Source'] || 'Excel Import',
          authorName: row.Author || row.author || row.AUTHOR || row['Author Name'] || row['Submitted By'] || 'Excel Import',
          authorEmail: row.Email || row.email || row.EMAIL || row['Author Email'] || row['Contact'] || '',
          status: (row.Status || row.status || row.STATUS || 'submitted').toString().toLowerCase(),
          estimatedEffort: row['Estimated Effort'] || row['Effort'] || row.effort || null,
          effortUnit: row['Effort Unit'] || row['Unit'] || 'story_points',
          detailedRequirements: row['Technical Requirements'] || row['Requirements'] || row.requirements || '',
          features: [],
          useCases: []
        };

        // Process features safely
        const featuresText = row.Features || row.features || '';
        if (featuresText && typeof featuresText === 'string') {
          idea.features = featuresText.split(',').map(f => f.trim()).filter(f => f.length > 0);
        }

        // Process use cases safely  
        const useCasesText = row['Use Cases'] || row['useCases'] || row.usecases || '';
        if (useCasesText && typeof useCasesText === 'string') {
          idea.useCases = useCasesText.split(',').map(u => u.trim()).filter(u => u.length > 0);
        }

        // Validate required fields (only title and description are required)
        if (!idea.title || idea.title.trim() === '') {
          errors.push({
            row: rowNum,
            error: 'Missing required field: Title is required'
          });
          continue;
        }

        if (!idea.description || idea.description.trim() === '') {
          errors.push({
            row: rowNum,
            error: 'Missing required field: Description is required'
          });
          continue;
        }

        // Clean up title and description
        idea.title = idea.title.trim();
        idea.description = idea.description.trim();

        // Validate status
        const validStatuses = ['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'parked'];
        if (!validStatuses.includes(idea.status)) {
          idea.status = 'submitted'; // Default to submitted if invalid
        }

        // Generate ID and timestamps
        idea.id = await docStore.getNextId();
        idea.createdAt = new Date().toISOString();
        idea.updatedAt = new Date().toISOString();
        idea.voteCount = 0;
        idea.commentCount = 0;
        idea.attachments = [];
        idea.promoted = false;

        processedIdeas.push(idea);
        
      } catch (error) {
        errors.push({
          row: rowNum,
          error: `Processing error: ${error.message}`
        });
      }
    }

    // Save processed ideas to database
    let savedCount = 0;
    const saveErrors = [];

    for (const idea of processedIdeas) {
      try {
        await docStore.saveIdea(idea);
        savedCount++;
      } catch (error) {
        saveErrors.push({
          title: idea.title,
          error: error.message
        });
      }
    }

    // Update total count
    await docStore.updateTotalCount();

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Could not delete temporary file:', cleanupError.message);
    }

    console.log(`Excel import completed: ${savedCount} ideas saved, ${errors.length + saveErrors.length} errors`);

    res.json({
      success: true,
      message: `Successfully imported ${savedCount} ideas from Excel`,
      statistics: {
        totalRows: jsonData.length,
        processed: processedIdeas.length,
        saved: savedCount,
        errors: errors.length + saveErrors.length
      },
      errors: [...errors, ...saveErrors]
    });

  } catch (error) {
    console.error('Excel import error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete temporary file:', cleanupError.message);
      }
    }
    
    res.status(500).json({
      error: 'Failed to import Excel file',
      details: error.message,
      success: false
    });
  }
});

// Admin endpoint to download Excel template
app.get('/api/admin/import/template', authenticateToken, (req, res) => {
  try {
    console.log(`Admin ${req.user.username} downloading Excel template`);
    console.log('XLSX library available:', typeof XLSX);
    
    // Create template data
    const templateData = [
      {
        'Title': 'Sample Idea Title',
        'Description': 'Detailed description of the idea including background, goals, and expected outcomes',
        'Category': 'SCM Suite - WMS',
        'Source': 'Market Gap',
        'Author': 'John Doe',
        'Email': 'john.doe@company.com',
        'Status': 'submitted',
        'Estimated Effort': '5',
        'Effort Unit': 'story_points',
        'Technical Requirements': 'Technical details and implementation notes',
        'Features': 'Feature 1, Feature 2, Feature 3',
        'Use Cases': 'Use Case 1, Use Case 2'
      }
    ];

    console.log('Creating workbook...');
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    console.log('Adding worksheet to workbook...');
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ideas Template');
    
    console.log('Generating buffer...');
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('Buffer generated, size:', buffer.length);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ideas-import-template.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    console.log('Sending buffer to client...');
    res.send(buffer);
    console.log('Template download completed successfully');
    
  } catch (error) {
    console.error('Template download error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to generate template',
      details: error.message,
      success: false
    });
  }
});

// Admin endpoint to generate roadmap PDF report
app.post('/api/admin/reports/roadmap', authenticateToken, async (req, res) => {
  console.log('=== PDF GENERATION STARTED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User:', req.user);
  
  try {
    const { filters, ideas, generatedAt, summary } = req.body;
    console.log('Request data received:');
    console.log('- Ideas count:', ideas?.length);
    console.log('- Filters:', JSON.stringify(filters, null, 2));
    console.log('- Summary:', JSON.stringify(summary, null, 2));
    
    if (!ideas || ideas.length === 0) {
      console.log('ERROR: No ideas provided');
      return res.status(400).json({
        error: 'No ideas provided for report generation',
        success: false
      });
    }
    
    // Create a simple HTML report that can be printed as PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vision Ideas Portal - Roadmap Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.4;
            font-size: 11pt;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #1976d2;
            margin: 0;
            font-size: 1.8em;
        }
        .header .subtitle {
            color: #666;
            font-size: 1em;
            margin-top: 5px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .summary-card {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            border-left: 3px solid #1976d2;
        }
        .summary-card h3 {
            margin: 0;
            font-size: 1.5em;
            color: #1976d2;
        }
        .summary-card p {
            margin: 3px 0 0 0;
            color: #666;
            font-weight: bold;
            font-size: 0.9em;
        }
        .idea-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .idea-title {
            font-size: 1.1em;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        .idea-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 8px;
        }
        .meta-chip {
            background: #e3f2fd;
            color: #1976d2;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.85em;
        }
        .meta-chip.approved {
            background: #e8f5e8;
            color: #2e7d32;
        }
        .idea-description {
            color: #666;
            margin-bottom: 10px;
            line-height: 1.4;
            font-size: 0.95em;
        }
        h2 {
            color: #1976d2;
            margin-top: 20px;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.85em;
        }
        @media print {
            @page {
                size: letter;
                margin: 0.75in;
            }
            body { 
                margin: 0;
                padding: 0;
            }
            .header {
                page-break-after: avoid;
            }
            .summary {
                page-break-after: avoid;
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
            h2 {
                page-break-after: avoid;
                page-break-before: auto;
            }
            .idea-card { 
                break-inside: avoid;
                page-break-inside: avoid;
                margin-bottom: 10px;
            }
            .footer {
                page-break-before: avoid;
            }
            /* Ensure header doesn't repeat on every page */
            .header {
                position: relative;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Vision Ideas Portal</h1>
        <div class="subtitle">Product Roadmap Report</div>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>${ideas?.length || 0}</h3>
            <p>Total Items</p>
        </div>
        <div class="summary-card">
            <h3>${ideas?.filter(i => i.status === 'approved').length || 0}</h3>
            <p>Approved</p>
        </div>
        <div class="summary-card">
            <h3>${ideas?.filter(i => i.status === 'in_progress').length || 0}</h3>
            <p>In Progress</p>
        </div>
        <div class="summary-card">
            <h3>${ideas?.filter(i => i.status === 'completed').length || 0}</h3>
            <p>Completed</p>
        </div>
    </div>

    <h2>Ideas Details</h2>
    ${(ideas || []).map(idea => `
        <div class="idea-card">
            <div class="idea-title">${idea.title || 'Untitled'}</div>
            <div class="idea-meta">
                <span class="meta-chip ${idea.status === 'approved' ? 'approved' : ''}">${(idea.status || 'unknown').replace('_', ' ')}</span>
                <span class="meta-chip">${idea.category || 'No Category'}</span>
                <span class="meta-chip">${idea.source || 'Unknown Source'}</span>
                ${idea.voteCount ? `<span class="meta-chip">${idea.voteCount} votes</span>` : ''}
                ${idea.estimatedEffort ? `<span class="meta-chip">${idea.estimatedEffort} ${idea.effortUnit === 'story_points' ? 'SP' : 'MD'}</span>` : ''}
            </div>
            <div class="idea-description">${idea.description || 'No description available'}</div>
            ${idea.features && idea.features.length ? `
                <div><strong>Features:</strong> ${idea.features.join(', ')}</div>
            ` : ''}
            ${idea.useCases && idea.useCases.length ? `
                <div><strong>Use Cases:</strong> ${idea.useCases.join(', ')}</div>
            ` : ''}
        </div>
    `).join('')}

    <div class="footer">
        <p>Vision Ideas Portal - Product Roadmap Report</p>
        <p>This report can be printed to PDF using your browser's print function (Ctrl+P → Save as PDF)</p>
    </div>
</body>
</html>`;

    console.log('HTML report generated');
    
    // Send HTML that can be printed as PDF
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'inline; filename="roadmap-report.html"');
    res.send(html);
    console.log('HTML report sent to client');
    
  } catch (error) {
    console.error('Generate roadmap report error:', error);
    res.status(500).json({
      error: 'Failed to generate roadmap report: ' + error.message,
      success: false,
      details: error.stack
    });
  }
});

// Start server and initialize sample data
const startServer = async () => {
  try {
    await initializeSampleData();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Vision Ideas Portal server running on port ${PORT}`);
      console.log(`🌐 Server accessible at:`);
      console.log(`   - Local: http://localhost:${PORT}`);
      console.log(`   - Network: http://0.0.0.0:${PORT}`);
      console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
      console.log(`📄 Document storage: ${path.join(__dirname, 'data')}`);
      console.log(`📋 Routes registered:`);
      console.log(`   - POST /api/admin/reports/roadmap`);
      console.log(`   - POST /api/reports/roadmap-simple`);
      console.log(`   - POST /api/test/simple-report`);
      console.log(`   - POST /api/admin/import/excel`);
      console.log(`   - GET /api/admin/import/template`);
      console.log(`   - DELETE /api/admin/ideas/:id`);
      console.log(`   - GET /api/debug/status`);
      console.log(`✅ Server ready for requests`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ===== TAGS API ENDPOINTS =====

// Get all unique tags
app.get('/api/tags', async (req, res) => {
  try {
    const ideas = await docStore.getAllIdeas();
    const allTags = new Set();
    
    ideas.forEach(idea => {
      if (idea.tags && Array.isArray(idea.tags)) {
        idea.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag.trim());
          }
        });
      }
    });
    
    res.json({
      success: true,
      tags: Array.from(allTags).sort()
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
});

// Get ideas by tag
app.get('/api/ideas/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const ideas = await docStore.getAllIdeas();
    
    const filteredIdeas = ideas.filter(idea => 
      idea.tags && 
      Array.isArray(idea.tags) && 
      idea.tags.some(t => t && t.toLowerCase() === tag.toLowerCase())
    );
    
    res.json({
      success: true,
      ideas: filteredIdeas
    });
  } catch (error) {
    console.error('Error fetching ideas by tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ideas by tag'
    });
  }
});

// ===== COMMENTS API ENDPOINTS =====

// Get comment counts for multiple ideas (for card badges)
app.post('/api/ideas/comment-counts', async (req, res) => {
  try {
    const { ideaIds } = req.body;
    console.log(`📥 POST /api/ideas/comment-counts - ${new Date().toISOString()}`);
    console.log(`   Requesting counts for ${ideaIds?.length || 0} ideas:`, ideaIds?.slice(0, 3));
    
    if (!Array.isArray(ideaIds)) {
      return res.status(400).json({
        error: 'ideaIds must be an array',
        success: false
      });
    }
    
    const commentCounts = {};
    
    // Get comment counts for each idea
    for (const ideaId of ideaIds) {
      try {
        const count = await docStore.getCommentCount(ideaId);
        commentCounts[ideaId] = count;
        if (count > 0) {
          console.log(`   💬 Idea ${ideaId}: ${count} comments`);
        }
      } catch (error) {
        console.error(`Error getting comment count for idea ${ideaId}:`, error);
        commentCounts[ideaId] = 0;
      }
    }
    
    const totalComments = Object.values(commentCounts).reduce((sum, count) => sum + count, 0);
    console.log(`   📊 Total comments across all ideas: ${totalComments}`);
    
    res.json({
      success: true,
      commentCounts
    });
  } catch (error) {
    console.error('Get comment counts error:', error);
    res.status(500).json({
      error: 'Failed to fetch comment counts',
      success: false
    });
  }
});

// Get all comments for a specific idea
app.get('/api/ideas/:id/comments', async (req, res) => {
  try {
    const ideaId = req.params.id;
    console.log(`📥 GET /api/ideas/${ideaId}/comments - ${new Date().toISOString()}`);
    
    const comments = await docStore.getCommentsForIdea(ideaId);
    
    // Build threaded structure
    const threadedComments = buildCommentThreads(comments);
    
    res.json({
      success: true,
      comments: threadedComments,
      total: comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      success: false
    });
  }
});

// Add new comment to an idea
app.post('/api/ideas/:id/comments', async (req, res) => {
  try {
    const ideaId = req.params.id;
    const { authorName, authorEmail, content, parentId } = req.body;
    
    console.log(`📥 POST /api/ideas/${ideaId}/comments - ${new Date().toISOString()}`);
    
    // Validation
    if (!authorName || !authorEmail || !content) {
      return res.status(400).json({
        error: 'Author name, email, and content are required',
        success: false
      });
    }
    
    // Verify idea exists
    const idea = await docStore.getIdea(ideaId);
    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found',
        success: false
      });
    }
    
    // If parentId provided, verify parent comment exists
    if (parentId) {
      const parentComment = await docStore.getComment(parentId);
      if (!parentComment || parentComment.ideaId !== ideaId) {
        return res.status(400).json({
          error: 'Invalid parent comment',
          success: false
        });
      }
    }
    
    const comment = await docStore.createComment({
      ideaId,
      parentId,
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim()
    });
    
    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      error: 'Failed to create comment',
      success: false
    });
  }
});

// Update a comment (author only)
app.put('/api/comments/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content, authorEmail } = req.body;
    
    console.log(`📥 PUT /api/comments/${commentId} - ${new Date().toISOString()}`);
    
    if (!content || !authorEmail) {
      return res.status(400).json({
        error: 'Content and author email are required',
        success: false
      });
    }
    
    const existingComment = await docStore.getComment(commentId);
    if (!existingComment) {
      return res.status(404).json({
        error: 'Comment not found',
        success: false
      });
    }
    
    // Verify author
    if (existingComment.authorEmail !== authorEmail.trim()) {
      return res.status(403).json({
        error: 'Only the author can edit this comment',
        success: false
      });
    }
    
    const updatedComment = await docStore.updateComment(commentId, {
      content: content.trim()
    });
    
    res.json({
      success: true,
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      error: 'Failed to update comment',
      success: false
    });
  }
});

// Delete a comment (author only)
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const { authorEmail } = req.body;
    
    console.log(`📥 DELETE /api/comments/${commentId} - ${new Date().toISOString()}`);
    
    if (!authorEmail) {
      return res.status(400).json({
        error: 'Author email is required',
        success: false
      });
    }
    
    const existingComment = await docStore.getComment(commentId);
    if (!existingComment) {
      return res.status(404).json({
        error: 'Comment not found',
        success: false
      });
    }
    
    // Verify author
    if (existingComment.authorEmail !== authorEmail.trim()) {
      return res.status(403).json({
        error: 'Only the author can delete this comment',
        success: false
      });
    }
    
    const success = await docStore.deleteComment(commentId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete comment',
        success: false
      });
    }
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      error: 'Failed to delete comment',
      success: false
    });
  }
});

// Admin: Get all comments
app.get('/api/admin/comments', authenticateAdmin, async (req, res) => {
  try {
    console.log(`📥 GET /api/admin/comments - ${new Date().toISOString()}`);
    
    const comments = await docStore.getAllComments();
    
    res.json({
      success: true,
      comments,
      total: comments.length
    });
  } catch (error) {
    console.error('Get all comments error:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      success: false
    });
  }
});

// Admin: Moderate comment (approve/delete)
app.put('/api/admin/comments/:id', authenticateAdmin, async (req, res) => {
  try {
    const commentId = req.params.id;
    const { action, isModerated } = req.body;
    
    console.log(`📥 PUT /api/admin/comments/${commentId} - ${new Date().toISOString()}`);
    
    if (action === 'delete') {
      const success = await docStore.deleteComment(commentId);
      if (success) {
        res.json({
          success: true,
          message: 'Comment deleted successfully'
        });
      } else {
        res.status(500).json({
          error: 'Failed to delete comment',
          success: false
        });
      }
    } else if (typeof isModerated === 'boolean') {
      const updatedComment = await docStore.updateComment(commentId, {
        isModerated
      });
      
      if (updatedComment) {
        res.json({
          success: true,
          comment: updatedComment
        });
      } else {
        res.status(404).json({
          error: 'Comment not found',
          success: false
        });
      }
    } else {
      res.status(400).json({
        error: 'Invalid action or moderation status',
        success: false
      });
    }
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({
      error: 'Failed to moderate comment',
      success: false
    });
  }
});

// Helper function to build threaded comment structure
function buildCommentThreads(comments) {
  const commentMap = new Map();
  const rootComments = [];
  
  // First pass: create map and identify root comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
    if (!comment.parentId) {
      rootComments.push(comment.id);
    }
  });
  
  // Second pass: build thread structure
  comments.forEach(comment => {
    if (comment.parentId && commentMap.has(comment.parentId)) {
      commentMap.get(comment.parentId).replies.push(commentMap.get(comment.id));
    }
  });
  
  // Return root comments with their threaded replies
  return rootComments.map(id => commentMap.get(id)).filter(Boolean);
}

// File upload endpoint for idea attachments
app.post('/api/ideas/:id/attachments', upload.array('files', 5), async (req, res) => {
  try {
    console.log('📤 Attachment upload request received for idea:', req.params.id);
    console.log('📤 Request files:', req.files ? req.files.length : 0);
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Log each uploaded file details
    req.files.forEach((file, index) => {
      console.log(`📄 File ${index + 1}:`, {
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });
    });

    const ideaId = parseInt(req.params.id);
    const idea = await docStore.getIdea(ideaId);
    
    if (!idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString()
    }));

    // Add attachments to the idea
    const updatedIdea = {
      ...idea,
      attachments: [...(idea.attachments || []), ...uploadedFiles],
      updatedAt: new Date().toISOString()
    };

    await docStore.saveIdea(updatedIdea);

    console.log('✅ Attachments uploaded successfully:', uploadedFiles.map(f => f.originalName));

    res.json({
      success: true,
      files: uploadedFiles,
      idea: updatedIdea
    });
  } catch (error) {
    console.error('❌ Attachment upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Attachment upload failed'
    });
  }
});

// General file upload endpoint
app.post('/api/upload', upload.array('files', 5), (req, res) => {
  try {
    console.log('📤 File upload request received');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log('✅ Files uploaded successfully:', uploadedFiles.map(f => f.originalName));

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

module.exports = app;
