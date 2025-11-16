import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Default theme configuration
const defaultThemeConfig = {
  mode: 'light', // 'light' or 'dark'
  primaryColor: '#1976d2', // Material-UI blue
  secondaryColor: '#dc004e', // Material-UI pink
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 300,
      lineHeight: 1.167
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.2
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.6
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.6
    }
  }
};

// Create a default MUI theme to ensure it's always available
const defaultMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export const ThemeProvider = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState(() => {
    try {
      // Load theme from localStorage or use default
      const savedTheme = localStorage.getItem('visionPortalTheme');
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
        console.log('🔄 Loaded theme from localStorage on init:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
    }
    console.log('🆕 Using default theme config:', defaultThemeConfig);
    return defaultThemeConfig;
  });

  // Create Material-UI theme based on configuration - recreate when themeConfig changes
  const muiTheme = useMemo(() => {
    try {
      console.log('🎨 Creating new MUI theme with config:', themeConfig);
      return createTheme({
        palette: {
          mode: themeConfig?.mode || 'light',
          primary: {
            main: themeConfig?.primaryColor || '#1976d2',
          },
          secondary: {
            main: themeConfig?.secondaryColor || '#dc004e',
          },
          ...(themeConfig?.mode === 'dark' && {
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
            text: {
              primary: '#ffffff',
              secondary: 'rgba(255, 255, 255, 0.7)',
            },
          }),
        },
        typography: {
          fontFamily: themeConfig?.typography?.fontFamily || '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: themeConfig?.typography?.h1 || { fontSize: '2.125rem', fontWeight: 300, lineHeight: 1.167 },
          h2: themeConfig?.typography?.h2 || { fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.2 },
          h3: themeConfig?.typography?.h3 || { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.6 },
          h4: themeConfig?.typography?.h4 || { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.5 },
          h5: themeConfig?.typography?.h5 || { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
          h6: themeConfig?.typography?.h6 || { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.6 },
        },
      });
    } catch (error) {
      console.error('Error creating MUI theme, using default theme:', error);
      return defaultMuiTheme;
    }
  }, [themeConfig]);

  // Custom components configuration
  const themeWithComponents = useMemo(() => {
    return createTheme({
      ...muiTheme,
      components: {
        // Custom component overrides
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: themeConfig?.mode === 'dark' ? '#1e1e1e' : (themeConfig?.primaryColor || '#1976d2'),
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: themeConfig?.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            },
          },
        },
      },
    });
  }, [muiTheme, themeConfig]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    console.log('💾 Saving theme to localStorage:', themeConfig);
    localStorage.setItem('visionPortalTheme', JSON.stringify(themeConfig));
    
    // Verify it was saved
    const saved = localStorage.getItem('visionPortalTheme');
    console.log('✅ Theme saved to localStorage, verification:', JSON.parse(saved));
  }, [themeConfig]);

  const updateTheme = (updates) => {
    console.log('🔄 ThemeContext updateTheme called with:', updates);
    setThemeConfig(prev => {
      const newConfig = {
        ...prev,
        ...updates
      };
      console.log('📝 New theme config:', newConfig);
      return newConfig;
    });
  };

  const updateTypography = (typographyUpdates) => {
    setThemeConfig(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        ...typographyUpdates
      }
    }));
  };

  const toggleMode = () => {
    setThemeConfig(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  };

  const resetToDefault = () => {
    setThemeConfig(defaultThemeConfig);
  };

  const value = {
    themeConfig,
    muiTheme: themeWithComponents,
    updateTheme,
    updateTypography,
    toggleMode,
    resetToDefault,
    isDarkMode: themeConfig?.mode === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={themeWithComponents}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
