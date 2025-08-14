// dynamic-guide.js
(function () {
  'use strict';

  class DynamicGuide {
    constructor(options) {
      this.container     = options.container; // #header-guide
      this.header        = options.header;    // .main-header
      this.messages      = options.messages || [
        "Having fun, aren't we?",
        "Keep at it!",
        "You're a fluid sim master!"
      ];
      this.currentIndex  = 0;

      this.showDuration  = options.showDuration  || 2000; // ms visible
      this.transitionGap = options.transitionGap || 500;  // ms fade
      this.loopEnabled   = false;

      this.timeoutId     = null;
      this.isHovered     = false;

      this.messageQueue  = [];
      this.interactions  = options.interactions || [];
      this.timeTriggers  = options.timeTriggers || [];

      this.init();
    }

    init() {
      if (!this.container || !this.header) return;

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

      this.header.addEventListener("mouseenter", () => {
        this.isHovered = true;
        // Optionally pause on hover:
        // this.loopEnabled = false;
        // this.resetMessages();
      });

      this.header.addEventListener("mouseleave", () => {
        this.isHovered = false;
        // Optionally resume after hover:
        // this.loopEnabled = true;
        // this.cycleMessages();
      });

      this.setupInteractions();
      this.setupTimeTriggers();
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

    setupTimeTriggers() {
      this.timeTriggers.forEach(cfg => {
        setTimeout(() => {
          this.triggerMessage(cfg.message);
        }, cfg.delay);
      });
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
      messages: [
        "Welcome to my site!",
        "Check out my projects below!",
        "I hope you enjoy exploring!",
        "Feel free to reach out anytime."
      ],
      interactions: [
        {
          selector: '#download-resume-btn',
          event: 'click',
          message: 'Hope you like my resume!'
        },
        {
          selector: '.page-up-arrow',
          event: 'click',
          message: 'Diving into details, cool!'
        },
        {
          selector: '#scroll-arrow',
          event: 'click',
          message: "Let's explore!"
        }
      ],
      timeTriggers: [
        {
          delay: 10000,
          message: 'Still here? Check out the projects below.'
        },
        {
          delay: 30000,
          message: 'Need help finding something? Drop me a line!'
        }
      ],
      showDuration: 4000,
      transitionGap: 3000 // 3.0s fade
    });
  });
})();
