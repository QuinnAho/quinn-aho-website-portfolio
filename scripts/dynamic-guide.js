// dynamic-guide.js
(function () {
  'use strict';

  class DynamicGuide {
    constructor(options) {
      this.container     = options.container; // #header-guide
      this.header        = options.header;    // .main-header
      this.messages      = options.messages || [
        "having fun, aren't we?",
        "keep at it",
        "you're a fluid sim master"
      ];
      this.heroMessages  = options.heroMessages || []; // Messages for hero section
      this.currentIndex  = 0;

      this.showDuration  = options.showDuration  || 2000; // ms visible
      this.transitionGap = options.transitionGap || 500;  // ms fade
      this.loopEnabled   = false;
      this.isOnHero      = true; // Track if we're on hero section
      this.currentSection = 'hero'; // Track current section

      this.timeoutId     = null;
      this.isHovered     = false;
      this.hasInteracted = false; // Track if user has interacted
      this.lastScrollTime = Date.now();
      this.fluidInteractions = 0; // Track fluid sim interactions

      this.messageQueue  = [];
      this.interactions  = options.interactions || [];
      this.timeTriggers  = options.timeTriggers || [];
      this.shownMessages = new Set(); // Track shown messages to avoid repetition

      this.init();
    }

    init() {
      if (!this.container || !this.header) return;

      // Observe header to show messages when visible
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loopEnabled) {
            this.loopEnabled = true;
            this.cycleMessages();
          } else if (!entry.isIntersecting) {
            this.loopEnabled = false;
            this.resetMessages();
          }
        });
      }, { threshold: 0.5 });

      observer.observe(this.header);

      // Observe intro section to detect when user scrolls past hero
      const introSection = document.querySelector('.intro-combined');
      if (introSection) {
        const introObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && this.isOnHero) {
              this.isOnHero = false;
              this.currentSection = 'intro';
              // Switch to intro section messages
              if (!this.shownMessages.has('cube-hint')) {
                this.messageQueue.push('hint: click and drag the cube to navigate');
                this.shownMessages.add('cube-hint');
              }
            }
          });
        }, { threshold: 0.3 });

        introObserver.observe(introSection);
      }

      // Track scroll behavior
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.lastScrollTime = Date.now();
        }, 150);
      }, { passive: true });

      // Track fluid sim interactions on hero canvas
      const heroCanvas = document.querySelector('.hero canvas');
      if (heroCanvas) {
        let interactionCount = 0;
        ['mousedown', 'touchstart'].forEach(event => {
          heroCanvas.addEventListener(event, () => {
            interactionCount++;
            this.fluidInteractions = interactionCount;
            this.hasInteracted = true;

            // Show contextual messages based on interaction count
            if (interactionCount === 3 && this.isOnHero && !this.shownMessages.has('fluid-fun')) {
              this.messageQueue.push('nice the fluid sim is pretty mesmerizing');
              this.shownMessages.add('fluid-fun');
            } else if (interactionCount === 10 && this.isOnHero && !this.shownMessages.has('fluid-master')) {
              this.messageQueue.push("you're getting the hang of it");
              this.shownMessages.add('fluid-master');
            }
          }, { passive: true });
        });
      }

      this.header.addEventListener("mouseenter", () => {
        this.isHovered = true;
      });

      this.header.addEventListener("mouseleave", () => {
        this.isHovered = false;
      });

      this.setupInteractions();
      this.setupContextualTriggers();
      this.setupHeroMessages();
    }

    setupHeroMessages() {
      // Show hero messages when page loads
      if (this.heroMessages.length > 0) {
        const showHeroMessage = (index) => {
          if (index < this.heroMessages.length && this.isOnHero) {
            this.triggerMessage(this.heroMessages[index]);
            setTimeout(() => {
              showHeroMessage(index + 1);
            }, this.showDuration + this.transitionGap);
          }
        };

        // Start showing hero messages after a short delay
        setTimeout(() => {
          if (this.loopEnabled) {
            showHeroMessage(0);
          }
        }, 1000);
      }
    }

    cycleMessages() {
      if (!this.loopEnabled) return;

      let message;
      if (this.messageQueue.length > 0) {
        message = this.messageQueue.shift();
      } else {
        if (this.currentIndex >= this.messages.length) {
          this.currentIndex = 0;
        }
        message = this.messages[this.currentIndex++];
      }

      this.displayMessage(message);

      this.timeoutId = setTimeout(() => {
        this.fadeOutCurrentMessage(() => {
          if (this.loopEnabled) this.cycleMessages();
        });
      }, this.showDuration);
    }

    triggerMessage(text) {
      this.messageQueue.push(text);
      if (this.loopEnabled) {
        clearTimeout(this.timeoutId);
        this.fadeOutCurrentMessage(() => {
          this.cycleMessages();
        });
      }
    }

    displayMessage(text) {
      this.container.innerHTML = "";
      const span = document.createElement("span");
      span.className = "animated-message";
      span.textContent = text;
      this.container.appendChild(span);

      requestAnimationFrame(() => {
        span.classList.add("show");
      });
    }

    fadeOutCurrentMessage(callback) {
      const span = this.container.querySelector(".animated-message");
      if (!span) { if (callback) callback(); return; }

      span.classList.remove("show");
      span.classList.add("fade-out-all");

      this.timeoutId = setTimeout(() => {
        this.container.innerHTML = "";
        if (callback) callback();
      }, this.transitionGap);
    }

    resetMessages() {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.container.innerHTML = "";
      this.currentIndex = 0;
    }

    setupInteractions() {
      this.interactions.forEach(cfg => {
        const elements = document.querySelectorAll(cfg.selector);
        elements.forEach(el => {
          el.addEventListener(cfg.event, () => {
            this.triggerMessage(cfg.message);
          });
        });
      });
    }

    setupContextualTriggers() {
      // Smart time-based triggers that adapt to user behavior

      // If user hasn't scrolled after 8 seconds, encourage exploration
      setTimeout(() => {
        if (this.isOnHero && !this.shownMessages.has('explore-reminder')) {
          this.messageQueue.push('scroll down to explore my work');
          this.shownMessages.add('explore-reminder');
        }
      }, 8000);

      // If user has been on intro section for a while without clicking
      setTimeout(() => {
        if (!this.isOnHero && !this.hasInteracted && !this.shownMessages.has('page-hint')) {
          this.messageQueue.push('try scrolling horizontally through the pages');
          this.shownMessages.add('page-hint');
        }
      }, 15000);

      // Encourage detail exploration
      setTimeout(() => {
        const anyDetailOpen = document.querySelector('.detail-sheet.active');
        if (!anyDetailOpen && !this.shownMessages.has('detail-hint')) {
          this.messageQueue.push('click the up arrows to see more details');
          this.shownMessages.add('detail-hint');
        }
      }, 25000);

      // Final engagement message
      setTimeout(() => {
        if (!this.shownMessages.has('contact-reminder')) {
          this.messageQueue.push('like what you see? let\'s connect!');
          this.shownMessages.add('contact-reminder');
        }
      }, 40000);
    }
  }

  // Expose class in case you want to instantiate manually elsewhere
  window.DynamicGuide = DynamicGuide;

  // Default init for your current page structure
  document.addEventListener("DOMContentLoaded", () => {
    const guideContainer = document.getElementById("header-guide");
    const mainHeader     = document.querySelector(".main-header");
    if (!guideContainer || !mainHeader) return;

    new DynamicGuide({
      container: guideContainer,
      header: mainHeader,
      heroMessages: [
        "welcome",
        "hint: click and drag the screen to find a hidden message"
      ],
      messages: [
        "welcome to my site",
        "enjoying the visuals?",
        "each project tells a story",
        "built with passion and precision"
      ],
      interactions: [
        {
          selector: '#download-resume-btn',
          event: 'click',
          message: 'thanks for checking out my resume'
        },
        {
          selector: '.page-up-arrow',
          event: 'click',
          message: 'diving deeper... nice'
        },
        {
          selector: '#scroll-arrow',
          event: 'click',
          message: "let's explore"
        },
        {
          selector: '.sheet-close',
          event: 'click',
          message: 'back to browsing'
        }
      ],
      showDuration: 3500,
      transitionGap: 1500
    });
  });
})();
