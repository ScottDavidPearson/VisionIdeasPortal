import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import axios from 'axios';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentSection = ({ ideaId, title = "Comments" }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (ideaId) {
      fetchComments();
    }
  }, [ideaId, refreshTrigger]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`/api/ideas/${ideaId}/comments`);
      
      if (response.data.success) {
        setComments(response.data.comments);
      } else {
        setError('Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    // Refresh comments to get the threaded structure
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCommentUpdated = () => {
    // Refresh comments after update
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCommentDeleted = () => {
    // Refresh comments after deletion
    setRefreshTrigger(prev => prev + 1);
  };

  if (!ideaId) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          mb: 2,
          '&:hover': {
            backgroundColor: 'action.hover',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            mx: -1,
            my: -0.5
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <CommentIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title} ({comments.length})
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Comment Form */}
          <CommentForm
            ideaId={ideaId}
            onCommentAdded={handleCommentAdded}
            placeholder="Share your thoughts on this idea..."
          />

          <Divider sx={{ my: 2 }} />

          {/* Comments List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : comments.length === 0 ? (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ textAlign: 'center', py: 3, fontStyle: 'italic' }}
            >
              No comments yet. Be the first to share your thoughts!
            </Typography>
          ) : (
            <Box>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  ideaId={ideaId}
                  onCommentUpdated={handleCommentUpdated}
                  onCommentDeleted={handleCommentDeleted}
                  onReplyAdded={handleCommentAdded}
                />
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default CommentSection;
