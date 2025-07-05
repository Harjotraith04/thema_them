import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Collapse,
  Avatar,
  alpha,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
  Drawer,
  AppBar,
  Toolbar,
  Badge,
  Divider,
  Tabs,
  Tab,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CodeIcon from '@mui/icons-material/Code';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EnhancedTableRow, GlowButton, FrostedGlassPaper } from './StyledComponents';
import { codesApi } from '../utils/api';
import api from '../utils/api';

function Codebook({ codeAssignments, projectId, codes, setCodes, onCodesUpdated, documents = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCode, setExpandedCode] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [selectedCodebook, setSelectedCodebook] = useState(0); // Index of selected codebook tab
  const [selectedCodesForGrouping, setSelectedCodesForGrouping] = useState([]); // For sub-grouping
  const [subGroupDialogOpen, setSubGroupDialogOpen] = useState(false);
  const [newSubGroupName, setNewSubGroupName] = useState('');
  
  // Extract unique codes from assignments
  const uniqueCodes = codes || [];
  
  // Group codes by codebook
  const codesByCodebook = {};
  
  uniqueCodes.forEach(code => {
    const codebookId = code.codebook_id || 'default';
    if (!codesByCodebook[codebookId]) {
      codesByCodebook[codebookId] = [];
    }
    codesByCodebook[codebookId].push(code);
  });

  // Create codebook tabs - Default and AI Generated ones
  const codebookIds = Object.keys(codesByCodebook);

  // Sort the IDs to ensure manual codebooks come first, then AI codebooks
  codebookIds.sort((a, b) => {
    const codesA = codesByCodebook[a];
    const codesB = codesByCodebook[b];
    
    // Check if codebooks contain AI-generated codes
    const aHasAICodes = codesA.some(code => code.is_auto_generated);
    const bHasAICodes = codesB.some(code => code.is_auto_generated);
    
    // Manual codebooks (without AI codes) come first
    if (!aHasAICodes && bHasAICodes) return -1;
    if (aHasAICodes && !bHasAICodes) return 1;
    
    // Within manual codebooks, 'default' comes first
    if (!aHasAICodes && !bHasAICodes) {
      if (a === 'default') return -1;
      if (b === 'default') return 1;
    }
    
    return 0; // Keep original order for same type
  });

  const codebooks = codebookIds.map((codebookId, index) => {
    const codesInCodebook = codesByCodebook[codebookId];
    
    const hasAIGeneratedCodes = codesInCodebook.some(code => code.is_auto_generated);
    const hasManualCodes = codesInCodebook.some(code => !code.is_auto_generated);
    
    let name;
    let isAIGenerated;

    if (hasAIGeneratedCodes) {
      const aiCodebooksSoFar = codebooks.filter(cb => cb.isAIGenerated).length;
      name = aiCodebooksSoFar > 0 ? `AI Coding ${aiCodebooksSoFar + 1}` : 'AI Coding';
      isAIGenerated = true;
    } else {
      name = 'default';
      isAIGenerated = false;
    }
    
    return {
      id: codebookId,
      name,
      codes: codesInCodebook,
      isAIGenerated
    };
  });

  // If no codebooks exist, create a default empty one
  if (codebooks.length === 0) {
    codebooks.push({
      id: 'default',
      name: 'default',
      codes: [],
      isAIGenerated: false
    });
  }

  // Ensure selectedCodebook is within bounds
  const validSelectedCodebook = Math.min(selectedCodebook, Math.max(0, codebooks.length - 1));
  if (validSelectedCodebook !== selectedCodebook) {
    setSelectedCodebook(validSelectedCodebook);
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleRowClick = (id) => {
    setExpandedCode(expandedCode === id ? null : id);
  };

  // Filter assignments based on search query and selected codes
  const filteredAssignments = codeAssignments.filter(
    (assignment) => {
      const matchesSearch = 
        (assignment.document_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.text_snapshot || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.code_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCodeFilter = selectedCodes.length === 0 || 
        selectedCodes.includes(assignment.code_name);
      
      return matchesSearch && matchesCodeFilter;
    }
  );

  // Sort assignments
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return (a.document_name || '').localeCompare(b.document_name || '');
      case 'code':
        return (a.code_name || '').localeCompare(b.code_name || '');
      case 'recent':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleCodeFilter = (codeName) => {
    setSelectedCodes(prev => 
      prev.includes(codeName) 
        ? prev.filter(code => code !== codeName)
        : [...prev, codeName]
    );
  };

  const toggleViewMode = () => {
    // This function is no longer the primary view toggler, 
    // but we can keep it in case it's used elsewhere or for future features.
  };

  // Function to get a random color for codes that don't have a defined color
  const getRandomColor = (text) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'];
    const index = text.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Function to delete a code
  const handleDeleteCode = async (codeId, codeName) => {
    if (window.confirm(`Are you sure you want to delete the code "${codeName}"? This action cannot be undone.`)) {
      try {
        await codesApi.deleteCode(codeId);
        
        // Update the local state
        const updatedCodes = codes.filter(code => code.id !== codeId);
        setCodes(updatedCodes);
        
        // Also update assignments if any
        if (onCodesUpdated) {
          onCodesUpdated();
        }
        
        console.log(`Code "${codeName}" deleted successfully`);
      } catch (error) {
        console.error('Error deleting code:', error);
        alert('Failed to delete code. Please try again.');
      }
    }
  };

  // Function to delete a code assignment
  const handleDeleteAssignment = async (assignmentId, documentName, textSnippet) => {
    if (window.confirm(`Are you sure you want to delete this assignment from "${documentName}"? This action cannot be undone.`)) {
      try {
        await api.codeAssignments.deleteAssignment(assignmentId);
        
        // Refresh the data to reflect the changes
        if (onCodesUpdated) {
          onCodesUpdated();
        }
        
        console.log(`Assignment from "${documentName}" deleted successfully`);
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment. Please try again.');
      }
    }
  };

  // Function to generate AI codes (placeholder)
  const handleGenerateAICodes = async () => {
    try {
      // Get all document IDs from the current project
      const documentIds = documents.map(doc => doc.id);
      
      if (documentIds.length === 0) {
        alert('No documents found to generate AI codes. Please upload documents first.');
        return;
      }
      
      const generatedCodes = await codesApi.generateAICodes(documentIds);
      
      // Update the codes state with the newly generated AI codes
      if (generatedCodes && generatedCodes.length > 0) {
        setCodes(prevCodes => [...prevCodes, ...generatedCodes]);
        
        if (onCodesUpdated) {
          onCodesUpdated();
        }
        
        console.log('AI codes generated successfully');
        alert(`Successfully generated ${generatedCodes.length} AI codes!`);
        
        // Switch to the first AI generated codebook after the codes are updated
        // We need to wait for the component to re-render with the new codes
        setTimeout(() => {
          // Find the first AI codebook index
          const firstAICodebookIndex = codebooks.findIndex(cb => cb.isAIGenerated);
          if (firstAICodebookIndex !== -1) {
            setSelectedCodebook(firstAICodebookIndex);
          }
        }, 100);
      } else {
        alert('No AI codes were generated. The documents may not contain sufficient content for code generation.');
      }
    } catch (error) {
      console.error('Error generating AI codes:', error);
      alert('AI code generation endpoint is not yet functional. This feature will be available soon.');
    }
  };

  // Function to truncate text
  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Function to handle code selection for grouping
  const handleCodeSelectionForGrouping = (codeId) => {
    setSelectedCodesForGrouping(prev => 
      prev.includes(codeId)
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  // Function to open sub-group dialog
  const handleCreateSubGroup = () => {
    if (selectedCodesForGrouping.length === 0) {
      alert('Please select at least one code to create a sub-group.');
      return;
    }
    setSubGroupDialogOpen(true);
  };

  // Function to create sub-group
  const handleSubGroupSubmit = async () => {
    if (!newSubGroupName.trim()) {
      alert('Please enter a sub-group name.');
      return;
    }

    try {
      const updatedCodes = await codesApi.assignGroupToCodes(selectedCodesForGrouping, newSubGroupName.trim());
      
      // Update the local codes state
      const updatedCodesMap = new Map(updatedCodes.map(code => [code.id, code]));
      const newCodes = codes.map(code => 
        updatedCodesMap.has(code.id) ? updatedCodesMap.get(code.id) : code
      );
      
      setCodes(newCodes);
      
      // Reset state
      setSelectedCodesForGrouping([]);
      setNewSubGroupName('');
      setSubGroupDialogOpen(false);
      
      if (onCodesUpdated) {
        onCodesUpdated();
      }
      
      alert(`Successfully created sub-group "${newSubGroupName.trim()}" with ${selectedCodesForGrouping.length} codes.`);
    } catch (error) {
      console.error('Error creating sub-group:', error);
      alert('Failed to create sub-group. Please try again.');
    }
  };

  // Function to select all codes in current codebook
  const handleSelectAllCodes = () => {
    const currentCodes = codebooks[validSelectedCodebook]?.codes || [];
    const currentCodeIds = currentCodes.map(code => code.id);
    
    if (selectedCodesForGrouping.length === currentCodeIds.length) {
      // If all are selected, deselect all
      setSelectedCodesForGrouping([]);
    } else {
      // Select all
      setSelectedCodesForGrouping(currentCodeIds);
    }
  };

  // Function to export codebook data as CSV
  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const csvData = [];
      
      // Add header row
      csvData.push([
        'Codebook Name',
        'Codebook Type',
        'Code Name',
        'Code Color',
        'Code Group',
        'Code Created At',
        'Assignment Document',
        'Assignment Text',
        'Assignment Note',
        'Assignment Created At',
        'Assignment Confidence',
        'Assignment Status'
      ]);
      
      // Process each codebook
      codebooks.forEach(codebook => {
        const codebookName = codebook.name;
        const codebookType = codebook.isAIGenerated ? 'AI Generated' : 'Manual';
        
        // Get assignments for codes in this codebook
        const codebookCodes = codebook.codes || [];
        const codebookCodeNames = codebookCodes.map(code => code.name);
        
        // Filter assignments for this codebook
        const codebookAssignments = codeAssignments.filter(assignment => 
          codebookCodeNames.includes(assignment.code_name)
        );
        
        if (codebookAssignments.length > 0) {
          // Add rows for each assignment
          codebookAssignments.forEach(assignment => {
            const code = codebookCodes.find(c => c.name === assignment.code_name);
            csvData.push([
              codebookName,
              codebookType,
              assignment.code_name || '',
              code?.color || '',
              code?.group || '',
              code?.created_at ? new Date(code.created_at).toISOString() : '',
              assignment.document_name || '',
              assignment.text_snapshot ? `"${assignment.text_snapshot.replace(/"/g, '""')}"` : '',
              assignment.note ? `"${assignment.note.replace(/"/g, '""')}"` : '',
              assignment.created_at ? new Date(assignment.created_at).toISOString() : '',
              assignment.confidence || '',
              assignment.status || ''
            ]);
          });
        } else {
          // Add rows for codes without assignments
          codebookCodes.forEach(code => {
            csvData.push([
              codebookName,
              codebookType,
              code.name || '',
              code.color || '',
              code.group || '',
              code.created_at ? new Date(code.created_at).toISOString() : '',
              '', // No document
              '', // No text
              '', // No note
              '', // No assignment date
              '', // No confidence
              ''  // No status
            ]);
          });
        }
      });
      
      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(field => {
          // Handle fields that might contain commas, quotes, or newlines
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `codebook_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('CSV export completed successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Tabular view for assignments
  const AssignmentsTable = ({ assignments, codeInfo }) => (
    <Box sx={{ mt: 2 }}>
      {/* Single Rectangular Table for both Mobile and Desktop */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: '4px', // More rectangular with minimal rounding
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' // Add subtle shadow for definition
        }}
      >
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            {/* Code Description Row */}
            {codeInfo?.description && (
              <TableRow sx={{ backgroundColor: alpha(theme.palette.info.main, 0.08) }}>
                <TableCell 
                  colSpan={isMobile ? 3 : 4}
                  sx={{ 
                    p: 2,
                    borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.main, minWidth: 'fit-content' }}>
                      Code Description:
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: theme.palette.text.primary, flex: 1 }}>
                      {codeInfo.description}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            
            {/* Table Headers */}
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.main, width: isMobile ? '25%' : '20%' }}>
                Document
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.main, width: isMobile ? '55%' : '65%' }}>
                Text Excerpt
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.main, width: isMobile ? '20%' : '15%' }}>
                Date
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.main, width: isMobile ? '0%' : '0%' }}>
                {/* Empty header for actions, no width specified to auto-fit */}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment, index) => (
              <TableRow 
                key={assignment.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    transform: 'scale(1.001)',
                    transition: 'all 0.2s ease-in-out'
                  },
                  '&:nth-of-type(odd)': {
                    backgroundColor: alpha(theme.palette.background.default, 0.3)
                  }
                }}
              >
                <TableCell sx={{ verticalAlign: 'top', p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {assignment.document_name}
                  </Typography>
                </TableCell>
                
                <TableCell sx={{ verticalAlign: 'top', p: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      whiteSpace: 'normal',
                      color: theme.palette.text.primary
                    }}
                  >
                    "{assignment.text_snapshot}"
                  </Typography>
                </TableCell>
                
                <TableCell sx={{ verticalAlign: 'top', p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                
                <TableCell sx={{ verticalAlign: 'top', p: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit assignment">
                      <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete this assignment">
                      <IconButton 
                        size="small" 
                        sx={{ color: theme.palette.error.main }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAssignment(assignment.id, assignment.document_name, assignment.text_snapshot);
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      minHeight: '500px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            mb: 2
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Codebook
            </Typography>
            <Badge badgeContent={codeAssignments.length} color="primary" max={99}>
              <CodeIcon />
            </Badge>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
            backdropFilter: 'blur(12px)',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            width: 280
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Menu</Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* Add mobile menu items here */}
          <MenuItem onClick={handleGenerateAICodes}>
            <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Generate AI Codes</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleCreateSubGroup}>
            <ListItemIcon><GroupWorkIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Create Sub-Group</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportCSV}>
            <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export CSV</ListItemText>
          </MenuItem>
        </Box>
      </Drawer>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar for Desktop */}
        {!isMobile && (
          <FrostedGlassPaper 
            sx={{ 
              width: isTablet ? 260 : 300, 
              flexShrink: 0, 
              p: 2,
              m: 2,
              mr: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, px: 1 }}>Codebooks</Typography>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={validSelectedCodebook}
              onChange={(e, newValue) => setSelectedCodebook(newValue)}
              aria-label="Codebook tabs"
              sx={{
                borderRight: 0,
                '& .MuiTabs-indicator': {
                  left: 0,
                  width: '4px',
                  borderRadius: '2px',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
                },
              }}
            >
              {codebooks.map((cb, index) => (
                <Tab 
                  key={cb.id} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <ListItemText 
                        primary={cb.name} 
                        primaryTypographyProps={{ 
                          fontWeight: 600, 
                          color: validSelectedCodebook === index ? 'text.primary' : 'text.secondary'
                        }} 
                      />
                      {cb.isAIGenerated && (
                        <Chip label="AI" size="small" color="secondary" sx={{ ml: 1, height: '20px', fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  }
                  sx={{ 
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    p: 1.5,
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                />
              ))}
            </Tabs>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <GlowButton
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<CodeIcon />}
                onClick={handleGenerateAICodes}
              >
                Generate AI Codes
              </GlowButton>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                startIcon={<GroupWorkIcon />}
                onClick={handleCreateSubGroup}
              >
                Create Sub-Group
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
            </Box>
          </FrostedGlassPaper>
        )}

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
          <FrostedGlassPaper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search codes or assignments..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '12px',
                      backgroundColor: alpha(theme.palette.background.default, 0.5)
                    }
                  }}
                />
              </Grid>
              {isMobile && (
                <Grid item xs={12}>
                  <Tabs
                    variant="scrollable"
                    allowScrollButtonsMobile
                    value={validSelectedCodebook}
                    onChange={(e, newValue) => setSelectedCodebook(newValue)}
                    aria-label="Codebook tabs"
                  >
                    {codebooks.map(cb => <Tab key={cb.id} label={cb.name} />)}
                  </Tabs>
                </Grid>
              )}
            </Grid>
          </FrostedGlassPaper>

          <Box sx={{ overflowY: 'auto', flexGrow: 1, p: isMobile ? 0 : 1 }}>
            {(codebooks[validSelectedCodebook]?.codes || [])
              .filter(code => 
                code.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                codeAssignments.some(a => a.code_name === code.name && 
                  (
                    (a.document_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (a.text_snapshot || '').toLowerCase().includes(searchQuery.toLowerCase())
                  )
                )
              )
              .map(code => {
                const assignmentsForCode = codeAssignments.filter(a => a.code_name === code.name);
                const isExpanded = expandedCode === code.id;

                return (
                  <Paper 
                    key={code.id} 
                    elevation={2} 
                    sx={{ 
                      mb: 2, 
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      background: alpha(theme.palette.background.paper, 0.8)
                    }}
                  >
                    <Box 
                      onClick={() => handleRowClick(code.id)}
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox
                          checked={selectedCodesForGrouping.includes(code.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCodeSelectionForGrouping(code.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={code.name}
                              sx={{
                                backgroundColor: alpha(code.color || getRandomColor(code.name), 0.2),
                                color: code.color || getRandomColor(code.name),
                                fontWeight: 'bold',
                                border: code.is_auto_generated ? `1px dashed ${code.color || getRandomColor(code.name)}` : 'none'
                              }}
                            />
                            {code.is_auto_generated && <Chip label="AI" size="small" color="secondary" />}
                            <Typography variant="body2" color="text.secondary">{code.group_name}</Typography>
                          </Box>
                          {code.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 400 }}>
                              {truncateText(code.description, 100)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge badgeContent={assignmentsForCode.length} color="primary" />
                        <Tooltip title="Delete entire code and all its assignments">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteCode(code.id, code.name); }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small">
                          <ExpandMoreIcon sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        {assignmentsForCode.length > 0 ? (
                          <AssignmentsTable assignments={assignmentsForCode} codeInfo={code} />
                        ) : (
                          <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                            No assignments for this code yet.
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                );
            })}
          </Box>
        </Box>
      </Box>

      {/* Sub-group creation dialog */}
      <Dialog open={subGroupDialogOpen} onClose={() => setSubGroupDialogOpen(false)}>
        <DialogTitle sx={{ 
          fontWeight: 600,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupWorkIcon color="primary" />
            Create Sub-Group
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a sub-group for {selectedCodesForGrouping.length} selected code{selectedCodesForGrouping.length !== 1 ? 's' : ''}:
          </Typography>
          
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: alpha(theme.palette.primary.main, 0.03), borderRadius: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            {selectedCodesForGrouping.map(codeId => {
              const code = codes.find(c => c.id === codeId);
              return code ? (
                <Chip
                  key={codeId}
                  label={code.name}
                  size="small"
                  sx={{
                    m: 0.25,
                    backgroundColor: alpha(code.color || getRandomColor(code.name), 0.15),
                    color: code.color || getRandomColor(code.name),
                  }}
                />
              ) : null;
            })}
          </Box>

          <TextField
            autoFocus
            fullWidth
            label="Sub-Group Name"
            value={newSubGroupName}
            onChange={(e) => setNewSubGroupName(e.target.value)}
            placeholder="Enter a name for the sub-group..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => {
              setSubGroupDialogOpen(false);
              setNewSubGroupName('');
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubGroupSubmit}
            variant="contained"
            startIcon={<GroupWorkIcon />}
            disabled={!newSubGroupName.trim()}
          >
            Create Sub-Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Codebook;