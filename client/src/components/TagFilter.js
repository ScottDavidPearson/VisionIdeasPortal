import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Chip, 
  Typography, 
  Stack, 
  IconButton, 
  Tooltip,
  Popover,
  TextField,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import {
  LocalOffer as TagIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';

const TagFilter = ({ selectedTags = [], onChange, maxChips = 5 }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const open = Boolean(anchorEl);

  // Fetch available tags
  useEffect(() => {
    if (!open) return;
    
    const fetchTags = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/tags');
        if (response.data.success) {
          setAvailableTags(response.data.tags);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [open]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTagToggle = (tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onChange(newSelectedTags);
  };

  const handleDelete = (tagToDelete) => {
    onChange(selectedTags.filter(tag => tag !== tagToDelete));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleAutocompleteChange = (event, newValue) => {
    if (newValue && !selectedTags.includes(newValue)) {
      onChange([...selectedTags, newValue]);
    }
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  const showChipCount = selectedTags.length > maxChips;
  const displayedTags = showChipCount 
    ? selectedTags.slice(0, maxChips - 1)
    : selectedTags;
  const hiddenTagsCount = selectedTags.length - (maxChips - 1);

  return (
    <Box>
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
        <Tooltip title="Filter by tags">
          <Chip
            icon={<FilterIcon />}
            label="Tags"
            variant={selectedTags.length > 0 ? "filled" : "outlined"}
            color={selectedTags.length > 0 ? "primary" : "default"}
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        </Tooltip>

        {displayedTags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onDelete={() => handleDelete(tag)}
            onClick={() => handleTagToggle(tag)}
            color="primary"
            variant="outlined"
            sx={{
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
          />
        ))}

        {showChipCount && (
          <Chip
            label={`+${hiddenTagsCount} more`}
            size="small"
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        )}

        {selectedTags.length > 1 && (
          <Tooltip title="Clear all filters">
            <IconButton 
              size="small" 
              onClick={handleClearAll}
              sx={{ ml: 1 }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            width: 300,
            maxHeight: 400,
            overflowY: 'auto',
          },
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Filter by Tags
        </Typography>
        
        <Autocomplete
          freeSolo
          options={filteredTags}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={handleAutocompleteChange}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Type to search or add tags"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <TagIcon color="action" sx={{ mr: 1 }} />
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TagIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{option}</Typography>
              </Box>
            </li>
          )}
          noOptionsText={
            inputValue 
              ? `No tags found for "${inputValue}"` 
              : 'Start typing to search tags'
          }
        />

        <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Available Tags
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : availableTags.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" p={2}>
              No tags available
            </Typography>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {availableTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleTagToggle(tag)}
                  color={selectedTags.includes(tag) ? "primary" : "default"}
                  variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                  size="small"
                  sx={{
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {selectedTags.length > 0 && (
          <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
              </Typography>
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={handleClearAll}
              >
                Clear all
              </Typography>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default TagFilter;
