# Update-Changelog Workflow

## Purpose
Maintain an accurate, chronological changelog that documents every change, feature, fix, and update to the Wire Tools application. The changelog provides a complete history of the application's evolution.

---

## Critical Rules

### 🚨 NEVER CREATE NEW VERSIONS
- ❌ **NEVER** add a new version section to the changelog
- ✅ **ALWAYS** add changes under the CURRENT LATEST VERSION
- The current version only changes when user explicitly releases a new version
- Current version is: **v0.8.0.1** (located at src/pages/changelog.html)

### 📝 Always Add to Current Version
- Find the topmost version section in the changelog: **Version 0.8.0.1**
- Add ALL changes under that version
- Maintain chronological order (newest entries at the **bottom** of the existing list)

### 🏷️ Always Include Tool Name in Brackets
- Every changelog entry MUST start with tool name in brackets
- Format: `(Tool Name) Description of change`
- Examples:
  - `(Multi Cut Planner) "Appropriate Emoji" Added error handling for invalid inputs`
  - `(OSD Tracker) "Appropriate Emoji" Implemented real-time notifications`
  - `(Cutting Records) "Appropriate Emoji" Fixed date formatting bug`
  - `(Global) "Appropriate Emoji" Updated navigation across all pages`

---

## Changelog Entry Types

### 🎉 Large Changes - NEW FEATURES & NEW TOOLS
**When to use:**
- Brand new tool pages added
- Major feature additions
- Complete rewrites or overhauls
- Significant architecture changes
- New system implementations (auth, sync, etc.)

**Visual Treatment:**
```html
 list closes -->

    
        
            [EMOJI]
            
                NEW TOOL ADDED!
                [TOOL NAME IN CAPS]
                [BRIEF DESCRIPTION]
            
        
        [EMOJI]
    
    
        
            [EMOJI]
            [Feature 1]
            [Detail]
        
        
    
    
        🚀 [EXCITING SUMMARY STATEMENT] 🚀
    


 wrapper -->

    
        [EMOJI]
        [Tool Name] - [Feature Title]
    
    
        [Section Title]
        
            • [Feature]: [Description]
            
        
    
    
        • [Detail]: [Explanation]
        
    
    [Summary paragraph]

```

**Color schemes for banners:**
- Green gradient: New tools, major features
- Blue/Cyan gradient: System upgrades, infrastructure
- Orange/Yellow gradient: Feature expansions
- Purple/Pink gradient: Integration releases

**Examples of Large Changes:**
- New tool: OSD Tracker, Multi Cut Planner
- P2P Synchronization System
- Enterprise Authentication System
- PWA Implementation

---

### 📦 Medium Changes - IMPLEMENTATIONS & ENHANCEMENTS
**When to use:**
- New functionality within existing tools
- Significant improvements to existing features
- Integration of new libraries/utils
- Performance optimizations
- UI/UX improvements

**Visual Treatment:**
```html
 wrapper -->

    
        [EMOJI]
        [Feature Title]
    
    
        (Tool Name) [Change Title]
        
            • [Feature]: [Description]
            • [Feature]: [Description]
        
    
    
        • [Detail]: [Explanation]
        • [Detail]: [Explanation]
    
    [Summary of changes]

```

**Examples of Medium Changes:**
- (Cutting Records) Added export to CSV functionality
- (Multi Cut Planner) Implemented autosave with IndexedDB
- (Wire Calculator) Added support for metric units
- (Global) Implemented dark mode toggle

---

### 🔧 Small Changes - FIXES, UPDATES & TWEAKS
**When to use:**
- Bug fixes
- Minor UI adjustments
- Code cleanup
- Documentation updates
- Small improvements
- Error handling additions
- Accessibility fixes

**Visual Treatment:**
```html
 list -->
(Tool Name) [Brief description of fix/update]: [Additional detail if needed]
```

**Examples of Small Changes:**
```html
(OSD Tracker) Fixed date picker validation error: Date field now properly validates future dates
(Cutting Records) Updated table header styling: Improved readability on mobile devices
(Multi Cut Planner) Corrected calculation rounding: Length calculations now round to 2 decimal places
(Global) Fixed navigation menu on mobile: Menu now properly closes after selection
```

---

## Workflow: Adding Changelog Entries

### Step 1: Identify the Change Type
Before adding to changelog, categorize:
- 🎉 Is this a NEW tool or MAJOR feature? → Large Banner
- 📦 Is this a significant implementation or enhancement? → Medium Box
- 🔧 Is this a fix, update, or small improvement? → Simple Line Entry

### Step 2: Locate Current Version Section
```markdown
1. Open src/pages/changelog.html
2. Find Version 0.8.0.1 section (starts around line 49)
3. This is where your entry goes
4. Do NOT create "Version 0.8.0.2" or any new version
```

### Step 3: Determine Placement Within Version

**For Small Changes (Line Entries):**
- Scroll to the `<ul class="text-sm text-gray-700 list-disc list-inside space-y-1">` section under Version 0.8.0.1
- Add new `<li>` entry at the **BOTTOM** of the list (before `</ul>`)
- Keep chronological order (newest at bottom)

**For Medium/Large Changes:**
- Add **AFTER** the closing `</ul>` tag of the main list
- Insert before the `</div>` that closes the version section
- Keep chronological order (newest changes at bottom)

### Step 4: Format the Entry

**For Large Changes (NEW TOOL):**
```html
<!-- Add after existing  tag, before version section closes -->



    
        
            🎯
            
                NEW TOOL ADDED!
                OSD SHIPMENT TRACKER
                COMPREHENSIVE ORDER MANAGEMENT SYSTEM
            
        
        📦
    
    
        
            📋
            Quick Entry
            Fast Data Input
        
        
            🔔
            Smart Alerts
            Deadline Tracking
        
        
            💾
            IndexedDB Storage
            Offline Access
        
        
            🔄
            Cloud Sync
            Multi-Device
        
    
    
        🚀 Professional OSD tracking system with real-time notifications and comprehensive shipment management! 🚀
    




    
        📦
        OSD Tracker - Complete Feature Set
    
    
        (OSD Tracker) Professional Shipment Management
        
            • Quick Entry Form: Fast data input with customer info, dates, and status tracking
            • Real-Time Notifications: Color-coded alerts for approaching deadlines and overdue shipments
            • Status Management: Track orders through Received, In Production, Ready, and Shipped stages
            • IndexedDB Integration: Offline-first storage with automatic synchronization
        
    
    
        • Search & Filter: Advanced filtering by customer, date range, and shipment status
        • Dashboard View: Visual overview with counts by status and overdue alerts
        • Cloud Sync Ready: Multi-device access with REST API integration
        • Export Capabilities: CSV export for reporting and external analysis
    
    Added complete OSD tracking system enabling professional shipment management with real-time deadline monitoring and comprehensive order oversight.

```

**For Medium Changes (IMPLEMENTATION):**
```html


    
        🔄
        Cloud Sync Implementation
    
    
        (OSD Tracker) REST API Synchronization
        
            • Server Integration: Connected to custom REST API endpoint for data synchronization
            • Conflict Resolution: Timestamp-based merge logic handles concurrent updates
            • Auto-Sync: Configurable sync intervals (30s, 1min, 5min) with manual sync option
        
    
    
        • Delta Sync: Only changed records transmitted for efficient bandwidth usage
        • Error Handling: Automatic retry with exponential backoff on network failures
        • Status Indicators: Visual feedback showing last sync time and connection status
    
    Implemented cloud synchronization system enabling multi-device OSD tracking with automatic conflict resolution and efficient data transfer.

```

**For Small Changes (LINE ENTRY):**
```html
 list at the BOTTOM -->
(OSD Tracker) Fixed date validation to prevent future receipt dates: Date picker now properly restricts selection to past and current dates only
```

### Step 5: Verify Entry Format

**Checklist for EVERY entry:**
- [ ] Tool name in brackets at start: `(Tool Name)`
- [ ] Change description is clear and specific
- [ ] Proper visual treatment for change size (banner/box/line)
- [ ] Added to CURRENT version (v0.8.0.1)
- [ ] Placed at BOTTOM of appropriate section (chronological order)
- [ ] HTML is valid and properly closed
- [ ] No typos or grammar errors
- [ ] Matches existing changelog style exactly

---

## HTML Structure Reference

### Current Version Section Location
```html


    
        📊
        Version 0.8.0.1 - Reel Estimator Enhancement & Multi Cut Planner
    

    
    
        📊 Version 0.8.0.1
        📊 TOOL ENHANCEMENTS
    
    
    
    Feature update: Enhanced reel estimator with industry presets and new multi cut planner tool, plus record management improvements. 🚀
    
    
    
        
    
    
    
    
        📊 Enhanced Reel Estimator: Updated with preset database...
        
        
        
        (Tool Name) Your new change: Description
    
    
    <!-- ✅ ADD MEDIUM/LARGE CHANGES AFTER THIS POINT -->
    
 


```

---

## Change Classification Guide

### 🎉 Large Changes (Banners)

**Always use banners for:**
- ✅ New tool pages (OSD Tracker, Wire Calculator, Multi Cut Planner)
- ✅ Major system implementations (P2P Sync, Authentication, PWA)
- ✅ Complete rebuilds or rewrites
- ✅ Architecture changes affecting multiple tools
- ✅ Enterprise-level features

**Banner Color Schemes:**
```
Green (border-green-400): New tools, successful releases
Blue/Cyan (border-cyan-400): System upgrades, technical improvements
Orange/Yellow (border-orange-400): Feature expansions
Purple/Pink (border-purple-400): Integration releases
```

### 📦 Medium Changes (Boxes)

**Use boxes for:**
- ✅ Significant new functionality in existing tools
- ✅ Major performance improvements
- ✅ Integration of external libraries/utils
- ✅ UI/UX overhauls of specific components
- ✅ Database schema changes
- ✅ API integrations

### 🔧 Small Changes (Lines)

**Use simple lines for:**
- ✅ Bug fixes
- ✅ Minor UI tweaks
- ✅ Text/label updates
- ✅ Code cleanup (no user-visible change)
- ✅ Documentation updates
- ✅ Accessibility improvements
- ✅ Error message improvements
- ✅ Validation additions

---

## Examples by Scenario

### Scenario 1: Created a Brand New Tool

**Step 1:** Create celebration banner
**Step 2:** Add detailed feature section
**Step 3:** Place AFTER existing `</ul>` tag in v0.8.0.1
```html
<!-- After existing changelog list closes  -->


    
        
            🎯
            
                NEW TOOL ADDED!
                CABLE LENGTH CALCULATOR
                AUTOMATED LENGTH OPTIMIZATION SYSTEM
            
        
        📏
    
    
        
            ⚡
            Voltage Drop
            Auto Calculations
        
        
            🔌
            AWG Support
            All Gauges
        
        
            📊
            Multi-Run
            Batch Processing
        
        
            💾
            Save Results
            IndexedDB
        
    
    
        🚀 Professional cable length optimization with automatic voltage drop calculations and multi-run support! 🚀
    

```

### Scenario 2: Added Major Feature to Existing Tool
```html

    
        🔄
        Multi-Device Sync Feature
    
    
        (Cutting Records) Real-Time P2P Synchronization
        
            • Automatic Sync: Records sync across devices within 5 seconds of changes
            • Conflict Resolution: Smart merge algorithm handles simultaneous edits
            • Network Detection: Automatically discovers peers on local network
        
    
    
        • Zero Configuration: No setup required, works immediately on LAN
        • Encrypted Transfer: All data encrypted during transmission
        • Status Indicators: Visual feedback shows connected devices
    
    Implemented real-time P2P synchronization enabling seamless multi-device cutting record management across shop computers and tablets.

```

### Scenario 3: Fixed Bugs and Made Updates
```html
 list -->
(OSD Tracker) Fixed date picker not respecting browser locale settings: Date format now matches user's regional preferences
(OSD Tracker) Corrected search filter to include customer names: Search now properly filters by all text fields
(Cutting Records) Updated table pagination to show 50 records per page: Improved performance and reduced scrolling
(Wire Calculator) Added validation for negative wire lengths: Prevents invalid calculations
(Global) Fixed mobile navigation menu z-index issue: Menu now appears above all content
```

### Scenario 4: Made Multiple Changes in One Session
```html
 list -->
(Inventory Tracker) Fixed quantity validation on stock entry form: Now properly validates numeric input
(Inventory Tracker) Updated low-stock threshold display: Visual indicator shows items below reorder point

<!-- After , add medium change -->

    
        📊
        Barcode Scanning Integration
    
    
        (Inventory Tracker) USB Barcode Scanner Support
        
            • Instant Scanning: Scan product codes directly into inventory fields
            • Auto-Lookup: Automatically populates product details from database
            • Error Handling: Validates scanned codes and provides clear feedback
        
    
    
        • Universal Compatibility: Works with any USB HID barcode scanner
        • Keyboard Wedge: No special drivers required, plug and play
        • Speed Boost: 10x faster data entry compared to manual typing
    
    Added USB barcode scanner support enabling rapid inventory entry with automatic product lookup and validation.

```

---

## Special Cases

### Multiple Tools Affected by Same Change

**Option A: List all tools in medium change box**
```html

    
        🖨️
        Universal Print Utility Integration
    
    
        (Multi Cut Planner, Cutting Records, OSD Tracker) Shared Print System
        
            • Consistent Formatting: All tools use same professional print layout
            • EECOL Branding: Automatic header and footer on all printed documents
            • Print Preview: See before printing with adjustable margins
        
    
    
        • Universal Implementation: Same print functionality across all record-keeping tools
        • PDF Export: Optional save-to-PDF instead of physical printing
        • Mobile Compatible: Works on all devices including tablets
    
    Integrated shared print utility across multiple tools ensuring consistent professional document formatting throughout the application.

```

**Option B: Separate line entries per tool**
```html
(Multi Cut Planner) Integrated shared print utility for reports: Professional formatting with EECOL branding
(Cutting Records) Integrated shared print utility for records: Consistent print layout across tools
(OSD Tracker) Integrated shared print utility for lists: Same print system as other tools
```

Use Option A when change is substantial and identical across tools. Use Option B for simpler integration changes.

### Global/Application-Wide Changes

Use `(Global)` as the tool name:
```html
(Global) Updated all page headers with consistent navigation structure: Unified navigation across entire application
(Global) Fixed mobile responsiveness on screens below 768px: Improved layout on small devices
(Global) Implemented EECOL theme variables across all CSS: Centralized color and spacing management
```

### Breaking Changes

**Use special red banner:**
```html

    
        
            ⚠️
            
                ⚠️ BREAKING CHANGE
                DATABASE SCHEMA UPDATE
                ACTION REQUIRED BEFORE UPDATING
            
        
        🔴
    
    
        
            Action Required: Export all data before updating, then re-import after update completes.
        
        
            Updated IndexedDB schema to version 2 enables P2P synchronization and improves data integrity. Existing data will need migration.
        
    
    
        ⚠️ This change requires user action - see migration guide in documentation ⚠️
    

```

---

## Integration with CONTEXT.md

### Before Adding to Changelog
In CONTEXT.md, log the change first:
```markdown
[2025-10-29 16:30:00] COMPLETED CHANGE
Action: Created OSD Tracker tool
Files: src/pages/osd-tracker.html, src/assets/js/osd-tracker.js
Changes: Complete new tool for tracking on-site delivery orders
Result: SUCCESS - Tool functional, styled consistently, using shared utils
Next: Update changelog with new tool entry

[2025-10-29 16:35:00] CHANGELOG UPDATE
Action: Adding OSD Tracker to changelog under v0.8.0.1
Type: Large Change (New Tool Banner)
Entry Location: src/pages
Entry Location: src/pages/changelog.html - after existing </ul> in v0.8.0.1 section
Entry Type: Large banner with celebration header + detailed feature section
Result: Changelog updated successfully with proper HTML structure
```

---

## Post-Update Checklist

After adding ANY changelog entry:

- [ ] Entry is under CURRENT version (v0.8.0.1)
- [ ] Tool name in brackets at start: `(Tool Name)`
- [ ] Description is clear and specific
- [ ] Proper visual treatment (banner/box/line) for change size
- [ ] Added at BOTTOM of appropriate section (chronological order)
- [ ] HTML is valid and properly closed
- [ ] No typos or grammar errors
- [ ] Matches existing changelog style exactly
- [ ] Change logged in CONTEXT.md
- [ ] Git commit includes changelog update

### Git Commit Message Format
```
[CHANGELOG] Add (Tool Name) [change type]

(Tool Name) [Brief description of change]

See changelog.html v0.8.0.1 and CONTEXT.md [timestamp]

Version Release Process
ONLY when user explicitly releases new version:

User says: "Release version 0.8.0.2" or "Bump version to 0.8.0.2"
Create NEW version section at TOP of changelog
Copy the v0.8.0.1 section structure as template
Update all version numbers and metadata
Leave v0.8.0.1 section as-is (becomes historical record)
Log in CONTEXT.md:

markdown[2025-10-29 17:00:00] VERSION RELEASE
Action: Released version v0.8.0.2
Changes: Created new version section in changelog
Files: src/pages/changelog.html, version metadata files
Result: Version officially released, all future changes go under v0.8.0.2
Next: Continue adding changes to v0.8.0.2
Otherwise: NEVER create new version sections!

Common Mistakes to Avoid
❌ DON'T DO THIS:
Wrong - Creating new version:
html<!-- Version 0.8.0.2 - NEW TOOL ADDITIONS -->
<div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
    <!-- WRONG! Only user can create new versions -->
Wrong - Tool name not in brackets:
html<li><strong>OSD Tracker: Fixed date validation</strong></li>
Wrong - Missing tool name entirely:
html<li><strong>Fixed date validation issue</strong></li>
Wrong - Adding to wrong version:
html<!-- Adding to v0.8.0.0 instead of v0.8.0.1 -->
Wrong - Chronological order reversed (newest at top):
html<ul>
    <li><strong>(Tool) Today's change</strong></li> <!-- WRONG POSITION -->
    <li><strong>(Tool) Yesterday's change</strong></li>
    <li><strong>(Tool) Last week's change</strong></li>
</ul>
✅ DO THIS INSTEAD:
Correct - Adding to current version:
html<!-- Find v0.8.0.1 section, add at bottom of <ul> list -->
<li><strong>(OSD Tracker) Fixed date validation to prevent future receipt dates:</strong> Date picker now properly restricts selection</li>
Correct - Tool name in brackets:
html<li><strong>(OSD Tracker) Fixed date validation:</strong> Description</li>
Correct - Chronological order (newest at bottom):
html<ul>
    <li><strong>(Tool) Last week's change</strong></li>
    <li><strong>(Tool) Yesterday's change</strong></li>
    <li><strong>(Tool) Today's change</strong></li> <!-- CORRECT POSITION -->
</ul>

Quality Standards
✅ Good Changelog Entries
Clear and Specific:
html✅ <li><strong>(OSD Tracker) Fixed date validation to prevent future receipt dates:</strong> Date picker now properly restricts selection to past and current dates only</li>

✅ <li><strong>(Cutting Records) Added CSV export with customizable column selection:</strong> Users can now choose which fields to include in exported data</li>

✅ <li><strong>(Multi Cut Planner) Implemented autosave every 30 seconds to prevent data loss:</strong> Unsaved changes automatically persist to IndexedDB</li>
Explains Impact:
html✅ <li><strong>(OSD Tracker) Added color-coded status indicators:</strong> Makes it easier to identify overdue shipments at a glance with visual red/yellow/green system</li>

✅ <li><strong>(Wire Calculator) Improved calculation speed by 3x through algorithm optimization:</strong> Complex calculations now complete in under 100ms</li>
❌ Bad Changelog Entries
Too Vague:
html❌ <li><strong>(OSD Tracker) Fixed bug</strong></li>
❌ <li><strong>(Cutting Records) Updated stuff</strong></li>
❌ <li><strong>(Multi Cut Planner) Made changes</strong></li>
Missing Tool Name:
html❌ <li><strong>Added new feature</strong></li>
❌ <li><strong>Fixed the date picker</strong></li>
❌ <li><strong>Updated styling</strong></li>
Wrong Format:
html❌ <li><strong>Fixed date picker in OSD Tracker</strong></li> <!-- Tool name not in brackets -->
❌ <li><strong>OSD Tracker: Fixed date picker</strong></li> <!-- Wrong separator -->
❌ <li><strong>osd tracker - fixed date picker</strong></li> <!-- Not capitalized, wrong format -->

HTML Validation
Required HTML Structure Elements
For Large Banners:

Opening <div> with proper gradient and border classes
Nested flex containers for layout
Grid with 4 feature boxes (2x2 on mobile, 4x1 on desktop)
Closing summary paragraph
Properly closed all tags

For Medium Boxes:

Opening wrapper <div> (no special classes)
Header section with emoji and title
Content box with white background
Bulleted details list
Summary paragraph
All tags properly closed

For Line Entries:

Opening <li> tag
<strong> tags around (Tool Name) and title
Closing </li> tag
Must be inside <ul> list

Common HTML Errors to Avoid
html❌ Unclosed tags:
<div>
    <p>Text
</div>

✅ Properly closed:
<div>
    <p>Text</p>
</div>

❌ Missing closing bracket:
<div class="bg-white"

✅ Proper syntax:
<div class="bg-white">

❌ Nested incorrectly:
<strong><div>Text</div></strong>

✅ Correct nesting:
<div><strong>Text</strong></div>
```

---

## Quick Reference

### File Location
**Changelog:** `src/pages/changelog.html`
**Current Version:** v0.8.0.1 (starts around line 49)

### Entry Locations
- **Small changes (lines):** Add to `<ul>` list at BOTTOM
- **Medium/Large changes:** Add AFTER `</ul>` closes, before version section ends

### Format Template
```
(Tool Name) Description of change
```

### Change Type Decision Tree
```
Is it a NEW TOOL or MAJOR SYSTEM?
└─ YES → Large Banner
└─ NO ↓

Is it SIGNIFICANT NEW FUNCTIONALITY?
└─ YES → Medium Box
└─ NO ↓

Is it a FIX, UPDATE, or SMALL CHANGE?
└─ YES → Simple Line Entry
Color Schemes

Green: New tools, successful releases
Blue/Cyan: System upgrades, technical improvements
Orange/Yellow: Feature expansions
Purple/Pink: Integration releases
Red: Breaking changes, critical updates


Summary
Golden Rules:

✅ Always add to CURRENT version (v0.8.0.1)
✅ Always include tool name in brackets: (Tool Name)
✅ Always use appropriate visual treatment (banner/box/line)
✅ Always add at BOTTOM of section (chronological order - newest last)
✅ Always match existing HTML structure exactly
❌ NEVER create new version sections without explicit user request

Entry Type Quick Reference:

🎉 Large Banner → New tools, major features
📦 Medium Box → Implementations, enhancements
🔧 Simple Line → Fixes, updates, small changes

Format:
html<li><strong>(Tool Name) Description:</strong> Additional detail</li>
Remember: The changelog documents the application's story. Every entry should be clear, accurate, and follow the established format exactly. When in doubt, look at existing entries as examples.

Troubleshooting
"Where do I add my entry?"

Open src/pages/changelog.html
Search for "Version 0.8.0.1"
For line entries: Scroll down to find <ul class="text-sm text-gray-700 list-disc list-inside space-y-1">
Add your <li> entry at the very BOTTOM, before </ul>
For banners/boxes: Add AFTER the </ul> closes

"What color should I use?"

New tool → Green gradient (border-green-400)
System upgrade → Blue/Cyan gradient (border-cyan-400 or border-blue-400)
Feature expansion → Orange/Yellow gradient (border-orange-400)
Integration → Purple/Pink gradient (border-purple-400)
Breaking change → Red gradient (border-red-400)

"How do I know if it's large/medium/small?"

Large: Would you announce this in a team meeting? → Banner
Medium: Is this a new capability worth explaining? → Box
Small: Is this a quick fix or minor tweak? → Line

"The HTML isn't rendering correctly"

Check all tags are closed: Every <div> needs </div>
Check all quotes are closed: class="..." not class="...
Check nesting is correct: Don't put block elements inside <strong>
Copy structure from existing similar entry and modify it


Final Checklist
Before committing changelog update:

 Entry added to v0.8.0.1 (current version)
 Tool name in brackets: (Tool Name)
 Entry added at BOTTOM of appropriate section
 Visual treatment matches change size
 HTML is valid (all tags closed)
 No typos or grammar errors
 Matches existing entry style
 Change logged in CONTEXT.md
 File saved and ready to commit

Remember: Consistency is key. Always follow the established patterns, and when unsure, look at existing similar entries as examples. The changelog is a historical record - accuracy and clarity matter!

---

This comprehensive workflow rule covers:
- ✅ Emphasizes NEVER creating new versions
- ✅ Clear classification system (large/medium/small)
- ✅ Specific HTML structure examples matching changelog.html
- ✅ Tool name in brackets requirement with examples
- ✅ Chronological ordering (newest at BOTTOM)
- ✅ Multiple real-world examples
- ✅ Integration with CONTEXT.md
- ✅ Quality standards with good vs bad examples
- ✅ Special cases (global changes, breaking changes, etc.)
- ✅ HTML validation guidelines
- ✅ Troubleshooting section
- ✅ Complete quick reference

The rule file is specifically tailored to your changelog's structure and style!