# n8n-nodes-google-drive-recursive

This is an n8n community node. It lets you generate a folder tree structure or recursive file list from Google Drive in your n8n workflows, with flexible resource selection and output modes.

Core node for Google Drive can only list files in a single folder, this node recursively lists all files and folders starting from a given root folder ID.

Originally forked from [pavelsterba/n8n-nodes-google-drive-tree](https://github.com/pavelsterba/n8n-nodes-google-drive-tree)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## 🎯 What's New 
- **Resource Selector**: Choose folders by ID or from a searchable list
- **Output Mode**: Get results as hierarchical tree or flat file list
- **Dynamic Folder Loading**: Dropdown of all available folders (no need to know IDs!)
- **Better Integration**: Easier loops and data processing with file list output

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

For Self Hosted/Community Edition N8N Users:
Settings -> Community Nodes -> Install -> n8n-nodes-google-drive-recursive 

## Credentials

You need to authenticate with `googleDriveOAuth2Api` credentials.

## Usage - Quick Examples

### Example 1: Get All Files as a List
```
Resource: By ID
Folder ID: root
Output Mode: File List
```
Returns: Array of files ready for loops and processing

### Example 2: Browse Folder Structure
```
Resource: By List  
Folder: [Select from dropdown]
Output Mode: Tree
```
Returns: Hierarchical tree structure

### Example 3: Process Files in Loop
```
Resource: By List
Folder: Marketing
Output Mode: File List
→ For Each Loop
  → Download file
  → Extract text
  → Save to database
```

## Features

✅ **Two Resource Selection Methods**
- By ID: Specify folder ID directly (backward compatible)
- By List: Choose from searchable dropdown of all your folders (new!)

✅ **Two Output Formats**
- Tree: Hierarchical structure with nested children (original)
- File List: Flat JSON array with parent references (new, great for loops!)

✅ **Full Capabilities**
- Recursive folder traversal
- Pagination support (handles 100,000+ items)
- Shared drive support
- Dynamic folder discovery
- Complete MIME type information

✅ **Advanced Filtering** (v1.0.1-beta.16+)
- **File Type Filter**: Include/exclude specific MIME types
- **Property Filters**: Search by custom Google Drive properties
- **Starred Filter**: Include only starred items
- **Fields Selection**: Choose which metadata to retrieve
- ⚠️ **Guaranteed Recursion**: Filters are applied AFTER recursion completes, ensuring all folders are traversed

**Important**: Filters are applied to the complete recursively-collected file list (post-processing), NOT during API queries. This ensures that filtering doesn't interrupt folder traversal. For example, if you filter by "PDF files only", the node still traverses ALL folders to find PDFs nested deep in the structure.

## Output Format Examples

### Tree Mode
```json
{
  "id": "folder1",
  "name": "Projects",
  "mimeType": "application/vnd.google-apps.folder",
  "children": [
    {
      "id": "doc1",
      "name": "Proposal.pdf",
      "mimeType": "application/pdf",
      "children": []
    }
  ]
}
```

### File List Mode (Array of Objects)
```json
[
  {
    "id": "folder1",
    "name": "Projects",
    "mimeType": "application/vnd.google-apps.folder",
    "parents": ["root"]
  },
  {
    "id": "doc1",
    "name": "Proposal.pdf",
    "mimeType": "application/pdf",
    "parents": ["folder1"]
  }
]
```

## Common Workflows

1. **File Inventory Report** - Export all files to CSV
2. **Sync to Database** - Mirror folder structure in your database
3. **Smart Processing** - Different handling for PDFs, Docs, Sheets
4. **File Discovery** - Find and analyze specific file types
5. **Folder Backup** - Audit what's in your Drive
6. **RAG Sync** - Implement with RAG Workflows easily in one step


* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Google Drive API documentation](https://developers.google.com/drive)
* [n8n Docs](https://docs.n8n.io/)

## Support

For detailed information:
- 🚀 **Getting started?** → [BEFORE_AFTER_COMPARISON.md](BEFORE_AFTER_COMPARISON.md)
- 💡 **Need examples?** → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- 🔧 **Want to modify?** → [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
- � **Filtering deep dive?** → [FILTERING_ARCHITECTURE.md](FILTERING_ARCHITECTURE.md)
- �📖 **Need everything?** → [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)



