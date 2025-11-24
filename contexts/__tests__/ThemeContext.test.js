import React from 'react';
import { ThemeContext } from '../ThemeContext';

describe('ThemeContext', () => {
    it('has default dark theme values', () => {
        expect(ThemeContext._currentValue).toBeDefined();
        expect(ThemeContext._currentValue.theme).toBe('dark');
        expect(ThemeContext._currentValue.colors).toBeDefined();
    });

    it('has toggleTheme function', () => {
        expect(typeof ThemeContext._currentValue.toggleTheme).toBe('function');
    });

    it('has setTheme function', () => {
        expect(typeof ThemeContext._currentValue.setTheme).toBe('function');
    });
});
