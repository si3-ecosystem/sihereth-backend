// src/routes/users.routes.ts
import { Router } from 'express';
import {
  getUsers,
  subscribeEmail,
} from '../controllers/users.controller';

const router = Router();

router.get('/', getUsers);
router.get('/subscribe', subscribeEmail);

export default router;
