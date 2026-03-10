import express from 'express';
import checkAuth from '../middlewares/checkAuth.js';
import checkAdmin from '../middlewares/checkAdmin.js';
import {
    createBootcamp,
    getAllBootcamps,
    getBootcampById,
    deleteBootcamp,
    editBootcamp
} from '../controllers/bootcampController.js';

const bootcampRouter = express.Router();

bootcampRouter.post('/create', checkAuth, checkAdmin, createBootcamp);
bootcampRouter.get('/all', checkAuth, getAllBootcamps);
bootcampRouter.get('/:id', checkAuth, getBootcampById);
bootcampRouter.put('/:id', checkAuth, checkAdmin, editBootcamp);
bootcampRouter.delete('/:id', checkAuth, checkAdmin, deleteBootcamp);

export default bootcampRouter;