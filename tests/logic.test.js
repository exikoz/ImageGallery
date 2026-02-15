import { filterImagesByCategory, searchImages, getUniqueTags, validateImageData } from '../src/logic.js';

const mockImages = [
  {
    id: '1',
    title: 'Sunset Beach',
    category: 'Nature',
    tags: ['sunset', 'beach', 'water'],
    thumbUrl: 'thumb1.jpg',
    fullUrl: 'full1.jpg'
  },
  {
    id: '2',
    title: 'City Skyline',
    category: 'Wallpapers',
    tags: ['city', 'night', 'lights'],
    thumbUrl: 'thumb2.jpg',
    fullUrl: 'full2.jpg'
  },
  {
    id: '3',
    title: 'Mountain Trek',
    category: 'Travel',
    tags: ['mountain', 'trek', 'hiking'],
    thumbUrl: 'thumb3.jpg',
    fullUrl: 'full3.jpg'
  },
  {
    id: '4',
    title: 'Cute Puppy',
    category: 'Animals',
    tags: ['dog', 'puppy', 'cute'],
    thumbUrl: 'thumb4.jpg',
    fullUrl: 'full4.jpg'
  }
];

describe('Image Gallery Logic', () => {

  describe('filterImagesByCategory', () => {
    test('returns all images if category is "All" or empty', () => {
      expect(filterImagesByCategory(mockImages, 'All')).toHaveLength(4);
      expect(filterImagesByCategory(mockImages, '')).toHaveLength(4);
    });

    test('filters images by specific category', () => {
      const natureImages = filterImagesByCategory(mockImages, 'Nature');
      expect(natureImages).toHaveLength(1);
      expect(natureImages.every(img => img.category === 'Nature')).toBe(true);
    });

    test('returns empty array if no matches', () => {
      const spaceImages = filterImagesByCategory(mockImages, 'Space');
      expect(spaceImages).toHaveLength(0);
    });
  });

  describe('searchImages', () => {
    test('returns all images if query is empty', () => {
      expect(searchImages(mockImages, '')).toHaveLength(4);
    });

    test('finds images by title (case insensitive)', () => {
      const results = searchImages(mockImages, 'sunset');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Sunset Beach');
    });

    test('finds images by matching partial title', () => {
      const results = searchImages(mockImages, 'city');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('City Skyline');
    });

    test('finds images by tag', () => {
      const results = searchImages(mockImages, 'water');
      expect(results).toHaveLength(1); // Only 'Sunset Beach' has 'water' tag now
    });

    test('does not return duplicate images if title and tag match', () => {
      // In our implementation filter matches checking condition, so duplicates within the array wouldn't happen 
      // unless the source array had duplicates.
      const results = searchImages(mockImages, 'mountain');
      expect(results).toHaveLength(1);
    });

    test('returns empty array if no matches', () => {
      expect(searchImages(mockImages, 'xyz123')).toHaveLength(0);
    });
  });

  describe('getUniqueTags', () => {
    test('returns a unique list of all tags', () => {
      const tags = getUniqueTags(mockImages);
      // Total unique tags: sunset, beach, water, building, glass, city, mountain, lake, scenic, dog, puppy, cute
      // 'water' is repeated.
      expect(tags).toContain('water');
      expect(tags.filter(t => t === 'water')).toHaveLength(1);
      expect(tags.length).toBe(12);
    });

    test('returns sorted tags', () => {
      const tags = getUniqueTags(mockImages);
      expect(tags[0]).toBe('beach'); // Alphabetically first
    });
  });

  describe('validateImageData', () => {
    test('returns false for non-array input', () => {
      expect(validateImageData({})).toBe(false);
      expect(validateImageData(null)).toBe(false);
    });

    test('returns true for valid array', () => {
      expect(validateImageData(mockImages)).toBe(true);
    });

    test('returns false if items miss required properties', () => {
      const invalidData = [{ id: '1', title: 'Missing props' }];
      expect(validateImageData(invalidData)).toBe(false);
    });
  });

});