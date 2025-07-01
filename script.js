// script.js - Creative Prompt Library

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const vantaEffectContainer = document.getElementById('vanta-background');
    const promptGridContainer = document.getElementById('prompt-grid-container');
    const categoryFilterContainer = document.getElementById('category-filter-container');

    // Data URL
    const PROMPTS_DATA_URL = 'https://raw.githubusercontent.com/RehanRC/RehanRC/main/Interesting_Prompt_Use_Cases/prompts.json';

    let allPromptsData = []; // To store all fetched prompts
    let currentActiveCategory = 'All'; // Default active category

    /**
     * Initializes the Vanta.js NET effect on the background container.
     */
    function initVantaBackground() {
        if (window.VANTA && vantaEffectContainer) {
            window.VANTA.NET({
                el: "#vanta-background",
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x00ffff, // Cyan like color for points/lines
                backgroundColor: 0x12121a, // Dark background for Vanta
                points: 10.00, // Number of points
                maxDistance: 20.00, // Max distance between points for lines
                spacing: 15.00 // Spacing of the net
            });
        } else {
            console.warn("Vanta.js or #vanta-background element not found. Skipping background effect.");
            // Fallback solid background if Vanta fails
            if (vantaEffectContainer) vantaEffectContainer.style.backgroundColor = '#12121a';
        }
    }

    /**
     * Fetches prompt data from the specified URL.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of prompt objects.
     */
    async function fetchPromptsData() {
        try {
            const response = await fetch(PROMPTS_DATA_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch prompt data:", error);
            promptGridContainer.innerHTML = '<p class="error-message">Failed to load creative prompts. Please check the ancient network cables or try again later.</p>';
            return [];
        }
    }

    /**
     * Creates an HTML element for a single prompt card.
     * @param {Object} prompt - The prompt data object.
     * @returns {HTMLElement} The created prompt card element.
     */
    function createPromptCardElement(prompt) {
        const card = document.createElement('article');
        card.className = 'prompt-card';
        card.dataset.category = prompt.category;

        // Basic sanitization helper
        const sanitizeHTML = (str) => {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        };

        card.innerHTML = `
            <h2 class="prompt-title">${sanitizeHTML(prompt.title)}</h2>
            <div class="prompt-details">
                <section class="prompt-section">
                    <h3>Description</h3>
                    <p>${sanitizeHTML(prompt.description)}</p>
                </section>
                <section class="prompt-section">
                    <h3>Instructions</h3>
                    <pre><code>${sanitizeHTML(prompt.instructions)}</code></pre>
                </section>
                <section class="prompt-section">
                    <h3>Transformation</h3>
                    <p>${sanitizeHTML(prompt.transformation)}</p>
                </section>
            </div>
            <button class="copy-button" aria-label="Copy instructions for ${sanitizeHTML(prompt.title)}">Copy Instructions</button>
        `;

        // Add event listener for the "Copy Instructions" button
        const copyButton = card.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.instructions)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied');
                    setTimeout(() => {
                        copyButton.textContent = 'Copy Instructions';
                        copyButton.classList.remove('copied');
                    }, 2000); // Revert after 2 seconds
                })
                .catch(err => {
                    console.error('Failed to copy instructions: ', err);
                    copyButton.textContent = 'Copy Failed';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy Instructions';
                    }, 2000);
                });
        });
        return card;
    }

    /**
     * Renders the prompt cards to the grid.
     * @param {Array<Object>} promptsToRender - An array of prompt objects to render.
     */
    function renderPromptCards(promptsToRender) {
        promptGridContainer.innerHTML = ''; // Clear existing prompts
        if (promptsToRender.length === 0) {
            if (currentActiveCategory === 'All' && allPromptsData.length === 0 && !document.querySelector('.error-message')) {
                 promptGridContainer.innerHTML = '<p class="no-results-message">The Prompt Library is currently empty. Check back soon!</p>';
            } else if (currentActiveCategory !== 'All') {
                 promptGridContainer.innerHTML = `<p class="no-results-message">No prompts found for the category: "${currentActiveCategory}".</p>`;
            }
            // If an error message is already there from fetch, don't overwrite it
        } else {
            promptsToRender.forEach(prompt => {
                const cardElement = createPromptCardElement(prompt);
                promptGridContainer.appendChild(cardElement);
            });
        }
    }

    /**
     * Generates unique category filter buttons.
     * @param {Array<Object>} prompts - An array of all prompt objects.
     */
    function generateCategoryFilters(prompts) {
        const categories = ['All', ...new Set(prompts.map(prompt => prompt.category))];
        categoryFilterContainer.innerHTML = ''; // Clear existing filters

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.category = category;
            button.textContent = category;
            if (category === currentActiveCategory) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.setAttribute('aria-pressed', 'false');
            }

            button.addEventListener('click', () => {
                currentActiveCategory = category;
                filterAndRenderPrompts();
                updateActiveFilterButtonStates();
            });
            categoryFilterContainer.appendChild(button);
        });
    }

    /**
     * Updates the visual state of active filter buttons.
     */
    function updateActiveFilterButtonStates() {
        const filterButtons = categoryFilterContainer.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            if (button.dataset.category === currentActiveCategory) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }

    /**
     * Filters prompts based on the active category and re-renders them.
     */
    function filterAndRenderPrompts() {
        let filteredPrompts;
        if (currentActiveCategory === 'All') {
            filteredPrompts = allPromptsData;
        } else {
            filteredPrompts = allPromptsData.filter(prompt => prompt.category === currentActiveCategory);
        }
        renderPromptCards(filteredPrompts);
    }

    /**
     * Initializes the Creative Prompt Library.
     */
    async function initializeLibrary() {
        initVantaBackground(); // Initialize background first
        allPromptsData = await fetchPromptsData();
        if (allPromptsData.length > 0 || document.querySelector('.error-message') === null) { // Proceed if data or no fetch error
            generateCategoryFilters(allPromptsData);
            filterAndRenderPrompts(); // Initial render (shows "All" or empty message)
        }
    }

    // Start the application
    initializeLibrary();
});
