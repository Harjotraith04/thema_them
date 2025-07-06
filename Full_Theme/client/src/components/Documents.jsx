import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Collapse,
  useTheme,
  Typography,
  Stack,
  Chip,
  alpha,
  CircularProgress
} from '@mui/material';
import './Documents.css';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import TableViewIcon from '@mui/icons-material/TableView';
import UploadZone from './UploadZone';
import DocumentList from './DocumentList';
import DocumentViewer from './DocumentViewer';
import FloatingSelectionToolbar from './FloatingSelectionToolbar';
import { useDocuments } from '../hooks/useDocuments';
import { useAnnotations } from '../hooks/useAnnotations';

function Documents({ 
  projectId, 
  setCodesModalOpen, 
  setPendingCodeSelection,  
  commentData,
  setCommentData,
  codeAssignments,
  documents: parentDocuments,
  setDocuments: setParentDocuments,
  refreshSidebar,
  onDocumentsUpdated,
  onCommentsUpdated,
  selectedDocumentId,
  setSelectedDocumentId
}) {
  const theme = useTheme();
  const {
    documents,
    isLoading,
    uploading,
    uploadError,
    uploadSuccess,
    activeDocument,
    documentContent,
    loadingDocument,
    handleDocumentSelect,
    handleUpload,
    handleDeleteDocument,
    fetchProjectDocuments,
    setActiveDocument
  } = useDocuments(projectId, parentDocuments, setParentDocuments, onDocumentsUpdated);

  const {
    commentModalOpen,
    setCommentModalOpen,
    newComment,
    setNewComment,
    snackbarMessage,
    setSnackbarMessage,
    snackbarOpen,
    setSnackbarOpen,
    handleSaveComment,
  } = useAnnotations(projectId, onCommentsUpdated, refreshSidebar);

  const [selection, setSelection] = useState(null);
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (selectedDocumentId && documents && Array.isArray(documents)) {
      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      if (selectedDoc) {
        handleDocumentSelect(selectedDoc);
        if (setSelectedDocumentId) {
          setSelectedDocumentId(null);
        }
      }
    }
  }, [selectedDocumentId, documents, setSelectedDocumentId, handleDocumentSelect]);

  const handleTextSelection = useCallback((selectionData) => {
    setSelection(selectionData);
    if (selectionData) {
      setSelectionPosition({
          top: selectionData.rect.top - 10,
          left: selectionData.rect.left + selectionData.rect.width / 2,
        });
      setShowSelectionToolbar(true);
    } else {
      setShowSelectionToolbar(false);
    }
  }, []);

  const handleAddComment = () => {
    if (selection) {
      setCommentModalOpen(true);
      setShowSelectionToolbar(false);
    }
  };
  
  const handleAssignCode = () => {
    if (selection) {
      setPendingCodeSelection(selection);
      setCodesModalOpen(true);
      setShowSelectionToolbar(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSelectionToolbar) {
        const toolbar = document.querySelector('.selection-toolbar');
        if (toolbar && !toolbar.contains(event.target)) {
          setShowSelectionToolbar(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSelectionToolbar]);

  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 120px)', 
      backgroundColor: theme.palette.background.default,
      overflow: 'hidden',
      position: 'relative',
      width: '100%'
    }}>
      <Collapse in={isSidebarOpen} orientation="horizontal">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            height: '100%', 
            width: 350, 
            maxWidth: 350,
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            position: 'relative',
            zIndex: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>Documents</Typography>
            <IconButton onClick={() => setIsSidebarOpen(false)} sx={{ color: theme.palette.text.primary }}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          <UploadZone onUpload={handleUpload} uploading={uploading} />
          <Typography variant="overline" sx={{ mt: 3, mb: 1, color: theme.palette.text.secondary }}>
            Project Documents ({documents?.length || 0})
          </Typography>
          <Box sx={{ mt: 1, overflowY: 'auto' }}>
            <DocumentList
              documents={documents}
              activeDocument={activeDocument}
              onDocumentSelect={handleDocumentSelect}
              onDocumentDelete={handleDeleteDocument}
            />
          </Box>
        </Paper>
      </Collapse>

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 0, 
        position: 'relative',
        overflow: 'hidden',
        maxWidth: isSidebarOpen ? 'calc(100% - 350px)' : '100%',
        width: '100%',
        height: '100%'
      }}>
        {!isSidebarOpen && (
            <IconButton 
              onClick={() => setIsSidebarOpen(true)} 
              sx={{ 
                position: 'fixed',
                top: 5,
                left: 8,
                zIndex: 1000,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }
              }}
            >
                <MenuIcon />
            </IconButton>
        )}
        
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'stretch', 
          p: 0, 
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          position: 'relative'
        }}>
          {loadingDocument ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">Loading document...</Typography>
            </Box>
          ) : activeDocument ? (
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <DocumentViewer
                documentData={{...activeDocument, content: documentContent.join('\n')}}
                annotations={[
                  ...(codeAssignments || []).filter(assignment => assignment.document_id === activeDocument.id),
                  ...(commentData || []).filter(comment => comment.document_id === activeDocument.id)
                ]}
                onTextSelect={handleTextSelection}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: theme.palette.text.primary }}>
              <Box sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 3,
                  border: `2px solid ${theme.palette.primary.main}`
              }}>
                  <MenuBookIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h4" gutterBottom>Ready to Analyze</Typography>
              <Typography sx={{ color: theme.palette.text.secondary, mb: 4 }}>
                Upload documents or select from your library to begin content analysis
              </Typography>
              <Stack direction="row" spacing={2}>
                  <Chip icon={<PictureAsPdfIcon />} label="PDF" variant="outlined" sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }} />
                  <Chip icon={<ArticleIcon />} label="DOCX" variant="outlined" sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }} />
                  <Chip icon={<TableViewIcon />} label="CSV" variant="outlined" sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }} />
              </Stack>
            </Box>
          )}
        </Box>
      </Box>

      <FloatingSelectionToolbar
        show={showSelectionToolbar}
        position={selectionPosition}
        onAddComment={handleAddComment}
        onAssignCode={handleAssignCode}
      />

      <Dialog open={commentModalOpen} onClose={() => setCommentModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add a Comment</DialogTitle>
        <DialogContent>
          {selection?.text && (
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    mt: 1,
                    mb: 2,
                    backgroundColor: alpha(theme.palette.background.default, 0.7),
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    borderRadius: 1, // Using a small value for squared corners
                }}
            >
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary, mb: 1 }}>
                    You are commenting on:
                </Typography>
                <Typography variant="body1" sx={{
                    maxHeight: '100px',
                    overflowY: 'auto',
                }}>
                    "{selection.text}"
                </Typography>
            </Paper>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Your comment"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setCommentModalOpen(false)}>Cancel</Button>
          <Button onClick={() => handleSaveComment(selection)} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarMessage.includes('Failed') ? 'error' : 'success'} sx={{ width: '100%' }} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Documents;