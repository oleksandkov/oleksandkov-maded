# Setup and Installation Guide

This guide helps you set up the development environment for working with the portfolio repository.

## Prerequisites

### For All Users
- Git (for version control)
- Text editor or IDE of your choice

### For R Development
```bash
# Install R
# Visit: https://www.r-project.org/

# Install RStudio (recommended)
# Visit: https://www.rstudio.com/

# Install required packages
R -e "install.packages(c('tidyverse', 'ggplot2', 'dplyr', 'gridExtra'))"
```

### For C++ Development
```bash
# Ubuntu/Debian
sudo apt-get install build-essential g++

# macOS (with Homebrew)
brew install gcc

# Windows
# Install Visual Studio or MinGW
```

### For Java Development
```bash
# Install OpenJDK
# Ubuntu/Debian
sudo apt-get install openjdk-11-jdk

# macOS (with Homebrew)
brew install openjdk@11

# Windows
# Download from Oracle or use OpenJDK
```

### For Quarto Presentations
```bash
# Install Quarto
# Visit: https://quarto.org/docs/get-started/

# Or using package managers
# macOS
brew install --cask quarto

# Ubuntu/Debian
wget https://github.com/quarto-dev/quarto-cli/releases/download/v1.4.550/quarto-1.4.550-linux-amd64.deb
sudo dpkg -i quarto-1.4.550-linux-amd64.deb
```

## Quick Start
1. Clone the repository
2. Install prerequisites for your target language
3. Navigate to the appropriate directory
4. Follow language-specific README instructions

## Troubleshooting
- Check individual directory README files for specific requirements
- Ensure all dependencies are properly installed
- Verify PATH environment variables for command-line tools