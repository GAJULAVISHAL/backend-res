import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OrderRouter } from './routers/OrderRouter';
import { MenuRouter } from './routers/MenuRouter';
import { customerRouter } from './routers/CustomerRouter';
import { whatsAppRouter } from './routers/WhatsappRouter';

dotenv.config();
const port = process.env.PORT || 4040; // Default to 3000 if PORT is not set
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/menu',MenuRouter);
app.use('/api/v1/order',OrderRouter)
app.use('/api/v1/customer',customerRouter)
app.use('/api/v1/whatsapp', whatsAppRouter);

app.listen(port, () => {
    console.log(`server running on port ${port}`); 
});