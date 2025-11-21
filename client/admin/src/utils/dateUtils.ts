export const formatDate = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return 'N/A';

    try {
        // Handle potential edge cases where the input might be an object wrapping the date
        const dateValue = (dateInput as any).created_at || (dateInput as any).createdAt || dateInput;

        const date = new Date(dateValue);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date input:', dateInput);
            return 'N/A';
        }

        // Format as dd/mm/yyyy
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'N/A';
    }
};
