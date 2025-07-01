// script.js - Creative Prompt Library - GRIDPULSE Edition

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements from Library
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subcategoriesContainer = document.getElementById('subcategories');
    const subcategoriesSection = document.getElementById('subcategories-section');
    const promptGridContainer = document.getElementById('prompt-grid-container');
    const currentYearSpan = document.getElementById('current-year');

    // DOM Elements for GRIDPULSE theme
    const canvas = document.getElementById('gridpulse-background');
    const ctx = canvas ? canvas.getContext('2d') : null;

    // GRIDPULSE Canvas Variables
    let width, height, gridSize, particles;
    const particleSpeed = 0.4; // Slightly slower
    const connectionDistance = 90;
    const particleColor = 'rgba(0, 255, 255, 0.6)';
    const lineColor = 'rgba(0, 255, 255, 0.1)';
    const staticGridColor = 'rgba(0, 255, 255, 0.04)';

    // Library State Variables
    const PROMPTS_DATA_URL = 'https://raw.githubusercontent.com/RehanRC/RehanRC/main/Interesting_Prompt_Use_Cases_2/prompts.json';
    let allPromptsData = [];
    let currentMainCategory = 'All';
    let currentSubCategory = 'All';

    // --- 1. GRIDPULSE THEME JAVASCRIPT ---

    // --- Dynamic Year for Footer ---
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Animated Grid/Particle Background ---
    function setupCanvas() {
        if (!canvas || !ctx) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        gridSize = 35; // Slightly larger grid
        particles = [];
        const numberOfParticles = Math.floor((width * height) / (gridSize * gridSize * 6));

        for (let i = 0; i < numberOfParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * particleSpeed,
                vy: (Math.random() - 0.5) * particleSpeed
            });
        }
    }

    function drawGrid() {
        if (!ctx) return;
        ctx.strokeStyle = staticGridColor;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
    }

    function drawParticlesAndConnections() {
        if (!ctx) return;
        ctx.fillStyle = particleColor;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.5;

        particles.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

            particles.forEach(otherP => {
                if (p === otherP) return;
                const dx = p.x - otherP.x; const dy = p.y - otherP.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < connectionDistance) {
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(otherP.x, otherP.y); ctx.stroke();
                }
            });
        });
    }

    function animateBackground() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        drawGrid();
        drawParticlesAndConnections();
        requestAnimationFrame(animateBackground);
    }

    if (canvas && ctx) {
        setupCanvas();
        animateBackground();
        window.addEventListener('resize', setupCanvas);
    } else {
        console.warn("Canvas element #gridpulse-background not found or context failed.");
    }

    // --- Scroll-Triggered Animations for Sections (Prompt Cards) ---
    const cardObserverOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    let cardObserver;

    function observePromptCards() {
        if (cardObserver) cardObserver.disconnect(); // Disconnect previous observer if any

        const cards = document.querySelectorAll('.prompt-card:not(.visible)'); // Only observe new, non-visible cards
        if (cards.length === 0) return;

        cardObserver = new IntersectionObserver((entries, observerRef) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observerRef.unobserve(entry.target); // Unobserve after animation
                }
            });
        }, cardObserverOptions);

        cards.forEach(card => cardObserver.observe(card));
    }

    // Also observe filter controls wrapper if it exists
    const filterControlsWrapper = document.querySelector('.filter-controls-wrapper');
    if(filterControlsWrapper){
        const staticObserver = new IntersectionObserver((entries, observerRef) => {
             entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observerRef.unobserve(entry.target);
                }
            });
        }, {threshold: 0.1});
        staticObserver.observe(filterControlsWrapper);
    }


    // --- 2. CREATIVE PROMPT LIBRARY CORE LOGIC ---

    async function fetchPromptsData() {
        try {
            const response = await fetch(PROMPTS_DATA_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return Array.isArray(data.prompts) ? data.prompts : [];
        } catch (error) {
            console.error("Failed to fetch prompt data:", error);
            if(promptGridContainer) promptGridContainer.innerHTML = '<p class="error-message">Failed to load prompts. The library is temporarily unavailable.</p>';
            return [];
        }
    }

    const sanitizeHTML = (str) => {
        if (typeof str !== 'string') str = String(str);
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };

    function createPromptCardElement(prompt) {
        const card = document.createElement('article');
        card.classList.add('prompt-card'); // Class for GRIDPULSE styling
        card.dataset.mainCategory = prompt.main_category;
        card.dataset.subCategory = prompt.sub_category;

        card.innerHTML = `
            <h2 class="prompt-title">${sanitizeHTML(prompt.title)}</h2>
            <div class="prompt-details">
                <section class="prompt-section"><h3>Description</h3><p>${sanitizeHTML(prompt.description)}</p></section>
                <section class="prompt-section"><h3>Instructions</h3><pre><code>${sanitizeHTML(prompt.instructions)}</code></pre></section>
                <section class="prompt-section"><h3>Transformation</h3><p>${sanitizeHTML(prompt.transformation)}</p></section>
            </div>
            <button class="copy-button" aria-label="Copy instructions for ${sanitizeHTML(prompt.title)}">Copy Instructions</button>
        `;

        const copyButton = card.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.instructions)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied'); // Use class for styling feedback
                    setTimeout(() => {
                        copyButton.textContent = 'Copy Instructions';
                        copyButton.classList.remove('copied');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy instructions: ', err);
                    copyButton.textContent = 'Copy Failed';
                    setTimeout(() => copyButton.textContent = 'Copy Instructions', 2000);
                });
        return card;
    }

    function renderPromptCards(promptsToRender) {
        if(!promptGridContainer) return;
        promptGridContainer.innerHTML = '';
        if (promptsToRender.length === 0 && !promptGridContainer.querySelector('.error-message')) {
            promptGridContainer.innerHTML = `<p class="no-results-message">No prompts match the current filter criteria.</p>`;
        } else {
            promptsToRender.forEach(prompt => {
                promptGridContainer.appendChild(createPromptCardElement(prompt));
            });
        }
        observePromptCards(); // Re-observe cards after rendering new ones
    }

    function updateActiveButtonStates(container, activeCategoryName) {
        if(!container) return;
        const buttons = container.querySelectorAll('.filter-button');
        buttons.forEach(button => {
            if (button.dataset.category === activeCategoryName) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }

    function populateFilterButtons(container, categories, currentActive, clickHandler) {
        if(!container) return;
        container.innerHTML = '';
        categories.forEach(categoryName => {
            const button = document.createElement('button');
            button.classList.add('filter-button');
            button.dataset.category = categoryName;
            button.textContent = categoryName;
            if (categoryName === currentActive) {
                button.classList.add('active'); button.setAttribute('aria-pressed', 'true');
            } else {
                button.setAttribute('aria-pressed', 'false');
            }
            button.addEventListener('click', () => clickHandler(categoryName));
            container.appendChild(button);
        });
    }

    function handleMainCategoryClick(mainCategoryName) {
        currentMainCategory = mainCategoryName;
        currentSubCategory = 'All';
        updateActiveButtonStates(mainCategoriesContainer, currentMainCategory);

        if (currentMainCategory === 'All') {
            if(subcategoriesContainer) subcategoriesContainer.innerHTML = '';
            if (subcategoriesSection) subcategoriesSection.classList.add('hidden');
        } else {
            const relevantPrompts = allPromptsData.filter(p => p.main_category === currentMainCategory);
            const subCategoryNames = ['All', ...new Set(relevantPrompts.map(p => p.sub_category).filter(sc => sc))];
            populateFilterButtons(subcategoriesContainer, subCategoryNames, currentSubCategory, handleSubCategoryClick);
            if (subcategoriesSection) subcategoriesSection.classList.remove('hidden');
        }
        renderPromptsBasedOnFilters();
    }

    function handleSubCategoryClick(subCategoryName) {
        currentSubCategory = subCategoryName;
        updateActiveButtonStates(subcategoriesContainer, currentSubCategory);
        renderPromptsBasedOnFilters();
    }

    function renderPromptsBasedOnFilters() {
        let filteredPrompts = allPromptsData;
        if (currentMainCategory !== 'All') {
            filteredPrompts = filteredPrompts.filter(p => p.main_category === currentMainCategory);
        }
        if (currentSubCategory !== 'All' && currentMainCategory !== 'All') {
            filteredPrompts = filteredPrompts.filter(p => p.sub_category === currentSubCategory);
        }
        renderPromptCards(filteredPrompts);
    }

    async function initializeLibrary() {
        allPromptsData = await fetchPromptsData();
        if (allPromptsData.length > 0) {
            const mainCategoryNames = ['All', ...new Set(allPromptsData.map(p => p.main_category).filter(mc => mc))];
            populateFilterButtons(mainCategoriesContainer, mainCategoryNames, currentMainCategory, handleMainCategoryClick);
            if (subcategoriesSection) subcategoriesSection.classList.add('hidden');
            renderPromptsBasedOnFilters();
        } else if (promptGridContainer && !promptGridContainer.querySelector('.error-message')) {
            promptGridContainer.innerHTML = '<p class="no-results-message">The Prompt Library is currently empty or data could not be loaded correctly.</p>';
        }
    }

    // Initialize Library and Theme Components
    if (document.readyState === 'loading') { // For safety, though defer helps
        document.addEventListener('DOMContentLoaded', initializeLibrary);
    } else {
        initializeLibrary(); // DOMContentLoaded has already fired
    }
});
