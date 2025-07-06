import React from 'react';
import { Paper, Tooltip, IconButton, useTheme, alpha, Zoom, Stack } from '@mui/material';
import { styled } from '@mui/system';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const StyledPaper = styled(Paper)(({ theme }) => ({
    position: 'fixed',
    zIndex: 1400,
    borderRadius: theme.shape.borderRadius,
    background: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    transform: 'translate(-50%, -100%)',
    padding: theme.spacing(0.5, 1),
  }));

const FloatingSelectionToolbar = ({ show, position, onAddComment, onAssignCode }) => {
  const theme = useTheme();

  if (!show) return null;

  return (
    <Zoom in={show}>
      <StyledPaper
        className="selection-toolbar"
        elevation={8}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <Stack direction="row" spacing={0.5}>
            <Tooltip title="Add Comment" placement="top">
            <IconButton
                color="primary"
                onClick={onAddComment}
                size="small"
            >
                <ChatBubbleOutlineIcon fontSize="small"/>
            </IconButton>
            </Tooltip>
            <Tooltip title="Assign Code" placement="top">
            <IconButton
                color="secondary"
                onClick={onAssignCode}
                size="small"
            >
                <LocalOfferIcon fontSize="small"/>
            </IconButton>
            </Tooltip>
        </Stack>
      </StyledPaper>
    </Zoom>
  );
};

export default FloatingSelectionToolbar;