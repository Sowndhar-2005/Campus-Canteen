import mongoose from 'mongoose';

/**
 * Detects user type based on email and registration number.
 * Hostellers have 'H' in registration number or 'hostel' in email.
 */
export const detectUserType = (email: string, registrationNumber: string): 'dayscholar' | 'hosteller' => {
    const normalizedEmail = email ? email.toLowerCase() : '';

    // Only check email for hostel indicator — reg number check removed
    // because dept codes like MECH contain 'H' causing false positives.
    // UserType should be explicitly set during registration/seeding.
    if (normalizedEmail.includes('hostel')) {
        return 'hosteller';
    }
    return 'dayscholar';
};

/**
 * Calculates tax and total amount with strict number handling.
 * Tax is 5% of subtotal.
 */
export const calculateOrderTotal = (subtotal: number): { subtotal: number; tax: number; totalAmount: number } => {
    const TAX_RATE = 0.05;

    // Ensure subtotal is a clean number (2 decimal places)
    // Using Math.round for better currency rounding than toFixed
    const cleanSubtotal = Math.round(subtotal * 100) / 100;

    // Calculate tax and round to 2 decimal places
    const tax = Math.round(cleanSubtotal * TAX_RATE * 100) / 100;

    // Calculate total and round to 2 decimal places
    const totalAmount = Math.round((cleanSubtotal + tax) * 100) / 100;

    return { subtotal: cleanSubtotal, tax, totalAmount };
};

/**
 * Checks if a user is already in the shared cart participants list.
 * Handles Mongoose ObjectId comparison.
 */
export const isUserInSharedCart = (sharedWith: any[], userId: string | mongoose.Types.ObjectId): boolean => {
    if (!sharedWith || !userId) return false;

    const userIdStr = userId.toString();

    return sharedWith.some(participantId => {
        if (!participantId) return false;
        return participantId.toString() === userIdStr;
    });
};
