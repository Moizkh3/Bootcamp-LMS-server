import express from "express"
import { changePassword, getProfile, login, logout, register, registerBulkUsers, sentOtpForResetPassword, verifyOtp } from "../controllers/authController.js"
import checkAuth from "../middlewares/checkAuth.js";
import checkAdminOrTeacher from "../middlewares/checkAdminOrTeacher.js";
import multer from "multer";

// Store file in memory (buffer) since we parse it directly
const upload = multer({ storage: multer.memoryStorage() });

const authRouter = express.Router()

authRouter.post('/login', login);
authRouter.get('/logout', logout);
authRouter.get('/get-profile', checkAuth, getProfile);
authRouter.put('/change-password', checkAuth, changePassword);
authRouter.post('/getVerificationEmailForForgetPassword', sentOtpForResetPassword);
authRouter.get('/check-email-config', (req, res) => {
  res.json({
    emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.split('@')[0].slice(0, 3)}...` : 'MISSING',
    emailPass: process.env.EMAIL_PASS ? 'DEFINED (MASKED)' : 'MISSING',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});
authRouter.post('/verifyOtp', verifyOtp);
authRouter.post('/register', register);
authRouter.post('/bulk-register', checkAuth, checkAdminOrTeacher, upload.single('file'), registerBulkUsers);

export default authRouter;
