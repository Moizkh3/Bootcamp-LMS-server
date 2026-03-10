import express from 'express';
import { addDomain, editDomain, getAllDoamins, getDomainById } from '../controllers/domainController.js';

const domainRouter = express.Router();

domainRouter.post('/add' , addDomain);
domainRouter.get('/all' , getAllDoamins);
domainRouter.put('/edit/:id' , editDomain);
domainRouter.get('/get/:id' , getDomainById);

export default domainRouter;
