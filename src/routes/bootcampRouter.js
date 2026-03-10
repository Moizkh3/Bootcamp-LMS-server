import express from 'express';
import checkAuth from '../middlewares/checkAuth.js';
import checkAdmin from '../middlewares/checkAdmin.js';
import { createBootcamp } from '../controllers/bootcampController.js';

const bootcampRouter = express.Router();

bootcampRouter.post('/create' , checkAuth , checkAdmin , createBootcamp);


export default bootcampRouter;