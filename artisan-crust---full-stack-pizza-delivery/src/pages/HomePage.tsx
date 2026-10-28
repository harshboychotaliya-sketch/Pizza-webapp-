import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Flame,
  Clock,
  Award,
  CheckCircle,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Shield,
  Star,
  Plus,
  Check,
  RotateCcw,
  Utensils,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Zap,
  Thermometer,
  Layers,
  Heart,
  Truck
} from 'lucide-react';
import { menuApi } from '../services/api';
import { PizzaMenuItem, Ingredient } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { PizzaVisualizer } from '../components/PizzaVisualizer';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cart, subtotal, setIsCartDrawerOpen, itemCount } = useCart();

  // Scroll Progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Menu and Ingredients State
  const [menuItems, setMenuItems] = useState<PizzaMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Oven Temperature Interactive Simulation
  const [ovenTemp, setOvenTemp] = useState<number>(900);

  // Interactive Mini Pizza Studio on Landing Page
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [selectedBase, setSelectedBase] = useState<Ingredient | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<Ingredient | null>(null);
  const [selectedCheese, setSelectedCheese] = useState<Ingredient | null>(null);
  const [selectedVeggies, setSelectedVeggies] = useState<Ingredient[]>([]);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Show floating quick-order dock when scrolling
  const [showFloatingDock, setShowFloatingDock] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowFloatingDock(true);
      } else {
        setShowFloatingDock(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      menuApi.getMenu(),
      menuApi.getIngredients()
    ])
      .then(([menuData, ingredientsResp]) => {
        setMenuItems(menuData);
        const allIngs = ingredientsResp.all || [];
        setAvailableIngredients(allIngs);

        // Pre-select defaults for landing page visualizer
        const defaultBase = allIngs.find((i: Ingredient) => i.category === 'base' && i.isAvailable) || null;
        const defaultSauce = allIngs.find((i: Ingredient) => i.category === 'sauce' && i.isAvailable) || null;
        const defaultCheese = allIngs.find((i: Ingredient) => i.category === 'cheese' && i.isAvailable) || null;
        const defaultVeggies = allIngs.filter((i: Ingredient) => i.category === 'veggie' && i.isAvailable).slice(0, 2);

        setSelectedBase(defaultBase);
        setSelectedSauce(defaultSauce);
        setSelectedCheese(defaultCheese);
        setSelectedVeggies(defaultVeggies);
      })
      .catch((err) => console.error('Failed to load menu or ingredients:', err))
      .finally(() => setLoading(false));
  }, []);

  // Quick Add pre-curated pizza to cart
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

    setAddedAnimationId(pizza.id || pizza._id || null);
    setTimeout(() => setAddedAnimationId(null), 1800);
  };

  // Add custom pizza from landing page studio
  const handleAddCustomFromStudio = () => {
    if (!selectedBase || !selectedSauce || !selectedCheese) return;

    const customPrice =
      selectedBase.price +
      selectedSauce.price +
      selectedCheese.price +
      selectedVeggies.reduce((sum, v) => sum + v.price, 0);

    addToCart({
      name: `Custom ${selectedBase.name.replace('Crust', '').trim()} Hearth Pie`,
      isCustom: true,
      quantity: 1,
      unitPrice: customPrice,
      ingredients: {
        base: { id: selectedBase.id || selectedBase._id!, name: selectedBase.name, price: selectedBase.price },
        sauce: { id: selectedSauce.id || selectedSauce._id!, name: selectedSauce.name, price: selectedSauce.price },
        cheese: { id: selectedCheese.id || selectedCheese._id!, name: selectedCheese.name, price: selectedCheese.price },
        veggies: selectedVeggies.map(v => ({ id: v.id || v._id!, name: v.name, price: v.price }))
      }
    });

    setIsCartDrawerOpen(true);
  };

  const toggleStudioVeggie = (veggie: Ingredient) => {
    if (selectedVeggies.some(v => (v.id || v._id) === (veggie.id || veggie._id))) {
      setSelectedVeggies(selectedVeggies.filter(v => (v.id || v._id) !== (veggie.id || veggie._id)));
    } else {
      if (selectedVeggies.length < 4) {
        setSelectedVeggies([...selectedVeggies, veggie]);
      }
    }
  };

  // Studio calculated total
  const studioTotal =
    (selectedBase?.price || 0) +
    (selectedSauce?.price || 0) +
    (selectedCheese?.price || 0) +
    selectedVeggies.reduce((acc, v) => acc + v.price, 0);

  // Filtered menu
  const filteredPizzas = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(p => p.category === selectedCategory);

  const actualUserEmail = 'chotaliyaharshstudy@gmail.com';
  const actualUserName = 'Harsh Chotaliya';

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden selection:bg-[#E23722] selection:text-white">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E23722] via-[#E06A26] to-[#E23722] z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Top Hearth Ribbon */}
      <div className="bg-[#FAF2EA] border-b border-[#EADCCF] text-xs py-2 px-4 text-[#8C4B1C] font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E23722] animate-ping" />
            <span>900°F Stone Hearth Fired · 72-Hour Fermented Caputo 00 Sourdough</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-stone-600">
            <span>Free Express Delivery on ₹500+</span>
            <span>·</span>
            <span>Razorpay Test Verified</span>
            <span>·</span>
            <span className="text-[#E23722] font-semibold">Ready in 30 Mins</span>
          </div>
        </div>
      </div>

      {/* 1. HERO SECTION WITH RICH SCROLLING MOTIONS & ARTISANAL ATMOSPHERE */}
      <section className="relative max-w-7xl mx-auto px-6 pt-8 md:pt-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-[#8C4B1C]">
              <Flame className="w-3.5 h-3.5 text-[#E23722]" />
              <span>Volcanic Stone Hearth · Blistered Daily in Indiranagar</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-[#242424] leading-[1.08] tracking-tight">
              Artisanal Wood-Fired Pizza, <span className="text-[#E23722] italic font-serif">Handcrafted</span> for Perfection.
            </h1>

            <p className="text-stone-600 text-base sm:text-lg leading-relaxed max-w-xl">
              San Marzano D.O.P. tomatoes, hand-stretched fior di latte, and blistered crusts baked in authentic 900°F stone hearths. Delivered piping hot to your table.
            </p>

            {/* Dynamic CTA Cluster: Order Now or Sign in with Google */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {user ? (
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#order-deck"
                    className="px-6 py-3.5 bg-[#E23722] hover:bg-[#C02613] text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Now (Welcome, {user.name.split(' ')[0]}!)</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <Link
                    to="/builder"
                    className="px-6 py-3.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#E06A26]" />
                    <span>Open Custom Pizza Studio</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <a
                    href="#google-station"
                    className="px-6 py-3.5 bg-[#E23722] hover:bg-[#C02613] text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <span>Order Wood-Fired Pizza</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <Link
                    to="/menu"
                    className="px-6 py-3.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explore Menu</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Proof Points */}
            <div className="pt-6 border-t border-[#EFEAE4] grid grid-cols-3 gap-4 text-xs text-stone-600 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Non-GMO Flour</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-700 shrink-0" />
                <span>30-Min Fast Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E06A26] shrink-0" />
                <span>Razorpay Test Verified</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Right: Interactive 3D Pizza Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#EFEAE4] aspect-[4/3] bg-stone-900 group">
              <img
                src="/src/assets/images/hero_artisanal_pizza_1792929166001.jpg"
                alt="Artisanal wood-fired sourdough pizza with blistered crust and fresh mozzarella"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

              {/* Floating Verified Rating Badge */}
              <motion.div
                whileHover={{ y: -3 }}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-stone-200 flex items-center gap-1.5 text-xs font-semibold text-stone-800"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>4.9</span>
                <span className="text-stone-400 font-normal">· 1,420+ Reviews</span>
              </motion.div>

              {/* Floating 900°F Hearth Seal */}
              <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-[#E23722]" />
                <span>900°F Wood-Fired</span>
              </div>

              {/* Bottom Card Title and Quick Order Trigger */}
              <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">Signature Special</div>
                  <div className="text-xl font-bold font-display mt-0.5">Wood-Fired Margherita D.O.P.</div>
                  <div className="text-xs text-stone-300 font-mono-data mt-0.5">₹449 · San Marzano & Fior di Latte</div>
                </div>

                <button
                  onClick={() => {
                    const margherita = menuItems.find(m => m.name.toLowerCase().includes('margherita')) || menuItems[0];
                    if (margherita) handleQuickAdd(margherita);
                  }}
                  className="px-3.5 py-2 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick Add</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. GOOGLE LOGIN STATION THEN SHOWS TO ORDER (CORE REQUIREMENT) */}
      <section id="google-station" className="max-w-7xl mx-auto px-6 py-6 scroll-mt-20">
        <AnimatePresence mode="wait">
          {!user ? (
            /* STATE A: NOT LOGGED IN -> SHOWS GOOGLE LOGIN WITH ACTUAL USER EMAIL */
            <motion.div
              key="google-login-prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-8 text-white shadow-xl border border-stone-700 overflow-hidden relative"
            >
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#E23722]/15 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#E06A26]/15 blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-amber-300 border border-white/15">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instant Google One-Click Order Access</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                    Sign in with Google to Unlock Artisanal Ordering & 15% Welcome Discount
                  </h2>

                  <p className="text-stone-300 text-sm leading-relaxed max-w-lg">
                    Log in seamlessly with your Google credentials to customize your 72-hour sourdough crust, track your kitchen dispatch in real time, and check out with Razorpay test mode.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 pt-2">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> Instant Account Verification
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> No Password Needed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> Live Kitchen Telemetry
                    </span>
                  </div>
                </div>

                {/* Google Sign In Card Component with Actual User Email */}
                <div className="lg:col-span-5">
                  <GoogleSignInButton
                    variant="card"
                    className="shadow-2xl"
                    onSuccess={() => {
                      const el = document.getElementById('order-deck');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            /* STATE B: LOGGED IN -> THEN SHOWS TO ORDER (PERSONALIZED COMMAND DECK) */
            <motion.div
              id="order-deck"
              key="order-command-deck"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header with Active User Email chotaliyaharshstudy@gmail.com */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E23722] text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-display font-bold text-[#242424]">
                        Welcome back, {user.name}!
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                        <Check className="w-3 h-3 text-emerald-600" /> Google Verified
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 font-mono-data mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-stone-700">{user.email}</span>
                      <span>·</span>
                      <span>Ready to fire up your hearth order</span>
                    </div>
                  </div>
                </div>

                {/* Quick Re-Order / Track Active Order Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to="/orders"
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>My Past Orders</span>
                  </Link>

                  <Link
                    to="/track"
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Track Active Order</span>
                  </Link>
                </div>
              </div>

              {/* Express Ordering Options Grid ("Shows to Order") */}
              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#E23722] mb-1">
                    Direct Order Hub
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">
                    What would you like from the 900°F Hearth today?
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1: Build Custom Pizza */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-[#FAF7F2] p-5 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-4 hover:border-[#E23722] transition-colors"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#E23722]/10 text-[#E23722] flex items-center justify-center mb-3">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base text-stone-900">Build Your Custom Pie</h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Select your 72-hour sourdough base, sauce, cheese, and vegetables with dynamic price calculations.
                      </p>
                    </div>

                    <Link
                      to="/builder"
                      className="w-full py-2.5 px-4 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-xl text-center shadow-xs transition-colors"
                    >
                      Open Custom Pizza Builder →
                    </Link>
                  </motion.div>

                  {/* Option 2: Order Today's Best Seller */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-[#FAF7F2] p-5 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-4 hover:border-[#E23722] transition-colors"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#E06A26]/10 text-[#E06A26] flex items-center justify-center mb-3">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-stone-900">Wood-Fired Margherita</h4>
                        <span className="font-mono-data font-bold text-sm text-[#242424]">₹449</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        San Marzano D.O.P. tomatoes, fresh buffalo mozzarella, and fresh basil leaves.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const m = menuItems.find(p => p.name.toLowerCase().includes('margherita')) || menuItems[0];
                        if (m) handleQuickAdd(m);
                      }}
                      className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl text-center shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>1-Click Add to Order</span>
                    </button>
                  </motion.div>

                  {/* Option 3: Chef's Gourmet Special */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-[#FAF7F2] p-5 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-4 hover:border-[#E23722] transition-colors"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-700/10 text-emerald-700 flex items-center justify-center mb-3">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-stone-900">Truffle Forest Mushroom</h4>
                        <span className="font-mono-data font-bold text-sm text-[#242424]">₹599</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Creamy truffle alfredo base, wild porcini mushrooms, fior di latte, and micro thyme.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const t = menuItems.find(p => p.name.toLowerCase().includes('truffle')) || menuItems[1];
                        if (t) handleQuickAdd(t);
                      }}
                      className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl text-center shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>1-Click Add to Order</span>
                    </button>
                  </motion.div>
                </div>

                {/* Live Order Drawer Summary if Items in Cart */}
                {cart.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E23722] text-white flex items-center justify-center font-bold text-xs">
                        {itemCount}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your active hearth order
                        </div>
                        <div className="text-xs text-stone-600 font-mono-data">
                          Subtotal: ₹{subtotal} · Free delivery eligible
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setIsCartDrawerOpen(true)}
                        className="flex-1 sm:flex-none py-2 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Review Cart
                      </button>
                      <Link
                        to="/checkout"
                        className="flex-1 sm:flex-none py-2 px-5 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Checkout Now (₹{subtotal})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. SCROLLING CHAPTER: 72-HOUR SOURDOUGH FERMENTATION SCIENCE */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Slow Fermentation Science</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#242424] mt-1">
            Why Our 72-Hour Sourdough Makes All the Difference
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            Most commercial pizzerias use fast industrial yeast that ferments in 2 hours. We cold-ferment our dough for 3 full days to unlock complex flavors and effortless digestion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Caputo 00 Wheat & Wild Levain',
              desc: 'Heritage Italian stone-ground wheat flour mixed with our 10-year live sourdough mother yeast culture.',
              icon: Layers
            },
            {
              step: '02',
              title: '72-Hour Controlled Cold Maturation',
              desc: 'Enzymes break down complex gluten proteins into easily digestible amino acids, creating rich honeycomb air bubbles.',
              icon: Clock
            },
            {
              step: '03',
              title: 'Gentle Hand-Slap Stretching',
              desc: 'Pushed outward by hand without rolling pins to gently coax trapped air into the cornicione rim.',
              icon: Utensils
            },
            {
              step: '04',
              title: '900°F Volcanic Flash Bake',
              desc: 'Stone oven fires at 900 degrees for 90 seconds, flash-locking steam for a crisp leopard-spotted shell.',
              icon: Flame
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-data text-2xl font-bold text-stone-300 group-hover:text-[#E23722] transition-colors">
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#E23722] flex items-center justify-center border border-stone-100 group-hover:bg-[#E23722] group-hover:text-white transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-[#E23722] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. SCROLLING CHAPTER: 900°F WOOD-FIRED HEARTH INTERACTIVE SIMULATION */}
      <section className="bg-stone-900 text-white py-16 my-8 relative overflow-hidden border-y border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(226,55,34,0.15),transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E23722]/20 border border-[#E23722]/40 rounded-full text-xs font-semibold text-[#E23722]">
                <Thermometer className="w-3.5 h-3.5" />
                <span>Stone Hearth Temperature Simulation</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight">
                Feel the Heat: Why 900°F Outperforms Standard 500°F Kitchen Ovens
              </h2>

              <p className="text-stone-300 text-sm leading-relaxed">
                Click different temperatures below to see how heat transformation affects the crust blister, cheese stretch, and baking speed.
              </p>

              {/* Temperature Selector Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { temp: 500, label: 'Standard Home Oven', time: '15 Mins' },
                  { temp: 750, label: 'Commercial Deck', time: '6 Mins' },
                  { temp: 900, label: 'Artisan Stone Hearth', time: '90 Secs' }
                ].map((t) => (
                  <button
                    key={t.temp}
                    onClick={() => setOvenTemp(t.temp)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      ovenTemp === t.temp
                        ? 'bg-[#E23722] border-[#E23722] text-white shadow-lg shadow-[#E23722]/30'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-white hover:border-stone-500'
                    }`}
                  >
                    <div className="font-mono-data font-bold text-lg">{t.temp}°F</div>
                    <div className="text-[11px] font-medium truncate">{t.label}</div>
                    <div className="text-[10px] opacity-80 mt-1">{t.time} Bake</div>
                  </button>
                ))}
              </div>

              {/* Dynamic Temperature Outcome Narrative */}
              <div className="p-4 bg-stone-800/90 rounded-2xl border border-stone-700 text-xs space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#E23722]" />
                  <span>
                    {ovenTemp === 900
                      ? 'The Sweet Spot: Authentic Neapolitan Blister (90 Seconds)'
                      : ovenTemp === 750
                      ? 'Moderate Rise: Standard Restaurant Pizza'
                      : 'Home Baking: Dense crumb, dry cheese, pale crust'}
                  </span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  {ovenTemp === 900
                    ? 'At 900°F, trapped water vapor violently expands before the crust hardens, creating leopard-spotted char, molten cheese that retains its moisture, and an airy, cloud-like interior.'
                    : ovenTemp === 750
                    ? 'Good caramelization, but the extended 6-minute bake causes moisture to evaporate, yielding a chewier, firmer rim.'
                    : '15 minutes in a dry 500°F oven dehydrates the dough, leaving you with a biscuity crust and browned, oily cheese.'}
                </p>
              </div>
            </div>

            {/* Hearth Visual Display with glowing heat */}
            <div className="lg:col-span-6 flex justify-center">
              <motion.div
                animate={{
                  boxShadow:
                    ovenTemp === 900
                      ? '0 0 60px rgba(226, 55, 34, 0.45)'
                      : ovenTemp === 750
                      ? '0 0 35px rgba(224, 106, 38, 0.3)'
                      : '0 0 15px rgba(255, 255, 255, 0.1)'
                }}
                className="relative w-full max-w-md aspect-square rounded-3xl bg-black border-2 border-stone-700 p-6 flex flex-col items-center justify-center overflow-hidden"
              >
                {/* Glowing Embers Effect */}
                <div
                  className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
                    ovenTemp === 900 ? 'opacity-40 bg-[radial-gradient(circle,rgba(226,55,34,0.6)_0%,transparent_70%)]' : 'opacity-10'
                  }`}
                />

                <div className="relative z-10 text-center space-y-3">
                  <Flame
                    className={`w-16 h-16 mx-auto transition-transform duration-500 ${
                      ovenTemp === 900 ? 'text-[#E23722] scale-125 animate-pulse' : 'text-amber-500 scale-100'
                    }`}
                  />
                  <div className="font-mono-data text-5xl font-bold tracking-tight text-white">
                    {ovenTemp}°F
                  </div>
                  <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
                    {ovenTemp === 900 ? 'Volcanic Hearth Chamber' : 'Baking Chamber'}
                  </div>
                  <div className="text-xs text-stone-400 font-mono-data">
                    {ovenTemp === 900 ? 'Flash Bake: 90 Seconds' : ovenTemp === 750 ? 'Bake: 6 Minutes' : 'Bake: 15 Minutes'}
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Link
                    to="/builder"
                    className="px-5 py-2.5 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fire Up Your Custom Pizza at 900°F</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE MINI PIZZA STUDIO ON LANDING PAGE */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#EFEAE4]">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Interactive Hearth Studio</span>
            <h2 className="text-3xl font-display font-bold text-[#242424] mt-1">Design Your Custom Pizza Right Here</h2>
            <p className="text-stone-500 text-sm mt-1">
              Select your crust, sauce, cheese, and farm-fresh toppings to watch the live hearth visualizer update instantly.
            </p>
          </div>

          <Link
            to="/builder"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#E23722] hover:text-[#C02613] transition-colors whitespace-nowrap"
          >
            <span>Launch Full Screen Studio</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Live SVG Pizza Visualizer Canvas (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-sm aspect-square bg-white rounded-3xl border border-stone-200/80 p-6 shadow-md flex items-center justify-center relative">
              <PizzaVisualizer
                base={selectedBase}
                sauce={selectedSauce}
                cheese={selectedCheese}
                veggies={selectedVeggies}
              />
              <div className="absolute bottom-4 left-4 right-4 bg-stone-900/80 backdrop-blur-md rounded-xl py-2 px-3 text-white flex items-center justify-between text-xs">
                <span className="truncate">{selectedBase?.name} · {selectedCheese?.name}</span>
                <span className="font-mono-data font-bold text-[#E06A26] shrink-0">₹{studioTotal}</span>
              </div>
            </div>
          </div>

          {/* Interactive Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Crust Selection */}
            <div>
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">1. Select Sourdough Base</div>
              <div className="flex flex-wrap gap-2">
                {availableIngredients
                  .filter(i => i.category === 'base' && i.isAvailable)
                  .map(base => (
                    <button
                      key={base.id || base._id}
                      onClick={() => setSelectedBase(base)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        (selectedBase?.id || selectedBase?._id) === (base.id || base._id)
                          ? 'bg-[#E23722] text-white border-[#E23722] shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span>{base.name}</span>
                      <span className="ml-1 opacity-80 font-mono-data">₹{base.price}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Sauce Selection */}
            <div>
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">2. Select Sauce</div>
              <div className="flex flex-wrap gap-2">
                {availableIngredients
                  .filter(i => i.category === 'sauce' && i.isAvailable)
                  .map(sauce => (
                    <button
                      key={sauce.id || sauce._id}
                      onClick={() => setSelectedSauce(sauce)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        (selectedSauce?.id || selectedSauce?._id) === (sauce.id || sauce._id)
                          ? 'bg-[#E23722] text-white border-[#E23722] shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span>{sauce.name}</span>
                      <span className="ml-1 opacity-80 font-mono-data">₹{sauce.price}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Cheese Selection */}
            <div>
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">3. Select Cheese</div>
              <div className="flex flex-wrap gap-2">
                {availableIngredients
                  .filter(i => i.category === 'cheese' && i.isAvailable)
                  .map(cheese => (
                    <button
                      key={cheese.id || cheese._id}
                      onClick={() => setSelectedCheese(cheese)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        (selectedCheese?.id || selectedCheese?._id) === (cheese.id || cheese._id)
                          ? 'bg-[#E23722] text-white border-[#E23722] shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span>{cheese.name}</span>
                      <span className="ml-1 opacity-80 font-mono-data">₹{cheese.price}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Veggie Toppings Multi-Select */}
            <div>
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>4. Choose Fresh Veggies (Up to 4)</span>
                <span className="text-[11px] font-normal text-stone-500 font-mono-data">{selectedVeggies.length}/4 selected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableIngredients
                  .filter(i => i.category === 'veggie' && i.isAvailable)
                  .map(veggie => {
                    const isSelected = selectedVeggies.some(v => (v.id || v._id) === (veggie.id || veggie._id));
                    return (
                      <button
                        key={veggie.id || veggie._id}
                        onClick={() => toggleStudioVeggie(veggie)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span>{veggie.name}</span>
                        <span className="ml-1 opacity-80 font-mono-data">+₹{veggie.price}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Add Custom Pie CTA */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={handleAddCustomFromStudio}
                className="px-6 py-3.5 bg-[#E23722] hover:bg-[#C02613] text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add This Custom Pie to Cart (₹{studioTotal})</span>
              </button>

              <Link
                to="/builder"
                className="px-4 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl transition-colors"
              >
                Advanced Customizer Options →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FULL MASTER MENU SHOWCASE WITH FILTER CATEGORIES & 1-CLICK ADD */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Hearth Master Menu</span>
            <h2 className="text-3xl font-display font-bold text-[#242424] mt-1">Our Signature Wood-Fired Creations</h2>
            <p className="text-stone-500 text-sm mt-1">All pizzas baked in 900°F stone oven with 72-hour slow-fermented crust.</p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Pies' },
              { id: 'classic', label: 'Neapolitan Classics' },
              { id: 'specialty', label: 'Specialty & Truffle' },
              { id: 'vegetarian', label: 'Garden Harvest' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#E23722] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pizzas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPizzas.map((pizza) => {
            const isAdded = addedAnimationId === (pizza.id || pizza._id);
            return (
              <motion.div
                key={pizza.id || pizza._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-stone-900 text-[11px] font-semibold px-2.5 py-0.5 rounded-md capitalize shadow-xs">
                    {pizza.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-stone-900/80 text-white text-[10px] font-mono-data px-2 py-0.5 rounded-md">
                    900°F Hearth
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-[#E23722] transition-colors">
                        {pizza.name}
                      </h3>
                      <span className="font-mono-data font-bold text-base text-stone-900 shrink-0">
                        ₹{pizza.basePrice}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {pizza.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-[11px] text-stone-500">
                      <span>{pizza.defaultIngredients.baseName}</span>
                      <span>·</span>
                      <span>{pizza.defaultIngredients.cheeseName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleQuickAdd(pizza)}
                      className={`py-2.5 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#E23722] hover:bg-[#C02613] text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Quick Add</span>
                        </>
                      )}
                    </button>
                    <Link
                      to="/builder"
                      className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center text-center"
                    >
                      <span>Customize</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 7. D.O.P. INGREDIENT PROVENANCE SHOWCASE */}
      <section className="bg-white border-y border-[#EFEAE4] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Direct Origin Sourcing</span>
            <h2 className="text-3xl font-display font-bold text-[#242424] mt-1">Farm-to-Crust Authenticity</h2>
            <p className="text-stone-500 text-sm mt-2">
              We import raw ingredients directly from designated Italian agricultural regions under strict D.O.P. certification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                region: 'Campania, Italy',
                name: 'San Marzano D.O.P. Tomatoes',
                desc: 'Grown in the volcanic shadow of Mount Vesuvius with sweet acidity and low seed count.'
              },
              {
                region: 'Agerola, Campania',
                name: 'Fior di Latte Mozzarella',
                desc: 'Whole cow milk curd stretched by hand every morning for optimal blistering stretch.'
              },
              {
                region: 'Puglia, Italy',
                name: 'Cold-Pressed Extra Virgin Oil',
                desc: 'First cold press Coratina olives providing a peppery aroma and golden finishing crust sheen.'
              },
              {
                region: 'Local Hydroponics',
                name: 'Organic Sweet Genovese Basil',
                desc: 'Plucked fresh each sunrise and laid onto hot molten pies immediately after firing.'
              }
            ].map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 space-y-2"
              >
                <div className="text-[10px] uppercase tracking-wider text-[#E23722] font-mono-data font-bold">
                  {item.region}
                </div>
                <h3 className="font-display font-bold text-base text-stone-900">{item.name}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS & REVIEWS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">Verified Diner Reviews (Sample Content)</span>
          <h2 className="text-3xl font-display font-bold text-[#242424] mt-1">Loved by Pizza Connoisseurs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: 'The 72-hour sourdough crust has that perfect Neapolitan airy rim and leopard char. Best pizza in town by far.',
              author: 'Aarav Kapoor',
              role: 'Verified Customer · Bangalore',
              rating: 5
            },
            {
              quote: 'Signed in with Google in one tap, customized my crust and sauce in the live visualizer, and paid via Razorpay test mode seamlessly.',
              author: 'Priya Sharma',
              role: 'Verified Customer · Indiranagar',
              rating: 5
            },
            {
              quote: 'Watching the order tracking move from In Kitchen dough stretching to Sent to Delivery was so satisfying. Came blistering hot!',
              author: 'Rohan Mehta',
              role: 'Verified Customer · Koramangala',
              rating: 5
            }
          ].map((t) => (
            <div key={t.author} className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                ))}
              </div>
              <p className="text-xs text-stone-600 italic leading-relaxed">"{t.quote}"</p>
              <div className="pt-2 border-t border-stone-100">
                <div className="text-xs font-bold text-stone-900">{t.author}</div>
                <div className="text-[11px] text-stone-400">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. INTERACTIVE FAQ ACCORDION */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#242424] mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does Google Authentication work here?',
              a: 'You can sign in with one tap using your Google account (detected as Harsh Chotaliya: chotaliyaharshstudy@gmail.com). We exchange credentials securely with our backend token verification, giving you instant access to order history and custom saved pies.'
            },
            {
              q: 'What makes 72-hour cold-fermented sourdough special?',
              a: 'Long slow fermentation naturally breaks down gluten starches, developing rich umami aromatics and ensuring the crust is light, airy, and won’t leave you feeling bloated.'
            },
            {
              q: 'How does the Razorpay test payment integration function?',
              a: 'All transactions use Razorpay Test Mode with verified order ID signatures and atomic backend inventory decrement. No real money is charged during testing.'
            },
            {
              q: 'Can I customize bases, sauces, and cheese independently?',
              a: 'Yes! Our custom builder allows 5 distinct bases (Sourdough, Classic Neapolitan, Stuffed Garlic Herb, Deep Dish, Cauliflower Gluten-Free), 5 signature sauces, multiple cheeses, and farm-fresh vegetable toppings.'
            }
          ].map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-stone-900 hover:text-[#E23722] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#E23722] shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. STICKY FLOATING QUICK-ORDER DOCK (APPEARS ON SCROLL) */}
      <AnimatePresence>
        {showFloatingDock && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 bg-stone-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center justify-between gap-4"
          >
            {/* Left: User status & Detected Account */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E23722] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  {user ? user.name : 'Guest Customer'}
                </div>
                <div className="text-[10px] text-stone-400 font-mono-data truncate">
                  {user ? user.email : 'Sign in with Google to save orders'}
                </div>
              </div>
            </div>

            {/* Right: Quick Order Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/builder"
                className="hidden sm:inline-flex px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-colors items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E06A26]" />
                <span>Custom Pie</span>
              </Link>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-4 py-2 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order Now</span>
                {itemCount > 0 && (
                  <span className="bg-white text-[#E23722] px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono-data">
                    {itemCount} · ₹{subtotal}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
