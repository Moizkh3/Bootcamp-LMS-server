import express from "express";
import { getProfile } from "../controllers/userController.js";
import checkAuth from "../middlewares/checkAuth.js";

const userRouter = express.Router();

userRouter.get("/profile", getProfile);

export default userRouter;
