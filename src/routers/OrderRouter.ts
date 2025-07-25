import  express  from "express";
import { createOrder, getAllOrders } from "../controllers/OrderController";
import { getTodayOrders } from '../controllers/OrderController';

export const OrderRouter = express.Router();

OrderRouter.post('/createOrder',createOrder)
OrderRouter.get('/today',getTodayOrders)
OrderRouter.get('/allOrders',getAllOrders)