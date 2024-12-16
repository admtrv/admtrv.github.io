document.addEventListener('DOMContentLoaded', () => {
    fetch('/media/content/header.html')
        .then(response => response.text())
        .then(headerHtml => {
            document.getElementById('header-container').innerHTML = headerHtml;
            setActiveLink();
        })
        .catch(error => console.error('Error loading header:', error));
});

function setActiveLink() {
    const activeSection = document.body.dataset.section;

    const links = document.querySelectorAll('.links a[data-section]');
    links.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === activeSection) {
            link.classList.add('active');
        }
    });
}
