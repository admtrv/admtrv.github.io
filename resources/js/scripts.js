/*
 * scripts.js
 */

document.addEventListener('DOMContentLoaded', () => {
    fetch('/components/header.html')
        .then(response => response.text())
        .then(headerHtml => {
            document.getElementById('header-container').innerHTML = headerHtml;

            setActiveSection();

            scheduleLayoutNavDots();
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(scheduleLayoutNavDots);
            }

            const nav = document.querySelector('.nav-links');
            if (window.ResizeObserver && nav) {
                window._navRO && window._navRO.disconnect();
                window._navRO = new ResizeObserver(() => scheduleLayoutNavDots());
                window._navRO.observe(nav);
            }

            let t;
            window.addEventListener('resize', () => {
                clearTimeout(t);
                t = setTimeout(scheduleLayoutNavDots, 80);
            });

            loadAnimation(() => setUpAnimation());

            loadNoCookiesBanner();
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

function loadNoCookiesBanner() {
    const KEY = 'cookies-banner-ack';
    try { if (sessionStorage.getItem(KEY)) return; } catch (e) { }

    fetch('/components/cookies.html')
        .then(r => r.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);

            const banner = document.getElementById('cookies-banner');
            const ok = document.getElementById('cookies-banner-ok');
            if (!banner || !ok) return;

            const onKey = e => { if (e.key === 'Escape') hide(); };

            const hide = () => {
                banner.classList.remove('show');
                try { sessionStorage.setItem(KEY, '1'); } catch (e) { }
                setTimeout(() => banner.remove(), 200);
                document.removeEventListener('keydown', onKey);
            };

            setTimeout(() => {
                banner.classList.add('show');
                document.addEventListener('keydown', onKey);
            }, 300);

            ok.addEventListener('click', e => { e.preventDefault(); hide(); });
        })
        .catch(err => console.error('Error loading banner:', err));
}

let _navDotsRaf = 0;

function scheduleLayoutNavDots() {
    if (_navDotsRaf) return;
    _navDotsRaf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            layoutNavDots();
            _navDotsRaf = 0;
        });
    });
}

function layoutNavDots() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    const links = [...nav.querySelectorAll(':scope > a')];
    links.forEach(a => a.classList.remove('show-dot'));
    if (links.length < 2) return;

    for (let i = 0; i < links.length - 1; i++) {
        const t1 = Math.round(links[i].getBoundingClientRect().top);
        const t2 = Math.round(links[i + 1].getBoundingClientRect().top);
        if (t1 === t2) links[i].classList.add('show-dot');
    }
}
