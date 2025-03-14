# Diet Bot Bug Tracking System

This directory contains a structured system for tracking bugs and errors in the Diet Bot application.

## Directory Structure

- `BUG_TRACKING_LOG.md` - Main log file that summarizes all bugs
- `BUG_LOG_TEMPLATE.md` - Template to use when creating new bug reports
- `bug_reports/` - Directory containing individual detailed bug reports

## How to Use This System

### When You Discover a Bug

1. Open `BUG_TRACKING_LOG.md`
2. Add a new entry to the Bug Summary Table with the next available Bug ID
3. Create a copy of `BUG_LOG_TEMPLATE.md` in the `bug_reports` directory with the filename format `BUG-XXX.md`
4. Fill out all relevant sections of the bug report
5. Update the link in the Bug Tracking Log

### When You Fix a Bug

1. Update the bug's status in `BUG_TRACKING_LOG.md`
2. Update the detailed bug report with information about the fix
3. Include the commit hash or version number where the fix was implemented

### Best Practices

- Be as detailed as possible in your bug descriptions
- Always include steps to reproduce
- Add screenshots or error messages when available
- Link to relevant code or commits
- Keep the status updated as you work on the bug

## Bug Severity Guidelines

- **Critical**: Application crash, data loss, security vulnerability
- **High**: Major feature broken, significant user impact
- **Medium**: Feature partially broken, moderate user impact
- **Low**: Minor issue, minimal user impact

## Bug Status Definitions

- **Open**: Bug has been identified but work has not started
- **In Progress**: Bug is currently being addressed
- **Fixed**: Bug has been fixed but not yet verified
- **Closed**: Bug has been fixed and verified
- **Won't Fix**: Decision made not to fix this bug (explain why in the report)
