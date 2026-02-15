/**
 * Image Gallery Automation Script
 * Fetches 40 images from Unsplash, processes sizes, and generates JSON metadata.
 */

const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// --- CONFIGURATION ---
const ACCESS_KEY = 'REPLACE_WITH_YOUR_UNSPLASH_ACCESS_KEY'; 

const categories = [
    { name: 'Water', id: '9949164' },
    { name: 'Architecture', id: '3330452' },
    { name: 'Nature', id: '158642' },
    { name: 'Animals', id: '1154337' }
];

// Ensure directories exist
const folders = ['./images/thumbs', './images/full', './data'];
folders.forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }));

async function initializeGallery() {
    const galleryMetadata = [];

    for (const cat of categories) {
        console.log(`Fetching category: ${cat.name}...`);
        
        try {
            const response = await axios.get(`https://api.unsplash.com/collections/${cat.id}/photos`, {
                params: { per_page: 10 },
                headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
            });

            for (const [index, photo] of response.data.entries()) {
                // Download original image buffer
                const imgBuffer = (await axios.get(photo.urls.raw, { responseType: 'arraybuffer' })).data;
                const fileName = `${cat.name.toLowerCase()}-${index + 1}.webp`;

                // 1. Process Full-size (WebP, optimized)
                await sharp(imgBuffer)
                    .resize(1200)
                    .webp({ quality: 80 })
                    .toFile(`./images/full/${fileName}`);

                // 2. Process Thumbnail (WebP, cropped square)
                await sharp(imgBuffer)
                    .resize(300, 300, { fit: 'cover' })
                    .webp({ quality: 70 })
                    .toFile(`./images/thumbs/${fileName}`);

                // 3. Add to metadata list
                galleryMetadata.push({
                    id: photo.id,
                    alt: photo.alt_description || `${cat.name} photo`,
                    category: cat.name,
                    tags: [cat.name.toLowerCase(), ...(photo.tags?.map(t => t.title) || [])],
                    thumb: `images/thumbs/${fileName}`,
                    full: `images/full/${fileName}`
                });

                console.log(`  [OK] Processed: ${fileName}`);
            }
        } catch (error) {
            console.error(`Error processing ${cat.name}:`, error.message);
        }
    }

    // Save the final JSON file for the fetch() requirement
    fs.writeFileSync('./data/images.json', JSON.stringify(galleryMetadata, null, 2));
    console.log('\n✅ Setup Complete: 40 images processed and images.json generated!');
}

initializeGallery();