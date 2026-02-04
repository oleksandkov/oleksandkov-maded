# Docker Presentation (Non-Interactive)

Web-optimized Quarto presentation for online hosting via githack.

## 🌐 View Online

**[Docker and Containers - Interactive](https://raw.githack.com/oleksandkov/oleksandkov-maded/refs/heads/main/presentations/Docker%20Presentation%20%28Non-Interactive%29/Docker.html)**

## 📁 Files

- **Docker.qmd** - Source file (non-interactive)
- **Docker.html** - Self-contained HTML (all resources embedded)
- **images/** - Embedded presentation images

## ✨ Features

- **Embedded Resources**: All CSS, JavaScript, and images in one HTML file
- **No Interactive Elements**: No `.fragment` classes for better compatibility
- **No Chalkboard**: Drawing features disabled
- **Web-Friendly**: Optimized for githack and static hosts
- **Single File**: Easy to share and host anywhere

## 🔄 Differences from Interactive Version

**This folder (Non-Interactive)**:
- Embedded resources (`embed-resources: true`)
- Static content, no progressive reveals
- Chalkboard disabled (`chalkboard: false`)
- Larger file size (~500KB - 2MB)
- Perfect for web hosting

**[Docker Presentation](../Docker%20Presentation/)** (Interactive):
- External resources in separate files
- Progressive reveals with `.fragment`
- Chalkboard enabled for drawing
- Multiple export formats (PDF, PPTX)
- Better for local development

## 🚀 Usage

### View Online
Just click the githack link above - works in any browser.

### Local
Open `Docker.html` directly in your browser - no server needed.

### Create New
```bash
# Copy as template
cp Docker.qmd your-presentation.qmd

# Edit content, ensure YAML has:
# embed-resources: true
# chalkboard: false

# Render
quarto render your-presentation.qmd
```

## 📞 Contact

- **GitHub**: [@oleksandkov](https://github.com/oleksandkov)
- **Email**: oleksandr.kov.dm@gmail.com
- **LinkedIn**: [Oleksandr Koval](https://www.linkedin.com/in/oleksandr-koval-932015384/)
**Compatibility**: Works with any static file host (GitHub Pages, githack, etc.)
