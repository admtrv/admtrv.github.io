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
            
            setActiveLink(page);
        })
        .catch(error => {
            console.error('Error fetching content:', error);
            document.getElementById('content').innerHTML = `<p>Failed to load content: ${error}</p>`;
        });
}

function setActiveLink(activePage) {
    const links = document.querySelectorAll('.links a');
    links.forEach(link => {
        link.classList.remove('active');
        
        if (link.getAttribute('onclick')?.includes(activePage)) {
            link.classList.add('active');
        }
    });
}

document.addEventListener('click', (event) => {
    if (event.target.closest('.links a')) {
        event.target.blur();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadContent('home.html', 'Home');
});
