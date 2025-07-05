import React, { useState, useContext } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Avatar,
  useTheme,
  Divider,
  Alert,
  Fade,
  Zoom,
  IconButton,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  LockOutlined, 
  Google, 
  GitHub, 
  ArrowBack,
  Visibility,
  VisibilityOff 
} from '@mui/icons-material';
import { ThemeModeContext } from '../App';
import axios from 'axios';

function Login() {
  const theme = useTheme();
  const { mode } = useContext(ThemeModeContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/v1/auth/login',
        formData
      );

      console.log('Login successful:', response.data);
      localStorage.setItem('authToken', response.data.access_token);

      navigate('/project-selection');

    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://127.0.0.1:8000/api/v1/auth/login/google';
  };

  const handleGitHubLogin = () => {
    window.location.href = 'http://127.0.0.1:8000/api/v1/auth/login/github';
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle, rgba(110, 168, 254, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle, rgba(192, 132, 252, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />

      {/* Back to Home Button */}
      <IconButton
        component={RouterLink}
        to="/"
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 41, 59, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            background: theme.palette.mode === 'dark'
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
          },
        }}
      >
        <ArrowBack />
      </IconButton>

      <Container component="main" maxWidth="xs">
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <Paper
            elevation={6}
            sx={{
              padding: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 40px rgba(0, 0, 0, 0.3)'
                : '0 20px 40px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 24px 48px rgba(0, 0, 0, 0.4)'
                  : '0 24px 48px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Fade in={true} style={{ transitionDelay: '200ms' }}>
              <Avatar
                sx={{
                  m: 1,
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <LockOutlined fontSize="large" />
              </Avatar>
            </Fade>

            <Fade in={true} style={{ transitionDelay: '300ms' }}>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mt: 2,
                  mb: 1,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textAlign: 'center',
                }}
              >
                Welcome Back
              </Typography>
            </Fade>

            <Fade in={true} style={{ transitionDelay: '400ms' }}>
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                  textAlign: 'center',
                  maxWidth: '80%',
                }}
              >
                Sign in to continue to your account
              </Typography>
            </Fade>

            <Box sx={{ width: '100%', mb: 3 }}>
              <Fade in={true} style={{ transitionDelay: '500ms' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  onClick={handleGoogleLogin}
                  sx={{
                    mb: 2,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    borderColor: theme.palette.divider,
                    backgroundColor: 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(59, 130, 246, 0.05)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                    },
                  }}
                >
                  Continue with Google
                </Button>
              </Fade>

              <Fade in={true} style={{ transitionDelay: '600ms' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GitHub />}
                  onClick={handleGitHubLogin}
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    borderColor: theme.palette.divider,
                    backgroundColor: 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(59, 130, 246, 0.05)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                    },
                  }}
                >
                  Continue with GitHub
                </Button>
              </Fade>
            </Box>

            <Fade in={true} style={{ transitionDelay: '700ms' }}>
              <Divider sx={{ width: '100%', mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
            </Fade>

            {error && (
              <Fade in={true}>
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    width: '100%',
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      color: theme.palette.error.main,
                    },
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Fade in={true} style={{ transitionDelay: '800ms' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    },
                  }}
                />
              </Fade>

              <Fade in={true} style={{ transitionDelay: '900ms' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    },
                  }}
                />
              </Fade>

              <Fade in={true} style={{ transitionDelay: '1000ms' }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 4,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(59, 130, 246, 0.5)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Fade>

              <Fade in={true} style={{ transitionDelay: '1100ms' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleForgotPassword}
                  sx={{
                    mt: 1,
                    textAlign: 'center',
                    display: 'block',
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: theme.palette.primary.dark,
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot password?
                </Link>
              </Fade>

              <Fade in={true} style={{ transitionDelay: '1200ms' }}>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link
                    component={RouterLink}
                    to="/signup"
                    variant="body2"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: theme.palette.primary.dark,
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Don't have an account? Sign Up
                  </Link>
                </Box>
              </Fade>
            </Box>
          </Paper>
        </Zoom>
      </Container>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>
    </Box>
  );
}

export default Login; 