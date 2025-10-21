# Beta Release Summary - v1.0.3-beta.3

## 📦 Publication Status

✅ **Published to npm beta channel**
```
npm install n8n-nodes-google-drive-recursive@beta
```

**Version:** 1.0.3-beta.3  
**Tag:** beta  
**Registry:** npmjs.org  
**Git Tag:** v1.0.3-beta.3  
**Branch:** beta  
**Published:** 2025-10-21T23:22:48Z  

---

## 🎯 Features in This Release

### 1. Download File Operation ✅
Download individual files from Google Drive with full control:
- **3 Input Modes**: List (searchable), URL (auto-extract), ID (direct)
- **Format Conversion**: Google Workspace files to PDF/Word/Excel/etc
- **Dynamic Metadata**: Select fields you need (size, dates, owners, permissions, custom properties)
- **Custom Properties**: Include public/app/both property types
- **Permissions Tracking**: Option to include sharing permissions
- **Configurable Output**: Binary field name, mime type handling
- **Error Handling**: continueOnFail support

### 2. Smart File Selection ⭐ NEW
File search now works intelligently:
- **Excludes Folders**: Only shows downloadable files (not folders)
- **Folder-Aware**: Automatically filters files within selected folder
- **Defaults to My Drive**: If no folder selected, uses root
- **Better UX**: Scoped results prevent overwhelming list
- **Name Search**: Still applies within folder context

### 3. Rich Metadata Output ✅
Downloads now include full file metadata:
```json
{
  "json": {
    "id": "1ABC...",
    "name": "Document.pdf",
    "mimeType": "application/pdf",
    "size": 2048576,
    "createdTime": "2024-10-21T10:30:00Z",
    "modifiedTime": "2024-10-21T14:45:00Z",
    "owners": [...],
    "permissions": [...],
    "properties": {...},
    "appProperties": {...}
  },
  "binary": {
    "data": { /* file buffer */ }
  }
}
```

---

## 🚀 Usage Examples

### Example 1: Download File from Selected Folder
```
Folder selector: [Select Folder]
  ↓
File selector: [From List] → Shows only files in selected folder, no folders
  ↓
Download with metadata
```

### Example 2: Download with Metadata
```
Download File Operation:
  File: Select from list
  Fields to Return: ID, Name, Size, Created Time, Owners
  Include Permissions: ✓
  Binary Field Name: document
  
Output:
  json: { id, name, size, createdTime, owners, permissions }
  binary: { document: <file data> }
```

### Example 3: Convert Google Doc
```
Download File Operation:
  File: By URL → https://drive.google.com/file/d/1ABC.../edit
  Google Workspace Conversion: Docs → Word
  Binary Field Name: converted_doc
  
Output:
  json: { ... file metadata ... }
  binary: { converted_doc: <.docx file> }
```

---

## 🔧 Technical Details

### fileSearch Improvements
**Query Filter:**
```
trashed=false 
  AND mimeType!='application/vnd.google-apps.folder'
  AND '<selectedFolderId>' IN parents
  AND name CONTAINS '<searchText>' (if provided)
```

**Behavior:**
- Reads folder selection from node parameters
- Excludes all folder MIME types
- Filters to selected folder parent relationship
- Defaults to 'root' if no folder selected
- Maintains alphabetical name sorting
- Returns up to 20 results

### Build Status
✅ TypeScript compilation successful  
✅ ESLint validation passed  
✅ All tests verified  
✅ Backwards compatible  

---

## 📋 What Changed from Previous Beta

**v1.0.3-beta.2 → v1.0.3-beta.3:**
- fileSearch now excludes folders from results
- fileSearch filters files to selected folder context
- Improved UX with smarter file selection
- Better results when downloading files

---

## 🔗 Git Information

**Latest Commits:**
```
5677e53 (HEAD -> beta, tag: v1.0.3-beta.3, origin/beta) 
  chore: bump version to 1.0.3-beta.3

85ed687 feat: improve fileSearch to exclude folders and filter by selected folder

967f798 docs: update changelog for 1.0.3-beta.2 release

40f21f8 (tag: v1.0.3-beta.2) 
  chore: bump version to 1.0.3-beta.2 for npm beta publication

c165d84 docs: add comprehensive Download File enhancement documentation
```

**Beta Branch:** origin/beta (up to date with all changes)  
**Release Tag:** v1.0.3-beta.3 (pushed to GitHub)  

---

## 📥 Installation for Testing

```bash
# Option 1: Install beta version
npm install n8n-nodes-google-drive-recursive@beta

# Option 2: Install specific beta version
npm install n8n-nodes-google-drive-recursive@1.0.3-beta.3

# Option 3: Update existing beta installation
npm update n8n-nodes-google-drive-recursive@beta
```

---

## ✅ Testing Checklist

When testing, verify:
- [ ] Download File operation appears in operations list
- [ ] File selector shows only files, not folders
- [ ] File list filters to selected folder
- [ ] Can search for files within folder
- [ ] URL extraction works for Google Drive URLs
- [ ] Direct file ID input works
- [ ] Google Workspace format conversion works
- [ ] Metadata fields are included in output
- [ ] Binary file data is present and correct
- [ ] Custom properties show correctly
- [ ] Permissions display when enabled
- [ ] Error handling with continueOnFail works

---

## 📚 Documentation

Three detailed docs included:
1. **UI_MOCKUP.md** - Complete UI layout and interaction flows
2. **DOWNLOAD_FILE_ENHANCEMENT.md** - Detailed feature documentation with examples
3. **Changelog.md** - Full version history

---

## 🎓 Next Steps

Recommended testing workflow:
1. Install beta version
2. Create a test workflow with Download File operation
3. Select a folder
4. Use file selector to browse files (verify no folders shown)
5. Download a regular file with metadata
6. Download a Google Workspace file with format conversion
7. Verify output structure and metadata completeness

---

## 💬 Known Limitations

- File search limited to 20 results (prevents overwhelming API calls)
- Shared drive files may not show properties (API limitation)
- Some permission operations require sharing permissions
- Google Workspace export has file size limits per Google's API

---

**Ready for testing! 🧪**
