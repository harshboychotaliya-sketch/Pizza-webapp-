import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Plus, ArrowRight, Pizza } from 'lucide-react';
import { menuApi } from '../services/api';
import { PizzaMenuItem } from '../types';
import { useCart } from '../context/CartContext';

export const MenuPage: React.FC = () => {
  const [pizzas, setPizzas] = useState<PizzaMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { addToCart } = useCart();

  useEffect(() => {
    menuApi.getMenu()
      .then((data) => setPizzas(data))
      .catch((err) => console.error('Failed to load menu:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPizzas = pizzas.filter((pizza) => {
    const matchesCategory = activeCategory === 'all' || pizza.category === activeCategory;
    const matchesSearch =
      pizza.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pizza.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQuickAdd = (pizza: PizzaMenuItem) => {
    addToCart({
      pizzaId: pizza.id || pizza._id,
      name: pizza.name,
      isCustom: false,
      quantity: 1,
      unitPrice: pizza.basePrice,
      ingredients: {
        base: { id: 'b1', name: pizza.defaultIngredients.baseName, price: 140 },
        sauce: { id: 's1', name: pizza.defaultIngredients.sauceName, price: 60 },
        cheese: { id: 'c1', name: pizza.defaultIngredients.cheeseName, price: 90 },
        veggies: pizza.defaultIngredients.veggieNames.map((v, i) => ({ id: `v_${i}`, name: v, price: 40 }))
      },
      image: pizza.image
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Title & Custom Pizza Callout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EFEAE4]">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Artisan Bakery</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#242424] mt-1">Our Pizzeria Menu</h1>
          <p className="text-stone-500 text-sm mt-1">Stone-baked pizzas crafted with slow fermented sourdough and imported D.O.P. provisions.</p>
        </div>

        {/* Custom pizza builder callout banner */}
        <Link
          to="/builder"
          className="bg-gradient-to-r from-[#242424] to-stone-800 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-4 group shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E23722] text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-amber-200">Want Something Unique?</div>
              <div className="text-sm font-bold font-display">Build Your Custom Pizza</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs (Segmented functional buttons) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EFEAE4] rounded-lg w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Pies' },
            { id: 'classic', label: 'Classic' },
            { id: 'specialty', label: 'Specialty' },
            { id: 'vegetarian', label: 'Vegetarian' },
            { id: 'gourmet', label: 'Gourmet' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-white text-[#242424] shadow-xs'
                  : 'text-stone-600 hover:text-black'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredients, crusts..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#E23722] transition-shadow text-[#242424]"
          />
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[#EFEAE4] animate-pulse space-y-3">
              <div className="h-44 bg-stone-200 rounded-lg" />
              <div className="h-5 bg-stone-200 rounded w-2/3" />
              <div className="h-4 bg-stone-100 rounded w-full" />
              <div className="h-9 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredPizzas.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#EFEAE4] p-12 text-center space-y-3">
          <Pizza className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-semibold text-stone-800">No matching pizzas found</h3>
          <p className="text-xs text-stone-500">Try adjusting your category filter or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPizzas.map((pizza) => {
            const isVeg = pizza.category === 'vegetarian' || !pizza.name.toLowerCase().includes('pepperoni');
            return (
              <div
                key={pizza.id || pizza._id}
                className="bg-white rounded-2xl border border-[#EFEAE4] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[#242424] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs capitalize flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-[#E23722]'}`} />
                    <span>{pizza.category}</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    900°F Hearth
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display font-bold text-lg text-[#242424] group-hover:text-[#E23722] transition-colors leading-snug">
                        {pizza.name}
                      </h3>
                      <span className="font-mono-data font-bold text-lg text-[#242424] shrink-0">
                        ₹{pizza.basePrice}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {pizza.description}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-stone-100 space-y-1 text-[11px] text-stone-500">
                      <div><strong className="text-stone-700">Crust:</strong> {pizza.defaultIngredients.baseName}</div>
                      <div><strong className="text-stone-700">Sauce & Melt:</strong> {pizza.defaultIngredients.sauceName} · {pizza.defaultIngredients.cheeseName}</div>
                      {pizza.defaultIngredients.veggieNames.length > 0 && (
                        <div><strong className="text-stone-700">Toppings:</strong> {pizza.defaultIngredients.veggieNames.join(', ')}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      onClick={() => handleQuickAdd(pizza)}
                      className="py-2.5 px-3 bg-[#E23722] hover:bg-[#C02613] text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Quick Add</span>
                    </button>
                    <Link
                      to="/builder"
                      className="py-2.5 px-3 bg-[#FAF7F2] hover:bg-[#F3EFE9] border border-[#EFEAE4] text-stone-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center text-center cursor-pointer"
                    >
                      <span>Customize</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
