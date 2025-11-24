import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActivityFormModal from '../ActivityFormModal';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

describe('ActivityFormModal', () => {
    const mockCategories = {
        book: { name: 'Book', emoji: '📚', detailLabel: 'Pages', detailPlaceholder: 'Enter pages' },
        movie: { name: 'Movie', emoji: '🎬', detailLabel: 'Duration', detailPlaceholder: 'Enter duration' },
    };

    const mockColors = {
        modalBackground: '#fff',
        modalContent: '#fff',
        text: '#000',
        textSecondary: '#666',
        primary: 'blue',
        surfaceSecondary: '#eee',
        inputBackground: '#f0f0f0',
        inputBorder: '#ccc',
        placeholder: '#999',
        error: 'red',
    };

    const defaultProps = {
        visible: true,
        modalType: 'add',
        formData: { title: '', category: 'book', detail: '', isCompleted: false, rating: 0 },
        setFormData: jest.fn(),
        seasonEpisodes: [],
        duration: { hours: '', minutes: '' },
        setDuration: jest.fn(),
        CATEGORIES: mockCategories,
        colors: mockColors,
        onClose: jest.fn(),
        onSave: jest.fn(),
        updateSeasonEpisode: jest.fn(),
        addSeasonEpisodeRow: jest.fn(),
        removeSeasonEpisodeRow: jest.fn(),
        handleCompletionToggle: jest.fn(),
        renderStars: jest.fn(),
    };

    it('renders correctly when visible', () => {
        const { getByText, getByTestId } = render(<ActivityFormModal {...defaultProps} />);
        expect(getByText('activity.addActivity')).toBeTruthy();
        expect(getByTestId('activity-title-input')).toBeTruthy();
    });

    it('calls setFormData when title changes', () => {
        const { getByTestId } = render(<ActivityFormModal {...defaultProps} />);
        fireEvent.changeText(getByTestId('activity-title-input'), 'New Book');
        expect(defaultProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Book' }));
    });

    it('calls setFormData when category changes', () => {
        const { getByTestId } = render(<ActivityFormModal {...defaultProps} />);
        fireEvent.press(getByTestId('category-button-movie'));
        expect(defaultProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({ category: 'movie' }));
    });

    it('calls setFormData when detail changes', () => {
        const { getByTestId } = render(<ActivityFormModal {...defaultProps} />);
        fireEvent.changeText(getByTestId('activity-detail-input'), '100');
        expect(defaultProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({ detail: '100' }));
    });

    it('calls onSave when save button pressed', () => {
        const { getByTestId } = render(<ActivityFormModal {...defaultProps} />);
        fireEvent.press(getByTestId('save-button'));
        expect(defaultProps.onSave).toHaveBeenCalled();
    });
});
