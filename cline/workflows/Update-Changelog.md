description: Defines my mandatory protocol for maintaining an accurate, chronological changelog of every change to the Wire Tools application, ensuring complete historical transparency and evolution tracking.
author: Grok (adapted for Wire Tools)
version: 1.0
tags: ["protocol", "changelog", "documentation", "history", "maintenance", "core-workflow", "memory-bank"]
globs: ["src/pages/changelog.html", "memory-bank/**/*.md"]
My Wire Tools Changelog Maintenance Protocol
Objective: I proactively ensure the changelog in src/pages/changelog.html remains a precise, chronological record of every feature, fix, enhancement, and update across the Wire Tools application. This protocol mandates structured entries under the current version, visual treatments matched to change scale, and strict rules to preserve history—vital for transparency, debugging, and showcasing progress without redundancy or errors. All planning, reflection, and audit trails are captured in my Memory Bank, which I read fully at the start of every session.
Core Principle: Accuracy and consistency are mandatory. I must execute this protocol for every change—whether a new tool, implementation, or minor fix—before considering any task complete. Trivial non-user-facing adjustments may be exempt only if they produce no observable impact; otherwise, logging is default. I never create new versions unless the user explicitly commands a release.
Current Version (Pinned): v0.8.0.1 (I verify this in src/pages/changelog.html; it only advances on explicit user release.)
Memory Bank Integration:
All change planning, reflection, and audit trails live in memory-bank/activeContext.md and memory-bank/progress.md. I must update these files before modifying the changelog. This ensures continuity across my session resets.

1. Mandatory Pre-Update Reflection & Change Classification
Before adding any entry to src/pages/changelog.html, I must perform the following internal steps:
1.1. Change Review & Classification:

Review the implemented change (code diffs, artifacts, user impact).
Identify Scale & Type:

Brand-new tool, major system overhaul, or architecture shift? → Large (Banners)
Significant new functionality, integration, or optimization in an existing tool? → Medium (Boxes)
Bug fix, UI tweak, validation, or minor improvement? → Small (Lines)


Identify Tool Scope: Which tool(s) does this affect? Use (Global) for app-wide changes. For multi-tool identical impacts, prefer consolidated medium boxes.
Identify Key Details: What exact user benefit or resolution? Include emojis, clear descriptions, bullet points for features/details, and summaries. What core impact or pattern does this reveal for future reference?

1.2. Logging to Memory Bank (activeContext.md & progress.md):

First, create a timestamped, change-referenced entry in memory-bank/activeContext.md detailing:

Action taken
Files modified
Result (success/failure)
Planned changelog entry (type, location, structure)


Then, update memory-bank/progress.md to reflect current status and next steps.
These entries serve as my raw audit trail and continuity anchor before HTML integration.

Example Entry in memory-bank/activeContext.md:
---
Date: 2025-11-01
Task: Implement autosave in Multi Cut Planner

**Change Summary**
- Added IndexedDB persistence every 30s with change detection
- Files: `src/assets/js/multi-cut-planner.js`, `src/pages/multi-cut-planner.html`
- Result: SUCCESS - Prevents data loss, tested offline/online

**Changelog Plan**
- Type: Medium Change (Box)
- Location: After `</ul>` in v0.8.0.1 section
- Structure: `🔄` header, bulleted features/details, summary
- Entry: "(Multi Cut Planner) Autosave Implementation"

**Next Steps**
- Add changelog entry
- Test edge cases (rapid edits, tab close)
---
Example Update in memory-bank/progress.md:
### Current Status
- [x] Autosave implemented and tested
- [ ] Changelog entry added
- [ ] Edge case testing complete

2. Changelog Entry Creation & Integration Process
I add entries directly to src/pages/changelog.html under v0.8.0.1, maintaining chronological order (newest at bottom). I never create new version sections.
2.1. Locate Current Version Section:

Open src/pages/changelog.html.
Find the Version 0.8.0.1 section (topmost, starts ~line 49).
For small changes: Target the <ul class="text-sm text-gray-700 list-disc list-inside space-y-1">.
For medium/large: Insert after </ul> but before the version section's closing </div>.

2.2. Craft and Insert Entry by Type:
Large Changes (Banners - New Tools/Major Features):

Use celebration banner with gradient border (green for new tools, etc.).
Include 2x2 feature grid, summary statement.
Pattern:

<!-- Insert after </ul>, before version close -->

<div class="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-400 shadow-md">
    <div class="flex items-center gap-3 mb-4">
        <span class="text-4xl">Target</span>
        <div>
            <h3 class="text-xl font-bold text-green-800">NEW TOOL ADDED!</h3>
            <p class="text-lg font-semibold text-green-700">CABLE LENGTH CALCULATOR</p>
            <p class="text-green-600">AUTOMATED LENGTH OPTIMIZATION SYSTEM</p>
        </div>
        <span class="text-4xl">Ruler</span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3">
            <span class="text-2xl">Lightning</span>
            <div>
                <p class="font-medium">Voltage Drop</p>
                <p class="text-sm text-gray-600">Auto Calculations</p>
            </div>
        </div>
        <!-- Repeat for 3 more features -->
    </div>
    
    <p class="text-center text-lg font-bold text-green-800">Professional cable length optimization with automatic voltage drop calculations and multi-run support!</p>
</div>

<div class="mt-6 p-5 bg-white rounded-lg border border-gray-200">
    <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">Package</span>
        <h4 class="text-lg font-semibold">Cable Length Calculator - Complete Feature Set</h4>
    </div>
    
    <p class="font-medium mb-2">(Cable Length Calculator) Professional Length Optimization</p>
    <ul class="space-y-2 text-sm">
        <li>• <strong>Voltage Drop Engine:</strong> Real-time calculations with AWG and load inputs</li>
        <!-- More bullets -->
    </ul>
    
    <p class="mt-4 text-sm text-gray-700">
        Added professional cable length calculator with voltage drop analysis, multi-run batching, and export capabilities.
    </p>
</div>
Medium Changes (Boxes - Implementations/Enhancements):

Use clean box with emoji header, bulleted sections, summary.
Pattern:

<div class="mt-8 p-5 bg-white rounded-lg border border-gray-200">
    <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">Cycle</span>
        <h4 class="text-lg font-semibold">Autosave Implementation</h4>
    </div>
    
    <p class="font-medium mb-2">(Multi Cut Planner) Real-Time Persistence</p>
    <ul class="space-y-2 text-sm">
        <li>• <strong>Auto-Save Interval:</strong> Every 30 seconds with change detection</li>
        <li>• <strong>IndexedDB Storage:</strong> Full offline support with sync on reconnect</li>
    </ul>
    
    <p class="mt-4 text-sm text-gray-700">
        Implemented automatic saving system preventing data loss during extended planning sessions.
    </p>
</div>
Small Changes (Lines - Fixes/Updates):

Add <li> at bottom of <ul>.
Format: ([Tool Name]) [Brief description]: [Additional detail]
Pattern:

<!-- Add to bottom of <ul> before </ul> -->
<li><strong>(Multi Cut Planner) Fixed calculation rounding error:</strong> Length values now round to 2 decimal places consistently across all units</li>
2.3. Ensure Chronological & Structural Integrity:

Always add at bottom of the relevant section.
Validate HTML: All tags closed, classes exact, nesting correct.
Match existing style precisely—no deviations.


3. Guidelines for Changelog Content
These guidelines apply to every entry I create:

Prioritize Clarity & Specificity: Every entry starts with ([Tool Name]), uses appropriate emoji, explains impact precisely. What exact problem was solved or value added?
Be Concise & Visual: Match change scale to treatment; use bullets for scannability; keep summaries punchy.
Strive for Historical Accuracy: Document in a way that future-me (post-reset) can trace evolution. Include user-facing benefits.
Enforce Rules Strictly: No new versions. Tool in brackets. Chronological (newest bottom). Valid HTML.
Organize for Readability: Use consistent gradients:

Green (border-green-400): New tools/releases
Blue/Cyan (border-cyan-400): System/infrastructure
Orange/Yellow (border-orange-400): Feature expansions
Purple/Pink (border-purple-400): Integrations
Red (border-red-400): Breaking changes


Reduce Redundancy: Consolidate multi-tool changes when substantial.
Support Transparency: The ultimate goal is a trustworthy history—avoid vague entries, prevent bloat, ensure every change is accounted for.


4. Version Release Process (User-Triggered Only)
I only create new version sections when the user explicitly says: "Release version 0.8.0.2" or similar.

Copy v0.8.0.1 structure as template.
Insert at top of changelog.
Update all version metadata.
Leave prior versions intact.
Log in memory-bank/activeContext.md and memory-bank/progress.md:

[2025-11-01 15:00:00] VERSION RELEASE
Action: Released v0.8.0.2
Changes: New top section in changelog.html
Result: Future entries now under v0.8.0.2

Final Checklist (Before Commit)
I must verify:

 Memory Bank updated (activeContext.md, progress.md)
 Entry under v0.8.0.1 (or new version post-release)
 Starts with ([Tool Name])
 Description clear, specific, impactful
 Visual treatment matches scale
 Added at bottom (chronological)
 HTML valid, closed, styled exactly
 No typos/grammar
 Git commit: [CHANGELOG] Add ([Tool Name]) [type]


Golden Rules I Live By:
✅ Always current version • ✅ Tool in brackets • ✅ Scale-matched visuals • ✅ Bottom placement • ✅ Exact style match • ✅ Memory Bank updated first
❌ NEVER new version without user command
Change Type Decision Tree:
textNew tool or major system?
└─ YES → Large Banner
└─ NO ↓
Significant functionality/enhancement?
└─ YES → Medium Box
└─ NO ↓
Fix, tweak, or small improvement?
└─ YES → Line Entry
Troubleshooting Reminders for Myself:

"Where to add?" → Search "Version 0.8.0.1" → small in <ul>, others after </ul>.
"HTML broken?" → Copy existing entry, modify, validate nesting/quotes.
"Unsure of scale?" → Would I announce this? → Banner. Worth explaining? → Box. Quick note? → Line.
"Did I update Memory Bank?" → ALWAYS check activeContext.md and progress.md first.

Consistency is my foundation. I treat the changelog as the application’s story—every entry precise, every rule followed, every change immortalized accurately. When in doubt, I mirror existing entries exactly. My Memory Bank is my memory; the changelog is the truth.