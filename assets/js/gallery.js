/**
 * Abode Aura Gallery Script
 * Controls category filtering and interactive lightbox logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Category Filtering
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.gallery-filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Set active class on button
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
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxClose = document.querySelector('.lightbox-close');
    const arrowLeft = document.querySelector('.lightbox-arrow-left');
    const arrowRight = document.querySelector('.lightbox-arrow-right');
    const loader = document.querySelector('.lightbox-loader');

    let currentVisibleItems = [];
    let currentIndex = 0;

    // Open lightbox
    const openLightbox = (element) => {
        // Find all currently visible items in the grid based on active filter
        currentVisibleItems = Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
        
        // Find the index of the clicked item in the visible list
        const parentItem = element.closest('.gallery-item');
        currentIndex = currentVisibleItems.indexOf(parentItem);

        if (currentIndex === -1) return;

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Disable page scrolling
        loadImage();
    };

    // Load image and update UI content
    const loadImage = () => {
        if (!currentVisibleItems[currentIndex]) return;
        
        const innerElement = currentVisibleItems[currentIndex].querySelector('.gallery-item-inner');
        const imgSrc = innerElement.getAttribute('data-src');
        const imgTitle = innerElement.getAttribute('data-title');

        // Reset image transition state and show loader
        lightboxImg.classList.remove('loaded');
        loader.style.display = 'block';

        // Load new image
        lightboxImg.src = imgSrc;
        lightboxImg.alt = imgTitle;

        lightboxImg.onload = () => {
            loader.style.display = 'none';
            lightboxImg.classList.add('loaded');
        };

        // Update text descriptions
        lightboxCaption.textContent = imgTitle;
        lightboxCounter.textContent = `${currentIndex + 1} / ${currentVisibleItems.length}`;

        // Populate detail attributes: size, material, price only
        const imgSize = innerElement.getAttribute('data-size') || "16×16";
        const imgMaterial = innerElement.getAttribute('data-material') || "Available in Synthetic, cotton fabric";
        const imgPrice = innerElement.getAttribute('data-price') || "₹1,499";

        const sizeSpan = document.getElementById('lightbox-size');
        const matSpan = document.getElementById('lightbox-material');
        const priceSpan = document.getElementById('lightbox-price');

        if (sizeSpan) {
            if (imgSize) {
                sizeSpan.textContent = imgSize;
                sizeSpan.classList.add('visible');
            } else {
                sizeSpan.classList.remove('visible');
            }
        }

        if (matSpan) {
            if (imgMaterial) {
                matSpan.textContent = imgMaterial;
                matSpan.classList.add('visible');
            } else {
                matSpan.classList.remove('visible');
            }
        }

        if (priceSpan) {
            if (imgPrice) {
                priceSpan.textContent = imgPrice;
                priceSpan.classList.add('visible');
            } else {
                priceSpan.classList.remove('visible');
            }
        }

        // Secondary details (e.g. additional size/material/price option)
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
        document.body.style.overflow = ''; // Re-enable page scrolling
        // Clear src to avoid briefly showing old image when opened next time
        setTimeout(() => {
            lightboxImg.src = '';
            lightboxImg.classList.remove('loaded');
        }, 300);
    };

    // Setup click events on gallery item inner links
    document.querySelectorAll('.gallery-item-inner').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(item);
        });
    });

    // Close and navigation button handlers
    lightboxClose.addEventListener('click', closeLightbox);
    arrowRight.addEventListener('click', nextImage);
    arrowLeft.addEventListener('click', prevImage);

    // Close when clicking outside the content (on the overlay backdrop)
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

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
});
