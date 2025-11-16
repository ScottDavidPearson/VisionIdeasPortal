import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Chip,
  Autocomplete,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  LocalOffer as TagIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';

const TagInput = ({ 
  value = [], 
  onChange, 
  label = "Tags", 
  placeholder = "Add tags...", 
  disabled = false,
  maxTags = 10,
  allowNewTags = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [availableTags, setAvailableTags] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const loading = open && availableTags.length === 0;

  // Fetch available tags from server
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get('/api/tags');
        if (response.data.success) {
          setAvailableTags(response.data.tags);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    })();
  }, [open]);

  const handleTagChange = (event, newValue) => {
    // Limit the number of tags
    if (newValue.length > maxTags) {
      return;
    }
    
    // Remove duplicates and empty values, and trim whitespace
    const uniqueTags = [
      ...new Set(
        newValue
          .filter(tag => tag && typeof tag === 'string')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      )
    ];
    
    onChange(uniqueTags);
  };

  const handleInputChange = (event, newInputValue, reason) => {
    if (reason === 'input') {
      setInputValue(newInputValue);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && inputValue.trim() && allowNewTags) {
      event.preventDefault();
      const newTag = inputValue.trim();
      if (!value.includes(newTag) && value.length < maxTags) {
        onChange([...value, newTag]);
        setInputValue('');
      }
    }
  };

  return (
    <Box>
      <Autocomplete
        multiple
        freeSolo
        options={availableTags}
        value={value}
        onChange={handleTagChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        loading={loading}
        disabled={disabled}
        limitTags={isMobile ? 1 : 3}
        getOptionLabel={(option) => option}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TagIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" noWrap>
                {option}
              </Typography>
              {selected && (
                <Box sx={{ ml: 'auto', color: 'primary.main' }}>
                  ✓
                </Box>
              )}
            </Box>
          </li>
        )}
        noOptionsText={
          inputValue && allowNewTags 
            ? `Press Enter to add "${inputValue}"` 
            : 'No matching tags found'
        }
        isOptionEqualToValue={(option, value) => 
          option.toLowerCase() === value.toLowerCase()
        }
        groupBy={(option) => 
          value.includes(option) ? 'Selected Tags' : 'Available Tags'
        }
        sx={{
          '& .MuiAutocomplete-tag': {
            height: 'auto',
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              overflow: 'visible',
              textOverflow: 'clip',
              maxWidth: '200px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }
          },
          '& .MuiAutocomplete-groupLabel': {
            backgroundColor: theme.palette.grey[100],
            position: 'sticky',
            top: 0,
            zIndex: 1,
            fontWeight: 600,
            px: 1,
            py: 0.5,
            borderBottom: `1px solid ${theme.palette.divider}`
          },
          '& .MuiAutocomplete-groupUl': {
            padding: 0,
            '&:not(:first-of-type)': {
              borderTop: `1px solid ${theme.palette.divider}`,
              marginTop: 1,
              paddingTop: 1
            }
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={
              <Box display="flex" alignItems="center">
                <TagIcon fontSize="small" sx={{ mr: 1 }} />
                <span>{label} {value.length > 0 && `(${value.length}/${maxTags})`}</span>
              </Box>
            }
            placeholder={value.length >= maxTags ? `Maximum ${maxTags} tags` : placeholder}
            onKeyDown={handleKeyDown}
            disabled={disabled || value.length >= maxTags}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            helperText={value.length >= maxTags ? `Maximum ${maxTags} tags allowed` : 'Press Enter to add a tag'}
            fullWidth
          />
        )}
        filterOptions={(options, params) => {
          const filtered = options.filter(option =>
            option.toLowerCase().includes(params.inputValue.toLowerCase())
          );

          const { inputValue } = params;
          const isExisting = options.some(option => inputValue === option);
          if (inputValue !== '' && !isExisting) {
            filtered.push(inputValue);
          }

          return filtered;
        }}
        sx={{ mt: 1 }}
      />
      
      {value.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {value.length} tag{value.length !== 1 ? 's' : ''} added
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TagInput;
