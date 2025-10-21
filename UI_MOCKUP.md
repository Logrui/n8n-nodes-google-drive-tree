# Google Drive Recursive Node - Download File Operation UI

## Node Layout with Download File Operation

```
┌─────────────────────────────────────────────────────────────┐
│  Google Drive Recursive                                      │
│  "Download File" ◄── Dynamic subtitle based on operation    │
└─────────────────────────────────────────────────────────────┘
│
├─ Operation ⓘ                                              
│  ┌─────────────────────────────────────────────────────────┐
│  │ ○ Tree (Folder/File Structure)                          │
│  │ ○ File List (Simple JSON Array)                         │
│  │ ● Download File                                         │
│  └─────────────────────────────────────────────────────────┘
│  "Choose how to format the output"
│
├─ File ⓘ                                                    
│  ┌─────────────────────────────────────────────────────────┐
│  │ Mode: [From List ▼] [By URL] [By ID]                   │
│  │ ┌──────────────────────────────────────────────────────┐│
│  │ │ Search files...                                       ││
│  │ │ • Document.pdf                                        ││
│  │ │ • Spreadsheet.xlsx                                    ││
│  │ │ • Presentation.pptx                                   ││
│  │ └──────────────────────────────────────────────────────┘│
│  └─────────────────────────────────────────────────────────┘
│  "The file to download"
│
└─ Options (collapsible)
   │
   ├─ Binary Field Name ⓘ
   │  Input: "data" (editable)
   │  "The field name where the binary file data will be stored"
   │
   └─ Google Workspace Conversion (collapsible)
      │
      ├─ Google Docs Format
      │  Dropdown: [PDF ▼] (HTML, Word, PDF, RTF, Text, OpenOffice)
      │
      ├─ Google Sheets Format
      │  Dropdown: [PDF ▼] (CSV, Excel, PDF, OpenOffice)
      │
      ├─ Google Slides Format
      │  Dropdown: [PDF ▼] (PowerPoint, PDF, OpenOffice)
      │
      └─ Google Drawings Format
         Dropdown: [PDF ▼] (JPEG, PNG, SVG, PDF)
```

## UI Behavior by Mode

### Mode 1: From List (Default)
```
File selector shows a searchable dropdown populated by fileSearch() method:
- Queries all non-trashed files from Google Drive
- Shows file name with ID in value
- Sortable by name
- Limited to 20 results for performance
```

### Mode 2: By URL
```
Input field that accepts Google Drive file URLs:
- Example: https://drive.google.com/file/d/1ABC123XYZ789/edit
- Regex extracts file ID automatically: 1ABC123XYZ789
- Validates the URL format before accepting
```

### Mode 3: By ID
```
Direct file ID input field:
- Example: 1ABC123XYZ789
- Manual entry for known file IDs
- Validates ID format (alphanumeric, hyphens, underscores)
```

## Options Visibility

### When Operation = "downloadFile"
- ✅ File parameter (resourceLocator) - **VISIBLE**
- ✅ Binary Field Name option - **VISIBLE**
- ✅ Google Workspace Conversion option - **VISIBLE**
- ❌ Folder parameter (resourceLocator) - **HIDDEN**
- ❌ Include Folders - **HIDDEN**
- ❌ Output as Separate Items - **HIDDEN**
- ❌ Sort Order - **HIDDEN**
- ❌ Filters - **HIDDEN** (for tree/fileList)
- ✅ Fields to Return - **VISIBLE**
- ✅ Include Permissions - **VISIBLE**
- ✅ Properties to Return - **VISIBLE**
- ✅ Query String - **HIDDEN** (tree/fileList only)
- ✅ Return All Fields - **VISIBLE**

## Execution Flow

1. **User selects file via one of three modes**
   - List: Click from dropdown
   - URL: Paste Google Drive URL
   - ID: Enter file ID

2. **Node extracts file ID**
   - From list selection: Direct value
   - From URL: Regex extraction of ID
   - From ID: Direct input

3. **Node fetches file metadata**
   - GET `/files/{fileId}` → Returns: mimeType, name

4. **Node determines file type**
   - Google Workspace file? → Use `/export` endpoint
   - Regular file? → Use `/files/{fileId}` with `alt=media`

5. **Node applies conversion (if needed)**
   - For Google Docs: Convert to selected format
   - For Google Sheets: Convert to selected format
   - For Google Slides: Convert to selected format
   - For Google Drawings: Convert to selected format
   - For other files: Download as-is

6. **Node downloads binary data**
   - Stores in output with configurable field name (default: "data")
   - Preserves original or converted MIME type
   - Includes file metadata (json) alongside binary

7. **Output structure**
   ```json
   {
     "json": {
       "id": "1ABC123XYZ789",
       "name": "MyDocument.pdf",
       "mimeType": "application/pdf"
     },
     "binary": {
       "data": {
         "data": <binary buffer>,
         "mimeType": "application/pdf",
         "fileName": "MyDocument.pdf"
       }
     }
   }
   ```

## Example Workflows

### Scenario 1: Download and Save PDF
1. Operation: Download File
2. File: (select from list)
3. Binary Field Name: "data"
4. Google Workspace Conversion: All to PDF (default)
5. Output: Binary file ready for Write File node

### Scenario 2: Download Google Docs as Word
1. Operation: Download File
2. File: (paste Google Drive URL)
3. Binary Field Name: "document"
4. Google Workspace Conversion: Docs to Word
5. Output: .docx file

### Scenario 3: Download Multiple Files (in loop)
1. Previous node outputs array of file IDs
2. Operation: Download File
3. File: (By ID - takes from input)
4. Binary Field Name: "file"
5. Output: Multiple items with binary data for each

## Key Features

✅ **3 Input Modes**: List (searchable), URL (auto-extract), ID (direct)
✅ **Smart Format Conversion**: Automatic detection and conversion options
✅ **Flexible Output**: Configurable binary field name
✅ **Error Handling**: Continues on fail option
✅ **Binary Ready**: Pre-formatted for File Trigger/Write File nodes
✅ **Metadata Included**: File info preserved in JSON output
✅ **Shared Drive Support**: Works across Drive, Team Drives, and shared files
