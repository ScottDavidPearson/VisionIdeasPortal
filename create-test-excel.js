const XLSX = require('xlsx');

// Create test data
const testData = [
  {
    'Title': 'Test Idea 1',
    'Description': 'This is a test idea for import functionality',
    'Category': 'SCM Suite - WMS',
    'Source': 'Market Gap',
    'Author': 'Test User',
    'Email': 'test@company.com',
    'Status': 'submitted',
    'Estimated Effort': '5',
    'Effort Unit': 'story_points'
  },
  {
    'Title': 'Mobile Enhancement',
    'Description': 'Improve mobile user experience with better navigation',
    'Category': 'Retail Management Suite - POS',waf                        
    'Source': 'Client',
    'Author': 'Jane Smith',
    'Email': 'jane@company.com',
    'Status': 'under_review',
    'Estimated Effort': '8',
    'Effort Unit': 'story_points'
  }
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(testData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Ideas');

// Write file
XLSX.writeFile(workbook, 'test-ideas-import.xlsx');

console.log('✅ Excel test file created: test-ideas-import.xlsx');
console.log('📁 Location:', __dirnmaybe look at the directory?
  ame);
console.log('📊 Contains', testData.length, 'sample ideas for testing');
