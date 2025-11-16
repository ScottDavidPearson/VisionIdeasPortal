import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  Tabs,
  Tab,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudSync as AzureIcon,
  Category as SuiteIcon,
  ViewModule as ModuleIcon,
  Timeline as StatusIcon,
  Source as SourceIcon,
  CleaningServices as CleanupIcon,
  Palette as ThemeIcon
} from '@mui/icons-material';
import axios from 'axios';
import ThemeSettings from './ThemeSettings';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsDialog = ({ open, onClose, onSettingsUpdated }) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Configuration state
  const [config, setConfig] = useState({
    productSuites: {},
    statuses: {},
    sources: [],
    azureDevOps: {
      enabled: false,
      organizationUrl: '',
      project: '',
      personalAccessToken: '',
      areaPath: '',
      iterationPath: ''
    }
  });

  // UI state for editing
  const [editingSuite, setEditingSuite] = useState('');
  const [newSuiteName, setNewSuiteName] = useState('');
  const [editingSuiteName, setEditingSuiteName] = useState(''); // For inline editing
  const [tempSuiteName, setTempSuiteName] = useState(''); // Temporary name during edit
  const [editingModule, setEditingModule] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedSuiteForModule, setSelectedSuiteForModule] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#1976d2');
  const [newSource, setNewSource] = useState('');

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.data.success) {
        setConfig(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupCategories = async () => {
    const confirm = window.confirm(
      'This will remove invalid categories from all ideas based on your current Product Suite settings. ' +
      'Ideas with invalid categories will have their category cleared. Continue?'
    );

    if (!confirm) return;

    setCleaningUp(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/admin/cleanup-categories', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        console.log('Cleanup statistics:', response.data.statistics);
      } else {
        setError(response.data.error || 'Failed to clean up categories');
      }
    } catch (error) {
      console.error('Category cleanup error:', error);
      setError(error.response?.data?.error || 'Failed to clean up categories');
    } finally {
      setCleaningUp(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put('/api/admin/settings', config, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setSuccess('Settings saved successfully!');
        if (onSettingsUpdated) {
          onSettingsUpdated(config);
        }
      } else {
        setError(response.data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setError(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Product Suites Management
  const addSuite = () => {
    if (newSuiteName.trim()) {
      setConfig(prev => ({
        ...prev,
        productSuites: {
          ...prev.productSuites,
          [newSuiteName.trim()]: []
        }
      }));
      setNewSuiteName('');
    }
  };

  const deleteSuite = (suiteName) => {
    setConfig(prev => {
      const newSuites = { ...prev.productSuites };
      delete newSuites[suiteName];
      return {
        ...prev,
        productSuites: newSuites
      };
    });
  };

  const handleSuiteNameClick = (suiteName) => {
    setEditingSuiteName(suiteName);
    setTempSuiteName(suiteName);
  };

  const handleSuiteNameSave = async (originalName) => {
    if (!tempSuiteName.trim()) {
      setError('Suite name cannot be empty');
      return;
    }

    if (tempSuiteName.trim() === originalName) {
      setEditingSuiteName('');
      return;
    }

    // Check if new name already exists
    if (config.productSuites[tempSuiteName.trim()] && tempSuiteName.trim() !== originalName) {
      setError('Suite name already exists');
      return;
    }

    try {
      // Update config with new suite name
      const updatedSuites = { ...config.productSuites };
      const modules = updatedSuites[originalName];
      delete updatedSuites[originalName];
      updatedSuites[tempSuiteName.trim()] = modules;

      const updatedConfig = { ...config, productSuites: updatedSuites };
      setConfig(updatedConfig);

      // Update selectedSuiteForModule if it was the renamed suite
      if (selectedSuiteForModule === originalName) {
        setSelectedSuiteForModule(tempSuiteName.trim());
      }

      // Save to server
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.put('/api/admin/settings', updatedConfig, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setEditingSuiteName('');
        setSuccess('Suite name updated successfully');
        if (onSettingsUpdated) {
          onSettingsUpdated(updatedConfig);
        }
      } else {
        setError(response.data.error || 'Failed to update suite name');
      }
    } catch (error) {
      console.error('Error updating suite name:', error);
      setError('Failed to update suite name');
    } finally {
      setSaving(false);
    }
  };

  const handleSuiteNameCancel = () => {
    setEditingSuiteName('');
    setTempSuiteName('');
  };

  const handleSuiteNameKeyPress = (e, originalName) => {
    if (e.key === 'Enter') {
      handleSuiteNameSave(originalName);
    } else if (e.key === 'Escape') {
      handleSuiteNameCancel();
    }
  };

  const addModule = () => {
    if (newModuleName.trim() && selectedSuiteForModule) {
      setConfig(prev => ({
        ...prev,
        productSuites: {
          ...prev.productSuites,
          [selectedSuiteForModule]: [
            ...prev.productSuites[selectedSuiteForModule],
            newModuleName.trim()
          ]
        }
      }));
      setNewModuleName('');
    }
  };

  const deleteModule = (suiteName, moduleIndex) => {
    setConfig(prev => ({
      ...prev,
      productSuites: {
        ...prev.productSuites,
        [suiteName]: prev.productSuites[suiteName].filter((_, index) => index !== moduleIndex)
      }
    }));
  };

  // Status Management
  const addStatus = () => {
    if (newStatusName.trim()) {
      const statusKey = newStatusName.toLowerCase().replace(/\s+/g, '_');
      setConfig(prev => ({
        ...prev,
        statuses: {
          ...prev.statuses,
          [statusKey]: {
            title: newStatusName.trim(),
            color: newStatusColor,
            bgColor: `${newStatusColor}20`
          }
        }
      }));
      setNewStatusName('');
      setNewStatusColor('#1976d2');
    }
  };

  const deleteStatus = (statusKey) => {
    setConfig(prev => {
      const newStatuses = { ...prev.statuses };
      delete newStatuses[statusKey];
      return {
        ...prev,
        statuses: newStatuses
      };
    });
  };

  // Azure DevOps Configuration
  const updateAzureConfig = (field, value) => {
    setConfig(prev => ({
      ...prev,
      azureDevOps: {
        ...prev.azureDevOps,
        [field]: value
      }
    }));
  };

  const testAzureConnection = async () => {
    try {
      const response = await axios.post('/api/admin/azure/test', config.azureDevOps, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setSuccess('Azure DevOps connection successful!');
      } else {
        setError(response.data.error || 'Azure DevOps connection failed');
      }
    } catch (error) {
      setError('Failed to test Azure DevOps connection');
    }
  };

  const fetchAzureProjects = async () => {
    try {
      setError('');
      setSuccess('Fetching projects...');
      
      console.log('🔍 Fetching Azure DevOps projects...');
      console.log('Config:', config.azureDevOps);
      
      const response = await axios.post('/api/admin/azure/projects', config.azureDevOps, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('✅ Projects response:', response.data);

      if (response.data.success) {
        const projectsList = response.data.projects.map(p => `• ${p.name} (${p.state})`).join('\n');
        setSuccess(`Found ${response.data.projects.length} projects:\n${projectsList}`);
      } else {
        setError(response.data.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('❌ Fetch projects error:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out - Azure DevOps may be slow to respond');
      } else if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data?.error || error.message}`);
      } else if (error.request) {
        setError('Network error - could not reach server');
      } else {
        setError(`Failed to fetch projects: ${error.message}`);
      }
    }
  };

  const fetchWorkItemFields = async () => {
    try {
      setError('');
      setSuccess('Fetching work item type definition...');
      
      const requestData = {
        ...config.azureDevOps,
        project: config.azureDevOps.project || 'VisionSuite',
        workItemType: 'Feature'
      };
      
      const response = await axios.post('/api/admin/azure/workitemtype', requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        timeout: 15000
      });

      if (response.data.success) {
        const fieldsList = response.data.requiredFields.map(f => {
          let allowedValuesText = '';
          if (f.allowedValues && Array.isArray(f.allowedValues) && f.allowedValues.length > 0) {
            allowedValuesText = ` [${f.allowedValues.join(', ')}]`;
          } else if (f.allowedValues && typeof f.allowedValues === 'string' && f.allowedValues !== 'No restrictions') {
            allowedValuesText = ` [${f.allowedValues}]`;
          }
          return `• ${f.name} (${f.referenceName}) - ${f.type}${allowedValuesText}${f.defaultValue ? ` (default: ${f.defaultValue})` : ''}`;
        }).join('\n');
        setSuccess(`Required fields for ${response.data.workItemType}:\n${fieldsList}`);
      } else {
        setError(response.data.error || 'Failed to fetch work item type definition');
      }
    } catch (error) {
      console.error('❌ Fetch work item type error:', error);
      setError(`Failed to fetch work item type: ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchBucketField = async () => {
    try {
      setError('');
      setSuccess('Fetching Custom.Bucket field definition...');
      
      const requestData = {
        ...config.azureDevOps,
        fieldName: 'Custom.Bucket'
      };
      
      const response = await axios.post('/api/admin/azure/field', requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        timeout: 15000
      });

      if (response.data.success) {
        const field = response.data.field;
        let fieldInfo = `Field: ${field.name} (${field.referenceName})\nType: ${field.type}`;
        
        if (field.isPicklist) {
          fieldInfo += `\nPicklist ID: ${field.picklistId}`;
        }
        
        if (field.allowedValues && Array.isArray(field.allowedValues)) {
          fieldInfo += `\nAllowed Values: ${field.allowedValues.join(', ')}`;
        }
        
        if (field.defaultValue) {
          fieldInfo += `\nDefault Value: ${field.defaultValue}`;
        }
        
        if (field.description) {
          fieldInfo += `\nDescription: ${field.description}`;
        }
        
        setSuccess(`Custom.Bucket Field Details:\n${fieldInfo}`);
      } else {
        setError(response.data.error || 'Failed to fetch bucket field definition');
      }
    } catch (error) {
      console.error('❌ Fetch bucket field error:', error);
      setError(`Failed to fetch bucket field: ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchBucketPicklist = async () => {
    try {
      setError('');
      setSuccess('Fetching Custom.Bucket picklist values...');
      
      const requestData = {
        ...config.azureDevOps,
        picklistId: 'ebe6fd9a-8b17-4c21-9e10-ce0a2e642dcb'
      };
      
      const response = await axios.post('/api/admin/azure/picklist', requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        timeout: 15000
      });

      if (response.data.success) {
        const picklist = response.data.picklist;
        let picklistInfo = `Picklist: ${picklist.name}\nID: ${picklist.id}\nType: ${picklist.type}`;
        
        if (picklist.items && picklist.items.length > 0) {
          const values = picklist.items.map(item => item.value || item).join(', ');
          picklistInfo += `\nAllowed Values: ${values}`;
        } else {
          picklistInfo += '\nNo items found in picklist';
        }
        
        setSuccess(`Custom.Bucket Picklist:\n${picklistInfo}`);
      } else {
        setError(response.data.error || 'Failed to fetch bucket picklist');
      }
    } catch (error) {
      console.error('❌ Fetch bucket picklist error:', error);
      setError(`Failed to fetch bucket picklist: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.trim()) return;
    
    const trimmedSource = newSource.trim();
    
    // Check if source already exists
    if (config.sources && config.sources.includes(trimmedSource)) {
      setError('Source already exists');
      return;
    }
    
    try {
      const updatedSources = [...(config.sources || []), trimmedSource];
      const updatedConfig = { ...config, sources: updatedSources };
      
      // Update config state first
      setConfig(updatedConfig);
      
      // Then save to server
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.put('/api/admin/settings', updatedConfig, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setNewSource('');
        setSuccess('Source added successfully');
        if (onSettingsUpdated) {
          onSettingsUpdated(updatedConfig);
        }
      } else {
        setError(response.data.error || 'Failed to add source');
      }
    } catch (error) {
      console.error('Error adding source:', error);
      setError('Failed to add source');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSource = async (sourceToRemove) => {
    const confirm = window.confirm(
      `Are you sure you want to remove the source "${sourceToRemove}"? This action cannot be undone.`
    );
    
    if (!confirm) return;
    
    try {
      const updatedSources = (config.sources || []).filter(source => source !== sourceToRemove);
      const updatedConfig = { ...config, sources: updatedSources };
      
      // Update config state first
      setConfig(updatedConfig);
      
      // Then save to server
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.put('/api/admin/settings', updatedConfig, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setSuccess('Source removed successfully');
        if (onSettingsUpdated) {
          onSettingsUpdated(updatedConfig);
        }
      } else {
        setError(response.data.error || 'Failed to remove source');
      }
    } catch (error) {
      console.error('Error removing source:', error);
      setError('Failed to remove source');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTabValue(0);
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, height: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon color="primary" />
            <Typography variant="h6" component="div">
              Product Team Settings
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, px: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mx: 3, mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label="Product Suites" 
              icon={<SuiteIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Statuses" 
              icon={<StatusIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Sources" 
              icon={<SourceIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Azure DevOps" 
              icon={<AzureIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Theme" 
              icon={<ThemeIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Product Suites Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader 
                      title="Product Suites"
                      subheader="Manage product suite categories"
                      avatar={<SuiteIcon />}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          size="small"
                          placeholder="New suite name"
                          value={newSuiteName}
                          onChange={(e) => setNewSuiteName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addSuite()}
                          sx={{ flexGrow: 1 }}
                        />
                        <Button 
                          variant="outlined" 
                          onClick={addSuite}
                          startIcon={<AddIcon />}
                          size="small"
                        >
                          Add
                        </Button>
                      </Box>
                      
                      <List>
                        {Object.keys(config.productSuites || {}).map((suiteName) => (
                          <ListItem key={suiteName} divider>
                            {editingSuiteName === suiteName ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <TextField
                                  value={tempSuiteName}
                                  onChange={(e) => setTempSuiteName(e.target.value)}
                                  onKeyDown={(e) => handleSuiteNameKeyPress(e, suiteName)}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  autoFocus
                                  placeholder="Enter suite name"
                                />
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleSuiteNameSave(suiteName)}
                                  color="primary"
                                  disabled={saving || !tempSuiteName.trim()}
                                >
                                  <SaveIcon />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={handleSuiteNameCancel}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Box>
                            ) : (
                              <>
                                <ListItemText 
                                  primary={
                                    <Typography 
                                      sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: 'action.hover',
                                          borderRadius: 1,
                                          px: 1,
                                          py: 0.5,
                                          mx: -1,
                                          my: -0.5
                                        }
                                      }}
                                      onClick={() => handleSuiteNameClick(suiteName)}
                                      title="Click to edit suite name"
                                    >
                                      {suiteName}
                                      <EditIcon sx={{ ml: 1, fontSize: '0.8rem', opacity: 0.5 }} />
                                    </Typography>
                                  }
                                  secondary={`${config.productSuites[suiteName].length} modules`}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton 
                                    edge="end" 
                                    onClick={() => deleteSuite(suiteName)}
                                    size="small"
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </>
                            )}
                          </ListItem>
                        ))}
                      </List>
                      
                      {/* Category Cleanup Section */}
                      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Category Maintenance
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Clean up ideas that have invalid categories based on your current Product Suite configuration.
                        </Typography>
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<CleanupIcon />}
                          onClick={handleCleanupCategories}
                          disabled={cleaningUp}
                          size="small"
                        >
                          {cleaningUp ? 'Cleaning Up...' : 'Clean Up Invalid Categories'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader 
                      title="Modules"
                      subheader="Manage modules within suites"
                      avatar={<ModuleIcon />}
                    />
                    <CardContent>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Select Suite</InputLabel>
                        <Select
                          value={selectedSuiteForModule}
                          label="Select Suite"
                          onChange={(e) => setSelectedSuiteForModule(e.target.value)}
                        >
                          {Object.keys(config.productSuites || {}).map((suiteName) => (
                            <MenuItem key={suiteName} value={suiteName}>
                              {suiteName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          size="small"
                          placeholder="New module name"
                          value={newModuleName}
                          onChange={(e) => setNewModuleName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addModule()}
                          disabled={!selectedSuiteForModule}
                          sx={{ flexGrow: 1 }}
                        />
                        <Button 
                          variant="outlined" 
                          onClick={addModule}
                          startIcon={<AddIcon />}
                          size="small"
                          disabled={!selectedSuiteForModule}
                        >
                          Add
                        </Button>
                      </Box>

                      {selectedSuiteForModule && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Modules in {selectedSuiteForModule}:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(config.productSuites[selectedSuiteForModule] || []).map((module, index) => (
                              <Chip
                                key={index}
                                label={module}
                                onDelete={() => deleteModule(selectedSuiteForModule, index)}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Statuses Tab */}
            <TabPanel value={tabValue} index={1}>
              <Card>
                <CardHeader 
                  title="Workflow Statuses"
                  subheader="Manage idea workflow statuses and colors"
                  avatar={<StatusIcon />}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    <TextField
                      size="small"
                      placeholder="New status name"
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      size="small"
                      type="color"
                      value={newStatusColor}
                      onChange={(e) => setNewStatusColor(e.target.value)}
                      sx={{ width: 80 }}
                    />
                    <Button 
                      variant="outlined" 
                      onClick={addStatus}
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      Add Status
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {Object.entries(config.statuses || {}).map(([statusKey, statusConfig]) => (
                      <Grid item xs={12} sm={6} md={4} key={statusKey}>
                        <Paper sx={{ p: 2, backgroundColor: statusConfig.bgColor, border: `1px solid ${statusConfig.color}` }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ color: statusConfig.color, fontWeight: 'bold' }}>
                              {statusConfig.title}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => deleteStatus(statusKey)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Key: {statusKey}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Sources Tab */}
            <TabPanel value={tabValue} index={2}>
              <Card>
                <CardHeader 
                  title="Idea Sources"
                  subheader="Manage the list of available sources for idea submissions"
                  avatar={<SourceIcon />}
                />
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Configure the available sources that users can select when submitting ideas. These sources help categorize where ideas originate from.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <TextField
                        label="New Source"
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        placeholder="e.g., Customer Request, Internal Team"
                        size="small"
                        sx={{ flexGrow: 1 }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddSource();
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddSource}
                        disabled={!newSource.trim()}
                      >
                        Add Source
                      </Button>
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Current Sources ({(config.sources || []).length})
                  </Typography>
                  
                  <Grid container spacing={1}>
                    {(config.sources || []).map((source, index) => (
                      <Grid item key={index}>
                        <Paper 
                          sx={{ 
                            p: 1.5, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            backgroundColor: 'background.default'
                          }}
                        >
                          <Typography variant="body2">
                            {source}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveSource(source)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                    {(!config.sources || config.sources.length === 0) && (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          No sources configured. Add sources to help categorize idea submissions.
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Azure DevOps Tab */}
            <TabPanel value={tabValue} index={3}>
              <Card>
                <CardHeader 
                  title="Azure DevOps Integration"
                  subheader="Configure connection to Azure DevOps for automated work item creation"
                  avatar={<AzureIcon />}
                />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.azureDevOps?.enabled || false}
                        onChange={(e) => updateAzureConfig('enabled', e.target.checked)}
                      />
                    }
                    label="Enable Azure DevOps Integration"
                    sx={{ mb: 3 }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Organization URL"
                        value={config.azureDevOps?.organizationUrl || ''}
                        onChange={(e) => updateAzureConfig('organizationUrl', e.target.value)}
                        placeholder="https://dev.azure.com/yourorg"
                        disabled={!config.azureDevOps?.enabled}
                        helperText="Your Azure DevOps organization URL"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Project Name"
                        value={config.azureDevOps?.project || ''}
                        onChange={(e) => updateAzureConfig('project', e.target.value)}
                        placeholder="YourProjectName"
                        disabled={!config.azureDevOps?.enabled}
                        helperText="Target project for work items"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Personal Access Token"
                        type="password"
                        value={config.azureDevOps?.personalAccessToken || ''}
                        onChange={(e) => updateAzureConfig('personalAccessToken', e.target.value)}
                        placeholder="Your PAT with work item write permissions"
                        disabled={!config.azureDevOps?.enabled}
                        helperText="Create a PAT with Work Items (Read & Write) permissions"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Area Path"
                        value={config.azureDevOps?.areaPath || ''}
                        onChange={(e) => updateAzureConfig('areaPath', e.target.value)}
                        placeholder="ProjectName\\Team"
                        disabled={!config.azureDevOps?.enabled}
                        helperText="Default area path for work items"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Iteration Path"
                        value={config.azureDevOps?.iterationPath || ''}
                        onChange={(e) => updateAzureConfig('iterationPath', e.target.value)}
                        placeholder="ProjectName\\Sprint 1"
                        disabled={!config.azureDevOps?.enabled}
                        helperText="Default iteration path for work items"
                      />
                    </Grid>
                  </Grid>

                  {config.azureDevOps?.enabled && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        onClick={testAzureConnection}
                        startIcon={<AzureIcon />}
                      >
                        Test Connection
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={fetchAzureProjects}
                        startIcon={<AzureIcon />}
                        color="secondary"
                      >
                        Fetch Projects
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={fetchWorkItemFields}
                        startIcon={<AzureIcon />}
                        color="warning"
                      >
                        Check Required Fields
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={fetchBucketField}
                        startIcon={<AzureIcon />}
                        color="error"
                      >
                        Check Bucket Field
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={fetchBucketPicklist}
                        startIcon={<AzureIcon />}
                        color="success"
                      >
                        Get Bucket Values
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </TabPanel>

            {/* Theme Tab */}
            <TabPanel value={tabValue} index={4}>
              <ThemeSettings />
            </TabPanel>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleCleanupCategories}
          variant="outlined"
          color="warning"
          disabled={saving || cleaningUp}
          startIcon={cleaningUp ? <CircularProgress size={16} /> : null}
        >
          {cleaningUp ? 'Cleaning...' : 'Clean Up Categories'}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={saveSettings}
          variant="contained"
          disabled={saving || cleaningUp}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
