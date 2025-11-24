import { renderHook, act } from '@testing-library/react-native';
import { useGoals } from '../useGoals';
import goalService from '../../services/goalService';

// Mock goalService
jest.mock('../../services/goalService', () => ({
    getGoals: jest.fn(),
    addListener: jest.fn(),
}));

describe('useGoals', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads goals on mount', async () => {
        const mockGoals = { weekly: { book: 10 }, monthly: {} };
        goalService.getGoals.mockResolvedValue(mockGoals);
        goalService.addListener.mockReturnValue(() => { });

        const { result } = renderHook(() => useGoals());

        // Initially loading
        expect(result.current.loading).toBe(true);

        // Wait for async effect
        await act(async () => {
            await Promise.resolve(); // Wait for next tick
        });

        expect(goalService.getGoals).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.goals).toEqual(mockGoals);
    });

    it('subscribes to goal updates', async () => {
        goalService.getGoals.mockResolvedValue({});
        let listenerCallback;
        goalService.addListener.mockImplementation((cb) => {
            listenerCallback = cb;
            return () => { };
        });

        const { result } = renderHook(() => useGoals());

        await act(async () => {
            await Promise.resolve();
        });

        // Simulate update
        const updatedGoals = { weekly: { book: 20 } };
        act(() => {
            listenerCallback(updatedGoals);
        });

        expect(result.current.goals).toEqual(updatedGoals);
    });
});
