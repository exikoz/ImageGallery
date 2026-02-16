import { filterImagesByCategory, searchImages, getUniqueTags, validateImageData } from './logic.js';

// State
let allImages = [];
let currentImages = [];

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const searchInput = document.getElementById('image-search');
const categoryButtons = document.querySelectorAll('.category-nav .nav-btn');
const tagContainer = document.querySelector('.tag-list');
const tagToggleBtn = document.getElementById('tag-toggle-btn');
const statusMessage = document.getElementById('status-message');
const statusText = statusMessage.querySelector('p');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxCategory = document.getElementById('lightbox-category');
const lightboxClose = document.getElementById('lightbox-close');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let currentLightboxIndex = 0;

// --- Initialization ---

async function init() {
    try {
        const response = await fetch('data/images.json');
        if (!response.ok) throw new Error('Failed to load images');

        const data = await response.json();

        if (!validateImageData(data)) {
            throw new Error('Invalid data format');
        }

        allImages = data;
        currentImages = [...allImages];

        renderTags();
        renderGallery(currentImages);
        setupEventListeners();

    } catch (error) {
        console.error(error);
        showStatus('Error loading gallery. Please try again later.');
    }
}

// --- Rendering ---

function renderGallery(images) {
    galleryGrid.innerHTML = '';

    if (images.length === 0) {
        showStatus('No images found matching your criteria.');
        return;
    }

    hideStatus();

    images.forEach(image => {
        const article = document.createElement('article');
        article.className = 'gallery-item';
        article.dataset.category = image.category.toLowerCase();

        // Lazy loading is handled by the browser with loading="lazy"

        article.innerHTML = `
      <button class="image-wrapper" aria-haspopup="dialog" aria-label="View Full ${image.title}">
        <img src="${image.thumbUrl}"
             alt="${image.title}"
             loading="lazy"
             width="400" height="300">
        <div class="overlay" aria-hidden="true">
            <span class="view-text">View Full</span>
        </div>
      </button>
      <div class="image-info">
        <h3>${image.title}</h3>
        <p class="image-category">${image.category}</p>
        <div class="image-tags" aria-label="Tags">
            ${image.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
        </div>
      </div>
    `;

        // Add click event for lightbox
        const btn = article.querySelector('.image-wrapper');
        btn.addEventListener('click', () => openLightbox(image));

        galleryGrid.appendChild(article);
    });
}

function renderTags() {
    const uniqueTags = getUniqueTags(allImages);
    const INITIAL_VISIBLE_COUNT = 15;

    // Reset state
    tagContainer.innerHTML = '';

    // Create "All" button
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-chip active';
    allBtn.textContent = 'All';
    allBtn.ariaPressed = 'true';
    allBtn.addEventListener('click', () => handleTagFilter(null, allBtn));
    tagContainer.appendChild(allBtn);

    uniqueTags.forEach((tag, index) => {
        const btn = document.createElement('button');
        btn.className = 'tag-chip';
        if (index >= INITIAL_VISIBLE_COUNT) {
            btn.classList.add('hidden-tag');
        }
        btn.textContent = tag;
        btn.ariaPressed = 'false';
        btn.addEventListener('click', () => handleTagFilter(tag, btn));
        tagContainer.appendChild(btn);
    });

    // Handle Toggle Button visibility
    if (uniqueTags.length > INITIAL_VISIBLE_COUNT) {
        tagToggleBtn.classList.remove('hidden');
        tagToggleBtn.textContent = `Show more (${uniqueTags.length - INITIAL_VISIBLE_COUNT}+)`;
        tagToggleBtn.onclick = toggleTags;
    } else {
        tagToggleBtn.classList.add('hidden');
    }
}

function toggleTags() {
    const isExpanded = tagToggleBtn.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
        // Collapse
        const tags = Array.from(tagContainer.children).slice(1); // skip "All"
        tags.forEach((tag, i) => {
            if (i >= 15) tag.classList.add('hidden-tag');
        });

        tagToggleBtn.textContent = 'Show more';
        tagToggleBtn.setAttribute('aria-expanded', 'false');
    } else {
        // Expand
        const tags = tagContainer.querySelectorAll('.hidden-tag');
        tags.forEach(tag => tag.classList.remove('hidden-tag'));
        tagToggleBtn.textContent = 'Show less';
        tagToggleBtn.setAttribute('aria-expanded', 'true');
    }
}

function showStatus(msg) {
    statusText.textContent = msg;
    statusMessage.classList.remove('hidden');
}

function hideStatus() {
    statusMessage.classList.add('hidden');
}

// --- Event Handlers ---

function setupEventListeners() {
    // Category Navigation
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI
            categoryButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-selected', 'true');

            // Filter logic
            const category = e.target.dataset.category;
            // Map 'all' to empty string or handle in logic
            const filterCat = category === 'all' ? null :
                category.charAt(0).toUpperCase() + category.slice(1);

            // Reset other filters for simplicity or combine
            searchInput.value = '';
            resetTags();

            currentImages = filterImagesByCategory(allImages, filterCat);
            renderGallery(currentImages);
        });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        // Search everything for better UX.

        // Reset category UI to "All" if searching
        if (query.length > 0) {
            resetCategoryUI();
            resetTags();
        }

        currentImages = searchImages(allImages, query);
        renderGallery(currentImages);
    });

    // Lightbox interactions
    lightboxClose.addEventListener('click', closeLightbox);

    // Close on backdrop click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.open) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'ArrowRight') showNextImage();
    });

    prevBtn.addEventListener('click', showPrevImage);
    nextBtn.addEventListener('click', showNextImage);
}

function handleTagFilter(tag, btnElement) {
    // UI Update
    const allTags = tagContainer.querySelectorAll('.tag-chip');
    allTags.forEach(b => {
        b.classList.remove('active');
        b.ariaPressed = 'false';
    });
    btnElement.classList.add('active');
    btnElement.ariaPressed = 'true';

    if (!tag) {
        // "All" clicked
        resetCategoryUI();
        searchInput.value = '';
        currentImages = [...allImages];
        renderGallery(currentImages);
        return;
    }

    // Logic: Filter all images by this tag
    resetCategoryUI();
    searchInput.value = '';

    // We can reuse searchImages since it searches tags too, strict filter is better for "Tag Filter"
    currentImages = allImages.filter(img => img.tags.includes(tag));
    renderGallery(currentImages);
}

function resetTags() {
    const allTags = tagContainer.querySelectorAll('.tag-chip');
    allTags.forEach(b => {
        b.classList.remove('active');
        b.ariaPressed = 'false';
    });
    // Set 'All' active
    tagContainer.firstElementChild.classList.add('active');
    tagContainer.firstElementChild.ariaPressed = 'true';
}

function resetCategoryUI() {
    categoryButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
    });
    // Set 'All' active
    categoryButtons[0].classList.add('active');
    categoryButtons[0].setAttribute('aria-selected', 'true');
}

// --- Lightbox Logic ---

function openLightbox(image) {
    // Find index of this image in the *currently rendered* list
    // This allows next/prev to walk through the filtered result
    currentLightboxIndex = currentImages.findIndex(img => img.id === image.id);

    updateLightboxContent(image);
    lightbox.showModal();
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeLightbox() {
    lightbox.close();
    document.body.style.overflow = '';
}

function updateLightboxContent(image) {
    lightboxImg.src = image.fullUrl;
    lightboxImg.alt = image.title;
    lightboxTitle.textContent = image.title;
    lightboxCategory.textContent = image.category;
}

function showNextImage() {
    if (currentLightboxIndex < currentImages.length - 1) {
        currentLightboxIndex++;
    } else {
        currentLightboxIndex = 0; // Loop around
    }
    updateLightboxContent(currentImages[currentLightboxIndex]);
}

function showPrevImage() {
    if (currentLightboxIndex > 0) {
        currentLightboxIndex--;
    } else {
        currentLightboxIndex = currentImages.length - 1; // Loop around
    }
    updateLightboxContent(currentImages[currentLightboxIndex]);
}

// Run
init();
