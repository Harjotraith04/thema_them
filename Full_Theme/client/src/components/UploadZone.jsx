import React, { useState } from 'react';
import { Box, Typography, Button, useTheme, alpha, LinearProgress } from '@mui/material';
import { styled } from '@mui/system';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const DropzoneArea = styled(Box)(({ theme, isdragging }) => {
    const isDarkMode = theme.palette.mode === 'dark';
    return {
      border: `2px dashed ${alpha(theme.palette.primary.main, 0.5)}`,
      borderRadius: theme.shape.borderRadius,
      padding: theme.spacing(3),
      textAlign: 'center',
      cursor: 'pointer',
      backgroundColor: isdragging === 'true' 
        ? alpha(theme.palette.primary.main, 0.1)
        : 'transparent',
      transition: 'background-color 0.3s ease',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
      },
    };
  });

const UploadZone = ({ onUpload, uploading }) => {
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSelectFiles = (event) => {
    const files = Array.from(event.target.files);
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUploadClick = () => {
    onUpload(selectedFiles);
    setSelectedFiles([]);
  }

  return (
    <Box>
      <input
          accept=".pdf,.doc,.docx,.txt,.csv"
          style={{ display: 'none' }}
          id="raised-button-file"
          multiple
          type="file"
          onChange={handleSelectFiles}
          disabled={uploading}
        />
      <label htmlFor="raised-button-file">
        <DropzoneArea
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            isdragging={isDragging.toString()}
        >
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }}/>
            <Typography variant="body1" sx={{ mt: 1 }}>
            Drag & drop files or click to select
            </Typography>
        </DropzoneArea>
      </label>
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">{selectedFiles.length} file(s) selected:</Typography>
          <Button variant="contained" color="primary" onClick={handleUploadClick} fullWidth sx={{mt: 1}} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>
      )}
      {uploading && <LinearProgress sx={{mt: 1}}/>}
    </Box>
  );
};

export default UploadZone;