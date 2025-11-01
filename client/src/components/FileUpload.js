import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const formData = new FormData();

    acceptedFiles.forEach((file, index) => {
      formData.append('files', file);
    });

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setMessage('');

    try {
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
        setMessage(response.data.message);
        setUploadedFiles(prev => [...prev, ...response.data.files]);
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(
        error.response?.data?.error ||
        'Upload failed. Please try again.'
      );
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
    disabled: uploading
  });

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

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
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
          <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Supports PDF documents and images (JPG, PNG, GIF, WebP)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Maximum 5 files, 10MB each
          </Typography>
          <Button
            variant="contained"
            disabled={uploading}
            sx={{ mt: 1 }}
          >
            Choose Files
          </Button>
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

      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recently Uploaded Files
          </Typography>
          <Stack spacing={1}>
            {uploadedFiles.slice(-3).map((file, index) => (
              <Paper key={index} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getFileIcon(file.mimetype)}
                  <Box flexGrow={1}>
                    <Typography variant="body1">
                      {file.originalName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(file.size)} • {file.mimetype}
                    </Typography>
                  </Box>
                  <Chip
                    label="Uploaded"
                    color="success"
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => window.open(`${file.url}`, '_blank')}
                  >
                    View
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
