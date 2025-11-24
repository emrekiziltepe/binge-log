import {
    CATEGORY_COLORS,
    CATEGORY_EMOJIS,
    getCategories,
    getCategoriesSimple,
    getCategoriesForGoals,
    getCategoryKeys,
} from '../categoryUtils';

describe('categoryUtils', () => {
    const mockT = (key) => `translated_${key}`;

    describe('Constants', () => {
        it('has correct colors defined', () => {
            expect(CATEGORY_COLORS.book).toBeDefined();
            expect(CATEGORY_COLORS.series).toBeDefined();
        });

        it('has correct emojis defined', () => {
            expect(CATEGORY_EMOJIS.book).toBe('📚');
            expect(CATEGORY_EMOJIS.series).toBe('📺');
        });
    });

    describe('getCategories', () => {
        it('returns all categories with correct structure', () => {
            const categories = getCategories(mockT);
            const keys = Object.keys(categories);

            expect(keys).toContain('book');
            expect(keys).toContain('series');

            // Check book structure
            expect(categories.book.name).toBe('translated_categories.book');
            expect(categories.book.emoji).toBe(CATEGORY_EMOJIS.book);
            expect(categories.book.color).toBe(CATEGORY_COLORS.book);
            expect(categories.book.requiresDetail).toBe(true);

            // Check movie structure
            expect(categories.movie.requiresDetail).toBe(false);
        });
    });

    describe('getCategoriesSimple', () => {
        it('returns simplified categories', () => {
            const categories = getCategoriesSimple(mockT);

            expect(categories.book.name).toBe('translated_categories.book');
            expect(categories.book.emoji).toBe(CATEGORY_EMOJIS.book);
            expect(categories.book.color).toBeUndefined(); // Simple version doesn't have color
        });
    });

    describe('getCategoriesForGoals', () => {
        it('returns categories for goals', () => {
            const categories = getCategoriesForGoals(mockT);

            expect(categories.book.nameKey).toBe('categories.book');
            expect(categories.book.unitKey).toBe('goals.pages');
        });
    });

    describe('getCategoryKeys', () => {
        it('returns all category keys', () => {
            const keys = getCategoryKeys();
            expect(keys).toEqual(expect.arrayContaining(['book', 'series', 'movie', 'game', 'education', 'sport']));
            expect(keys.length).toBe(6);
        });
    });
});
