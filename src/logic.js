/**
 * @typedef {Object} Image
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string[]} tags
 * @property {string} thumbUrl
 * @property {string} fullUrl
 */

/**
 * Filter images by category.
 * @param {Image[]} images 
 * @param {string} category 
 * @returns {Image[]}
 */
export function filterImagesByCategory(images, category) {
    if (!category || category === 'All') return images;
    return images.filter(img => img.category === category);
}

/**
 * Search images by title or tags.
 * @param {Image[]} images 
 * @param {string} query 
 * @returns {Image[]}
 */
export function searchImages(images, query) {
    if (!query) return images;
    const lowerQuery = query.toLowerCase().trim();

    return images.filter(img => {
        const titleMatch = img.title.toLowerCase().includes(lowerQuery);
        const tagMatch = img.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        return titleMatch || tagMatch;
    });
}

/**
 * Get unique tags from a list of images.
 * @param {Image[]} images 
 * @returns {string[]}
 */
export function getUniqueTags(images) {
    const allTags = images.flatMap(img => img.tags);
    return [...new Set(allTags)].sort();
}

/**
 * Validate that the loaded data is an array and has required properties.
 * @param {any} data 
 * @returns {boolean}
 */
export function validateImageData(data) {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return true; // Empty array is valid but empty

    // Check first item structure as a sample
    const requiredProps = ['id', 'title', 'category', 'tags', 'thumbUrl', 'fullUrl'];
    const sample = data[0];

    return requiredProps.every(prop => Object.prototype.hasOwnProperty.call(sample, prop));
}