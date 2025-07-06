import React from 'react';
import {
  Box,
  Typography,
  Modal,
  FormControl,
  Button,
  TextField,
} from '@mui/material';

function CodeModals({
  codesModalOpen,
  setCodesModalOpen,
  selectedCode,
  setSelectedCode,
  codes,
  createCodeDialogOpen,
  setCreateCodeDialogOpen,
  newCodeFields,
  setNewCodeFields,
  setCodes,
  pendingCodeSelection,
  setPendingCodeSelection,
  codeAssignments,
  setCodeAssignments,
  projectId,
  onCodesUpdated
}) {const handleCodeAssignment = async () => {
    if (selectedCode && pendingCodeSelection) {
      try {
        // Import the API
        const { default: api } = await import('../utils/api');
          // Find the selected code details from the codes array
        const selectedCodeObject = codes.find(c => c.id === parseInt(selectedCode));
        if (!selectedCodeObject) {
          throw new Error('Selected code not found');
        }
        
        // Prepare data for API call
        const assignmentData = {
          document_id: pendingCodeSelection.documentId,
          code_name: selectedCodeObject.name,
          code_description: selectedCodeObject.description,
          code_color: selectedCodeObject.color,
          start_char: pendingCodeSelection.start_char,
          end_char: pendingCodeSelection.end_char,
          text: pendingCodeSelection.text
        };
        
        // Call the API
        const result = await api.codeAssignments.assignCode(assignmentData);
          // If successful, update UI
        if (result && result.code_assignment && result.code) {
          const assignment = result.code_assignment;
          const code = result.code;
          
          const newAssignment = {
            id: assignment.id,
            document_id: assignment.document_id,
            code_id: code.id,
            document_name: pendingCodeSelection.documentName || 'Unknown Document',
            text_snapshot: assignment.text,
            code_name: code.name,
            code_color: code.color,
            created_at: assignment.created_at || new Date().toISOString(),
            start_char: assignment.start_char,
            end_char: assignment.end_char,
            note: ''
          };
          
          setCodeAssignments(prev => [...prev, newAssignment]);
        }
        
        // Close the modal and reset state
        setCodesModalOpen(false);
        setSelectedCode('');
        setPendingCodeSelection(null);
          } catch (error) {
        console.error('Error assigning code:', error);
        alert(`Failed to assign code: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <>
      {/* Codes Modal */}
      <Modal open={codesModalOpen} onClose={() => setCodesModalOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 3,
          boxShadow: 24,
          minWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}>
          <Typography variant="h6" sx={{ fontFamily: 'cursive', mb: 1 }}>Already available</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>            <select
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1.5px solid #bbb',
                fontSize: '1.1rem',
                fontFamily: 'inherit',
              }}
              value={selectedCode}
              onChange={e => setSelectedCode(e.target.value)}
            >
              <option value="">Select a code</option>
              {codes && codes.map((code) => (
                <option 
                  key={code.id} 
                  value={code.id}
                  style={{ color: code.color || 'inherit' }}
                >
                  {code.name}
                </option>
              ))}
            </select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button
              variant="outlined"
              sx={{ flex: 1, borderRadius: '10px', fontSize: '1.1rem', fontFamily: 'inherit' }}
              onClick={() => {
                setCreateCodeDialogOpen(true);
                setCodesModalOpen(false);
              }}
            >
              Create
            </Button>
            <Button
              variant="contained"
              sx={{ flex: 1, borderRadius: '10px', fontSize: '1.1rem', fontFamily: 'inherit' }}
              onClick={handleCodeAssignment}
              disabled={!selectedCode || !pendingCodeSelection}
            >
              Assign
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Create a code dialog */}
      <Modal open={createCodeDialogOpen} onClose={() => setCreateCodeDialogOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 3,
          boxShadow: 24,
          minWidth: 400,
          maxWidth: 500,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="h5" sx={{ fontFamily: 'cursive', mb: 2 }}>Create a code</Typography>
          <TextField
            label="Name"
            fullWidth
            value={newCodeFields.name}
            onChange={e => setNewCodeFields(f => ({ ...f, name: e.target.value }))}
            sx={{ mb: 1 }}
          />
          
          <TextField
            label="Description"
            fullWidth
            value={newCodeFields.description}
            onChange={e => setNewCodeFields(f => ({ ...f, description: e.target.value }))}
            sx={{ mb: 1 }}
          />
          
          <TextField
            label="Color"
            fullWidth
            type="color"
            value={newCodeFields.color}
            onChange={e => setNewCodeFields(f => ({ ...f, color: e.target.value }))}
            sx={{ mb: 2, width: '50%' }}
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setCreateCodeDialogOpen(false)}>Cancel</Button>            <Button
              variant="contained"
              onClick={async () => {
                if (newCodeFields.name.trim()) {
                  try {
                    // Import the API
                    const { default: api } = await import('../utils/api');
                    
                    // Create the new code data
                    const codeData = {
                      name: newCodeFields.name,
                      description: newCodeFields.description || 'No description',
                      color: newCodeFields.color || '#3B82F6',
                      project_id: parseInt(projectId)
                    };
                    
                    // Call the API to create the new code
                    const response = await fetch(`http://localhost:8000/api/v1/codes/`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                      },
                      body: JSON.stringify(codeData)
                    });
                    
                    if (!response.ok) {
                      throw new Error(`Failed to create code: ${response.status}`);
                    }
                    
                    const newCode = await response.json();
                    
                    // Add the new code to the codes list
                    setCodes(prev => [...prev, newCode]);
                    setSelectedCode(newCode.id.toString());
                    setCreateCodeDialogOpen(false);
                    setNewCodeFields({ name: '', definition: '', description: '', category: '', color: '' });
                    
                    // Trigger refresh if needed
                    if (typeof onCodesUpdated === 'function') {
                      onCodesUpdated();
                    }
                  } catch (error) {
                    console.error('Error creating new code:', error);
                    alert('Failed to create code. Please try again.');
                  }
                }
              }}
              disabled={!newCodeFields.name.trim()}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default CodeModals; 