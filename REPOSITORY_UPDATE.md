# Repository Update - n8n-nodes-google-drive-recursive

**Update Date:** October 21, 2025  
**Status:** ✅ Complete

---

## Repository Change

The repository has been moved from `n8n-nodes-google-drive-tree` to `n8n-nodes-google-drive-recursive`.

### Old Remote URLs
- **Origin:** `https://github.com/Logrui/n8n-nodes-google-drive-tree.git`
- **Upstream:** `https://github.com/pavelsterba/n8n-nodes-google-drive-tree.git`

### New Remote URLs
- **Origin:** `https://github.com/Logrui/n8n-nodes-google-drive-recursive.git`
- **Upstream:** `https://github.com/pavelsterba/n8n-nodes-google-drive-recursive.git`

---

## Git Configuration Updates

All git remotes have been updated to point to the new repository:

```bash
git remote set-url origin https://github.com/Logrui/n8n-nodes-google-drive-recursive.git
git remote set-url upstream https://github.com/pavelsterba/n8n-nodes-google-drive-recursive.git
```

### Verification

✅ Origin fetch: `https://github.com/Logrui/n8n-nodes-google-drive-recursive.git`  
✅ Origin push: `https://github.com/Logrui/n8n-nodes-google-drive-recursive.git`  
✅ Upstream fetch: `https://github.com/pavelsterba/n8n-nodes-google-drive-recursive.git`  
✅ Upstream push: `https://github.com/pavelsterba/n8n-nodes-google-drive-recursive.git`  

---

## Current State

### Latest Release
- **Version:** v1.0.3-beta.5
- **Status:** ✅ Published to npm with `beta` tag
- **Package Name:** `n8n-nodes-google-drive-recursive`
- **Install:** `npm install n8n-nodes-google-drive-recursive@1.0.3-beta.5`

### Build Status
✅ TypeScript compilation successful  
✅ Gulp build icons successful  
✅ No errors or warnings  

### Git Status
✅ All commits pushed to new repository  
✅ All tags created in new repository  
✅ Beta branch up to date  

---

## Latest Commits

1. **066a020** - docs: add bug fix report for v1.0.3-beta.5
2. **c78d489** - fix: correct Metadata Only implementation - fix properties metadata not being returned
3. **6cb4162** - docs: add beta release documentation for v1.0.3-beta.3
4. **5677e53** - chore: bump version to 1.0.3-beta.3
5. **85ed687** - feat: improve fileSearch to exclude folders and filter by selected folder

---

## Next Steps

### For Development
- All future commits should be pushed to the new repository
- The old repository URLs will no longer be used
- Use `git push origin` and `git pull origin` normally

### For npm Packages
- The package will continue to be published under the name `n8n-nodes-google-drive-recursive`
- npm registry points to the new repository

### For Users
- Update package references if needed
- Repository URL in documentation should reference the new location
- All functionality remains the same

---

## Files Updated
- Git remote configuration (local only, not versioned)
- No source code changes

## Verification Commands

```bash
# Verify remotes
git remote -v

# Check latest commits
git log --oneline -10

# Verify package info
npm view n8n-nodes-google-drive-recursive

# Build check
npm run build
```

---

**Status:** ✅ Repository successfully updated to `n8n-nodes-google-drive-recursive`

All development and deployment workflows continue normally with the new repository URL.
