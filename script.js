// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {

    // === macOS DIGITAL CLOCK ===
    function updateClock() {
        const clockEl = document.getElementById('menu-clock');
        if (!clockEl) return;
        
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        const now = new Date();
        let dateStr = now.toLocaleDateString('fr-FR', options);
        // Capitalize first letter of day/month for aesthetic
        dateStr = dateStr.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        clockEl.textContent = dateStr;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // === INTERSECTION OBSERVER FOR INTERNAL WINDOW SCROLLING ===
    document.querySelectorAll('.mac-content').forEach(contentEl => {
        const localObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    localObserver.unobserve(entry.target);
                }
            });
        }, {
            root: contentEl,
            threshold: 0.05,
            rootMargin: "0px 0px 50px 0px"
        });

        contentEl.querySelectorAll('.reveal').forEach(revealEl => {
            localObserver.observe(revealEl);
        });
    });

    // === SKILL SURVOL ACCENT COLOR & TIMELINE HIGHLIGHT ===
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

    // === WINDOW MANAGER LOGIC ===
    let highestZIndex = 10;
    const focusOverlay = document.getElementById('focus-overlay');
    const windows = document.querySelectorAll('.mac-window');

    function focusWindow(windowEl) {
        // Remove focus state from other windows
        windows.forEach(w => w.classList.remove('window-focused'));
        
        // Bring to front
        highestZIndex++;
        windowEl.style.zIndex = highestZIndex;
        windowEl.classList.add('window-focused');
        
        // Bring focus overlay behind this window if it is focused in overlay mode (Legacy compatibility)
        if (focusOverlay && windowEl.classList.contains('window-maximized')) {
            focusOverlay.style.zIndex = highestZIndex - 1;
        }
    }

    function openWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.remove('window-closed');
        windowEl.classList.remove('window-minimized');
        focusWindow(windowEl);

        // Update Dock Indicator
        const dockItem = document.querySelector(`.dock-item[data-target="${targetId}"]`);
        if (dockItem) {
            dockItem.classList.add('active');
        }
    }

    function closeWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.add('window-closed');
        windowEl.classList.remove('window-focused');

        // Update Dock Indicator
        const dockItem = document.querySelector(`.dock-item[data-target="${targetId}"]`);
        if (dockItem) {
            dockItem.classList.remove('active');
        }
    }

    function minimizeWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.add('window-minimized');
        windowEl.classList.remove('window-focused');
    }

    function toggleZoomWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.toggle('window-maximized');
        focusWindow(windowEl);
    }

    // Assign window control click handlers
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            closeWindow(targetId);
        });
    });

    document.querySelectorAll('.minimize-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            minimizeWindow(targetId);
        });
    });

    document.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            toggleZoomWindow(targetId);
        });
    });

    // Make windows clickable to focus/bring to front
    windows.forEach(win => {
        win.addEventListener('mousedown', () => {
            focusWindow(win);
        });
        win.addEventListener('touchstart', () => {
            focusWindow(win);
        });
    });

    // === DESKTOP ICONS CLICK HANDLER ===
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            openWindow(targetId);
        });
    });

    // === DOCK ITEMS CLICK HANDLER ===
    document.querySelectorAll('.dock-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            const windowEl = document.getElementById(targetId);
            
            // Trigger dock bounce animation
            item.classList.add('dock-bounce');
            setTimeout(() => item.classList.remove('dock-bounce'), 500);

            if (windowEl) {
                if (windowEl.classList.contains('window-closed') || windowEl.classList.contains('window-minimized')) {
                    openWindow(targetId);
                } else if (windowEl.classList.contains('window-focused')) {
                    minimizeWindow(targetId);
                } else {
                    focusWindow(windowEl);
                }
            }
        });
    });

    // === DRAG AND DROP FUNCTIONALITY (Vanilla JS, mouse + touch) ===
    document.querySelectorAll('.mac-window').forEach(windowEl => {
        const titlebar = windowEl.querySelector('.mac-titlebar');
        if (!titlebar) return;

        let active = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Touch support
        titlebar.addEventListener('touchstart', dragStart, false);
        document.addEventListener('touchend', dragEnd, false);
        document.addEventListener('touchmove', drag, false);

        // Mouse support
        titlebar.addEventListener('mousedown', dragStart, false);
        document.addEventListener('mouseup', dragEnd, false);
        document.addEventListener('mousemove', drag, false);

        function dragStart(e) {
            // Disable drag if maximized or screen is small (mobile optimization)
            if (windowEl.classList.contains('window-maximized') || window.innerWidth < 768) {
                return;
            }

            focusWindow(windowEl);

            let event = e;
            if (e.type === 'touchstart') {
                event = e.touches[0];
            }

            // Retrieve existing inline translate transform if any
            const style = window.getComputedStyle(windowEl);
            const matrix = new DOMMatrix(style.transform);
            
            initialX = event.clientX - matrix.e;
            initialY = event.clientY - matrix.f;

            if (e.target === titlebar || titlebar.contains(e.target)) {
                // Verify we didn't click inside controls
                if (e.target.classList.contains('mac-btn')) {
                    return;
                }
                active = true;
                windowEl.classList.add('dragging');
            }
        }

        function dragEnd() {
            active = false;
            windowEl.classList.remove('dragging');
        }

        function drag(e) {
            if (!active) return;

            e.preventDefault();

            let event = e;
            if (e.type === 'touchmove') {
                event = e.touches[0];
            }

            currentX = event.clientX - initialX;
            currentY = event.clientY - initialY;

            // Restrict window drag boundaries so it never goes off-screen
            const desktopEl = document.getElementById('desktop');
            const menubarHeight = 30;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const windowRect = windowEl.getBoundingClientRect();

            // Prevent drag above the menubar (30px)
            if (currentY + windowEl.offsetTop < menubarHeight) {
                currentY = menubarHeight - windowEl.offsetTop;
            }

            // Prevent dragging titlebar too far left or right (keep at least 80px on screen)
            const minVisible = 80;
            const leftLimit = minVisible - windowEl.offsetLeft - windowRect.width;
            const rightLimit = screenWidth - minVisible - windowEl.offsetLeft;
            
            if (currentX < leftLimit) {
                currentX = leftLimit;
            }
            if (currentX > rightLimit) {
                currentX = rightLimit;
            }

            // Prevent drag below screen bottom (keep titlebar visible)
            const bottomLimit = screenHeight - menubarHeight - windowEl.offsetTop;
            if (currentY > bottomLimit) {
                currentY = bottomLimit;
            }

            xOffset = currentX;
            yOffset = currentY;

            windowEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    });

    // === STARTUP ENVIRONMENT INITIAL STATE ===
    // Open "À Propos" window by default as a welcoming landing page
    setTimeout(() => {
        openWindow('about');
    }, 300);

});
