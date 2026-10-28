import { Router } from 'express';
import { getMenu, getPizzaBySlugOrId, getIngredients, validateCustomPizza } from '../controllers/menuController.js';

const router = Router();

router.get('/', getMenu);
router.get('/item/:slugOrId', getPizzaBySlugOrId);
router.get('/slug/:slugOrId', getPizzaBySlugOrId);
router.get('/ingredients', getIngredients);
router.post('/validate-custom', validateCustomPizza);

export default router;
