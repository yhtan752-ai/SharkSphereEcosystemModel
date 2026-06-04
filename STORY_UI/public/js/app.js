class Router {
  constructor(appElement, app) {
    this.appElement = appElement;
    this.app = app;
    this.currentPage = null;
    this.isTransitioning = false;
  }

  async navigate(pageName) {
    // prevent navigating to same page or during transition
    if (this.isTransitioning || this.currentPage === pageName) return;

    this.isTransitioning = true;

    try {
      await this.fadeOut();
      await this.loadPage(pageName);
      await this.fadeIn();

      // upd current page
      this.currentPage = pageName;
      
      // initialise page content based on page name
      this.app.initialisePageContent(pageName);
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
      
      // replace entire app content with new page body
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
    this.router = new Router(this.appElement, this);
  }

  async init() {
    try {
      // check for debug page parameter
      const params = new URLSearchParams(window.location.search);
      const debugPage = params.get('page');
      const startPage = debugPage || 'landing';

      await this.router.loadPage(startPage);
      
      const section = this.appElement.querySelector('section');
      if (section) {
        section.classList.add('fade-in');
      }
      
      this.router.currentPage = startPage;
      
      this.initialisePageContent(startPage);
      
      // attach event listeners
      this.bindEvents();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  initialisePageContent(pageName) {
    if (pageName === 'conversation') {
      this.initialiseConversation();
    }
  }

  initialiseConversation() {
    const messages = [
      "Welcome aboard, fellow scientist!",
      "Today, we are going to explore a very important species.",
      "This species helps keep coral reef"
    ];

    const wrapper = this.appElement.querySelector('.messages-wrapper');
    if (!wrapper) return;

    // clear any existing messages
    wrapper.innerHTML = '';

    // add messages automatically with staggered timing
    messages.forEach((text, index) => {
      setTimeout(() => {
        const message = document.createElement('div');
        message.className = 'message';
        message.textContent = text;
        wrapper.appendChild(message);
      }, index * 1000);
    });
  }

  bindEvents() {
    // use event delegation for dynamic content
    // this way listeners persist across page changes
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
    const button = document.getElementById('cta-button');
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }

    // navigate after delay
    setTimeout(() => {
      this.router.navigate('conversation');
    }, 150);
  }

  addMessage(text) {
    const wrapper = this.appElement.querySelector('.messages-wrapper');
    if (!wrapper) return;

    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
    wrapper.appendChild(message);

    // Auto-scroll to bottom
    wrapper.scrollTop = wrapper.scrollHeight;
  }
}

// init when dom has loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});