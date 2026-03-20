document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const contentDiv = document.getElementById('reader-content');

    if (!articleId) {
        contentDiv.innerHTML = `<h2>Article not found</h2><p style="margin-top:1rem;">Please return to the <a href="index.html" style="color:var(--blue);text-decoration:underline;">archive</a> to select an article.</p>`;
        return;
    }

    const articles = window.n8nArticles || [];
    const article = articles.find(a => a.id === articleId);

    if (!article) {
        contentDiv.innerHTML = `<h2>Article not found</h2><p style="margin-top:1rem;">This article might have been moved or doesn't exist.</p>`;
        return;
    }

    const tagsHtml = article.tags.map(t => `<span class="ar-tag" style="background:var(--bg-off); border:1px solid var(--border); color:var(--text-mid); padding:0.3rem 0.8rem; border-radius:100px; font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">${t}</span>`).join('');

    const html = `
        <header class="reader-header">
            <div class="reader-tags">${tagsHtml}</div>
            <h1 class="reader-title">${article.title}</h1>
            <div class="reader-meta">Published on ${article.date} · By ${article.author}</div>
        </header>
        <div class="reader-body">
            ${article.content}
        </div>
    `;
    
    contentDiv.innerHTML = html;
    document.title = `${article.title} — n8n Guide`;
});
