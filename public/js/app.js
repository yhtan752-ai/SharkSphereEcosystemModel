class Router {
  constructor(appElement) {
    this.appElement = appElement;
    this.currentPage = null;
    this.isTransitioning = false;
  }

  async navigate(pageName) {
    // Prevent navigating to same page or during transition
    if (this.isTransitioning || this.currentPage === pageName) return;

    this.isTransitioning = true;

    try {
      // Step 1: Fade out current page
      await this.fadeOut();

      // Step 2: Load new page
      await this.loadPage(pageName);

      // Step 3: Fade in new page
      await this.fadeIn();

      // Update current page
      this.currentPage = pageName;
    } catch (error) {
      console.error(`Navigation failed: ${error.message}`);
    } finally {
      this.isTransitioning = false;
    }
  }

  async loadPage(pageName) {
    try {
      const response = await fetch(`pages/${pageName}.html`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Replace entire app content with new page body
      this.appElement.innerHTML = doc.body.innerHTML;
    } catch (error) {
      throw new Error(`Failed to load page ${pageName}: ${error.message}`);
    }
  }

  async fadeOut() {
    const section = this.appElement.querySelector('section');
    if (!section) return;

    section.classList.add('fade-out');
    section.classList.remove('fade-in');

    await this.delay(400);
  }

  async fadeIn() {
    const section = this.appElement.querySelector('section');
    if (!section) return;

    section.classList.remove('fade-out');
    section.classList.add('fade-in');

    await this.delay(400);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class App {
  constructor() {
    this.appElement = document.getElementById('app');
    this.router = new Router(this.appElement);
  }

  async init() {
    try {
      // Load initial page without transition
      await this.router.loadPage('landing');
      
      // Immediately show it (no fade-in animation on first load)
      const section = this.appElement.querySelector('section');
      if (section) {
        section.classList.add('fade-in');
      }
      
      this.router.currentPage = 'landing';
      
      // Attach event listeners
      this.bindEvents();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  bindEvents() {
    // Use event delegation for dynamic content
    // This way listeners persist across page changes
    this.appElement.addEventListener('click', (e) => {
      this.handleDelegatedClick(e);
    });
  }

  handleDelegatedClick(e) {
    if (e.target.id === 'cta-button') {
      this.handleCtaClick();
    }
  }

  handleCtaClick() {
    // Show visual feedback
    const button = document.getElementById('cta-button');
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }

    // Navigate after brief delay
    setTimeout(() => {
      this.router.navigate('conversation');
    }, 150);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
