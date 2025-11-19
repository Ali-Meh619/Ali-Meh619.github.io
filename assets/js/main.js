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
      // --- CLUSTER 1: Core ML & Deep Learning (Left) ---
      { id: 1, label: 'Machine Learning', group: 'core', value: 35 },
      { id: 2, label: 'Deep Learning', group: 'core', value: 32 },
      { id: 3, label: 'LLMs', group: 'core', value: 30 },
      { id: 4, label: 'Agentic AI', group: 'core', value: 28 },
      
      // Architectures & Methods
      { id: 5, label: 'GNNs', group: 'method', value: 22 },
      { id: 6, label: 'Transformers', group: 'method', value: 22 },
      { id: 7, label: 'RAG', group: 'method', value: 20 },
      { id: 8, label: 'MCP', group: 'method', value: 18 },
      { id: 9, label: 'Fine-tuning', group: 'method', value: 18 },
      { id: 10, label: 'CNNs / RNNs', group: 'method', value: 18 },
      { id: 11, label: 'Optimization', group: 'method', value: 18 },
      { id: 12, label: 'Time-Series', group: 'method', value: 18 },
      { id: 13, label: 'Unsupervised', group: 'method', value: 18 },
      
      // --- CLUSTER 2: Tools, Languages & Frameworks (Right) ---
      { id: 20, label: 'Python', group: 'tool', value: 25 },
      { id: 21, label: 'PyTorch', group: 'tool', value: 22 },
      { id: 22, label: 'TensorFlow', group: 'tool', value: 20 },
      { id: 23, label: 'LangChain', group: 'tool', value: 20 },
      { id: 24, label: 'Docker / AWS', group: 'tool', value: 18 },
      { id: 25, label: 'SQL', group: 'tool', value: 15 },
      { id: 26, label: 'C/C++', group: 'tool', value: 15 },
      { id: 27, label: 'MATLAB', group: 'tool', value: 15 },
      { id: 28, label: 'Git / GitHub', group: 'tool', value: 15 }
    ]);

    const edges = new vis.DataSet([
      // Core Connections
      { from: 1, to: 2 }, // ML <-> Deep Learning
      { from: 1, to: 11 }, // ML -> Optimization
      { from: 1, to: 12 }, // ML -> Time-Series
      { from: 1, to: 13 }, // ML -> Unsupervised
      
      { from: 2, to: 3 }, // DL -> LLMs
      { from: 2, to: 5 }, // DL -> GNNs
      { from: 2, to: 6 }, // DL -> Transformers
      { from: 2, to: 10 }, // DL -> CNNs/RNNs
      
      // Advanced AI Connections
      { from: 3, to: 4 }, // LLMs -> Agentic AI
      { from: 3, to: 7 }, // LLMs -> RAG
      { from: 3, to: 9 }, // LLMs -> Fine-tuning
      { from: 4, to: 8 }, // Agentic AI -> MCP
      
      // Bridges to Tools (Cluster 1 -> Cluster 2)
      { from: 1, to: 20 }, // ML -> Python
      { from: 2, to: 21 }, // DL -> PyTorch
      { from: 2, to: 22 }, // DL -> TensorFlow
      { from: 4, to: 23 }, // Agentic AI -> LangChain
      { from: 4, to: 24 }, // Agentic AI -> Docker/AWS (Deployment)
      { from: 1, to: 25 }, // ML -> SQL
      { from: 11, to: 27 }, // Optimization -> MATLAB
      
      // Tool Connections
      { from: 20, to: 21 }, // Python -> PyTorch
      { from: 20, to: 22 }, // Python -> TF
      { from: 20, to: 23 }, // Python -> LangChain
      { from: 20, to: 26 }, // Python -> C++ (integration)
      { from: 20, to: 28 }, // Python -> Git
    ]);

    const getGraphOptions = (isDark) => {
      // Text Color: Dark Grey (Light Mode) vs Bright Blue (Dark Mode)
      const textColor = isDark ? '#64b5f6' : '#2d3436'; 
      
      // Palette
      const coreColor = '#1976D2';   // Strong Blue
      const methodColor = '#7B1FA2'; // Purple
      const toolColor = '#00796B';   // Teal
      
      // Edge Colors
      const edgeColor = isDark ? 'rgba(100, 181, 246, 0.4)' : 'rgba(45, 52, 54, 0.2)'; // Matching Blue tint
      const edgeHighlight = '#FF5722'; // Deep Orange

      return {
        nodes: {
          shape: 'dot',
          font: {
            size: 18,
            face: 'Poppins, sans-serif',
            color: textColor,
            strokeWidth: isDark ? 0 : 3, 
            strokeColor: '#ffffff',      
            vadjust: -1
          },
          borderWidth: 2,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.2)',
            size: 10,
            x: 5,
            y: 5
          }
        },
        edges: {
          width: 2,
          color: { 
            color: edgeColor,
            highlight: edgeHighlight,
            hover: edgeHighlight
          },
          smooth: {
            type: 'continuous',
            roundness: 0.5
          }
        },
        physics: {
          stabilization: false,
          barnesHut: {
            gravitationalConstant: -3000,
            springConstant: 0.04,
            springLength: 120,
            damping: 0.09
          }
        },
        groups: {
          core: { 
            color: { background: coreColor, border: '#0D47A1' }, 
            font: { size: 24, color: textColor } 
          },
          method: { 
            color: { background: methodColor, border: '#4A148C' }, 
            font: { color: textColor } 
          },
          tool: { 
            color: { background: toolColor, border: '#004D40' }, 
            font: { color: textColor } 
          }
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