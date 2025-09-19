# oleksandkov-maded Repository Instructions

This is the personal repository of @oleksandkov, containing presentations, works, and texts. This is currently a minimal documentation-focused repository with no build system or complex dependencies.

**ALWAYS follow these instructions first and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.**

## Repository Overview

This repository is designed for static content, documentation, presentations, and text-based works. It currently contains:
- README.md - Repository description and overview
- LICENSE - MIT License file
- This repository has NO build system, dependencies, or complex tooling requirements

## Working Effectively

### Initial Setup and Validation
Always start with these commands when working with a fresh clone:

```bash
# Navigate to repository root
cd /path/to/oleksandkov-maded

# Verify repository structure
ls -la
# Expected output: .git/, README.md, LICENSE, .github/

# Check git status and recent history
git --no-pager status
git --no-pager log --oneline -5

# Verify available development tools
node --version    # Should show Node.js v20.19.5+
npm --version     # Should show npm 10.8.2+
python3 --version # Should show Python 3.12.3+
```

### Content Creation and Editing

Since this is a content-focused repository, follow these patterns:

```bash
# Create new markdown files
touch new-document.md
echo "# Title" > new-document.md

# Edit existing files using your preferred editor
# View file content
cat README.md
head -10 filename.md
tail -10 filename.md

# Check file types and encoding
file *.md *.txt
```

### Git Workflow

**CRITICAL**: Always use these exact git commands with --no-pager to avoid hangs:

```bash
# Check status (ALWAYS use --no-pager)
git --no-pager status

# View changes (ALWAYS use --no-pager)
git --no-pager diff
git --no-pager diff --staged

# View commit history (ALWAYS use --no-pager)
git --no-pager log --oneline -10

# Stage changes
git add .
git add specific-file.md

# Commit changes
git commit -m "Descriptive commit message"

# Push changes
git push origin branch-name
```

### File Operations and Content Management

All file operations are standard Unix commands - no special tooling required:

```bash
# Create directories
mkdir -p presentations/2025
mkdir -p documents/drafts

# Copy and move files
cp source.md destination.md
mv old-name.md new-name.md

# View directory structure
ls -la
find . -name "*.md" | head -20
du -sh .  # Repository size check
```

## Validation Requirements

### Content Validation
**ALWAYS validate your changes with these steps:**

```bash
# 1. Verify file integrity
file *.md *.txt
wc -l *.md  # Check line counts

# 2. Check for common formatting issues
grep -n "TODO\|FIXME\|XXX" *.md || echo "No TODO markers found"

# 3. Verify git status is clean after changes
git --no-pager status

# 4. Test file readability
head -5 *.md  # Preview all markdown files
```

### Manual Testing Scenarios
Since this is a content repository, **ALWAYS** perform these validation steps after making changes:

1. **Content Review**: Open and read modified files to ensure content is properly formatted
2. **Link Verification**: If adding links, manually verify they work
3. **File Structure**: Ensure new files follow existing naming conventions
4. **Git History**: Verify commits are clean and descriptive

## Common Tasks and Time Expectations

### File Operations
- Creating/editing markdown files: **Instant** (no timeout needed)
- Git operations: **Under 30 seconds** each (no timeout needed)
- Repository cloning: **Under 60 seconds** (no timeout needed)

### Expected Workflow Times
- Content creation/editing: Immediate
- Git status/diff/log: Under 5 seconds each
- Commit and push: Under 30 seconds total

**NOTE**: This repository has NO build processes, tests, or compilation steps that require extended timeouts.

## Key Areas of the Repository

### Current Structure
```
.
├── .github/
│   └── copilot-instructions.md  # This file
├── .git/                        # Git metadata
├── LICENSE                      # MIT License
└── README.md                    # Repository overview
```

### Future Expansion Areas
If this repository grows, expect these potential additions:
- `presentations/` - Directory for presentation files
- `documents/` - Directory for text documents and works  
- `assets/` - Directory for images, media files
- `templates/` - Directory for document templates

## Development Environment Requirements

### Required Tools (Pre-installed)
- Git (for version control)
- Any text editor for markdown editing
- Basic Unix commands (ls, cat, grep, etc.)

### Optional Tools (Available if needed)
- Node.js v20.19.5+ and npm 10.8.2+ (available but not required for current workflow)
- Python 3.12.3+ (available but not required for current workflow)
- Make 4.3+ (available but not required for current workflow)

### NOT Required
- No package managers (npm install, pip install, etc.)
- No build systems (make, gradle, etc.)
- No test runners
- No linters (unless content validation tools are added later)
- No compilation steps

## Troubleshooting

### Common Issues and Solutions

**Git commands hang:**
- Always use `git --no-pager [command]` instead of bare git commands
- If a command hangs, cancel and retry with --no-pager

**File encoding issues:**
- Use `file filename.md` to check encoding
- All markdown files should be UTF-8 text

**Permission issues:**
- Check file permissions with `ls -la`
- Fix with `chmod 644 *.md` if needed

## Best Practices

### Content Creation
- Use descriptive commit messages
- Keep markdown files under 1000 lines for readability
- Follow consistent naming conventions (lowercase, hyphens for spaces)
- Add appropriate frontmatter if using static site generators later

### Repository Maintenance
- Keep the repository focused on content, not code
- Use clear directory structure if adding multiple documents
- Maintain the README.md with current repository state
- Tag releases if creating version-specific content collections

### Git Hygiene
- Commit early and often with descriptive messages
- Use feature branches for significant content additions
- Keep commits atomic (one logical change per commit)
- Always verify `git --no-pager status` is clean before switching tasks

## Emergency Procedures

If something breaks:

1. **Check git status**: `git --no-pager status`
2. **View recent changes**: `git --no-pager diff`
3. **Reset if needed**: `git checkout -- filename.md` (revert single file)
4. **Get help**: `git --help [command]` for git command help

Remember: This is a simple content repository - most "emergencies" are just git workflow issues that can be resolved with standard git commands.