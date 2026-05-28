
// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Mobile Menu Toggle
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Intersection Observer for Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Stop observing once animated
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });

    // Navbar blur effect on scroll
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 50) {
            nav.classList.add('shadow-sm');
            nav.classList.add('bg-white/90');
            nav.classList.remove('glass');
        } else {
            nav.classList.remove('shadow-sm');
            nav.classList.remove('bg-white/90');
            nav.classList.add('glass');
        }
    });

    // Highlight corresponding timeline cards when hovering over skill items
    document.querySelectorAll('.skill-item').forEach(item => {
        const targetsAttr = item.getAttribute('data-targets');
        if (!targetsAttr) return;

        const targets = targetsAttr.split(',').map(t => t.trim());

        item.addEventListener('mouseenter', () => {
            targets.forEach(targetId => {
                const card = document.getElementById(targetId);
                if (card) {
                    card.classList.add('active-highlight');
                    const parentItem = card.closest('.parcours-item');
                    if (parentItem) {
                        parentItem.classList.add('active-highlight');
                    }
                }
            });
        });

        item.addEventListener('mouseleave', () => {
            targets.forEach(targetId => {
                const card = document.getElementById(targetId);
                if (card) {
                    card.classList.remove('active-highlight');
                    const parentItem = card.closest('.parcours-item');
                    if (parentItem) {
                        parentItem.classList.remove('active-highlight');
                    }
                }
            });
        });
    });

    // === macOS WINDOW SIMULATOR LOGIC ===
    const focusOverlay = document.getElementById('focus-overlay');

    // Close window
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const windowEl = document.getElementById(targetId);
            if (windowEl) {
                windowEl.classList.add('window-closed');
                windowEl.classList.remove('window-focused');
                if (focusOverlay) focusOverlay.classList.remove('active');
                document.body.style.overflow = '';
                
                // Update Dock status
                const dockItem = document.querySelector(`.dock-item[data-target="${targetId}"]`);
                if (dockItem) dockItem.classList.remove('active');
            }
        });
    });

    // Minimize window
    document.querySelectorAll('.minimize-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const windowEl = document.getElementById(targetId);
            if (windowEl) {
                windowEl.classList.toggle('window-minimized');
                
                // Bouncing effect on Dock item
                const dockItem = document.querySelector(`.dock-item[data-target="${targetId}"]`);
                if (dockItem) {
                    dockItem.classList.add('dock-bounce');
                    setTimeout(() => dockItem.classList.remove('dock-bounce'), 500);
                }
            }
        });
    });

    // Zoom/Focus window
    document.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const windowEl = document.getElementById(targetId);
            if (windowEl) {
                const isFocused = windowEl.classList.contains('window-focused');
                
                // Remove focus from all windows first
                document.querySelectorAll('.mac-window').forEach(w => w.classList.remove('window-focused'));
                
                if (!isFocused) {
                    windowEl.classList.remove('window-minimized');
                    windowEl.classList.remove('window-closed');
                    windowEl.classList.add('window-focused');
                    if (focusOverlay) focusOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    if (focusOverlay) focusOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });

    // Restore buttons inside placeholders
    document.querySelectorAll('.btn-restore').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            restoreWindow(targetId);
        });
    });

    // Dock items interaction
    document.querySelectorAll('.dock-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            
            // Trigger bounce animation
            item.classList.add('dock-bounce');
            setTimeout(() => item.classList.remove('dock-bounce'), 500);

            restoreWindow(targetId);
        });
    });

    // Helper to restore and focus scroll
    function restoreWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (windowEl) {
            windowEl.classList.remove('window-closed');
            windowEl.classList.remove('window-minimized');
            
            // Update Dock status
            const dockItem = document.querySelector(`.dock-item[data-target="${targetId}"]`);
            if (dockItem) dockItem.classList.add('active');

            // Scroll to it
            windowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Close focus overlay on click
    if (focusOverlay) {
        focusOverlay.addEventListener('click', () => {
            document.querySelectorAll('.mac-window').forEach(w => w.classList.remove('window-focused'));
            focusOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});
