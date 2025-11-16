import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { 
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Badge,
  Fab,
  CircularProgress
} from '@mui/material';
import {
  Lightbulb as IdeaIcon,
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  AttachFile as AttachIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  Comment as CommentIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon
} from '@mui/icons-material';
import axios from 'axios';
import NewIdeaDialog from './components/NewIdeaDialog';
import LinkifiedText from './components/LinkifiedText';
import IdeaDetailDialog from './components/IdeaDetailDialog';
import ProductTeamDashboard from './components/ProductTeamDashboard';
import LinkTest from './components/LinkTest';
import CommentModal from './components/CommentModal';
import LoginDialog from './components/LoginDialog';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

// Configure axios to use ngrok for remote access
// const API_BASE_URL = 'https://viscidly-superexplicit-nell.ngrok-free.dev';
// axios.defaults.baseURL = API_BASE_URL;

// Theme is now managed by our custom ThemeProvider

function App() {
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewIdeaDialog, setShowNewIdeaDialog] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showLinkTest, setShowLinkTest] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});
  const [commentModalIdea, setCommentModalIdea] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'

  const statusLabels = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'declined': 'Declined'
  };

  const statusColors = {
    'submitted': 'primary',
    'under_review': 'warning',
    'approved': 'success',
    'in_progress': 'info',
    'completed': 'success',
    'declined': 'error'
  };

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/api/ideas', {
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.success) {
        let filteredIdeas = response.data.ideas;
        
        if (selectedCategory) {
          filteredIdeas = filteredIdeas.filter(idea => idea.category === selectedCategory);
        }
        
        if (selectedStatus) {
          filteredIdeas = filteredIdeas.filter(idea => idea.status === selectedStatus);
        }
        
        if (selectedSource) {
          filteredIdeas = filteredIdeas.filter(idea => idea.source === selectedSource);
        }
        
        if (searchQuery) {
          filteredIdeas = filteredIdeas.filter(idea => 
            idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (idea.authorName && idea.authorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (idea.category && idea.category.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        
        setIdeas(filteredIdeas);

        // Fetch comment counts for all ideas
        const ideaIds = filteredIdeas.map(idea => idea.id);
        await fetchCommentCounts(ideaIds);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
      setError('Failed to load ideas. Please refresh the page.');
      setIdeas([]); // Set empty array so page still renders
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentCounts = async (ideaIds) => {
    try {
      if (!ideaIds || ideaIds.length === 0) return;

      const response = await axios.post('/api/ideas/comment-counts', {
        ideaIds: ideaIds
      });

      if (response.data.success) {
        setCommentCounts(response.data.commentCounts);
      }
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching categories...');
      const response = await axios.get('/api/categories', {
        timeout: 5000 // 5 second timeout
      });
      console.log('📂 Categories response:', response.data);
      if (response.data.success) {
        console.log('✅ Setting categories:', response.data.categories);
        setCategories(response.data.categories);
      } else {
        console.log('❌ Categories API returned success: false');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array so filters still work
    }
  };

  const fetchSources = async () => {
    try {
      const response = await axios.get('/api/sources', {
        timeout: 5000
      });
      if (response.data.success) {
        setSources(response.data.sources);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
      setSources(['Tech Debt', 'Market Gap', 'RFP/RFI', 'Customer Request']); // Default sources
    }
  };

  // Generate or get user ID for voting
  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  };

  const handleVote = async (ideaId) => {
    try {
      const userId = getUserId();
      const response = await axios.post(`/api/ideas/${ideaId}/vote`, { userId });
      if (response.data.success) {
        fetchIdeas();
        // Show feedback message
        console.log(response.data.message);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleIdeaCreated = () => {
    fetchIdeas();
    setShowNewIdeaDialog(false);
  };

  const handleSwitchToAdmin = () => {
    console.log('🔐 Admin button clicked');
    // Always show login dialog for now - don't trust saved credentials
    console.log('🔑 Showing login dialog (not using saved credentials for now)');
    setShowLoginDialog(true);
  };

  const handleSwitchToPublic = () => {
    setShowAdminDashboard(false);
  };

  const handleLoginSuccess = (user) => {
    console.log('✅ Login successful, setting up admin dashboard for:', user);
    setAdminUser(user);
    setShowAdminDashboard(true);
    setShowLoginDialog(false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    setShowAdminDashboard(false);
  };

  // Check for existing admin session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    const savedToken = localStorage.getItem('adminToken');
    
    console.log('🔍 Checking localStorage on app load:', { 
      hasUser: !!savedUser, 
      hasToken: !!savedToken,
      user: savedUser ? JSON.parse(savedUser) : null 
    });
    
    if (savedUser && savedToken) {
      console.log('✅ Found saved admin credentials, setting adminUser');
      setAdminUser(JSON.parse(savedUser));
      // Don't automatically show dashboard - let user click the button
    } else {
      console.log('❌ No saved admin credentials found');
      // Clean up any partial data
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
    }
  }, []);

  useEffect(() => {
    // Only fetch data when filters change, not on initial load
    if (selectedCategory !== '' || selectedStatus !== '' || selectedSource !== '' || searchQuery !== '') {
      fetchIdeas();
      fetchCategories();
      fetchSources();
    }
  }, [selectedCategory, selectedStatus, selectedSource, searchQuery]);

  // Separate effect for initial data loading
  useEffect(() => {
    // Re-enabled with proper error handling
    console.log('App loaded successfully - loading data...');
    // Load initial data after a short delay to prevent blocking
    const timer = setTimeout(() => {
      fetchIdeas();
      fetchCategories();
      fetchSources();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Check for link test mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'links') {
      setShowLinkTest(true);
    }
  }, []);

  if (showLinkTest) {
    return (
      <ThemeProvider>
        <LinkTest />
      </ThemeProvider>
    );
  }

  // Show admin dashboard
  if (showAdminDashboard && adminUser) {
    return (
      <ThemeProvider>
        <DragDropContext onDragEnd={(result) => {
          // Handle drag end if needed
          console.log('Drag ended', result);
        }}>
          <ProductTeamDashboard 
            user={adminUser}
            onLogout={handleAdminLogout}
            onSwitchToPublic={handleSwitchToPublic}
          />
        </DragDropContext>
      </ThemeProvider>
    );
  }

  // Main public portal view
  return (
    <ThemeProvider>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <IdeaIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Vision Ideas Portal
            </Typography>
            
            {/* View Toggle Buttons */}
            <Box sx={{ display: 'flex', mr: 2 }}>
              <IconButton
                color={viewMode === 'card' ? 'secondary' : 'inherit'}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <CardViewIcon />
              </IconButton>
              <IconButton
                color={viewMode === 'list' ? 'secondary' : 'inherit'}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <ListViewIcon />
              </IconButton>
            </Box>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Admin button */}
            <Button
              color="inherit"
              startIcon={<AdminIcon />}
              onClick={handleSwitchToAdmin}
              sx={{ ml: 1 }}
            >
              Admin Dashboard
            </Button>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Share Your Ideas
          </Typography>


          {/* Error Display */}
          {error && (
            <Box sx={{ mb: 3 }}>
              <Typography color="error" variant="body1">
                {error}
              </Typography>
            </Box>
          )}
          
          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Filter by Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Filter by Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Source</InputLabel>
                  <Select
                    value={selectedSource}
                    label="Filter by Source"
                    onChange={(e) => setSelectedSource(e.target.value)}
                  >
                    <MenuItem value="">All Sources</MenuItem>
                    {sources.map(source => (
                      <MenuItem key={source} value={source}>
                        {source}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedStatus('');
                    setSelectedSource('');
                    setSearchQuery('');
                    // Fetch all ideas when filters are cleared
                    fetchIdeas();
                  }}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Ideas Display - Card or List View */}
          {viewMode === 'card' ? (
            /* Card View */
            <Grid container spacing={3}>
              {ideas.map((idea) => (
                <Grid item xs={12} md={6} lg={4} key={idea.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Category Banner */}
                    {idea.category && (
                      <Box 
                        sx={{ 
                          width: '100%',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          p: 1,
                          mb: 2,
                          borderRadius: 1,
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        {idea.category}
                      </Box>
                    )}
                    
                    <Typography gutterBottom variant="h6" component="h2">
                      {idea.title}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <LinkifiedText 
                        text={idea.description.length > 100 
                          ? `${idea.description.substring(0, 100)}...` 
                          : idea.description
                        }
                      />
                    </Box>

                    {/* Notes Display */}
                    {idea.notes && idea.notes.trim() && (
                      <Box sx={{ 
                        mb: 2, 
                        p: 1.5, 
                        backgroundColor: 'action.hover', 
                        borderRadius: 1,
                        borderLeft: '3px solid',
                        borderLeftColor: 'info.main'
                      }}>
                        <Typography variant="caption" color="info.main" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                          📝 Notes:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          <LinkifiedText 
                            text={idea.notes.length > 80 
                              ? `${idea.notes.substring(0, 80)}...` 
                              : idea.notes
                            }
                          />
                        </Typography>
                      </Box>
                    )}

                    {/* Metadata chips */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip 
                        label={statusLabels[idea.status] || idea.status}
                        size="small"
                        color={statusColors[idea.status] || 'default'}
                      />
                      <Chip 
                        label={idea.source}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      {/* Priority Chip */}
                      <Chip 
                        label={`${(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)} Priority`}
                        size="small"
                        color={(idea.priority || 'medium') === 'high' ? 'error' : (idea.priority || 'medium') === 'low' ? 'default' : 'warning'}
                        sx={{ fontWeight: 'bold' }}
                      />
                      {/* Scheduled Quarter Chip */}
                      {idea.promoted && idea.plannedRelease && (
                        <Chip 
                          label={`Scheduled: ${idea.plannedRelease}`}
                          size="small"
                          color="success"
                          variant="filled"
                          sx={{ 
                            fontWeight: 'bold',
                            backgroundColor: 'success.main',
                            color: 'success.contrastText',
                            '& .MuiChip-label': {
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                      )}
                      {idea.attachments && idea.attachments.length > 0 && (
                        <Chip 
                          label={`${idea.attachments.length} files`}
                          size="small"
                          icon={<AttachIcon />}
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            setSelectedIdea(idea); // Open idea detail dialog
                          }}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText'
                            }
                          }}
                        />
                      )}
                      {/* Tags Display */}
                      {idea.tags && idea.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {idea.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: '20px',
                                '& .MuiChip-label': {
                                  px: 1
                                }
                              }}
                            />
                          ))}
                          {idea.tags.length > 3 && (
                            <Chip
                              label={`+${idea.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                              color="default"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: '20px',
                                '& .MuiChip-label': {
                                  px: 1
                                }
                              }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(idea.id);
                        }}
                        color="primary"
                      >
                        <Badge badgeContent={idea.voteCount || 0} color="primary">
                          <ThumbUpIcon />
                        </Badge>
                      </IconButton>
                      
                      {/* Comment Badge */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommentModalIdea(idea);
                          setShowCommentModal(true);
                        }}
                        sx={{ 
                          color: 'secondary.main',
                          '&:hover': {
                            backgroundColor: 'secondary.light',
                            color: 'secondary.contrastText'
                          }
                        }}
                      >
                        <Badge 
                          badgeContent={commentCounts[idea.id] || 0} 
                          color="secondary"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              height: 18,
                              minWidth: 18,
                              fontWeight: 'bold'
                            }
                          }}
                        >
                          <CommentIcon />
                        </Badge>
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="caption">
                          {idea.authorName || 'Anonymous'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon fontSize="small" />
                        <Typography variant="caption">
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardActions>
                </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            /* List View */
            <Box>
              {ideas.map((idea) => (
                <Paper 
                  key={idea.id}
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <Grid container spacing={2} alignItems="center">
                    {/* Title and Category */}
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" gutterBottom>
                        {idea.title}
                      </Typography>
                      {idea.category && (
                        <Chip 
                          label={idea.category} 
                          size="small" 
                          color="primary" 
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Grid>
                    
                    {/* Description */}
                    <Grid item xs={12} md={5}>
                      <Typography variant="body2" color="text.secondary">
                        <LinkifiedText 
                          text={idea.description.length > 150 
                            ? `${idea.description.substring(0, 150)}...` 
                            : idea.description
                          }
                        />
                      </Typography>
                      
                      {/* Notes Display in List View */}
                      {idea.notes && idea.notes.trim() && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1, 
                          backgroundColor: 'action.hover', 
                          borderRadius: 0.5,
                          borderLeft: '2px solid',
                          borderLeftColor: 'info.main'
                        }}>
                          <Typography variant="caption" color="info.main" sx={{ fontWeight: 'bold', display: 'block' }}>
                            📝 Notes:
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <LinkifiedText 
                              text={idea.notes.length > 60 
                                ? `${idea.notes.substring(0, 60)}...` 
                                : idea.notes
                              }
                            />
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    
                    {/* Metadata and Actions */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        <Chip 
                          label={statusLabels[idea.status] || idea.status}
                          size="small"
                          color={statusColors[idea.status] || 'default'}
                        />
                        <Chip 
                          label={idea.source}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        {idea.attachments && idea.attachments.length > 0 && (
                          <Chip 
                            label={`${idea.attachments.length} files`}
                            size="small"
                            icon={<AttachIcon />}
                            variant="outlined"
                          />
                        )}
                        {/* Scheduled Quarter Chip in List View */}
                        {idea.promoted && idea.plannedRelease && (
                          <Chip 
                            label={`Scheduled: ${idea.plannedRelease}`}
                            size="small"
                            color="success"
                            variant="filled"
                            sx={{ 
                              fontWeight: 'bold',
                              backgroundColor: 'success.main',
                              color: 'success.contrastText'
                            }}
                          />
                        )}
                        {/* Tags Display in List View */}
                        {idea.tags && idea.tags.length > 0 && (
                          idea.tags.slice(0, 2).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: '20px'
                              }}
                            />
                          ))
                        )}
                        {idea.tags && idea.tags.length > 2 && (
                          <Chip
                            label={`+${idea.tags.length - 2}`}
                            size="small"
                            variant="outlined"
                            color="default"
                            sx={{ 
                              fontSize: '0.7rem',
                              height: '20px'
                            }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(idea.id);
                            }}
                            color="primary"
                          >
                            <Badge badgeContent={idea.voteCount || 0} color="primary">
                              <ThumbUpIcon />
                            </Badge>
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCommentModalIdea(idea);
                              setShowCommentModal(true);
                            }}
                            color="secondary"
                          >
                            <Badge badgeContent={commentCounts[idea.id] || 0} color="secondary">
                              <CommentIcon />
                            </Badge>
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <PersonIcon fontSize="small" />
                          <Typography variant="caption">
                            {idea.authorName || 'Anonymous'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}

          {/* Add Idea FAB */}
          <Fab
            color="primary"
            aria-label="add idea"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setShowNewIdeaDialog(true)}
          >
            <AddIcon />
          </Fab>
        </Container>

        {/* Dialogs */}
        <NewIdeaDialog
          open={showNewIdeaDialog}
          onClose={() => setShowNewIdeaDialog(false)}
          onIdeaCreated={handleIdeaCreated}
        />

        <IdeaDetailDialog
          idea={selectedIdea}
          open={!!selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onIdeaUpdated={() => fetchIdeas()}
        />

        <CommentModal
          open={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setCommentModalIdea(null);
            if (ideas.length > 0) {
              const ideaIds = ideas.map(idea => idea.id);
              fetchCommentCounts(ideaIds);
            }
          }}
          idea={commentModalIdea}
        />

        <LoginDialog
          open={showLoginDialog}
          onClose={() => {
            console.log('🚪 Login dialog closed');
            setShowLoginDialog(false);
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
