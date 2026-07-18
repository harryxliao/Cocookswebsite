/* =============================================
   COCOOKS — main.js
   Scroll animations, nav behavior, interactions
   ============================================= */

// ---- Nav scroll effect ----
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

// ---- Scroll-triggered animations (IntersectionObserver) ----
const animatedEls = document.querySelectorAll('.animate-on-scroll');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});
animatedEls.forEach(el => observer.observe(el));

// ---- Hamburger mobile menu toggle ----
const hamburger = document.getElementById('nav-hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('mobile-open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
});
// Close on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('mobile-open');
  });
});

// ---- Smooth active nav highlight on scroll ----
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const activateNavLink = () => {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 100;
    if (window.scrollY >= top) {
      current = section.getAttribute('id');
    }
  });
  navAnchors.forEach(anchor => {
    anchor.classList.remove('active');
    if (anchor.getAttribute('href') === `#${current}`) {
      anchor.classList.add('active');
    }
  });
};
window.addEventListener('scroll', activateNavLink, { passive: true });

// ---- CTA Form submission & Validation ----
const ctaForm = document.getElementById('cta-form');
const ctaEmail = document.getElementById('cta-email');
const ctaSubmit = document.getElementById('cta-submit-btn');
const formContainer = document.getElementById('form-container');
const ctaSuccess = document.getElementById('cta-success');
const ctaError = document.getElementById('cta-error');

let lastSubmitTime = 0;

if (ctaForm) {
  ctaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Rate Limiting (Debounce: max 1 submission every 5 seconds)
    const now = Date.now();
    if (now - lastSubmitTime < 5000) {
      ctaError.textContent = "Please wait a moment before trying again.";
      ctaError.style.display = 'block';
      return;
    }
    lastSubmitTime = now;

    // 2. Honeypot Check (Bot spam prevention)
    const gotchaField = document.getElementById('cta-gotcha');
    if (gotchaField && gotchaField.value !== "") {
      // Silently fail if bot fills out the invisible honeypot field
      formContainer.style.display = 'none';
      ctaSuccess.style.display = 'flex';
      return;
    }

    const email = ctaEmail.value.trim().toLowerCase();
    
    // 3. Strict Regex Validation (Prevent malformed inputs / XSS payloads passing as emails)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      ctaError.textContent = "Please enter a valid email format.";
      ctaError.style.display = 'block';
      return;
    }
    
    // 4. Duplicate registration check via Local Storage
    if (localStorage.getItem('cocooks_registered_' + email)) {
      ctaError.textContent = "You're already on the list with this email!";
      ctaError.style.display = 'block';
      return;
    }

    ctaError.style.display = 'none';
    const originalBtnText = ctaSubmit.textContent;
    ctaSubmit.textContent = 'Sending...';
    ctaSubmit.disabled = true;
    ctaEmail.disabled = true;

    try {
      const payload = { email: email };
      if (gotchaField) payload._gotcha = gotchaField.value;

      const response = await fetch('https://formspree.io/f/xlgqbjnv', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        // Mark as registered in local storage
        localStorage.setItem('cocooks_registered_' + email, 'true');
        
        // Hide form and show success animation
        formContainer.style.display = 'none';
        ctaSuccess.style.display = 'flex';
      } else {
        ctaError.textContent = "Oops! Something went wrong. Please try again.";
        ctaError.style.display = 'block';
        ctaSubmit.disabled = false;
        ctaEmail.disabled = false;
        ctaSubmit.textContent = originalBtnText;
      }
    } catch (error) {
      ctaError.textContent = "Network error. Please check your connection.";
      ctaError.style.display = 'block';
      ctaSubmit.disabled = false;
      ctaEmail.disabled = false;
      ctaSubmit.textContent = originalBtnText;
    }
  });
}




// ---- Parallax on hero visual ----
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroVisual.style.transform = `translateY(${scrollY * 0.08}px)`;
    }
  }, { passive: true });
}

// ---- Mobile nav styles ----
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 900px) {
    .nav-links.mobile-open {
      display: flex !important;
      flex-direction: column;
      position: fixed;
      top: 72px; left: 0; right: 0;
      background: rgba(8,8,8,0.97);
      backdrop-filter: blur(20px);
      padding: 24px 32px 32px;
      gap: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      animation: slideDown 0.25s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .nav-links.mobile-open a {
      font-size: 18px;
      color: #f2f2f2;
    }
  }
  .nav-links a.active { color: #c8f135 !important; }
`;
document.head.appendChild(style);

// ---- Drag to scroll for table and gallery ----
function makeScrollable(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(slider => {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      slider.classList.add('active');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    
    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.classList.remove('active');
    });
    
    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.classList.remove('active');
    });
    
    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll speed multiplier
      slider.scrollLeft = scrollLeft - walk;
    });
  });
}

makeScrollable('.comparison-table-wrapper');
makeScrollable('.gallery-strip');
