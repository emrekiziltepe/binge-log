import themeService, { lightColors, darkColors } from '../themeService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

describe('themeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset internal state if possible, or just rely on public methods
        // Since it's a singleton, we might need to be careful. 
        // Ideally, we'd reset the singleton, but for now we'll just set it to a known state.
        themeService.theme = 'dark';
        themeService.colors = darkColors;
        themeService.listeners = [];
    });

    describe('init', () => {
        it('loads saved theme from storage', async () => {
            AsyncStorage.getItem.mockResolvedValue('light');
            await themeService.init();
            expect(themeService.getTheme()).toBe('light');
            expect(themeService.getColors()).toBe(lightColors);
        });

        it('defaults to dark if no theme saved', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);
            await themeService.init();
            expect(themeService.getTheme()).toBe('dark');
            expect(themeService.getColors()).toBe(darkColors);
        });
    });

    describe('setTheme', () => {
        it('sets theme and saves to storage', async () => {
            await themeService.setTheme('light');
            expect(themeService.getTheme()).toBe('light');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme', 'light');
        });

        it('ignores invalid theme', async () => {
            await themeService.setTheme('invalid');
            expect(themeService.getTheme()).toBe('dark'); // Should remain unchanged
            expect(AsyncStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('toggleTheme', () => {
        it('toggles from dark to light', async () => {
            themeService.theme = 'dark';
            await themeService.toggleTheme();
            expect(themeService.getTheme()).toBe('light');
        });

        it('toggles from light to dark', async () => {
            themeService.theme = 'light';
            await themeService.toggleTheme();
            expect(themeService.getTheme()).toBe('dark');
        });
    });

    describe('listeners', () => {
        it('notifies listeners on change', async () => {
            const listener = jest.fn();
            themeService.addListener(listener);

            await themeService.setTheme('light');
            expect(listener).toHaveBeenCalledWith('light');
        });

        it('removes listener correctly', async () => {
            const listener = jest.fn();
            const unsubscribe = themeService.addListener(listener);

            unsubscribe();
            await themeService.setTheme('light');
            expect(listener).not.toHaveBeenCalled();
        });
    });
});
