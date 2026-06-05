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

            // Héritage dynamique : sous-pages d'expérience héritent de leur parent
            if (app.id === 'experience' || app.id === 'skills') {
                const subPageIds = ['master-rennes', 'leon-berard', 'eugene-marquis', 'iut-vannes'];
                const subPageLabels = {
                    'master-rennes': 'Master Bio-info',
                    'leon-berard': 'Léon Bérard',
                    'eugene-marquis': 'Eugène Marquis',
                    'iut-vannes': 'IUT de Vannes'
                };
                const parentLabel = app.id === 'experience' ? 'Mon Parcours' : 'Compétences';

                for (const subId of subPageIds) {
                    const subWin = document.getElementById(subId);
                    if (subWin && !subWin.classList.contains('window-closed')) {
                        const subParent = subWin.getAttribute('data-parent');
                        if (subParent === app.id) {
                            isRunning = true;
                            targetId = subId;
                            label = `${parentLabel} › ${subPageLabels[subId]}`;
                            windowEl = subWin;
                            isFocused = subWin.classList.contains('window-focused');
                            isMinimized = subWin.classList.contains('window-minimized');
                            break;
                        }
                    }
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

                // Close button overlay (small × visible on hover)
                const closeBtn = document.createElement('span');
                closeBtn.className = 'dock-close-btn';
                closeBtn.innerHTML = '×';
                closeBtn.title = 'Fermer';

                const closeTargetId = targetId;
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeWindow(closeTargetId);
                    // Also close any sub-pages parented to this app
                    if (closeTargetId === 'experience' || closeTargetId === 'skills') {
                        ['leon-berard', 'eugene-marquis', 'iut-vannes', 'master-rennes'].forEach(subId => {
                            const subWin = document.getElementById(subId);
                            if (subWin && subWin.getAttribute('data-parent') === closeTargetId) {
                                closeWindow(subId);
                                subWin.removeAttribute('data-parent');
                            }
                        });
                    }
                });

                dockItem.innerHTML = `
                    <i data-lucide="${app.icon}"></i>
                    <span class="dock-tooltip">${label}</span>
                `;
                dockItem.appendChild(closeBtn);

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

                // Right-click to close
                dockItem.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    closeWindow(closeTargetId);
                    if (closeTargetId === 'experience' || closeTargetId === 'skills') {
                        ['leon-berard', 'eugene-marquis', 'iut-vannes', 'master-rennes'].forEach(subId => {
                            const subWin = document.getElementById(subId);
                            if (subWin && subWin.getAttribute('data-parent') === closeTargetId) {
                                closeWindow(subId);
                                subWin.removeAttribute('data-parent');
                            }
                        });
                    }
                });

                dockContainer.appendChild(dockItem);
            }
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Clamp a window so it never goes outside the visible viewport
    function clampWindowPosition(windowEl) {
        if (!windowEl || windowEl.classList.contains('window-maximized') || windowEl.classList.contains('window-closed')) return;
        if (window.innerWidth < 768) return; // Skip on mobile (windows are full-width)

        const menubarHeight = 30;
        const dockHeight = 80; // Reserve space for dock at bottom
        const padding = 10; // Minimum gap from screen edges

        const rect = windowEl.getBoundingClientRect();
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const availH = screenH - menubarHeight - dockHeight;

        let adjustX = 0;
        let adjustY = 0;

        // --- Horizontal clamping ---
        if (rect.width >= screenW - padding * 2) {
            // Window wider than screen: center it horizontally
            const targetLeft = Math.max(padding, (screenW - rect.width) / 2);
            adjustX = targetLeft - rect.left;
        } else {
            // Normal case: keep fully within left and right bounds
            if (rect.left < padding) {
                adjustX = padding - rect.left;
            } else if (rect.right > screenW - padding) {
                adjustX = (screenW - padding) - rect.right;
            }
        }

        // --- Vertical clamping ---
        if (rect.height >= availH) {
            // Window taller than available space: pin to top of available area
            adjustY = menubarHeight - rect.top;
        } else {
            // Keep titlebar below menubar
            if (rect.top < menubarHeight) {
                adjustY = menubarHeight - rect.top;
            }
            // Keep bottom above dock area
            if (rect.bottom > screenH - dockHeight) {
                adjustY = (screenH - dockHeight) - rect.bottom;
                // But never push titlebar above menubar
                if (rect.top + adjustY < menubarHeight) {
                    adjustY = menubarHeight - rect.top;
                }
            }
        }

        if (adjustX !== 0 || adjustY !== 0) {
            const style = window.getComputedStyle(windowEl);
            const matrix = new DOMMatrix(style.transform);
            const newX = matrix.e + adjustX;
            const newY = matrix.f + adjustY;
            windowEl.style.transform = `translate(${newX}px, ${newY}px)`;
        }
    }

    // Save the full geometry of a window before maximizing
    function saveWindowGeometry(windowEl) {
        const cs = window.getComputedStyle(windowEl);
        windowEl._savedGeometry = {
            top: windowEl.style.top || cs.top,
            left: windowEl.style.left || cs.left,
            width: windowEl.style.width || cs.width,
            height: windowEl.style.height || cs.height,
            transform: windowEl.style.transform || ''
        };
    }

    // Restore the saved geometry exactly
    function restoreWindowGeometry(windowEl) {
        const geo = windowEl._savedGeometry;
        if (!geo) return;
        windowEl.style.top = geo.top;
        windowEl.style.left = geo.left;
        windowEl.style.width = geo.width;
        windowEl.style.height = geo.height;
        windowEl.style.transform = geo.transform;
        delete windowEl._savedGeometry;
    }

    function focusWindow(windowEl, skipClamp) {
        // Supprimer le mode plein écran des autres applications si on se focalise sur une nouvelle
        windows.forEach(w => {
            if (w !== windowEl && w.classList.contains('window-maximized')) {
                restoreWindowGeometry(w);
                w.classList.remove('window-maximized');
            }
        });

        windows.forEach(w => w.classList.remove('window-focused'));
        highestZIndex++;
        windowEl.style.zIndex = highestZIndex;
        windowEl.classList.add('window-focused');

        // Only clamp if not restoring from a saved position
        if (!skipClamp) {
            clampWindowPosition(windowEl);
        }
        
        updateFocusOverlay();
        updateDock();
    }

    function openWindow(targetId) {
        const windowEl = document.getElementById(targetId);
        if (!windowEl) return;

        windowEl.classList.remove('window-closed');
        windowEl.classList.remove('window-minimized');
        focusWindow(windowEl);
        // Double-check clamping after layout reflow
        requestAnimationFrame(() => clampWindowPosition(windowEl));
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

        const isCurrentlyMaximized = windowEl.classList.contains('window-maximized');

        if (!isCurrentlyMaximized) {
            // Save the exact position before maximizing
            saveWindowGeometry(windowEl);
            windowEl.classList.add('window-maximized');
            focusWindow(windowEl);
        } else {
            // Set target inline styles first (hidden by !important while class is on),
            // then remove the class — browser sees one atomic change and animates smoothly
            restoreWindowGeometry(windowEl);
            windowEl.classList.remove('window-maximized');
            focusWindow(windowEl, true); // skipClamp: trust the saved position
        }
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
            if (e.target === desktopEl) {
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
    // Sub-page IDs that can be children of experience OR skills
    const SUB_PAGE_IDS = ['leon-berard', 'eugene-marquis', 'iut-vannes', 'master-rennes'];

    // Generic: inherit position (transform, size, maximized) from any source window to child
    function inheritPositionFrom(sourceId, childId) {
        const sourceWin = document.getElementById(sourceId);
        const childWin = document.getElementById(childId);
        if (!sourceWin || !childWin) return;

        // Copy transform (drag offset)
        const style = window.getComputedStyle(sourceWin);
        const matrix = new DOMMatrix(style.transform);
        if (matrix.e !== 0 || matrix.f !== 0) {
            childWin.style.transform = `translate(${matrix.e}px, ${matrix.f}px)`;
        } else {
            childWin.style.transform = '';
        }
        
        // Inherit width and height
        const rect = sourceWin.getBoundingClientRect();
        childWin.style.width = rect.width + 'px';
        childWin.style.height = rect.height + 'px';

        // Inherit maximized state
        if (sourceWin.classList.contains('window-maximized')) {
            childWin.classList.add('window-maximized');
        } else {
            childWin.classList.remove('window-maximized');
        }

        // Track which parent opened this sub-page
        childWin.setAttribute('data-parent', sourceId);
    }

    // Open a sub-page from a parent window
    function openSubPage(parentId, childId) {
        inheritPositionFrom(parentId, childId);
        closeWindow(parentId);
        openWindow(childId);
    }

    // === Parcours card clicks (opened from experience) ===
    document.querySelectorAll('#card-clb, .badge-clb').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openSubPage('experience', 'leon-berard');
        });
    });

    document.querySelectorAll('#card-cem, .badge-cem').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openSubPage('experience', 'eugene-marquis');
        });
    });

    document.querySelectorAll('#card-iut, .badge-iut').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openSubPage('experience', 'iut-vannes');
        });
    });

    document.querySelectorAll('#card-master-rennes').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openSubPage('experience', 'master-rennes');
        });
    });

    // === BACK BUTTONS FOR SUB-PAGES ===
    document.querySelectorAll('.mac-back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const parentWindow = btn.closest('.mac-window');
            if (!parentWindow) return;

            // Use dynamic parent (set by openSubPage), fallback to data-back-to
            const backToId = parentWindow.getAttribute('data-parent') || btn.getAttribute('data-back-to');
            if (!backToId) return;

            const backToWindow = document.getElementById(backToId);
            if (backToWindow) {
                // Inherit maximized state back
                if (parentWindow.classList.contains('window-maximized')) {
                    backToWindow.classList.add('window-maximized');
                } else {
                    backToWindow.classList.remove('window-maximized');
                }

                // Inherit position/transform back
                const style = window.getComputedStyle(parentWindow);
                const matrix = new DOMMatrix(style.transform);
                if (matrix.e !== 0 || matrix.f !== 0) {
                    backToWindow.style.transform = `translate(${matrix.e}px, ${matrix.f}px)`;
                } else {
                    backToWindow.style.transform = '';
                }

                // Inherit width and height back
                const parentRect = parentWindow.getBoundingClientRect();
                backToWindow.style.width = parentRect.width + 'px';
                backToWindow.style.height = parentRect.height + 'px';
            }

            closeWindow(parentWindow.id);
            openWindow(backToId);
            // Clean up the dynamic parent
            parentWindow.removeAttribute('data-parent');
        });
    });

    // === TOOLTIP BADGE NAVIGATION (Skills → Experience sub-pages) ===
    document.querySelectorAll('.tooltip-badge[data-open-window]').forEach(badge => {
        badge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetWindowId = badge.getAttribute('data-open-window');
            if (!targetWindowId) return;

            // Open as a sub-page of skills (inherits position from skills)
            openSubPage('skills', targetWindowId);
        });
    });

    // === CONTACT FORM HANDLER & macOS NOTIFICATION ===
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const submitBtn = contactForm.querySelector('button[type="submit"]') || contactForm.querySelector('button');

        // Remove error class when typing
        [nameInput, emailInput, messageInput].forEach(input => {
            if (!input) return;
            input.addEventListener('input', () => {
                input.classList.remove('error');
            });
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let hasError = false;

            // Simple validation
            if (nameInput && !nameInput.value.trim()) {
                nameInput.classList.add('error');
                hasError = true;
            }
            if (emailInput && (!emailInput.value.trim() || !emailInput.value.includes('@'))) {
                emailInput.classList.add('error');
                hasError = true;
            }
            if (messageInput && !messageInput.value.trim()) {
                messageInput.classList.add('error');
                hasError = true;
            }

            if (hasError) {
                // Shake form to indicate validation error
                contactForm.classList.add('shake-anim');
                setTimeout(() => {
                    contactForm.classList.remove('shake-anim');
                }, 400);
                return;
            }

            // Save original button content
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

            // Loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `Envoi en cours... <span class="spinner-loader"></span>`;
            }

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const msg = messageInput ? messageInput.value.trim() : '';
            const emailAddress = 'arthur.ledevehat@gmail.com';

            // Send via FormSubmit AJAX API
            fetch(`https://formsubmit.co/ajax/${emailAddress}`, {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    "Nom": name,
                    "E-mail": email,
                    "Message": msg,
                    "_subject": `[Portfolio] Nouveau message de ${name}`,
                    "_replyto": email
                })
            })
            .then(response => {
                if (!response.ok) throw new Error("HTTP error " + response.status);
                return response.json();
            })
            .then(data => {
                // Success macOS Notification
                showMacNotification(
                    "Mail",
                    "Message envoyé !",
                    `Merci ${name}, votre message a bien été transmis avec succès.`
                );

                // Reset form
                contactForm.reset();
            })
            .catch(error => {
                console.error("FormSubmit Error:", error);
                
                // Fallback to mailto if API fails
                const subject = encodeURIComponent(`[Portfolio] Message de ${name}`);
                const body = encodeURIComponent(`Bonjour Arthur,\n\nVous avez reçu un message depuis votre portfolio :\n\n---\nNom : ${name}\nEmail : ${email}\n\nMessage :\n${msg}\n---`);
                const mailtoLink = `mailto:${emailAddress}?subject=${subject}&body=${body}`;

                navigator.clipboard.writeText(emailAddress).catch(() => {});
                window.location.href = mailtoLink;

                showMacNotification(
                    "Mail",
                    "Envoi alternatif...",
                    `L'envoi direct a échoué. Votre messagerie par défaut s'ouvre pour envoyer le message.`
                );
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            });
        });
    }

    // Intercept click on the mail icon at the bottom of the contact page
    const emailLinkTrigger = document.querySelector('.email-link-trigger');
    if (emailLinkTrigger) {
        emailLinkTrigger.addEventListener('click', (e) => {
            const emailAddress = 'arthur.ledevehat@gmail.com';
            
            // Copy to clipboard to make sure the user has the address even if mailto fails
            navigator.clipboard.writeText(emailAddress).then(() => {
                showMacNotification(
                    "Mail",
                    "E-mail copié !",
                    "L'adresse arthur.ledevehat@gmail.com a été copiée dans le presse-papiers."
                );
            }).catch(() => {});
        });
    }

    // Function to show a premium macOS-style notification
    function showMacNotification(app, title, message) {
        // Remove existing notification if present
        const oldNotif = document.getElementById('mac-notification-center');
        if (oldNotif) {
            oldNotif.remove();
        }

        // Create elements
        const notif = document.createElement('div');
        notif.id = 'mac-notification-center';
        notif.className = 'mac-notification';
        
        // Using local inline SVG for the mail icon so it is 100% reliable
        notif.innerHTML = `
            <div class="mac-notification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <div class="mac-notification-content">
                <div class="mac-notification-header">
                    <span class="mac-notification-app">${app}</span>
                    <span class="mac-notification-time">maintenant</span>
                </div>
                <div class="mac-notification-title">${title}</div>
                <div class="mac-notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(notif);

        // Trigger slide-in
        setTimeout(() => {
            notif.classList.add('show');
        }, 100);

        // Slide-out and remove after 5 seconds
        setTimeout(() => {
            notif.classList.remove('show');
            notif.classList.add('hide');
            setTimeout(() => {
                notif.remove();
            }, 400);
        }, 5000);
    }

    // === STARTUP ENVIRONMENT INITIAL STATE ===
    // Open "À Propos" window by default as a welcoming landing page
    setTimeout(() => {
        openWindow('about');
    }, 100);

});
