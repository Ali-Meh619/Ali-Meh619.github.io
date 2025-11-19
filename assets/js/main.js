/**
* Template Name: iPortfolio
* Updated: Jul 27 2023 with Bootstrap v5.3.1
* Template URL: https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos,
      behavior: 'smooth'
    })
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('body').classList.toggle('mobile-nav-active')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let body = select('body')
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Hero type effect
   */
  const typed = select('.typed')
  if (typed) {
    let typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Skills animation
   */
  let skilsContent = select('.skills-content');
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: '80%',
      handler: function(direction) {
        let progress = select('.progress .progress-bar', true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute('aria-valuenow') + '%'
        });
      }
    })
  }

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function() {
          AOS.refresh()
        });
      }, true);
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  const portfolioLightbox = GLightbox({
    selector: '.portfolio-lightbox'
  });

  /**
   * Portfolio details slider
   */
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Testimonials slider
   */
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20
      },

      1200: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

  /**
   * Initiate Pure Counter 
   */
  new PureCounter();

  /**
   * Reading Progress Indicator
   */
  const readingProgress = document.createElement('div');
  readingProgress.className = 'reading-progress';
  document.body.appendChild(readingProgress);

  function updateReadingProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
    readingProgress.style.width = Math.min(progress, 100) + '%';
  }

  window.addEventListener('scroll', updateReadingProgress);
  window.addEventListener('resize', updateReadingProgress);
  updateReadingProgress();

  /**
   * Enhanced Back to Top Button
   */
  const backToTopButton = document.querySelector('.back-to-top');
  if (backToTopButton) {
    function toggleBackToTop() {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('active');
      } else {
        backToTopButton.classList.remove('active');
      }
    }

    window.addEventListener('scroll', toggleBackToTop);
    toggleBackToTop();

    backToTopButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Dark Mode Toggle
   */
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', 'Toggle dark mode');
  themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
  document.body.appendChild(themeToggle);

  // Check for saved theme preference or default to light mode
  const currentTheme = localStorage.getItem('theme') || 'light';
  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
      themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
    }
    
    // Update graph theme if it exists
    if (typeof updateGraphTheme === 'function') {
      updateGraphTheme();
    }
  });

  /**
   * Interactive Skill Graph
   */
  const container = document.getElementById('skill-graph');
  let updateGraphTheme;

  if (container) {
    const nodes = new vis.DataSet([
      // Core Areas
      { id: 1, label: 'Machine Learning', group: 'core', value: 25 },
      { id: 2, label: 'Wireless Comm', group: 'core', value: 20 },
      
      // AI Skills
      { id: 3, label: 'LLMs', group: 'ai', value: 15 },
      { id: 4, label: 'GNNs', group: 'ai', value: 18 },
      { id: 5, label: 'Deep Learning', group: 'ai', value: 15 },
      { id: 6, label: 'Computer Vision', group: 'ai', value: 12 },
      { id: 7, label: 'Time Series', group: 'ai', value: 12 },
      
      // Tools & Frameworks
      { id: 8, label: 'PyTorch', group: 'tool', value: 15 },
      { id: 9, label: 'TensorFlow', group: 'tool', value: 10 },
      { id: 10, label: 'Docker', group: 'tool', value: 10 },
      { id: 11, label: 'AWS', group: 'tool', value: 8 },
      { id: 12, label: 'Python', group: 'tool', value: 15 },
      
      // Specific Concepts
      { id: 13, label: 'Optimization', group: 'concept', value: 10 },
      { id: 14, label: 'Agents', group: 'concept', value: 12 },
      { id: 15, label: 'Mamba', group: 'concept', value: 10 },
      { id: 16, label: 'Graph Transformer', group: 'concept', value: 10 }
    ]);

    const edges = new vis.DataSet([
      // Connections to Core
      { from: 1, to: 3 }, // ML -> LLMs
      { from: 1, to: 4 }, // ML -> GNNs
      { from: 1, to: 5 }, // ML -> Deep Learning
      { from: 1, to: 6 }, // ML -> Computer Vision
      { from: 1, to: 7 }, // ML -> Time Series
      { from: 1, to: 12 }, // ML -> Python
      
      { from: 2, to: 13 }, // Wireless -> Optimization
      { from: 2, to: 4 },  // Wireless -> GNNs (applied)
      
      // Skill Connections
      { from: 3, to: 14 }, // LLMs -> Agents
      { from: 4, to: 16 }, // GNNs -> Graph Transformer
      { from: 5, to: 8 },  // DL -> PyTorch
      { from: 5, to: 9 },  // DL -> TensorFlow
      { from: 12, to: 8 }, // Python -> PyTorch
      { from: 4, to: 15 }, // GNNs -> Mamba
      
      // Tool Connections
      { from: 10, to: 11 }, // Docker -> AWS
      { from: 1, to: 13 },  // ML -> Optimization
    ]);

    const getGraphOptions = (isDark) => {
      const textColor = isDark ? '#e0e0e0' : '#333333';
      const coreColor = '#149ddd';
      const aiColor = '#37b3ed';
      const toolColor = isDark ? '#6c757d' : '#adb5bd'; // Lighter in dark mode for contrast? Or distinct
      
      return {
        nodes: {
          shape: 'dot',
          font: {
            size: 16,
            face: 'Open Sans',
            color: textColor
          },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          width: 1,
          color: { color: isDark ? '#555555' : '#cccccc', highlight: '#149ddd' },
          smooth: {
            type: 'continuous'
          }
        },
        physics: {
          stabilization: false,
          barnesHut: {
            gravitationalConstant: -2000,
            springConstant: 0.04,
            springLength: 95
          }
        },
        groups: {
          core: { color: { background: '#149ddd', border: '#0a6ca3' }, font: { size: 20, color: '#ffffff' } },
          ai:   { color: { background: '#37b3ed', border: '#149ddd' }, font: { color: textColor } },
          tool: { color: { background: isDark ? '#444444' : '#e9ecef', border: '#adb5bd' }, font: { color: textColor } },
          concept: { color: { background: '#ffc107', border: '#d39e00' }, font: { color: isDark ? '#000' : '#333' } }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: false
        }
      };
    };

    const network = new vis.Network(container, { nodes, edges }, getGraphOptions(currentTheme === 'dark'));

    // Function to update graph theme dynamically
    updateGraphTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      network.setOptions(getGraphOptions(isDark));
    };
  }

})()