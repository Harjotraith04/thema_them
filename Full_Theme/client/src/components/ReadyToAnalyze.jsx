import React from 'react';
import { Box, Typography, Chip, Stack, Avatar } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';

const ReadyToAnalyze = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        p: 3,
        color: 'text.secondary',
      }}
    >
      <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mb: 3 }}>
        <MenuBookIcon sx={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant="h4" component="h2" sx={{ mb: 1, color: 'text.primary' }}>
        Ready to Analyze
      </Typography>
      <Typography sx={{ mb: 4, maxWidth: '400px' }}>
        Upload documents or select from your library to begin content analysis
      </Typography>
      <Stack direction="row" spacing={2}>
        <Chip icon={<PictureAsPdfIcon />} label="PDF" variant="outlined" />
        <Chip icon={<DescriptionIcon />} label="DOCX" variant="outlined" />
        <Chip icon={<AssessmentIcon />} label="CSV" variant="outlined" />
      </Stack>
    </Box>
  );
};

export default ReadyToAnalyze;
