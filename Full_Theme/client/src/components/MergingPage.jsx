import React, { useState, useMemo, useEffect } from 'react';
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
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Badge,
  Divider,
  alpha,
  Card,
  CardContent,
  Grid,
  Collapse,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import BookIcon from '@mui/icons-material/Book';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SaveIcon from '@mui/icons-material/Save';
import { apiRequest } from '../utils/api';
import { EnhancedTableRow, GlowButton, FrostedGlassPaper } from './StyledComponents';
import { codesApi } from '../utils/api';

const MergingPage = ({ projectId, codes = [], codeAssignments = [], documents = [], codebooks = [], refreshProjectData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Extract codes and organize them by type
  const manualCodes = useMemo(() => {
    if (!codes || !codebooks) return [];
    const manualCodebookIds = codebooks.filter(cb => !cb.is_ai_generated).map(cb => cb.id);
    return codes.filter(code => manualCodebookIds.includes(code.codebook_id));
  }, [codes, codebooks]);

  const aiCodes = useMemo(() => {
    if (!codes || !codebooks) return [];
    const aiCodebookIds = codebooks.filter(cb => cb.is_ai_generated).map(cb => cb.id);
    return codes.filter(code => aiCodebookIds.includes(code.codebook_id));
  }, [codes, codebooks]);

  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [deletedCodes, setDeletedCodes] = useState(new Set()); // Track deleted codes by assignment ID and type
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to get document name
  const getDocName = useMemo(() => (assignment) => {
    return assignment.document_name || '';
  }, []);
  
  // Helper function to get code names and colors
  const getCodeData = useMemo(() => (assignment) => {
    const assignedCode = codes.find(c => c.id === assignment.code_id);
    const isAICode = assignedCode && aiCodes.some(ac => ac.id === assignedCode.id);
    const isManualCode = assignedCode && manualCodes.some(mc => mc.id === assignedCode.id);
    
    // Check if codes are deleted
    const isManualDeleted = deletedCodes.has(`${assignment.id}_manual`);
    const isAIDeleted = deletedCodes.has(`${assignment.id}_ai`);
    
    return {
      manual: {
        name: isManualCode ? assignedCode.name : '',
        color: isManualCode ? 
          (isManualDeleted ? theme.palette.error.main : theme.palette.success.main) : 
          theme.palette.grey[300],
        deleted: isManualDeleted
      },
      ai: {
        name: isAICode ? assignedCode.name : '',
        color: isAICode ? 
          (isAIDeleted ? theme.palette.error.main : theme.palette.success.main) : 
          theme.palette.grey[300],
        deleted: isAIDeleted
      }
    };
  }, [codes, manualCodes, aiCodes, theme.palette.grey, theme.palette.success, theme.palette.error, deletedCodes]);

  // Handle code deletion
  const handleCodeDelete = (assignmentId, codeType) => {
    const key = `${assignmentId}_${codeType}`;
    setDeletedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Handle save and bulk upload
  const handleSaveAndUpload = async () => {
    setIsSaving(true);
    try {
      // Prepare data for bulk upload
      const bulkData = codeAssignments.map(assignment => ({
        assignment_id: assignment.id,
        manual_code_deleted: deletedCodes.has(`${assignment.id}_manual`),
        ai_code_deleted: deletedCodes.has(`${assignment.id}_ai`)
      }));

      // Call the bulk upload API
      await apiRequest('/assignment/bulk-upload', {
        method: 'POST',
        body: JSON.stringify({ assignments: bulkData })
      });
      
      // Switch to compare tab after successful save
      setActiveTab(1);
      
      // Clear deleted codes state
      setDeletedCodes(new Set());
      
    } catch (error) {
      console.error('Error saving assignments:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false);
    }
  };

  // Filter assignments based on search query and selected codes
  const filteredAssignments = useMemo(() => {
    return codeAssignments.filter((assignment) => {
      const searchLower = searchQuery.toLowerCase();
      
      const documentName = assignment.document_name || '';
      
      // Get the manual code details
      const assignedCode = codes.find(c => c.id === assignment.code_id);
      const manualCodeName = manualCodes.some(mc => mc.id === assignment.code_id) ? assignedCode?.name || '' : '';
      
      // Get the AI code suggestion details  
      const aiCodeName = aiCodes.some(ac => ac.id === assignment.code_id) ? assignedCode?.name || '' : '';
      
      // Search across all relevant fields
      const matchesSearch = searchLower === '' || [
        documentName,
        assignment.text_snapshot || '',
        manualCodeName,
        aiCodeName,
        assignment.ai_suggestion || ''
      ].some(text => text.toLowerCase().includes(searchLower));
      
      // Filter by selected codes if any are selected
      const matchesSelectedCodes = selectedCodes.length === 0 || 
        selectedCodes.some(codeId => assignment.code_id === codeId);
      
      return matchesSearch && matchesSelectedCodes;
    });
  }, [codeAssignments, documents, manualCodes, aiCodes, searchQuery, selectedCodes]);

  // Filter for Compare tab - only show accepted (green) codes
  const filteredCompareAssignments = useMemo(() => {
    return filteredAssignments.filter((assignment) => {
      // Check if either manual or AI code is not deleted (i.e., accepted/green)
      const isManualDeleted = deletedCodes.has(`${assignment.id}_manual`);
      const isAIDeleted = deletedCodes.has(`${assignment.id}_ai`);
      
      // Show assignment if at least one code is accepted (not deleted)
      return !isManualDeleted || !isAIDeleted;
    });
  }, [filteredAssignments, deletedCodes]);

  // Sort assignments based on selected sort option
  const sortedData = useMemo(() => {
    // Use different data source based on active tab
    const dataToSort = activeTab === 1 ? filteredCompareAssignments : filteredAssignments;
    
    return [...dataToSort].sort((a, b) => {
      switch (sortBy) {
        case 'document':
          return getDocName(a).localeCompare(getDocName(b));
        case 'text':
          return (a.text_snapshot || '').localeCompare(b.text_snapshot || '');
        case 'manual-code':
          return getCodeData(a).manual.name.localeCompare(getCodeData(b).manual.name);
        case 'ai-code':
          return getCodeData(a).ai.name.localeCompare(getCodeData(b).ai.name);
        case 'similarity-high':
          return (b.similarity || 0) - (a.similarity || 0);
        case 'similarity-low':
          return (a.similarity || 0) - (b.similarity || 0);
        case 'recent':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  }, [filteredAssignments, filteredCompareAssignments, activeTab, documents, manualCodes, aiCodes, sortBy, getDocName, getCodeData]);

  // Handle row expansion
  const handleRowClick = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle filter menu
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  // Handle sort menu
  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  // Text truncation helper
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Row rendering
  const renderTableRow = (assignment) => {
    const isExpanded = expandedRows[assignment.id];
    const documentName = getDocName(assignment);
    const codes = getCodeData(assignment);
    const similarity = assignment.similarity || 0;
    
    return (
      <React.Fragment key={assignment.id}>
        <TableRow
          hover
          onClick={() => handleRowClick(assignment.id)}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          <TableCell>
            <Typography variant="body2">{documentName}</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2">{truncateText(assignment.text_snapshot, 100)}</Typography>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={codes.manual.name}
                sx={{
                  backgroundColor: codes.manual.color,
                  color: theme.palette.getContrastText(codes.manual.color),
                  '& .MuiChip-label': { fontWeight: 500 },
                  textDecoration: codes.manual.deleted ? 'line-through' : 'none'
                }}
              />
              {codes.manual.name && (
                <Tooltip title={codes.manual.deleted ? "Restore Manual Code" : "Delete Manual Code"}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCodeDelete(assignment.id, 'manual');
                    }}
                    sx={{
                      color: codes.manual.deleted ? theme.palette.success.main : theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: codes.manual.deleted ? 
                          alpha(theme.palette.success.main, 0.1) : 
                          alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={codes.ai.name}
                sx={{
                  backgroundColor: alpha(codes.ai.color, 0.8),
                  color: theme.palette.getContrastText(codes.ai.color),
                  '& .MuiChip-label': { fontWeight: 500 },
                  textDecoration: codes.ai.deleted ? 'line-through' : 'none'
                }}
              />
              {codes.ai.name && (
                <Tooltip title={codes.ai.deleted ? "Restore AI Code" : "Delete AI Code"}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCodeDelete(assignment.id, 'ai');
                    }}
                    sx={{
                      color: codes.ai.deleted ? theme.palette.success.main : theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: codes.ai.deleted ? 
                          alpha(theme.palette.success.main, 0.1) : 
                          alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </TableCell>
          <TableCell>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                // TODO: Add edit functionality
              }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ m: 1 }}>
                {/* Compact Quote and Code Comparison */}
                <Card variant="outlined" sx={{ 
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    {/* Quote Section */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
                        Complete Quote
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        lineHeight: 1.4, 
                        fontStyle: 'italic',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        p: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        borderRadius: 0.5,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}>
                        "{assignment.text_snapshot || 'No text available'}"
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Document: {documentName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(assignment.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Code Comparison - Inline */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Manual:
                        </Typography>
                        <Chip
                          size="small"
                          label={codes.manual.name || 'No manual code'}
                          sx={{
                            backgroundColor: codes.manual.color,
                            color: theme.palette.getContrastText(codes.manual.color),
                            height: 24,
                            '& .MuiChip-label': { fontWeight: 500, fontSize: '0.75rem' },
                            textDecoration: codes.manual.deleted ? 'line-through' : 'none'
                          }}
                        />
                        {codes.manual.name && (
                          <Tooltip title={codes.manual.deleted ? "Restore Manual Code" : "Delete Manual Code"}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCodeDelete(assignment.id, 'manual');
                              }}
                              sx={{
                                color: codes.manual.deleted ? theme.palette.success.main : theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: codes.manual.deleted ? 
                                    alpha(theme.palette.success.main, 0.1) : 
                                    alpha(theme.palette.error.main, 0.1)
                                }
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          AI:
                        </Typography>
                        <Chip
                          size="small"
                          label={codes.ai.name || 'No AI code'}
                          sx={{
                            backgroundColor: alpha(codes.ai.color, 0.8),
                            color: theme.palette.getContrastText(codes.ai.color),
                            height: 24,
                            '& .MuiChip-label': { fontWeight: 500, fontSize: '0.75rem' },
                            textDecoration: codes.ai.deleted ? 'line-through' : 'none'
                          }}
                        />
                        {codes.ai.name && (
                          <Tooltip title={codes.ai.deleted ? "Restore AI Code" : "Delete AI Code"}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCodeDelete(assignment.id, 'ai');
                              }}
                              sx={{
                                color: codes.ai.deleted ? theme.palette.success.main : theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: codes.ai.deleted ? 
                                    alpha(theme.palette.success.main, 0.1) : 
                                    alpha(theme.palette.error.main, 0.1)
                                }
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Similarity:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {Math.round(similarity * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };

  // Filter menu options
  const filterOptions = [
    { id: 'clear', label: 'Clear Filters', icon: <CancelIcon /> },
    ...manualCodes.map(code => ({
      id: code.id,
      label: code.name,
      color: code.color,
      isManual: true,
    })),
    ...aiCodes.map(code => ({
      id: code.id,
      label: code.name,
      color: code.color,
      isAI: true,
    }))
  ];

  // Sort menu options
  const sortOptions = [
    { id: 'recent', label: 'Most Recent', icon: <AutorenewIcon /> },
    { id: 'document', label: 'Document Name', icon: <BookIcon /> },
    { id: 'text', label: 'Text Content', icon: <TuneIcon /> },
    { id: 'manual-code', label: 'Manual Code', icon: <EditIcon /> },
    { id: 'ai-code', label: 'AI Code', icon: <CompareArrowsIcon /> },
    { id: 'similarity-high', label: 'Highest Similarity', icon: <ArrowForwardIcon /> },
    { id: 'similarity-low', label: 'Lowest Similarity', icon: <ArrowBackIcon /> }
  ];

  // Handle filter selection
  const handleFilterSelect = (codeId) => {
    if (codeId === 'clear') {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(prev => {
        const isSelected = prev.includes(codeId);
        if (isSelected) {
          return prev.filter(id => id !== codeId);
        } else {
          return [...prev, codeId];
        }
      });
    }
    setFilterMenuAnchor(null);
  };

  // Handle sort selection
  const handleSortSelect = (sortOption) => {
    setSortBy(sortOption);
    setSortMenuAnchor(null);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      minHeight: '500px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <Fade in={true} style={{ transitionDelay: '100ms' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: '200px' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5,
                fontSize: '1.75rem',
                lineHeight: 1.2,
              }}
            >
              Code Merging
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.875rem' }}>
              Compare and merge coding decisions between different coders
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label={`${sortedData.length} ${activeTab === 1 ? 'Accepted' : 'Entries'}`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ height: '22px', fontSize: '0.7rem' }}
              />
              <Chip 
                label="2 Coders"
                color="secondary"
                variant="outlined"
                size="small"
                sx={{ height: '22px', fontSize: '0.7rem' }}
              />
              <Chip 
                label={activeTab === 1 ? "Accepted Codes" : "Similarity Analysis"}
                color="primary"
                variant="filled"
                size="small"
                sx={{ height: '22px', fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Search..."
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: theme.shape.borderRadius * 2,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.05)
                    : alpha(theme.palette.common.black, 0.02),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.common.white, 0.07)
                      : alpha(theme.palette.common.black, 0.04),
                  },
                  height: '36px',
                }
              }}
              sx={{ width: '280px' }}
            />
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Filter options">
                <IconButton 
                  onClick={handleFilterMenuOpen}
                  size="small"
                  sx={{
                    borderRadius: theme.shape.borderRadius,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.common.white, 0.05)
                      : alpha(theme.palette.common.black, 0.02),
                    width: '36px',
                    height: '36px',
                  }}
                >
                  <TuneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Sort options">
                <IconButton 
                  onClick={handleSortMenuOpen}
                  size="small"
                  sx={{
                    borderRadius: theme.shape.borderRadius,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.common.white, 0.05)
                      : alpha(theme.palette.common.black, 0.02),
                    width: '36px',
                    height: '36px',
                  }}
                >
                  <SortIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Save Button */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveAndUpload}
              disabled={isSaving}
              sx={{
                borderRadius: theme.shape.borderRadius * 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save & Compare'}
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Tabs Section */}
      <Fade in={true} style={{ transitionDelay: '200ms' }}>
        <Box sx={{ mb: 2 }}>
          <Paper 
            elevation={0}
            variant="outlined"
            sx={{ 
              borderRadius: theme.shape.borderRadius * 2,
              overflow: 'hidden',
              borderColor: alpha(theme.palette.divider, 0.5)
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant={isMobile ? "fullWidth" : "standard"}
              indicatorColor="primary"
              textColor="primary"
              sx={{
                minHeight: '48px',
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
                '& .MuiTab-root': {
                  minHeight: '48px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                  py: 1.5,
                },
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon fontSize="small" />
                    <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                      Edit
                    </Typography>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CompareArrowsIcon fontSize="small" />
                    <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                      Compare
                    </Typography>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DoneAllIcon fontSize="small" />
                    <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                      Finalize Codebook
                    </Typography>
                    <Chip 
                      label="New" 
                      size="small" 
                      color="primary" 
                      sx={{ height: 16, fontSize: '0.6rem' }}
                    />
                  </Box>
                } 
              />
            </Tabs>
          </Paper>
        </Box>
      </Fade>

      {/* Menus */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{
          sx: {
            minWidth: 250,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          }
        }}
      >
        <MenuItem disabled>
          <ListItemText primary="Filter by Similarity" />
        </MenuItem>
        <Divider />
        {filterOptions.map(option => (
          <MenuItem 
            key={option.id} 
            onClick={() => handleFilterSelect(option.id)}
            sx={{ 
              color: option.isManual ? theme.palette.success.main : option.isAI ? theme.palette.info.main : 'inherit',
            }}
          >
            <ListItemIcon>
              {option.icon}
            </ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          }
        }}
      >
        {sortOptions.map(option => (
          <MenuItem key={option.id} onClick={() => handleSortSelect(option.id)}>
            <ListItemIcon>
              {option.icon}
            </ListItemIcon>
            <ListItemText primary={option.label} secondary={sortBy === option.id ? 'Selected' : ''} />
          </MenuItem>
        ))}
      </Menu>

      {/* Main Content - Tab Panels */}
      {/* Edit Tab Content */}
      {activeTab === 0 && (
        sortedData.length > 0 ? (
        <TableContainer component={Paper} variant="outlined" sx={{ 
          borderRadius: 0,
          flexGrow: 1, 
          overflow: 'auto',
          maxHeight: 'calc(100vh - 280px)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.common.black, 0.03),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.15)
              : alpha(theme.palette.common.black, 0.15),
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.25)
                : alpha(theme.palette.common.black, 0.25),
            },
          },
        }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Selected Text</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Manual Code</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>AI Code</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((item) => (
                renderTableRow(item)
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <FrostedGlassPaper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: theme.shape.borderRadius * 3,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                mb: 1,
              }}
            >
              <CompareArrowsIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              No Coding Data Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3, lineHeight: 1.6 }}>
              {searchQuery 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'Start coding your documents or upload coded data to begin merging and comparing codes.'
              }
            </Typography>
            <GlowButton
              variant="contained"
              startIcon={<SyncIcon />}
              size="large"
              sx={{ borderRadius: theme.shape.borderRadius * 2 }}
            >
              Generate Sample Data
            </GlowButton>
          </FrostedGlassPaper>
        </Fade>
      )
      )}
      
      {/* Compare Tab Content */}
      {activeTab === 1 && (
        sortedData.length > 0 ? (
        <TableContainer component={Paper} variant="outlined" sx={{ 
          borderRadius: 0,
          flexGrow: 1, 
          overflow: 'auto',
          maxHeight: 'calc(100vh - 280px)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.common.black, 0.03),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.15)
              : alpha(theme.palette.common.black, 0.15),
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.25)
                : alpha(theme.palette.common.black, 0.25),
            },
          },
        }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Selected Text</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Manual Code</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>AI Code</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Similarity</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.id} hover sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}>
                  <TableCell>
                    <Typography variant="body2">{getDocName(item)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{truncateText(item.text_snapshot, 100)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!getCodeData(item).manual.deleted && getCodeData(item).manual.name && (
                        <Chip
                          label={getCodeData(item).manual.name}
                          sx={{
                            backgroundColor: getCodeData(item).manual.color,
                            color: theme.palette.getContrastText(getCodeData(item).manual.color),
                            '& .MuiChip-label': { fontWeight: 500 }
                          }}
                        />
                      )}
                      {getCodeData(item).manual.deleted && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Rejected
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!getCodeData(item).ai.deleted && getCodeData(item).ai.name && (
                        <Chip
                          label={getCodeData(item).ai.name}
                          sx={{
                            backgroundColor: alpha(getCodeData(item).ai.color, 0.8),
                            color: theme.palette.getContrastText(getCodeData(item).ai.color),
                            '& .MuiChip-label': { fontWeight: 500 }
                          }}
                        />
                      )}
                      {getCodeData(item).ai.deleted && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Rejected
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {Math.round((item.similarity || 0) * 100)}%
                      </Typography>
                      <Box
                        sx={{
                          width: 60,
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${Math.round((item.similarity || 0) * 100)}%`,
                            height: '100%',
                            bgcolor: theme.palette.primary.main,
                            borderRadius: 2
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Accept AI suggestion">
                        <IconButton size="small">
                          <CheckCircleIcon fontSize="small" color="success" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject AI suggestion">
                        <IconButton size="small">
                          <CancelIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        ) : (
          <Fade in={true} style={{ transitionDelay: '300ms' }}>
            <FrostedGlassPaper 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
                borderRadius: theme.shape.borderRadius * 3,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  mb: 1,
                }}
              >
                <CompareArrowsIcon sx={{ fontSize: 35, color: theme.palette.info.main }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                No Comparisons Available
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3, lineHeight: 1.6 }}>
                {searchQuery 
                  ? 'Try adjusting your search terms or filters to find comparisons.'
                  : 'Start by adding manual codes and AI suggestions to compare them.'
                }
              </Typography>
            </FrostedGlassPaper>
          </Fade>
        )
      )}
      
      {/* Finalize Codebook Tab Content */}
      {activeTab === 2 && (
        <Fade in={true} style={{ transitionDelay: '100ms' }}>
          <FrostedGlassPaper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: `1px dashed ${alpha(theme.palette.success.main, 0.3)}`,
              borderRadius: theme.shape.borderRadius * 3,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                mb: 1,
              }}
            >
              <DoneAllIcon sx={{ fontSize: 35, color: theme.palette.success.main }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Finalize Your Codebook
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3, lineHeight: 1.6 }}>
              Create the final version of your codebook by merging and refining codes from different coders.
            </Typography>
            <GlowButton
              variant="contained"
              color="success"
              startIcon={<BookIcon />}
              size="large"
              sx={{ borderRadius: theme.shape.borderRadius * 2 }}
            >
              Build Codebook
            </GlowButton>
          </FrostedGlassPaper>
        </Fade>
      )}
    </Box>
  );
};

export default MergingPage;
