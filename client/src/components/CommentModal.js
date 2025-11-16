import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import CommentSection from './CommentSection';

const CommentModal = ({ open, onClose, idea }) => {
  if (!idea) return null;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const statusColors = {
    'submitted': 'primary',
    'under_review': 'warning', 
    'approved': 'success',
    'in_progress': 'info',
    'completed': 'success',
    'parked': 'error'
  };

  const statusLabels = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'approved': 'Approved', 
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'parked': 'Parking Lot'
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <CommentIcon color="primary" />
            <Typography variant="h6" component="div">
              Discussion
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Idea Summary */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3,
            backgroundColor: 'grey.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {idea.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Chip
                  label={statusLabels[idea.status] || idea.status}
                  color={statusColors[idea.status] || 'default'}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {idea.category}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {idea.submittedBy}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(idea.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {idea.description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}
            >
              {idea.description}
            </Typography>
          )}
        </Box>

        {/* Comments Section */}
        <CommentSection 
          ideaId={idea.id} 
          title="Comments" 
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentModal;
