# Version-Update Workflow

## Purpose
Update version numbers across all HTML pages and JavaScript mobile menu files when releasing a new version. This must be done carefully to ensure ONLY version numbers change, with no other modifications to files.

---

## When to Run Version Update

### Trigger Phrases
User says:
- "Update version to X.X.X.X"
- "Bump version to X.X.X.X"
- "Release version X.X.X.X"
- "Change version number to X.X.X.X"

### Version Format
- Always format as: `vX.X.X.X` (with lowercase 'v' prefix)
- Example: `v0.8.0.2`, `v0.8.1.0`, `v1.0.0.0`

---

## Pre-Update Checklist

Before making ANY version changes:

1. **Confirm with user:**
   - "Updating version from vX.X.X.X to vX.X.X.X across all files. Confirm?"
   - Wait for explicit confirmation

2. **Read CONTEXT.md:**
   - Log the version update action
   - Note old and new version numbers

3. **Verify version format:**
   - Must be vX.X.X.X format
   - All numbers must be digits (0-9)

---

## Files to Update

### HTML Pages (Footer Version Tags)

**Location Pattern:** `<p class="text-xs text-gray-500 font-mono select-none">vX.X.X.X</p>`

**Files to Update:**
```
src/pages/index/index.html
src/pages/index.html (second index file)
src/pages/cutting-records/cutting-records.html
src/pages/inventory-records/inventory-records.html
src/pages/live-statistics/live-statistics.html
src/pages/cutting-reports/cutting-reports.html
src/pages/inventory-reports/inventory-reports.html
src/pages/reel-estimator/reel-estimator.html
src/pages/reel-size-estimator/reel-size-estimator.html
src/pages/wire-weight-estimator/wire-weight-estimator.html
src/pages/mark-calculator/mark-calculator.html
src/pages/stop-mark-calculator/stop-mark-calculator.html
src/pages/multi-cut-planner/multi-cut-planner.html
src/pages/machine-maintenance-checklist/machine-maintenance-checklist.html
src/pages/machine-maintenance-checklist-multi-page/machine-maintenance-checklist-multi-page.html
src/pages/shipping-manifest/shipping-manifest.html
src/pages/reel-inventory-labels/reel-inventory-labels.html
src/pages/maintenance/maintenance.html
src/pages/changelog/changelog.html
src/pages/knowledgebase/knowledgebase.html
src/pages/education-center/education-center.html
(and any other HTML pages in src/pages/)
```

**Files to EXCLUDE (DO NOT MODIFY):**
```
src/pages/changelog-older/changelog-older.html (has AI comment exclusion)
src/pages/inventory-changelog-older/inventory-changelog-older.html (has AI comment exclusion)
```

### JavaScript Files (Mobile Menu Version Tags)

**Location Pattern:** `version: 'vX.X.X.X',` (TWO instances per file)

**Files to Update:**
```
src/assets/js/cutting-records.js
src/assets/js/inventory-records.js
src/assets/js/live-statistics.js
src/assets/js/cutting-reports.js
src/assets/js/inventory-reports.js
src/assets/js/reel-estimator.js
src/assets/js/reel-size-estimator.js
src/assets/js/wire-weight-estimator.js
src/assets/js/mark-calculator.js
src/assets/js/stop-mark-calculator.js
src/assets/js/multi-cut-planner.js
src/assets/js/machine-maintenance-checklist.js
src/assets/js/machine-maintenance-checklist-multi-page.js
src/assets/js/shipping-manifest.js
src/assets/js/reel-inventory-labels.js
src/assets/js/maintenance.js
src/assets/js/changelog.js
src/assets/js/knowledgebase.js
src/assets/js/education-center.js
(and any other JS files with mobile menus)
```

---

## Update Procedure

### Step 1: Update HTML Footer Version Tags

**sed Command Pattern:**
```bash
sed -i 's/none">v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+vNEW_VERSION</' filename.html
```

**Example (updating to v0.8.0.2):**
```bash
# Update all HTML files (excluding changelog-older and inventory-changelog-older)
sed -i 's/none">v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+v0.8.0.2</' src/pages/index/index.html
sed -i 's/none">v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+v0.8.0.2</' src/pages/index.html
sed -i 's/none">v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+v0.8.0.2</' src/pages/cutting-records/cutting-records.html
sed -i 's/none">v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+v0.8.0.2</' src/pages/inventory-records/inventory-records.html
# ... continue for all HTML files except changelog-older and inventory-changelog-older
```

**Pattern Explanation:**
- `none">v` - Matches the exact text before version
- `[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+` - Matches version pattern X.X.X.X
- `<` - Matches the closing bracket after version
- Replaces with `none">vNEW_VERSION<`

### Step 2: Update JavaScript Mobile Menu Version Tags

**CRITICAL: JavaScript files have TWO version strings**

**Pattern in JS files:**
```javascript
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.1',  // ← FIRST VERSION TAG
        menuItems: [
            // ... menu items ...
        ],
        version: 'v0.8.0.1',  // ← SECOND VERSION TAG (near bottom)
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Tool Name'
    });
}
```

**sed Command Pattern (BOTH instances):**
```bash
sed -i "s/version: 'v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+',/version: 'vNEW_VERSION',/g" filename.js
```

**Example (updating to v0.8.0.2):**
```bash
# Update all JS files with mobile menus
sed -i "s/version: 'v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+',/version: 'v0.8.0.2',/g" src/assets/js/cutting-records.js
sed -i "s/version: 'v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+',/version: 'v0.8.0.2',/g" src/assets/js/inventory-records.js
sed -i "s/version: 'v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+',/version: 'v0.8.0.2',/g" src/assets/js/live-statistics.js
# ... continue for all JS files
```

**Pattern Explanation:**
- `version: 'v` - Matches exact text before version
- `[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+` - Matches version pattern X.X.X.X
- `',` - Matches the closing quote AND comma (CRITICAL)
- `/g` flag - Global replacement (updates BOTH instances in file)

---

## Critical Requirements

### ⚠️ COMMA PRESERVATION

**CRITICAL:** The comma after the version string MUST be preserved in JS files.

**Correct:**
```javascript
version: 'v0.8.0.2',  // ← COMMA PRESENT
```

**Wrong:**
```javascript
version: 'v0.8.0.2'   // ❌ MISSING COMMA - BREAKS CODE
```

**The sed pattern MUST include the comma:**
```bash
# ✅ CORRECT - includes comma in pattern
sed -i "s/version: 'v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+',/version: 'v0.8.0.2',/g"

# ❌ WRONG - missing comma
sed -i "s/version: 'v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+'/version: 'v0.8.0.2'/g"
```

### 🎯 PRECISION REQUIREMENTS

**Only Version Numbers Change:**
- ✅ Change: `v0.8.0.1` → `v0.8.0.2`
- ❌ Don't change: Spaces, quotes, commas, brackets, or any other characters

**Pattern Matching:**
- HTML pattern: `none">vX.X.X.X</p>`
- JS pattern: `version: 'vX.X.X.X',`

**Character-Level Accuracy:**
```
BEFORE: none">v0.8.0.1</p>
AFTER:  none">v0.8.0.2</p>
        ^^^^^^         ^^^^ ← These MUST NOT change

BEFORE: version: 'v0.8.0.1',
AFTER:  version: 'v0.8.0.2',
        ^^^^^^^^^          ^^ ← These MUST NOT change
```

---

## Execution Steps

### Step-by-Step Process

**1. Confirm Version Update:**
```
[2025-10-30 XX:XX:XX] VERSION UPDATE INITIATED
Action: Update version from v0.8.0.1 to v0.8.0.2
Scope: All HTML footers and JS mobile menus
Exclusions: changelog-older.html, inventory-changelog-older.html
Status: Awaiting user confirmation
```

**2. Update HTML Files:**
```bash
# Generate list of HTML files to update
find src/pages -name "*.html" \
  ! -path "*/changelog-older/*" \
  ! -path "*/inventory-changelog-older/*" \
  -type f

# Update each file with sed
for file in $(find src/pages -name "*.html" ! -path "*/changelog-older/*" ! -path "*/inventory-changelog-older/*" -type f); do
    sed -i 's/none">v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+v0.8.0.2</' "$file"
done
```

**3. Update JavaScript Files:**
```bash
# Update all JS files in assets/js directory
for file in src/assets/js/*.js; do
    sed -i "s/version: 'v[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+',/version: 'v0.8.0.2',/g" "$file"
done
```

**4. Verify Changes:**
```bash
# Check HTML files
grep -r "none\">v0.8.0.2<" src/pages/ | wc -l

# Check JS files (should show 2x count since there are 2 per file)
grep -r "version: 'v0.8.0.2'," src/assets/js/ | wc -l

# Verify excluded files weren't changed
grep -r "none\">v0.8.0.1<" src/pages/changelog-older/
grep -r "none\">v0.8.0.1<" src/pages/inventory-changelog-older/
```

**5. Log Completion:**
```
[2025-10-30 XX:XX:XX] VERSION UPDATE COMPLETED
Action: Updated version from v0.8.0.1 to v0.8.0.2
Files Modified:
  - HTML files: [count] files updated
  - JS files: [count] files updated (2 instances per file)
  - Excluded: changelog-older.html, inventory-changelog-older.html
Verification:
  - HTML footers: [count] instances changed
  - JS mobile menus: [count] instances changed
Result: SUCCESS - All version tags updated correctly
Next: Commit changes and update CONTEXT.md
```

---

## Verification Checklist

After running sed commands:

- [ ] All HTML files show new version in footer
- [ ] Both index.html files updated
- [ ] All JS files show new version (2 instances per file)
- [ ] Commas preserved in JS files after version strings
- [ ] Excluded files (changelog-older, inventory-changelog-older) unchanged
- [ ] No other text modified (spaces, quotes, brackets intact)
- [ ] Git diff shows ONLY version number changes

### Verification Commands
```bash
# Count HTML version instances (should match number of HTML files)
grep -r 'none">v0.8.0.2<' src/pages/ --exclude-dir=changelog-older --exclude-dir=inventory-changelog-older | wc -l

# Count JS version instances (should be 2x number of JS files)
grep -r "version: 'v0.8.0.2'," src/assets/js/ | wc -l

# Verify no broken commas
grep -r "version: 'v0.8.0.2'" src/assets/js/ | grep -v "," 
# (should return nothing - if it shows results, commas are missing)

# Check excluded files still have old version
grep -r 'none">v0.8.0.1<' src/pages/changelog-older/
grep -r 'none">v0.8.0.1<' src/pages/inventory-changelog-older/
# (should show old version still present)
```

---

## Error Handling

### If sed Command Fails

**Problem:** sed command produces error
```
[2025-10-30 XX:XX:XX] VERSION UPDATE ERROR
Action: sed command failed
Error: [error message]
File: [filename]
Status: STOPPED - No changes made
Next: Review error, fix pattern, retry
```

**Common Errors:**

1. **File not found:**
   - Check file path is correct
   - Verify file exists: `ls -la [filepath]`

2. **Permission denied:**
   - Check file permissions: `ls -l [filepath]`
   - May need to run with appropriate permissions

3. **Pattern not matching:**
   - Verify current version format in file
   - Check for typos in sed pattern
   - Test pattern: `grep "version: 'v0.8.0.1'," [file]`

### If Verification Fails

**Problem:** Counts don't match expected

1. **Check for missed files:**
```bash
   # Find files still with old version
   grep -r 'none">v0.8.0.1<' src/pages/ --exclude-dir=changelog-older --exclude-dir=inventory-changelog-older
   grep -r "version: 'v0.8.0.1'," src/assets/js/
```

2. **Fix individual files:**
```bash
   # Re-run sed on specific file
   sed -i 's/none">v0.8.0.1v0.8.0.2</' [filepath]
```

3. **Check for format variations:**
   - Some files might have different spacing
   - Manually inspect and update if needed

### If Commas Are Missing

**Problem:** JS files missing commas after version

**Detection:**
```bash
# Find version strings without commas
grep -r "version: 'v0.8.0.2'" src/assets/js/ | grep -v ","
```

**Fix:**
```bash
# Add missing commas
sed -i "s/version: 'v0.8.0.2'/version: 'v0.8.0.2',/g" [filepath]
```

---

## Integration with Other Workflows

### Update Changelog First

**Before updating version tags:**
1. Ensure changelog is complete for current version
2. All changes should be documented under v0.8.0.1

**After updating version tags:**
1. Create new version section in changelog
2. Move to Update-Changelog workflow for new entries

### Update CONTEXT.md
```
[2025-10-30 XX:XX:XX] VERSION UPDATE COMPLETE
Action: Updated application version from v0.8.0.1 to v0.8.0.2
Files Modified:
  - HTML files: 25 files updated with new footer version
  - JavaScript files: 18 files updated (36 version instances total)
Changes:
  - All footer version tags: v0.8.0.1 → v0.8.0.2
  - All mobile menu versions: v0.8.0.1 → v0.8.0.2
Exclusions: changelog-older.html, inventory-changelog-older.html preserved at v0.8.0.1
Verification: All checks passed, commas preserved, no extra changes
Result: SUCCESS - Version update complete across entire application
Next: Create new changelog section for v0.8.0.2
```

---

## Special Cases

### Updating Both Index Files

**Two index.html files exist:**
1. `src/pages/index/index.html` (main index inside folder)
2. `src/pages/index.html` (root index file)

**Both must be updated:**
```bash
sed -i 's/none">v0.8.0.1v0.8.0.2</' src/pages/index/index.html
sed -i 's/none">v0.8.0.1v0.8.0.2</' src/pages/index.html
```

### Files Without Mobile Menus

**Some HTML files may not have corresponding JS files:**
- Update HTML footer only
- Skip JS update (no mobile menu exists)
- Document in CONTEXT.md

### New Files Added

**If new HTML/JS files added since last version:**
1. Verify they have version tags
2. Include in sed update commands
3. Update file lists in this workflow rule

---

## Testing Changes

### Before Committing

**1. Visual Check:**
- Open random HTML file in browser
- Verify footer shows new version
- Check mobile menu (if exists) shows new version

**2. Code Check:**
```bash
# View actual changes
git diff src/pages/
git diff src/assets/js/

# Should only show version number changes:
# -none">v0.8.0.1
# +none">v0.8.0.2
# -version: 'v0.8.0.1',
# +version: 'v0.8.0.2',
```

**3. Syntax Check:**
```bash
# Check for JavaScript syntax errors (if available)
for file in src/assets/js/*.js; do
    node --check "$file" 2>&1 | grep -i error && echo "Error in $file"
done
```

---

## Git Commit

### Commit Message Format
```
[VERSION] Update to v0.8.0.2

Updated version tags across all HTML footers and JavaScript mobile menus.

Files changed:
- HTML files: 25 footers updated
- JS files: 18 mobile menus updated (36 instances)

Excluded files (preserved at v0.8.0.1):
- changelog-older.html
- inventory-changelog-older.html

All changes verified, commas preserved, no extra modifications.
```

### Commit Command
```bash
# Stage all modified files
git add src/pages/**/*.html src/assets/js/*.js

# Exclude the two special files if accidentally staged
git reset src/pages/changelog-older/changelog-older.html
git reset src/pages/inventory-changelog-older/inventory-changelog-older.html

# Commit with message
git commit -m "[VERSION] Update to v0.8.0.2

Updated version tags across all HTML footers and JavaScript mobile menus.

Files changed:
- HTML files: 25 footers updated  
- JS files: 18 mobile menus updated (36 instances)

Excluded files (preserved at v0.8.0.1):
- changelog-older.html
- inventory-changelog-older.html

All changes verified, commas preserved, no extra modifications."
```

---

## Summary

**Version Update Process:**
1. ✅ Confirm new version number with user
2. ✅ Update HTML footers (all except 2 excluded files)
3. ✅ Update JS mobile menus (2 instances per file)
4. ✅ Verify commas preserved in JS files
5. ✅ Verify excluded files unchanged
6. ✅ Verify only version numbers changed
7. ✅ Log in CONTEXT.md
8. ✅ Commit with proper message

**Critical Rules:**
- ❌ NEVER create new version without user request
- ❌ NEVER modify changelog-older or inventory-changelog-older
- ❌ NEVER change anything except version numbers
- ✅ ALWAYS preserve commas in JavaScript files
- ✅ ALWAYS update BOTH version instances in JS files
- ✅ ALWAYS update BOTH index.html files
- ✅ ALWAYS verify changes before committing

**Remember:** Version updates are surgical changes - touch ONLY the version numbers, nothing else. Precision is critical!