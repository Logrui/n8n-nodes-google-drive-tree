# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3-beta.4] - 2025-10-21

### Added
- **Metadata Only Toggle** - Download File operation now supports retrieving metadata without downloading the file
  - New "Metadata Only" boolean option that appears above Filters section
  - When enabled: retrieves file metadata (id, name, size, owners, created time, etc.) without the binary
  - Respects all Properties to Return and Fields to Return selections
  - Useful for workflows that only need file information without the file content
  - Significantly reduces bandwidth and time for metadata-only workflows

## [1.0.3-beta.3] - 2025-10-21

### Improved
- **File Search Enhancement** - fileSearch method now provides smarter file selection
  - Excludes folders from file list (only shows downloadable files)
  - Automatically filters files within the selected folder context
  - Defaults to 'root' (My Drive) if no folder is selected
  - Provides better UX by limiting results to current folder
  - Name search still applies within the folder context

## [1.0.3-beta.2] - 2025-10-21

### Added
- **Download File Operation** - New operation to download individual files from Google Drive
  - File selection via resourceLocator with 3 modes: From List (searchable), By URL (auto-extract ID), By ID (direct input)
  - Support for Google Workspace file format conversion (Docs/Sheets/Slides/Drawings to PDF/Word/Excel/OpenOffice)
  - Dynamic metadata fields selection (size, dates, owners, permissions, custom properties)
  - Custom properties support (Public Properties, App Properties, or Both)
  - Permissions tracking when "Include Permissions" is enabled
  - Return All Fields option for complete metadata
  - Configurable binary output field name (default: "data")
  - Binary file download with proper MIME type handling
  - Error handling with continueOnFail support

### Fixed
- **Download File Metadata** - Enhanced to respect Fields to Return and Properties to Return selections
  - Dynamically builds Google Drive API fields parameter
  - Returns all selected metadata alongside binary file
  - Maintains backwards compatibility with default field selections

## [1.0.2] - 2025-10-21

### Added
- **Permissions Support** - New "Include Permissions" parameter to retrieve file sharing permissions and access information
  - Shows who has access to each file and their permission level (owner, organizer, writer, commenter, reader)
  - Works in both tree and fileList output modes
  - Note: Requires sharing permissions; not available for shared drive files

### Fixed
- **Properties Return Bug** - Fixed missing properties and appProperties in file list output
  - Properties were being requested from Google Drive API but not included in the final output
  - Now correctly includes `properties` and `appProperties` fields when selected by user
  - Works for both fileList (flat array) and tree (hierarchical) output modes
- **Parameter Ordering** - Alphabetically sorted options for better UI consistency
  - Order: Fields to Return → Include Permissions → Properties to Return → Query String → Return All Fields
- **Removed Non-functional Filters** 
  - Removed "Include Trashed Items" filter (was not working correctly)
  - Removed "Include Starred Only" filter (was not working correctly)
  - Kept working filters: File Type and Property Value filters
- **Subtitle Display** - Fixed subtitle to correctly show operation name
  - Tree mode: "Generate Folder Tree"
  - FileList mode: "List All Folders/Files"
  - Subtitle now updates dynamically when operation is changed
- **Sort Order Parameter Visibility** - Sort Order parameter now only shows in fileList mode (hidden in tree mode where it's not applicable)
- **outputAsItems Parameter** - Fixed reading of outputAsItems parameter (was being read from wrong location)
  - Now correctly reads from top-level parameters instead of nested options
  - Properly controls whether output is single item or multiple items

### Changed
- **Parameter Renamed** - `outputMode` renamed to `operation` for better UX
  - **BREAKING CHANGE**: If you were using `outputMode` parameter, update to `operation`
  - Values remain the same: "tree" or "fileList"
  - Allows operations to show in Add Node menu with proper action values
- **Operations in Sidebar** - Operations now appear in n8n Add Node menu
  - "Tree (Folder/File Structure)" - Hierarchical tree view of folders and files
  - "File List (Simple JSON Array)" - Flat array of files and folders
  - Each operation has its own action value for automation
- Enhanced DriveFile interface to support permissions data
- Improved output mapping logic for conditional field inclusion

### Verified
- Output structure is correct for n8n integration
- fileList mode with outputAsItems=FALSE returns single item with array: `[[{ json: [objects] }]]`
- fileList mode with outputAsItems=TRUE returns multiple items: `[[{ json: obj1 }, { json: obj2 }, ...]]`

---

## [1.0.1] - 2025-10-21 (Previous Official Release)

### Core Features (Implemented in earlier versions)
- Recursive folder tree generation from Google Drive
- Flat file list output mode
- Filter by file type (Google Docs, Sheets, Slides, PDFs, etc.)
- Filter by custom properties
- Sort options (name ascending/descending, date created, date modified)
- Include/exclude folders toggle
- Include trashed items option
- Starred items filter
- Query string support for advanced Google Drive searches
- Custom properties (public and app-specific)
- Multiple field selection for output
- Shared Drive support
- OAuth2 authentication

---

## Notes

### Known Limitations
- Permissions data requires read/write sharing permissions on the file
- Permissions are not populated for items in shared drives
- Tree mode uses first parent folder ID (files can only have one parent)
- Large datasets (1000+ items) may take longer to process

### API Fields
The node can now request the following fields from Google Drive API:
- `id`, `name`, `mimeType`, `parents` (always included)
- `createdTime`, `modifiedTime`, `description`, `size`, `starred`, `trashed`
- `fileExtension`, `md5Checksum`, `owners`, `resourceKey`, `driveId`, `spaces`
- `thumbnailLink`, `webContentLink`, `webViewLink`
- `properties` (public custom properties)
- `appProperties` (application-specific custom properties)
- `permissions` (file sharing permissions - when enabled)