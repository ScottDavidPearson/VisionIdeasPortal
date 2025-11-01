# Excel Import Format for Vision Ideas Portal

## Required Columns

Your Excel file should have these column headers (case-insensitive):

### **Required Fields:**
- **Title** - The idea title (required)
- **Description** - Detailed description of the idea (required)

### **Optional Fields:**
- **Category** - Product suite and module (e.g., "SCM Suite - WMS")
- **Source** - Where the idea came from (Market Gap, Tech Debt, RFP/RFI, Client, Analyst)
- **Author** - Person who submitted the idea
- **Email** - Contact email for the author
- **Status** - Current status (submitted, under_review, approved, in_progress, completed, declined)
- **Estimated Effort** - Effort estimate (number)
- **Effort Unit** - Unit for effort (story_points, hours, days)
- **Technical Requirements** - Technical details and implementation notes
- **Features** - Comma-separated list of features
- **Use Cases** - Comma-separated list of use cases

## Alternative Column Names

The system accepts various column name formats:

- **Title**: Title, title, TITLE, Idea Title
- **Description**: Description, description, desc, Idea Description
- **Category**: Category, Product Suite, Suite
- **Source**: Source, Idea Source
- **Author**: Author, Author Name, Submitted By
- **Email**: Email, Author Email, Contact

## Sample Data

```
Title: Sample Idea Title
Description: Detailed description of the idea including background, goals, and expected outcomes
Category: SCM Suite - WMS
Source: Market Gap
Author: John Doe
Email: john.doe@company.com
Status: submitted
Estimated Effort: 5
Effort Unit: story_points
Technical Requirements: Technical details and implementation notes
Features: Feature 1, Feature 2, Feature 3
Use Cases: Use Case 1, Use Case 2
```

## File Formats Supported

- **.xlsx** (Excel 2007+)
- **.xls** (Excel 97-2003)
- **.csv** (Comma-separated values)

## Notes

- Only **Title** and **Description** are required
- All other fields are optional
- If **Status** is invalid, it defaults to "submitted"
- If **Source** is missing, it defaults to "Excel Import"
- **Features** and **Use Cases** should be comma-separated
- The system will auto-generate IDs and timestamps
