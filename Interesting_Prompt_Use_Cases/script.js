// script.js - The Alchemist's Grimoire

document.addEventListener('DOMContentLoaded', () => {
    const promptGrid = document.getElementById('prompt-grid');
    const categoryRunesContainer = document.getElementById('category-runes-container');
    const particleContainer = document.getElementById('particle-container'); // For potential JS enhancements

    const DATA_URL = 'https://raw.githubusercontent.com/RehanRC/RehanRC/main/Interesting_Prompt_Use_Cases/prompts.json';

    let allPrompts = []; // To store all fetched prompts
    let activeCategory = 'All'; // Default active category

    /**
     * Fetches prompt data from the specified URL.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of prompt objects.
     */
    async function fetchPrompts() {
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch prompts:", error);
            promptGrid.innerHTML = '<p class="error-message">Failed to load the ancient scrolls. Please try again later.</p>';
            return []; // Return empty array on error
        }
    }

    /**
     * Creates an HTML element for a single prompt recipe.
     * @param {Object} prompt - The prompt data object.
     * @returns {HTMLElement} The created prompt card element.
     */
    function createPromptCard(prompt) {
        const card = document.createElement('article');
        card.className = 'prompt-recipe-card';
        card.dataset.category = prompt.category; // Store category for filtering

        // Sanitize text content before inserting (basic example)
        const sanitize = (text) => {
            const temp = document.createElement('div');
            temp.textContent = text;
            return temp.innerHTML;
        };

        card.innerHTML = `
            <h2>${sanitize(prompt.title)}</h2>
            <section class="prompt-description">
                <h3>Description</h3>
                <p>${sanitize(prompt.description)}</p>
            </section>
            <section class="prompt-instructions">
                <h3>Instructions</h3>
                <pre><code>${sanitize(prompt.instructions)}</code></pre>
            </section>
            <section class="prompt-transformation">
                <h3>Transformation</h3>
                <p>${sanitize(prompt.transformation)}</p>
            </section>
            <button class="transcribe-button" aria-label="Transcribe ${sanitize(prompt.title)} instructions">Transcribe Incantation</button>
        `;

        // Add event listener for the "Transcribe Incantation" button
        const transcribeButton = card.querySelector('.transcribe-button');
        transcribeButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.instructions)
                .then(() => {
                    transcribeButton.textContent = 'Transcribed!';
                    transcribeButton.classList.add('transcribed');
                    setTimeout(() => {
                        transcribeButton.textContent = 'Transcribe Incantation';
                        transcribeButton.classList.remove('transcribed');
                    }, 1500); // Revert after 1.5 seconds
                })
                .catch(err => {
                    console.error('Failed to copy instructions: ', err);
                    // Optionally, provide user feedback for copy failure
                    transcribeButton.textContent = 'Copy Failed';
                     setTimeout(() => {
                        transcribeButton.textContent = 'Transcribe Incantation';
                    }, 1500);
                });
        });

        return card;
    }

    /**
     * Renders the prompt cards to the grid.
     * @param {Array<Object>} prompts - An array of prompt objects to render.
     */
    function renderPrompts(prompts) {
        promptGrid.innerHTML = ''; // Clear existing prompts
        if (prompts.length === 0 && activeCategory !== 'All') {
             promptGrid.innerHTML = `<p class="no-results-message">No incantations found for this rune.</p>`;
        } else if (prompts.length === 0 && allPrompts.length > 0) { // Handles case where allPrompts is loaded but filter yields no results
             promptGrid.innerHTML = `<p class="no-results-message">No incantations found for this rune.</p>`;
        }
        prompts.forEach(prompt => {
            const card = createPromptCard(prompt);
            promptGrid.appendChild(card);
        });
    }

    /**
     * Generates unique category filter runes.
     * @param {Array<Object>} prompts - An array of prompt objects.
     */
    function generateFilterRunes(prompts) {
        const categories = ['All', ...new Set(prompts.map(prompt => prompt.category))];

        categoryRunesContainer.innerHTML = ''; // Clear existing runes

        categories.forEach(category => {
            const rune = document.createElement('button');
            rune.className = 'rune';
            rune.dataset.category = category;
            // Use first letter or a symbol for rune text, or full name if short
            rune.textContent = category.length > 3 ? category.substring(0,1).toUpperCase() : category;
            rune.setAttribute('aria-label', `Filter by ${category}`);
            if (category === activeCategory) {
                rune.classList.add('active');
            }

            rune.addEventListener('click', () => {
                activeCategory = category;
                filterPrompts();
                updateActiveRuneStates();
            });
            categoryRunesContainer.appendChild(rune);
        });
    }

    /**
     * Updates the visual state of filter runes.
     */
    function updateActiveRuneStates() {
        const runes = categoryRunesContainer.querySelectorAll('.rune');
        runes.forEach(r => {
            if (r.dataset.category === activeCategory) {
                r.classList.add('active');
                 r.setAttribute('aria-pressed', 'true');
            } else {
                r.classList.remove('active');
                r.setAttribute('aria-pressed', 'false');
            }
        });
    }

    /**
     * Filters prompts based on the active category and re-renders them.
     */
    function filterPrompts() {
        let filteredPrompts;
        if (activeCategory === 'All') {
            filteredPrompts = allPrompts;
        } else {
            filteredPrompts = allPrompts.filter(prompt => prompt.category === activeCategory);
        }
        renderPrompts(filteredPrompts);
    }

    /**
     * Initializes the Grimoire.
     */
    async function initGrimoire() {
        allPrompts = await fetchPrompts();
        if (allPrompts.length > 0) {
            generateFilterRunes(allPrompts);
            renderPrompts(allPrompts); // Initial render of all prompts
        } else if (!promptGrid.querySelector('.error-message')) { // Avoid double error message
             promptGrid.innerHTML = '<p class="no-results-message">The Grimoire is currently empty. No ancient scrolls found.</p>';
        }
        // Particle effect is CSS-driven, but JS could enhance it here if needed.
        // For example, mouse-interactive particles. For now, CSS handles it.
    }

    // Let the ancient scripts load...
    initGrimoire();

    // Optional: Simple mouse-reactive particle effect for the background (enhancement)
    // This is a very basic example. More complex libraries could be used.
    // The current CSS particle effect is good for ambient, this adds minor mouse interaction.
    document.body.addEventListener('mousemove', (e) => {
        // This is just a placeholder if more complex JS particle interaction is desired.
        // The CSS handles the primary ambient particle effect.
        // For example, one could adjust CSS variables here:
        // particleContainer.style.setProperty('--mouse-x', `${e.clientX / window.innerWidth}`);
        // particleContainer.style.setProperty('--mouse-y', `${e.clientY / window.innerHeight}`);
    });
});
