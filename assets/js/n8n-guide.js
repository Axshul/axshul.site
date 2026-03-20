document.addEventListener("DOMContentLoaded", () => {
    const articleList = document.getElementById('article-list');
    const searchInput = document.getElementById('guide-search');
    const tagsContainer = document.getElementById('tags-container');

    let articles = window.n8nArticles || [];
    let activeTag = null;

    if (articles.length === 0) {
        if(articleList) {
            articleList.innerHTML = `<p style="color:red; font-weight: bold;">Error loading guides. Please check articlesData.js.</p>`;
        }
        return;
    }

    renderArticles(articles);
    renderTags(articles);

    function renderArticles(data) {
        if (!articleList) return;
        articleList.innerHTML = '';
        if (data.length === 0) {
            articleList.innerHTML = `<p class="ar-desc" style="font-style:italic;">No guides found matching your search.</p>`;
            return;
        }

        data.forEach((article, index) => {
            const num = String(index + 1).padStart(2, '0');
            const tagsHtml = article.tags.map(t => `<span class="ar-tag">${t}</span>`).join('');

            const html = `
                <a href="article.html?id=${article.id}" class="article-row">
                    <div class="ar-num">${num}</div>
                    <div class="ar-content">
                        <div class="ar-tags-wrap">${tagsHtml}</div>
                        <h2 class="ar-title">${article.title}</h2>
                        <p class="ar-desc">${article.description}</p>
                    </div>
                    <div class="ar-action">→</div>
                </a>
            `;
            articleList.insertAdjacentHTML('beforeend', html);
        });
    }

    function renderTags(data) {
        if (!tagsContainer) return;
        const allTags = new Set();
        data.forEach(a => a.tags.forEach(t => allTags.add(t)));
        
        // Render All button
        tagsContainer.innerHTML = `<button class="filter-tag active" data-tag="all">All Files</button>`;
        
        // Render unique tags
        Array.from(allTags).sort().forEach(tag => {
            tagsContainer.innerHTML += `<button class="filter-tag" data-tag="${tag}">${tag}</button>`;
        });

        // Listeners
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const selected = e.target.getAttribute('data-tag');
                activeTag = selected === 'all' ? null : selected;
                filterResults();
            });
        });
    }

    function filterResults() {
        if(!searchInput) return;
        const query = searchInput.value.toLowerCase();
        
        const filtered = articles.filter(a => {
            const matchesQuery = a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query);
            const matchesTag = activeTag ? a.tags.includes(activeTag) : true;
            return matchesQuery && matchesTag;
        });

        renderArticles(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterResults);
    }
});
