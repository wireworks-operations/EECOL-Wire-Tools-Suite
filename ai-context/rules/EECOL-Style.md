# EECOL-Style Rule - Wire Tools Project

## Scope
This rule applies to ALL new tool pages and pages NOT related to the "Education Center" / "Education Hub". 

**Exception:** Education Center pages have their own distinct style system (see Education-Center-Style.md).

---

## Mandatory Style Requirements

### Theme Consistency
- ✅ ALL new tools MUST use the shared theme and style CSS of existing pages
- ✅ Follow the established visual design of `index.html` and other tool pages
- ✅ Match color scheme, typography, spacing, and component styles
- ✅ Maintain consistent header, navigation, and footer structure

### Visual Reference
Before creating any new page:
1. Open `index.html` in browser
2. Review existing tool pages (cutting records, etc.)
3. Note: color palette, button styles, form inputs, card layouts, spacing patterns
4. Match these exactly in new page

---

## File Structure - STRICT RULES

### HTML Pages
**Location:** `src/pages/`
**Naming:** Use kebab-case (e.g., `osd-tracker.html`, `cable-calculator.html`)

```
src/pages/
├── index.html
├── cuttingrecords.html
├── [new-tool-name].html  ← Your new pages go here
```

### JavaScript Files
**Location:** `src/assets/js/`
**Naming:** Match page name or be descriptive of function

```
src/assets/js/
├── cutting-records.js
├── [new-tool-name].js  ← Tool-specific JS here
├── shared.js           ← Shared functionality across tools
```

### CSS Files
**Location:** `src/css/`
**Naming:** Use shared stylesheet or create tool-specific if needed

```
src/css/
├── style.css           ← Main shared styles (USE THIS)
├── theme.css           ← Theme variables (colors, fonts)
├── [tool-specific].css ← Only if absolutely necessary
```

**CSS Priority:**
1. ALWAYS link `style.css` first (shared styles)
2. ALWAYS link `theme.css` second (theme variables)
3. Only add tool-specific CSS if truly unique to that tool
4. Never duplicate styles that exist in shared CSS

---

## Utils System - MANDATORY USAGE

### Available Utils (src/utils/)
Before writing ANY utility function, check if it already exists:

**Common Utils:**
- `printing.js` - Print functionality for reports/records
- `charts.js` - Chart generation and visualization
- `modal.js` - Custom modal system (popups, dialogs, confirmations)
- `storage.js` - IndexedDB/localStorage helpers (if exists)
- `validation.js` - Form validation (if exists)
- `date-utils.js` - Date formatting/parsing (if exists)

### Usage Rule
✅ **ALWAYS use existing utils** - Never rewrite functionality that exists
❌ **NEVER duplicate util functions** in page-specific JS

### When You Need a New Util
**STOP and ask before creating:**

"This page needs [X functionality]. Should I:
1. Use existing util: [name existing util if applicable]
2. Create new util: `src/utils/[proposed-name].js`
3. Add to existing util: Extend `src/utils/[existing-util].js`"

Wait for user decision before proceeding.

### New Util Criteria
Only create a new util if:
- Functionality will be reused across multiple pages
- Function is generic enough to be project-wide
- No existing util covers this use case
- User approves the creation

---

## Page Creation Workflow

### Step 1: Planning (Before Any Code)
1. Identify which existing page is most similar to new tool
2. List required functionality
3. Check which utils are needed
4. Confirm page name and file locations with user

### Step 2: HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Tool Name] - Wire Tools</title>
    
    <!-- ALWAYS include shared styles IN THIS ORDER -->
    <link rel="stylesheet" href="../css/theme.css">
    <link rel="stylesheet" href="../css/style.css">
    <!-- Only add tool-specific CSS if absolutely necessary -->
    <link rel="stylesheet" href="../css/[tool-name].css">
</head>
<body>
    <!-- Use same header/nav structure as other pages -->
    <header>
        <!-- Match existing header exactly -->
    </header>
    
    <main>
        <!-- Your tool content -->
    </main>
    
    <!-- Use same footer structure as other pages -->
    <footer>
        <!-- Match existing footer exactly -->
    </footer>
    
    <!-- Load utils BEFORE page-specific JS -->
    <script src="../utils/modal.js"></script>
    <script src="../utils/printing.js"></script>
    <!-- Add other utils as needed -->
    
    <!-- Page-specific JS goes last -->
    <script src="../assets/js/[tool-name].js"></script>
</body>
</html>
```

### Step 3: JavaScript Organization
```javascript
// src/assets/js/[tool-name].js

// ALWAYS check for util dependencies at top
if (typeof Modal === 'undefined') {
    console.error('Modal util not loaded - check script order in HTML');
}

// Tool-specific code
class ToolName {
    constructor() {
        this.initializeUI();
        this.loadData();
    }
    
    // Use utils, don't rewrite them
    showError(message) {
        Modal.show('Error', message); // Use existing modal util
    }
    
    printReport() {
        Printing.print(document.getElementById('report')); // Use existing print util
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new ToolName();
});
```

### Step 4: CSS (Only if Needed)
**Before adding tool-specific CSS, ask:**
- Does this style exist in `style.css`?
- Can I use existing CSS classes?
- Is this style truly unique to this tool?

If tool-specific CSS is needed:
```css
/* src/css/[tool-name].css */

/* Use CSS variables from theme.css */
.tool-specific-class {
    color: var(--primary-color); /* Use theme variables */
    padding: var(--spacing-md);
}

/* Don't redefine common styles */
/* ❌ WRONG: */
.button {
    /* This already exists in style.css */
}

/* ✅ RIGHT: */
.tool-unique-button {
    /* Only styles unique to this tool */
}
```

---

## Style Consistency Checklist

Before considering a page complete, verify:

### Visual Consistency
- [ ] Header matches other pages (logo, navigation, layout)
- [ ] Footer matches other pages
- [ ] Color scheme matches (backgrounds, text, accents)
- [ ] Typography matches (font families, sizes, weights)
- [ ] Button styles match (hover states, disabled states)
- [ ] Form inputs match (text fields, selects, checkboxes)
- [ ] Spacing/padding matches other pages
- [ ] Responsive behavior matches (mobile, tablet, desktop)

### Code Consistency
- [ ] File in correct location (`src/pages/`)
- [ ] JS in correct location (`src/assets/js/`)
- [ ] CSS in correct location (`src/css/`)
- [ ] Shared CSS linked correctly
- [ ] Utils loaded before page-specific JS
- [ ] No duplicate util functions in page JS
- [ ] Console has no errors about missing utils
- [ ] Code follows same patterns as existing tools

### Functionality
- [ ] All interactive elements work
- [ ] Forms validate properly (using existing validation if applicable)
- [ ] Modals use the modal util
- [ ] Print functionality uses print util
- [ ] Charts use chart util (if applicable)
- [ ] Data persistence works (IndexedDB/localStorage)

---

## Common Mistakes to Avoid

### ❌ DON'T DO THIS:
```javascript
// Rewriting modal functionality
function showMyCustomModal(message) {
    const modal = document.createElement('div');
    // ... 50 lines of modal code
}
```

### ✅ DO THIS INSTEAD:
```javascript
// Use existing modal util
Modal.show('Title', 'Message');
```

---

### ❌ DON'T DO THIS:
```html
<!-- Not linking shared styles -->
<link rel="stylesheet" href="../css/my-tool.css">
```

### ✅ DO THIS INSTEAD:
```html
<!-- Always link shared styles first -->
<link rel="stylesheet" href="../css/theme.css">
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="../css/my-tool.css">
```

---

### ❌ DON'T DO THIS:
```javascript
// Creating page-specific date formatter
function formatDate(date) {
    // Custom formatting logic
}
```

### ✅ DO THIS INSTEAD:
```javascript
// Check if date-utils exists, or ask to create shared util
// Use: DateUtils.format(date, 'YYYY-MM-DD')
// OR propose: "Should I add formatDate() to date-utils.js?"
```

---

## Utils Proposal Template

When you identify need for a new util, format proposal like this:

```
🔧 NEW UTIL PROPOSAL

Name: [proposed-util-name].js
Location: src/utils/[proposed-util-name].js

Purpose: [Clear description of what it does]

Reason: [Why this should be a shared util vs page-specific code]

Functions:
- functionName1(params) - [description]
- functionName2(params) - [description]

Will be used by:
- [new page name]
- [potentially other pages that could benefit]

Alternative: [Is there an existing util we could extend instead?]

Waiting for approval to create this util.
```

---

## Integration with Context System

When creating new pages, log in `CONTEXT.md`:

```markdown
[2025-10-29 15:30:00] PROPOSED CHANGE
Action: Create new OSD Tracker tool page
Files: src/pages/osd-tracker.html, src/assets/js/osd-tracker.js, src/css/osd-tracker.css (if needed)
Reason: User requested OSD tracking system
Style: Following EECOL-Style rule - matching index.html and cutting records design
Utils: Will use modal.js, printing.js, storage.js
Expected: New page with consistent styling, OSD tracking functionality

[2025-10-29 16:45:00] COMPLETED CHANGE
Action: Created OSD Tracker tool page
Files: 
  - src/pages/osd-tracker.html (new, 250 lines)
  - src/assets/js/osd-tracker.js (new, 180 lines)
  - No tool-specific CSS needed - all styles from shared style.css
Changes: 
  - Matched header/footer from index.html exactly
  - Used Modal util for error messages and confirmations
  - Used Printing util for printing OSD lists
  - Implemented IndexedDB storage for OSD records
  - Responsive design matches other tools
Result: SUCCESS - page renders correctly, styling consistent with other tools
Style Checklist: All items verified ✓
Utils Used: modal.js, printing.js
Next: Add OSD export functionality
```

---

## Quick Reference

### File Locations
- **HTML:** `src/pages/[tool-name].html`
- **JS:** `src/assets/js/[tool-name].js`
- **CSS:** `src/css/` (prefer shared `style.css`)
- **Utils:** `src/utils/[util-name].js`

### Loading Order in HTML
1. `theme.css` (theme variables)
2. `style.css` (shared styles)
3. `[tool-specific].css` (only if needed)
4. Utils scripts (before page JS)
5. Page-specific JS (last)

### Before Creating Anything
1. Check existing pages for similar functionality
2. Review available utils in `src/utils/`
3. Propose new utils before creating
4. Match styling of existing tools exactly

---

## Summary

**Golden Rules:**
1. ✅ Match existing page styles exactly
2. ✅ Use shared CSS (style.css, theme.css)
3. ✅ Always use existing utils, never duplicate
4. ✅ Propose new utils before creating them
5. ✅ Follow established file structure strictly
6. ✅ Education Center pages are exempt (different style system)

**When in doubt:** Look at `index.html` and `cuttingrecords.html` as your style reference.

**Remember:** Consistency across the application is more important than individual page optimization.