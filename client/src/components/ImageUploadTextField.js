import React, { useState, useRef, useCallback } from 'react';
import { TextField, Box, Typography, Paper } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import axios from 'axios';

const ImageUploadTextField = ({ 
  value, 
  onChange, 
  label, 
  placeholder, 
  multiline = true, 
  rows = 4,
  disabled = false,
  ...props 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textFieldRef = useRef(null);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('files', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.files.length > 0) {
        const uploadedFile = response.data.files[0];
        const imageUrl = uploadedFile.url;
        const imageMarkdown = `\n![${uploadedFile.originalName}](${imageUrl})\n`;
        
        // Insert the image markdown at cursor position or append to end
        const textarea = textFieldRef.current?.querySelector('textarea');
        if (textarea) {
          const cursorPos = textarea.selectionStart;
          const textBefore = value.substring(0, cursorPos);
          const textAfter = value.substring(cursorPos);
          const newValue = textBefore + imageMarkdown + textAfter;
          onChange({ target: { value: newValue } });
        } else {
          onChange({ target: { value: value + imageMarkdown } });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Image upload failed:', error);
      return false;
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    setUploading(true);

    for (const file of imageFiles) {
      await uploadImage(file);
    }

    setUploading(false);
  }, [value, onChange, disabled, uploading]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handlePaste = useCallback(async (e) => {
    if (disabled || uploading) return;

    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault();
    setUploading(true);

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        await uploadImage(file);
      }
    }

    setUploading(false);
  }, [value, onChange, disabled, uploading]);

  return (
    <Box
      ref={textFieldRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      sx={{
        position: 'relative',
        '& .MuiOutlinedInput-root': {
          borderColor: dragOver ? 'primary.main' : undefined,
          backgroundColor: dragOver ? 'primary.50' : undefined,
        }
      }}
    >
      <TextField
        {...props}
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder}
        multiline={multiline}
        rows={rows}
        disabled={disabled || uploading}
        onPaste={handlePaste}
        fullWidth
        helperText={
          <Box component="span">
            {props.helperText}
            <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
              💡 Tip: Drag images here or paste from clipboard to embed them inline
            </Typography>
          </Box>
        }
      />
      
      {dragOver && (
        <Paper
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 1,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          <Box textAlign="center">
            <ImageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" color="primary">
              Drop images to embed
            </Typography>
          </Box>
        </Paper>
      )}
      
      {uploading && (
        <Paper
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 1,
            zIndex: 2,
            pointerEvents: 'none'
          }}
        >
          <Typography variant="h6" color="white">
            Uploading images...
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ImageUploadTextField;
