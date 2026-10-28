import { Request, Response } from 'express';
import { IngredientModel } from '../models/Ingredient.js';
import { PizzaMenuModel } from '../models/PizzaMenu.js';

export async function getMenu(req: Request, res: Response) {
  try {
    const pizzas = await PizzaMenuModel.find();
    return res.status(200).json({
      success: true,
      pizzas
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch menu.' });
  }
}

export async function getPizzaBySlugOrId(req: Request, res: Response) {
  try {
    const { slugOrId } = req.params;
    if (!slugOrId) {
      return res.status(400).json({ success: false, message: 'Pizza identifier is required.' });
    }
    const pizza = await PizzaMenuModel.findBySlugOrId(slugOrId);
    if (!pizza) {
      return res.status(404).json({ success: false, message: 'Pizza not found.' });
    }
    return res.status(200).json({
      success: true,
      pizza
    });
  } catch (error) {
    console.error('Error fetching pizza details:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pizza details.' });
  }
}

export async function getIngredients(req: Request, res: Response) {
  try {
    const allIngredients = await IngredientModel.find();

    const grouped = {
      bases: allIngredients.filter(i => i.category === 'base'),
      sauces: allIngredients.filter(i => i.category === 'sauce'),
      cheeses: allIngredients.filter(i => i.category === 'cheese'),
      veggies: allIngredients.filter(i => i.category === 'veggie')
    };

    return res.status(200).json({
      success: true,
      ingredients: allIngredients,
      grouped
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ingredients.' });
  }
}

export async function validateCustomPizza(req: Request, res: Response) {
  try {
    const { baseId, sauceId, cheeseId, veggieIds = [] } = req.body;

    if (!baseId || !sauceId || !cheeseId) {
      return res.status(400).json({
        success: false,
        message: 'A custom pizza must include a base, a sauce, and a cheese selection.'
      });
    }

    const base = await IngredientModel.findById(baseId);
    if (!base || base.category !== 'base') {
      return res.status(400).json({ success: false, message: 'Invalid pizza base selected.' });
    }
    if (base.quantity <= 0) {
      return res.status(400).json({ success: false, message: `Pizza base '${base.name}' is out of stock.` });
    }

    const sauce = await IngredientModel.findById(sauceId);
    if (!sauce || sauce.category !== 'sauce') {
      return res.status(400).json({ success: false, message: 'Invalid pizza sauce selected.' });
    }
    if (sauce.quantity <= 0) {
      return res.status(400).json({ success: false, message: `Sauce '${sauce.name}' is out of stock.` });
    }

    const cheese = await IngredientModel.findById(cheeseId);
    if (!cheese || cheese.category !== 'cheese') {
      return res.status(400).json({ success: false, message: 'Invalid cheese selected.' });
    }
    if (cheese.quantity <= 0) {
      return res.status(400).json({ success: false, message: `Cheese '${cheese.name}' is out of stock.` });
    }

    const validatedVeggies: any[] = [];
    let veggiesTotal = 0;

    for (const vId of veggieIds) {
      const veggie = await IngredientModel.findById(vId);
      if (!veggie || veggie.category !== 'veggie') {
        return res.status(400).json({ success: false, message: `Invalid vegetable item selected: ${vId}` });
      }
      if (veggie.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Vegetable '${veggie.name}' is out of stock.` });
      }
      validatedVeggies.push({
        id: veggie.id || veggie._id,
        name: veggie.name,
        price: veggie.price
      });
      veggiesTotal += veggie.price;
    }

    // Backend calculated true price
    const calculatedPrice = base.price + sauce.price + cheese.price + veggiesTotal;

    return res.status(200).json({
      success: true,
      price: calculatedPrice,
      breakdown: {
        base: { id: base.id || base._id, name: base.name, price: base.price },
        sauce: { id: sauce.id || sauce._id, name: sauce.name, price: sauce.price },
        cheese: { id: cheese.id || cheese._id, name: cheese.name, price: cheese.price },
        veggies: validatedVeggies
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ success: false, message: 'Error validating pizza configuration.' });
  }
}
