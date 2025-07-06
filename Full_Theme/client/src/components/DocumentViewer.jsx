import React from 'react';
import { Box, Typography, Paper, useTheme, alpha, Chip, Divider } from '@mui/material';
import { Description, TableChart, Assignment } from '@mui/icons-material';
import ReadyToAnalyze from './ReadyToAnalyze';
import { getAnnotationColor } from '../utils/colorUtils';

const DocumentViewer = ({ document, annotations, onTextSelect }) => {
  const theme = useTheme();

  if (!document) {
    return <ReadyToAnalyze />;
  }

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const text = selection.toString();
      const startChar = document.content.indexOf(text);
      const endChar = startChar + text.length;

      onTextSelect({
        text,
        documentId: document.id,
        start_char: startChar,
        end_char: endChar,
        rect
      });
    }
  };

  const getHighlightedContent = () => {
    if (!document || !document.content) return null;

    // Enhanced content formatting for better readability
    const content = document.content;
    
    // If it's a CSV file, format it nicely
    if (document.name.toLowerCase().includes('.csv')) {
      return formatCSVContent(content);
    }
    
    // For other files, return formatted content
    return formatGeneralContent(content);
  };

  const formatCSVContent = (content) => {
    const lines = content.split('\n');
    const formattedLines = lines.map((line, index) => {
      if (index === 0) {
        // Header line
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 0.5, fontSize: '1rem' }}>
              📊 Data Overview
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
              {line}
            </Typography>
          </Box>
        );
      } else if (line.includes('Columns:')) {
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.secondary.main, mb: 0.5, fontSize: '1rem' }}>
              📋 Column Structure
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
              {line}
            </Typography>
          </Box>
        );
      } else if (line.startsWith('Row ')) {
        const rowNumber = line.match(/Row (\d+):/)?.[1];
        const rowContent = line.substring(line.indexOf(':') + 1).trim();
        
        return (
          <Box key={index} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Chip 
                label={`Row ${rowNumber}`} 
                size="small" 
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  mr: 1,
                  fontSize: '0.7rem',
                  height: '20px'
                }}
              />
            </Box>
            <Paper sx={{ 
              p: 1.5, 
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              borderRadius: '6px'
            }}>
              <Typography variant="body2" sx={{ 
                lineHeight: 1.4,
                color: theme.palette.text.secondary,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                fontSize: '0.8rem'
              }}>
                {formatRowData(rowContent)}
              </Typography>
            </Paper>
          </Box>
        );
      } else if (line.trim()) {
        return (
          <Typography key={index} variant="body2" sx={{ mb: 0.5, color: theme.palette.text.primary }}>
            {line}
          </Typography>
        );
      }
      return null;
    });
    
    return formattedLines.filter(Boolean);
  };

  const formatRowData = (rowContent) => {
    // Format row data to be more readable
    return rowContent.split(' | ').map(item => `• ${item}`).join('\n');
  };

  const formatGeneralContent = (content) => {
    // Split content into paragraphs and format nicely
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, index) => (
      <Typography key={index} variant="body2" sx={{ 
        mb: 1.5, 
        lineHeight: 1.6,
        color: theme.palette.text.primary,
        textAlign: 'justify'
      }}>
        {paragraph}
      </Typography>
    ));
  };

  const getFileIcon = () => {
    const fileName = document.name.toLowerCase();
    if (fileName.includes('.csv')) return <TableChart sx={{ fontSize: 16 }} />;
    if (fileName.includes('.pdf')) return <Description sx={{ fontSize: 16 }} />;
    return <Assignment sx={{ fontSize: 16 }} />;
  };

  const getFileTypeChip = () => {
    const fileName = document.name.toLowerCase();
    let type = 'Document';
    let color = 'default';
    
    if (fileName.includes('.csv')) {
      type = 'CSV Data';
      color = 'success';
    } else if (fileName.includes('.pdf')) {
      type = 'PDF';
      color = 'error';
    } else if (fileName.includes('.txt')) {
      type = 'Text';
      color = 'info';
    }
    
    return (
      <Chip 
        label={type} 
        size="small" 
        color={color}
        variant="outlined"
        sx={{ 
          ml: 1,
          fontSize: '0.65rem',
          height: '18px',
          '& .MuiChip-label': {
            px: 0.5
          }
        }}
      />
    );
  };


  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100%', 
      width: '100%', 
      maxWidth: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <Box 
        sx={{ 
          flexGrow: 1, 
          p: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          display: 'flex'
        }} 
        onMouseUp={handleMouseUp}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 1, sm: 2, md: 3 }, 
            background: theme.palette.background.paper,
            borderRadius: '0px',
            boxShadow: 'none',
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            minHeight: '100%',
            maxWidth: '100%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            m: 0
          }}
        >
          {/* Enhanced Header */}
          <Box sx={{ 
            position: 'sticky',
            top: 0,
            background: theme.palette.background.paper,
            zIndex: 2,
            pt: 0.25,
            pb: 0.5,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            mb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              {getFileIcon()}
              <Typography variant="h6" sx={{ 
                ml: 1.5, 
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}>
                {document.name}
              </Typography>
              {getFileTypeChip()}
            </Box>
            <Typography variant="caption" sx={{ 
              color: theme.palette.text.secondary,
              ml: 3,
              fontStyle: 'italic',
              fontSize: '0.7rem'
            }}>
              Document ID: {document.id ? String(document.id).slice(0, 8) : 'N/A'}...
            </Typography>
          </Box>

          {/* Enhanced Content */}
          <Box sx={{ 
            flexGrow: 1,
            '& > *:last-child': { mb: 2 }
          }}>
            {getHighlightedContent()}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DocumentViewer;