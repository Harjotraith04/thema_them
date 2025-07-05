import React, { useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  Fade,
  Zoom,
  IconButton,
  Avatar,
  Chip,
  Stack,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ThemeModeContext } from '../App';
import {
  Analytics,
  Code,
  TrendingUp,
  Security,
  Speed,
  GroupWork,
  AutoAwesome,
  Insights,
  LightMode,
  DarkMode,
  ArrowForward,
  CheckCircle,
  PlayCircle,
} from '@mui/icons-material';

const Landing = () => {
  const theme = useTheme();
  const { toggleColorMode, mode } = useContext(ThemeModeContext);

  const features = [
    {
      icon: <Code sx={{ fontSize: 40 }} />,
      title: 'Qualitative Coding',
      description: 'Streamline your coding process with AI-assisted thematic analysis, automated code suggestions, and intelligent pattern recognition across your qualitative data.',
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Thematic Analysis',
      description: 'Discover meaningful themes and patterns in interviews, surveys, and documents with powerful analytical tools designed for researchers.',
    },
    {
      icon: <Insights sx={{ fontSize: 40 }} />,
      title: 'Data Visualization',
      description: 'Transform your findings into compelling visual narratives with interactive charts, theme maps, and publication-ready graphics.',
    },
    {
      icon: <GroupWork sx={{ fontSize: 40 }} />,
      title: 'Team Collaboration',
      description: 'Enable seamless collaboration with inter-rater reliability tools, shared codebooks, and real-time team coding sessions.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Research Insights',
      description: 'Generate comprehensive reports, track theme evolution, and extract actionable insights from your qualitative research data.',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure & Ethical',
      description: 'Ensure data privacy and research ethics compliance with end-to-end encryption, anonymization tools, and secure data handling.',
    },
  ];

  const benefits = [
    'Code interviews, focus groups, and documents',
    'Identify themes with AI-powered analysis',
    'Collaborate with your research team',
    'Export findings in multiple formats',
    'Ensure inter-rater reliability',
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
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

      {/* Header */}
      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backdropFilter: 'blur(20px)',
          background: theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(248, 250, 252, 0.8)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              ThemeAnalytica
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={toggleColorMode} color="inherit">
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                Sign In
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                sx={{ borderRadius: 3 }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 12 }}>
        <Fade in timeout={1000}>
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Chip
              label="🔬 Qualitative Research Platform"
              sx={{
                mb: 3,
                px: 2,
                py: 0.5,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(110, 168, 254, 0.1)'
                  : 'rgba(59, 130, 246, 0.1)',
                color: theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}20`,
                fontSize: '0.875rem',
              }}
            />
            <Typography
              variant="h1"
              sx={{
                mb: 3,
                fontWeight: 800,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)'
                  : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontSize: { xs: '2.5rem', md: '4rem' },
                lineHeight: 1.1,
              }}
            >
              Unlock Insights with
              <br />
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Thematic Analysis
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 5,
                color: theme.palette.text.secondary,
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Powerful qualitative data analysis platform for researchers. Code interviews, identify themes, and collaborate with your team using AI-powered insights.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 6 }}
            >
              <Zoom in timeout={1200}>
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 32px rgba(59, 130, 246, 0.5)',
                    },
                  }}
                >
                  Start Your Research
                </Button>
              </Zoom>
              <Zoom in timeout={1400}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PlayCircle />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }}
                >
                  See How It Works
                </Button>
              </Zoom>
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 3 }}>
              {benefits.map((benefit, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: theme.palette.text.secondary,
                  }}
                >
                  <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  <Typography variant="body2">{benefit}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>

        {/* Features Section */}
        <Box sx={{ mb: 12 }}>
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Everything You Need for Qualitative Research
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            sx={{
              mb: 6,
              color: theme.palette.text.secondary,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            From data collection to analysis and reporting - streamline your entire research workflow
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Fade in timeout={1000 + index * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(30, 41, 59, 0.6)'
                        : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 20px 40px rgba(0, 0, 0, 0.3)'
                          : '0 20px 40px rgba(0, 0, 0, 0.1)',
                        border: `1px solid ${theme.palette.primary.main}40`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          mx: 'auto',
                          mb: 3,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        }}
                      >
                        {feature.icon}
                      </Avatar>
                      <Typography
                        variant="h5"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.text.secondary,
                          lineHeight: 1.6,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Research Process Section */}
        <Box sx={{ mb: 12 }}>
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Your Research Journey, Simplified
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            sx={{
              mb: 8,
              color: theme.palette.text.secondary,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Follow our proven methodology for systematic qualitative analysis
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Fade in timeout={1500}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 3,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      fontSize: '2rem',
                    }}
                  >
                    1
                  </Avatar>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Upload & Organize
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Import interviews, documents, and media files. Organize your data into projects with secure cloud storage.
                  </Typography>
                </Box>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Fade in timeout={1700}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 3,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      fontSize: '2rem',
                    }}
                  >
                    2
                  </Avatar>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Code & Analyze
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Apply codes manually or with AI assistance. Develop your codebook and identify emerging themes systematically.
                  </Typography>
                </Box>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Fade in timeout={1900}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 3,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      fontSize: '2rem',
                    }}
                  >
                    3
                  </Avatar>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Report & Share
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Generate comprehensive reports, visualize findings, and collaborate with stakeholders on your discoveries.
                  </Typography>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Box>

        {/* Methodology Support Section */}
        <Box sx={{ mb: 12 }}>
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Supported Research Methodologies
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            sx={{
              mb: 6,
              color: theme.palette.text.secondary,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Flexible tools that adapt to your preferred analytical approach
          </Typography>
          
          <Grid container spacing={3}>
            {[
              { name: 'Thematic Analysis', desc: 'Braun & Clarke methodology' },
              { name: 'Grounded Theory', desc: 'Constant comparative method' },
              { name: 'Content Analysis', desc: 'Quantitative & qualitative' },
              { name: 'Framework Analysis', desc: 'Ritchie & Spencer approach' },
              { name: 'Narrative Analysis', desc: 'Story-focused interpretation' },
              { name: 'Phenomenological Analysis', desc: 'IPA and descriptive methods' },
            ].map((method, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Fade in timeout={2000 + index * 100}>
                  <Card
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(30, 41, 59, 0.4)'
                        : 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        border: `1px solid ${theme.palette.primary.main}40`,
                      },
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      {method.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.desc}
                    </Typography>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Feedback Form Section */}
        <Box sx={{ mb: 8 }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Fade in timeout={2200}>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        mb: 3,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                      }}
                    >
                      Please provide your valuable feedback
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                      }}
                    >
                      We would love to hear your inputs
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 2,
                        color: theme.palette.text.secondary,
                        lineHeight: 1.8,
                      }}
                    >
                      Your feedback helps us improve our platform and create better tools for qualitative researchers worldwide. Share your thoughts, suggestions, or experiences with us.
                    </Typography>
                  </Box>
                </Fade>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Fade in timeout={2400}>
                  <Card
                    sx={{
                      p: 4,
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(30, 41, 59, 0.8)'
                        : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 20px 40px rgba(0, 0, 0, 0.3)'
                        : '0 20px 40px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 4,
                        fontWeight: 600,
                        textAlign: 'center',
                        color: theme.palette.text.primary,
                      }}
                    >
                      Feedback Form
                    </Typography>
                    
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box>
                        <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.primary }}>
                          Your Name
                        </Typography>
                        <input
                          type="text"
                          placeholder="Enter Your Name"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#f9fafb',
                            color: theme.palette.text.primary,
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = theme.palette.primary.main;
                            e.target.style.boxShadow = `0 0 0 3px ${theme.palette.primary.main}20`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = theme.palette.divider;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.primary }}>
                          Email
                        </Typography>
                        <input
                          type="email"
                          placeholder="Enter Your Email"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#f9fafb',
                            color: theme.palette.text.primary,
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = theme.palette.primary.main;
                            e.target.style.boxShadow = `0 0 0 3px ${theme.palette.primary.main}20`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = theme.palette.divider;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.primary }}>
                          Comment (if any)
                        </Typography>
                        <textarea
                          placeholder="Enter Your Message"
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#f9fafb',
                            color: theme.palette.text.primary,
                            fontSize: '16px',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s ease',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = theme.palette.primary.main;
                            e.target.style.boxShadow = `0 0 0 3px ${theme.palette.primary.main}20`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = theme.palette.divider;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </Box>
                      
                      <Button
                        variant="contained"
                        size="large"
                        sx={{
                          mt: 2,
                          py: 1.5,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 32px rgba(16, 185, 129, 0.5)',
                          },
                        }}
                        onClick={() => {
                          // Add form submission logic here
                          alert('Thank you for your feedback!');
                        }}
                      >
                        Send
                      </Button>
                    </Box>
                  </Card>
                </Fade>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Container>

      {/* Newsletter Subscription */}
      <Box
        sx={{
          py: 6,
          background: theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.9)'
            : 'rgba(248, 250, 252, 0.9)',
          borderTop: `1px solid ${theme.palette.divider}`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Stay Updated with Research Insights
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                color: theme.palette.text.secondary,
              }}
            >
              Get the latest updates on qualitative research methodologies and platform features
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                maxWidth: 400,
                mx: 'auto',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <input
                type="email"
                placeholder="Your email"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#ffffff',
                  color: theme.palette.text.primary,
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
              <Button
                variant="contained"
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          background: theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Left side - Company info */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  mb: 2,
                }}
              >
                ThemeAnalytica
              </Typography>
              <Typography
                variant="body2"
                sx={{ 
                  color: theme.palette.text.secondary,
                  maxWidth: 300,
                  lineHeight: 1.6,
                }}
              >
                Empowering researchers worldwide with intelligent qualitative analysis tools for meaningful insights and discoveries.
              </Typography>
            </Grid>
            
            {/* Right side - Copyright and social links */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  alignItems: 'center',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  © 2025 ThemeAnalytica. All rights reserved.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Social media icons */}
                  <IconButton 
                    size="small" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </IconButton>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </IconButton>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </IconButton>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

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
};

export default Landing;
