import express from 'express';
import {
  submitCommunication,
  getCommunications,
  assignReviewers,
  getCommitteeMembers,
  downloadFile,
  deleteBulkCommunications,
  getAssignedToMe,
  setScore,
  trackReviewerAction,
  getTrackingForCommunication,
  getAdminNotifications,
  markAllNotificationsRead,
  getReviewerNotifications,
  markReviewerNotificationRead,
  getMyCommunications,
  getUserNotifications,
  markUserNotificationRead,
  markAllUserNotificationsRead,
} from '../controllers/communicationController.js';
import { modifyWordDocument, getCommunicationContent } from '../controllers/wordModificationController.js';
import fileUpload from 'express-fileupload';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(fileUpload());

router.post('/submit',verifyToken ,submitCommunication);
router.get('/', getCommunications);
router.post('/:id/assign-reviewers', assignReviewers);
router.get('/committee-members', getCommitteeMembers);
router.get('/download/:id', downloadFile);
router.post('/delete-bulk', deleteBulkCommunications);
router.get('/assigned-to-me', verifyToken,getAssignedToMe);
router.post('/:assignmentId/set-score', verifyToken,setScore);
router.post('/:assignmentId/track', verifyToken, trackReviewerAction);
router.get('/:id/tracking', getTrackingForCommunication);
router.get('/admin/notifications', getAdminNotifications);
router.post('/admin/notifications/mark-all-read', markAllNotificationsRead);
router.get('/reviewer/notifications', verifyToken, getReviewerNotifications);
router.post('/reviewer/notifications/:id/read', verifyToken, markReviewerNotificationRead);
router.get('/user/notifications', verifyToken, getUserNotifications);
router.post('/user/notifications/:id/read', verifyToken, markUserNotificationRead);
router.post('/user/notifications/mark-all-read', verifyToken, markAllUserNotificationsRead);
router.get('/my', verifyToken, getMyCommunications);
router.get('/content/:communicationId', verifyToken, getCommunicationContent);
router.put('/modify/:communicationId', verifyToken, modifyWordDocument);
export default router;