import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  AttachFile as AttachIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import LinkifiedText from './LinkifiedText';
import CommentSection from './CommentSection';
import axios from 'axios';

const statusColors = {
  'submitted': 'primary',
  'under_review': 'warning', 
  'approved': 'success',
  'in_progress': 'info',
  'completed': 'success',
  'declined': 'error'
};

const statusLabels = {
  'submitted': 'Submitted',
  'under_review': 'Under Review',
  'approved': 'Approved', 
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'declined': 'Declined'
};

const AdminIdeaDetailDialog = ({ open, onClose, idea, onIdeaUpdated, onDelete, settings }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [editedIdea, setEditedIdea] = useState({
    title: idea?.title || '',
    description: idea?.description || '',
    category: idea?.category || '',
    source: idea?.source || '',
    authorName: idea?.authorName || '',
    authorEmail: idea?.authorEmail || '',
    status: idea?.status || 'submitted',
    estimatedEffort: idea?.estimatedEffort || '',
    effortUnit: idea?.effortUnit || 'story_points',
    detailedRequirements: idea?.detailedRequirements || '',
    features: idea?.features || [],
    useCases: idea?.useCases || []
  });

  const [internalData, setInternalData] = useState({
    estimatedEffort: idea?.estimatedEffort || '',
    effortUnit: idea?.effortUnit || 'story_points',
    detailedRequirements: idea?.detailedRequirements || '',
    features: idea?.features || [],
    useCases: idea?.useCases || []
  });

  const [newFeature, setNewFeature] = useState('');
  const [newUseCase, setNewUseCase] = useState('');

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Update editedIdea when idea prop changes
  useEffect(() => {
    if (idea) {
      setEditedIdea({
        title: idea.title || '',
        description: idea.description || '',
        category: idea.category || '',
        source: idea.source || '',
        authorName: idea.authorName || '',
        authorEmail: idea.authorEmail || '',
        status: idea.status || 'submitted',
        estimatedEffort: idea.estimatedEffort || '',
        effortUnit: idea.effortUnit || 'story_points',
        detailedRequirements: idea.detailedRequirements || '',
        features: idea.features || [],
        useCases: idea.useCases || []
      });
      
      // Reset inline editing states
      setEditingTitle(false);
      setTempTitle('');
      
      setInternalData({
        estimatedEffort: idea.estimatedEffort || '',
        effortUnit: idea.effortUnit || 'story_points',
        detailedRequirements: idea.detailedRequirements || '',
        features: idea.features || [],
        useCases: idea.useCases || []
      });
    }
  }, [idea]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInternalDataChange = (field) => (event) => {
    setInternalData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setInternalData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setInternalData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addUseCase = () => {
    if (newUseCase.trim()) {
      setInternalData(prev => ({
        ...prev,
        useCases: [...prev.useCases, newUseCase.trim()]
      }));
      setNewUseCase('');
    }
  };

  const removeUseCase = (index) => {
    setInternalData(prev => ({
      ...prev,
      useCases: prev.useCases.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Combine category, author, and source from editedIdea with internal data
      const updateData = {
        title: editedIdea.title,
        description: editedIdea.description,
        category: editedIdea.category,
        authorName: editedIdea.authorName,
        authorEmail: editedIdea.authorEmail,
        source: editedIdea.source,
        priority: editedIdea.priority
      };

      console.log('Saving idea with data:', updateData);
      console.log('Current editedIdea.category:', editedIdea.category);
      console.log('Current editedIdea.authorName:', editedIdea.authorName);
      console.log('Current editedIdea.authorEmail:', editedIdea.authorEmail);
      console.log('Current editedIdea.source:', editedIdea.source);
      console.log('Current editedIdea.priority:', editedIdea.priority);

      const response = await axios.put(`http://localhost:5000/api/admin/ideas/${idea.id}`, 
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      console.log('Save response:', response.data);

      if (response.data.success) {
        setSuccess('Idea updated successfully');
        setEditing(false);
        
        // Update the local idea state to reflect the changes immediately
        const updatedIdea = response.data.idea;
        setEditedIdea({
          ...editedIdea,
          category: updatedIdea.category,
          authorName: updatedIdea.authorName,
          authorEmail: updatedIdea.authorEmail,
          source: updatedIdea.source,
          priority: updatedIdea.priority
        });
        
        if (onIdeaUpdated) {
          onIdeaUpdated(updatedIdea);
        }
      } else {
        setError(response.data.error || 'Failed to update idea');
      }
    } catch (error) {
      console.error('Update idea error:', error);
      setError(error.response?.data?.error || 'Failed to update idea');
    } finally {
      setSaving(false);
    }
  };

  // Get available sources from settings or fallback to defaults
  const getAvailableSources = () => {
    if (settings?.sources && settings.sources.length > 0) {
      return settings.sources;
    }
    // Fallback to default sources if none configured
    return [
      'Customer Request',
      'Internal Team', 
      'Market Research',
      'User Feedback',
      'Support Tickets',
      'Sales Team',
      'Executive Request',
      'Competitive Analysis',
      'Technical Debt',
      'Innovation Lab',
      'Partner Request',
      'Regulatory Requirement'
    ];
  };

  const availableSources = getAvailableSources();

  const handleTitleClick = () => {
    setEditingTitle(true);
    setTempTitle(editedIdea.title);
  };

  const handleTitleSave = async () => {
    if (!tempTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      // Update the editedIdea state
      const updatedIdea = { ...editedIdea, title: tempTitle.trim() };
      setEditedIdea(updatedIdea);

      // Save to server immediately
      setSaving(true);
      setError('');

      const response = await axios.put(`/api/admin/ideas/${idea.id}`, {
        title: tempTitle.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setEditingTitle(false);
        setSuccess('Title updated successfully');
        
        // Notify parent component
        if (onIdeaUpdated) {
          onIdeaUpdated({ ...idea, title: tempTitle.trim() });
        }
      } else {
        setError(response.data.error || 'Failed to update title');
      }
    } catch (error) {
      console.error('Update title error:', error);
      setError(error.response?.data?.error || 'Failed to update title');
    } finally {
      setSaving(false);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(false);
    setTempTitle('');
  };

  const handleTitleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    if (idea) {
      setEditedIdea({
        title: idea.title || '',
        description: idea.description || '',
        category: idea.category || '',
        source: idea.source || '',
        authorName: idea.authorName || '',
        authorEmail: idea.authorEmail || '',
        status: idea.status || 'submitted',
        estimatedEffort: idea.estimatedEffort || '',
        effortUnit: idea.effortUnit || 'story_points',
        detailedRequirements: idea.detailedRequirements || '',
        features: idea.features || [],
        useCases: idea.useCases || []
      });
      
      setInternalData({
        estimatedEffort: idea.estimatedEffort || '',
        effortUnit: idea.effortUnit || 'story_points',
        detailedRequirements: idea.detailedRequirements || '',
        features: idea.features || [],
        useCases: idea.useCases || []
      });
    }
    
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleDeleteIdea = async () => {
    setDeleting(true);
    setError('');
    
    try {
      const response = await axios.delete(`/api/admin/ideas/${idea.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setSuccess('Idea deleted successfully');
        setShowDeleteConfirm(false);
        if (onIdeaUpdated) {
          onIdeaUpdated(); // Trigger refresh of ideas list
        }
        // Close dialog after a brief delay to show success message
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(response.data.error || 'Failed to delete idea');
      }
    } catch (error) {
      console.error('Delete idea error:', error);
      setError(error.response?.data?.error || 'Failed to delete idea');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!idea) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {editingTitle ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, pr: 2 }}>
              <TextField
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={handleTitleKeyPress}
                variant="outlined"
                size="small"
                fullWidth
                autoFocus
                placeholder="Enter idea title"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.25rem',
                    fontWeight: 500
                  }
                }}
              />
              <IconButton 
                size="small" 
                onClick={handleTitleSave}
                color="primary"
                disabled={saving || !tempTitle.trim()}
              >
                <SaveIcon />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleTitleCancel}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          ) : (
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                pr: 2,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  mx: -1,
                  my: -0.5
                }
              }}
              onClick={handleTitleClick}
              title="Click to edit title"
            >
              {editedIdea.title}
              <EditIcon sx={{ ml: 1, fontSize: '1rem', opacity: 0.5 }} />
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Original Idea Details */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Idea Details
            </Typography>

            {/* Status and Category */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip 
                  label={statusLabels[idea.status] || idea.status}
                  color={statusColors[idea.status] || 'default'}
                  size="medium"
                />
                {editing ? (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={editedIdea.category}
                      onChange={(e) => setEditedIdea(prev => ({ ...prev, category: e.target.value }))}
                      label="Category"
                    >
                      <MenuItem value="">
                        <em>No Category</em>
                      </MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Chip 
                    label={editedIdea.category || 'No Category'} 
                    icon={<CategoryIcon />}
                    variant="outlined"
                    size="medium"
                    color={editedIdea.category ? 'default' : 'warning'}
                  />
                )}
                
                {/* Source - Editable */}
                {editing ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Source</InputLabel>
                      <Select
                        value={editedIdea.source}
                        onChange={(e) => setEditedIdea(prev => ({ ...prev, source: e.target.value }))}
                        label="Source"
                      >
                        <MenuItem value="">
                          <em>No Source</em>
                        </MenuItem>
                        {availableSources.map((source) => (
                          <MenuItem key={source} value={source}>
                            {source}
                          </MenuItem>
                        ))}
                        <MenuItem value="Custom">Custom Source</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Custom source input when 'Custom' is selected */}
                    {editedIdea.source === 'Custom' && (
                      <TextField
                        placeholder="Enter custom source"
                        size="small"
                        value={editedIdea.customSource || ''}
                        onChange={(e) => {
                          const customValue = e.target.value;
                          setEditedIdea(prev => ({ 
                            ...prev, 
                            customSource: customValue,
                            source: customValue || 'Custom'
                          }));
                        }}
                        sx={{ minWidth: 200 }}
                      />
                    )}
                  </Box>
                ) : (
                  <Chip 
                    label={editedIdea.source || 'No Source'}
                    color="secondary"
                    variant="outlined"
                    size="medium"
                  />
                )}
                
                {/* Priority - Editable */}
                {editing ? (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={editedIdea.priority || 'medium'}
                      onChange={(e) => setEditedIdea(prev => ({ ...prev, priority: e.target.value }))}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip 
                    label={`Priority: ${editedIdea.priority ? editedIdea.priority.charAt(0).toUpperCase() + editedIdea.priority.slice(1) : 'Medium'}`}
                    size="small" 
                    color={editedIdea.priority === 'high' ? 'error' : editedIdea.priority === 'low' ? 'default' : 'warning'}
                    variant="outlined" 
                  />
                )}
                
                {idea.attachments && idea.attachments.length > 0 && (
                  <Chip 
                    label={`${idea.attachments.length} files`}
                    icon={<AttachIcon />}
                    variant="outlined"
                    size="medium"
                  />
                )}
              </Stack>
            </Box>

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Description
              </Typography>
              <LinkifiedText text={idea.description} />
            </Box>

            {/* Author and Date Info */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Author
                      </Typography>
                      {editing ? (
                        <TextField
                          value={editedIdea.authorName || ''}
                          onChange={(e) => setEditedIdea(prev => ({ ...prev, authorName: e.target.value }))}
                          placeholder="Enter author name"
                          size="small"
                          fullWidth
                          sx={{ mt: 0.5 }}
                        />
                      ) : (
                        <Typography variant="body1">
                          {editedIdea.authorName || 'Anonymous'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
                
                {/* Author Email - Full width when editing */}
                {editing && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="action" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Author Email
                        </Typography>
                        <TextField
                          value={editedIdea.authorEmail || ''}
                          onChange={(e) => setEditedIdea(prev => ({ ...prev, authorEmail: e.target.value }))}
                          placeholder="Enter author email (optional)"
                          size="small"
                          fullWidth
                          sx={{ mt: 0.5 }}
                          type="email"
                        />
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(idea.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Voting Info */}
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                Community Feedback
              </Typography>
              <Typography variant="h4" color="primary">
                {idea.voteCount || 0} votes
              </Typography>
            </Paper>
          </Grid>

          {/* Right Column - Internal Team Data */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Internal Team Data
            </Typography>

            {/* Effort Estimation */}
            <Paper sx={{ p: 2, mb: 3, border: editing ? '2px solid #1976d2' : '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimeIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Effort Estimation
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Estimated Effort"
                    value={internalData.estimatedEffort}
                    onChange={handleInternalDataChange('estimatedEffort')}
                    disabled={!editing}
                    type="number"
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={internalData.effortUnit}
                      label="Unit"
                      onChange={handleInternalDataChange('effortUnit')}
                      disabled={!editing}
                    >
                      <MenuItem value="story_points">Story Points</MenuItem>
                      <MenuItem value="man_days">Man Days</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {internalData.estimatedEffort && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Estimated: {internalData.estimatedEffort} {internalData.effortUnit === 'story_points' ? 'Story Points' : 'Man Days'}
                </Typography>
              )}
            </Paper>

            {/* Detailed Requirements */}
            <Paper sx={{ p: 2, mb: 3, border: editing ? '2px solid #1976d2' : '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AssignmentIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Detailed Requirements
                </Typography>
              </Box>
              
              {editing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Technical Requirements & Implementation Notes"
                  value={internalData.detailedRequirements}
                  onChange={handleInternalDataChange('detailedRequirements')}
                  placeholder="Add detailed technical requirements, implementation notes, dependencies, etc."
                />
              ) : (
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Technical Requirements & Implementation Notes
                  </Typography>
                  {internalData.detailedRequirements ? (
                    <LinkifiedText text={internalData.detailedRequirements} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No technical requirements specified
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            {/* Features List */}
            <Paper sx={{ p: 2, mb: 2, border: editing ? '2px solid #1976d2' : '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Features & Components
              </Typography>
              
              {editing && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Add feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button onClick={addFeature} variant="outlined" size="small">
                    Add
                  </Button>
                </Box>
              )}
              
              <Stack spacing={1}>
                {internalData.features.map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={feature} 
                      variant="outlined" 
                      size="small"
                      onDelete={editing ? () => removeFeature(index) : undefined}
                    />
                  </Box>
                ))}
                {internalData.features.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No features defined yet
                  </Typography>
                )}
              </Stack>
            </Paper>

            {/* Use Cases */}
            <Paper sx={{ p: 2, border: editing ? '2px solid #1976d2' : '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Use Cases & Scenarios
              </Typography>
              
              {editing && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Add use case..."
                    value={newUseCase}
                    onChange={(e) => setNewUseCase(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addUseCase()}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button onClick={addUseCase} variant="outlined" size="small">
                    Add
                  </Button>
                </Box>
              )}
              
              <Stack spacing={1}>
                {internalData.useCases.map((useCase, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={useCase} 
                      variant="outlined" 
                      size="small"
                      color="secondary"
                      onDelete={editing ? () => removeUseCase(index) : undefined}
                    />
                  </Box>
                ))}
                {internalData.useCases.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No use cases defined yet
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Comments Section */}
        <CommentSection ideaId={idea.id} title="Comments & Discussion" />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={() => setShowDeleteConfirm(true)} 
          variant="outlined" 
          color="error"
          startIcon={<DeleteIcon />}
          disabled={deleting || saving}
        >
          Delete Idea
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {!editing ? (
          <Button 
            onClick={() => setEditing(true)} 
            variant="outlined"
            startIcon={<EditIcon />}
          >
            Edit Internal Data
          </Button>
        ) : (
          <>
            <Button 
              onClick={handleCancelEdit} 
              variant="outlined"
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </DialogActions>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this idea? This action cannot be undone.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {idea?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {idea?.description?.substring(0, 100)}...
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteIdea} 
            variant="contained" 
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete Idea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AdminIdeaDetailDialog;
