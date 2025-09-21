# CV Website

A modern, responsive CV website built with HTML, CSS, and JavaScript. Perfect for showcasing your professional profile, projects, and skills.

## 🚀 Features

- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Modern UI** - Clean, professional design with smooth animations
- **Interactive Elements** - Smooth scrolling, hover effects, and form validation
- **Contact Form** - Working contact form with validation
- **Project Showcase** - Beautiful project cards with links and technology tags
- **Skills Section** - Organized skill categories with visual tags
- **Mobile Navigation** - Hamburger menu for mobile devices
- **Scroll Animations** - Elements animate as they come into view
- **SEO Ready** - Semantic HTML structure for better search engine optimization

## 📁 File Structure

```
website/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🛠️ Setup Instructions

### Option 1: Local Development

1. **Clone or download** this repository
2. **Navigate** to the `website` folder
3. **Open** `index.html` in your web browser
4. **Start editing** the content to personalize it

### Option 2: Using a Local Server (Recommended)

1. **Install a local server** (if you don't have one):
   - **Python**: `python -m http.server 8000`
   - **Node.js**: `npx http-server`
   - **VS Code**: Install "Live Server" extension

2. **Run the server** from the website directory
3. **Open** `http://localhost:8000` in your browser

## ✏️ Customization Guide

### 1. Personal Information

Edit the following sections in `index.html`:

```html
<!-- Update these sections with your information -->
<title>Your Name - CV</title>
<h1 class="hero-title">Hi, I'm <span class="highlight">Your Name</span></h1>
<p class="hero-subtitle">Software Developer & Problem Solver</p>
```

### 2. Contact Information

Update contact details in the contact section:

```html
<div class="contact-method">
    <i class="fas fa-envelope"></i>
    <span>your.email@example.com</span>
</div>
<div class="contact-method">
    <i class="fas fa-phone"></i>
    <span>+1 (555) 123-4567</span>
</div>
```

### 3. Social Media Links

Update social media links:

```html
<div class="social-links">
    <a href="https://github.com/yourusername" class="social-link">
        <i class="fab fa-github"></i>
    </a>
    <a href="https://linkedin.com/in/yourusername" class="social-link">
        <i class="fab fa-linkedin"></i>
    </a>
    <!-- Add more social links as needed -->
</div>
```

### 4. Projects

Replace the example projects with your own:

```html
<div class="project-card">
    <div class="project-image">
        <img src="path/to/your/project/image.jpg" alt="Project Name">
        <div class="project-overlay">
            <a href="https://your-project-url.com" class="project-link">
                <i class="fas fa-external-link-alt"></i>
            </a>
            <a href="https://github.com/yourusername/project" class="project-github">
                <i class="fab fa-github"></i>
            </a>
        </div>
    </div>
    <div class="project-content">
        <h3>Your Project Name</h3>
        <p>Project description goes here...</p>
        <div class="project-tech">
            <span class="tech-tag">React</span>
            <span class="tech-tag">Node.js</span>
            <!-- Add your technologies -->
        </div>
    </div>
</div>
```

### 5. Skills

Update the skills section with your technologies:

```html
<div class="skill-category">
    <h3>Frontend</h3>
    <div class="skill-tags">
        <span class="skill-tag">HTML5</span>
        <span class="skill-tag">CSS3</span>
        <span class="skill-tag">JavaScript</span>
        <!-- Add your skills -->
    </div>
</div>
```

### 6. Profile Photo

Replace the placeholder image with your photo:

```html
<img src="path/to/your/photo.jpg" alt="Your Photo" class="profile-img">
```

## 🎨 Styling Customization

### Colors

The main color scheme is defined in CSS variables. You can change the primary colors by editing these values in `styles.css`:

```css
/* Primary colors */
--primary-color: #4f46e5;
--secondary-color: #7c3aed;
--accent-color: #fbbf24;
```

### Fonts

The website uses Inter font from Google Fonts. To change the font:

1. Update the Google Fonts link in `index.html`
2. Change the font-family in `styles.css`

### Layout

The layout is responsive and uses CSS Grid and Flexbox. You can modify:
- Section padding
- Grid layouts
- Spacing between elements
- Animation timings

## 🚀 Deployment

### GitHub Pages

1. **Push** your code to a GitHub repository
2. **Go to** repository Settings > Pages
3. **Select** source branch (usually `main`)
4. **Your site** will be available at `https://yourusername.github.io/repository-name`

### Netlify

1. **Drag and drop** the website folder to [Netlify](https://netlify.com)
2. **Your site** will be deployed instantly
3. **Custom domain** can be added in site settings

### Vercel

1. **Connect** your GitHub repository to [Vercel](https://vercel.com)
2. **Deploy** with one click
3. **Automatic deployments** on every push

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🔧 Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid and Flexbox
- **JavaScript (ES6+)** - Interactive functionality
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to fork this project and customize it for your own use. If you make improvements, consider submitting a pull request!

## 📞 Support

If you have any questions or need help customizing your CV website, feel free to reach out!

---

**Happy coding! 🎉**
