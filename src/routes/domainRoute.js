import express from 'express';
import { addDomain, editDomain, getAllDomains, getDomainById, deleteDomain } from '../controllers/domainController.js';

const domainRouter = express.Router();

domainRouter.post('/add', addDomain);
domainRouter.get('/all', getAllDomains);
domainRouter.put('/edit/:id', editDomain);
domainRouter.get('/get/:id', getDomainById);
domainRouter.delete('/delete/:id', deleteDomain);

export default domainRouter;
