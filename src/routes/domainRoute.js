import express from 'express';
import { addDomain, editDomain, getAllDomains, getDomainById, deleteDomain } from '../controllers/domainController.js';
import checkAdmin from '../middlewares/checkAdmin.js';

const domainRouter = express.Router();

domainRouter.post('/add', checkAdmin, addDomain);
domainRouter.get('/all', getAllDomains); // Read access for all authenticated users
domainRouter.put('/edit/:id', checkAdmin, editDomain);
domainRouter.get('/get/:id', getDomainById); // Read access
domainRouter.delete('/delete/:id', checkAdmin, deleteDomain);

export default domainRouter;
