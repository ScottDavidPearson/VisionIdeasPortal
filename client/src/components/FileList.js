import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // This is a mock implementation - in a real app, you'd fetch from your API
      // const response = await axios.get(`${API_BASE_URL}/api/files`);
      // setFiles(response.data.files);

      // For demo purposes, we'll use mock data
      setFiles([
        {
          id: 1,
          filename: 'sample.pdf',
          originalName: 'Product Requirements.pdf',
          mimetype: 'application/pdf',
          size: 2048576,
          url: '/uploads/sample.pdf',
          uploadDate: new Date().toISOString()
        },
        {
          id: 2,
          filename: 'screenshot.png',
          originalName: 'UI Mockup.png',
          mimetype: 'image/png',
          size: 1024000,
          url: '/uploads/screenshot.png',
          uploadDate: new Date().toISOString()
        }
      ]);
    } catch (error) {
      setError('Failed to load files');
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file) => {
    try {
      // await axios.delete(`${API_BASE_URL}/api/files/${file.id}`);
      setFiles(files.filter(f => f.id !== file.id));
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      setError('Failed to delete file');
      console.error('Error deleting file:', error);
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype === 'application/pdf') return <PdfIcon />;
    if (mimetype.startsWith('image/')) return <ImageIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {files.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No files uploaded yet. Upload some files to get started!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getFileIcon(file.mimetype)}
                    <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                      {file.originalName}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formatFileSize(file.size)} • {file.mimetype}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Uploaded: {formatDate(file.uploadDate)}
                  </Typography>

                  <Box mt={2}>
                    <Chip
                      label={file.mimetype === 'application/pdf' ? 'PDF' : 'Image'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => window.open(`${API_BASE_URL}${file.url}`, '_blank')}
                  >
                    View
                  </Button>

                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${API_BASE_URL}${file.url}`;
                      link.download = file.originalName;
                      link.click();
                    }}
                  >
                    Download
                  </Button>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setFileToDelete(file);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{fileToDelete?.originalName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(fileToDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileList;
