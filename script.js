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

    const APPS = [
        { id: 'about', label: 'À Propos', icon: 'user' },
        { id: 'experience', label: 'Mon Parcours', icon: 'briefcase' },
        { id: 'skills', label: 'Compétences', icon: 'cpu' },
        { id: 'contact', label: 'Contact', icon: 'mail' }
    ];

    function updateFocusOverlay() {
        if (!focusOverlay) return;
        const maximizedWin = document.querySelector('.mac-window.window-maximized:not(.window-closed):not(.window-minimized)');
        if (maximizedWin) {
            focusOverlay.classList.add('active');
            const winZIndex = parseInt(maximizedWin.style.zIndex) || 10;
            focusOverlay.style.zIndex = winZIndex - 1;
        } else {
            focusOverlay.classList.remove('active');
        }
    }

    function updateDock() {
        const dockContainer = document.querySelector('.mac-dock-container');
        if (!dockContainer) return;

        dockContainer.innerHTML = '';

        APPS.forEach(app => {
            let windowEl = document.getElementById(app.id);
            if (!windowEl) return;

            let label = app.label;
            let targetId = app.id;
            let isRunning = !windowEl.classList.contains('window-closed');
            let isFocused = windowEl.classList.contains('window-focused');
            let isMinimized = windowEl.classList.contains('window-minimized');

            // Héritage de Mon Parcours pour ses sous-pages d'expérience
            if (app.id === 'experience') {
                const clbWin = document.getElementById('leon-berard');
                const cemWin = document.getElementById('eugene-marquis');
                
                const clbOpen = clbWin && !clbWin.classList.contains('window-closed');
                const cemOpen = cemWin && !cemWin.classList.contains('window-closed');

                if (clbOpen) {
                    isRunning = true;
                    targetId = 'leon-berard';
                    label = 'Mon Parcours › Léon Bérard';
                    windowEl = clbWin;
                    isFocused = clbWin.classList.contains('window-focused');
                    isMinimized = clbWin.classList.contains('window-minimized');
                } else if (cemOpen) {
                    isRunning = true;
                    targetId = 'eugene-marquis';
                    label = 'Mon Parcours › Eugène Marquis';
                    windowEl = cemWin;
                    isFocused = cemWin.classList.contains('window-focused');
                    isMinimized = cemWin.classList.contains('window-minimized');
                }
            }

            // Afficher dans le Dock si l'application ou sa sous-page est lancée
            if (isRunning) {
                const dockItem = document.createElement('div');
                dockItem.className = 'dock-item';
                dockItem.setAttribute('data-target', targetId);

                if (isFocused) {
                    dockItem.classList.add('active');
                }

                if (isMinimized) {
                    dockItem.classList.add('minimized');
                }

                dockItem.innerHTML = `
                    <i data-lucide="${app.icon}"></i>
                    <span class="dock-tooltip">${label}</span>
                `;

                dockItem.addEventListener('click', () => {
                    dockItem.classList.add('dock-bounce');
                    setTimeout(() => dockItem.classList.remove('dock-bounce'), 500);

                    if (windowEl.classList.contains('window-minimized')) {
                        openWindow(targetId);
                    } else if (windowEl.classList.contains('window-focused')) {
                        minimizeWindow(targetId);
                    } else {
                        focusWindow(windowEl);
                    }
                });

                dockContainer.appendChild(dockItem);
            }
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function focusWindow(windowEl) {
        // Supprimer le mode plein écran des autres applications si on se focalise sur une nouvelle
        windows.forEach(w => {
            if (w !== windowEl && w.classList.contains('window-maximized')) {
                w.classList.remove('window-maximized');
            }
        });

        windows.forEach(w => w.classList.remove('window-focused'));
        highestZIndex++;
        windowEl.style.zIndex = highestZIndex;
        windowEl.classList.add('window-focused');
        
        updateFocusOverlay();
        updateDock();
    }

    function openWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.remove('window-closed');
        windowEl.classList.remove('window-minimized');
        focusWindow(windowEl);
    }

    function closeWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.add('window-closed');
        windowEl.classList.remove('window-focused');

        updateFocusOverlay();
        updateDock();
    }

    function minimizeWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.add('window-minimized');
        windowEl.classList.remove('window-focused');

        updateFocusOverlay();
        updateDock();
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
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            // Deselect others
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            // Select this one
            icon.classList.add('selected');

            const targetId = icon.getAttribute('data-target');
            openWindow(targetId);
        });
    });

    // Click on desktop to deselect icons
    const desktopEl = document.getElementById('desktop');
    if (desktopEl) {
        desktopEl.addEventListener('click', (e) => {
            if (e.target === desktopEl || e.target.classList.contains('desktop-wallpaper-widget') || e.target.closest('.desktop-wallpaper-widget')) {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            }
        });
    }

    // Initialize Dock once at startup
    updateDock();

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

    // === EXPERIENCE CARDS & LINKS CLICK HANDLERS ===
    document.querySelectorAll('a[href="leon-berard.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeWindow('experience');
            openWindow('leon-berard');
        });
    });

    document.querySelectorAll('a[href="eugene-marquis.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeWindow('experience');
            openWindow('eugene-marquis');
        });
    });

    // === BACK BUTTONS FOR SUB-PAGES ===
    document.querySelectorAll('.mac-back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const parentWindow = btn.closest('.mac-window');
            if (parentWindow) {
                closeWindow(parentWindow.id);
            }
            const backToId = btn.getAttribute('data-back-to');
            if (backToId) {
                openWindow(backToId);
            }
        });
    });

    // === STARTUP ENVIRONMENT INITIAL STATE ===
    // Open "À Propos" window by default as a welcoming landing page
    setTimeout(() => {
        openWindow('about');
    }, 100);

});
