import  express  from "express";
import { getTodayOrders, getAllOrders } from "../controllers/OrderController";


export const OrderRouter = express.Router();

OrderRouter.get('/today',getTodayOrders)
OrderRouter.get('/allOrders',getAllOrders)