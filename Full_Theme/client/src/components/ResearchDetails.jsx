import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  QuestionAnswer as QuestionIcon,
  DataObject as DataIcon,
  Lightbulb as ThemeIcon,
  Timeline as TimelineIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { projectsApi } from '../utils/api';

function ResearchDetails({ projectId }) {
  const [tabValue, setTabValue] = useState(0);
  const [researchQuestions, setResearchQuestions] = useState(['']);
  const [researchObjectives, setResearchObjectives] = useState(['']);
  const [dataTypes, setDataTypes] = useState([]);
  const [analysisApproaches, setAnalysisApproaches] = useState([]);
  const [thematicFramework, setThematicFramework] = useState({
    approach: 'inductive',
    phases: [],
    codingStyle: 'semantic'
  });
  const [qualitativeAspects, setQualitativeAspects] = useState({
    sampleSize: '',
    samplingMethod: '',
    dataCollection: [],
    validityMeasures: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const dataTypeOptions = [
    'Interviews', 'Focus Groups', 'Observations', 'Documents', 
    'Audio Recordings', 'Video Recordings', 'Field Notes', 'Surveys'
  ];

  const analysisOptions = [
    'Thematic Analysis', 'Grounded Theory', 'Phenomenological Analysis',
    'Content Analysis', 'Discourse Analysis', 'Narrative Analysis'
  ];

  const thematicPhases = [
    'Familiarization', 'Initial Coding', 'Theme Development',
    'Theme Review', 'Theme Definition', 'Report Writing'
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleResearchQuestionChange = (index, event) => {
    const newQuestions = [...researchQuestions];
    newQuestions[index] = event.target.value;
    setResearchQuestions(newQuestions);
  };

  const handleAddResearchQuestion = () => {
    setResearchQuestions([...researchQuestions, '']);
  };

  const handleRemoveResearchQuestion = (index) => {
    if (researchQuestions.length > 1) {
      const newQuestions = researchQuestions.filter((_, i) => i !== index);
      setResearchQuestions(newQuestions);
    }
  };

  const handleObjectiveChange = (index, event) => {
    const newObjectives = [...researchObjectives];
    newObjectives[index] = event.target.value;
    setResearchObjectives(newObjectives);
  };

  const handleAddObjective = () => {
    setResearchObjectives([...researchObjectives, '']);
  };

  const handleRemoveObjective = (index) => {
    if (researchObjectives.length > 1) {
      const newObjectives = researchObjectives.filter((_, i) => i !== index);
      setResearchObjectives(newObjectives);
    }
  };

  const handleDataTypeToggle = (dataType) => {
    setDataTypes(prev => 
      prev.includes(dataType) 
        ? prev.filter(type => type !== dataType)
        : [...prev, dataType]
    );
  };

  const handleAnalysisToggle = (analysis) => {
    setAnalysisApproaches(prev => 
      prev.includes(analysis) 
        ? prev.filter(approach => approach !== analysis)
        : [...prev, analysis]
    );
  };

  const handleThematicPhaseToggle = (phase) => {
    setThematicFramework(prev => ({
      ...prev,
      phases: prev.phases.includes(phase)
        ? prev.phases.filter(p => p !== phase)
        : [...prev.phases, phase]
    }));
  };

  const handleSaveResearchDetails = async () => {
    if (!projectId) {
      setSaveError('Project ID is required to save research details');
      return;
    }

    // Filter out empty questions and objectives
    const filteredQuestions = researchQuestions.filter(q => q.trim() !== '');
    const filteredObjectives = researchObjectives.filter(o => o.trim() !== '');

    if (filteredQuestions.length === 0 && filteredObjectives.length === 0) {
      setSaveError('Please add at least one research question or objective');
      return;
    }

    const researchData = {
      research_questions: filteredQuestions,
      research_objectives: filteredObjectives
    };

    setIsSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      await projectsApi.saveResearchDetails(projectId, researchData);
      setSaveMessage('Research details saved successfully!');
      console.log('Research details saved:', researchData);
    } catch (error) {
      console.error('Error saving research details:', error);
      setSaveError(error.message || 'Failed to save research details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSaveMessage('');
    setSaveError('');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Research Framework & Analysis
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Define your qualitative research approach and thematic analysis methodology
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              py: 2
            }
          }}
        >
          <Tab 
            icon={<QuestionIcon />} 
            label="Research Questions" 
            iconPosition="start"
          />
          <Tab 
            icon={<DataIcon />} 
            label="Data & Methods" 
            iconPosition="start"
          />
          <Tab 
            icon={<ThemeIcon />} 
            label="Thematic Analysis" 
            iconPosition="start"
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            label="Quality Framework" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Research Questions */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ borderRadius: 3, height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <QuestionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>Research Questions</Typography>
                </Box>
                <Stack spacing={2}>
                  {researchQuestions.map((question, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        label={`Research Question ${index + 1}`}
                        value={question}
                        onChange={(e) => handleResearchQuestionChange(index, e)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                      {researchQuestions.length > 1 && (
                        <Tooltip title="Remove question">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleRemoveResearchQuestion(index)}
                            sx={{ mt: 0.5 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={handleAddResearchQuestion} 
                    sx={{ 
                      width: 'fit-content',
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    Add Research Question
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Research Objectives */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ borderRadius: 3, height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PsychologyIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>Research Objectives</Typography>
                </Box>
                <Stack spacing={2}>
                  {researchObjectives.map((objective, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        label={`Objective ${index + 1}`}
                        value={objective}
                        onChange={(e) => handleObjectiveChange(index, e)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                      {researchObjectives.length > 1 && (
                        <Tooltip title="Remove objective">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleRemoveObjective(index)}
                            sx={{ mt: 0.5 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={handleAddObjective} 
                    sx={{ 
                      width: 'fit-content',
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    Add Objective
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSaveResearchDetails}
                disabled={isSaving}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                  }
                }}
              >
                {isSaving ? 'Saving...' : 'Save Research Details'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Data Types */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DataIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>Data Collection Methods</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select the types of qualitative data you'll be collecting
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {dataTypeOptions.map((dataType) => (
                    <Chip
                      key={dataType}
                      label={dataType}
                      clickable
                      color={dataTypes.includes(dataType) ? 'primary' : 'default'}
                      onClick={() => handleDataTypeToggle(dataType)}
                      sx={{ 
                        borderRadius: 2,
                        '&:hover': { transform: 'scale(1.05)' },
                        transition: 'transform 0.2s'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Analysis Approaches */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AnalyticsIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>Analysis Approaches</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose your qualitative analysis methodologies
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {analysisOptions.map((analysis) => (
                    <Chip
                      key={analysis}
                      label={analysis}
                      clickable
                      color={analysisApproaches.includes(analysis) ? 'secondary' : 'default'}
                      onClick={() => handleAnalysisToggle(analysis)}
                      sx={{ 
                        borderRadius: 2,
                        '&:hover': { transform: 'scale(1.05)' },
                        transition: 'transform 0.2s'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sample Details */}
          <Grid item xs={12}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Sample & Data Collection Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Expected Sample Size"
                      value={qualitativeAspects.sampleSize}
                      onChange={(e) => setQualitativeAspects(prev => ({
                        ...prev,
                        sampleSize: e.target.value
                      }))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sampling Method</InputLabel>
                      <Select
                        value={qualitativeAspects.samplingMethod}
                        label="Sampling Method"
                        onChange={(e) => setQualitativeAspects(prev => ({
                          ...prev,
                          samplingMethod: e.target.value
                        }))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="purposive">Purposive Sampling</MenuItem>
                        <MenuItem value="snowball">Snowball Sampling</MenuItem>
                        <MenuItem value="convenience">Convenience Sampling</MenuItem>
                        <MenuItem value="theoretical">Theoretical Sampling</MenuItem>
                        <MenuItem value="maximum-variation">Maximum Variation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Thematic Analysis Framework */}
          <Grid item xs={12} md={8}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ThemeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>Thematic Analysis Framework</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Analysis Approach</InputLabel>
                      <Select
                        value={thematicFramework.approach}
                        label="Analysis Approach"
                        onChange={(e) => setThematicFramework(prev => ({
                          ...prev,
                          approach: e.target.value
                        }))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="inductive">Inductive (Data-driven)</MenuItem>
                        <MenuItem value="deductive">Deductive (Theory-driven)</MenuItem>
                        <MenuItem value="hybrid">Hybrid Approach</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Coding Style</InputLabel>
                      <Select
                        value={thematicFramework.codingStyle}
                        label="Coding Style"
                        onChange={(e) => setThematicFramework(prev => ({
                          ...prev,
                          codingStyle: e.target.value
                        }))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="semantic">Semantic (Explicit)</MenuItem>
                        <MenuItem value="latent">Latent (Interpretive)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Thematic Analysis Phases
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {thematicPhases.map((phase, index) => (
                    <Chip
                      key={phase}
                      label={`${index + 1}. ${phase}`}
                      clickable
                      color={thematicFramework.phases.includes(phase) ? 'primary' : 'default'}
                      onClick={() => handleThematicPhaseToggle(phase)}
                      sx={{ 
                        borderRadius: 2,
                        '&:hover': { transform: 'scale(1.05)' },
                        transition: 'transform 0.2s'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Analysis Timeline */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimelineIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>Analysis Progress</Typography>
                </Box>
                <Stack spacing={2}>
                  {thematicPhases.map((phase, index) => (
                    <Box 
                      key={phase}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: thematicFramework.phases.includes(phase) ? 'primary.light' : 'grey.100',
                        color: thematicFramework.phases.includes(phase) ? 'primary.contrastText' : 'text.primary',
                        transition: 'all 0.3s'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: thematicFramework.phases.includes(phase) ? 'white' : 'grey.300',
                          color: thematicFramework.phases.includes(phase) ? 'primary.main' : 'grey.600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          mr: 2
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {phase}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* Quality Framework */}
          <Grid item xs={12}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Research Quality & Validity Framework
                </Typography>
                
                <Grid container spacing={3}>
                  {[
                    {
                      title: 'Credibility',
                      description: 'Internal validity - truthfulness of findings',
                      techniques: ['Member checking', 'Triangulation', 'Peer debriefing', 'Prolonged engagement']
                    },
                    {
                      title: 'Transferability',
                      description: 'External validity - applicability to other contexts',
                      techniques: ['Thick description', 'Purposive sampling', 'Clear context description']
                    },
                    {
                      title: 'Dependability',
                      description: 'Reliability - consistency of findings',
                      techniques: ['Audit trail', 'Code-recode procedure', 'External auditor']
                    },
                    {
                      title: 'Confirmability',
                      description: 'Objectivity - findings shaped by data, not bias',
                      techniques: ['Reflexivity', 'Audit trail', 'Bracketing assumptions']
                    }
                  ].map((criterion) => (
                    <Grid item xs={12} md={6} key={criterion.title}>
                      <Accordion elevation={2} sx={{ borderRadius: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {criterion.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {criterion.description}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1}>
                            {criterion.techniques.map((technique) => (
                              <FormControlLabel
                                key={technique}
                                control={<Switch size="small" />}
                                label={technique}
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                              />
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Snackbar for Save Messages */}
      <Snackbar 
        open={!!saveMessage || !!saveError} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={saveError ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {saveError || saveMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ResearchDetails;