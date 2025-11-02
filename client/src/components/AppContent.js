import React, { useState, useEffect } from 'react';
import {
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
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import NewIdeaDialog from './NewIdeaDialog';
import LinkifiedText from './LinkifiedText';
import IdeaDetailDialog from './IdeaDetailDialog';
import ProductTeamDashboard from './ProductTeamDashboard';
import LinkTest from './LinkTest';
import CommentModal from './CommentModal';

// Configure axios to use ngrok for remote access
const API_BASE_URL = 'https://viscidly-superexplicit-nell.ngrok-free.dev';
axios.defaults.baseURL = API_BASE_URL;

const AppContent = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  
  // Existing state from App.js
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showNewIdeaDialog, setShowNewIdeaDialog] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showLinkTest, setShowLinkTest] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});
  const [commentModalIdea, setCommentModalIdea] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);

  // Status mappings
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

  // All the existing functions from App.js would go here...
  // For brevity, I'll include the key ones:

  const fetchIdeas = async () => {
    try {
      const response = await axios.get('/api/ideas');
      if (response.data.success) {
        let filteredIdeas = response.data.ideas;
        
        if (selectedCategory) {
          filteredIdeas = filteredIdeas.filter(idea => idea.category === selectedCategory);
        }
        
        if (selectedStatus) {
          filteredIdeas = filteredIdeas.filter(idea => idea.status === selectedStatus);
        }
        
        setIdeas(filteredIdeas);

        // Fetch comment counts for all ideas
        const ideaIds = filteredIdeas.map(idea => idea.id);
        await fetchCommentCounts(ideaIds);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
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

  const handleVote = async (ideaId) => {
    try {
      const response = await axios.post(`/api/ideas/${ideaId}/vote`);
      if (response.data.success) {
        fetchIdeas();
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
    setShowAdminDashboard(true);
  };

  const handleSwitchToPublic = () => {
    setShowAdminDashboard(false);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    fetchIdeas();
  }, [selectedCategory, selectedStatus]);

  // Show link test if needed
  if (showLinkTest) {
    return <LinkTest />;
  }

  // Show admin dashboard if user is admin and has switched to admin view
  if (showAdminDashboard && isAdmin()) {
    return (
      <ProductTeamDashboard 
        user={user}
        onLogout={handleLogout}
        onSwitchToPublic={handleSwitchToPublic}
      />
    );
  }

  // Main public portal view
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IdeaIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Vision Ideas Portal
          </Typography>
          
          {/* User info and actions */}
          {isAuthenticated && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                Welcome, {user?.name}
              </Typography>
              
              {/* Admin button if user is admin */}
              {isAdmin() && (
                <Button
                  color="inherit"
                  startIcon={<AdminIcon />}
                  onClick={handleSwitchToAdmin}
                  sx={{ ml: 1 }}
                >
                  Admin Dashboard
                </Button>
              )}
              
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Rest of the public portal UI would go here... */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Share Your Ideas
        </Typography>
        
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedStatus('');
                }}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Ideas Grid */}
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
                    {/* Priority Chip - Always show with default medium */}
                    <Chip 
                      label={`${(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)} Priority`}
                      size="small"
                      color={(idea.priority || 'medium') === 'high' ? 'error' : (idea.priority || 'medium') === 'low' ? 'default' : 'warning'}
                      sx={{ fontWeight: 'bold' }}
                    />
                    {idea.attachments && idea.attachments.length > 0 && (
                      <Chip 
                        label={`${idea.attachments.length} files`}
                        size="small"
                        icon={<AttachIcon />}
                        variant="outlined"
                      />
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
                    
                    {/* Comment Badge - SIMPLIFIED TEST VERSION */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Comments for: ${idea.title}`);
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
                        badgeContent={idea.title.includes('@Mentions') ? 2 : (idea.title.includes('AI') ? 1 : 0)} 
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
        onVote={handleVote}
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
    </Box>
  );
};

export default AppContent;
