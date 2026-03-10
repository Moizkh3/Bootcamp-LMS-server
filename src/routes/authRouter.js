import express from "express"
import { changePassword, login, logout , register, sentOtpForResetPassword , verifyOtp } from "../controllers/authController.js"
import checkAuth from "../middlewares/checkAuth.js";


const authRouter = express.Router()

authRouter.post('/login' , login);
authRouter.get('/logout' , logout);
authRouter.put('/change-password' , checkAuth, changePassword);
authRouter.post('/getVerificationEmailForForgetPassword' , sentOtpForResetPassword);
authRouter.post('/verifyOtp' , verifyOtp );
authRouter.post('/register' , register);




export default authRouter;
