// Scroll Reveal Animation System
class ScrollAnimations {
  constructor() {
    this.elements = [];
    this.countedNumbers = new Set();
    this.init();
  }

  init() {
    // Find all elements with scroll animation classes
    this.elements = document.querySelectorAll(
      '.scroll-reveal, .scroll-fade-in, .scroll-slide-left, .scroll-slide-right, .scroll-scale, .scroll-rotate'
    );

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all elements
    this.elements.forEach(el => this.observer.observe(el));

    // Add parallax effect
    this.initParallax();
    
    // Add smooth scroll behavior
    this.initSmoothScroll();
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        
        // Trigger number counting for stat cards
        if (entry.target.classList.contains('stat-card')) {
          this.animateStatCard(entry.target);
        }

        // Trigger icon animation for feature cards
        if (entry.target.classList.contains('feature-card')) {
          const icon = entry.target.querySelector('.feature-icon');
          if (icon) icon.classList.add('revealed');
        }

        // Trigger section title underline
        if (entry.target.classList.contains('section-title')) {
          entry.target.classList.add('revealed');
        }

        // Animate bar charts
        if (entry.target.querySelector('.bar-chart')) {
          this.animateBarChart(entry.target);
        }

        // Unobserve after revealing (one-time animation)
        this.observer.unobserve(entry.target);
      }
    });
  }

  animateStatCard(card) {
    const numberEl = card.querySelector('.stat-number');
    if (!numberEl || this.countedNumbers.has(numberEl)) return;

    this.countedNumbers.add(numberEl);
    const text = numberEl.textContent.trim();
    
    // Extract number and suffix (%, etc.)
    const match = text.match(/^(\d+)(.*)$/);
    if (!match) return;

    const targetNumber = parseInt(match[1]);
    const suffix = match[2];
    
    // Store original value as data attribute
    numberEl.setAttribute('data-number', text);

    // Animate the number
    this.countUpAnimation(numberEl, 0, targetNumber, 2000, suffix);

    // Add progress bar if it exists
    const progressBar = card.querySelector('.stat-progress-bar');
    if (progressBar) {
      const progress = Math.min(targetNumber, 100);
      progressBar.style.setProperty('--progress-width', `${progress}%`);
    }

    // Animate circular progress if it exists
    const circleProgress = card.querySelector('.stat-circle-progress');
    if (circleProgress) {
      const circumference = 2 * Math.PI * 50; // radius = 50
      const progress = (targetNumber / 100) * circumference;
      circleProgress.style.setProperty('--circle-progress', progress);
    }
  }

  countUpAnimation(element, start, end, duration, suffix = '') {
    const startTime = performance.now();
    const range = end - start;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + range * easeOutQuart);
      
      element.textContent = current + suffix;
      element.classList.add('counting');

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = end + suffix;
        element.classList.remove('counting');
      }
    };

    requestAnimationFrame(animate);
  }

  animateBarChart(container) {
    const bars = container.querySelectorAll('.bar-fill');
    bars.forEach((bar, index) => {
      setTimeout(() => {
        const width = bar.getAttribute('data-width') || '100%';
        bar.style.width = width;
      }, index * 200);
    });
  }

  initParallax() {
    const parallaxSections = document.querySelectorAll('.parallax-section');
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          
          parallaxSections.forEach(section => {
            const speed = parseFloat(section.dataset.parallaxSpeed) || 0.5;
            const yPos = -(scrolled * speed);
            section.style.transform = `translateY(${yPos}px)`;
          });
          
          ticking = false;
        });
        
        ticking = true;
      }
    });
  }

  initSmoothScroll() {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Add stagger effect to grid items
  static addStaggerEffect(container, itemSelector) {
    const items = container.querySelectorAll(itemSelector);
    items.forEach((item, index) => {
      item.style.transitionDelay = `${index * 0.1}s`;
    });
  }

  // Utility to manually trigger reveal on an element
  static revealElement(element) {
    if (element) {
      element.classList.add('revealed');
    }
  }

  // Utility to reset animations
  static resetAnimations() {
    document.querySelectorAll('.revealed').forEach(el => {
      el.classList.remove('revealed');
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ScrollAnimations();
  });
} else {
  new ScrollAnimations();
}

// Export for use in other scripts
window.ScrollAnimations = ScrollAnimations;
