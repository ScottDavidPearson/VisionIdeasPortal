import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Grid,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Rocket as PromoteIcon,
  Download as DownloadIcon,
  Assignment as EpicIcon,
  Settings as FeatureIcon
} from '@mui/icons-material';
import axios from 'axios';

const PromoteIdeaDialog = ({ idea, open, onClose, onIdeaPromoted }) => {
  const [promotionType, setPromotionType] = useState('epic');
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handlePromote = async () => {
    setPromoting(true);
    setError('');
    setSuccess('');

    try {
      const promotionData = {
        promotionType,
        additionalNotes,
        promotedAt: new Date().toISOString()
      };

      const response = await axios.post(`/api/admin/ideas/${idea.id}/promote`, 
        promotionData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(`Idea promoted as ${promotionType.toUpperCase()} successfully!`);
        
        // Generate and download CSV
        generateCSV(response.data.idea, promotionType);
        
        if (onIdeaPromoted) {
          onIdeaPromoted(response.data.idea);
        }
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to promote idea');
      }
    } catch (error) {
      console.error('Promote idea error:', error);
      setError(error.response?.data?.error || 'Failed to promote idea');
    } finally {
      setPromoting(false);
    }
  };

  const generateCSV = (promotedIdea, type) => {
    const csvData = [
      // CSV Headers
      [
        'Work Item Type',
        'Title',
        'Description',
        'State',
        'Priority',
        'Effort',
        'Business Value',
        'Area Path',
        'Iteration Path',
        'Assigned To',
        'Tags',
        'Original Idea ID',
        'Author',
        'Vote Count',
        'Features',
        'Use Cases',
        'Detailed Requirements',
        'Promoted Date',
        'Source'
      ],
      // Data Row
      [
        type === 'epic' ? 'Epic' : 'Feature',
        promotedIdea.title,
        promotedIdea.description,
        'New',
        promotedIdea.voteCount > 10 ? 'High' : promotedIdea.voteCount > 5 ? 'Medium' : 'Low',
        promotedIdea.estimatedEffort || '',
        promotedIdea.voteCount || 0,
        promotedIdea.category || '',
        '', // Iteration Path - to be filled in DevOps
        '', // Assigned To - to be filled in DevOps
        `"${[promotedIdea.source, ...(promotedIdea.features || []), ...(promotedIdea.useCases || [])].join(', ')}"`,
        promotedIdea.id,
        promotedIdea.authorName || 'Anonymous',
        promotedIdea.voteCount || 0,
        `"${(promotedIdea.features || []).join(', ')}"`,
        `"${(promotedIdea.useCases || []).join(', ')}"`,
        `"${promotedIdea.detailedRequirements || ''}"`,
        new Date().toISOString().split('T')[0],
        promotedIdea.source
      ]
    ];

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => 
        typeof field === 'string' && field.includes(',') && !field.startsWith('"') 
          ? `"${field}"` 
          : field
      ).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `promoted-${type}-${promotedIdea.id}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setPromotionType('epic');
    setAdditionalNotes('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!idea) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PromoteIcon color="primary" />
            <Typography variant="h6" component="div">
              Promote Idea to Azure DevOps
            </Typography>
          </Box>
          <Button onClick={handleClose} size="small">
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

        {/* Idea Summary */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            {idea.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {idea.description}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Category: {idea.category}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Votes: {idea.voteCount || 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Effort: {idea.estimatedEffort ? `${idea.estimatedEffort} ${idea.effortUnit === 'story_points' ? 'SP' : 'MD'}` : 'Not estimated'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Features: {idea.features?.length || 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Promotion Type Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
              Select Promotion Type
            </FormLabel>
            <RadioGroup
              value={promotionType}
              onChange={(e) => setPromotionType(e.target.value)}
            >
              <FormControlLabel 
                value="epic" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EpicIcon color="primary" />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Promote as Epic
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Large feature set or initiative that spans multiple sprints
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <FormControlLabel 
                value="feature" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FeatureIcon color="secondary" />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Promote as Feature
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Single feature that can be completed in one or few sprints
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Additional Notes */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Notes for DevOps Team"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Add any additional context, requirements, or notes for the DevOps team..."
            disabled={promoting}
          />
        </Box>

        {/* CSV Export Info */}
        <Paper sx={{ p: 2, backgroundColor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DownloadIcon color="info" />
            <Typography variant="subtitle2" color="info.dark">
              CSV Export for Azure DevOps
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Upon promotion, a CSV file will be automatically downloaded with all idea data formatted for Azure DevOps import. 
            The file includes work item type, title, description, effort estimation, features, use cases, and all metadata.
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined" disabled={promoting}>
          Cancel
        </Button>
        <Button 
          onClick={handlePromote} 
          variant="contained" 
          disabled={promoting}
          startIcon={promoting ? <CircularProgress size={20} /> : <PromoteIcon />}
        >
          {promoting ? 'Promoting...' : `Promote as ${promotionType.toUpperCase()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromoteIdeaDialog;
