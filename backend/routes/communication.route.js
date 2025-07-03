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
} from '../controllers/communicationController.js';
import fileUpload from 'express-fileupload';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(fileUpload());

router.post('/submit', submitCommunication);
router.get('/', getCommunications);
router.post('/:id/assign-reviewers', assignReviewers);
router.get('/committee-members', getCommitteeMembers);
router.get('/download/:id', downloadFile);
router.post('/delete-bulk', deleteBulkCommunications);
router.get('/assigned-to-me', verifyToken,getAssignedToMe);
router.post('/:assignmentId/set-score', verifyToken,setScore);
export default router;