import { removeDuplicates } from '../commonUtils';

describe('commonUtils', () => {
    describe('removeDuplicates', () => {
        it('removes duplicate items based on id', () => {
            const input = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' },
                { id: '1', name: 'Item 1 Duplicate' },
            ];

            const result = removeDuplicates(input);

            expect(result.length).toBe(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });

        it('returns empty array for empty input', () => {
            const result = removeDuplicates([]);
            expect(result).toEqual([]);
        });

        it('keeps all items if no duplicates', () => {
            const input = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' },
            ];

            const result = removeDuplicates(input);

            expect(result.length).toBe(2);
        });
    });
});
