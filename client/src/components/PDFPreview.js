import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFPreview = () => {
  const [pdfFiles, setPdfFiles] = useState([
    { filename: 'sample.pdf', url: '/uploads/sample.pdf' }
  ]);
  const [selectedPdf, setSelectedPdf] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. The file might be corrupted or not accessible.');
    setLoading(false);
  };

  const handlePdfChange = (event) => {
    setSelectedPdf(event.target.value);
    setPageNumber(1);
    setNumPages(null);
    setError('');
    setLoading(true);
  };

  const handleScaleChange = (event) => {
    setScale(parseFloat(event.target.value));
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          PDF Preview
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          Select a PDF file to preview it here. You can zoom in/out and navigate through pages.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select PDF</InputLabel>
            <Select
              value={selectedPdf}
              label="Select PDF"
              onChange={handlePdfChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {pdfFiles.map((file) => (
                <MenuItem key={file.filename} value={file.url}>
                  {file.filename}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedPdf && (
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Zoom</InputLabel>
              <Select
                value={scale}
                label="Zoom"
                onChange={handleScaleChange}
              >
                <MenuItem value={0.5}>50%</MenuItem>
                <MenuItem value={0.75}>75%</MenuItem>
                <MenuItem value={1.0}>100%</MenuItem>
                <MenuItem value={1.25}>125%</MenuItem>
                <MenuItem value={1.5}>150%</MenuItem>
                <MenuItem value={2.0}>200%</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {selectedPdf && (
          <Box
            sx={{
              border: '1px solid #ccc',
              borderRadius: 1,
              p: 2,
              minHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            {loading && (
              <Box textAlign="center">
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Loading PDF...
                </Typography>
              </Box>
            )}

            <Document
              file={selectedPdf}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <Box textAlign="center">
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Loading PDF...
                  </Typography>
                </Box>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                loading={
                  <Box textAlign="center">
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading page...
                    </Typography>
                  </Box>
                }
              />
            </Document>
          </Box>
        )}

        {selectedPdf && numPages && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Page {pageNumber} of {numPages}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                style={{
                  margin: '0 8px',
                  padding: '4px 8px',
                  backgroundColor: pageNumber <= 1 ? '#ccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>

              <button
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                style={{
                  margin: '0 8px',
                  padding: '4px 8px',
                  backgroundColor: pageNumber >= numPages ? '#ccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </Box>
          </Box>
        )}

        {!selectedPdf && (
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 1,
              p: 4,
              textAlign: 'center',
              backgroundColor: '#f9f9f9'
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Select a PDF file above to see its preview
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PDFPreview;
