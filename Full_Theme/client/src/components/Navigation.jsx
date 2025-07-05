import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  Fade,
  Slide,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  alpha,
  Paper,
  Stack,
  Chip,
  Drawer,
  useMediaQuery,
  AppBar,
  Toolbar,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FolderIcon from '@mui/icons-material/Folder';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ProfileButton from './ProfileButton';
import { ThemeModeContext } from '../App';

function Navigation({ 
  activeMenuItem, 
  handleMenuItemClick, 
  selectedFiles, 
  documents, 
  activeFile, 
  setActiveFile, 
  handleRemoveFile, 
  onDocumentSelect, 
  onNavigationToggle,
  onFileUpload,
  onFileDelete 
}) {
  const theme = useTheme();
  const { toggleColorMode, mode } = useContext(ThemeModeContext);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [documentsExpanded, setDocumentsExpanded] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Media queries for responsive behavior
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Toggle mobile drawer
  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  // Close mobile drawer when menu item is clicked
  const handleMobileMenuItemClick = (itemName) => {
    handleMenuItemClick(itemName);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  // Notify parent component when navigation state changes
  React.useEffect(() => {
    if (onNavigationToggle) {
      onNavigationToggle(isExpanded);
    }
  }, [isExpanded, onNavigationToggle]);

  // Debug log of documents received from props
  useEffect(() => {
    if (documents && Array.isArray(documents)) {
      console.log(`Navigation received ${documents.length} documents:`, documents);
    }
  }, [documents]);

  // File upload handler
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (onFileUpload && files.length > 0) {
      onFileUpload(files);
    }
    // Clear the input value to allow re-uploading the same file
    event.target.value = '';
  };

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PictureAsPdfIcon fontSize="small" />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon fontSize="small" />;
      case 'xlsx':
      case 'xls':
        return <TableChartIcon fontSize="small" />;
      default:
        return <FilePresentIcon fontSize="small" />;
    }
  };

  // Get file type chip color
  const getFileTypeColor = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'error';
      case 'doc':
      case 'docx':
        return 'primary';
      case 'xlsx':
      case 'xls':
        return 'success';
      default:
        return 'default';
    }
  };
  const menuItems = [
    {
      name: 'Documents',
      icon: <DescriptionOutlinedIcon />,
      description: 'Manage research documents'
    },
    {
      name: 'Research details',
      icon: <ScienceOutlinedIcon />,
      description: 'Configure research parameters'
    },
    {
      name: 'Comments',
      icon: <CommentOutlinedIcon />,
      description: 'View document annotations'
    },
    {
      name: 'Codebook',
      icon: <BookOutlinedIcon />,
      description: 'Organize research codes'
    },
    {
      name: 'Merging Page',
      icon: <MergeTypeIcon />,
      description: 'Merge and organize themes'
    },
    {
      name: 'Visualizations',
      icon: <BarChartOutlinedIcon />,
      description: 'Explore thematic analysis visualizations'
    }
  ];

  // Add click handler prevention to stop event propagation
  const handleButtonClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    handleMobileMenuItemClick(item.name);
  };

  // Add event-catching overlay to prevent navigation from disappearing
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  useEffect(() => {
    const handleDragOver = (e) => {
      // Don't prevent default as we want the Files component to handle drops
      // But set our state to show we're being dragged over
      setIsDraggingOver(true);
    };
    
    const handleDragLeave = (e) => {
      setIsDraggingOver(false);
    };
    
    const handleDrop = (e) => {
      // Don't prevent default, let the Documents component handle the drop
      // But reset our state
      setIsDraggingOver(false);
    };

    // Add capture phase event listeners for drag events on the navigation element
    const navElement = document.querySelector('.navigation-wrapper');
    if (navElement) {
      navElement.addEventListener('dragover', handleDragOver, false);
      navElement.addEventListener('dragleave', handleDragLeave, false);
      navElement.addEventListener('drop', handleDrop, false);
    }

    return () => {
      // Remove event listeners on cleanup
      if (navElement) {
        navElement.removeEventListener('dragover', handleDragOver, false);
        navElement.removeEventListener('dragleave', handleDragLeave, false);
        navElement.removeEventListener('drop', handleDrop, false);
      }
    };
  }, []);



  // Render the navigation content (shared between drawer and sidebar)
  const renderNavigationContent = () => (
    <Box
      sx={{
        width: isExpanded ? 280 : 80,
        bgcolor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        transition: 'all 0.3s ease-in-out',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme.palette.background.paper,
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.grey[300],
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.grey[400],
        }
      }}
    >
      {/* Logo */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        bgcolor: theme.palette.background.paper,
        zIndex: 10,
        pb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        mb: 1
      }}>
        {isExpanded && (
          <Fade in={isExpanded} timeout={300}>
            <Typography 
              variant="h5" 
              sx={{ 
                px: 2,
                pt: 2,
                pb: 1,
                color: theme.palette.primary.main,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Thematic Analysis
            </Typography>
          </Fade>
        )}
      </Box>

      {/* Desktop Toggle Button - only show on desktop */}
      {isDesktop && (
        <Box sx={{ 
          position: 'absolute',
          right: -16,
          top: 20,
          zIndex: 1201 
        }}>
          <IconButton
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 0 10px rgba(0, 123, 255, 0.5)',
              width: 32,
              height: 32,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                transform: 'scale(1.1)',
                boxShadow: '0 0 15px rgba(0, 123, 255, 0.7)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {isExpanded ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        </Box>
      )}

      {/* Theme Toggle */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isExpanded ? 'flex-start' : 'center',
        mb: 2,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        '&:hover': {
          bgcolor: theme.palette.action.hover,
        },
        transition: 'all 0.2s ease'
      }}>
        <Tooltip title={isExpanded ? '' : (theme.palette.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode')}>
          <IconButton 
            onClick={toggleColorMode} 
            color="inherit" 
            size="small"
            sx={{ 
              mr: isExpanded ? 1 : 0,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'rotate(30deg)',
              },
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
        {isExpanded && (
          <Fade in={isExpanded}>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
              {theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Typography>
          </Fade>
        )}
      </Box>        
      
      {/* Menu Items */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        width: '100%',
      }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.name}>
            <Tooltip 
              title={!isExpanded ? item.name : ''}
              placement="right"
            >                <Button
                  variant={activeMenuItem === item.name ? 'contained' : 'text'}
                  onClick={(e) => handleButtonClick(e, item)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  sx={{
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    gap: 2,
                    width: '100%',
                    minHeight: '56px',
                    color: activeMenuItem === item.name ? 'white' : theme.palette.text.primary,
                    bgcolor: activeMenuItem === item.name ? theme.palette.primary.main : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    transform: hoveredItem === item.name && activeMenuItem !== item.name ? 'translateX(4px)' : 'none',
                    '&:hover': {
                      bgcolor: activeMenuItem === item.name 
                        ? theme.palette.primary.dark 
                        : theme.palette.action.hover,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    '&:after': activeMenuItem === item.name ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      bgcolor: theme.palette.primary.dark,
                    } : {},
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minWidth: '24px',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </Box>
                  <Collapse in={isExpanded} orientation="horizontal">
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      flexGrow: 1,
                      width: '100%',
                      overflow: 'hidden',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden', textAlign: 'left' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            color: 'inherit',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block',
                              color: activeMenuItem === item.name 
                                ? 'rgba(255, 255, 255, 0.8)' 
                                : theme.palette.text.secondary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Collapse>
                </Button>
            </Tooltip>
          </React.Fragment>
        ))}
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {/* Profile Button at Bottom */}
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        width: '100%',
        px: isExpanded ? 0 : 1,
        transition: 'all 0.3s ease'
      }}>
        <ProfileButton sidebarMode={!isExpanded} />
      </Box>

      {/* Footer */}
      <Fade in={isExpanded} timeout={300}>
        <Box sx={{ 
          px: 2, 
          pb: 1,
          textAlign: 'center',
          width: '100%'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              width: '100%',
            }}
          >
            © 2024 Thematic Analysis Tool
          </Typography>
        </Box>
      </Fade>
    </Box>
  );

  // For mobile and tablet, return drawer navigation with burger menu
  if (isMobile || isTablet) {
    return (
      <>
        {/* Mobile/Tablet App Bar with Burger Menu */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Thematic Analysis
            </Typography>
            {/* Theme toggle in header for mobile */}
            <IconButton 
              onClick={toggleColorMode} 
              color="inherit"
              sx={{
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'rotate(30deg)',
                },
              }}
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Mobile/Tablet Drawer */}
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              bgcolor: theme.palette.background.paper,
            },
          }}
        >
          {/* Close button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={handleMobileDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          {renderNavigationContent()}
        </Drawer>
      </>
    );
  }

  // For desktop, return the traditional sidebar
  return (
    <Slide direction="right" in={true} mountOnEnter unmountOnExit>
      <Box
        className="navigation-wrapper"
        sx={{
          width: isExpanded ? 280 : 80,
          bgcolor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1200,
          boxShadow: isDraggingOver 
            ? `0 0 0 2px ${theme.palette.primary.main}, 0 0 15px ${theme.palette.primary.main}`
            : (mode === 'dark' ? '2px 0 8px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.05)'),
          height: '100vh',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Box sx={{ height: '32px' }} />
        {renderNavigationContent()}
      </Box>
    </Slide>
  );
}

export default Navigation;