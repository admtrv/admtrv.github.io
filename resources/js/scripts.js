/*
 * scripts.js
 */

document.addEventListener('DOMContentLoaded', () => {
    fetch('/components/header.html')
        .then(response => response.text())
        .then(headerHtml => {
            document.getElementById('header-container').innerHTML = headerHtml;
            
            setActiveSection();

            loadAnimation(() => setUpAnimation());
        })
        .catch(error => console.error('Error loading header:', error));
});

function setActiveSection() {
    const activeSection = document.body.dataset.section;
    const links = document.querySelectorAll('.nav-links a[data-section]');

    links.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === activeSection) {
            link.classList.add('active');
        }
    });
}


function loadAnimation(callback) {
    const script = document.createElement('script');
    script.src = '/resources/js/animation.js';
    script.defer = true;

    script.onload = () => {
        console.log('Animation loaded successfully');
        if (callback) callback();
    };

    script.onerror = () => {
        console.error('Error loading animation');
    };

    document.body.appendChild(script);
}


function setUpAnimation() {
    const activeSection = document.body.dataset.section || 'default';
    const animationElement = document.getElementById('animation');

    if (animationElement) {
        const activeTitle = activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
        animationInit(activeTitle, activeSection);
        animationLoop();
    }
}