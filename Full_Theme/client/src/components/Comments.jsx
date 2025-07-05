import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Zoom,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  AppBar,
  Toolbar,
  Drawer,
  Collapse,
  Skeleton,
  Slide,
  Stack,
  AvatarGroup
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import ChatIcon from '@mui/icons-material/Chat';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TimelineIcon from '@mui/icons-material/Timeline';
import PersonIcon from '@mui/icons-material/Person';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ReplyIcon from '@mui/icons-material/Reply';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { FrostedGlassPaper, GlowButton } from './StyledComponents';

function Comments({ projectId, annotations = [], loading = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table' or 'timeline'
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  const [localAnnotations, setLocalAnnotations] = useState([]);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [newAnnotation, setNewAnnotation] = useState({
    content: '',
    document_id: '',
    text_snapshot: '',
    start_char: 0,
    end_char: 0
  });
  
  // Update local annotations when props change
  useEffect(() => {
    if (annotations && Array.isArray(annotations)) {
      console.log(`Comments component received ${annotations.length} annotations`);
      setLocalAnnotations(annotations);
    }
  }, [annotations]);

  // Auto-refresh annotations when projectId changes
  useEffect(() => {
    if (projectId) {
      refreshAnnotations();
    }
  }, [projectId]);

  // Function to refresh annotations from API
  const refreshAnnotations = async () => {
    try {
      setError(null);
      const { default: api } = await import('../utils/api');
      const projectData = await api.annotations.getAnnotations(projectId);
      if (projectData && projectData.annotations) {
        console.log(`Refreshed annotations: ${projectData.annotations.length} found`);
        setLocalAnnotations(projectData.annotations);
      }
    } catch (err) {
      console.error('Error refreshing annotations:', err);
      setError('Failed to refresh comments. Please try again.');
    }
  };

  const [selectedComment, setSelectedComment] = useState(null);
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Enhanced filtering and sorting
  const filteredComments = localAnnotations.filter((annotation) => {
    const matchesSearch = 
      annotation.document_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      annotation.text_snapshot?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      annotation.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || annotation.annotation_type === filterBy;
    
    return matchesSearch && matchesFilter;
  });

  const sortedComments = [...filteredComments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'document':
        return (a.document_name || '').localeCompare(b.document_name || '');
      case 'author':
        return (a.created_by_email || '').localeCompare(b.created_by_email || '');
      case 'recent':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Get unique documents and authors for stats
  const uniqueDocuments = [...new Set(localAnnotations.map(a => a.document_name).filter(Boolean))];
  const uniqueAuthors = [...new Set(localAnnotations.map(a => a.created_by_email).filter(Boolean))];

  // Menu handlers
  const handleSortMenuOpen = (event) => setSortMenuAnchor(event.currentTarget);
  const handleFilterMenuOpen = (event) => setFilterMenuAnchor(event.currentTarget);
  const handleMoreMenuOpen = (event, commentId) => {
    setMoreMenuAnchor(event.currentTarget);
    setSelectedCommentId(commentId);
  };

  const toggleViewMode = () => {
    const modes = ['cards', 'table', 'timeline'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  const toggleCardExpansion = (commentId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };
  
  // Create a new annotation
  const handleCreateAnnotation = async () => {
    try {
      const { default: api } = await import('../utils/api');
      
      // Create the annotation
      const annotationData = {
        ...newAnnotation,
        project_id: parseInt(projectId),
        annotation_type: 'MEMO'
      };
      
      await api.annotations.createAnnotation(annotationData);
      
      // Refresh annotations immediately
      await refreshAnnotations();
      
      // Reset form and close dialog
      setNewAnnotation({
        content: '',
        document_id: '',
        text_snapshot: '',
        start_char: 0,
        end_char: 0
      });
      setShowAddDialog(false);
    } catch (err) {
      console.error('Error creating annotation:', err);
      alert('Failed to create annotation. Please try again.');
    }
  };
  
  // Delete an annotation
  const handleDeleteAnnotation = async (annotationId) => {
    if (window.confirm('Are you sure you want to delete this annotation?')) {
      try {
        const { default: api } = await import('../utils/api');
        await api.annotations.deleteAnnotation(annotationId);
        
        // Refresh annotations immediately to show updated list
        await refreshAnnotations();
      } catch (err) {
        console.error('Error deleting annotation:', err);
        alert('Failed to delete annotation. Please try again.');
      }
    }
  };
  
  // Function to format timestamp to a more readable format
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Function to truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Get random user initials for avatar
  const getUserInitials = (comment) => {
    // Use document name as a base for deterministic initials
    const name = comment.document_name || "User";
    return name.charAt(0).toUpperCase();
  };

  // Enhanced Comment Card Component
  const CommentCard = ({ comment, isExpanded, onToggleExpand }) => (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: theme.shape.borderRadius * 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                width: 40,
                height: 40,
                fontWeight: 600,
              }}
            >
              {getUserInitials(comment)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {comment.document_name || "Untitled Document"}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(comment.created_at) || "No date"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  by {comment.created_by_email || "Unknown user"}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label="Comment" 
              size="small"
              icon={<ChatIcon sx={{ fontSize: '14px !important' }} />}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                height: 28,
                fontWeight: 500,
                '& .MuiChip-icon': { 
                  color: theme.palette.primary.main,
                }
              }}
            />
            <IconButton 
              size="small"
              onClick={(e) => handleMoreMenuOpen(e, comment.id)}
              sx={{ 
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {/* Quote Section */}
        {comment.text_snapshot && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              mb: 2, 
              bgcolor: alpha(theme.palette.info.main, 0.08),
              borderLeft: `4px solid ${theme.palette.info.main}`,
              borderRadius: theme.shape.borderRadius * 1.5,
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <FormatQuoteIcon 
                sx={{ 
                  fontSize: 20, 
                  color: theme.palette.info.main,
                  opacity: 0.7,
                  mt: 0.2,
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  color: theme.palette.text.primary,
                }}
              >
                {isExpanded ? comment.text_snapshot : truncateText(comment.text_snapshot, 120)}
              </Typography>
            </Box>
          </Paper>
        )}
        
        {/* Comment Content */}
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2,
            lineHeight: 1.6,
            color: theme.palette.text.primary,
          }}
        >
          {isExpanded ? comment.content : truncateText(comment.content || "No comment text", 150)}
        </Typography>

        {/* Actions and Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ThumbUpIcon />}
              sx={{ 
                color: theme.palette.text.secondary,
                minWidth: 'auto',
                px: 1.5,
                borderRadius: theme.shape.borderRadius * 1.5,
              }}
            >
              Like
            </Button>
            <Button
              size="small"
              startIcon={<ReplyIcon />}
              sx={{ 
                color: theme.palette.text.secondary,
                minWidth: 'auto',
                px: 1.5,
                borderRadius: theme.shape.borderRadius * 1.5,
              }}
            >
              Reply
            </Button>
            {(comment.text_snapshot?.length > 120 || comment.content?.length > 150) && (
              <Button
                size="small"
                onClick={() => onToggleExpand(comment.id)}
                endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ 
                  color: theme.palette.primary.main,
                  minWidth: 'auto',
                  px: 1.5,
                  borderRadius: theme.shape.borderRadius * 1.5,
                }}
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit comment">
              <IconButton 
                size="small"
                onClick={() => {
                  setEditingAnnotation(comment);
                  setNewAnnotation({
                    content: comment.content || '',
                    document_id: comment.document_id,
                    text_snapshot: comment.text_snapshot || '',
                    start_char: comment.start_char || 0,
                    end_char: comment.end_char || 0
                  });
                  setShowAddDialog(true);
                }}
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.primary.main }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete comment">
              <IconButton 
                size="small" 
                onClick={() => handleDeleteAnnotation(comment.id)}
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.error.main }
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Timeline View Component
  const TimelineView = ({ comments }) => (
    <Box sx={{ position: 'relative', pl: 4 }}>
      {/* Timeline Line */}
      <Box
        sx={{
          position: 'absolute',
          left: 20,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.3),
          borderRadius: 1,
        }}
      />
      
      {comments.map((comment, index) => (
        <Box key={comment.id} sx={{ position: 'relative', mb: 3 }}>
          {/* Timeline Dot */}
          <Avatar
            sx={{
              position: 'absolute',
              left: -24,
              top: 16,
              width: 32,
              height: 32,
              bgcolor: theme.palette.primary.main,
              color: 'white',
              fontSize: '0.75rem',
              zIndex: 1,
            }}
          >
            {index + 1}
          </Avatar>
          
          <CommentCard 
            comment={comment} 
            isExpanded={expandedCards.has(comment.id)}
            onToggleExpand={toggleCardExpansion}
          />
        </Box>
      ))}
    </Box>
  );
  
  // Edit function
  const handleEditAnnotation = async () => {
    if (!editingAnnotation) return;
    
    try {
      const { default: api } = await import('../utils/api');
      
      await api.annotations.updateAnnotation(editingAnnotation.id, {
        content: newAnnotation.content,
        text_snapshot: newAnnotation.text_snapshot
      });
      
      // Refresh annotations immediately
      await refreshAnnotations();
      
      // Reset form and close dialog
      setEditingAnnotation(null);
      setShowAddDialog(false);
      setNewAnnotation({
        content: '',
        document_id: '',
        text_snapshot: '',
        start_char: 0,
        end_char: 0
      });
    } catch (err) {
      console.error('Error updating annotation:', err);
      alert('Failed to update annotation. Please try again.');
    }
  };
  
  // Handle dialog save
  const handleSaveAnnotation = () => {
    if (editingAnnotation) {
      handleEditAnnotation();
    } else {
      handleCreateAnnotation();
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              Comments
            </Typography>
            <Badge badgeContent={localAnnotations.length} color="primary" max={99}>
              <ChatIcon />
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
            width: 300,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Options & Filters
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Mobile View Mode */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              View Mode
            </Typography>
            <Stack direction="column" spacing={1}>
              {['cards', 'table', 'timeline'].map((mode) => (
                <Button
                  key={mode}
                  fullWidth
                  variant={viewMode === mode ? 'contained' : 'outlined'}
                  onClick={() => setViewMode(mode)}
                  startIcon={
                    mode === 'cards' ? <ViewModuleIcon /> : 
                    mode === 'table' ? <ViewListIcon /> : 
                    <TimelineIcon />
                  }
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} View
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Mobile Sort Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Sort By
            </Typography>
            <Stack direction="column" spacing={1}>
              {[
                { value: 'recent', label: 'Most Recent' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'document', label: 'By Document' },
                { value: 'author', label: 'By Author' }
              ].map((option) => (
                <Button
                  key={option.value}
                  fullWidth
                  variant={sortBy === option.value ? 'contained' : 'outlined'}
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Mobile Stats */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Project Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <Typography variant="h6" color="primary">{localAnnotations.length}</Typography>
                  <Typography variant="caption">Comments</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                  <Typography variant="h6" color="secondary">{uniqueDocuments.length}</Typography>
                  <Typography variant="caption">Documents</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Drawer>

      {/* Desktop Header */}
      {!isMobile && (
        <Fade in={true} style={{ transitionDelay: '100ms' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1,
                }}
              >
                Comments & Annotations
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                View and manage all comments and annotations in your research documents
              </Typography>
              
              {/* Stats Chips */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip 
                  label={`${localAnnotations.length} Comments`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  icon={<ChatIcon />}
                />
                <Chip 
                  label={`${uniqueDocuments.length} Documents`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                  icon={<ArticleIcon />}
                />
                <Chip 
                  label={`${uniqueAuthors.length} Authors`}
                  color="info"
                  variant="outlined"
                  size="small"
                  icon={<PersonIcon />}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search comments, documents, or authors..."
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
                  }
                }}
                sx={{ minWidth: '300px' }}
              />
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Sort options">
                  <IconButton 
                    onClick={handleSortMenuOpen}
                    sx={{
                      borderRadius: theme.shape.borderRadius,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.05)
                        : alpha(theme.palette.common.black, 0.02),
                    }}
                  >
                    <SortIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Filter options">
                  <IconButton 
                    onClick={handleFilterMenuOpen}
                    sx={{
                      borderRadius: theme.shape.borderRadius,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.05)
                        : alpha(theme.palette.common.black, 0.02),
                    }}
                  >
                    <TuneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Change view">
                  <IconButton 
                    onClick={toggleViewMode}
                    sx={{
                      borderRadius: theme.shape.borderRadius,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.05)
                        : alpha(theme.palette.common.black, 0.02),
                    }}
                  >
                    {viewMode === 'cards' ? <ViewListIcon fontSize="small" /> : 
                     viewMode === 'table' ? <TimelineIcon fontSize="small" /> :
                     <ViewModuleIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refresh comments">
                  <IconButton
                    onClick={refreshAnnotations}
                    sx={{
                      borderRadius: theme.shape.borderRadius,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.05)
                        : alpha(theme.palette.common.black, 0.02),
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <GlowButton
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddDialog(true)}
                  sx={{ borderRadius: theme.shape.borderRadius * 1.5 }}
                >
                  Add Comment
                </GlowButton>
              </Box>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Mobile Search Bar */}
      {isMobile && (
        <Box sx={{ mb: 2, px: 2 }}>
          <TextField
            fullWidth
            placeholder="Search comments..."
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
              }
            }}
          />
        </Box>
      )}

      {/* Quick Actions for Mobile */}
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, px: 2 }}>
          <GlowButton
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
            sx={{ borderRadius: theme.shape.borderRadius * 2 }}
          >
            Add New Comment
          </GlowButton>
        </Box>
      )}
      {/* Sort and Filter Menus */}
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
        {[
          { value: 'recent', label: 'Most Recent', icon: <TimelineIcon /> },
          { value: 'oldest', label: 'Oldest First', icon: <TimelineIcon /> },
          { value: 'document', label: 'By Document', icon: <ArticleIcon /> },
          { value: 'author', label: 'By Author', icon: <PersonIcon /> }
        ].map((option) => (
          <MenuItem 
            key={option.value}
            onClick={() => { setSortBy(option.value); setSortMenuAnchor(null); }}
            selected={sortBy === option.value}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          }
        }}
      >
        <MenuItem onClick={() => { setFilterBy('all'); setFilterMenuAnchor(null); }}>
          <ListItemText primary="All Comments" />
        </MenuItem>
        <MenuItem onClick={() => { setFilterBy('MEMO'); setFilterMenuAnchor(null); }}>
          <ListItemText primary="Memos Only" />
        </MenuItem>
        <MenuItem onClick={() => { setFilterBy('NOTE'); setFilterMenuAnchor(null); }}>
          <ListItemText primary="Notes Only" />
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          }
        }}
      >
        <MenuItem onClick={() => {
          const comment = localAnnotations.find(c => c.id === selectedCommentId);
          if (comment) {
            setEditingAnnotation(comment);
            setNewAnnotation({
              content: comment.content || '',
              document_id: comment.document_id,
              text_snapshot: comment.text_snapshot || '',
              start_char: comment.start_char || 0,
              end_char: comment.end_char || 0
            });
            setShowAddDialog(true);
          }
          setMoreMenuAnchor(null);
        }}>
          <ListItemIcon><EditIcon /></ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedCommentId) {
            handleDeleteAnnotation(selectedCommentId);
          }
          setMoreMenuAnchor(null);
        }}>
          <ListItemIcon><DeleteOutlineIcon color="error" /></ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><ShareIcon /></ListItemIcon>
          <ListItemText primary="Share" />
        </MenuItem>
      </Menu>

      {/* Content Area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : error ? (
        <Zoom in={true}>
          <FrostedGlassPaper sx={{ p: 4, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
              <CloseIcon />
            </Avatar>
            <Typography variant="h6" color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={refreshAnnotations} 
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </FrostedGlassPaper>
        </Zoom>
      ) : sortedComments.length === 0 ? (
        <Zoom in={true} style={{ transitionDelay: '300ms' }}>
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
              <ChatBubbleOutlineIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {searchQuery || filterBy !== 'all' ? 'No Matching Comments' : 'No Comments Yet'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3, lineHeight: 1.6 }}>
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'You haven\'t added any comments or annotations to your documents. Select text in a document and click the Comment button to add your first annotation.'
              }
            </Typography>
            {!searchQuery && filterBy === 'all' && (
              <GlowButton
                variant="contained"
                startIcon={<ChatIcon />}
                size="large"
                onClick={() => setShowAddDialog(true)}
                sx={{ borderRadius: theme.shape.borderRadius * 2 }}
              >
                Add First Comment
              </GlowButton>
            )}
          </FrostedGlassPaper>
        </Zoom>
      ) : (
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <Box sx={{ flexGrow: 1 }}>
            {/* View Mode Toggle for Mobile */}
            {isMobile && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                  onClick={toggleViewMode}
                  startIcon={
                    viewMode === 'cards' ? <ViewModuleIcon /> : 
                    viewMode === 'table' ? <ViewListIcon /> : 
                    <TimelineIcon />
                  }
                  size="small"
                  sx={{ borderRadius: theme.shape.borderRadius * 2 }}
                >
                  {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
                </Button>
              </Box>
            )}

            {/* Content based on view mode */}
            {viewMode === 'timeline' ? (
              <TimelineView comments={sortedComments} />
            ) : viewMode === 'table' ? (
              <FrostedGlassPaper sx={{ overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Author</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Comment</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedComments.map((comment) => (
                        <TableRow key={comment.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                {getUserInitials(comment)}
                              </Avatar>
                              <Typography variant="body2">
                                {comment.created_by_email || "Unknown"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{comment.document_name || "Untitled"}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {truncateText(comment.content || "No content", 80)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(comment.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </FrostedGlassPaper>
            ) : (
              /* Cards View */
              <Box sx={{ 
                overflow: 'auto',
                maxHeight: 'calc(100vh - 300px)',
                px: isMobile ? 2 : 0,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.1)
                    : alpha(theme.palette.common.black, 0.05),
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.2)
                    : alpha(theme.palette.common.black, 0.2),
                  borderRadius: '4px',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.3)
                      : alpha(theme.palette.common.black, 0.3),
                  },
                },
              }}>
                <Grid container spacing={isMobile ? 0 : 3}>
                  {sortedComments.map((comment) => (
                    <Grid item xs={12} md={6} xl={4} key={comment.id}>
                      <CommentCard 
                        comment={comment} 
                        isExpanded={expandedCards.has(comment.id)}
                        onToggleExpand={toggleCardExpansion}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </Fade>
      )}
      
      {/* Enhanced Dialog for adding or editing annotations */}
      <Dialog 
        open={showAddDialog} 
        onClose={() => setShowAddDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.shape.borderRadius * 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          }
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            {editingAnnotation ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingAnnotation ? 'Edit Annotation' : 'Add New Annotation'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {editingAnnotation ? 'Update your comment or selected text' : 'Create a new comment for your research'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {!editingAnnotation && (
              <TextField
                select
                label="Select Document"
                fullWidth
                value={newAnnotation.document_id}
                onChange={(e) => setNewAnnotation(prev => ({ ...prev, document_id: e.target.value }))}
                SelectProps={{ native: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: theme.shape.borderRadius * 1.5,
                  }
                }}
              >
                <option value="">Choose a document...</option>
                {annotations
                  .map(a => ({ id: a.document_id, name: a.document_name }))
                  .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // Remove duplicates
                  .map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))
                }
              </TextField>
            )}
            
            <TextField
              label="Selected Text"
              fullWidth
              multiline
              rows={3}
              value={newAnnotation.text_snapshot}
              onChange={(e) => setNewAnnotation(prev => ({ ...prev, text_snapshot: e.target.value }))}
              placeholder="Paste or type the text you want to comment on..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: theme.shape.borderRadius * 1.5,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                }
              }}
            />
            
            <TextField
              label="Your Comment"
              fullWidth
              multiline
              rows={4}
              value={newAnnotation.content}
              onChange={(e) => setNewAnnotation(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your thoughts, analysis, or insights..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: theme.shape.borderRadius * 1.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                }
              }}
            />

            {/* Preview Section */}
            {(newAnnotation.content || newAnnotation.text_snapshot) && (
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  borderRadius: theme.shape.borderRadius * 1.5,
                }}
              >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                  Preview
                </Typography>
                {newAnnotation.text_snapshot && (
                  <Paper 
                    sx={{ 
                      p: 1.5, 
                      mb: 1, 
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      borderRadius: theme.shape.borderRadius,
                    }}
                  >
                    <Typography variant="body2" fontStyle="italic">
                      "{newAnnotation.text_snapshot}"
                    </Typography>
                  </Paper>
                )}
                {newAnnotation.content && (
                  <Typography variant="body2">
                    {newAnnotation.content}
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => {
              setShowAddDialog(false);
              setEditingAnnotation(null);
              setNewAnnotation({
                content: '',
                document_id: '',
                text_snapshot: '',
                start_char: 0,
                end_char: 0
              });
            }}
            sx={{ borderRadius: theme.shape.borderRadius * 1.5 }}
          >
            Cancel
          </Button>
          <GlowButton 
            variant="contained" 
            onClick={handleSaveAnnotation}
            disabled={!newAnnotation.content || (!editingAnnotation && !newAnnotation.document_id)}
            sx={{ borderRadius: theme.shape.borderRadius * 1.5 }}
          >
            {editingAnnotation ? 'Update Comment' : 'Create Comment'}
          </GlowButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Comments;