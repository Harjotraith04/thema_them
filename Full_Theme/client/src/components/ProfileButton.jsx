import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  Badge,
  Tooltip,
  Chip,
  alpha,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LogoutIcon from '@mui/icons-material/Logout';
import FolderIcon from '@mui/icons-material/Folder';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import { usersApi, projectsApi } from '../utils/api';

function ProfileButton({ sidebarMode }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const open = Boolean(anchorEl);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Fetch real user data from backend
        const userData = await usersApi.getCurrentUser();
        console.log('Fetched user profile:', userData);
        setUser(userData);
        
        // Fetch real project data from localStorage (current project ID)
        const currentProjectId = localStorage.getItem('currentProjectId');
        if (currentProjectId) {
          try {
            const projectData = await projectsApi.getProject(currentProjectId);
            console.log('Fetched current project:', projectData);
            setCurrentProject(projectData);
          } catch (projectError) {
            console.error('Error fetching current project:', projectError);
            // Fallback to generic project data if specific project fetch fails
            const fallbackProjectData = {
              id: currentProjectId,
              title: 'Current Project',
              description: 'Current research project'
            };
            setCurrentProject(fallbackProjectData);
          }
        } else {
          // If no specific project is selected, try to get the first available project
          try {
            const projects = await projectsApi.getProjects();
            if (projects && projects.length > 0) {
              const firstProject = projects[0];
              setCurrentProject(firstProject);
              // Optionally set this as the current project
              localStorage.setItem('currentProjectId', firstProject.id.toString());
            }
          } catch (projectsError) {
            console.error('Error fetching projects:', projectsError);
            // Use a generic fallback if no projects can be fetched
            const fallbackProjectData = {
              id: 'default',
              title: 'Research Project',
              description: 'Current research project'
            };
            setCurrentProject(fallbackProjectData);
          }
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If authentication fails, redirect to login
        if (error.message.includes('Authentication')) {
          navigate('/login');
        } else {
          // Fallback to mock data if API fails but user is authenticated
          console.warn('Using fallback user data due to API error');
          const fallbackUserData = {
            id: '1',
            email: 'demo.user@example.com'
          };
          setUser(fallbackUserData);
          
          const fallbackProjectData = {
            id: '1',
            title: 'Research Project',
            description: 'Current research project'
          };
          setCurrentProject(fallbackProjectData);
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentProjectId');
    navigate('/login');
  };

  const handleChangePassword = () => {
    // TODO: Implement change password functionality
    handleProfileClose();
  };

  const handleChangeEmail = () => {
    // TODO: Implement change email functionality
    handleProfileClose();
  };

  const handleProjectSelection = () => {
    navigate('/project-selection');
    handleProfileClose();
  };
  if (sidebarMode) {
    // Collapsed sidebar: show only avatar, centered, with menu on click
    return (
      <>
        <Tooltip title="Account Settings">
          <IconButton
            onClick={handleProfileClick}
            size="large"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              width: 48,
              height: 48,
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              transition: 'all 0.2s',
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'inherit',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {user?.email ? user.email[0].toUpperCase() : <AccountCircleIcon />}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleProfileClose}
          onClick={handleProfileClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 260,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {user?.email}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {currentProject?.title || 'No project selected'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleProjectSelection}>
            <ListItemIcon>
              <FolderIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Select Project" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <VpnKeyIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Change Password" />
          </MenuItem>
          <MenuItem onClick={handleChangeEmail}>
            <ListItemIcon>
              <EmailIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Change Email" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" />          </MenuItem>
        </Menu>
      </>
    );
  }

  // Expanded sidebar: show avatar, email, project, and menu
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <Tooltip title="Account Settings">
        <IconButton
          onClick={handleProfileClick}
          size="large"
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            width: 48,
            height: 48,
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            transition: 'all 0.2s',
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'inherit',
              color: 'white',
              fontWeight: 600,
              fontSize: '1.1rem',
            }}
          >
            {user?.email ? user.email[0].toUpperCase() : <AccountCircleIcon />}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {user?.email || 'User'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {currentProject?.title || 'No project selcted'}
        </Typography>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleProfileClose}
        onClick={handleProfileClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 260,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user?.email}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {currentProject?.title || 'No project selected'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProjectSelection}>
          <ListItemIcon>
            <FolderIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Select Project" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <VpnKeyIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Change Password" />
        </MenuItem>
        <MenuItem onClick={handleChangeEmail}>
          <ListItemIcon>
            <EmailIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Change Email" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default ProfileButton; 