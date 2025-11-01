import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import LinkifiedText from './LinkifiedText';

const LinkTest = () => {
  const testTexts = [
    "Simple URL: https://www.google.com",
    "Microsoft Loop: https://loop.microsoft.com/spaces/abc123/workspaces/def456/pages/ghi789",
    "SharePoint: https://company.sharepoint.com/sites/project/Shared%20Documents/document.docx",
    "Markdown link: [Google](https://www.google.com)",
    "Mixed content: Check out this document https://company.sharepoint.com/document.pdf and also [this link](https://example.com)"
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Link Processing Test
      </Typography>
      
      {testTexts.map((text, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Test {index + 1}:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
            Input: {text}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Output:
          </Typography>
          <LinkifiedText text={text} />
        </Paper>
      ))}
      
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom>
          Instructions:
        </Typography>
        <Typography variant="body2">
          1. Open browser dev tools (F12) and go to Console tab
          <br />
          2. Look for "LinkifiedText processing:" logs
          <br />
          3. Check for "URL regex matches:" and "Split parts:" logs
          <br />
          4. Verify that URLs are being detected and processed correctly
        </Typography>
      </Paper>
    </Box>
  );
};

export default LinkTest;
