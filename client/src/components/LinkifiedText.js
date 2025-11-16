import React from 'react';
import { Typography, Link } from '@mui/material';

const LinkifiedText = ({ text }) => {
  if (!text) return null;

  // Function to generate friendly names for URLs
  const getFriendlyUrlName = (url) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname;
      
      // Handle Microsoft Loop links
      if (hostname.includes('loop.microsoft.com') || (hostname.includes('microsoft.com') && pathname.includes('loop'))) {
        return 'Microsoft Loop Document';
      }
      
      // Handle SharePoint/OneDrive links
      if (hostname.includes('sharepoint.com') || hostname.includes('onedrive.com')) {
        // Try to extract document name from path
        const pathParts = pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        
        if (lastPart && lastPart.includes('.')) {
          // Decode URL encoding and clean up the filename
          const fileName = decodeURIComponent(lastPart);
          return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
        }
        
        // Look for document names in query parameters
        const searchParams = urlObj.searchParams;
        const sourcedoc = searchParams.get('sourcedoc');
        if (sourcedoc) {
          return `SharePoint Document`;
        }
        
        return 'SharePoint/OneDrive Document';
      }
      
      // Handle Microsoft Office 365 links
      if (hostname.includes('office.com') || hostname.includes('office365.com') || hostname.includes('microsoft365.com')) {
        if (pathname.includes('word')) return 'Word Document';
        if (pathname.includes('excel')) return 'Excel Document';
        if (pathname.includes('powerpoint')) return 'PowerPoint Document';
        if (pathname.includes('onenote')) return 'OneNote Document';
        return 'Microsoft 365 Document';
      }
      
      // Handle Google Drive links
      if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) {
        return 'Google Drive Document';
      }
      
      // Handle Dropbox links
      if (hostname.includes('dropbox.com')) {
        const pathParts = pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          const fileName = decodeURIComponent(lastPart);
          return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
        }
        return 'Dropbox Document';
      }
      
      // Handle Box links
      if (hostname.includes('box.com')) {
        return 'Box Document';
      }
      
      // Handle Confluence/Jira
      if (hostname.includes('atlassian.net') || pathname.includes('confluence') || pathname.includes('jira')) {
        return 'Atlassian Document';
      }
      
      // For other URLs, try to extract a meaningful name
      if (pathname.length > 1) {
        const pathParts = pathname.split('/').filter(part => part.length > 0);
        const lastPart = pathParts[pathParts.length - 1];
        
        if (lastPart && lastPart.includes('.')) {
          // It's a file
          const fileName = decodeURIComponent(lastPart);
          return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
        } else if (lastPart && lastPart.length > 0 && lastPart.length < 30) {
          // It's a page/section name
          return decodeURIComponent(lastPart).replace(/[-_]/g, ' ');
        }
      }
      
      // Fallback to hostname
      return hostname.replace('www.', '');
      
    } catch (error) {
      // If URL parsing fails, return a shortened version
      return url.length > 50 ? url.substring(0, 47) + '...' : url;
    }
  };

  // Regular expressions for different link types
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]\n\r]+)/g;
  const imageMarkdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  // First, extract and replace image markdown with placeholders
  const imageMatches = [];
  let processedText = text.replace(imageMarkdownRegex, (match, alt, src) => {
    const placeholder = `__IMAGE_${imageMatches.length}__`;
    imageMatches.push({ alt, src, placeholder });
    return placeholder;
  });
  
  // Extract and replace markdown links with placeholders
  const linkMatches = [];
  processedText = processedText.replace(markdownLinkRegex, (match, text, url) => {
    const placeholder = `__LINK_${linkMatches.length}__`;
    linkMatches.push({ text, url, placeholder });
    return placeholder;
  });
  
  // Process the text to handle URLs
  const parts = [];
  let lastIndex = 0;
  let match;
  
  // Find all URLs in the text
  while ((match = urlRegex.exec(processedText)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: processedText.substring(lastIndex, match.index)
      });
    }
    
    // Add the URL
    parts.push({
      type: 'url',
      text: match[0],
      friendlyName: getFriendlyUrlName(match[0])
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last URL
  if (lastIndex < processedText.length) {
    parts.push({
      type: 'text',
      content: processedText.substring(lastIndex)
    });
  }
  
  // Process a text part that might contain markdown links or images
  const processTextPart = (text, key) => {
    if (!text) return null;
    
    // Split text by markdown links and image placeholders
    const textParts = text.split(/(__LINK_\d+__|__IMAGE_\d+__)/g);
    
    return textParts.map((part, i) => {
      const partKey = `${key}-${i}`;
      
      // Check if this part is a markdown link placeholder
      const linkMatch = linkMatches.find(link => link.placeholder === part);
      if (linkMatch) {
        return (
          <Link
            key={partKey}
            href={linkMatch.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              color: 'primary.main',
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'none'
              }
            }}
          >
            {linkMatch.text}
          </Link>
        );
      }
      
      // Check if this part is an image placeholder
      const imageMatch = imageMatches.find(img => img.placeholder === part);
      if (imageMatch) {
        return (
          <img
            key={partKey}
            src={imageMatch.src}
            alt={imageMatch.alt}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              margin: '8px 0',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              // Show a fallback text
              const fallback = document.createElement('span');
              fallback.textContent = `[Image: ${imageMatch.alt || 'Unable to load'}]`;
              fallback.style.color = '#666';
              fallback.style.fontStyle = 'italic';
              e.target.parentNode.insertBefore(fallback, e.target);
            }}
          />
        );
      }
      
      // Regular text - preserve line breaks
      return part.split('\n').map((line, lineIndex, lines) => (
        <React.Fragment key={`${partKey}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <Typography variant="body2" color="text.secondary" component="div">
      {parts.map((part, index) => {
        if (part.type === 'url') {
          return (
            <Link
              key={`url-${index}`}
              href={part.text}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'primary.main',
                textDecoration: 'underline',
                '&:hover': {
                  textDecoration: 'none'
                }
              }}
              title={part.text} // Show full URL on hover
            >
              {part.friendlyName}
            </Link>
          );
        }
        
        // Process regular text that might contain markdown links/images
        return (
          <React.Fragment key={`text-${index}`}>
            {processTextPart(part.content, `text-${index}`)}
          </React.Fragment>
        );
      })}
    </Typography>
  );
};

export default LinkifiedText;
