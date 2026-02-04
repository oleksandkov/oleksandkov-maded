# QDM Presentations

This directory contains Quarto presentations optimized for web hosting via services like githack.

## Key Differences from QMD Folder

### QDM (This folder)
- **Embedded Resources**: All assets embedded in HTML (`embed-resources: true`)
- **No Interactive Elements**: Removed `.fragment` classes for better compatibility
- **No Chalkboard**: Drawing features disabled (`chalkboard: false`)
- **Web-Friendly**: Optimized for hosting on githack and other static hosts
- **Single File**: Everything in one HTML file for easy sharing

### QMD (../qmd/ folder)
- **External Resources**: Separate files for better local development
- **Interactive Elements**: Uses `.fragment` for progressive reveals
- **Chalkboard Enabled**: Can draw on slides during presentation
- **Multiple Outputs**: Can export to PDF, PPTX, etc.
- **Development Version**: Better for local presentations and editing

## Viewing Presentations

### Online (Recommended)
View the presentations directly in your browser via githack:
- [Docker and Containers](https://raw.githack.com/oleksandkov/oleksandkov-maded/refs/heads/main/presentations/qdm/Docker.html)

### Local
Simply open the `.html` files in your web browser - they work standalone with all resources embedded.

## Creating New QDM Presentations

To create a new web-optimized presentation:

1. Copy `Docker.qmd` as a template
2. Edit your content
3. Make sure the YAML header has:
   ```yaml
   embed-resources: true
   chalkboard: false
   ```
4. Avoid using `.fragment` classes (or use sparingly)
5. Render with: `quarto render your-file.qmd`
6. The output HTML will be fully self-contained

## Technical Details

**Format**: Quarto RevealJS presentations
**Theme**: Dark
**Embedded**: All CSS, JavaScript, and images included in HTML
**Size**: Larger file size due to embedded resources (~500KB - 2MB typical)
**Compatibility**: Works with any static file host (GitHub Pages, githack, etc.)
