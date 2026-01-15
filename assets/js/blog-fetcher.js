/**
 * CodeProb Blog Fetcher
 * Fetches and displays content from CodeProb GitHub repository
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        GITHUB_RAW_URL: 'https://raw.githubusercontent.com/CodeProb/CodeProb/main/contributor-config.json',
        CODEPROB_BASE_URL: 'https://codeprob.github.io/CodeProb',
        AUTHOR_NAMES: ['Anshul Namdev', 'anshul namdev', 'axshul'],
        CACHE_KEY: 'codeprob_blog_cache',
        CACHE_DURATION: 1000 * 60 * 30 // 30 minutes
    };

    // State
    let allContent = [];
    let currentFilter = 'all';

    // DOM Elements
    const blogGrid = document.getElementById('blog-grid');
    const filterTabs = document.querySelectorAll('.filter-tab');

    /**
     * Initialize the blog fetcher
     */
    async function init() {
        try {
            // Try to load from cache first
            const cachedData = loadFromCache();
            if (cachedData) {
                console.log('Loading from cache...');
                processData(cachedData);
            } else {
                console.log('Fetching from GitHub...');
                await fetchFromGitHub();
            }

            // Setup event listeners
            setupFilterTabs();
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize blog. Please refresh the page.');
        }
    }

    /**
     * Fetch data from GitHub
     */
    async function fetchFromGitHub() {
        try {
            const response = await fetch(CONFIG.GITHUB_RAW_URL);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Save to cache
            saveToCache(data);

            // Process the data
            processData(data);
        } catch (error) {
            console.error('Fetch error:', error);
            showError('Unable to load content from CodeProb. Please check your internet connection and try again.');
        }
    }

    /**
     * Process fetched data
     */
    function processData(data) {
        allContent = [];

        // Extract content for this author
        const contentTypes = ['blogs', 'articles', 'problems', 'concepts'];

        contentTypes.forEach(type => {
            if (data.content && data.content[type]) {
                data.content[type].forEach(item => {
                    if (isAuthorMatch(item.author)) {
                        allContent.push({
                            ...item,
                            type: type,
                            typeSingular: type.slice(0, -1) // Remove 's' for display
                        });
                    }
                });
            }
        });

        // Sort by date (newest first)
        allContent.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

        // Update UI
        renderContent();
    }

    /**
     * Check if author matches
     */
    function isAuthorMatch(author) {
        const authorLower = author.toLowerCase();
        return CONFIG.AUTHOR_NAMES.some(name => authorLower.includes(name.toLowerCase()));
    }

    /**
     * Render content cards
     */
    function renderContent() {
        const filteredContent = currentFilter === 'all'
            ? allContent
            : allContent.filter(item => item.type === currentFilter);

        if (filteredContent.length === 0) {
            showEmptyState();
            return;
        }

        blogGrid.innerHTML = filteredContent.map(item => createCard(item)).join('');

        // Add stagger animation
        const cards = blogGrid.querySelectorAll('.blog-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    /**
     * Create a blog card HTML
     */
    function createCard(item) {
        const url = `${CONFIG.CODEPROB_BASE_URL}/${item.type}/${item.filename}`;
        const tags = item.tags || item.topics || [];
        const readTime = item.readTime || '';
        const difficulty = item.difficulty || '';
        const complexity = item.complexity || '';

        return `
            <article class="blog-card">
                <span class="blog-card-badge type-${item.typeSingular}">${item.typeSingular}</span>
                <h3><a href="${url}" target="_blank">${escapeHtml(item.title)}</a></h3>
                <div class="blog-card-meta">
                    <span>📅 ${formatDate(item.dateAdded)}</span>
                    ${readTime ? `<span>⏱️ ${readTime}</span>` : ''}
                    ${difficulty ? `<span>📊 ${capitalize(difficulty)}</span>` : ''}
                    ${complexity ? `<span>📊 ${capitalize(complexity)}</span>` : ''}
                </div>
                ${tags.length > 0 ? `
                    <div class="blog-card-tags">
                        ${tags.slice(0, 5).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </article>
        `;
    }

    /**
     * Setup filter tab event listeners
     */
    function setupFilterTabs() {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update filter
                currentFilter = tab.dataset.filter;

                // Re-render content
                renderContent();
            });
        });
    }

    /**
     * Show empty state
     */
    function showEmptyState() {
        blogGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>No content found</h3>
                <p>No ${currentFilter === 'all' ? '' : currentFilter} available at the moment.</p>
            </div>
        `;
    }

    /**
     * Show error state
     */
    function showError(message) {
        blogGrid.innerHTML = `
            <div class="error-state" style="grid-column: 1 / -1;">
                <h3>⚠️ Error Loading Content</h3>
                <p>${escapeHtml(message)}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.8rem 2rem; background: var(--accent-blue); color: white; border: none; cursor: pointer; font-family: var(--font-sans); text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">
                    Retry
                </button>
            </div>
        `;
    }

    /**
     * Cache management
     */
    function saveToCache(data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save to cache:', error);
        }
    }

    function loadFromCache() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            if (age > CONFIG.CACHE_DURATION) {
                localStorage.removeItem(CONFIG.CACHE_KEY);
                return null;
            }

            return cacheData.data;
        } catch (error) {
            console.warn('Failed to load from cache:', error);
            return null;
        }
    }

    /**
     * Utility functions
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
