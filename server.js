const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
const PORT = process.env.PORT || 5000;
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
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    /^http:\/\/192\.168\.\d+\.\d+:3001$/,  // Local network access
    /^http:\/\/172\.16\.\d+\.\d+:3001$/,   // Docker/VM networks
    /^http:\/\/10\.\d+\.\d+\.\d+:3001$/    // Private networks
  ],
  credentials: true
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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build files
app.use(express.static(path.join(__dirname, 'client/build')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}.${mime.extension(file.mimetype)}`;
    cb(null, uniqueName);
  }
});

// File filter for PDFs and images
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDFs and images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
        success: false
      });
    }

    // Find user
    const user = adminUsers.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        success: false
      });
    }

    // Check password (simple comparison for demo - use bcrypt in production)
    if (password !== user.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        success: false
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
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
    const { category, status, source, search, sortBy = 'newest' } = req.query;
    
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
    const { title, description, category, source, authorName, authorEmail, attachments } = req.body;
    
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
    
    if (!userId) {
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

    const validStatuses = ['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'declined'];
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
    const { promotionType, additionalNotes } = req.body;
    const ideaId = parseInt(id);

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

    // Update idea with promotion data
    idea.promoted = true;
    idea.promotionType = promotionType; // 'epic' or 'feature'
    idea.promotionNotes = additionalNotes || '';
    idea.promotedAt = new Date().toISOString();
    idea.promotedBy = req.user.username;
    idea.status = 'completed'; // Move to completed after promotion
    idea.updatedAt = new Date().toISOString();
    idea.updatedBy = req.user.username;

    await docStore.saveIdea(idea);

    res.json({
      success: true,
      message: `Idea promoted as ${promotionType} successfully`,
      idea: idea
    });

  } catch (error) {
    console.error('Promote idea error:', error);
    res.status(500).json({
      error: 'Failed to promote idea',
      success: false
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
        'declined': {
          title: 'Declined',
          color: '#d32f2f',
          bgColor: '#ffebee'
        }
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

    if (!organizationUrl || !project || !personalAccessToken) {
      return res.status(400).json({
        error: 'Organization URL, project, and PAT are required',
        success: false
      });
    }

    // Simple test - try to get project info
    const testUrl = `${organizationUrl}/${project}/_apis/projects/${project}?api-version=6.0`;
    const auth = Buffer.from(`:${personalAccessToken}`).toString('base64');
    
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
    console.error('Azure DevOps test error:', error);
    res.status(500).json({
      error: error.response?.data?.message || 'Azure DevOps connection failed',
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
      const validStatuses = ['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'declined'];
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

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

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
    res.json({
      success: true,
      message: `Successfully processed ${processedIdeas.length} test ideas`,
      ideas: processedIdeas
    });
    
  } catch (error) {
    console.error('❌ Test Excel processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;
      
      try {
        // Create idea from mapped data
        const idea = {
          title: (row.title || '').toString().trim(),
          description: (row.description || '').toString().trim(),
          category: (row.category || '').toString().trim(),
          source: (row.source || 'Mapped Import').toString().trim(),
          authorName: (row.authorName || 'Mapped Import').toString().trim(),
          authorEmail: (row.authorEmail || '').toString().trim(),
          status: 'submitted',
          estimatedEffort: row.estimatedEffort || null,
          effortUnit: row.effortUnit || 'story_points',
          detailedRequirements: (row.detailedRequirements || '').toString().trim(),
          features: [],
          useCases: []
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
            error: 'Missing required field: Title'
          });
          continue;
        }

        if (!idea.description || idea.description === '') {
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
        
        console.log(`✅ Saved mapped idea: ${idea.title}`);
        
      } catch (error) {
        errors.push({
          row: rowNum,
          error: `Processing error: ${error.message}`
        });
      }
    }
    
    // Update total count
    await docStore.updateTotalCount();
    
    console.log(`Mapped import completed: ${processedIdeas.length} ideas saved, ${errors.length} errors`);
    
    res.json({
      success: true,
      message: `Successfully imported ${processedIdeas.length} ideas`,
      statistics: {
        totalRows: data.length,
        processed: processedIdeas.length,
        saved: processedIdeas.length,
        errors: errors.length
      },
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
        const validStatuses = ['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'declined'];
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
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1976d2;
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-top: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #1976d2;
        }
        .summary-card h3 {
            margin: 0;
            font-size: 2em;
            color: #1976d2;
        }
        .summary-card p {
            margin: 5px 0 0 0;
            color: #666;
            font-weight: bold;
        }
        .idea-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .idea-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .idea-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 10px;
        }
        .meta-chip {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.9em;
        }
        .meta-chip.approved {
            background: #e8f5e8;
            color: #2e7d32;
        }
        .idea-description {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; }
            .idea-card { break-inside: avoid; }
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

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

module.exports = app;
