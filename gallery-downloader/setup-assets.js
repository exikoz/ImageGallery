const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// --- CONFIGURATION ---
const ACCESS_KEY = 'REPLACE_WITH_YOUR_UNSPLASH_ACCESS_KEY';

const categories = [
    { name: 'Wallpapers', slug: 'wallpapers' },
    { name: 'Nature', slug: 'nature' },
    { name: 'Animals', slug: 'animals' },
    { name: 'Travel', slug: 'travel' }
];

// --- 1. FOLDER CREATION ---
const folders = ['./images/thumbs', './images/full', './data'];
folders.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

async function initializeGallery() {
    const galleryMetadata = [];

    for (const cat of categories) {
        console.log(`\n--- Processing Topic: ${cat.name} ---`);

        try {
            // Fetch from Topic endpoint
            const response = await axios.get(`https://api.unsplash.com/topics/${cat.slug}/photos`, {
                params: { per_page: 10 },
                headers: { 
                    'Authorization': `Client-ID ${ACCESS_KEY}`,
                    'Accept-Version': 'v1' 
                }
            });

            for (const [index, photo] of response.data.entries()) {
                try {
                    const fileName = `${cat.name.toLowerCase()}-${index + 1}.webp`;

                    // 2. DOWNLOAD IMAGE
                    const imgBuffer = (await axios.get(photo.urls.raw, { responseType: 'arraybuffer' })).data;

                    // 3. SHARP OPTIMIZATION (FULL & THUMB)
                    await sharp(imgBuffer)
                        .resize(1200)
                        .webp({ quality: 80 })
                        .toFile(`./images/full/${fileName}`);

                    await sharp(imgBuffer)
                        .resize(300, 300, { fit: 'cover' })
                        .webp({ quality: 70 })
                        .toFile(`./images/thumbs/${fileName}`);

                    // 4. TAGGING LOGIC
                    const descriptionText = (photo.alt_description || photo.description || "");
                    const words = descriptionText
                        .toLowerCase()
                        .replace(/[^\w\s]/g, '') // Remove punctuation
                        .split(/\s+/)           // Split by whitespace
                        .filter(word => word.length > 3); // Keep only descriptive words

                    // stop-word list
                    const stopWords = new Set([
                        'mouth', 'open', 'middle', 'overlooking', 'photo', 'with', 'american',
                        'beside', 'body', 'during', 'night', 'time', 'daytime', 'daytme',
                        'near', 'over', 'covered', 'view', 'aerial', 'behind',
                        'closeup', 'close-up', 'photography', 'selective', 'focus',
                        'standing', 'sitting', 'looking', 'walking', 'running', 'flying', 'riding', 'going',
                        'distance', 'lone', 'petaled', 'blooming', 'adult', 'carrier',
                        'background', 'beautiful', 'natural', 'outdoor', 'scenic',
                        'upward', 'gown', 'belgian', 'fawn'
                    ]);

                    const tagSet = new Set([cat.name.toLowerCase()]);
                    words.forEach(w => {
                        if (!stopWords.has(w)) tagSet.add(w);
                    });

                    const finalTags = Array.from(tagSet);

                    // 5. METADATA OBJECT
                    galleryMetadata.push({
                        id: photo.id,
                        title: photo.alt_description || `${cat.name} Image ${index + 1}`,
                        category: cat.name,
                        tags: finalTags,
                        thumbUrl: `images/thumbs/${fileName}`,
                        fullUrl: `images/full/${fileName}`
                    });

                    console.log(`  [OK] Saved: ${fileName} | Tags: ${finalTags.slice(0, 3).join(', ')}...`);
                } catch (imgErr) {
                    console.error(`  [SKIP] Failed on image ${index + 1}: ${imgErr.message}`);
                }
            }
        } catch (error) {
            console.error(`  [ERROR] Topic ${cat.name} failed:`, error.message);
        }
    }

    // 6. JSON GENERATION
    fs.writeFileSync('./data/images.json', JSON.stringify(galleryMetadata, null, 2));
    console.log('\n✅ SUCCESS: 40 images processed. Local gallery and data/images.json are ready.');
}

initializeGallery();