import { Router } from 'express';
import { submitChangeRequest, getMyChangeRequests, getPendingChangeRequests, reviewChangeRequest } from '../controllers/profileChangeController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Submit a profile change request
router.post('/submit', submitChangeRequest);

// Get my change requests
router.get('/my-requests', getMyChangeRequests);

// Admin: Get all pending change requests
router.get('/pending', getPendingChangeRequests);

// Admin: Review a change request
router.put('/:requestId/review', reviewChangeRequest);

export default router;
