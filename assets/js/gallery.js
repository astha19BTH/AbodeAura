/**
 * Abode Aura Gallery Script
 * Controls category filtering, interactive lightbox, and Add-to-Cart integration.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Category Filtering
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.gallery-filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    // ----------------------------------------------------
    // 2. Lightbox Functionality
    // ----------------------------------------------------
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxCounter = document.getElementById('lightbox-counter'); if (lightboxCounter) lightboxCounter.style.display = 'none';
    const lightboxClose = document.querySelector('.lightbox-close');
    const arrowLeft = document.querySelector('.lightbox-arrow-left');
    const arrowRight = document.querySelector('.lightbox-arrow-right');
    const loader = document.querySelector('.lightbox-loader');

    // Lightbox Cart elements
    const variantSelector = document.getElementById('lightbox-variant-selector');
    const variantBtn1 = document.getElementById('variant-btn-1');
    const variantBtn2 = document.getElementById('variant-btn-2');
    const variantName1 = document.getElementById('variant-name-1');
    const variantPrice1 = document.getElementById('variant-price-1');
    const variantName2 = document.getElementById('variant-name-2');
    const variantPrice2 = document.getElementById('variant-price-2');
    const qtyInput = document.getElementById('lightbox-qty');
    const qtyMinus = document.getElementById('lightbox-qty-minus');
    const qtyPlus = document.getElementById('lightbox-qty-plus');
    const addCartBtn = document.getElementById('lightbox-add-cart-btn');
    const buyWhatsappBtn = document.getElementById('lightbox-buy-whatsapp-btn');

    let currentVisibleItems = [];
    let currentIndex = 0;
    let currentVariant = 1; // 1 or 2
    let activeItemData = {};

    // Open lightbox
    const openLightbox = (element) => {
        currentVisibleItems = Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
        const parentItem = element.closest('.gallery-item');
        currentIndex = currentVisibleItems.indexOf(parentItem);

        if (currentIndex === -1) return;

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadImage();
    };

    // Load image and update UI content
    const loadImage = () => {
        if (!currentVisibleItems[currentIndex]) return;

        const parentItem = currentVisibleItems[currentIndex];
        const innerElement = parentItem.querySelector('.gallery-item-inner');
        const imgSrc = innerElement.getAttribute('data-src');
        const imgTitle = innerElement.getAttribute('data-title') || 'Handcrafted Cushion';
        const galleryId = parentItem.id || '';

        // Reset loader
        lightboxImg.classList.remove('loaded');
        if (loader) loader.style.display = 'block';

        lightboxImg.src = imgSrc;
        lightboxImg.alt = imgTitle;

        lightboxImg.onload = () => {
            if (loader) loader.style.display = 'none';
            lightboxImg.classList.add('loaded');
        };

        // Text & Counter
        lightboxCaption.textContent = imgTitle;
        // Counter removed per user request

        // Primary details: size, material, price
        const imgSize = innerElement.getAttribute('data-size') || '16\u00D716';
        const imgMaterial = innerElement.getAttribute('data-material') || 'Available in Synthetic, cotton fabric';
        const imgPrice = innerElement.getAttribute('data-price') || '\u20B91,499';

        const sizeSpan = document.getElementById('lightbox-size');
        const matSpan = document.getElementById('lightbox-material');
        const priceSpan = document.getElementById('lightbox-price');

        if (sizeSpan) {
            sizeSpan.textContent = imgSize;
            sizeSpan.classList.add('visible');
        }
        if (matSpan) {
            matSpan.textContent = imgMaterial;
            matSpan.classList.add('visible');
        }
        if (priceSpan) {
            priceSpan.textContent = imgPrice;
            priceSpan.classList.add('visible');
        }

        // Secondary details (when present)
        const details2 = document.getElementById('lightbox-details-2');
        const imgSize2 = innerElement.getAttribute('data-size-2');
        const imgMaterial2 = innerElement.getAttribute('data-material-2');
        const imgPrice2 = innerElement.getAttribute('data-price-2');
        const imgExtra = innerElement.getAttribute('data-extra');

        const sizeSpan2 = document.getElementById('lightbox-size-2');
        const matSpan2 = document.getElementById('lightbox-material-2');
        const priceSpan2 = document.getElementById('lightbox-price-2');
        const extraSpan = document.getElementById('lightbox-extra');

        let hasSecondary = false;

        if (sizeSpan2) {
            if (imgSize2) {
                sizeSpan2.textContent = imgSize2;
                sizeSpan2.classList.add('visible');
                hasSecondary = true;
            } else {
                sizeSpan2.classList.remove('visible');
            }
        }

        if (matSpan2) {
            if (imgMaterial2) {
                matSpan2.textContent = imgMaterial2;
                matSpan2.classList.add('visible');
                hasSecondary = true;
            } else {
                matSpan2.classList.remove('visible');
            }
        }

        if (priceSpan2) {
            if (imgPrice2) {
                priceSpan2.textContent = imgPrice2;
                priceSpan2.classList.add('visible');
                hasSecondary = true;
            } else {
                priceSpan2.classList.remove('visible');
            }
        }

        if (extraSpan) {
            if (imgExtra && !imgSize2 && !imgMaterial2 && !imgPrice2) {
                extraSpan.textContent = imgExtra;
                extraSpan.classList.add('visible');
                hasSecondary = true;
            } else {
                extraSpan.classList.remove('visible');
            }
        }

        if (details2) {
            details2.style.display = hasSecondary ? 'flex' : 'none';
        }

        // Save active item data for cart
        activeItemData = {
            title: imgTitle,
            image: imgSrc,
            galleryId: galleryId,
            size1: imgSize,
            material1: imgMaterial,
            price1: imgPrice,
            size2: imgSize2,
            material2: imgMaterial2,
            price2: imgPrice2,
            hasSecondary: Boolean(imgSize2 || imgPrice2)
        };

        // Reset variant and quantity
        currentVariant = 1;
        if (qtyInput) qtyInput.value = 1;

        if (variantSelector) {
            if (activeItemData.hasSecondary) {
                variantSelector.classList.add('active');
                if (variantName1) variantName1.textContent = imgSize;
                if (variantPrice1) variantPrice1.textContent = imgPrice;
                if (variantName2) variantName2.textContent = imgSize2 || 'Option 2';
                if (variantPrice2) variantPrice2.textContent = imgPrice2 || '';

                if (variantBtn1) variantBtn1.classList.add('active');
                if (variantBtn2) variantBtn2.classList.remove('active');
            } else {
                variantSelector.classList.remove('active');
            }
        }
    };

    // Navigation
    const nextImage = () => {
        if (currentVisibleItems.length <= 1) return;
        currentIndex = (currentIndex + 1) % currentVisibleItems.length;
        loadImage();
    };

    const prevImage = () => {
        if (currentVisibleItems.length <= 1) return;
        currentIndex = (currentIndex - 1 + currentVisibleItems.length) % currentVisibleItems.length;
        loadImage();
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            lightboxImg.src = '';
            lightboxImg.classList.remove('loaded');
        }, 300);
    };

    // ----------------------------------------------------
    // 3. Variant & Quantity Event Listeners in Lightbox
    // ----------------------------------------------------
    if (variantBtn1) {
        variantBtn1.addEventListener('click', () => {
            currentVariant = 1;
            variantBtn1.classList.add('active');
            if (variantBtn2) variantBtn2.classList.remove('active');
        });
    }

    if (variantBtn2) {
        variantBtn2.addEventListener('click', () => {
            currentVariant = 2;
            variantBtn2.classList.add('active');
            if (variantBtn1) variantBtn1.classList.remove('active');
        });
    }

    if (qtyMinus && qtyInput) {
        qtyMinus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
            }
        });
    }

    if (qtyPlus && qtyInput) {
        qtyPlus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val < 99) {
                qtyInput.value = val + 1;
            }
        });
    }

    // Helper to get active variant product info
    const getActiveCartItem = () => {
        const isV2 = currentVariant === 2 && activeItemData.hasSecondary;
        return {
            title: activeItemData.title,
            size: isV2 ? activeItemData.size2 : activeItemData.size1,
            material: isV2 ? (activeItemData.material2 || activeItemData.material1) : activeItemData.material1,
            price: isV2 ? activeItemData.price2 : activeItemData.price1,
            priceDisplay: isV2 ? activeItemData.price2 : activeItemData.price1,
            quantity: parseInt(qtyInput ? qtyInput.value : 1) || 1,
            image: activeItemData.image,
            galleryId: activeItemData.galleryId
        };
    };

    // Lightbox Add to Cart button
    if (addCartBtn) {
        addCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const item = getActiveCartItem();
            if (window.AbodeCart) {
                window.AbodeCart.addItem(item);
                window.AbodeCart.open();
            }
        });
    }

    // Lightbox Buy / Order on WhatsApp button
    if (buyWhatsappBtn) {
        buyWhatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const item = getActiveCartItem();
            if (window.AbodeCart) {
                window.AbodeCart.addItem(item);
                window.AbodeCart.open();
                setTimeout(() => {
                    const nameField = document.getElementById('cust-name');
                    if (nameField) nameField.focus();
                }, 350);
            }
        });
    }

    // ----------------------------------------------------
    // 4. Gallery Item Click & Quick-Add Handlers
    // ----------------------------------------------------
    document.querySelectorAll('.gallery-item-inner').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-cart-icon')) {
                return;
            }
            e.preventDefault();
            openLightbox(item);
        });
    });

    // Quick Add to Cart button on gallery overlay
    document.querySelectorAll('.gallery-cart-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const parentItem = btn.closest('.gallery-item');
            const inner = btn.closest('.gallery-item-inner');
            if (!inner) return;

            const title = inner.getAttribute('data-title') || 'Handcrafted Cushion';
            const size = inner.getAttribute('data-size') || '16\u00D716';
            const material = inner.getAttribute('data-material') || '';
            const price = inner.getAttribute('data-price') || '\u20B91,499';
            const img = inner.getAttribute('data-src') || 'images/gallery/gallery_1.jpeg';
            const galleryId = parentItem ? parentItem.id : '';

            if (window.AbodeCart) {
                window.AbodeCart.addItem({
                    title: title,
                    size: size,
                    material: material,
                    price: price,
                    priceDisplay: price,
                    quantity: 1,
                    image: img,
                    galleryId: galleryId
                });
                window.AbodeCart.open();
            }
        });
    });

    // Close and navigation button handlers
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (arrowRight) arrowRight.addEventListener('click', nextImage);
    if (arrowLeft) arrowLeft.addEventListener('click', prevImage);

    // Close when clicking outside content (on backdrop)
    if (lightbox) {
        lightbox.addEventListener('click     ', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        }
    });

    // ----------------------------------------------------
    // 5. Deep Link Handler (e.g. #gallery-1 opens directly)
    // ----------------------------------------------------
    const handleHashDeepLink = () => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#gallery-')) {
            const targetEl = document.querySelector(hash);
            if (targetEl) {
                // Ensure all items are visible if category filter was active
                filterButtons.forEach(b => {
                    if (b.getAttribute('data-filter') === 'all') b.classList.add('active');
                    else b.classList.remove('active');
                });
                galleryItems.forEach(item => item.classList.remove('hidden'));

                setTimeout(() => {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const inner = targetEl.querySelector('.gallery-item-inner');
                    if (inner) openLightbox(inner);
                }, 350);
            }
        }
    };

    handleHashDeepLink();
    window.addEventListener('hashchange', handleHashDeepLink);
});
