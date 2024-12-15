function loadContent(page, title) {
    fetch(`media/content/${page}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('content').innerHTML = html;
            document.title = title;
        })
        .catch(error => {
            console.error('Error fetching content:', error);
            document.getElementById('content').innerHTML = `<p>Failed to load content: ${error}</p>`;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadContent('home.html', 'Home');
});
