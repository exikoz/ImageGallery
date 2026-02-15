/**
 * Image Gallery Automation Script
 * * This script:
 * 1. Connects to the Unsplash API.
 * 2. Downloads 40 images (10 per category).
 * 3. Uses 'Sharp' to create optimized WebP thumbnails and full-size versions.
 * 4. Generates a 'data/images.json' file with rich tags for search/filtering.
 */

const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// --- CONFIGURATION ---
// Replace this with your actual Unsplash Access Key
// const ACCESS_KEY = 'REPLACE_WITH_YOUR_UNSPLASH_ACCESS_KEY';
const ACCESS_KEY = 'PxVZUgpsNEmtBsfZMWZPkpahu_q62z-MDumpRgER-yc';

const categories = [
    { name: 'Water', id: '9949164' },
    { name: 'Architecture', id: '3330452' },
    { name: 'Nature', id: '158642' },
    { name: 'Animals', id: '1154337' }
];

// Ensure required project directories exist
const folders = ['./images/thumbs', './images/full', './data'];
folders.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Main function to fetch, process, and catalog images
 */
async function initializeGallery() {
    const galleryMetadata = [];

    for (const cat of categories) {
        console.log(`--- Processing Category: ${cat.name} ---`);

        try {
            // Fetch photo list from the specific collection
            const response = await axios.get(`https://api.unsplash.com/collections/${cat.id}/photos`, {
                params: { per_page: 10 },
                headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
            });

            for (const [index, photo] of response.data.entries()) {
                const fileName = `${cat.name.toLowerCase()}-${index + 1}.webp`;

                // Download the raw image data
                const imgBuffer = (await axios.get(photo.urls.raw, { responseType: 'arraybuffer' })).data;

                // 1. Save Full-size Version (Optimized WebP, 1200px width)
                await sharp(imgBuffer)
                    .resize(1200)
                    .webp({ quality: 80 })
                    .toFile(`./images/full/${fileName}`);

                // 2. Save Thumbnail Version (Optimized WebP, 300x300 Square Crop)
                await sharp(imgBuffer)
                    .resize(300, 300, { fit: 'cover' })
                    .webp({ quality: 70 })
                    .toFile(`./images/thumbs/${fileName}`);

                // 3. Generate Rich Tags for the Search Function
                // We extract words from the description and filter out short/useless words
                const descriptionText = (photo.alt_description || photo.description || "");
                const words = descriptionText
                    .toLowerCase()
                    .replace(/[^\w\s]/g, '') // Remove punctuation
                    .split(/\s+/)           // Split by whitespace
                    .filter(word => word.length > 3); // Keep only descriptive words

                // Combine category name with description words to create unique tags
                const tagSet = new Set([cat.name.toLowerCase(), ...words]);
                const finalTags = Array.from(tagSet);

                // 4. Add metadata to the collection
                galleryMetadata.push({
                    id: photo.id,
                    title: photo.alt_description || `${cat.name} Image ${index + 1}`,
                    category: cat.name,
                    tags: finalTags,
                    thumbUrl: `images/thumbs/${fileName}`,
                    fullUrl: `images/full/${fileName}`
                });

                console.log(`  [OK] Saved: ${fileName} (Tags: ${finalTags.slice(0, 3).join(', ')}...)`);
            }
        } catch (error) {
            console.error(`  [ERROR] Failed to process ${cat.name}:`, error.message);
        }
    }

    // Write the final JSON file for the frontend to fetch()
    fs.writeFileSync('./data/images.json', JSON.stringify(galleryMetadata, null, 2));
    console.log('\n✅ SUCCESS: 40 images processed and data/images.json generated.');
}

initializeGallery();