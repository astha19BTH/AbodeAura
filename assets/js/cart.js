/**
 * Abode Aura - Shopping Cart & WhatsApp Order Integration
 * Pure JavaScript, no external dependencies required.
 * 100% Pure ASCII for cross-platform, cross-charset immunity on Windows/Apache.
 */

(function () {
    'use strict';

    // ==========================================================================
    // Configuration
    // ==========================================================================
    const WHATSAPP_PHONE = '919509134377';
    // const WHATSAPP_PHONE = '919887910830';
    const DEFAULT_SITE_URL = 'https://astha19bth.github.io/AbodeAura/';
    const STORAGE_KEY = 'abode_aura_cart';
    const CUSTOMER_KEY = 'abode_aura_customer';
    const STORE_NAME = 'Abode Aura';

    // Unicode escapes for cross-platform, cross-charset compatibility
    const EMOJI = {
        cart: '\uD83D\uDED2',        // Shopping Cart
        calendar: '\uD83D\uDCC5',    // Calendar
        person: '\uD83D\uDC64',      // Customer Profile
        phone: '\uD83D\uDCDE',       // Telephone
        pin: '\uD83D\uDCCD',         // Map Pin
        memo: '\uD83D\uDCDD',        // Note
        package: '\uD83D\uDCE6',     // Box / Package
        receipt: '\uD83E\uDDFE',     // Receipt
        money: '\uD83D\uDCB0',       // Money Bag
        pray: '\uD83D\uDE4F',        // Folded Hands / Thank you
        link: '\uD83D\uDD17',        // Link
        globe: '\uD83C\uDF10',       // Globe / Website
        bullet: '\u2022',            // Bullet Dot
        rupee: '\u20B9',             // Indian Rupee Sign
        hrThick: '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
        hrThin: '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500'
    };

    // Master gallery dictionary for all 20 cushions
    const GALLERY_TITLE_MAP = {
        'gallery-1': 'Golden Half Sunflower Double Cushion',
        'gallery-2': 'White Flower',
        'gallery-3': 'Colorful Flower Sofa Cushion',
        'gallery-4': "Nature's Embrace Half Sunflower",
        'gallery-5': 'Multicolored golden work Cushion',
        'gallery-6': 'Purple Lotus pichwai art Living Room Set',
        'gallery-7': 'pichwai art Living Room Set',
        'gallery-8': 'Pure cotton shibori print',
        'gallery-9': 'Pichwai pink lotus and leaf',
        'gallery-10': 'Rajasthani mandana with laxmi charan',
        'gallery-11': 'Pichwai cow and pink lotus set',
        'gallery-12': 'Blue pottery set',
        'gallery-13': 'White flower garden set',
        'gallery-14': 'Rose stancil design',
        'gallery-15': 'Pichwai cow ,lotus and leaf set',
        'gallery-16': 'Single Pichwai cow set',
        'gallery-17': 'Boho Arts Elements',
        'gallery-18': 'Half mandala cushion set',
        'gallery-19': 'Multicolour Pichwai art Comfort Suite',
        'gallery-20': 'Patch work lotus with golden border'
    };

    // ==========================================================================
    // Helpers
    // ==========================================================================
    function getBaseSiteUrl() {
        try {
            if (window.location && window.location.origin && window.location.origin.startsWith('http')) {
                const origin = window.location.origin;
                if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
                    const path = window.location.pathname;
                    const dir = path.substring(0, path.lastIndexOf('/') + 1);
                    return origin + dir;
                }
            }
        } catch (e) {
            // fallback
        }
        return DEFAULT_SITE_URL;
    }

    function parsePrice(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/[^\d.]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }

    function formatPrice(num) {
        return EMOJI.rupee + Number(num || 0).toLocaleString('en-IN');
    }

    function createSlug(str) {
        return String(str || '')
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    }

    /**
     * Capitalize the first letter of each word (e.g. "rakesh" -> "Rakesh", "rakesh sharma" -> "Rakesh Sharma")
     */
    function capitalizeWords(str) {
        if (!str) return '';
        return String(str)
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Resolve reliable gallery ID, deep-link URL, and direct photo URL for an item.
     * Guarantees item-specific links even for stale localStorage items.
     */
    function resolveItemLinks(item) {
        const siteUrl = getBaseSiteUrl();
        let gid = '';

        if (item.galleryId && /^gallery-\d+$/i.test(item.galleryId)) {
            gid = item.galleryId;
        } else if (item.image) {
            const m = String(item.image).match(/gallery_(\d+)/i);
            if (m) gid = 'gallery-' + m[1];
        }

        if (!gid && item.title) {
            const titleLower = item.title.toLowerCase().trim();
            for (const [id, name] of Object.entries(GALLERY_TITLE_MAP)) {
                if (titleLower.includes(name.toLowerCase()) || name.toLowerCase().includes(titleLower)) {
                    gid = id;
                    break;
                }
            }
        }

        if (!gid) gid = 'gallery-1';

        const itemLink = siteUrl + 'gallery.html#' + gid;
        let imgPath = item.image || ('images/gallery/' + gid.replace('-', '_') + '.jpeg');
        imgPath = String(imgPath).replace(/^\/+/, '');
        const photoLink = siteUrl + imgPath;

        return {
            galleryId: gid,
            itemLink: itemLink,
            photoLink: photoLink
        };
    }

    // ==========================================================================
    // AbodeCart Object
    // ==========================================================================
    const AbodeCart = {
        cart: [],

        init() {
            this.loadCart();
            this.ensureDrawerDOM();
            this.ensureSuccessModalDOM();
            this.ensureFloatingBtnDOM();
            this.ensureToastDOM();
            this.bindEvents();
            this.updateBadges();
            this.renderDrawer();
            this.renderCartPage();

            // Cross-tab synchronization
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_KEY) {
                    this.loadCart();
                    this.updateBadges();
                    this.renderDrawer();
                    this.renderCartPage();
                }
            });
        },

        loadCart() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                this.cart = stored ? JSON.parse(stored) : [];
                if (!Array.isArray(this.cart)) this.cart = [];

                // Sanitize and upgrade existing items
                this.cart.forEach(item => {
                    const links = resolveItemLinks(item);
                    item.galleryId = links.galleryId;
                    item.link = links.itemLink;
                });
            } catch (err) {
                console.error('Error loading cart from localStorage:', err);
                this.cart = [];
            }
        },

        saveCart() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cart));
            } catch (err) {
                console.error('Error saving cart to localStorage:', err);
            }
            this.updateBadges();
            this.renderDrawer();
            this.renderCartPage();
        },

        getCart() {
            return this.cart;
        },

        getItemCount() {
            return this.cart.reduce((total, item) => total + (item.quantity || 1), 0);
        },

        getTotalPrice() {
            return this.cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
        },

        /**
         * Add an item to cart
         * @param {Object} item - { title, size, material, price, priceDisplay, image, quantity, galleryId }
         */
        addItem(item) {
            if (!item || !item.title) return;

            const size = (item.size || 'Standard').trim();
            const id = createSlug(item.title) + '-' + createSlug(size);
            const price = parsePrice(item.price);
            const quantity = parseInt(item.quantity) || 1;

            const links = resolveItemLinks(item);

            const existingIndex = this.cart.findIndex(i => i.id === id);

            if (existingIndex > -1) {
                this.cart[existingIndex].quantity += quantity;
                this.cart[existingIndex].galleryId = links.galleryId;
                this.cart[existingIndex].link = links.itemLink;
            } else {
                this.cart.push({
                    id: id,
                    title: item.title,
                    size: size,
                    material: (item.material || '').trim(),
                    price: price,
                    priceDisplay: item.priceDisplay || formatPrice(price),
                    image: item.image || ('images/gallery/' + links.galleryId.replace('-', '_') + '.jpeg'),
                    quantity: quantity,
                    galleryId: links.galleryId,
                    link: links.itemLink
                });
            }

            this.saveCart();
            this.bumpBadge();
            this.showToast('Added <strong>' + item.title + '</strong> (' + size + ') to cart! ' + EMOJI.cart);
        },

        updateQty(id, delta) {
            const index = this.cart.findIndex(i => i.id === id);
            if (index === -1) return;

            this.cart[index].quantity += delta;
            if (this.cart[index].quantity <= 0) {
                this.cart.splice(index, 1);
                this.showToast('Item removed from cart.');
            }
            this.saveCart();
        },

        removeItem(id) {
            const item = this.cart.find(i => i.id === id);
            this.cart = this.cart.filter(i => i.id !== id);
            this.saveCart();
            if (item) {
                this.showToast('Removed <strong>' + item.title + '</strong> from cart.');
            }
        },

        clearCart() {
            this.cart = [];
            this.saveCart();
        },

        // ==========================================================================
        // UI & Drawer Controls
        // ==========================================================================
        open() {
            const drawer = document.getElementById('cart-drawer');
            const backdrop = document.getElementById('cart-drawer-backdrop');
            if (drawer && backdrop) {
                drawer.classList.add('active');
                backdrop.classList.add('active');
                document.body.style.overflow = 'hidden';
                this.loadCustomerDetails();
            }
        },

        close() {
            const drawer = document.getElementById('cart-drawer');
            const backdrop = document.getElementById('cart-drawer-backdrop');
            if (drawer && backdrop) {
                drawer.classList.remove('active');
                backdrop.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        toggle() {
            const drawer = document.getElementById('cart-drawer');
            if (drawer && drawer.classList.contains('active')) {
                this.close();
            } else {
                this.open();
            }
        },

        updateBadges() {
            const count = this.getItemCount();
            document.querySelectorAll('.cart-count').forEach(el => {
                if (el.closest('.cart-drawer-title')) {
                    el.textContent = count;
                    el.style.display = 'inline';
                    return;
                }
                el.textContent = count;
                el.style.display = count > 0 ? 'inline-flex' : 'none';
            });

            const drawerCount = document.getElementById('cart-drawer-count');
            if (drawerCount) {
                drawerCount.textContent = count;
            }
        },

        bumpBadge() {
            document.querySelectorAll('.cart-count').forEach(el => {
                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 350);
            });
        },

        // ==========================================================================
        // Order Success Modal Controls
        // ==========================================================================
        ensureSuccessModalDOM() {
            if (document.getElementById('order-success-backdrop')) return;

            const modalHTML = `
                <div id="order-success-backdrop" class="order-success-backdrop" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
                    <div class="order-success-modal">
                        <button type="button" id="order-success-close" class="order-success-close" aria-label="Close dialog">&times;</button>
                        <div class="order-success-icon-wrap">
                            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3 id="order-success-title" class="order-success-title">Order Placed Successfully!</h3>
                        <p id="order-success-subtitle" class="order-success-subtitle">Thank you! Your order details have been prepared for WhatsApp.</p>

                        <div class="order-success-card">
                            <div class="order-success-card-row">
                                <span>Customer Name:</span>
                                <span id="order-success-name" class="val">-</span>
                            </div>
                            <div class="order-success-card-row">
                                <span>Total Cushions:</span>
                                <span id="order-success-qty" class="val">-</span>
                            </div>
                            <div class="order-success-card-row">
                                <span>Delivery Address:</span>
                                <span id="order-success-addr" class="val" style="max-width: 220px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">-</span>
                            </div>
                            <div class="order-success-card-row highlight">
                                <span>Grand Total:</span>
                                <span id="order-success-total" class="val-highlight">-</span>
                            </div>
                        </div>

                        <div class="order-success-note">
                            <strong>Next Step:</strong> Please tap <strong>Send</strong> in your opened WhatsApp chat to deliver this order directly to our studio. We will confirm stock and dispatch details with you right away!
                        </div>

                        <div class="order-success-actions">
                            <a id="order-success-reopen-btn" class="order-success-reopen-btn" href="#" target="_blank" rel="noopener noreferrer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.044-1.926-.465-1.574-.649-2.582-2.253-2.661-2.359-.079-.105-.633-.843-.633-1.608 0-.765.397-1.144.538-1.299.141-.156.309-.195.412-.195.103 0 .206.001.296.006.096.005.226-.037.353.267.13.312.443 1.08.482 1.16.039.08.065.174.013.278-.052.104-.078.169-.156.26-.079.091-.166.203-.238.273-.08.077-.163.161-.07.321.093.161.412.679.883 1.098.607.541 1.119.709 1.28.789.161.08.256.069.351-.041.095-.11.408-.475.518-.638.109-.163.22-.136.37-.08.151.056.953.449 1.117.531.164.082.273.123.313.191.039.069.039.4-.105.805z"/>
                                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.662 1.442 5.178L2 22l4.981-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.172c-1.678 0-3.238-.495-4.551-1.353l-.326-.213-2.955.775.789-2.88-.231-.368A8.146 8.146 0 0 1 3.828 12c0-4.506 3.666-8.172 8.172-8.172 4.506 0 8.172 3.666 8.172 8.172 0 4.506-3.666 8.172-8.172 8.172z"/>
                                </svg>
                                <span>Re-open WhatsApp Chat</span>
                            </a>
                            <button type="button" id="order-success-continue-btn" class="order-success-continue-btn">Continue Shopping</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        showSuccessModal(summary) {
            this.ensureSuccessModalDOM();
            const modal = document.getElementById('order-success-backdrop');
            if (!modal) return;

            const nameEl = document.getElementById('order-success-name');
            const qtyEl = document.getElementById('order-success-qty');
            const addrEl = document.getElementById('order-success-addr');
            const totalEl = document.getElementById('order-success-total');
            const subEl = document.getElementById('order-success-subtitle');
            const reopenBtn = document.getElementById('order-success-reopen-btn');

            const displayName = capitalizeWords(summary.name) || 'Valued Customer';
            const qtyText = summary.totalQty + (summary.totalQty === 1 ? ' cushion set' : ' cushions set');

            if (nameEl) nameEl.textContent = displayName;
            if (qtyEl) qtyEl.textContent = qtyText;
            if (addrEl) {
                addrEl.textContent = summary.address || '-';
                addrEl.title = summary.address || '';
            }
            if (totalEl) totalEl.textContent = formatPrice(summary.totalPrice);
            if (subEl) subEl.innerHTML = 'Thank you, <strong>' + displayName + '</strong>! Your order has been initiated on WhatsApp.';
            if (reopenBtn && summary.whatsappURL) reopenBtn.href = summary.whatsappURL;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Show congratulatory toast
            this.showToast('Order placed successfully! ' + EMOJI.pray);

            // Clear the cart
            this.clearCart();
        },

        closeSuccessModal() {
            const modal = document.getElementById('order-success-backdrop');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        // ==========================================================================
        // DOM Injections & Event Bindings
        // ==========================================================================
        ensureDrawerDOM() {
            if (document.getElementById('cart-drawer')) return;

            const drawerHTML = `
                <div id="cart-drawer-backdrop" class="cart-drawer-backdrop"></div>
                <div id="cart-drawer" class="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Cart">
                    <div class="cart-drawer-header">
                        <div class="cart-drawer-title">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <h3>Shopping Cart (<span id="cart-drawer-count" class="cart-drawer-count">0</span>)</h3>
                        </div>
                        <button id="cart-drawer-close" class="cart-drawer-close" aria-label="Close cart">&times;</button>
                    </div>

                    <div id="cart-drawer-items" class="cart-drawer-items"></div>

                    <div id="cart-drawer-footer" class="cart-drawer-footer">
                        <div class="cart-summary-row">
                            <span>Subtotal</span>
                            <span id="cart-drawer-subtotal" class="cart-price">${EMOJI.rupee}0</span>
                        </div>
                        <div class="cart-summary-row cart-total-row">
                            <span>Total Amount</span>
                            <span id="cart-drawer-total" class="cart-price-total">${EMOJI.rupee}0</span>
                        </div>

                        <div class="cart-checkout-form">
                            <h4 class="checkout-form-title">Customer Details</h4>
                            <div class="cart-form-group">
                                <label for="cust-name">Full Name <span class="required">*</span></label>
                                <input type="text" id="cust-name" class="cart-form-input" placeholder="e.g. Pooja Sharma" required autocomplete="name">
                            </div>
                            <div class="cart-form-group">
                                <label for="cust-phone">WhatsApp / Phone Number</label>
                                <input type="tel" id="cust-phone" class="cart-form-input" placeholder="e.g. +91 98765 43210" autocomplete="tel">
                            </div>
                            <div class="cart-form-group">
                                <label for="cust-address">Delivery Address & Pincode <span class="required">*</span></label>
                                <textarea id="cust-address" class="cart-form-textarea" rows="2" placeholder="House/Flat No., Street, City, State, Pincode" required autocomplete="street-address"></textarea>
                            </div>
                            <div class="cart-form-group">
                                <label for="cust-note">Order Notes (Optional)</label>
                                <input type="text" id="cust-note" class="cart-form-input" placeholder="Gift wrap, special delivery instructions, etc.">
                            </div>
                        </div>

                        <button type="button" id="cart-whatsapp-checkout-btn" class="whatsapp-checkout-btn">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.044-1.926-.465-1.574-.649-2.582-2.253-2.661-2.359-.079-.105-.633-.843-.633-1.608 0-.765.397-1.144.538-1.299.141-.156.309-.195.412-.195.103 0 .206.001.296.006.096.005.226-.037.353.267.13.312.443 1.08.482 1.16.039.08.065.174.013.278-.052.104-.078.169-.156.26-.079.091-.166.203-.238.273-.08.077-.163.161-.07.321.093.161.412.679.883 1.098.607.541 1.119.709 1.28.789.161.08.256.069.351-.041.095-.11.408-.475.518-.638.109-.163.22-.136.37-.08.151.056.953.449 1.117.531.164.082.273.123.313.191.039.069.039.4-.105.805z"/>
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.662 1.442 5.178L2 22l4.981-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.172c-1.678 0-3.238-.495-4.551-1.353l-.326-.213-2.955.775.789-2.88-.231-.368A8.146 8.146 0 0 1 3.828 12c0-4.506 3.666-8.172 8.172-8.172 4.506 0 8.172 3.666 8.172 8.172 0 4.506-3.666 8.172-8.172 8.172z"/>
                            </svg>
                            <span>Complete Order on WhatsApp</span>
                        </button>
                        <p class="whatsapp-note">&#128274; Direct WhatsApp order. Share requirements and receive dispatch details instantly.</p>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', drawerHTML);
        },

        ensureFloatingBtnDOM() {
            if (document.getElementById('floating-cart-btn')) return;

            const btnHTML = `
                <button type="button" id="floating-cart-btn" class="floating-cart-btn" aria-label="Open Cart" title="View Cart">
                    <i class="ti-shopping-cart"></i>
                    <span class="cart-count">0</span>
                </button>
            `;
            document.body.insertAdjacentHTML('beforeend', btnHTML);
        },

        ensureToastDOM() {
            if (document.getElementById('cart-toast')) return;

            const toastHTML = `
                <div id="cart-toast" class="cart-toast" role="alert" aria-live="assertive">
                    <span id="cart-toast-msg">Item added to cart!</span>
                    <button type="button" class="cart-toast-view-btn" onclick="AbodeCart.open()">View Cart</button>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHTML);
        },

        bindEvents() {
            document.addEventListener('click', (e) => {
                // Header cart button
                if (e.target.closest('#open-cart-header') || e.target.closest('.open-cart-trigger')) {
                    e.preventDefault();
                    this.open();
                }

                // Floating cart button
                if (e.target.closest('#floating-cart-btn')) {
                    e.preventDefault();
                    this.toggle();
                }

                // Close drawer buttons
                if (e.target.closest('#cart-drawer-close') || e.target.closest('#cart-drawer-backdrop')) {
                    e.preventDefault();
                    this.close();
                }

                // WhatsApp Checkout button in drawer
                if (e.target.closest('#cart-whatsapp-checkout-btn')) {
                    e.preventDefault();
                    this.sendWhatsAppOrder('drawer');
                }

                // Close Success Modal
                if (e.target.closest('#order-success-close') || e.target.closest('#order-success-continue-btn')) {
                    e.preventDefault();
                    this.closeSuccessModal();
                }

                if (e.target.closest('#order-success-backdrop') && !e.target.closest('.order-success-modal')) {
                    e.preventDefault();
                    this.closeSuccessModal();
                }
            });

            // ESC key to close cart and modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const successModal = document.getElementById('order-success-backdrop');
                    if (successModal && successModal.classList.contains('active')) {
                        this.closeSuccessModal();
                        return;
                    }

                    const drawer = document.getElementById('cart-drawer');
                    if (drawer && drawer.classList.contains('active')) {
                        this.close();
                    }
                }
            });
        },

        renderDrawer() {
            const container = document.getElementById('cart-drawer-items');
            const footer = document.getElementById('cart-drawer-footer');
            const subtotalEl = document.getElementById('cart-drawer-subtotal');
            const totalEl = document.getElementById('cart-drawer-total');

            if (!container) return;

            if (this.cart.length === 0) {
                container.innerHTML = `
                    <div class="cart-empty-state">
                        <div class="cart-empty-icon">&#128722;</div>
                        <h4>Your Cart is Empty</h4>
                        <p>Explore our exclusive collection of hand-painted cushions and bring art to your living space.</p>
                        <button type="button" class="cart-empty-browse-btn" onclick="AbodeCart.close()">Browse Collection</button>
                    </div>
                `;
                if (footer) footer.style.display = 'none';
                const emptyDrawerCount = document.getElementById('cart-drawer-count');
                if (emptyDrawerCount) emptyDrawerCount.textContent = '0';
                return;
            }

            if (footer) footer.style.display = 'block';

            let itemsHTML = '';
            this.cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                const variantText = [item.size, item.material].filter(Boolean).join(' ' + EMOJI.bullet + ' ');

                itemsHTML += `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="this.src='assets/img/logo/logo.png'">
                        <div class="cart-item-details">
                            <h5 class="cart-item-title" title="${item.title}">${item.title}</h5>
                            ${variantText ? `<div class="cart-item-variant">${variantText}</div>` : ''}
                            <div class="cart-item-price">${formatPrice(item.price)}</div>
                            <div class="cart-item-actions">
                                <div class="cart-item-qty">
                                    <button type="button" class="cart-qty-btn" onclick="AbodeCart.updateQty('${item.id}', -1)" aria-label="Decrease">&minus;</button>
                                    <span class="cart-qty-val">${item.quantity}</span>
                                    <button type="button" class="cart-qty-btn" onclick="AbodeCart.updateQty('${item.id}', 1)" aria-label="Increase">&plus;</button>
                                </div>
                                <button type="button" class="cart-item-remove" onclick="AbodeCart.removeItem('${item.id}')" title="Remove item" aria-label="Remove">
                                    <i class="ion-ios-trash-outline"></i>
                                </button>
                            </div>
                        </div>
                        <div class="cart-item-subtotal">${formatPrice(itemTotal)}</div>
                    </div>
                `;
            });

            container.innerHTML = itemsHTML;

            const total = this.getTotalPrice();
            if (subtotalEl) subtotalEl.textContent = formatPrice(total);
            if (totalEl) totalEl.textContent = formatPrice(total);
            const activeDrawerCount = document.getElementById('cart-drawer-count');
            if (activeDrawerCount) activeDrawerCount.textContent = this.getItemCount();
        },

        // Render dedicated cart page (cart.html)
        renderCartPage() {
            const tableBody = document.getElementById('cart-page-table-body');
            const subtotalEl = document.getElementById('cart-page-subtotal');
            const totalEl = document.getElementById('cart-page-total');
            const emptyContainer = document.getElementById('cart-page-empty');
            const contentContainer = document.getElementById('cart-page-content');

            if (!tableBody) return;

            if (this.cart.length === 0) {
                if (contentContainer) contentContainer.style.display = 'none';
                if (emptyContainer) emptyContainer.style.display = 'block';
                return;
            }

            if (contentContainer) contentContainer.style.display = 'block';
            if (emptyContainer) emptyContainer.style.display = 'none';

            let rowsHTML = '';
            this.cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                const variantText = [item.size, item.material].filter(Boolean).join(' ' + EMOJI.bullet + ' ');
                const links = resolveItemLinks(item);

                rowsHTML += `
                    <tr>
                        <td class="product-thumbnail">
                            <a href="gallery.html#${links.galleryId}"><img src="${item.image}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;"></a>
                        </td>
                        <td class="product-name">
                            <a href="gallery.html#${links.galleryId}" style="font-weight: 600;">${item.title}</a>
                            ${variantText ? `<div style="font-size: 12px; color: #777; margin-top: 4px;">${variantText}</div>` : ''}
                        </td>
                        <td class="product-price-cart"><span class="amount">${formatPrice(item.price)}</span></td>
                        <td class="product-quantity">
                            <div class="cart-item-qty" style="display: inline-flex;">
                                <button type="button" class="cart-qty-btn" onclick="AbodeCart.updateQty('${item.id}', -1)">&minus;</button>
                                <span class="cart-qty-val">${item.quantity}</span>
                                <button type="button" class="cart-qty-btn" onclick="AbodeCart.updateQty('${item.id}', 1)">&plus;</button>
                            </div>
                        </td>
                        <td class="product-subtotal">${formatPrice(itemTotal)}</td>
                        <td class="product-remove">
                            <a href="javascript:void(0)" onclick="AbodeCart.removeItem('${item.id}')" title="Remove" style="color: #999; font-size: 20px;">
                                <i class="ion-ios-trash-outline"></i>
                            </a>
                        </td>
                    </tr>
                `;
            });

            tableBody.innerHTML = rowsHTML;

            const total = this.getTotalPrice();
            if (subtotalEl) subtotalEl.textContent = formatPrice(total);
            if (totalEl) totalEl.textContent = formatPrice(total);
            const activeDrawerCount = document.getElementById('cart-drawer-count');
            if (activeDrawerCount) activeDrawerCount.textContent = this.getItemCount();
        },

        // ==========================================================================
        // Customer Details & WhatsApp Checkout
        // ==========================================================================
        loadCustomerDetails() {
            try {
                const stored = localStorage.getItem(CUSTOMER_KEY);
                if (!stored) return;
                const data = JSON.parse(stored);

                const nameEl = document.getElementById('cust-name');
                const phoneEl = document.getElementById('cust-phone');
                const addrEl = document.getElementById('cust-address');
                const noteEl = document.getElementById('cust-note');

                if (nameEl && data.name) nameEl.value = capitalizeWords(data.name);
                if (phoneEl && data.phone) phoneEl.value = data.phone;
                if (addrEl && data.address) addrEl.value = data.address;
                if (noteEl && data.note) noteEl.value = data.note;

                // Also populate page form if on cart.html
                const pName = document.getElementById('page-cust-name');
                const pPhone = document.getElementById('page-cust-phone');
                const pAddr = document.getElementById('page-cust-address');
                const pNote = document.getElementById('page-cust-note');

                if (pName && data.name) pName.value = capitalizeWords(data.name);
                if (pPhone && data.phone) pPhone.value = data.phone;
                if (pAddr && data.address) pAddr.value = data.address;
                if (pNote && data.note) pNote.value = data.note;
            } catch (err) {
                console.error('Error loading customer details:', err);
            }
        },

        saveCustomerDetails(customer) {
            try {
                localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
            } catch (err) {
                console.error('Error saving customer details:', err);
            }
        },

        sendWhatsAppOrder(source) {
            if (this.cart.length === 0) {
                alert('Your cart is empty! Please add cushions to your cart first.');
                return;
            }

            const prefix = source === 'page' ? 'page-' : '';
            const nameEl = document.getElementById(prefix + 'cust-name') || document.getElementById('cust-name');
            const phoneEl = document.getElementById(prefix + 'cust-phone') || document.getElementById('cust-phone');
            const addrEl = document.getElementById(prefix + 'cust-address') || document.getElementById('cust-address');
            const noteEl = document.getElementById(prefix + 'cust-note') || document.getElementById('cust-note');

            const rawName = nameEl ? nameEl.value.trim() : '';
            const name = capitalizeWords(rawName);
            if (nameEl && name) nameEl.value = name;

            const phone = phoneEl ? phoneEl.value.trim() : '';
            const address = addrEl ? addrEl.value.trim() : '';
            const note = noteEl ? noteEl.value.trim() : '';

            // Validation
            let hasError = false;
            if (!name) {
                if (nameEl) nameEl.classList.add('input-error');
                hasError = true;
            } else if (nameEl) {
                nameEl.classList.remove('input-error');
            }

            if (!address) {
                if (addrEl) addrEl.classList.add('input-error');
                hasError = true;
            } else if (addrEl) {
                addrEl.classList.remove('input-error');
            }

            if (hasError) {
                alert('Please enter your Full Name and Delivery Address to complete your order.');
                if (!name && nameEl) nameEl.focus();
                else if (!address && addrEl) addrEl.focus();
                return;
            }

            // Save details for next time
            this.saveCustomerDetails({ name, phone, address, note });

            // Capture order summary for success screen before clearing cart
            const orderSummary = {
                name: name,
                phone: phone,
                address: address,
                note: note,
                totalQty: this.getItemCount(),
                totalPrice: this.getTotalPrice()
            };

            // Generate WhatsApp message
            const message = this.buildWhatsAppMessage({ name, phone, address, note });

            // Universal WhatsApp URL
            const whatsappURL = 'https://api.whatsapp.com/send?phone=' + WHATSAPP_PHONE + '&text=' + encodeURIComponent(message);
            orderSummary.whatsappURL = whatsappURL;

            // Open WhatsApp
            window.open(whatsappURL, '_blank');

            // Close cart drawer if open
            this.close();

            // Display Order Success message modal and clear cart
            this.showSuccessModal(orderSummary);
        },

        buildWhatsAppMessage(customer) {
            const dateStr = new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const siteUrl = getBaseSiteUrl();
            const customerName = capitalizeWords(customer.name) || 'Customer';

            let msg = EMOJI.cart + ' *NEW ORDER - ' + STORE_NAME + '*\n';
            msg += EMOJI.calendar + ' Date: ' + dateStr + '\n';
            msg += EMOJI.hrThick + '\n\n';

            msg += EMOJI.person + ' *CUSTOMER DETAILS*\n';
            msg += EMOJI.bullet + ' Name: *' + customerName + '*\n';
            if (customer.phone) {
                msg += EMOJI.bullet + ' Phone: ' + customer.phone + '\n';
            }
            msg += EMOJI.bullet + ' Address: ' + customer.address + '\n';
            if (customer.note) {
                msg += EMOJI.bullet + ' Note: _' + customer.note + '_\n';
            }

            msg += '\n' + EMOJI.package + ' *ORDER ITEMS:*\n';
            msg += EMOJI.hrThin + '\n';

            this.cart.forEach((item, index) => {
                const links = resolveItemLinks(item);
                const qty = item.quantity || 1;
                const subtotal = item.price * qty;

                msg += (index + 1) + '. *' + item.title + '*\n';
                if (item.size) msg += '   ' + EMOJI.bullet + ' Size: ' + item.size + '\n';
                if (item.material) msg += '   ' + EMOJI.bullet + ' Fabric: ' + item.material + '\n';
                msg += '   ' + EMOJI.bullet + ' Qty: ' + qty + ' \u00D7 ' + formatPrice(item.price) + ' = *' + formatPrice(subtotal) + '*\n';
                // msg += '   ' + EMOJI.bullet + ' Item Link: ' + links.itemLink + '\n';
                msg += '   ' + EMOJI.bullet + ' Photo: ' + links.photoLink + '\n\n';
            });

            const totalQty = this.getItemCount();
            const totalPrice = this.getTotalPrice();

            msg += EMOJI.hrThin + '\n';
            msg += EMOJI.receipt + ' *Total Items:* ' + totalQty + '\n';
            msg += EMOJI.money + ' *Grand Total:* *' + formatPrice(totalPrice) + '*\n';
            msg += EMOJI.hrThick + '\n';
            msg += EMOJI.globe + ' *Website:* ' + siteUrl + '\n';
            msg += EMOJI.hrThick + '\n\n';
            msg += 'Hello! I would like to place this order. Please confirm availability and share payment / dispatch details. Thank you! ' + EMOJI.pray;

            return msg;
        },

        showToast(htmlMsg) {
            this.ensureToastDOM();
            const toast = document.getElementById('cart-toast');
            const msgEl = document.getElementById('cart-toast-msg');

            if (!toast || !msgEl) return;

            msgEl.innerHTML = htmlMsg;
            toast.classList.add('show');

            if (this._toastTimer) clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        }
    };

    // Expose globally
    window.AbodeCart = AbodeCart;

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AbodeCart.init());
    } else {
        AbodeCart.init();
    }
})();
