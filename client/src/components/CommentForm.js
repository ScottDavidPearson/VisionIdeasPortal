import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Paper
} from '@mui/material';
import {
  Send as SendIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

const CommentForm = ({ 
  ideaId, 
  parentId = null, 
  onCommentAdded, 
  onCancel,
  placeholder = "Write a comment...",
  compact = false 
}) => {
  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.authorName.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.authorEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Comment content is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.authorEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        authorName: formData.authorName.trim(),
        authorEmail: formData.authorEmail.trim(),
        content: formData.content.trim()
      };

      if (parentId) {
        payload.parentId = parentId;
      }

      const response = await axios.post(`/api/ideas/${ideaId}/comments`, payload);

      if (response.data.success) {
        setSuccess(parentId ? 'Reply added successfully!' : 'Comment added successfully!');
        
        // Reset form
        setFormData({
          authorName: '',
          authorEmail: '',
          content: ''
        });

        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded(response.data.comment);
        }

        // Auto-hide success message
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      authorName: '',
      authorEmail: '',
      content: ''
    });
    setError('');
    setSuccess('');
    
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Paper 
      elevation={compact ? 1 : 0} 
      sx={{ 
        p: compact ? 2 : 0, 
        border: compact ? 'none' : '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: compact ? 'background.paper' : 'background.default'
      }}
    >
      {!compact && (
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          {parentId ? 'Reply to Comment' : 'Add a Comment'}
        </Typography>
      )}

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

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Your Name"
            value={formData.authorName}
            onChange={handleChange('authorName')}
            size={compact ? "small" : "medium"}
            required
            disabled={loading}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Email Address"
            type="email"
            value={formData.authorEmail}
            onChange={handleChange('authorEmail')}
            size={compact ? "small" : "medium"}
            required
            disabled={loading}
            sx={{ flex: 1 }}
            helperText={compact ? "" : "Your email won't be displayed publicly"}
          />
        </Box>

        <TextField
          label="Comment"
          multiline
          rows={compact ? 3 : 4}
          value={formData.content}
          onChange={handleChange('content')}
          placeholder={placeholder}
          required
          disabled={loading}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {(parentId || compact) && (
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              startIcon={<CancelIcon />}
              size={compact ? "small" : "medium"}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.content.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            size={compact ? "small" : "medium"}
          >
            {loading ? 'Posting...' : (parentId ? 'Reply' : 'Post Comment')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CommentForm;
