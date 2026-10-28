import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import { IngredientModel } from '../models/Ingredient.js';
import { PizzaMenuModel } from '../models/PizzaMenu.js';

export async function seedInitialData() {
  try {
    // 1. Seed Users if not present
    const userCount = await UserModel.count();
    if (userCount === 0) {
      console.log('[SEED] Seeding initial users...');
      const adminPass = await bcrypt.hash('Admin@12345', 10);
      const customerPass = await bcrypt.hash('Customer@12345', 10);

      await UserModel.create({
        name: 'Head Chef & Admin',
        email: 'admin@artisancrust.com',
        password: adminPass,
        role: 'admin',
        isVerified: true
      });

      await UserModel.create({
        name: 'Harsh Chotaliya',
        email: 'customer@example.com',
        password: customerPass,
        role: 'customer',
        isVerified: true
      });
      console.log('[SEED] Initial admin and customer created.');
    }

    // 2. Seed Ingredients if not present
    const ingredients = await IngredientModel.find();
    if (ingredients.length === 0) {
      console.log('[SEED] Seeding artisan ingredients...');

      // 5 Bases
      await IngredientModel.create({ name: 'Thin Crust Sourdough', category: 'base', price: 140, quantity: 50, lowStockThreshold: 10, description: '48-hour fermented rustic sourdough with crisp charred edges' });
      await IngredientModel.create({ name: 'Neapolitan Hand-Tossed', category: 'base', price: 160, quantity: 45, lowStockThreshold: 10, description: 'Classic airy Italian crust with soft blistered cornicione' });
      await IngredientModel.create({ name: 'Deep Dish Chicago Style', category: 'base', price: 190, quantity: 30, lowStockThreshold: 8, description: 'Golden buttered high-walled buttery cornmeal dough' });
      await IngredientModel.create({ name: 'Gluten-Free Cauliflower', category: 'base', price: 210, quantity: 25, lowStockThreshold: 8, description: 'Crisp artisan grain-free crust made with roast cauliflower and herbs' });
      await IngredientModel.create({ name: 'Stuffed Garlic Herb Crust', category: 'base', price: 220, quantity: 6, lowStockThreshold: 10, description: 'Crust pocket stuffed with roasted garlic butter and aged mozzarella' });

      // 5 Sauces
      await IngredientModel.create({ name: 'San Marzano Tomato', category: 'sauce', price: 60, quantity: 60, lowStockThreshold: 12, description: 'Sun-drenched D.O.P. Italian plum tomatoes, sea salt and fresh oregano' });
      await IngredientModel.create({ name: 'Creamy Garlic Alfredo', category: 'sauce', price: 80, quantity: 40, lowStockThreshold: 10, description: 'Slow-simmered heavy cream, roast garlic cloves, and parmigiano' });
      await IngredientModel.create({ name: 'Spicy Arrabbiata', category: 'sauce', price: 70, quantity: 35, lowStockThreshold: 10, description: 'Fiery Calabrian chili-infused San Marzano reduction' });
      await IngredientModel.create({ name: 'Basil Pesto Verde', category: 'sauce', price: 90, quantity: 30, lowStockThreshold: 8, description: 'Fresh pine nuts, sweet basil leaves, pecorino, and extra virgin olive oil' });
      await IngredientModel.create({ name: 'Smoky BBQ Marinara', category: 'sauce', price: 75, quantity: 7, lowStockThreshold: 10, description: 'Woodsmoke-infused sweet tomato glaze with cracked black pepper' });

      // Cheese varieties
      await IngredientModel.create({ name: 'Fior di Latte Mozzarella', category: 'cheese', price: 90, quantity: 65, lowStockThreshold: 15, description: 'Creamy artisanal cow milk mozzarella that stretches effortlessly' });
      await IngredientModel.create({ name: 'Aged English Cheddar', category: 'cheese', price: 110, quantity: 40, lowStockThreshold: 10, description: 'Sharp, 18-month matured cheddar with nutty savory complexity' });
      await IngredientModel.create({ name: 'Creamy Gorgonzola Dolce', category: 'cheese', price: 130, quantity: 25, lowStockThreshold: 8, description: 'Mild Italian blue cheese offering rich earthy creaminess' });
      await IngredientModel.create({ name: 'Fresh Whipped Ricotta', category: 'cheese', price: 100, quantity: 35, lowStockThreshold: 10, description: 'Delicate curd ricotta with lemon zest and cracked pepper' });
      await IngredientModel.create({ name: 'Smoked Provolone', category: 'cheese', price: 120, quantity: 28, lowStockThreshold: 8, description: 'Naturally applewood-smoked semi-hard cheese with deep depth' });
      await IngredientModel.create({ name: 'Vegan Cashew Cheese', category: 'cheese', price: 140, quantity: 8, lowStockThreshold: 10, description: 'Plant-based cultured artisan cashew cheese with golden melt' });

      // Vegetables
      await IngredientModel.create({ name: 'Fresh Genovese Basil', category: 'veggie', price: 35, quantity: 75, lowStockThreshold: 15, description: 'Picked daily sweet aromatic Italian basil leaves' });
      await IngredientModel.create({ name: 'Charred Bell Peppers', category: 'veggie', price: 45, quantity: 50, lowStockThreshold: 10, description: 'Fire-roasted sweet red and yellow bell pepper strips' });
      await IngredientModel.create({ name: 'Caramelized Sweet Onions', category: 'veggie', price: 40, quantity: 45, lowStockThreshold: 10, description: 'Balsamic-glazed slow cooked Vidalia onions' });
      await IngredientModel.create({ name: 'Kalamata Black Olives', category: 'veggie', price: 55, quantity: 40, lowStockThreshold: 10, description: 'Plump pitted sun-cured Greek Kalamata olives' });
      await IngredientModel.create({ name: 'Sun-Ripened Cherry Tomatoes', category: 'veggie', price: 45, quantity: 55, lowStockThreshold: 12, description: 'Blistered sweet cherry tomatoes seasoned with sea salt' });
      await IngredientModel.create({ name: 'Wild Porcini Mushrooms', category: 'veggie', price: 70, quantity: 30, lowStockThreshold: 8, description: 'Pan-seared forest porcini and cremini with fresh thyme' });
      await IngredientModel.create({ name: 'Pickled Jalapeños', category: 'veggie', price: 40, quantity: 40, lowStockThreshold: 10, description: 'House-cured tangy chili slices with crisp bite' });
      await IngredientModel.create({ name: 'Confit Garlic Cloves', category: 'veggie', price: 45, quantity: 35, lowStockThreshold: 10, description: 'Slow-poached whole garlic cloves in rosemary olive oil' });
      await IngredientModel.create({ name: 'Baby Spinach Leaves', category: 'veggie', price: 35, quantity: 40, lowStockThreshold: 10, description: 'Tender organic spinach leaves wilted on the stone hearth' });

      console.log('[SEED] All 25 artisanal ingredients created.');
    }

    // 3. Seed Preset Pizzas
    const pizzas = await PizzaMenuModel.find();
    if (pizzas.length === 0) {
      console.log('[SEED] Seeding curated pizzas...');
      await PizzaMenuModel.create({
        name: 'Artisanal Margherita Supreme',
        description: 'San Marzano D.O.P. tomatoes, hand-torn fior di latte mozzarella, fragrant Genovese basil, cold-pressed olive oil.',
        category: 'classic',
        basePrice: 449,
        image: '/src/assets/images/pizza_margherita_classic_1792929165993.jpg',
        defaultIngredients: {
          baseName: 'Neapolitan Hand-Tossed',
          sauceName: 'San Marzano Tomato',
          cheeseName: 'Fior di Latte Mozzarella',
          veggieNames: ['Fresh Genovese Basil']
        }
      });

      await PizzaMenuModel.create({
        name: 'Crispy Pepperoni Rustica',
        description: 'Cupped beef & herb pepperoni, spicy arrabbiata tomato reduction, bubbling mozzarella, oregano drizzle.',
        category: 'specialty',
        basePrice: 549,
        image: '/src/assets/images/pizza_pepperoni_crisp_1792929166080.jpg',
        defaultIngredients: {
          baseName: 'Thin Crust Sourdough',
          sauceName: 'Spicy Arrabbiata',
          cheeseName: 'Fior di Latte Mozzarella',
          veggieNames: []
        }
      });

      await PizzaMenuModel.create({
        name: 'Truffle Wild Forest Mushroom',
        description: 'Wild porcini & cremini mushrooms, slow-simmered garlic alfredo, aged fontina and parmigiano, black truffle essence.',
        category: 'gourmet',
        basePrice: 599,
        image: '/src/assets/images/pizza_truffle_mushroom_1792929166677.jpg',
        defaultIngredients: {
          baseName: 'Thin Crust Sourdough',
          sauceName: 'Creamy Garlic Alfredo',
          cheeseName: 'Smoked Provolone',
          veggieNames: ['Wild Porcini Mushrooms', 'Confit Garlic Cloves']
        }
      });

      await PizzaMenuModel.create({
        name: 'Mediterranean Garden Harvest',
        description: 'Fire-roasted bell peppers, Kalamata olives, blistered cherry tomatoes, sweet caramelized onions, fresh basil.',
        category: 'vegetarian',
        basePrice: 499,
        image: '/src/assets/images/pizza_garden_veggie_1792929167560.jpg',
        defaultIngredients: {
          baseName: 'Neapolitan Hand-Tossed',
          sauceName: 'San Marzano Tomato',
          cheeseName: 'Fior di Latte Mozzarella',
          veggieNames: ['Charred Bell Peppers', 'Kalamata Black Olives', 'Sun-Ripened Cherry Tomatoes', 'Caramelized Sweet Onions']
        }
      });

      await PizzaMenuModel.create({
        name: 'Wood-Fired Signature Feast',
        description: 'Double cheese blend with smoked provolone, roasted garlic confit, spicy arrabbiata, and blistered sourdough crust.',
        category: 'specialty',
        basePrice: 649,
        image: '/src/assets/images/hero_artisanal_pizza_1792929166001.jpg',
        defaultIngredients: {
          baseName: 'Thin Crust Sourdough',
          sauceName: 'Spicy Arrabbiata',
          cheeseName: 'Smoked Provolone',
          veggieNames: ['Fresh Genovese Basil', 'Confit Garlic Cloves', 'Charred Bell Peppers']
        }
      });

      console.log('[SEED] Curated pizzas created successfully.');
    }
  } catch (err) {
    console.error('[SEED] Error during initial database seeding:', err);
  }
}
