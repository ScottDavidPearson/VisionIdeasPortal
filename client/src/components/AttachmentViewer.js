import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

const AttachmentViewer = ({ open, onClose, attachment }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);

  if (!attachment) return null;

  // Debug logging
  console.log('AttachmentViewer - attachment:', attachment);
  console.log('AttachmentViewer - URL:', attachment.url);
  console.log('AttachmentViewer - mimetype:', attachment.mimetype);

  const isImage = attachment.mimetype?.startsWith('image/');
  const isPDF = attachment.mimetype === 'application/pdf';
  const isVideo = attachment.mimetype?.startsWith('video/');
  
  console.log('AttachmentViewer - isImage:', isImage, 'isPDF:', isPDF, 'isVideo:', isVideo);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = (e) => {
    setLoading(false);
    console.error('Image load error:', e);
    console.error('Failed URL:', attachment.url);
    console.error('Attachment details:', attachment);
    setError(`Failed to load image: ${attachment.originalName}. URL: ${attachment.url}`);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" component="div" noWrap>
            {attachment.originalName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {attachment.mimetype} • {(attachment.size / 1024 / 1024).toFixed(1)} MB
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isImage && (
            <>
              <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.25}>
                <ZoomOutIcon />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: '50px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </Typography>
              <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomInIcon />
              </IconButton>
              <IconButton size="small" onClick={resetZoom}>
                <FullscreenIcon />
              </IconButton>
            </>
          )}
          <IconButton size="small" onClick={handleDownload}>
            <DownloadIcon />
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        )}

        {isImage && !error && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              p: 2
            }}
          >
            <img
              src={attachment.url}
              alt={attachment.originalName}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease',
                cursor: zoom > 1 ? 'grab' : 'default'
              }}
            />
          </Box>
        )}

        {isImage && error && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="error">
              Image Load Failed
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Try downloading the file or check if the file exists on the server.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download File
            </Button>
          </Box>
        )}

        {isPDF && (
          <Box sx={{ flex: 1, height: '100%' }}>
            <iframe
              src={`${attachment.url}#toolbar=1&navpanes=1&scrollbar=1`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title={attachment.originalName}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError('Failed to load PDF. Click download to view in external application.');
              }}
            />
          </Box>
        )}

        {isVideo && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              backgroundColor: '#000',
              p: 2
            }}
          >
            <video
              src={attachment.url}
              controls
              onLoadedData={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError('Failed to load video. Click download to view in external application.');
              }}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        )}

        {!isImage && !isPDF && !isVideo && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Preview not available
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This file type cannot be previewed in the browser.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download to View
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button onClick={handleDownload} variant="contained" startIcon={<DownloadIcon />}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttachmentViewer;
