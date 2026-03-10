import express from "express";
import {
    getProfile,
    getUsersByRole
} from "../controllers/userController.js";
import {
    getUsers,
    getSingleUser,
    updateUser,
    deleteUser
} from "../controllers/authController.js";
import checkAuth from "../middlewares/checkAuth.js";
import checkAdmin from "../middlewares/checkAdmin.js";

const userRouter = express.Router();

userRouter.get("/profile", checkAuth, getProfile);
userRouter.get("/role-users", checkAuth, getUsersByRole); // Simple list for dropdowns

// Admin Management Routes
userRouter.get("/all", checkAuth, checkAdmin, getUsers);
userRouter.get("/:id", checkAuth, checkAdmin, getSingleUser);
userRouter.put("/:id", checkAuth, checkAdmin, updateUser);
userRouter.delete("/:id", checkAuth, checkAdmin, deleteUser);

export default userRouter;
