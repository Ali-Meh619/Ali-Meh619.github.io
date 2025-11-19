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
      // --- CLUSTER 1: Technical / ML (Left/Center) ---
      { id: 1, label: 'Machine Learning', group: 'core_tech', value: 35 },
      { id: 2, label: 'Generative AI', group: 'core_tech', value: 30 },
      { id: 3, label: 'Research', group: 'core_tech', value: 28 },
      
      // Deep Tech
      { id: 4, label: 'LLMs', group: 'ai_tech', value: 25 },
      { id: 5, label: 'Agentic AI', group: 'ai_tech', value: 24 },
      { id: 6, label: 'GNNs', group: 'ai_tech', value: 20 },
      { id: 7, label: 'RAG', group: 'ai_tech', value: 18 },
      { id: 8, label: 'MCP', group: 'ai_tech', value: 18 },
      { id: 9, label: 'Transformers', group: 'ai_tech', value: 18 },
      
      // Tools & Code
      { id: 10, label: 'Python', group: 'tools', value: 22 },
      { id: 11, label: 'PyTorch', group: 'tools', value: 18 },
      { id: 12, label: 'LangChain', group: 'tools', value: 16 },
      { id: 13, label: 'Docker', group: 'tools', value: 15 },
      
      // --- CLUSTER 2: Soft Skills / Process (Right/Top) ---
      { id: 20, label: 'Problem Solving', group: 'soft', value: 22 },
      { id: 21, label: 'Leadership', group: 'soft', value: 20 },
      { id: 22, label: 'Collaboration', group: 'soft', value: 20 },
      { id: 23, label: 'Project Mgmt', group: 'soft', value: 18 },
      { id: 24, label: 'Innovation', group: 'soft', value: 18 },
      { id: 25, label: 'Communication', group: 'soft', value: 18 }
    ]);

    const edges = new vis.DataSet([
      // Tech Cluster Connections
      { from: 1, to: 2 }, // ML <-> GenAI
      { from: 1, to: 10 }, // ML -> Python
      { from: 1, to: 11 }, // ML -> PyTorch
      { from: 2, to: 4 }, // GenAI -> LLMs
      { from: 2, to: 5 }, // GenAI -> Agentic AI
      
      { from: 4, to: 9 }, // LLMs -> Transformers
      { from: 4, to: 7 }, // LLMs -> RAG
      { from: 5, to: 8 }, // Agentic AI -> MCP
      { from: 5, to: 12 }, // Agentic AI -> LangChain
      { from: 1, to: 6 }, // ML -> GNNs
      
      { from: 10, to: 13 }, // Python -> Docker
      
      // Soft Skills Cluster Connections
      { from: 20, to: 24 }, // Problem Solving <-> Innovation
      { from: 21, to: 23 }, // Leadership <-> Project Mgmt
      { from: 21, to: 22 }, // Leadership <-> Collaboration
      { from: 22, to: 25 }, // Collaboration <-> Communication
      
      // Bridges between Tech and Soft Skills
      { from: 3, to: 1 },  // Research <-> ML
      { from: 3, to: 24 }, // Research <-> Innovation (Bridge)
      { from: 5, to: 20 }, // Agentic AI <-> Problem Solving (Bridge)
      { from: 23, to: 13 }, // Project Mgmt <-> Docker (DevOps link)
      { from: 21, to: 3 },  // Leadership <-> Research (Leading research)
    ]);

    const getGraphOptions = (isDark) => {
      // High contrast color palette for readability
      const textColor = isDark ? '#ffffff' : '#000000';
      const nodeBorder = isDark ? '#ffffff' : '#333333';
      
      // Distinct but harmonious palette
      const techBlue = '#2196F3';    // Core Tech
      const deepPurple = '#9C27B0';  // AI/Deep Tech
      const toolGreen = '#009688';   // Tools
      const softOrange = '#FF9800';  // Soft Skills
      
      return {
        nodes: {
          shape: 'dot',
          font: {
            size: 20,
            face: 'Poppins, sans-serif',
            color: textColor,
            strokeWidth: 4, // Thicker outline for text
            strokeColor: isDark ? '#121212' : '#ffffff', // Text outline (halo) for readability
            vadjust: -1
          },
          borderWidth: 2,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.3)',
            size: 10,
            x: 3,
            y: 3
          }
        },
        edges: {
          width: 1.5,
          color: { 
            color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', 
            highlight: '#2196F3',
            hover: '#2196F3'
          },
          smooth: {
            type: 'continuous',
            roundness: 0.5
          }
        },
        physics: {
          stabilization: false,
          barnesHut: {
            gravitationalConstant: -4000, // Stronger repulsion to separate clusters
            springConstant: 0.03,
            springLength: 150, // Longer springs for spacing
            damping: 0.09
          }
        },
        groups: {
          core_tech: { 
            color: { background: techBlue, border: '#0d47a1' }, 
            font: { size: 28, color: '#ffffff' } // Larger font for core
          },
          ai_tech: { 
            color: { background: deepPurple, border: '#4a148c' }, 
            font: { color: textColor } 
          },
          tools: { 
            color: { background: toolGreen, border: '#004d40' }, 
            font: { color: textColor } 
          },
          soft: { 
            color: { background: softOrange, border: '#e65100' }, 
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