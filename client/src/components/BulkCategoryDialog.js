import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  Category as CategoryIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const BulkCategoryDialog = ({ open, onClose, selectedIdeas, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
      setSelectedCategory('');
      setResult(null);
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setUpdating(true);
    setResult(null);

    try {
      const updatePromises = selectedIdeas.map(idea => 
        axios.put(`/api/admin/ideas/${idea.id}`, {
          ...idea,
          category: selectedCategory
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        })
      );

      await Promise.all(updatePromises);

      setResult({
        success: true,
        message: `Successfully updated ${selectedIdeas.length} ideas with category "${selectedCategory}"`
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Bulk update error:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || 'Failed to update ideas'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory('');
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Assign Category to Ideas</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Assign a category to {selectedIdeas.length} selected idea{selectedIdeas.length !== 1 ? 's' : ''}
          </Typography>
        </Alert>

        {/* Category Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Select Category"
          >
            <MenuItem value="">
              <em>No Category</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selected Ideas List */}
        <Typography variant="subtitle2" gutterBottom>
          Selected Ideas:
        </Typography>
        <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
          {selectedIdeas.map((idea) => (
            <ListItem key={idea.id} dense>
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText
                primary={idea.title}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption">
                      Current: 
                    </Typography>
                    <Chip 
                      label={idea.category || 'No Category'} 
                      size="small"
                      color={idea.category ? 'default' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Update Progress */}
        {updating && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Updating {selectedIdeas.length} ideas...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Result */}
        {result && (
          <Alert 
            severity={result.success ? 'success' : 'error'} 
            sx={{ mb: 2 }}
            icon={result.success ? <SuccessIcon /> : <ErrorIcon />}
          >
            {result.message}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          {result?.success ? 'Close' : 'Cancel'}
        </Button>
        {!result?.success && (
          <Button
            onClick={handleBulkUpdate}
            variant="contained"
            disabled={!selectedCategory || updating}
            startIcon={<CategoryIcon />}
          >
            {updating ? 'Updating...' : `Update ${selectedIdeas.length} Ideas`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkCategoryDialog;
