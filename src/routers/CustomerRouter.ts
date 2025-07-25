import express from "express";
import { createCustomer, getAllCustomers } from "../controllers/CustomerController";
export const customerRouter = express.Router();

customerRouter.post('/create',createCustomer);
customerRouter.get('/customersCount',getAllCustomers)
