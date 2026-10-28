import React, { useEffect, useState } from 'react';
import { Sparkles, Check, ShoppingBag, ShieldCheck, AlertCircle, RefreshCw, Flame } from 'lucide-react';
import { menuApi } from '../services/api';
import { Ingredient } from '../types';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { PizzaVisualizer } from '../components/PizzaVisualizer';

export const CustomBuilderPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [bases, setBases] = useState<Ingredient[]>([]);
  const [sauces, setSauces] = useState<Ingredient[]>([]);
  const [cheeses, setCheeses] = useState<Ingredient[]>([]);
  const [veggies, setVeggies] = useState<Ingredient[]>([]);

  // Selection states
  const [selectedBase, setSelectedBase] = useState<Ingredient | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<Ingredient | null>(null);
  const [selectedCheese, setSelectedCheese] = useState<Ingredient | null>(null);
  const [selectedVeggies, setSelectedVeggies] = useState<Ingredient[]>([]);

  // Live validated backend price & state
  const [validating, setValidating] = useState(false);
  const [backendValidatedPrice, setBackendValidatedPrice] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const data = await menuApi.getIngredients();
      setBases(data.bases);
      setSauces(data.sauces);
      setCheeses(data.cheeses);
      setVeggies(data.veggies);

      // Set sensible defaults if in stock
      const defaultB = data.bases.find(b => b.quantity > 0) || data.bases[0];
      const defaultS = data.sauces.find(s => s.quantity > 0) || data.sauces[0];
      const defaultC = data.cheeses.find(c => c.quantity > 0) || data.cheeses[0];

      if (defaultB) setSelectedBase(defaultB);
      if (defaultS) setSelectedSauce(defaultS);
      if (defaultC) setSelectedCheese(defaultC);
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Revalidate with backend whenever selections change
  useEffect(() => {
    if (selectedBase && selectedSauce && selectedCheese) {
      validateWithBackend();
    }
  }, [selectedBase, selectedSauce, selectedCheese, selectedVeggies]);

  const validateWithBackend = async () => {
    if (!selectedBase || !selectedSauce || !selectedCheese) return;
    setValidating(true);
    setValidationError(null);
    try {
      const res = await menuApi.validateCustomPizza({
        baseId: selectedBase.id || selectedBase._id!,
        sauceId: selectedSauce.id || selectedSauce._id!,
        cheeseId: selectedCheese.id || selectedCheese._id!,
        veggieIds: selectedVeggies.map(v => v.id || v._id!)
      });
      if (res.success) {
        setBackendValidatedPrice(res.price);
      } else {
        setValidationError(res.message);
      }
    } catch (err: any) {
      setValidationError(err.response?.data?.message || 'Failed to validate pizza combination.');
    } finally {
      setValidating(false);
    }
  };

  const toggleVeggie = (veggie: Ingredient) => {
    if (selectedVeggies.some(v => (v.id || v._id) === (veggie.id || veggie._id))) {
      setSelectedVeggies(prev => prev.filter(v => (v.id || v._id) !== (veggie.id || veggie._id)));
    } else {
      setSelectedVeggies(prev => [...prev, veggie]);
    }
  };

  // Local fallback sum
  const clientCalculatedPrice =
    (selectedBase?.price || 0) +
    (selectedSauce?.price || 0) +
    (selectedCheese?.price || 0) +
    selectedVeggies.reduce((sum, v) => sum + v.price, 0);

  const displayPrice = backendValidatedPrice !== null ? backendValidatedPrice : clientCalculatedPrice;

  const handleAddCustomToCart = () => {
    if (!selectedBase || !selectedSauce || !selectedCheese) return;

    addToCart({
      name: `Custom ${selectedBase.name.split(' ')[0]} Pie`,
      isCustom: true,
      quantity: 1,
      unitPrice: displayPrice,
      ingredients: {
        base: { id: selectedBase.id || selectedBase._id!, name: selectedBase.name, price: selectedBase.price },
        sauce: { id: selectedSauce.id || selectedSauce._id!, name: selectedSauce.name, price: selectedSauce.price },
        cheese: { id: selectedCheese.id || selectedCheese._id!, name: selectedCheese.name, price: selectedCheese.price },
        veggies: selectedVeggies.map(v => ({ id: v.id || v._id!, name: v.name, price: v.price }))
      }
    });

    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#E23722] animate-spin mx-auto" />
        <p className="text-sm text-stone-500">Loading hearth ingredients and live stock status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="max-w-3xl mb-10">
        <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Interactive Hearth Lab</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#242424] mt-1">
          Custom Pizza Builder
        </h1>
        <p className="text-stone-600 text-sm mt-2">
          Design your personalized pizza from scratch. Every ingredient is real-time inventory tracked and server-side price verified.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Ingredient Selectors (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Step 1: 5 Bases */}
          <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-[#242424]">1. Select Your Crust (5 Bases)</h3>
                <p className="text-xs text-stone-500">Fermentation profiles and stone-baked textures</p>
              </div>
              <span className="text-xs font-semibold text-stone-600">Select One</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bases.map((base) => {
                const isSelected = (selectedBase?.id || selectedBase?._id) === (base.id || base._id);
                const isOutOfStock = base.quantity <= 0;
                const isLowStock = base.quantity > 0 && base.quantity <= base.lowStockThreshold;

                return (
                  <button
                    key={base.id || base._id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedBase(base)}
                    className={`p-3.5 rounded-lg border text-left transition-all relative ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200'
                        : isSelected
                        ? 'border-[#E23722] bg-[#FAF7F2] ring-1 ring-[#E23722]'
                        : 'border-[#EFEAE4] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#242424]">{base.name}</span>
                      <span className="font-mono-data text-xs font-bold text-[#242424]">₹{base.price}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{base.description}</p>
                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-stone-100">
                      <span className={`font-mono-data ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-[#E06A26]' : 'text-stone-400'}`}>
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${base.quantity} left)` : `${base.quantity} in stock`}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#E23722]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: 5 Sauces */}
          <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-[#242424]">2. Select Your Sauce (5 Sauces)</h3>
                <p className="text-xs text-stone-500">Slow-simmered reductions and fresh pestos</p>
              </div>
              <span className="text-xs font-semibold text-stone-600">Select One</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sauces.map((sauce) => {
                const isSelected = (selectedSauce?.id || selectedSauce?._id) === (sauce.id || sauce._id);
                const isOutOfStock = sauce.quantity <= 0;
                const isLowStock = sauce.quantity > 0 && sauce.quantity <= sauce.lowStockThreshold;

                return (
                  <button
                    key={sauce.id || sauce._id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSauce(sauce)}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200'
                        : isSelected
                        ? 'border-[#E23722] bg-[#FAF7F2] ring-1 ring-[#E23722]'
                        : 'border-[#EFEAE4] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#242424]">{sauce.name}</span>
                      <span className="font-mono-data text-xs font-bold text-[#242424]">₹{sauce.price}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{sauce.description}</p>
                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-stone-100">
                      <span className={`font-mono-data ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-[#E06A26]' : 'text-stone-400'}`}>
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${sauce.quantity} left)` : `${sauce.quantity} in stock`}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#E23722]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Cheese Varieties */}
          <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-[#242424]">3. Select Cheese Variety</h3>
                <p className="text-xs text-stone-500">Fresh artisanal mozzarella, sharp cheddars & plant-based options</p>
              </div>
              <span className="text-xs font-semibold text-stone-600">Select One</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cheeses.map((cheese) => {
                const isSelected = (selectedCheese?.id || selectedCheese?._id) === (cheese.id || cheese._id);
                const isOutOfStock = cheese.quantity <= 0;
                const isLowStock = cheese.quantity > 0 && cheese.quantity <= cheese.lowStockThreshold;

                return (
                  <button
                    key={cheese.id || cheese._id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedCheese(cheese)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200'
                        : isSelected
                        ? 'border-[#E23722] bg-[#FAF7F2] ring-1 ring-[#E23722]'
                        : 'border-[#EFEAE4] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-[#242424] truncate">{cheese.name}</span>
                      <span className="font-mono-data text-xs font-bold text-[#242424]">₹{cheese.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-stone-100">
                      <span className={`font-mono-data ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-[#E06A26]' : 'text-stone-400'}`}>
                        {isOutOfStock ? 'Out' : `${cheese.quantity} left`}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#E23722]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Multiple Vegetables */}
          <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-[#242424]">4. Select Farm Vegetables</h3>
                <p className="text-xs text-stone-500">Pick any number of blistered and fresh organic toppings</p>
              </div>
              <span className="text-xs font-semibold text-stone-600 font-mono-data">
                {selectedVeggies.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {veggies.map((veggie) => {
                const isSelected = selectedVeggies.some(v => (v.id || v._id) === (veggie.id || veggie._id));
                const isOutOfStock = veggie.quantity <= 0;
                const isLowStock = veggie.quantity > 0 && veggie.quantity <= veggie.lowStockThreshold;

                return (
                  <button
                    key={veggie.id || veggie._id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => toggleVeggie(veggie)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200'
                        : isSelected
                        ? 'border-[#E23722] bg-[#FAF7F2] ring-1 ring-[#E23722]'
                        : 'border-[#EFEAE4] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-[#242424] truncate">{veggie.name}</span>
                      <span className="font-mono-data text-xs font-bold text-[#242424]">+₹{veggie.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-stone-100">
                      <span className={`font-mono-data ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-[#E06A26]' : 'text-stone-400'}`}>
                        {isOutOfStock ? 'Out of Stock' : `${veggie.quantity} in stock`}
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#E23722]" />
                      ) : (
                        <span className="text-stone-400 text-xs">+</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Calculation & Sticky Order Summary (4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-[#EFEAE4] p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-[#EFEAE4] pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-[#242424]">Live Hearth Preview</h3>
                <span className="text-[11px] text-stone-500 font-medium">Bespoke Artisan Configurator</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#E23722]/10 text-[#E23722] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>

            {/* Interactive Visual Pizza Canvas */}
            <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#EFEAE4] flex flex-col items-center">
              <PizzaVisualizer
                base={selectedBase}
                sauce={selectedSauce}
                cheese={selectedCheese}
                veggies={selectedVeggies}
              />
              <div className="text-[11px] text-stone-500 font-medium text-center mt-1">
                {selectedBase?.name} · {selectedSauce?.name}
              </div>
            </div>

            {/* Selected Components Itemized */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-700">
                <span>Crust: {selectedBase ? selectedBase.name : 'None selected'}</span>
                <span className="font-mono-data font-semibold">₹{selectedBase?.price || 0}</span>
              </div>
              <div className="flex justify-between items-center text-stone-700">
                <span>Sauce: {selectedSauce ? selectedSauce.name : 'None selected'}</span>
                <span className="font-mono-data font-semibold">₹{selectedSauce?.price || 0}</span>
              </div>
              <div className="flex justify-between items-center text-stone-700">
                <span>Cheese: {selectedCheese ? selectedCheese.name : 'None selected'}</span>
                <span className="font-mono-data font-semibold">₹{selectedCheese?.price || 0}</span>
              </div>

              {selectedVeggies.length > 0 && (
                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="text-[11px] font-semibold text-stone-500">Selected Vegetables:</div>
                  {selectedVeggies.map((v) => (
                    <div key={v.id || v._id} className="flex justify-between items-center text-stone-600 pl-2">
                      <span>+ {v.name}</span>
                      <span className="font-mono-data">₹{v.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation Notice */}
            {validationError ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Backend pricing & inventory validated</span>
              </div>
            )}

            {/* Dynamic Total */}
            <div className="pt-4 border-t border-[#EFEAE4] flex items-baseline justify-between">
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Custom Total</span>
                <div className="text-[11px] text-stone-400">Exclusive of GST & Delivery</div>
              </div>
              <div className="text-3xl font-display font-bold text-[#242424] font-mono-data">
                {validating ? (
                  <span className="text-sm font-sans text-stone-400 animate-pulse">Calculating...</span>
                ) : (
                  `₹${displayPrice}`
                )}
              </div>
            </div>

            <button
              onClick={handleAddCustomToCart}
              disabled={validating || !!validationError || !selectedBase || !selectedSauce || !selectedCheese}
              className="w-full py-3.5 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Custom Pizza to Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
