import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon
} from '@mui/icons-material';

const RoadmapReportModal = ({ open, onClose, ideas, filters }) => {
  if (!ideas) return null;

  // Calculate summary statistics
  const summary = {
    total: ideas.length,
    approved: ideas.filter(i => i.status === 'approved').length,
    inProgress: ideas.filter(i => i.status === 'in_progress').length,
    completed: ideas.filter(i => i.status === 'completed').length,
    promoted: ideas.filter(i => i.promoted).length
  };

  // Group ideas by status
  const groupedIdeas = {
    approved: ideas.filter(i => i.status === 'approved'),
    in_progress: ideas.filter(i => i.status === 'in_progress'),
    completed: ideas.filter(i => i.status === 'completed')
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#2e7d32';
      case 'in_progress': return '#0288d1';
      case 'completed': return '#388e3c';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#1976d2',
        color: 'white'
      }}>
        <Box>
          <Typography variant="h5" component="div">
            🚀 Vision Ideas Portal - Roadmap Report
          </Typography>
          <Typography variant="subtitle2">
            Generated on {new Date().toLocaleDateString()}
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={handlePrint} sx={{ color: 'white', mr: 1 }}>
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Summary Dashboard */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            📊 Summary Dashboard
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {summary.total}
                  </Typography>
                  <Typography variant="body2">
                    Total Items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', bgcolor: '#e8f5e8' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                    {summary.approved}
                  </Typography>
                  <Typography variant="body2">
                    Approved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', bgcolor: '#e1f5fe' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#0288d1' }}>
                    {summary.inProgress}
                  </Typography>
                  <Typography variant="body2">
                    In Progress
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', bgcolor: '#f1f8e9' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#388e3c' }}>
                    {summary.completed}
                  </Typography>
                  <Typography variant="body2">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#ed6c02' }}>
                    {summary.promoted}
                  </Typography>
                  <Typography variant="body2">
                    Promoted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Applied Filters */}
        {filters && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              🔍 Applied Filters
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filters.statuses?.length > 0 && (
                <Chip label={`Status: ${filters.statuses.join(', ')}`} variant="outlined" />
              )}
              {filters.productSuites?.length > 0 && (
                <Chip label={`Suites: ${filters.productSuites.join(', ')}`} variant="outlined" />
              )}
              {filters.sources?.length > 0 && (
                <Chip label={`Sources: ${filters.sources.join(', ')}`} variant="outlined" />
              )}
            </Box>
          </Box>
        )}

        {/* Ideas by Status */}
        {Object.entries(groupedIdeas).map(([status, statusIdeas]) => {
          if (statusIdeas.length === 0) return null;
          
          return (
            <Box key={status} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ color: getStatusColor(status) }}>
                {status === 'approved' && '✅'} 
                {status === 'in_progress' && '🔄'} 
                {status === 'completed' && '🎉'} 
                {' '}{getStatusLabel(status)} ({statusIdeas.length})
              </Typography>
              
              <Grid container spacing={2}>
                {statusIdeas.map((idea, index) => (
                  <Grid item xs={12} md={6} key={idea.id || index}>
                    <Card sx={{ 
                      border: `2px solid ${getStatusColor(status)}`,
                      borderRadius: 2
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {idea.title || 'Untitled'}
                        </Typography>
                        
                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Chip 
                            label={getStatusLabel(idea.status)} 
                            size="small"
                            sx={{ 
                              bgcolor: getStatusColor(idea.status),
                              color: 'white'
                            }}
                          />
                          <Chip label={idea.category || 'No Category'} size="small" variant="outlined" />
                          <Chip label={idea.source || 'Unknown'} size="small" variant="outlined" />
                          {idea.voteCount && (
                            <Chip label={`${idea.voteCount} votes`} size="small" variant="outlined" />
                          )}
                          {idea.estimatedEffort && (
                            <Chip 
                              label={`${idea.estimatedEffort} ${idea.effortUnit === 'story_points' ? 'SP' : 'MD'}`} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                          {idea.promoted && (
                            <Chip label="Promoted" size="small" color="warning" />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {idea.description || 'No description available'}
                        </Typography>
                        
                        {idea.features && idea.features.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" fontWeight="bold">Features:</Typography>
                            <Typography variant="caption" display="block">
                              {idea.features.join(', ')}
                            </Typography>
                          </Box>
                        )}
                        
                        {idea.useCases && idea.useCases.length > 0 && (
                          <Box>
                            <Typography variant="caption" fontWeight="bold">Use Cases:</Typography>
                            <Typography variant="caption" display="block">
                              {idea.useCases.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}

        {ideas.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No ideas match the selected filters
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          Vision Ideas Portal - Product Roadmap Report
        </Typography>
        <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="outlined">
          Print Report
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoadmapReportModal;
