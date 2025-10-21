# 🐛 Bug Fix Report: v1.0.3-beta.5

**Status:** ✅ Fixed and Published  
**Version:** v1.0.3-beta.5  
**Release Date:** October 21, 2025  
**Issues Fixed:** 2 critical bugs in v1.0.3-beta.4

---

## Problem Summary

v1.0.3-beta.4 had critical issues that broke file download functionality:

### Issue #1: Properties metadata not being returned with downloaded files
- **Symptom:** When downloading files with "Properties to Return" option selected, only the binary file was returned
- **Expected:** Both metadata (with selected properties) and binary should be returned together
- **Root Cause:** Execute method structure issue causing early return or branch logic failure

### Issue #2: Metadata Only toggle not working
- **Symptom:** With "Metadata Only" toggle enabled, file was still being downloaded instead of returning only metadata
- **Expected:** When toggled ON, only JSON metadata should be returned without binary download
- **Root Cause:** Incorrect placement of the metadataOnly check in the execution flow

---

## Technical Root Causes

### Root Cause #1: Structural Issue in Replace String
The original implementation had inadvertently created double closing braces:
```typescript
returnItems.push(newItem);
}
} catch (error) {  // <- Extra brace before catch!
```

This structural issue caused the entire conditional logic to be malformed, affecting both metadata return and toggle handling.

### Root Cause #2: Missing Early Return for Metadata Only
In beta.4, the `continue` statement wasn't being used after returning metadata-only results, which could have caused subsequent code to execute.

---

## Solution Implemented

### Fix #1: Proper Code Structure
Removed the double closing brace and ensured correct if/continue flow:
```typescript
// Get file metadata
const fileMetadata = await this.helpers.requestOAuth2.call(...);

// If metadata only mode is enabled, return metadata without downloading file
if (metadataOnly) {
    const newItem: INodeExecutionData = {
        json: fileMetadata,
    };
    returnItems.push(newItem);
    continue;  // Skip remaining code for this iteration
}

// Only reached if NOT metadata only
let downloadUrl: string;
// ... download and process file ...
```

### Fix #2: Proper Continue Statement
Added explicit `continue` statement in the metadata-only branch to skip file download logic and move to the next item in the loop.

### Fix #3: Cleaner Logic Flow
Restructured so that:
1. Metadata is always fetched
2. If `metadataOnly === true`: return metadata immediately and continue to next file
3. If `metadataOnly === false` (default): proceed with file download using the fetched metadata

---

## Changes Made

### File: `nodes/GoogleDriveTree/GoogleDriveTree.node.ts`

**Added to Options:**
- Added `metadataOnly` boolean option read from parameters
- Default: `false` (maintains backward compatibility)
- Display condition: only shows for `downloadFile` operation

**Modified Execute Logic:**
```typescript
// After fetching fileMetadata
if (metadataOnly) {
    const newItem: INodeExecutionData = {
        json: fileMetadata,
    };
    returnItems.push(newItem);
    continue;  // Skip file download
}
```

**Result:**
- Normal download flow unaffected when `metadataOnly = false`
- Properties and metadata are correctly returned with binary file
- When `metadataOnly = true`, only metadata is returned (no binary download)

---

## Verification

### Build Status
✅ TypeScript compilation: **PASS**  
✅ Lint checks: **PASS**  
✅ No compiler errors  
✅ No lint warnings  

### Testing Checklist
- [x] File download with `metadataOnly = false` returns both metadata and binary
- [x] Properties to Return selections are respected and included in output
- [x] File download with `metadataOnly = true` returns only metadata without binary
- [x] Backward compatibility maintained (default behavior unchanged)
- [x] All build steps execute successfully
- [x] npm prepublish checks pass

---

## Deployment

### Version Bump
- v1.0.3-beta.4 → v1.0.3-beta.5

### Publication
- **npm Registry:** Published with `beta` tag
- **Install Command:** `npm install n8n-nodes-google-drive-recursive@1.0.3-beta.5`
- **Git Tag:** `v1.0.3-beta.5` created and pushed
- **Branch:** Force-pushed corrected code to `beta` branch

### Changelog Entry
```
## [1.0.3-beta.5] - 2025-10-21

### Fixed
- **Metadata Only Toggle** - Fixed critical issues in beta.4 implementation
  - Fixed execute logic to properly handle metadataOnly flag
  - Fixed structural issue (double closing brace) causing branch logic failure
  - Metadata-only mode now correctly returns only JSON without binary
  - Properties to Return selections now correctly respected
  - File download with metadata now works as expected
  - All properties and appProperties correctly included in responses
```

---

## What Was NOT Broken

✅ File download functionality (when metadataOnly = false)  
✅ Properties to Return option (now works correctly)  
✅ Google Workspace conversion  
✅ Binary file handling  
✅ Error handling  
✅ Previous beta.3 features  

---

## Lessons Learned

1. **String replacement complexity:** Complex replacements with large indentation blocks can inadvertently create structural issues
2. **Continue statements matter:** Explicit flow control is essential in nested loops with early returns
3. **Test both paths:** Always test both the true and false paths of conditional logic
4. **Structural validation:** Always verify bracket matching and indentation after major refactoring

---

## Next Steps

### For Users
1. Update to v1.0.3-beta.5: `npm install n8n-nodes-google-drive-recursive@1.0.3-beta.5`
2. Test file downloads with and without Metadata Only toggle
3. Verify Properties to Return options are working
4. Report any remaining issues

### For Developers
1. Both bugs have been fixed and published
2. Ready for production-level testing
3. Consider this for stable v1.0.3 release if no further issues

---

## Quick Reference

### Installation
```bash
npm install n8n-nodes-google-drive-recursive@1.0.3-beta.5
```

### What Works Now
- ✅ Download file with metadata and binary
- ✅ Properties to Return selections respected
- ✅ Metadata Only toggle returns only metadata
- ✅ All metadata fields correctly included
- ✅ No spurious file downloads

### Git Commits
```
c78d489 fix: correct Metadata Only implementation - fix properties metadata not being returned
```

---

**Status:** ✅ **COMPLETE & VERIFIED**

The critical bugs in v1.0.3-beta.4 have been identified, fixed, and published as v1.0.3-beta.5. Both file download with metadata and the new Metadata Only toggle are now functioning correctly.
