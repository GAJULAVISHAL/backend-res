import express from "express";
import { createMenu } from '../controllers/MenuController';
import { getTodayMenu } from "../controllers/MenuController";
export const MenuRouter = express.Router();

MenuRouter.post('/add',createMenu)
MenuRouter.get('/today',getTodayMenu)