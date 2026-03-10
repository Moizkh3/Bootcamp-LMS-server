import express from "express";
import { isSubmitTodayStandup } from "../controllers/studentDashboardController.js";

const studentDashboardRouter = express.Router();

studentDashboardRouter.get("/is-submit-today-standup" , isSubmitTodayStandup);

export default studentDashboardRouter;
