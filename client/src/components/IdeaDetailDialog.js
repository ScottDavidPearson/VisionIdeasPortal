import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
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
  Paper,
  Stack,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ThumbUp as ThumbUpIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  AttachFile as AttachIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  LocalOffer as TagIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import LinkifiedText from './LinkifiedText';
import CommentSection from './CommentSection';
import AttachmentViewer from './AttachmentViewer';
import TagInput from './TagInput';
import axios from 'axios';

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

const IdeaDetailDialog = ({ idea: initialIdea, open, onClose, onIdeaUpdated }) => {
  const [idea, setIdea] = useState(initialIdea);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Update local state when prop changes
  useEffect(() => {
    setIdea(initialIdea);
    setIsEditing(false);
  }, [initialIdea]);
  const [voting, setVoting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);

  // Generate or get user ID for voting
  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  };

  const handleVote = async () => {
    if (!idea) return;
    
    setVoting(true);
    try {
      const userId = getUserId();
      const response = await axios.post(`/api/ideas/${idea.id}/vote`, { userId });
      if (response.data.success && onIdeaUpdated) {
        // Update the idea with new vote count
        const updatedIdea = { ...idea, voteCount: response.data.voteCount };
        onIdeaUpdated(updatedIdea);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const handleViewAttachment = (attachment) => {
    setSelectedAttachment(attachment);
    setShowAttachmentViewer(true);
  };

  const handleCloseAttachmentViewer = () => {
    setShowAttachmentViewer(false);
    setSelectedAttachment(null);
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!idea || acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post(`/api/ideas/${idea.id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        setUploadSuccess(`${acceptedFiles.length} file(s) uploaded successfully`);
        // Refresh the idea to show new attachments
        window.location.reload(); // Simple refresh - could be improved with state management
      } else {
        setUploadError(response.data.error || 'File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.error || 'File upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [idea]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    disabled: uploading
  });

  const getFileIcon = (mimetype) => {
    if (mimetype === 'application/pdf') return <PdfIcon />;
    if (mimetype.startsWith('image/')) return <ImageIcon />;
    return <AttachIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const handleTagChange = async (newTags) => {
    try {
      setIdea(prev => ({
        ...prev,
        tags: newTags
      }));
    } catch (error) {
      console.error('Error updating tags:', error);
      setError('Failed to update tags');
    }
  };

  const handleSaveTags = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      const response = await axios.put(`/api/ideas/${idea.id}`, {
        tags: idea.tags || []
      });
      
      if (response.data.success) {
        onIdeaUpdated(response.data.idea);
        setIsEditing(false);
      } else {
        setError(response.data.error || 'Failed to update tags');
      }
    } catch (error) {
      console.error('Error saving tags:', error);
      setError('Failed to save tags. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIdea(initialIdea);
    setIsEditing(false);
    setError('');
  };

  if (!idea) return null;

  return (
    <Dialog 
      open={open} 
      onClose={isSaving ? undefined : onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, pr: 2 }}>
            {idea.title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Status and Category */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Chip 
                label={statusLabels[idea.status] || idea.status}
                color={statusColors[idea.status] || 'default'}
                size="medium"
              />
            </Grid>
            <Grid item>
              <Chip 
                label={idea.category} 
                icon={<CategoryIcon />}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item>
              <Chip 
                label={idea.source}
                color="secondary"
                variant="outlined"
                size="medium"
              />
            </Grid>
            {idea.attachments && idea.attachments.length > 0 && (
              <Grid item>
                <Chip 
                  label={`${idea.attachments.length} files`}
                  icon={<AttachIcon />}
                  variant="outlined"
                  size="medium"
                />
              </Grid>
            )}
            <Grid item>
              <IconButton
                onClick={handleVote}
                disabled={voting}
                color="primary"
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: '16px',
                  px: 1,
                  '&:hover': {
                    backgroundColor: 'primary.light'
                  }
                }}
              >
                <ThumbUpIcon fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                  {idea.voteCount || 0}
                </Typography>
              </IconButton>
            </Grid>
          </Grid>
        </Box>

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <LinkifiedText text={idea.description} />
        </Box>

        {/* Notes */}
        {idea.notes && idea.notes.trim() && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'grey.50', 
              borderRadius: 1,
              borderLeft: '3px solid',
              borderLeftColor: 'info.main'
            }}>
              <LinkifiedText text={idea.notes} />
            </Box>
          </Box>
        )}

        {/* Attachments Section */}
        {idea.attachments && idea.attachments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attachments ({idea.attachments.length})
            </Typography>
            <Stack spacing={2}>
              {idea.attachments.map((attachment, index) => (
                <Paper key={index} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getFileIcon(attachment.mimetype)}
                  <Box flexGrow={1}>
                    <Typography variant="body1">
                      {attachment.originalName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(attachment.size)} • {attachment.mimetype}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewAttachment(attachment)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = attachment.url;
                      link.download = attachment.originalName;
                      link.click();
                    }}
                  >
                    Download
                  </Button>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Add Attachments Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add Attachments
          </Typography>
          
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          {uploadSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {uploadSuccess}
            </Alert>
          )}

          <Paper
            {...getRootProps()}
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
              cursor: uploading ? 'not-allowed' : 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <input {...getInputProps()} />
            <Box textAlign="center">
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {isDragActive
                  ? 'Drop files here...'
                  : 'Drag & drop files here, or click to select'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports PDF documents and images (JPG, PNG, GIF, WebP)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum 5 files, 10MB each
              </Typography>
            </Box>
          </Paper>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </Box>

        {/* Author and Date Info */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Author
                  </Typography>
                  <Typography variant="body1">
                    {idea.authorName || 'Anonymous'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
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

        {/* Comments Section */}
        <CommentSection ideaId={idea.id} />

        {/* Voting Section */}
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'grey.50', 
          borderRadius: 1,
          textAlign: 'center'
        }}>
          <Typography variant="h6" gutterBottom>
            Vote for this idea
          </Typography>
          <Button
            variant="contained"
            startIcon={<ThumbUpIcon />}
            onClick={handleVote}
            disabled={voting}
            size="large"
            sx={{ minWidth: 150 }}
          >
            {voting ? 'Voting...' : `Vote (${idea.voteCount || 0})`}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Attachment Viewer Modal */}
      <AttachmentViewer
        open={showAttachmentViewer}
        onClose={handleCloseAttachmentViewer}
        attachment={selectedAttachment}
      />
    </Dialog>
  );
};

export default IdeaDetailDialog;
