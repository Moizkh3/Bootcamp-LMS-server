import express from "express";
import { getEnrollmentByDomains, getKpis } from "../controllers/adminDashboard.js";


const adminDashboardRouter = express.Router();

adminDashboardRouter.get('/kpis' , getKpis);
adminDashboardRouter.get('/enrollment-by-domains' , getEnrollmentByDomains);


export default adminDashboardRouter;