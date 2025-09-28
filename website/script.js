// Audio/Podcasts section controls with duration and extra buttons
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".audio-card").forEach((card) => {
    const audio = card.querySelector("audio");
    const playBtn = card.querySelector(".audio-btn.play");
    const pauseBtn = card.querySelector(".audio-btn.pause");
    const stopBtn = card.querySelector(".audio-btn.stop");
    const rewindBtn = card.querySelector(".audio-btn.rewind");
    const forwardBtn = card.querySelector(".audio-btn.forward");
    const volumeSlider = card.querySelector(".audio-volume");
    const timeDisplay = card.querySelector(".audio-time");

    // Format seconds as mm:ss
    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }

    if (
      audio &&
      playBtn &&
      pauseBtn &&
      stopBtn &&
      rewindBtn &&
      forwardBtn &&
      volumeSlider &&
      timeDisplay
    ) {
      playBtn.addEventListener("click", () => {
        audio.play();
      });
      pauseBtn.addEventListener("click", () => {
        audio.pause();
      });
      stopBtn.addEventListener("click", () => {
        audio.pause();
        audio.currentTime = 0;
      });
      rewindBtn.addEventListener("click", () => {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
      });
      forwardBtn.addEventListener("click", () => {
        audio.currentTime = Math.min(
          audio.duration || 0,
          audio.currentTime + 10
        );
      });
      volumeSlider.addEventListener("input", () => {
        audio.volume = volumeSlider.value;
      });
      // Update time display
      audio.addEventListener("timeupdate", () => {
        timeDisplay.textContent = `${formatTime(
          audio.currentTime
        )} / ${formatTime(audio.duration || 0)}`;
      });
      audio.addEventListener("loadedmetadata", () => {
        timeDisplay.textContent = `00:00 / ${formatTime(audio.duration || 0)}`;
      });
    }
  });
});
// Audio/Podcasts section controls
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".audio-card").forEach((card) => {
    const audio = card.querySelector("audio");
    const playBtn = card.querySelector(".audio-btn.play");
    const pauseBtn = card.querySelector(".audio-btn.pause");
    const stopBtn = card.querySelector(".audio-btn.stop");
    const volumeSlider = card.querySelector(".audio-volume");

    if (audio && playBtn && pauseBtn && stopBtn && volumeSlider) {
      playBtn.addEventListener("click", () => {
        audio.play();
      });
      pauseBtn.addEventListener("click", () => {
        audio.pause();
      });
      stopBtn.addEventListener("click", () => {
        audio.pause();
        audio.currentTime = 0;
      });
      volumeSlider.addEventListener("input", () => {
        audio.volume = volumeSlider.value;
      });
    }
  });
});
// Audio Bar logic
document.addEventListener("DOMContentLoaded", () => {
  const audioBarBtn = document.getElementById("audioBarBtn");
  const audioBar = document.getElementById("audioBar");
  const closeAudioBar = document.getElementById("closeAudioBar");
  const audioChoices = document.querySelectorAll(".audio-bar .audio-choice");
  const audioBarMain = document.getElementById("audioBarMain");
  const audioBarControls = document.getElementById("audioBarControls");
  const playBtn = document.getElementById("audioBarPlay");
  const pauseBtn = document.getElementById("audioBarPause");
  const stopBtn = document.getElementById("audioBarStop");
  const volumeSlider = document.getElementById("audioBarVolume");

  if (
    audioBarBtn &&
    audioBar &&
    closeAudioBar &&
    audioBarMain &&
    audioBarControls
  ) {
    audioBarBtn.addEventListener("click", () => {
      audioBar.classList.add("show");
    });
    closeAudioBar.addEventListener("click", () => {
      audioBar.classList.remove("show");
      audioBarMain.pause();
      audioBarMain.currentTime = 0;
      audioBarMain.removeAttribute("src");
      audioBarMain.load();
      audioBarControls.style.display = "none";
    });
    audioChoices.forEach((choice) => {
      choice.addEventListener("click", () => {
        audioBarMain.src = choice.getAttribute("data-src");
        audioBarControls.style.display = "block";
        audioBarMain.load();
        audioBarMain.play();
      });
    });
    playBtn.addEventListener("click", () => {
      audioBarMain.play();
    });
    pauseBtn.addEventListener("click", () => {
      audioBarMain.pause();
    });
    stopBtn.addEventListener("click", () => {
      audioBarMain.pause();
      audioBarMain.currentTime = 0;
    });
    volumeSlider.addEventListener("input", () => {
      audioBarMain.volume = volumeSlider.value;
    });
    // Animate bar exit
    audioBar.addEventListener("animationend", (e) => {
      if (!audioBar.classList.contains("show")) {
        audioBar.style.display = "none";
      } else {
        audioBar.style.display = "block";
      }
    });
  }
});
// Mobile Navigation Toggle
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

function toggleMenu() {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
}

hamburger.addEventListener("click", toggleMenu);

// Add keyboard support for hamburger menu
hamburger.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleMenu();
  }
});

// Close mobile menu when clicking on a link
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Navbar background change on scroll
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.style.background = "rgba(255, 255, 255, 0.98)";
    navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
  } else {
    navbar.style.background = "rgba(255, 255, 255, 0.95)";
    navbar.style.boxShadow = "none";
  }
});

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animated");
    }
  });
}, observerOptions);

// Observe elements for scroll animations
document.addEventListener("DOMContentLoaded", () => {
  const animateElements = document.querySelectorAll(
    ".skill-category, .project-card, .stat, .about-text"
  );
  animateElements.forEach((el) => {
    el.classList.add("animate-on-scroll");
    observer.observe(el);
  });
});

// Initialize EmailJS
(function () {
  emailjs.init("PbLxHejX7oGtvfLuS"); // Replace with your EmailJS public key
})();

// Contact form handling
const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(contactForm);
    const name = formData.get("name");
    const email = formData.get("email");
    const subject = formData.get("subject");
    const message = formData.get("message");

    // Simple validation
    if (!name || !email || !subject || !message) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showNotification("Please enter a valid email address", "error");
      return;
    }

    // Show loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    // Send email using EmailJS
    const templateParams = {
      from_name: name,
      from_email: email,
      subject: subject,
      message: message,
      to_email: "oleksandkov.kov.dm@gmail.com", // Your email
    };

    emailjs
      .send("service_jdyd4z9", "template_kypz7ro", templateParams)
      .then(
        function (response) {
          showNotification(
            "Message sent successfully! I'll get back to you soon.",
            "success"
          );
          contactForm.reset();
        },
        function (error) {
          console.error("EmailJS Error:", error);
          showNotification(
            "Sorry, there was an error sending your message. Please try again.",
            "error"
          );
        }
      )
      .finally(function () {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
  });
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${
          type === "success"
            ? "#10b981"
            : type === "error"
            ? "#ef4444"
            : "#3b82f6"
        };
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;

  notification.querySelector(".notification-content").style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    `;

  notification.querySelector(".notification-close").style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    `;

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Close button functionality
  notification
    .querySelector(".notification-close")
    .addEventListener("click", () => {
      notification.style.transform = "translateX(400px)";
      setTimeout(() => notification.remove(), 300);
    });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transform = "translateX(400px)";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Typing animation for hero title
function typeWriter(element, text, speed = 100) {
  let i = 0;
  element.innerHTML = "";

  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  type();
}

// Initialize typing animation when page loads
document.addEventListener("DOMContentLoaded", () => {
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    const originalText = heroTitle.innerHTML;
    // Uncomment the line below to enable typing animation
    // typeWriter(heroTitle, originalText, 50);
  }
});

// Parallax effect for hero section
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector(".hero");
  if (hero) {
    const rate = scrolled * -0.5;
    hero.style.transform = `translateY(${rate}px)`;
  }
});

// Add loading animation
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

// Add CSS for loading animation
const loadingStyles = `
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    .notification {
        font-family: 'Inter', sans-serif;
    }
`;

// Inject loading styles
const styleSheet = document.createElement("style");
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet);

// Skills animation on scroll
const skillTags = document.querySelectorAll(".skill-tag");
const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = "fadeInUp 0.6s ease forwards";
        entry.target.style.animationDelay = `${Math.random() * 0.5}s`;
      }
    });
  },
  { threshold: 0.1 }
);

skillTags.forEach((tag) => {
  skillObserver.observe(tag);
});

// Project card hover effects
const projectCards = document.querySelectorAll(".project-card");
projectCards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-10px) scale(1.02)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0) scale(1)";
  });
});

// Add smooth reveal animation for sections
const sections = document.querySelectorAll("section");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  },
  { threshold: 0.1 }
);

sections.forEach((section) => {
  section.style.opacity = "0";
  section.style.transform = "translateY(30px)";
  section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  sectionObserver.observe(section);
});

// Console welcome message
console.log(`
🚀 Welcome to Your CV Website!
📧 Contact: your.email@example.com
💼 Portfolio: Ready to showcase your projects
🎨 Built with HTML, CSS & JavaScript
`);

// Add some fun easter eggs
let clickCount = 0;
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("profile-img")) {
    clickCount++;
    if (clickCount === 5) {
      showNotification(
        "🎉 You found the easter egg! Thanks for exploring!",
        "success"
      );
      clickCount = 0;
    }
  }
});
