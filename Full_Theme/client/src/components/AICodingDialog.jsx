import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { projectsApi } from '../utils/api';

const AICodingDialog = ({ open, onClose, projectId, onCodingComplete }) => {
  const [analysisType, setAnalysisType] = useState('inductive');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && projectId) {
      const fetchDocs = async () => {
        setLoading(true);
        setError(null);
        try {
          const projectDetails = await projectsApi.getProjectWithContent(projectId);
          setDocuments(projectDetails.documents || []);
        } catch (err) {
          setError('Failed to fetch documents.');
          console.error(err);
        }
        setLoading(false);
      };
      fetchDocs();
    }
  }, [open, projectId]);

  const handleDocToggle = (docId) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = analysisType === 'inductive' 
        ? projectsApi.inductiveCoding 
        : projectsApi.deductiveCoding;
      
      await endpoint(projectId, { document_ids: selectedDocs });
      if (onCodingComplete) {
        onCodingComplete();
      }
      onClose();
    } catch (err) {
      setError(`Failed to perform ${analysisType} coding.`);
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>AI Thematic Analysis</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        <Box mb={2}>
          <Typography variant="h6">Thematic Analysis</Typography>
          <RadioGroup row value={analysisType} onChange={(e) => setAnalysisType(e.target.value)}>
            <FormControlLabel value="inductive" control={<Radio />} label="Inductive" />
            <FormControlLabel value="deductive" control={<Radio />} label="Deductive" />
          </RadioGroup>
        </Box>
        <Box>
          <Typography variant="h6">Documents</Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <List dense>
              {documents.map((doc) => (
                <ListItem key={doc.id} button onClick={() => handleDocToggle(doc.id)}>
                  <Checkbox checked={selectedDocs.includes(doc.id)} />
                  <ListItemText primary={doc.name || doc.file_name} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary" disabled={loading || selectedDocs.length === 0}>
          {loading ? 'Processing...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AICodingDialog;
