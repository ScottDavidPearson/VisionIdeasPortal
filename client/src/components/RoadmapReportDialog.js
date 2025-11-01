import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  FilterList as FilterIcon,
  Timeline as RoadmapIcon,
  Download as DownloadIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import axios from 'axios';
import RoadmapReportModal from './RoadmapReportModal';

const RoadmapReportDialog = ({ open, onClose, ideas = [], currentFilters = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  
  // Filter state - initialize with current Kanban filters
  const [filters, setFilters] = useState({
    statuses: ['approved', 'in_progress', 'completed'],
    productSuites: [],
    sources: [],
    includePromoted: true,
    includeEffortEstimates: true,
    includeFeatures: true,
    includeUseCases: true,
    sortBy: 'status'
  });

  // Update filters when currentFilters or dialog opens
  useEffect(() => {
    if (open && currentFilters) {
      console.log('Current Kanban filters:', currentFilters); // Debug log
      
      const initialProductSuites = [];
      
      // If Kanban has a product suite filter, include it
      if (currentFilters.productSuite) {
        initialProductSuites.push(currentFilters.productSuite);
        console.log('Adding product suite to report filters:', currentFilters.productSuite);
      }
      
      // Include all statuses when a specific product suite is selected
      const initialStatuses = currentFilters.productSuite 
        ? ['submitted', 'under_review', 'approved', 'in_progress', 'completed']
        : ['approved', 'in_progress', 'completed'];
      
      // If Kanban has a source filter, include it
      const initialSources = currentFilters.source ? [currentFilters.source] : [];
      
      console.log('Setting report filters:', {
        statuses: initialStatuses,
        productSuites: initialProductSuites,
        sources: initialSources
      });
      
      setFilters(prev => ({
        ...prev,
        statuses: initialStatuses,
        productSuites: initialProductSuites,
        sources: initialSources
      }));
    }
  }, [open, currentFilters]);

  // Fetch categories and sources when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchSources();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await axios.get('/api/sources');
      if (response.data.success) {
        setSources(response.data.sources);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  // Get unique values for filter options from API data
  const getUniqueProductSuites = () => {
    const suites = new Set();
    categories.forEach(category => {
      const [suite] = category.split(' - ');
      if (suite) suites.add(suite);
    });
    return Array.from(suites).sort();
  };

  const getUniqueSources = () => {
    return sources.sort();
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleStatusChange = (status, checked) => {
    setFilters(prev => ({
      ...prev,
      statuses: checked 
        ? [...prev.statuses, status]
        : prev.statuses.filter(s => s !== status)
    }));
  };

  const handleSuiteChange = (suite, checked) => {
    setFilters(prev => ({
      ...prev,
      productSuites: checked 
        ? [...prev.productSuites, suite]
        : prev.productSuites.filter(s => s !== suite)
    }));
  };

  const handleSourceChange = (source, checked) => {
    setFilters(prev => ({
      ...prev,
      sources: checked 
        ? [...prev.sources, source]
        : prev.sources.filter(s => s !== source)
    }));
  };

  const getFilteredIdeas = () => {
    return ideas.filter(idea => {
      // Status filter
      if (!filters.statuses.includes(idea.status)) return false;
      
      // Product suite filter
      if (filters.productSuites.length > 0) {
        const ideaSuite = idea.category?.split(' - ')[0];
        if (!filters.productSuites.includes(ideaSuite)) return false;
      }
      
      // Source filter
      if (filters.sources.length > 0) {
        if (!filters.sources.includes(idea.source)) return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'status') {
        const statusOrder = ['approved', 'in_progress', 'completed'];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      } else if (filters.sortBy === 'votes') {
        return (b.voteCount || 0) - (a.voteCount || 0);
      } else if (filters.sortBy === 'effort') {
        return (b.estimatedEffort || 0) - (a.estimatedEffort || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const generateRoadmapReport = () => {
    setError('');
    setSuccess('');
    
    const filteredIdeas = getFilteredIdeas();
    
    if (filteredIdeas.length === 0) {
      setError('No ideas match the selected filters. Please adjust your filters and try again.');
      return;
    }
    
    // Show the modal with the filtered ideas
    setShowReportModal(true);
    setSuccess(`Report generated with ${filteredIdeas.length} ideas!`);
  };

  const filteredIdeas = getFilteredIdeas();
  const statusOptions = [
    { key: 'submitted', label: 'Submitted', color: '#1976d2' },
    { key: 'under_review', label: 'Under Review', color: '#ed6c02' },
    { key: 'approved', label: 'Approved', color: '#2e7d32' },
    { key: 'in_progress', label: 'In Progress', color: '#0288d1' },
    { key: 'completed', label: 'Completed', color: '#388e3c' }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, height: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <RoadmapIcon color="primary" />
            <Typography variant="h6" component="div">
              Generate Roadmap Report
            </Typography>
          </Box>
          <Button onClick={onClose} size="small">
            <CloseIcon />
          </Button>
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
          {/* Filter Configuration */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FilterIcon color="primary" />
                <Typography variant="h6">
                  Report Filters
                </Typography>
              </Box>

              {/* Status Filter */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Include Statuses:
              </Typography>
              <FormGroup>
                {statusOptions.map(status => (
                  <FormControlLabel
                    key={status.key}
                    control={
                      <Checkbox
                        checked={filters.statuses.includes(status.key)}
                        onChange={(e) => handleStatusChange(status.key, e.target.checked)}
                        sx={{ color: status.color }}
                      />
                    }
                    label={status.label}
                  />
                ))}
              </FormGroup>

              {/* Product Suite Filter */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Product Suites:
              </Typography>
              <FormGroup>
                {getUniqueProductSuites().map(suite => (
                  <FormControlLabel
                    key={suite}
                    control={
                      <Checkbox
                        checked={filters.productSuites.includes(suite)}
                        onChange={(e) => handleSuiteChange(suite, e.target.checked)}
                      />
                    }
                    label={suite}
                  />
                ))}
              </FormGroup>

              {/* Source Filter */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Sources:
              </Typography>
              <FormGroup>
                {getUniqueSources().map(source => (
                  <FormControlLabel
                    key={source}
                    control={
                      <Checkbox
                        checked={filters.sources.includes(source)}
                        onChange={(e) => handleSourceChange(source, e.target.checked)}
                      />
                    }
                    label={source}
                  />
                ))}
              </FormGroup>

              <Divider sx={{ my: 2 }} />

              {/* Report Options */}
              <Typography variant="subtitle2" gutterBottom>
                Include in Report:
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includePromoted}
                      onChange={(e) => handleFilterChange('includePromoted', e.target.checked)}
                    />
                  }
                  label="Promoted Items"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeEffortEstimates}
                      onChange={(e) => handleFilterChange('includeEffortEstimates', e.target.checked)}
                    />
                  }
                  label="Effort Estimates"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeFeatures}
                      onChange={(e) => handleFilterChange('includeFeatures', e.target.checked)}
                    />
                  }
                  label="Features List"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeUseCases}
                      onChange={(e) => handleFilterChange('includeUseCases', e.target.checked)}
                    />
                  }
                  label="Use Cases"
                />
              </FormGroup>

              {/* Sort Options */}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="status">Status</MenuItem>
                  <MenuItem value="votes">Vote Count</MenuItem>
                  <MenuItem value="effort">Effort Estimate</MenuItem>
                  <MenuItem value="created">Creation Date</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Preview */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Report Preview
              </Typography>
              
              {/* Summary Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="primary">
                        {filteredIdeas.length}
                      </Typography>
                      <Typography variant="caption">
                        Total Items
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {filteredIdeas.filter(i => i.status === 'approved').length}
                      </Typography>
                      <Typography variant="caption">
                        Approved
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="info.main">
                        {filteredIdeas.filter(i => i.status === 'in_progress').length}
                      </Typography>
                      <Typography variant="caption">
                        In Progress
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {filteredIdeas.filter(i => i.status === 'completed').length}
                      </Typography>
                      <Typography variant="caption">
                        Completed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Ideas List Preview */}
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {filteredIdeas.map((idea, index) => (
                  <Paper key={idea.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {idea.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip 
                            label={idea.status.replace('_', ' ')} 
                            size="small" 
                            color={
                              idea.status === 'approved' ? 'success' :
                              idea.status === 'in_progress' ? 'info' :
                              idea.status === 'completed' ? 'success' : 'default'
                            }
                          />
                          <Chip label={idea.category} size="small" variant="outlined" />
                          {idea.promoted && (
                            <Chip 
                              label={`Promoted as ${idea.promotionType?.toUpperCase()}`} 
                              size="small" 
                              color="secondary" 
                            />
                          )}
                        </Box>
                        {filters.includeEffortEstimates && idea.estimatedEffort && (
                          <Typography variant="caption" color="text.secondary">
                            Effort: {idea.estimatedEffort} {idea.effortUnit === 'story_points' ? 'SP' : 'MD'}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {idea.voteCount || 0} votes
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={generateRoadmapReport} 
          variant="contained" 
          disabled={filteredIdeas.length === 0}
          startIcon={<ReportIcon />}
        >
          View Roadmap Report
        </Button>
      </DialogActions>

      {/* Roadmap Report Modal */}
      <RoadmapReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        ideas={getFilteredIdeas()}
        filters={filters}
      />
    </Dialog>
  );
};

export default RoadmapReportDialog;
