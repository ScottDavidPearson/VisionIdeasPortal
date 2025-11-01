import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Collapse,
  Divider,
  Badge,
  Checkbox,
  Fab
} from '@mui/material';
import {
  Person as PersonIcon,
  Category as CategoryIcon,
  AttachFile as AttachIcon,
  ThumbUp as ThumbUpIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Visibility as ViewIcon,
  DragIndicator as DragIcon,
  Rocket as RocketIcon,
  Settings as SettingsIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CloudUpload as UploadIcon,
  Assignment as AssignmentIcon,
  CleaningServices as CleanupIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import axios from 'axios';
import LinkifiedText from './LinkifiedText';
import AdminIdeaDetailDialog from './AdminIdeaDetailDialog';
import PromoteIdeaDialog from './PromoteIdeaDialog';
import SettingsDialog from './SettingsDialog';
import RoadmapReportDialog from './RoadmapReportDialog';
import ExcelImportDialog from './ExcelImportDialog';
import BulkCategoryDialog from './BulkCategoryDialog';
import CommentModal from './CommentModal';

const statusColumns = {
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
};

const ProductTeamDashboard = ({ user, onLogout, onSwitchToPublic }) => {
  const [ideas, setIdeas] = useState([]);
  const [allIdeas, setAllIdeas] = useState([]); // Store all ideas for filtering
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dragDisabled, setDragDisabled] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [promoteIdea, setPromoteIdea] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRoadmapReport, setShowRoadmapReport] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [settings, setSettings] = useState({ productSuites: {} });
  const [commentCounts, setCommentCounts] = useState({});
  const [commentModalIdea, setCommentModalIdea] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    productSuite: '',
    module: '',
    status: '',
    source: ''
  });

  useEffect(() => {
    fetchIdeas();
    fetchSettings();
  }, []);

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

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.data.success) {
        setSettings(response.data.settings);
        console.log('Loaded settings for filters:', response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchIdeas = async () => {
    try {
      const response = await axios.get('/api/admin/ideas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.data.success) {
        console.log(`Fetched ${response.data.ideas.length} ideas for admin dashboard`);
        console.log('Status breakdown:', response.data.statusBreakdown);
        
        // Filter out any invalid ideas
        const validIdeas = response.data.ideas.filter(idea => idea && idea.id);
        console.log(`Filtered to ${validIdeas.length} valid ideas`);
        
        setAllIdeas(validIdeas);
        setIdeas(validIdeas); // Initially show all ideas
        
        // Fetch comment counts for all ideas
        const ideaIds = validIdeas.map(idea => idea.id);
        await fetchCommentCounts(ideaIds);
      } else {
        console.error('Failed to fetch ideas:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter ideas based on current filters
  useEffect(() => {
    let filtered = [...allIdeas];

    console.log('Filtering ideas:', {
      totalIdeas: allIdeas.length,
      filters: filters,
      sampleCategories: allIdeas.slice(0, 3).map(idea => ({ id: idea.id, category: idea.category }))
    });

    if (filters.productSuite) {
      console.log(`Filtering by product suite: "${filters.productSuite}"`);
      filtered = filtered.filter(idea => {
        const [suite] = idea.category?.split(' - ') || [''];
        const matches = suite === filters.productSuite;
        if (!matches && idea.category) {
          console.log(`Idea ${idea.id} category "${idea.category}" -> suite "${suite}" doesn't match "${filters.productSuite}"`);
        }
        return matches;
      });
      console.log(`After product suite filter: ${filtered.length} ideas`);
    }

    if (filters.module) {
      console.log(`Filtering by module: "${filters.module}"`);
      filtered = filtered.filter(idea => {
        const [, module] = idea.category?.split(' - ') || ['', ''];
        const matches = module === filters.module;
        if (!matches && idea.category) {
          console.log(`Idea ${idea.id} category "${idea.category}" -> module "${module}" doesn't match "${filters.module}"`);
        }
        return matches;
      });
      console.log(`After module filter: ${filtered.length} ideas`);
    }

    if (filters.status) {
      filtered = filtered.filter(idea => idea.status === filters.status);
    }

    if (filters.source) {
      filtered = filtered.filter(idea => idea.source === filters.source);
    }

    console.log(`Final filtered ideas: ${filtered.length}`);
    setIdeas(filtered);
  }, [allIdeas, filters]);

  // Get unique product suites and modules
  // Get product suites from settings configuration
  const getProductSuites = () => {
    if (settings.productSuites && Object.keys(settings.productSuites).length > 0) {
      return Object.keys(settings.productSuites).sort();
    }
    // Fallback to extracting from ideas if no settings
    const suites = new Set();
    allIdeas.forEach(idea => {
      if (idea.category) {
        const [suite] = idea.category.split(' - ');
        if (suite) suites.add(suite);
      }
    });
    return Array.from(suites).sort();
  };

  // Get modules from settings configuration for selected suite
  const getModules = () => {
    if (settings.productSuites && filters.productSuite && settings.productSuites[filters.productSuite]) {
      return settings.productSuites[filters.productSuite].sort();
    }
    // Fallback to extracting from ideas if no settings
    const modules = new Set();
    allIdeas.forEach(idea => {
      if (idea.category && (!filters.productSuite || idea.category.startsWith(filters.productSuite))) {
        const [, module] = idea.category.split(' - ');
        if (module) modules.add(module);
      }
    });
    return Array.from(modules).sort();
  };

  const getSources = () => {
    // Use configured sources from settings if available
    if (settings.sources && settings.sources.length > 0) {
      return settings.sources.sort();
    }
    
    // Fallback to extracting from ideas if no settings
    const sources = new Set();
    allIdeas.forEach(idea => {
      if (idea.source) sources.add(idea.source);
    });
    return Array.from(sources).sort();
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      // Clear module filter if product suite changes
      ...(filterType === 'productSuite' && { module: '' })
    }));
  };

  const clearFilters = () => {
    setFilters({
      productSuite: '',
      module: '',
      status: '',
      source: ''
    });
  };

  // Bulk selection functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIdeas([]);
  };

  const toggleIdeaSelection = (idea) => {
    setSelectedIdeas(prev => {
      const isSelected = prev.some(selected => selected.id === idea.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== idea.id);
      } else {
        return [...prev, idea];
      }
    });
  };

  const selectAllIdeas = () => {
    setSelectedIdeas([...ideas]);
  };

  const clearSelection = () => {
    setSelectedIdeas([]);
  };

  const handleBulkCategorySuccess = () => {
    setShowBulkCategory(false);
    setSelectedIdeas([]);
    setSelectionMode(false);
    fetchIdeas(); // Refresh the ideas list
  };

  const handleCleanupCategories = async () => {
    const confirm = window.confirm(
      'This will remove invalid categories from all ideas based on your Product Suite settings. ' +
      'Ideas with invalid categories will have their category cleared. Continue?'
    );

    if (!confirm) return;

    try {
      const response = await axios.post('http://localhost:5000/api/admin/cleanup-categories', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        alert(response.data.message);
        fetchIdeas(); // Refresh ideas
        fetchSettings(); // Refresh settings for filters
      } else {
        alert('Cleanup failed: ' + response.data.error);
      }
    } catch (error) {
      console.error('Category cleanup error:', error);
      alert('Failed to clean up categories: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDragStart = (start) => {
    console.log('Drag started:', start);
    setDragDisabled(false);
  };

  const handleDragUpdate = (update) => {
    console.log('Drag update:', update);
  };

  const handleDragEnd = async (result) => {
    console.log('Drag ended:', result);
    const { destination, source, draggableId } = result;

    // If no destination, return
    if (!destination) {
      console.log('No destination - drag cancelled');
      return;
    }

    // If dropped in same position, return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('Dropped in same position');
      return;
    }

    const newStatus = destination.droppableId;
    // Extract ID from draggableId (format: "idea-123")
    const ideaId = parseInt(draggableId.replace('idea-', ''));
    
    console.log(`Moving idea ${ideaId} from ${source.droppableId} to ${newStatus}`);

    // Optimistically update the UI first
    setIdeas(prevIdeas => 
      prevIdeas.map(idea => 
        idea.id === ideaId 
          ? { ...idea, status: newStatus, updatedAt: new Date().toISOString() }
          : idea
      )
    );

    try {
      const response = await axios.put(`/api/admin/ideas/${ideaId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (response.data.success) {
        console.log('Status updated successfully');
        // Ensure the local state is updated with the server response
        setIdeas(prevIdeas => 
          prevIdeas.map(idea => 
            idea.id === ideaId 
              ? { ...idea, status: newStatus, updatedAt: new Date().toISOString(), updatedBy: 'admin' }
              : idea
          )
        );
      } else {
        console.error('Failed to update status:', response.data.error);
        // Revert the optimistic update
        setIdeas(prevIdeas => 
          prevIdeas.map(idea => 
            idea.id === ideaId 
              ? { ...idea, status: source.droppableId }
              : idea
          )
        );
      }
    } catch (error) {
      console.error('Error updating idea status:', error);
      // Revert the optimistic update
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === ideaId 
            ? { ...idea, status: source.droppableId }
            : idea
        )
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getIdeasByStatus = (status) => {
    return ideas.filter(idea => idea && idea.id && idea.status === status);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    handleMenuClose();
    onLogout();
  };

  const handleIdeaUpdated = (updatedIdea) => {
    console.log('Idea updated:', updatedIdea);
    
    // If updatedIdea is null or undefined, it means the idea was deleted
    if (!updatedIdea || !updatedIdea.id) {
      console.log('Idea was deleted, refreshing from server');
      fetchIdeas();
      return;
    }
    
    // Always refresh from server to ensure we have the latest data including priority
    console.log('Refreshing ideas from server to get latest data including priority');
    fetchIdeas();
  };

  const handleCardClick = (idea, event) => {
    // Don't open dialog if clicking on drag handle or promote button
    if (event.target.closest('[data-rbd-drag-handle-draggable-id]') || 
        event.target.closest('.promote-button')) {
      return;
    }
    setSelectedIdea(idea);
  };

  const handlePromoteClick = (idea, event) => {
    event.stopPropagation(); // Prevent card click
    setPromoteIdea(idea);
  };

  const handleIdeaPromoted = (promotedIdea) => {
    setIdeas(prevIdeas => 
      prevIdeas.map(idea => 
        idea.id === promotedIdea.id ? promotedIdea : idea
      )
    );
  };

  const handleSettingsUpdated = (newSettings) => {
    // Refresh both settings and ideas when settings are updated
    console.log('Settings updated:', newSettings);
    fetchSettings(); // Refresh settings for filters
    fetchIdeas(); // Refresh ideas in case categories changed
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Product Team Dashboard
          </Typography>
          <Button 
            color="inherit" 
            onClick={onSwitchToPublic}
            startIcon={<ViewIcon />}
            sx={{ mr: 2 }}
          >
            Public View
          </Button>
          <IconButton
            color="inherit"
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
            title="Filters"
          >
            <FilterIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setShowSettings(true)}
            sx={{ mr: 1 }}
            title="Settings"
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setShowExcelImport(true)}
            sx={{ mr: 1 }}
            title="Import Ideas from Excel"
          >
            <UploadIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleCleanupCategories}
            sx={{ mr: 1 }}
            title="Clean Up Invalid Categories"
          >
            <CleanupIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setShowRoadmapReport(true)}
            sx={{ mr: 2 }}
            title="Generate Roadmap Report"
          >
            <PrintIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              Welcome, {user.name}
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Filter Panel */}
      <Collapse in={showFilters}>
        <Paper sx={{ m: 2, p: 2, backgroundColor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              size="small"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              disabled={!filters.productSuite && !filters.module && !filters.status && !filters.source}
            >
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Product Suite</InputLabel>
                <Select
                  value={filters.productSuite}
                  label="Product Suite"
                  onChange={(e) => handleFilterChange('productSuite', e.target.value)}
                >
                  <MenuItem value="">All Suites</MenuItem>
                  {getProductSuites().map(suite => (
                    <MenuItem key={suite} value={suite}>{suite}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Module</InputLabel>
                <Select
                  value={filters.module}
                  label="Module"
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                  disabled={!filters.productSuite}
                >
                  <MenuItem value="">All Modules</MenuItem>
                  {getModules().map(module => (
                    <MenuItem key={module} value={module}>{module}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.entries(statusColumns).map(([status, config]) => (
                    <MenuItem key={status} value={status}>{config.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={filters.source}
                  label="Source"
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                >
                  <MenuItem value="">All Sources</MenuItem>
                  {getSources().map(source => (
                    <MenuItem key={source} value={source}>{source}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Active Filters Display */}
          {(filters.productSuite || filters.module || filters.status || filters.source) && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Active Filters:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {filters.productSuite && (
                  <Chip 
                    label={`Suite: ${filters.productSuite}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('productSuite', '')}
                  />
                )}
                {filters.module && (
                  <Chip 
                    label={`Module: ${filters.module}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('module', '')}
                  />
                )}
                {filters.status && (
                  <Chip 
                    label={`Status: ${statusColumns[filters.status]?.title || filters.status}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('status', '')}
                  />
                )}
                {filters.source && (
                  <Chip 
                    label={`Source: ${filters.source}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('source', '')}
                  />
                )}
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {ideas.length} of {allIdeas.length} ideas
            </Typography>
          </Box>
        </Paper>
      </Collapse>

      {/* Kanban Board */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Ideas Management - Kanban Board
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Drag and drop ideas between columns to change their status
        </Typography>

        <DragDropContext 
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <Grid container spacing={2}>
            {Object.entries(statusColumns).map(([status, config]) => {
              const statusIdeas = getIdeasByStatus(status);
              
              return (
                <Grid item xs={12} md={2} key={status}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      minHeight: '70vh',
                      backgroundColor: config.bgColor,
                      border: `2px solid ${config.color}20`
                    }}
                  >
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ color: config.color }}>
                        {config.title}
                      </Typography>
                      <Badge badgeContent={statusIdeas.length} color="primary" />
                    </Box>

                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            minHeight: '60vh',
                            backgroundColor: snapshot.isDraggingOver ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                            border: snapshot.isDraggingOver ? '2px dashed #1976d2' : '2px dashed transparent',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            p: 1
                          }}
                        >
                          {snapshot.isDraggingOver && (
                            <Box sx={{ 
                              textAlign: 'center', 
                              py: 2, 
                              color: 'primary.main',
                              fontWeight: 'bold'
                            }}>
                              Drop here to move to {config.title}
                            </Box>
                          )}
                          {statusIdeas.filter(idea => idea && idea.id).map((idea, index) => (
                            <Draggable 
                              key={`idea-${idea.id}`} 
                              draggableId={`idea-${idea.id}`} 
                              index={index}
                              isDragDisabled={dragDisabled}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  onClick={(e) => handleCardClick(idea, e)}
                                  sx={{
                                    mb: 2,
                                    cursor: snapshot.isDragging ? 'grabbing' : 'default',
                                    transform: snapshot.isDragging ? 'rotate(3deg) scale(1.02)' : 'none',
                                    boxShadow: snapshot.isDragging ? 8 : 2,
                                    opacity: snapshot.isDragging ? 0.9 : 1,
                                    border: snapshot.isDragging ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                    transition: snapshot.isDragging ? 'none' : 'all 0.2s ease',
                                    '&:hover': {
                                      boxShadow: 4,
                                      transform: 'translateY(-2px)'
                                    },
                                    userSelect: 'none'
                                  }}
                                >
                                  <CardContent sx={{ p: 0, position: 'relative' }}>
                                    {/* Category - Full width and prominent at top */}
                                    {idea.category ? (
                                      <Box
                                        {...provided.dragHandleProps}
                                        sx={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          backgroundColor: 'primary.main',
                                          color: 'primary.contrastText',
                                          px: 2,
                                          py: 0.75,
                                          textAlign: 'center',
                                          fontWeight: 600,
                                          fontSize: '0.75rem',
                                          textTransform: 'uppercase',
                                          letterSpacing: 0.5,
                                          boxShadow: 1,
                                          border: '2px solid',
                                          borderColor: 'primary.dark',
                                          borderRadius: '4px 4px 0 0',
                                          zIndex: 1,
                                          cursor: 'grab',
                                          '&:active': {
                                            cursor: 'grabbing'
                                          }
                                        }}
                                      >
                                        {idea.category}
                                      </Box>
                                    ) : (
                                      <Box
                                        {...provided.dragHandleProps}
                                        sx={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          backgroundColor: 'warning.light',
                                          color: 'warning.contrastText',
                                          px: 2,
                                          py: 0.75,
                                          textAlign: 'center',
                                          fontWeight: 600,
                                          fontSize: '0.75rem',
                                          textTransform: 'uppercase',
                                          letterSpacing: 0.5,
                                          boxShadow: 1,
                                          border: '2px dashed',
                                          borderColor: 'warning.main',
                                          opacity: 0.8,
                                          borderRadius: '4px 4px 0 0',
                                          zIndex: 1,
                                          cursor: 'grab',
                                          '&:active': {
                                            cursor: 'grabbing'
                                          }
                                        }}
                                      >
                                        ⚠️ NO CATEGORY
                                      </Box>
                                    )}

                                    {/* Content with padding and top margin for category */}
                                    <Box sx={{ p: 2, pt: 6.5 }}>
                                      {/* Title and Engagement Badges */}
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography 
                                          variant="subtitle1" 
                                          component="h3" 
                                          sx={{ fontWeight: 'bold', flexGrow: 1, mr: 1 }}
                                        >
                                          {idea.title}
                                        </Typography>
                                        
                                        {/* Vote and Comment Badges */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {/* Vote Badge */}
                                          <Badge 
                                            badgeContent={idea.voteCount || 0} 
                                            color="primary"
                                            sx={{
                                              '& .MuiBadge-badge': {
                                                fontSize: '0.75rem',
                                                height: 18,
                                                minWidth: 18,
                                                fontWeight: 'bold'
                                              }
                                            }}
                                          >
                                            <IconButton
                                              size="medium"
                                              sx={{ 
                                                color: idea.voteCount > 0 ? 'primary.main' : 'text.secondary',
                                                p: 0.5
                                              }}
                                            >
                                              <ThumbUpIcon />
                                            </IconButton>
                                          </Badge>
                                          
                                          {/* Comment Badge - SIMPLIFIED TEST VERSION */}
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
                                            <IconButton
                                              size="medium"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                alert(`Comments for: ${idea.title}`);
                                              }}
                                              sx={{ 
                                                color: 'secondary.main',
                                                p: 0.5,
                                                '&:hover': {
                                                  backgroundColor: 'secondary.light',
                                                  color: 'secondary.contrastText'
                                                }
                                              }}
                                            >
                                              <CommentIcon />
                                            </IconButton>
                                          </Badge>
                                        </Box>
                                      </Box>
                                      
                                      <Box sx={{ mb: 1 }}>
                                        <LinkifiedText 
                                          text={idea.description.length > 100 
                                            ? `${idea.description.substring(0, 100)}...` 
                                            : idea.description
                                          }
                                        />
                                      </Box>

                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        <Chip 
                                          label={idea.source}
                                          size="small"
                                          color="secondary"
                                          variant="outlined"
                                          sx={{ fontSize: '0.7rem' }}
                                        />
                                        
                                        {/* Priority Indicator */}
                                        <Chip 
                                          label={`${(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)} Priority`}
                                          size="small"
                                          color={(idea.priority || 'medium') === 'high' ? 'error' : (idea.priority || 'medium') === 'low' ? 'default' : 'warning'}
                                          sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                                        />
                                        
                                        {/* Effort Estimation Indicator */}
                                        {idea.estimatedEffort && (
                                          <Chip 
                                            label={`${idea.estimatedEffort} ${idea.effortUnit === 'story_points' ? 'SP' : 'MD'}`}
                                            size="small"
                                            color="info"
                                            sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                                          />
                                        )}
                                        
                                        {/* Requirements Indicator */}
                                        {idea.detailedRequirements && idea.detailedRequirements.trim() && (
                                          <Chip 
                                            label="📋 Reqs"
                                            size="small"
                                            color="warning"
                                            sx={{ fontSize: '0.7rem' }}
                                          />
                                        )}
                                      </Box>

                                      {/* Features Tags */}
                                      {idea.features && idea.features.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                            Features:
                                          </Typography>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {idea.features.slice(0, 3).map((feature, index) => (
                                              <Chip 
                                                key={index}
                                                label={feature.length > 15 ? `${feature.substring(0, 15)}...` : feature}
                                                size="small"
                                                variant="filled"
                                                color="primary"
                                                sx={{ fontSize: '0.6rem', height: '20px' }}
                                              />
                                            ))}
                                            {idea.features.length > 3 && (
                                              <Chip 
                                                label={`+${idea.features.length - 3} more`}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ fontSize: '0.6rem', height: '20px' }}
                                              />
                                            )}
                                          </Box>
                                        </Box>
                                      )}
                                    </Box>
                                  </CardContent>

                                  <CardActions sx={{ pt: 0, pb: 1, px: 2, justifyContent: 'space-between' }}>
                                    <Button
                                      size="small"
                                      startIcon={<RocketIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPromoteIdea(idea);
                                      }}
                                      className="promote-button"
                                      sx={{ fontSize: '0.7rem' }}
                                    >
                                      Promote
                                    </Button>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDate(idea.createdAt)}
                                    </Typography>
                                  </CardActions>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DragDropContext>
      </Box>

        {/* Admin Idea Detail Dialog */}
        <AdminIdeaDetailDialog
          idea={selectedIdea}
          open={!!selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onIdeaUpdated={handleIdeaUpdated}
          settings={settings}
        />

        {/* Promote Idea Dialog */}
        <PromoteIdeaDialog
          idea={promoteIdea}
          open={!!promoteIdea}
          onClose={() => setPromoteIdea(null)}
          onIdeaPromoted={handleIdeaPromoted}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          onSettingsUpdated={handleSettingsUpdated}
        />

        {/* Roadmap Report Dialog */}
        <RoadmapReportDialog
          open={showRoadmapReport}
          onClose={() => setShowRoadmapReport(false)}
          ideas={allIdeas}
          currentFilters={filters}
        />

        {/* Excel Import Dialog */}
        <ExcelImportDialog
          open={showExcelImport}
          onClose={() => setShowExcelImport(false)}
          onImportSuccess={() => {
            fetchIdeas(); // Refresh ideas after successful import
            setShowExcelImport(false);
          }}
        />

        {/* Comment Modal */}
        <CommentModal
          open={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setCommentModalIdea(null);
            // Refresh comment counts after modal closes
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

export default ProductTeamDashboard;
