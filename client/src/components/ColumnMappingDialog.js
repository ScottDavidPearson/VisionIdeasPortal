import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

const ColumnMappingDialog = ({ open, onClose, fileData, onImportSuccess }) => {
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  // Available target fields for mapping
  const targetFields = [
    { key: '', label: '-- Skip this column --', required: false },
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: true },
    { key: 'category', label: 'Category/Product Suite', required: false },
    { key: 'source', label: 'Source', required: false },
    { key: 'authorName', label: 'Author Name', required: false },
    { key: 'authorEmail', label: 'Author Email', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'priority', label: 'Priority (high/medium/low)', required: false },
    { key: 'voteCount', label: 'Vote Count', required: false },
    { key: 'estimatedEffort', label: 'Estimated Effort', required: false },
    { key: 'effortUnit', label: 'Effort Unit', required: false },
    { key: 'notes', label: 'Notes (can map multiple columns)', required: false },
    { key: 'detailedRequirements', label: 'Technical Requirements', required: false },
    { key: 'features', label: 'Features (comma-separated)', required: false },
    { key: 'useCases', label: 'Use Cases (comma-separated)', required: false }
  ];

  useEffect(() => {
    if (fileData && fileData.headers && fileData.rows) {
      // Initialize column mapping with smart defaults
      const initialMapping = {};
      fileData.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('title') || lowerHeader.includes('name')) {
          initialMapping[header] = 'title';
        } else if (lowerHeader.includes('description') || lowerHeader.includes('detail')) {
          initialMapping[header] = 'description';
        } else if (lowerHeader.includes('category') || lowerHeader.includes('suite')) {
          initialMapping[header] = 'category';
        } else if (lowerHeader.includes('source')) {
          initialMapping[header] = 'source';
        } else if (lowerHeader.includes('author') || lowerHeader.includes('creator')) {
          initialMapping[header] = 'authorName';
        } else if (lowerHeader.includes('email') || lowerHeader.includes('contact')) {
          initialMapping[header] = 'authorEmail';
        } else if (lowerHeader.includes('status')) {
          initialMapping[header] = 'status';
        } else if (lowerHeader.includes('effort') || lowerHeader.includes('estimate')) {
          initialMapping[header] = 'estimatedEffort';
        } else {
          initialMapping[header] = ''; // Skip by default
        }
      });
      setColumnMapping(initialMapping);

      // Set preview data (first 3 rows)
      setPreviewData(fileData.rows.slice(0, 3));
    }
  }, [fileData]);

  const handleMappingChange = (sourceColumn, targetField) => {
    setColumnMapping(prev => ({
      ...prev,
      [sourceColumn]: targetField
    }));
  };

  const validateMapping = () => {
    const mappedFields = Object.values(columnMapping).filter(field => field !== '');
    const requiredFields = targetFields.filter(f => f.required).map(f => f.key);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    return {
      isValid: missingRequired.length === 0,
      missingFields: missingRequired
    };
  };

  const handleImport = async () => {
    const validation = validateMapping();
    if (!validation.isValid) {
      alert(`Missing required mappings: ${validation.missingFields.join(', ')}`);
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const mappedData = fileData.rows.map((row, index) => {
        const mappedRow = {};
        const notesFields = [];
        
        Object.entries(columnMapping).forEach(([sourceColumn, targetField]) => {
          if (targetField && targetField !== '') {
            const value = row[sourceColumn] || '';
            
            if (targetField === 'notes') {
              // Collect all fields mapped to notes for aggregation
              if (value.trim()) {
                notesFields.push(`${sourceColumn}: ${value.trim()}`);
              }
            } else if (targetField === 'voteCount') {
              // Ensure vote count is a number
              mappedRow[targetField] = parseInt(value) || 0;
            } else if (targetField === 'priority') {
              // Normalize priority values
              const normalizedPriority = value.toLowerCase().trim();
              if (['high', 'medium', 'low'].includes(normalizedPriority)) {
                mappedRow[targetField] = normalizedPriority;
              } else {
                mappedRow[targetField] = 'medium'; // default
              }
            } else {
              mappedRow[targetField] = value;
            }
          }
        });
        
        // Aggregate notes fields
        if (notesFields.length > 0) {
          mappedRow.notes = notesFields.join('\n\n');
        }
        
        return mappedRow;
      });

      const response = await axios.post('/api/admin/import/mapped-data', {
        data: mappedData,
        mapping: columnMapping
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setImportResult(response.data);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        throw new Error(response.data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error.response?.data?.error || error.message || 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setColumnMapping({});
    setImportResult(null);
    setPreviewData([]);
    onClose();
  };

  if (!fileData) return null;

  const validation = validateMapping();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Map Columns for Import</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Map your file columns to the system fields. Required fields: <strong>Title</strong> and <strong>Description</strong>
          </Typography>
        </Alert>

        {/* Column Mapping */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Column Mapping
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 2 }}>
            {fileData.headers.map((header, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {header}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sample: {previewData[0] && previewData[0][header] ? 
                      String(previewData[0][header]).substring(0, 50) + '...' : 'No data'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
                
                <FormControl sx={{ minWidth: 250 }}>
                  <InputLabel>Map to field</InputLabel>
                  <Select
                    value={columnMapping[header] || ''}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    label="Map to field"
                  >
                    {targetFields.map((field) => (
                      <MenuItem key={field.key} value={field.key}>
                        {field.label} {field.required && <Chip label="Required" size="small" color="error" />}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Validation Status */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: validation.isValid ? 'success.light' : 'warning.light' }}>
          <Typography variant="subtitle2" gutterBottom>
            Mapping Status:
          </Typography>
          {validation.isValid ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuccessIcon color="success" />
              <Typography>All required fields mapped</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="warning" />
              <Typography>Missing required fields: {validation.missingFields.join(', ')}</Typography>
            </Box>
          )}
        </Paper>

        {/* Data Preview */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data Preview ({fileData.rows.length} total rows)
          </Typography>
          
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {fileData.headers.map((header, index) => (
                    <TableCell key={index}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {header}
                      </Typography>
                      <br />
                      <Chip 
                        label={columnMapping[header] ? 
                          targetFields.find(f => f.key === columnMapping[header])?.label || 'Unknown' : 
                          'Skipped'
                        }
                        size="small"
                        color={columnMapping[header] ? 'primary' : 'default'}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {fileData.headers.map((header, colIndex) => (
                      <TableCell key={colIndex}>
                        <Typography variant="body2">
                          {String(row[header] || '').substring(0, 100)}
                          {String(row[header] || '').length > 100 && '...'}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Import Progress */}
        {importing && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Importing {fileData.rows.length} rows...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Import Results */}
        {importResult && (
          <Paper sx={{ p: 2, mb: 3 }}>
            {importResult.success ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SuccessIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="success.main">
                    Import Successful!
                  </Typography>
                </Box>
                
                <Typography variant="body1" gutterBottom>
                  {importResult.message}
                </Typography>
                
                {importResult.statistics && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${importResult.statistics.saved} Imported`} color="success" />
                    {importResult.statistics.errors > 0 && (
                      <Chip label={`${importResult.statistics.errors} Errors`} color="error" />
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="error">
                    Import Failed
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {importResult.error}
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!validation.isValid || importing}
          startIcon={importing ? <LinearProgress size={20} /> : <SuccessIcon />}
        >
          {importing ? 'Importing...' : `Import ${fileData.rows.length} Ideas`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnMappingDialog;
