import express from "express";
import { 
    isSubmitTodayStandup, 
    getStudentStats, 
    getStudentAssignments 
} from "../controllers/studentDashboardController.js";

const studentDashboardRouter = express.Router();

studentDashboardRouter.get("/is-submit-today-standup" , isSubmitTodayStandup);
studentDashboardRouter.get("/stats", getStudentStats);
studentDashboardRouter.get("/assignments", getStudentAssignments);

export default studentDashboardRouter;
