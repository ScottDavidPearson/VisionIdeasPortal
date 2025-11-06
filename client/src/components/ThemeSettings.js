import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Refresh as ResetIcon,
  TextFields as TypographyIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSettings = () => {
  const { 
    themeConfig, 
    updateTheme, 
    updateTypography, 
    toggleMode, 
    resetToDefault, 
    isDarkMode 
  } = useTheme();

  const [localConfig, setLocalConfig] = useState(themeConfig);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync local config with theme config changes
  useEffect(() => {
    console.log('🎨 ThemeSettings component mounted/updated with config:', themeConfig);
    setLocalConfig(themeConfig);
  }, [themeConfig]);

  const handleColorChange = (colorType, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const handleTypographyChange = (element, property, value) => {
    setLocalConfig(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [element]: {
          ...prev.typography[element],
          [property]: value
        }
      }
    }));
  };

  const handleFontFamilyChange = (value) => {
    setLocalConfig(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        fontFamily: value
      }
    }));
  };

  const applyChanges = () => {
    console.log('🎨 Applying theme changes:', {
      primaryColor: localConfig.primaryColor,
      secondaryColor: localConfig.secondaryColor,
      typography: localConfig.typography
    });
    
    updateTheme({
      primaryColor: localConfig.primaryColor,
      secondaryColor: localConfig.secondaryColor
    });
    updateTypography(localConfig.typography);
    
    console.log('✅ Theme update functions called');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    resetToDefault();
    setLocalConfig(themeConfig);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const fontFamilyOptions = [
    '"Roboto", "Helvetica", "Arial", sans-serif',
    '"Inter", "Roboto", sans-serif',
    '"Poppins", "Roboto", sans-serif',
    '"Open Sans", "Roboto", sans-serif',
    '"Lato", "Roboto", sans-serif',
    '"Montserrat", "Roboto", sans-serif'
  ];

  return (
    <Box sx={{ p: 3 }}>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Theme settings updated successfully!
        </Alert>
      )}

      {/* Dark/Light Mode Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
            <Typography variant="h6" sx={{ ml: 1 }}>
              Display Mode
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={isDarkMode}
                onChange={toggleMode}
                color="primary"
              />
            }
            label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Toggle between light and dark themes for better visibility in different environments.
          </Typography>
        </CardContent>
      </Card>

      {/* Color Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PaletteIcon />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Color Scheme
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Color"
                type="color"
                value={localConfig.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Main brand color used for headers, buttons, and accents"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secondary Color"
                type="color"
                value={localConfig.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Accent color used for highlights and secondary elements"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Typography Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TypographyIcon />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Typography
            </Typography>
          </Box>
          
          {/* Font Family */}
          <TextField
            fullWidth
            select
            label="Font Family"
            value={localConfig.typography.fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mb: 3 }}
            helperText="Choose the primary font family for the application"
          >
            {fontFamilyOptions.map((font) => (
              <option key={font} value={font}>
                {font.split(',')[0].replace(/"/g, '')}
              </option>
            ))}
          </TextField>

          <Divider sx={{ my: 2 }} />

          {/* Heading Sizes */}
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Heading Sizes
          </Typography>
          <Grid container spacing={2}>
            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((heading) => (
              <Grid item xs={12} sm={6} md={4} key={heading}>
                <TextField
                  fullWidth
                  label={`${heading.toUpperCase()} Font Size`}
                  value={localConfig.typography[heading].fontSize}
                  onChange={(e) => handleTypographyChange(heading, 'fontSize', e.target.value)}
                  helperText={`Example: 2rem, 24px, 1.5em`}
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Tooltip title="Reset to default theme">
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            color="secondary"
          >
            Reset to Default
          </Button>
        </Tooltip>
        <Button
          variant="contained"
          onClick={() => {
            console.log('🔘 Apply Changes button clicked!');
            alert('Button clicked! Check console for more details.');
            applyChanges();
          }}
          color="primary"
        >
          Apply Changes
        </Button>
      </Box>
    </Box>
  );
};

export default ThemeSettings;
