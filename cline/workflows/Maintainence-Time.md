# Maintenance-Time Workflow

## Purpose
Systematically crawl the codebase to identify redundant code, unused functions, optimization opportunities, and potential errors. Document all findings and actions in the Maintenance page.

---

## When to Run Maintenance

### Scheduled Maintenance
- After major feature additions
- Before version releases
- Monthly routine maintenance
- When performance degrades
- After significant refactoring

### Trigger Phrases
User says any of:
- "Run maintenance"
- "Code cleanup time"
- "Scan for issues"
- "Maintenance check"
- "Audit the code"

---

## Pre-Maintenance Checklist

Before starting ANY maintenance session:

1. **Read Current Maintenance Page**
   - Location: `src/pages/maintenance.html` (or wherever it's located)
   - Note current version number
   - Review existing todos and known issues
   - Check last maintenance date

2. **Update CONTEXT.md**
```markdown
   [YYYY-MM-DD HH:MM:SS] SESSION START - MAINTENANCE
   Type: [Scheduled / User-Requested / Pre-Release]
   Current Version: [e.g., v0.8.0.1]
   Last Maintenance: [date from maintenance page]
   Scope: [Full codebase / Specific component]
```

3. **Create Maintenance Session Log**
   Start a structured log that will be added to maintenance page:
```markdown
   📅 [Date] - [Maintenance Type] Code Review
   Assessed: [What was scanned]
   Findings: [Summary of issues found]
   Actions: [What was fixed/added to todos]
```

---

## Maintenance Crawl Procedure

### Phase 1: File Inventory & Structure Analysis

**Step 1.1: Map the Codebase**
```markdown
Scan directories:
- src/pages/ → List all HTML files
- src/assets/js/ → List all JS files  
- src/css/ → List all CSS files
- src/utils/ → List all utility files
- Root files → Check for config files, manifests, service workers

Document in session log:
- Total file count per directory
- New files since last maintenance
- Files that might be obsolete
- Any Un-Needed/Un-Nessecary Debugging code. if unsure ask user if debugging is still required for debug code you find.
```

**Step 1.2: Check File Relationships**
```markdown
For each HTML file, verify:
- Which CSS files are linked
- Which JS files are loaded
- Which utils are imported
- Are all linked files actually present?

Look for:
❌ Dead links (404 references)
❌ Unused CSS/JS files (not linked anywhere)
❌ Duplicate imports
```

### Phase 2: Code Quality Scan

**Step 2.1: JavaScript Analysis**

Scan EACH .js file for:

**🔴 Critical Issues (Fix Immediately)**
- ❌ Syntax errors
- ❌ Undefined variables used
- ❌ Functions called but not defined
- ❌ Missing dependencies (utils not loaded)
- ❌ Race conditions in async code
- ❌ Unhandled promise rejections
- ❌ Console errors in browser testing

**🟡 High Priority (Add to Todos)**
- ⚠️ Unused functions (defined but never called)
- ⚠️ Duplicate code across files
- ⚠️ Hard-coded values that should be constants
- ⚠️ Missing error handling (try-catch)
- ⚠️ Functions longer than 50 lines (refactor candidates)
- ⚠️ Complex nested logic (>3 levels deep)
- ⚠️ TODO/FIXME comments in code

**🟢 Medium Priority (Optimization Opportunities)**
- 💡 Inefficient loops (O(n²) when O(n) possible)
- 💡 Repeated DOM queries (cache selectors)
- 💡 Large functions that could be split
- 💡 Magic numbers without explanation
- 💡 Inconsistent naming conventions
- 💡 Missing JSDoc comments
- 💡 console.log statements left in production code

**Step 2.2: CSS Analysis**

Scan CSS files for:

**🔴 Critical Issues**
- ❌ Syntax errors
- ❌ Invalid properties
- ❌ Broken @import statements

**🟡 High Priority**
- ⚠️ Unused CSS classes (defined but never used in HTML)
- ⚠️ Duplicate selectors
- ⚠️ !important overuse
- ⚠️ Inline styles in HTML (should be in CSS)
- ⚠️ Non-responsive units (px instead of rem/em where appropriate)

**🟢 Medium Priority**
- 💡 CSS that could use variables (--var-name)
- 💡 Repeated color/spacing values (create theme variables)
- 💡 Long selector chains (>4 levels)
- 💡 Overly specific selectors

**Step 2.3: HTML Analysis**

Scan HTML files for:

**🔴 Critical Issues**
- ❌ Syntax errors
- ❌ Missing required attributes (alt text on images, etc.)
- ❌ Broken internal links
- ❌ Invalid HTML structure

**🟡 High Priority**
- ⚠️ Accessibility issues (missing ARIA labels, semantic HTML)
- ⚠️ Duplicate IDs
- ⚠️ Unused elements (display:none with no JS toggling)
- ⚠️ Inline event handlers (use addEventListener instead)

**🟢 Medium Priority**
- 💡 Missing meta tags
- 💡 Non-semantic HTML (too many divs)
- 💡 Images without width/height (causes layout shift)

### Phase 3: Utility & Module Analysis

**Step 3.1: Utils Audit**

For each file in `src/utils/`:
```markdown
Check:
1. Is this util actually used? (Search codebase for imports/usage)
2. Are all functions in this util used?
3. Is there duplicate functionality across utils?
4. Are utils properly documented?
5. Do utils have error handling?

Document:
- Unused utils → Candidate for removal
- Unused functions within utils → Candidate for removal  
- Missing documentation → Add to todos
```

**Step 3.2: Dependency Check**
```markdown
Verify external dependencies:
- Are all CDN links working?
- Are versions specified (not using 'latest')?
- Are there unused library imports?
- Any security vulnerabilities in versions?

Check for:
- Gun.js version and configuration
- IndexedDB wrapper libraries
- Chart libraries
- Any other external scripts
```

### Phase 4: Performance Analysis

**Step 4.1: Asset Size Check**
```markdown
Check file sizes:
- Large JS files (>100KB) → Optimization candidate
- Large CSS files (>50KB) → Optimization candidate  
- Uncompressed images → Should be optimized
- Duplicate images → Should be deduplicated

Tools to use:
- File system ls -lh
- Browser DevTools Network tab
- Lighthouse audit
```

**Step 4.2: Load Performance**
```markdown
Test each page:
1. Open in browser with DevTools
2. Check Network tab for load times
3. Run Lighthouse audit
4. Note any performance warnings

Look for:
- Render-blocking resources
- Unused CSS/JS being loaded
- Missing lazy loading on images
- Inefficient resource loading order
```

### Phase 5: Security & Best Practices

**Step 5.1: Security Scan**
```markdown
Check for:
❌ Exposed API keys or credentials
❌ Insecure localStorage usage (sensitive data)
❌ Missing input validation
❌ XSS vulnerabilities (innerHTML with user input)
❌ eval() usage
❌ document.write() usage

Verify:
✅ All user inputs are validated/sanitized
✅ Authentication is properly implemented
✅ Sessions are secure
✅ HTTPS is enforced (if applicable)
```

**Step 5.2: Best Practices Check**
```markdown
Verify:
- Consistent code style across files
- Proper error handling everywhere
- All promises have .catch() or try-catch
- No blocking synchronous operations
- Proper use of async/await
- Event listeners are cleaned up
- No memory leaks (event listener accumulation)
```

---

## Maintenance Session Log Template

As you scan, maintain this structured log:
```markdown
📅 [October 29, 2025] - [Routine] Code Review
Version: v0.8.0.1
Assessed: [List what was scanned - e.g., "All 13 HTML files, 8 JS files, 4 utils"]

🔴 CRITICAL ISSUES FOUND & FIXED:
1. [Issue description] → [Fix applied] → [File: location]
2. [Issue description] → [Fix applied] → [File: location]
Total Critical: [X] (All Fixed ✅)

🟡 HIGH PRIORITY ISSUES (Added to Todos):
1. [Issue description] → [Action needed] → [File: location]
2. [Issue description] → [Action needed] → [File: location]  
Total High Priority: [X]

🟢 OPTIMIZATION OPPORTUNITIES (Added to Todos):
1. [Optimization description] → [Potential benefit] → [File: location]
2. [Optimization description] → [Potential benefit] → [File: location]
Total Optimizations: [X]

📊 CODE HEALTH METRICS:
- Files Scanned: [X]
- Lines of Code: [~X] (estimated)
- Unused Code Removed: [X lines/functions]
- Duplicate Code Found: [X instances]
- Performance Score: [X/100] (Lighthouse average)

✅ IMPROVEMENTS MADE:
- Removed [X] unused functions
- Cleaned up [X] dead code blocks
- Fixed [X] accessibility issues
- Optimized [X] performance bottlenecks
- Updated [X] outdated dependencies

📈 SCORE ASSESSMENT:
Overall Code Quality: [X/100] - [Grade: Excellent/Good/Needs Work]
Assessment: [Brief summary of codebase health]

🔄 NEXT MAINTENANCE:
Recommended: [Date/timeframe]
Focus Areas: [What to prioritize next time]
```

---

## Updating the Maintenance Page

### Step 1: Determine Update Type

**New Assessment Section (Major Maintenance)**
Add new dated section under "Enterprise Architecture & Audit History":
```html
📅 [Date] - [Maintenance Type] Code Review
Version: v0.X.X.X
Assessed: [What was scanned]
Findings: [Summary]
Actions: [What was done]
```

**Update Existing Todos (Routine Maintenance)**
Modify the appropriate priority section:
- 🔴 High Priority
- 🟡 Medium Priority  
- 🟢 Low Priority

### Step 2: Add or Remove Todos

**Adding New Todos:**
```html
🔴 High Priority

    [Todo Title]
    [Description of issue and why it matters]
    Location: [File path]
    Estimated Effort: [Small/Medium/Large]

```

**Marking Todos Complete:**
- Move from todo section to "✅ COMPLETE" in roadmap table
- OR add ✅ checkmark if keeping in history
- Add completion date

**Removing Obsolete Todos:**
- If issue no longer relevant, note why:
```html
[Old todo] - No longer applicable: [reason]
```

### Step 3: Update Status Indicators

**Update Assessment Score:**
```html

    [New Score]/100
    🏆 [Grade]

```

**Update Roadmap Table:**
Add rows for new components or update status:
```html

    ✅ COMPLETE  
    [Component Name]
    [Priority]
    [Version]

```

**Update Last Review Date:**
```html
Date: [Current Date]
Status: ✅ Complete - [Brief status]
Next Review: [When to do this again]
```

---

## CONTEXT.md Logging

Throughout maintenance session, log in CONTEXT.md:

### During Maintenance
```markdown
[2025-10-29 14:00:00] MAINTENANCE SESSION - PHASE 1
Action: File inventory and structure analysis
Files: Scanning src/pages/, src/assets/js/, src/css/, src/utils/
Status: IN PROGRESS

[2025-10-29 14:15:00] MAINTENANCE FINDING
Type: 🔴 CRITICAL
Issue: Undefined function called in osd-tracker.js line 89
File: src/assets/js/osd-tracker.js
Impact: Page breaks when sync button clicked
Action: Will fix immediately

[2025-10-29 14:18:00] MAINTENANCE FIX APPLIED
Issue: Undefined function in osd-tracker.js
Fix: Added missing import for syncToServer() from sync-utils.js
Result: SUCCESS - Function now defined, sync button works
Test: Manually tested sync functionality

[2025-10-29 14:30:00] MAINTENANCE FINDING
Type: 🟡 HIGH PRIORITY
Issue: Unused function calculateDeprecatedValue() in cutting-records.js (lines 234-267)
File: src/assets/js/cutting-records.js
Impact: 33 lines of dead code, maintenance burden
Action: Added to High Priority todos on maintenance page

[2025-10-29 15:00:00] MAINTENANCE SESSION - PHASE 4 COMPLETE
Action: Performance analysis complete
Findings: 3 critical issues fixed, 8 high priority todos added, 12 optimizations identified
Files Modified: 3 (fixed critical issues)
Maintenance Page: Updated with new findings and assessment

[2025-10-29 15:05:00] SESSION END - MAINTENANCE
Duration: 1 hour 5 minutes
Results:
  - Critical Issues: 3 found, 3 fixed ✅
  - High Priority Todos: 8 added
  - Optimizations Identified: 12
  - Code Quality Score: 97/100 (improved from 95)
  - Maintenance Page: Updated with assessment
Next Maintenance: Recommended in 30 days or before v0.8.1.0 release
```

---

## Post-Maintenance Checklist

After completing maintenance session:

- [ ] All critical issues fixed or documented
- [ ] Maintenance page updated with new assessment
- [ ] Todos added/removed appropriately
- [ ] Score updated (if applicable)
- [ ] Roadmap updated (if applicable)
- [ ] Last review date updated
- [ ] Next review date suggested
- [ ] CONTEXT.md fully logged with all findings and fixes
- [ ] All modified files tested
- [ ] Git commit with maintenance summary

### Git Commit Message Format
```
[MAINTENANCE] Code quality review - v0.X.X.X

- Fixed [X] critical issues
- Added [X] high priority todos
- Identified [X] optimization opportunities
- Code quality score: [X/100]

See CONTEXT.md [timestamp] and maintenance.html for details
```

---

## Special Maintenance Scenarios

### Pre-Release Maintenance
Before any version release:
1. Full codebase scan (all phases)
2. Fix ALL critical issues
3. Update version number in maintenance page
4. Document release readiness
5. Update roadmap with completed items

### Post-Major-Feature Maintenance
After adding significant features:
1. Focus on new files and dependencies
2. Check integration with existing code
3. Look for duplicate functionality
4. Verify utils are being used properly
5. Update maintenance page with new components

### Emergency Maintenance
If user reports bugs:
1. Scan related files immediately
2. Document bug in maintenance page
3. Fix and test
4. Log in CONTEXT.md
5. Add to maintenance history

---

## Quality Standards

### Code Quality Score Criteria

**98-100: 🏆 Enterprise Grade**
- Zero critical issues
- Minimal technical debt
- Excellent documentation
- Optimal performance
- Best practices throughout

**90-97: ✅ Excellent**
- No critical issues
- Minor optimization opportunities
- Good documentation
- Strong performance
- Mostly best practices

**80-89: ⚠️ Good**
- Few critical issues (fixed during maintenance)
- Some technical debt
- Adequate documentation
- Acceptable performance
- Some best practice gaps

**70-79: 🔴 Needs Attention**
- Multiple critical issues
- Significant technical debt
- Poor documentation
- Performance concerns
- Many best practice violations

**Below 70: 🚨 Requires Immediate Action**
- Numerous critical issues
- Heavy technical debt
- Missing documentation
- Poor performance
- Fundamental issues

---

## Maintenance Reporting Template

After each maintenance session, provide user with summary:
```
🛠️ MAINTENANCE SESSION COMPLETE

📊 Session Summary:
Duration: [X hours/minutes]
Scope: [What was scanned]
Version: [Current version]

🔍 Findings:
🔴 Critical Issues: [X] found, [X] fixed
🟡 High Priority: [X] added to todos
🟢 Optimizations: [X] identified

✅ Improvements Made:
- [List what was actually fixed]
- [Lines of code removed]
- [Performance improvements]

📈 Code Quality:
Before: [X/100]
After: [X/100]
Grade: [Grade and assessment]

📄 Documentation:
- Maintenance page updated ✅
- CONTEXT.md fully logged ✅
- [X] todos added
- [X] todos completed

🔄 Next Steps:
1. [Immediate action items if any]
2. [Suggested priorities from todos]
3. Next maintenance: [Recommended date]

Full details logged in CONTEXT.md at [timestamp]
```

---

## Key Principles

1. **Be Thorough** - Scan everything, miss nothing
2. **Document Everything** - Every finding goes in CONTEXT.md
3. **Fix Critical First** - Don't add critical issues to todos, fix them
4. **Update Faithfully** - Maintenance page must always reflect reality
5. **Test Fixes** - Never assume a fix works, test it
6. **Preserve History** - Never delete maintenance history, only add
7. **Be Honest** - Score should reflect actual code quality
8. **Think Long-term** - Identify technical debt before it becomes critical

---

## Summary

**Maintenance Workflow:**
1. Read current maintenance page
2. Update CONTEXT.md with session start
3. Systematically crawl codebase (all 5 phases)
4. Fix critical issues immediately
5. Document all findings in CONTEXT.md
6. Update maintenance page with assessment
7. Provide summary to user
8. Commit changes with proper message

**Remember:** Maintenance isn't just about finding problems—it's about keeping the codebase healthy, documented, and improving over time.

The maintenance page is the project's health record. Keep it accurate, detailed, and up-to-date.