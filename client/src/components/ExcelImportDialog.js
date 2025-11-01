import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ArrowForward as NextIcon
} from '@mui/icons-material';
import ColumnMappingDialog from './ColumnMappingDialog';

const ExcelImportDialog = ({ open, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [showMapping, setShowMapping] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Please select an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setFile(selectedFile);
    setFileData(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const parseFile = async () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    setUploading(true);

    try {
      const text = await file.text();
      
      // Simple CSV parsing
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setFileData({
        headers,
        rows,
        fileName: file.name
      });

    } catch (error) {
      console.error('File parsing error:', error);
      alert('Failed to parse file. Please check the file format.');
    } finally {
      setUploading(false);
    }
  };

  const handleMappingComplete = () => {
    setShowMapping(false);
    setFile(null);
    setFileData(null);
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileData(null);
    setShowMapping(false);
    setDragOver(false);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Dialog open={open && !showMapping} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Import Ideas from Excel/CSV</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Instructions */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Step 1:</strong> Upload your Excel/CSV file<br />
              <strong>Step 2:</strong> Map your columns to system fields<br />
              <strong>Step 3:</strong> Import your data
            </Typography>
          </Alert>

          {/* File Upload Area */}
          <Paper
            sx={{
              p: 4,
              mb: 3,
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : 'grey.300',
              bgcolor: dragOver ? 'primary.light' : 'grey.50',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('excel-file-input').click()}
          >
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            
            {file ? (
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  File Selected
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Drop Excel/CSV file here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports .xlsx, .xls, and .csv files from Microsoft Loop, Excel, etc.
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Parse Progress */}
          {uploading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Parsing file...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* File Data Preview */}
          {fileData && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SuccessIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  File Parsed Successfully!
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                Found <strong>{fileData.rows.length} rows</strong> with <strong>{fileData.headers.length} columns</strong>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Columns detected: {fileData.headers.join(', ')}
              </Typography>

              <Alert severity="success" sx={{ mt: 2 }}>
                Ready for column mapping! Click "Next: Map Columns" to continue.
              </Alert>
            </Paper>
          )}

          {/* Microsoft Loop Tips */}
          <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
            <Typography variant="subtitle2" gutterBottom>
              <InfoIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 16 }} />
              Microsoft Loop Import Tips
            </Typography>
            <Typography variant="body2">
              • Export your Loop table as CSV or copy-paste into Excel<br />
              • Column names can be anything - you'll map them in the next step<br />
              • Only Title and Description are required - all other fields are optional<br />
              • The system will auto-suggest mappings based on column names
            </Typography>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          {!fileData && (
            <Button
              onClick={parseFile}
              variant="contained"
              disabled={!file || uploading}
              startIcon={uploading ? <LinearProgress size={20} /> : <UploadIcon />}
            >
              {uploading ? 'Parsing...' : 'Parse File'}
            </Button>
          )}
          {fileData && (
            <Button
              onClick={() => setShowMapping(true)}
              variant="contained"
              startIcon={<NextIcon />}
            >
              Next: Map Columns
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Column Mapping Dialog */}
      <ColumnMappingDialog
        open={showMapping}
        onClose={() => setShowMapping(false)}
        fileData={fileData}
        onImportSuccess={handleMappingComplete}
      />
    </>
  );
};

export default ExcelImportDialog;
