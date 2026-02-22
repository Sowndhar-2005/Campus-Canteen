import { Response } from 'express';
import { ProfileChangeRequest } from '../models/ProfileChangeRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Submit a profile change request
export const submitChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let { requestType, requestedValue } = req.body;

        if (!requestType || !requestedValue) {
            res.status(400).json({ error: 'Request type and requested value are required' });
            return;
        }

        if (!['email', 'registrationNumber', 'userType', 'name'].includes(requestType)) {
            res.status(400).json({ error: 'Invalid request type' });
            return;
        }

        // Trim and format input
        requestedValue = requestedValue.trim();
        if (requestType === 'email') requestedValue = requestedValue.toLowerCase();
        else if (requestType === 'registrationNumber') requestedValue = requestedValue.toUpperCase();

        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Get current value
        let currentValue = '';
        if (requestType === 'email') {
            currentValue = user.email;
        } else if (requestType === 'registrationNumber') {
            currentValue = user.registrationNumber || '';
        } else if (requestType === 'userType') {
            currentValue = user.userType || '';
        } else if (requestType === 'name') {
            currentValue = user.name;
        }

        // Check if value is actually different
        if (currentValue === requestedValue) {
            res.status(400).json({ error: `Selected ${requestType} is already your current value` });
            return;
        }

        // Check if there's already a pending request
        const existingRequest = await ProfileChangeRequest.findOne({
            userId: req.user._id,
            requestType,
            status: 'pending'
        });

        if (existingRequest) {
            res.status(400).json({ error: `You already have a pending ${requestType} change request` });
            return;
        }

        // Check if the new value is already in use
        if (requestType === 'email') {
            const emailExists = await User.findOne({ email: requestedValue });
            if (emailExists && emailExists._id.toString() !== req.user._id.toString()) {
                res.status(400).json({ error: 'This email is already in use' });
                return;
            }
        } else if (requestType === 'registrationNumber') {
            const regNoExists = await User.findOne({ registrationNumber: requestedValue });
            if (regNoExists && regNoExists._id.toString() !== req.user._id.toString()) {
                res.status(400).json({ error: 'This registration number is already in use' });
                return;
            }
        }

        // Create the change request
        const changeRequest = await ProfileChangeRequest.create({
            userId: req.user._id,
            requestType,
            currentValue,
            requestedValue,
        });

        res.json({
            message: 'Change request submitted successfully. Waiting for admin approval.',
            request: changeRequest
        });

    } catch (error: any) {
        console.error('Submit change request error:', error);
        res.status(500).json({ error: 'Failed to submit change request', details: error.message });
    }
};

// Get user's change requests
export const getMyChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const requests = await ProfileChangeRequest.find({
            userId: req.user._id
        }).sort({ requestedAt: -1 });

        res.json({ requests });
    } catch (error: any) {
        console.error('Get change requests error:', error);
        res.status(500).json({ error: 'Failed to get change requests' });
    }
};

// Admin: Get all pending change requests
export const getPendingChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.isAdmin) {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        const requests = await ProfileChangeRequest.find({ status: 'pending' })
            .populate('userId', 'name email registrationNumber')
            .sort({ requestedAt: -1 });

        res.json(requests);
    } catch (error: any) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Failed to get pending requests' });
    }
};

// Admin: Approve or reject change request
export const reviewChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.isAdmin) {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        const { requestId } = req.params;
        const { action, rejectionReason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            res.status(400).json({ error: 'Invalid action' });
            return;
        }

        const changeRequest = await ProfileChangeRequest.findById(requestId);
        if (!changeRequest) {
            res.status(404).json({ error: 'Change request not found' });
            return;
        }

        if (changeRequest.status !== 'pending') {
            res.status(400).json({ error: 'This request has already been reviewed' });
            return;
        }

        const user = await User.findById(changeRequest.userId);
        if (!user) {
            // If user is gone, we should still clean up the request
            changeRequest.status = 'rejected';
            changeRequest.rejectionReason = 'User no longer exists';
            changeRequest.reviewedAt = new Date();
            changeRequest.reviewedBy = req.user._id;
            await changeRequest.save();
            res.status(404).json({ error: 'User associated with this request no longer exists. Request auto-rejected.' });
            return;
        }

        if (action === 'approve') {
            // Check for potential conflicts again at approval time
            if (changeRequest.requestType === 'email') {
                const emailExists = await User.findOne({ email: changeRequest.requestedValue });
                if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                    res.status(400).json({ error: 'This email is now in use by another user' });
                    return;
                }
                user.email = changeRequest.requestedValue;
            } else if (changeRequest.requestType === 'registrationNumber') {
                const regNoExists = await User.findOne({ registrationNumber: changeRequest.requestedValue });
                if (regNoExists && regNoExists._id.toString() !== user._id.toString()) {
                    res.status(400).json({ error: 'This registration number is now in use by another user' });
                    return;
                }
                user.registrationNumber = changeRequest.requestedValue;
            } else if (changeRequest.requestType === 'userType') {
                user.userType = changeRequest.requestedValue as 'dayscholar' | 'hosteller';
            } else if (changeRequest.requestType === 'name') {
                user.name = changeRequest.requestedValue;
            }

            // Prepare notification
            let typeLabel = '';
            if (changeRequest.requestType === 'email') typeLabel = 'email';
            else if (changeRequest.requestType === 'registrationNumber') typeLabel = 'registration number';
            else if (changeRequest.requestType === 'userType') typeLabel = 'user type';
            else if (changeRequest.requestType === 'name') typeLabel = 'name';

            if (!user.notifications) user.notifications = [];
            user.notifications.push({
                message: `Your ${typeLabel} change request has been approved. New value: ${changeRequest.requestedValue}`,
                type: 'success',
                read: false,
                createdAt: new Date(),
            });

            await user.save();

            // Update request status
            changeRequest.status = 'approved';
            changeRequest.reviewedAt = new Date();
            changeRequest.reviewedBy = req.user._id;
            await changeRequest.save();

            res.json({
                message: 'Change request approved successfully',
                request: changeRequest
            });

        } else {
            // Reject request
            changeRequest.status = 'rejected';
            changeRequest.reviewedAt = new Date();
            changeRequest.reviewedBy = req.user._id;
            changeRequest.rejectionReason = rejectionReason || 'Request rejected by admin';
            await changeRequest.save();

            // Add notification to user
            let typeLabel = '';
            if (changeRequest.requestType === 'email') typeLabel = 'email';
            else if (changeRequest.requestType === 'registrationNumber') typeLabel = 'registration number';
            else if (changeRequest.requestType === 'userType') typeLabel = 'user type';
            else if (changeRequest.requestType === 'name') typeLabel = 'name';

            if (!user.notifications) user.notifications = [];
            user.notifications.push({
                message: `Your ${typeLabel} change request was rejected. Reason: ${rejectionReason || 'Not specified'}`,
                type: 'warning',
                read: false,
                createdAt: new Date(),
            });
            await user.save();

            res.json({
                message: 'Change request rejected',
                request: changeRequest
            });
        }

    } catch (error: any) {
        console.error('Review change request error:', error);
        res.status(500).json({ 
            error: 'An internal error occurred during review', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
};
