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
      if (hostname.includes('loop.microsoft.com') || hostname.includes('microsoft.com') && pathname.includes('loop')) {
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
  // Enhanced URL regex to capture more complete URLs including those with special characters
  // This will capture URLs until whitespace, quotes, or common delimiters
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
  
  // Split text by URLs, markdown links, and image placeholders
  const allRegex = new RegExp(`(${urlRegex.source}|__LINK_\\d+__|__IMAGE_\\d+__)`, 'g');
  const parts = processedText.split(allRegex);
  
  return (
    <Typography variant="body2" color="text.secondary" component="div">
      {parts.map((part, index) => {
        // Check if this part is a markdown link placeholder
        const linkMatch = linkMatches.find(link => link.placeholder === part);
        if (linkMatch) {
          return (
            <Link
              key={index}
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
        
        // Check if this part is a raw URL
        if (urlRegex.test(part)) {
          const friendlyName = getFriendlyUrlName(part);
          return (
            <Link
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'primary.main',
                textDecoration: 'underline',
                '&:hover': {
                  textDecoration: 'none'
                }
              }}
              title={part} // Show full URL on hover
            >
              {friendlyName}
            </Link>
          );
        }
        
        // Check if this part is an image placeholder
        const imagePlaceholder = imageMatches.find(img => img.placeholder === part);
        if (imagePlaceholder) {
          return (
            <img
              key={index}
              src={imagePlaceholder.src}
              alt={imagePlaceholder.alt}
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
                fallback.textContent = `[Image: ${imagePlaceholder.alt || 'Unable to load'}]`;
                fallback.style.color = '#666';
                fallback.style.fontStyle = 'italic';
                e.target.parentNode.insertBefore(fallback, e.target);
              }}
            />
          );
        }
        
        // Regular text - preserve line breaks
        return part.split('\n').map((line, lineIndex, lines) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        ));
      })}
    </Typography>
  );
};

export default LinkifiedText;
