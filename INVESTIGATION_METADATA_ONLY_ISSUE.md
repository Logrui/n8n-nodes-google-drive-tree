# Investigation Report: Metadata Only Toggle Not Working

**Date:** October 21, 2025  
**Issue:** Metadata Only toggle is not preventing file downloads - files are still being downloaded despite toggle being enabled

---

## Code Analysis

### UI Parameter Definition
**Location:** Line 247-258 in GoogleDriveTree.node.ts

```typescript
{
    displayName: 'Metadata Only',
    name: 'metadataOnly',
    type: 'boolean',
    default: false,
    displayOptions: {
        show: {
            operation: ['downloadFile'],
        },
    },
    description: 'Whether to retrieve only file metadata...',
}
```

✅ **Status:** Correctly defined
- Parameter name: `metadataOnly` (correct)
- Type: boolean (correct)
- Default: false (correct)
- Display condition: Shows only for `downloadFile` operation (correct)

---

### Execute Logic - Options Reading
**Location:** Line 932 in GoogleDriveTree.node.ts

```typescript
const options = this.getNodeParameter('options', itemIndex, {}) as Record<string, any>;
const binaryPropertyName = (options.binaryPropertyName as string) || 'data';
const googleWorkspaceConversion = options.googleWorkspaceConversion as any;
const propertiesToReturn = (options.propertiesToReturn as string) || 'both';
const fieldsToReturn = (options.fieldsToReturn as string[]) || ['id', 'name', 'mimeType'];
const returnAllFields = (options.returnAllFields as boolean) || false;
const metadataOnly = (options.metadataOnly as boolean) || false;
```

✅ **Status:** Reading appears correct
- Uses `this.getNodeParameter('options', itemIndex, {})`
- Defaults to `false` if not present
- Should read `metadataOnly` from options

---

### Conditional Check
**Location:** Line 972-979 in GoogleDriveTree.node.ts

```typescript
// If metadata only mode is enabled, return metadata without downloading file
if (metadataOnly) {
    const newItem: INodeExecutionData = {
        json: fileMetadata,
    };
    returnItems.push(newItem);
    continue;
}
```

✅ **Status:** Logic appears correct
- Checks if metadataOnly is true
- Creates item with only json (no binary)
- Uses `continue` to skip file download code
- Should skip all download logic

---

## Potential Issues Identified

### Issue #1: Parameter Nesting Level
**Concern:** The `metadataOnly` parameter is defined in the main parameters array, but it needs to be inside the `options` collection for it to be read as part of `options`.

**Current Location:** Line 247-258 - Top level parameter definition

**Should Be:** The parameter should potentially be nested under the `options` collection definition.

**Code Structure Review:**
```typescript
// Main properties array contains:
- 'folder' (resourceLocator)
- 'operation' (string)
- 'fileId' (resourceLocator)
- 'sortBy' (enum)
- 'sortOrder' (enum)
- 'Metadata Only' ← LINE 247 (TOP LEVEL)
- 'Filters' (collection)
- 'Options' (collection) ← This contains binaryPropertyName, etc.
```

**FINDING:** The `Metadata Only` parameter is defined at the TOP LEVEL of the main properties array, NOT nested inside the `options` collection.

### Issue #2: How n8n Parameters Work
In n8n, parameters within a `collection` are read as nested properties. So:
- Parameters inside `Filters` collection → read as `filters.filterByProperty`
- Parameters inside `Options` collection → read as `options.binaryPropertyName`

**Current Problem:** `Metadata Only` is at TOP LEVEL, so it should be read as `this.getNodeParameter('metadataOnly', itemIndex)`, NOT as part of `options`.

---

## Root Cause Assessment

### Most Likely Issue:
The `metadataOnly` parameter is being read from the wrong location.

**Current Code:**
```typescript
const metadataOnly = (options.metadataOnly as boolean) || false;
```

**Should Probably Be:**
```typescript
const metadataOnly = this.getNodeParameter('metadataOnly', itemIndex, false) as boolean;
```

### Why This Causes the Issue:
1. When you toggle "Metadata Only" in the UI, it sets the top-level `metadataOnly` parameter
2. The code tries to read it from `options.metadataOnly` (nested)
3. Since it's not nested, `options.metadataOnly` is always `undefined`
4. The fallback `|| false` makes it default to `false`
5. The if check `if (metadataOnly)` is always false
6. The file always gets downloaded

---

## Evidence

### Parameter Definition Hierarchy:
```typescript
properties: [
    // Top level parameters
    {
        displayName: 'Folder',
        name: 'folder',
        // ...
    },
    {
        displayName: 'Operation',
        name: 'operation',
        // ...
    },
    {
        displayName: 'Metadata Only',    ← TOP LEVEL
        name: 'metadataOnly',
        // ...
    },
    {
        displayName: 'Options',          ← COLLECTION (nested)
        name: 'options',
        type: 'collection',
        options: [
            {
                displayName: 'Binary Property Name',
                name: 'binaryPropertyName',
                // ...
            },
            // ... other options ...
        ]
    }
]
```

### How n8n Node Runtime Works:
- Top-level parameters are read via: `this.getNodeParameter('paramName', index)`
- Nested collection parameters are read via: `this.getNodeParameter('collectionName', index)` (returns object)

---

## Confirmation Needed

To confirm this hypothesis, we would need to check:

1. **Is `options.metadataOnly` undefined?** 
   - Add logging to verify what `options.metadataOnly` evaluates to
   
2. **Should metadataOnly be nested or top-level?**
   - Check if it logically belongs in Options collection
   - Check similar n8n nodes for parameter organization patterns

3. **What's the actual execution path?**
   - Add console.log to confirm if the `if (metadataOnly)` block is being reached
   - Add logging to show the value of `metadataOnly` variable

---

## Recommended Next Steps (Not Applied Yet)

### Option A: Move parameter to top-level read
Change line 932 from:
```typescript
const metadataOnly = (options.metadataOnly as boolean) || false;
```

To:
```typescript
const metadataOnly = this.getNodeParameter('metadataOnly', itemIndex, false) as boolean;
```

### Option B: Move UI parameter into Options collection
Move the parameter definition from top-level to nested inside the Options collection.

---

## Summary

**Issue Type:** Parameter reading/scoping issue  
**Severity:** Critical - Feature completely non-functional  
**Root Cause:** Likely reading `metadataOnly` from wrong location (`options.metadataOnly` instead of top-level parameter)  
**Impact:** Metadata Only toggle always evaluates to false, file download always proceeds  

**Status:** ⏳ Awaiting confirmation before applying fix
