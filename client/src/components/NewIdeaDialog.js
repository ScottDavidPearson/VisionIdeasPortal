import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import ImageUploadTextField from './ImageUploadTextField';

const NewIdeaDialog = ({ open, onClose, onIdeaCreated }) => {
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productSuite: '',
    module: '',
    source: '',
    priority: 'medium',
    authorName: '',
    authorEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Fetch categories and sources when dialog opens
  useEffect(() => {
    if (open) {
      // Always fetch fresh data when dialog opens
      fetchCategories();
      fetchSources();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      if (response.data.success) {
        console.log('All categories loaded:', response.data.categories); // Debug log
        setCategories(response.data.categories);
      } else {
        console.error('Failed to fetch categories:', response.data.error);
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

  // Extract unique product suites from categories
  const getProductSuites = () => {
    const suites = new Set();
    categories.forEach(category => {
      if (category.includes(' - ')) {
        const suite = category.split(' - ')[0];
        suites.add(suite);
      }
    });
    console.log('Available product suites:', Array.from(suites)); // Debug log
    return Array.from(suites).sort();
  };

  // Extract modules for a specific product suite
  const getModulesForSuite = (productSuite) => {
    const modules = new Set();
    categories.forEach(category => {
      if (category.startsWith(productSuite + ' - ')) {
        const [, module] = category.split(' - ');
        if (module) modules.add(module);
      }
    });
    return Array.from(modules).sort();
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Reset module when product suite changes
      if (field === 'productSuite') {
        updated.module = '';
      }
      
      return updated;
    });
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/upload', formData, {
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
        setUploadedFiles(prev => [...prev, ...response.data.files]);
      } else {
        setError(response.data.error || 'File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'File upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

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
    disabled: uploading || loading
  });

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Combine product suite and module for the category field
      const category = formData.productSuite && formData.module 
        ? `${formData.productSuite} - ${formData.module}`
        : formData.productSuite || 'General';

      const submitData = {
        ...formData,
        category,
        attachments: uploadedFiles
      };

      const response = await axios.post('/api/ideas', submitData);
      
      if (response.data.success) {
        // If we have attachments, link them to the idea
        if (uploadedFiles.length > 0) {
          try {
            await axios.post(`/api/ideas/${response.data.idea.id}/attachments`, {
              attachments: uploadedFiles
            });
          } catch (attachError) {
            console.warn('Failed to link attachments:', attachError);
          }
        }
        
        onIdeaCreated(response.data.idea);
        handleClose();
      } else {
        setError(response.data.error || 'Failed to create idea');
      }
    } catch (error) {
      console.error('Create idea error:', error);
      setError(error.response?.data?.error || 'Failed to create idea');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      productSuite: '',
      module: '',
      source: '',
      priority: 'medium',
      authorName: '',
      authorEmail: ''
    });
    setUploadedFiles([]);
    setError('');
    onClose();
  };

  const availableModules = formData.productSuite ? getModulesForSuite(formData.productSuite) : [];

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
          <Typography variant="h6" component="div">
            Submit New Idea
          </Typography>
          <Button
            onClick={handleClose}
            size="small"
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Idea Title"
            value={formData.title}
            onChange={handleChange('title')}
            margin="normal"
            required
            placeholder="Enter a compelling title for your idea"
            disabled={loading}
          />

          <ImageUploadTextField
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            margin="normal"
            required
            multiline
            rows={4}
            placeholder="Describe your idea in detail. What problem does it solve? How would it work?"
            disabled={loading}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Product Suite</InputLabel>
            <Select
              value={formData.productSuite}
              label="Product Suite"
              onChange={handleChange('productSuite')}
              disabled={loading}
            >
              {getProductSuites().map(suite => (
                <MenuItem key={suite} value={suite}>
                  {suite}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required disabled={!formData.productSuite}>
            <InputLabel>Module</InputLabel>
            <Select
              value={formData.module}
              label="Module"
              onChange={handleChange('module')}
              disabled={loading || !formData.productSuite}
            >
              {availableModules.map(module => (
                <MenuItem key={module} value={module}>
                  {module}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Source</InputLabel>
            <Select
              value={formData.source}
              label="Source"
              onChange={handleChange('source')}
              disabled={loading}
            >
              {sources.map(source => (
                <MenuItem key={source} value={source}>
                  {source}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              label="Priority"
              onChange={handleChange('priority')}
              disabled={loading}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Your Name"
            value={formData.authorName}
            onChange={handleChange('authorName')}
            margin="normal"
            placeholder="Enter your name (optional)"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Email Address"
            value={formData.authorEmail}
            onChange={handleChange('authorEmail')}
            margin="normal"
            type="email"
            placeholder="Enter your email (optional)"
            disabled={loading}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Your idea will be reviewed by the team and you'll be notified of any updates.
          </Typography>

          {/* File Upload Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attachments (Optional)
            </Typography>
            <Paper
              {...getRootProps()}
              sx={{
                p: 3,
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
                cursor: uploading || loading ? 'not-allowed' : 'pointer',
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

            {uploadedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploaded Files ({uploadedFiles.length})
                </Typography>
                <Stack spacing={1}>
                  {uploadedFiles.map((file, index) => (
                    <Paper key={index} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getFileIcon(file.mimetype)}
                      <Box flexGrow={1}>
                        <Typography variant="body2">
                          {file.originalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)} • {file.mimetype}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeFile(index)}
                        startIcon={<DeleteIcon />}
                      >
                        Remove
                      </Button>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            disabled={loading || !formData.title.trim() || !formData.description.trim() || !formData.productSuite || !formData.module || !formData.source}
          >
            {loading ? 'Submitting...' : 'Submit Idea'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NewIdeaDialog;
