// script.js - Creative Prompt Library - Advanced Two-Level Filtering

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const vantaEffectContainer = document.getElementById('vanta-background');
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subcategoriesContainer = document.getElementById('subcategories');
    const subcategoriesSection = document.getElementById('subcategories-section'); // To hide/show
    const promptGridContainer = document.getElementById('prompt-grid-container');

    // Data URL (New URL for two-level data)
    const PROMPTS_DATA_URL = 'https://raw.githubusercontent.com/RehanRC/RehanRC/main/Interesting_Prompt_Use_Cases_2/prompts.json';

    // State Variables
    let allPromptsData = [];
    let currentMainCategory = 'All';
    let currentSubCategory = 'All'; // Represents "All" within the selected main category's subcategories

    /**
     * Initializes the Vanta.js NET effect.
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
                color: 0x00ffff,
                backgroundColor: 0x12121a,
                points: 10.00,
                maxDistance: 20.00,
                spacing: 15.00
            });
        } else {
            console.warn("Vanta.js or #vanta-background element not found. Skipping background effect.");
            if (vantaEffectContainer) vantaEffectContainer.style.backgroundColor = '#12121a';
        }
    }

    /**
     * Fetches prompt data from the URL.
     * @returns {Promise<Array<Object>>} Array of prompt objects.
     */
    async function fetchPromptsData() {
        try {
            const response = await fetch(PROMPTS_DATA_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch prompt data:", error);
            promptGridContainer.innerHTML = '<p class="error-message">Failed to load prompts. The library is temporarily unavailable.</p>';
            return [];
        }
    }

    /**
     * Basic sanitization helper.
     * @param {string} str - String to sanitize.
     * @returns {string} Sanitized string.
     */
    const sanitizeHTML = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };

    /**
     * Creates an HTML element for a single prompt card.
     * @param {Object} prompt - The prompt data object.
     * @returns {HTMLElement} The created prompt card element.
     */
    function createPromptCardElement(prompt) {
        const card = document.createElement('article');
        card.className = 'prompt-card';
        card.dataset.mainCategory = prompt.main_category;
        card.dataset.subCategory = prompt.sub_category;

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

        const copyButton = card.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.instructions)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied');
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

    /**
     * Renders prompt cards to the grid.
     * @param {Array<Object>} promptsToRender - Prompts to display.
     */
    function renderPromptCards(promptsToRender) {
        promptGridContainer.innerHTML = '';
        if (promptsToRender.length === 0 && !document.querySelector('.error-message')) {
            promptGridContainer.innerHTML = `<p class="no-results-message">No prompts match the current filter criteria.</p>`;
        } else {
            promptsToRender.forEach(prompt => {
                promptGridContainer.appendChild(createPromptCardElement(prompt));
            });
        }
    }

    /**
     * Updates active state for a group of filter buttons.
     * @param {HTMLElement} container - The container of the filter buttons.
     * @param {string} activeCategoryName - The name of the category to mark as active.
     */
    function updateActiveButtonStates(container, activeCategoryName) {
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

    /**
     * Populates filter buttons in a given container.
     * @param {HTMLElement} container - The DOM element to populate.
     * @param {Array<string>} categories - Array of category names.
     * @param {string} currentActive - The currently active category name for this group.
     * @param {Function} clickHandler - Function to call on button click.
     */
    function populateFilterButtons(container, categories, currentActive, clickHandler) {
        container.innerHTML = '';
        categories.forEach(categoryName => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.category = categoryName;
            button.textContent = categoryName;
            if (categoryName === currentActive) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                 button.setAttribute('aria-pressed', 'false');
            }
            button.addEventListener('click', () => clickHandler(categoryName));
            container.appendChild(button);
        });
    }

    /**
     * Handles main category filter clicks.
     * @param {string} mainCategoryName - The clicked main category name.
     */
    function handleMainCategoryClick(mainCategoryName) {
        currentMainCategory = mainCategoryName;
        currentSubCategory = 'All'; // Reset subcategory when main changes

        updateActiveButtonStates(mainCategoriesContainer, currentMainCategory);

        if (currentMainCategory === 'All') {
            subcategoriesContainer.innerHTML = ''; // Clear subcategories
            subcategoriesSection.classList.add('hidden'); // Hide subcategory section
            renderPromptsBasedOnFilters();
        } else {
            const relevantPrompts = allPromptsData.filter(p => p.main_category === currentMainCategory);
            const subCategoryNames = ['All', ...new Set(relevantPrompts.map(p => p.sub_category))];

            populateFilterButtons(subcategoriesContainer, subCategoryNames, currentSubCategory, handleSubCategoryClick);
            subcategoriesSection.classList.remove('hidden'); // Show subcategory section
            renderPromptsBasedOnFilters();
        }
    }

    /**
     * Handles subcategory filter clicks.
     * @param {string} subCategoryName - The clicked subcategory name.
     */
    function handleSubCategoryClick(subCategoryName) {
        currentSubCategory = subCategoryName;
        updateActiveButtonStates(subcategoriesContainer, currentSubCategory);
        renderPromptsBasedOnFilters();
    }

    /**
     * Filters and renders prompts based on current main and sub category selections.
     */
    function renderPromptsBasedOnFilters() {
        let filteredPrompts = allPromptsData;

        if (currentMainCategory !== 'All') {
            filteredPrompts = filteredPrompts.filter(p => p.main_category === currentMainCategory);
        }

        if (currentSubCategory !== 'All' && currentMainCategory !== 'All') { // Only apply sub-filter if a main category is chosen
            filteredPrompts = filteredPrompts.filter(p => p.sub_category === currentSubCategory);
        }

        renderPromptCards(filteredPrompts);
    }

    /**
     * Initializes the application.
     */
    async function initializeLibrary() {
        initVantaBackground();
        allPromptsData = await fetchPromptsData();

        if (allPromptsData.length > 0) {
            const mainCategoryNames = ['All', ...new Set(allPromptsData.map(p => p.main_category))];
            populateFilterButtons(mainCategoriesContainer, mainCategoryNames, currentMainCategory, handleMainCategoryClick);

            // Initially hide subcategories until a main category (other than 'All') is selected
            subcategoriesSection.classList.add('hidden');

            renderPromptsBasedOnFilters(); // Initial render (all prompts)
        } else if (!document.querySelector('.error-message')) {
             promptGridContainer.innerHTML = '<p class="no-results-message">The Prompt Library is currently empty.</p>';
        }
    }

    // Start the application
    initializeLibrary();
});
