import { useState, useCallback } from 'react';
import { annotationsApi } from '../utils/api';

export const useAnnotations = (projectId, onCommentsUpdated, refreshSidebar) => {
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSaveComment = useCallback(async (selection) => {
    if (selection && newComment) {
      try {
        const annotationData = {
          document_id: parseInt(selection.documentId),
          content: newComment,
          text_snapshot: selection.text,
          start_char: parseInt(selection.startChar),
          end_char: parseInt(selection.endChar),
          annotation_type: 'MEMO',
          project_id: parseInt(projectId)
        };
        
        await annotationsApi.createAnnotation(annotationData);
        
        setSnackbarMessage('Comment saved successfully!');
        setSnackbarOpen(true);
        
        if (typeof onCommentsUpdated === 'function') {
          onCommentsUpdated();
        }
        
        if (typeof refreshSidebar === 'function') {
          refreshSidebar();
        }
        
        setCommentModalOpen(false);
        setNewComment('');
      } catch (error) {
        setSnackbarMessage('Failed to save comment: ' + (error.message || 'Unknown error'));
        setSnackbarOpen(true);
      }
    }
  }, [newComment, projectId, onCommentsUpdated, refreshSidebar]);

  return {
    commentModalOpen,
    setCommentModalOpen,
    newComment,
    setNewComment,
    snackbarMessage,
    setSnackbarMessage,
    snackbarOpen,
    setSnackbarOpen,
    handleSaveComment,
  };
};