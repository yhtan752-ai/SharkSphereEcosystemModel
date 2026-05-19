// SPA class setup
// the way this works is that theres a single page with different sections (landing, mission, team, etc.)
// and it shows/hides these sections based on user interaction (like clicking the lets go button)
// this allows it to be a smooth, app-like experience without needing to reload the page through nav links

class OceanResearchApp {
  constructor() {
    this.currentPage = 'landing';
    this.currentBubbleIndex = 0;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const ctaButton = document.getElementById('cta-button');
    const nextButton = document.getElementById('next-button');
    
    if (ctaButton) {
      ctaButton.addEventListener('click', () => this.handleCtaClick());
      ctaButton.addEventListener('mouseenter', () => this.buttonHoverIn(ctaButton));
      ctaButton.addEventListener('mouseleave', () => this.buttonHoverOut(ctaButton));
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => this.showNextBubble());
    }
  }

  handleCtaClick() {
    console.log('Let\'s Go! button clicked');
    this.navigateTo('conversation');
    this.showClickFeedback();
  }

  buttonHoverIn(button) {
    // hover effects
  }

  buttonHoverOut(button) {
    // hover effects 2
  }

  showClickFeedback() {
    const button = document.getElementById('cta-button');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = '';
    }, 150);
  }

  navigateTo(page) {
    // hide curr page
    const currentPageEl = document.getElementById(this.currentPage);
    if (currentPageEl) {
      currentPageEl.classList.remove('active');
    }

    // show new page
    const newPageEl = document.getElementById(page);
    if (newPageEl) {
      newPageEl.classList.add('active');
      this.currentPage = page;
      window.scrollTo(0, 0);
      
      if (page === 'conversation') {
        this.currentBubbleIndex = 0;
        this.showBubbleByIndex(0);
      }
    }
  }

  showBubbleByIndex(index) {
    const bubbles = document.querySelectorAll('.speech-bubble');
    bubbles.forEach((bubble, i) => {
      if (i === index) {
        bubble.classList.add('active');
      } else {
        bubble.classList.remove('active');
      }
    });
  }

  showNextBubble() {
    const bubbles = document.querySelectorAll('.speech-bubble');
    if (this.currentBubbleIndex < bubbles.length - 1) {
      this.currentBubbleIndex++;
      this.showBubbleByIndex(this.currentBubbleIndex);
      
      // Auto-scroll to show the active bubble
      setTimeout(() => {
        const activeBubble = bubbles[this.currentBubbleIndex];
        const speechBubblesContainer = document.querySelector('.speech-bubbles');
        if (activeBubble && speechBubblesContainer) {
          activeBubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 50);
    }
  }
}

// init app when DOM has finished loading
document.addEventListener('DOMContentLoaded', () => {
  new OceanResearchApp();
});
