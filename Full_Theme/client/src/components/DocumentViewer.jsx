import React, { useMemo, useRef } from 'react';
import { Box, Typography, Paper, useTheme, alpha, Chip, Divider, Tooltip } from '@mui/material';
import { Description, TableChart, Assignment } from '@mui/icons-material';
import ReadyToAnalyze from './ReadyToAnalyze';
import { getAnnotationColor } from '../utils/colorUtils';

const DocumentViewer = ({ documentData, annotations, onTextSelect }) => {
  const theme = useTheme();
  const contentRef = useRef(null);

  if (!documentData) {
    return <ReadyToAnalyze />;
  }

  // Separate code assignments from comments and filter by document ID
  const codeAssignments = useMemo(() => {
    return (annotations || []).filter(annotation => 
      annotation.code_name && 
      annotation.start_char !== undefined && 
      annotation.end_char !== undefined &&
      annotation.document_id === documentData.id
    );
  }, [annotations, documentData.id]);

  const commentAnnotations = useMemo(() => {
    return (annotations || []).filter(annotation => 
      !annotation.code_name && 
      annotation.comment !== undefined &&
      annotation.document_id === documentData.id
    );
  }, [annotations, documentData.id]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      onTextSelect(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText.trim().length === 0) {
      onTextSelect(null);
      return;
    }

    const contentElement = contentRef.current;
    if (!contentElement || !contentElement.contains(range.commonAncestorContainer)) {
      onTextSelect(null);
      return;
    }

    const preSelectionRange = window.document.createRange();
    preSelectionRange.selectNodeContents(contentElement);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + selectedText.length;

    // This is a fallback to ensure we don't get out of bounds with complex documents.
    const docContent = documentData.content || '';
    const startChar = Math.min(start, docContent.length);
    const endChar = Math.min(end, docContent.length);

    if (startChar >= endChar) {
        onTextSelect(null);
        return;
    }

    const rect = range.getBoundingClientRect();

    onTextSelect({
      text: selectedText,
      documentId: documentData.id,
      start_char: startChar,
      end_char: endChar,
      rect,
    });
  };

  // Function to create highlighted content with code assignments
  const createHighlightedContent = (content) => {
    if (!codeAssignments || codeAssignments.length === 0) {
      return content;
    }

    // Sort code assignments by start position to process them in order
    const sortedAssignments = [...codeAssignments]
      .filter(assignment => 
        assignment.start_char !== undefined && 
        assignment.end_char !== undefined &&
        assignment.start_char >= 0 &&
        assignment.end_char <= content.length &&
        assignment.start_char < assignment.end_char &&
        assignment.document_id === documentData.id // Ensure it belongs to this document
      )
      .sort((a, b) => a.start_char - b.start_char);

    // If no valid assignments, return original content
    if (sortedAssignments.length === 0) {
      return content;
    }

    const segments = [];
    let lastIndex = 0;

    sortedAssignments.forEach((assignment, index) => {
      const { start_char, end_char, code_name, code_color } = assignment;
      
      // Add text before this assignment
      if (start_char > lastIndex) {
        segments.push({
          type: 'text',
          content: content.slice(lastIndex, start_char),
          key: `text-${index}-${lastIndex}`
        });
      }

      // Add the highlighted assignment
      const assignmentText = content.slice(start_char, end_char);
      segments.push({
        type: 'highlight',
        content: assignmentText,
        code_name,
        code_color: code_color || getAnnotationColor({ code_name }),
        assignment,
        key: `highlight-${index}-${start_char}`
      });

      lastIndex = end_char;
    });

    // Add any remaining text after the last assignment
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex),
        key: `text-final-${lastIndex}`
      });
    }

    return segments;
  };

  const renderHighlightedContent = (segments) => {
    if (typeof segments === 'string') {
      // For non-highlighted content, split into paragraphs
      return segments.split('\n\n').map((paragraph, index) => (
        <Typography key={`paragraph-${index}`} variant="body2" sx={{ 
          mb: 1.5, 
          lineHeight: 1.6,
          color: theme.palette.text.primary,
          textAlign: 'justify'
        }}>
          {paragraph}
        </Typography>
      ));
    }

    return segments.map((segment) => {
      if (segment.type === 'text') {
        // Split text segments into paragraphs, preserving the highlighting structure
        const paragraphs = segment.content.split('\n\n');
        return paragraphs.map((paragraph, pIndex) => {
          if (!paragraph.trim()) return null;
          return (
            <span key={`${segment.key}-p${pIndex}`} style={{ 
              lineHeight: 1.6,
              color: theme.palette.text.primary 
            }}>
              {paragraph}
              {pIndex < paragraphs.length - 1 && <><br /><br /></>}
            </span>
          );
        }).filter(Boolean);
      } else if (segment.type === 'highlight') {
        return (
          <Tooltip 
            key={segment.key}
            title={
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Code: {segment.code_name}
                </Typography>
                <Typography variant="caption">
                  Click to view code details
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <span
              style={{
                backgroundColor: alpha(segment.code_color, 0.2),
                color: theme.palette.getContrastText(segment.code_color),
                padding: '2px 4px',
                borderRadius: '4px',
                border: `1px solid ${alpha(segment.code_color, 0.4)}`,
                cursor: 'pointer',
                display: 'inline',
                lineHeight: 1.6,
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = alpha(segment.code_color, 0.3);
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = alpha(segment.code_color, 0.2);
                e.target.style.transform = 'scale(1)';
              }}
              onClick={() => {
                console.log('Code assignment clicked:', segment.assignment);
                // You can add navigation to code details here
              }}
            >
              {segment.content}
            </span>
          </Tooltip>
        );
      }
      return null;
    }).filter(Boolean);
  };

  const getHighlightedContent = () => {
    if (!documentData || !documentData.content) return null;

    const content = documentData.content;
    
    // Create highlighted segments for the content
    const segments = createHighlightedContent(content);
    
    // For CSV files, we can still apply highlighting to the content
    if (documentData.name.toLowerCase().includes('.csv')) {
      // If we have code assignments, apply highlighting to CSV content too
      if (codeAssignments && codeAssignments.length > 0) {
        return renderHighlightedContent(segments);
      }
      return formatCSVContent(content);
    }
    
    // For other files, return highlighted content
    return renderHighlightedContent(segments);
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
    const fileName = documentData.name.toLowerCase();
    if (fileName.includes('.csv')) return <TableChart sx={{ fontSize: 16 }} />;
    if (fileName.includes('.pdf')) return <Description sx={{ fontSize: 16 }} />;
    return <Assignment sx={{ fontSize: 16 }} />;
  };

  const getFileTypeChip = () => {
    const fileName = documentData.name.toLowerCase();
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

  // Function to get unique codes and their statistics
  const getCodeStatistics = () => {
    if (!codeAssignments || codeAssignments.length === 0) return null;

    const codeStats = {};
    codeAssignments.forEach(assignment => {
      const codeName = assignment.code_name;
      const codeColor = assignment.code_color || getAnnotationColor({ code_name: codeName });
      
      if (!codeStats[codeName]) {
        codeStats[codeName] = {
          name: codeName,
          color: codeColor,
          count: 0
        };
      }
      codeStats[codeName].count++;
    });

    return Object.values(codeStats);
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
                {documentData.name}
              </Typography>
              {getFileTypeChip()}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ 
                color: theme.palette.text.secondary,
                ml: 3,
                fontStyle: 'italic',
                fontSize: '0.7rem'
              }}>
                Document ID: {documentData.id ? String(documentData.id).slice(0, 8) : 'N/A'}...
              </Typography>
              
              {/* Code Assignment Statistics */}
              {(() => {
                const codeStats = getCodeStatistics();
                if (!codeStats || codeStats.length === 0) return null;
                
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.7rem',
                      mr: 0.5
                    }}>
                      Codes:
                    </Typography>
                    {codeStats.slice(0, 5).map((stat, index) => (
                      <Chip
                        key={stat.name}
                        label={`${stat.name} (${stat.count})`}
                        size="small"
                        sx={{
                          height: '18px',
                          fontSize: '0.65rem',
                          backgroundColor: alpha(stat.color, 0.15),
                          color: stat.color,
                          border: `1px solid ${alpha(stat.color, 0.3)}`,
                          '& .MuiChip-label': {
                            px: 0.5,
                            fontWeight: 500
                          }
                        }}
                      />
                    ))}
                    {codeStats.length > 5 && (
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.65rem'
                      }}>
                        +{codeStats.length - 5} more
                      </Typography>
                    )}
                  </Box>
                );
              })()}
            </Box>
          </Box>

          {/* Enhanced Content */}
          <Box sx={{ 
            flexGrow: 1,
            '& > *:last-child': { mb: 2 }
          }}
          ref={contentRef}
          onMouseUp={handleMouseUp}
          >
            {getHighlightedContent()}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DocumentViewer;