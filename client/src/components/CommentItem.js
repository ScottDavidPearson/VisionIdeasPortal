import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Collapse,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import CommentForm from './CommentForm';

const CommentItem = ({ 
  comment, 
  ideaId, 
  onCommentUpdated, 
  onCommentDeleted, 
  onReplyAdded,
  depth = 0 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxDepth = 3; // Maximum nesting depth
  const isNested = depth > 0;
  const canReply = depth < maxDepth;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReply = () => {
    setShowReplyForm(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit comment:', comment.id);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // For demo purposes, we'll use a simple email prompt
      // In a real app, you'd have user authentication
      const authorEmail = prompt('Please enter your email to confirm deletion:');
      if (!authorEmail) {
        setLoading(false);
        return;
      }

      const response = await axios.delete(`/api/comments/${comment.id}`, {
        data: { authorEmail }
      });

      if (response.data.success) {
        if (onCommentDeleted) {
          onCommentDeleted();
        }
      } else {
        setError(response.data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.response?.data?.error || 'Failed to delete comment');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const handleReplyAdded = (newReply) => {
    setShowReplyForm(false);
    if (onReplyAdded) {
      onReplyAdded(newReply);
    }
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <Box
      sx={{
        ml: isNested ? 4 : 0,
        mb: 2,
        pl: isNested ? 2 : 0,
        borderLeft: isNested ? '2px solid' : 'none',
        borderLeftColor: 'divider'
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Avatar */}
        <Avatar
          sx={{
            width: isNested ? 32 : 40,
            height: isNested ? 32 : 40,
            bgcolor: 'primary.main',
            fontSize: isNested ? '0.75rem' : '1rem'
          }}
        >
          {getInitials(comment.authorName)}
        </Avatar>

        {/* Comment Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {comment.authorName}
            </Typography>
            
            <Typography variant="caption" color="text.secondary">
              {formatDate(comment.createdAt)}
            </Typography>

            {comment.updatedAt !== comment.createdAt && (
              <Chip 
                label="edited" 
                size="small" 
                variant="outlined" 
                sx={{ height: 16, fontSize: '0.6rem' }}
              />
            )}

            {comment.isModerated && (
              <Chip 
                label="moderated" 
                size="small" 
                color="warning"
                sx={{ height: 16, fontSize: '0.6rem' }}
              />
            )}

            <Box sx={{ ml: 'auto' }}>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : <MoreVertIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Comment Text */}
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {comment.content}
          </Typography>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {canReply && (
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={handleReply}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Reply
              </Button>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <Button
                size="small"
                startIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowReplies(!showReplies)}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </Box>

          {/* Reply Form */}
          {showReplyForm && (
            <Box sx={{ mt: 2 }}>
              <CommentForm
                ideaId={ideaId}
                parentId={comment.id}
                onCommentAdded={handleReplyAdded}
                onCancel={handleCancelReply}
                placeholder={`Reply to ${comment.authorName}...`}
                compact={true}
              />
            </Box>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <Collapse in={showReplies}>
              <Box sx={{ mt: 2 }}>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    ideaId={ideaId}
                    onCommentUpdated={onCommentUpdated}
                    onCommentDeleted={onCommentDeleted}
                    onReplyAdded={onReplyAdded}
                    depth={depth + 1}
                  />
                ))}
              </Box>
            </Collapse>
          )}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {canReply && (
          <MenuItem onClick={handleReply}>
            <ReplyIcon sx={{ mr: 1 }} />
            Reply
          </MenuItem>
        )}
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CommentItem;
