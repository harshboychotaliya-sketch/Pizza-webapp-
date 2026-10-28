import React from 'react';
import { Ingredient } from '../types';

interface PizzaVisualizerProps {
  base: Ingredient | null;
  sauce: Ingredient | null;
  cheese: Ingredient | null;
  veggies: Ingredient[];
}

export const PizzaVisualizer: React.FC<PizzaVisualizerProps> = ({
  base,
  sauce,
  cheese,
  veggies
}) => {
  // Sauce color mapping
  const getSauceColor = (sauceName?: string) => {
    if (!sauceName) return '#D94826'; // default San Marzano
    const name = sauceName.toLowerCase();
    if (name.includes('alfredo')) return '#F4EEDA';
    if (name.includes('arrabbiata')) return '#B81E10';
    if (name.includes('pesto')) return '#447A3B';
    if (name.includes('bbq')) return '#882A15';
    return '#D94826';
  };

  // Cheese color mapping
  const getCheeseColor = (cheeseName?: string) => {
    if (!cheeseName) return '#FFF2B2';
    const name = cheeseName.toLowerCase();
    if (name.includes('cheddar')) return '#F9B73F';
    if (name.includes('gorgonzola')) return '#EDE5C8';
    if (name.includes('ricotta')) return '#FCFAF2';
    if (name.includes('provolone')) return '#FBE49B';
    if (name.includes('cashew') || name.includes('vegan')) return '#F7E7C4';
    return '#FFF3B8'; // Mozzarella
  };

  // Crust color and rim mapping
  const getCrustBorder = (baseName?: string) => {
    if (!baseName) return { outer: '#C68A4C', inner: '#DEAC72', blister: '#5A3515' };
    const name = baseName.toLowerCase();
    if (name.includes('sourdough')) return { outer: '#B87B3D', inner: '#D39C5E', blister: '#4A2A0C' };
    if (name.includes('neapolitan')) return { outer: '#C98C4E', inner: '#DCAB6E', blister: '#522F12' };
    if (name.includes('deep dish')) return { outer: '#E29E38', inner: '#F2BD64', blister: '#6E3A0B' };
    if (name.includes('cauliflower')) return { outer: '#BCA47B', inner: '#D5C49E', blister: '#6B5839' };
    if (name.includes('garlic')) return { outer: '#C28340', inner: '#E4A860', blister: '#422409' };
    return { outer: '#C68A4C', inner: '#DEAC72', blister: '#5A3515' };
  };

  const crust = getCrustBorder(base?.name);
  const sauceColor = getSauceColor(sauce?.name);
  const cheeseColor = getCheeseColor(cheese?.name);

  // Vegetable visual render positions (pre-calculated polar coordinates for aesthetic dispersion)
  const hasVeggie = (keyword: string) =>
    veggies.some(v => v.name.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center p-2 select-none">
      {/* Stone Peel / Wooden Board Backdrop Shadow */}
      <div className="absolute inset-2 rounded-full bg-black/10 blur-xl transform translate-y-3 pointer-events-none" />

      {/* SVG Canvas */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-xl transition-all duration-500 overflow-visible"
      >
        <defs>
          {/* Radial gradient for sauce depth */}
          <radialGradient id="sauceGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={sauceColor} stopOpacity="1" />
            <stop offset="85%" stopColor={sauceColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4A180E" stopOpacity="0.4" />
          </radialGradient>

          {/* Cheese melt texture pattern */}
          <radialGradient id="cheeseMelt" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor={cheeseColor} stopOpacity="0.95" />
            <stop offset="70%" stopColor={cheeseColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#D9822B" stopOpacity="0.65" />
          </radialGradient>

          {/* Crust Cornicione Gradient */}
          <radialGradient id="crustGrip" cx="50%" cy="50%" r="50%">
            <stop offset="78%" stopColor={crust.inner} />
            <stop offset="93%" stopColor={crust.outer} />
            <stop offset="100%" stopColor="#40200C" />
          </radialGradient>
        </defs>

        {/* 1. Crust Layer (Outer rim & baked cornicione) */}
        <circle cx="200" cy="200" r="190" fill="url(#crustGrip)" stroke="#381D0B" strokeWidth="2" />

        {/* Charred wood-fired leopard blister spots on crust edge */}
        <g fill={crust.blister} opacity="0.85">
          <ellipse cx="60" cy="120" rx="9" ry="5" transform="rotate(-30 60 120)" />
          <ellipse cx="90" cy="65" rx="12" ry="6" transform="rotate(25 90 65)" />
          <ellipse cx="180" cy="22" rx="14" ry="6" transform="rotate(-5 180 22)" />
          <ellipse cx="270" cy="38" rx="10" ry="5" transform="rotate(40 270 38)" />
          <ellipse cx="340" cy="100" rx="13" ry="7" transform="rotate(65 340 100)" />
          <ellipse cx="372" cy="180" rx="8" ry="12" transform="rotate(10 372 180)" />
          <ellipse cx="350" cy="275" rx="14" ry="7" transform="rotate(-40 350 275)" />
          <ellipse cx="280" cy="355" rx="11" ry="6" transform="rotate(20 280 355)" />
          <ellipse cx="190" cy="378" rx="15" ry="6" transform="rotate(5 190 378)" />
          <ellipse cx="100" cy="340" rx="12" ry="6" transform="rotate(-35 100 340)" />
          <ellipse cx="35" cy="260" rx="8" ry="13" transform="rotate(15 35 260)" />
          <ellipse cx="28" cy="180" rx="7" ry="10" transform="rotate(-15 28 180)" />
        </g>

        {/* 2. Sauce Layer */}
        <circle cx="200" cy="200" r="156" fill="url(#sauceGlow)" className="transition-colors duration-500" />

        {/* Herb specks inside sauce */}
        <g fill="#2D4A1D" opacity="0.6">
          <circle cx="160" cy="170" r="1.5" />
          <circle cx="230" cy="140" r="1.2" />
          <circle cx="190" cy="220" r="1.8" />
          <circle cx="240" cy="210" r="1.3" />
          <circle cx="140" cy="240" r="1.6" />
          <circle cx="170" cy="115" r="1.4" />
          <circle cx="270" cy="180" r="1.5" />
        </g>

        {/* 3. Melted Cheese Layer (Organic splatters & stretches) */}
        <g className="transition-all duration-500">
          <circle cx="200" cy="200" r="148" fill="url(#cheeseMelt)" opacity="0.9" />

          {/* Melted Cheese Golden Toast Bubbles */}
          <g fill="#C46B18" opacity="0.75">
            <ellipse cx="140" cy="160" rx="12" ry="8" />
            <ellipse cx="250" cy="175" rx="14" ry="9" />
            <ellipse cx="185" cy="245" rx="16" ry="10" />
            <ellipse cx="215" cy="130" rx="10" ry="7" />
            <ellipse cx="170" cy="190" rx="8" ry="6" />
            <ellipse cx="260" cy="230" rx="11" ry="7" />
          </g>

          {/* White cheese pull strings/pools */}
          <g fill="#FFFFFF" opacity="0.45">
            <ellipse cx="165" cy="150" rx="8" ry="5" />
            <ellipse cx="220" cy="190" rx="10" ry="6" />
            <ellipse cx="175" cy="220" rx="9" ry="5" />
            <ellipse cx="210" cy="250" rx="7" ry="4" />
          </g>
        </g>

        {/* 4. Vegetable Toppings Layers (Conditional on selection) */}

        {/* Charred Bell Peppers */}
        {hasVeggie('pepper') && (
          <g className="transition-opacity duration-300">
            {/* Red pepper strips */}
            <path d="M 130 140 Q 150 130 170 145" stroke="#E63920" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 230 170 Q 250 150 270 165" stroke="#E63920" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 160 250 Q 185 270 210 255" stroke="#E63920" strokeWidth="8" strokeLinecap="round" fill="none" />
            {/* Yellow pepper strips */}
            <path d="M 190 150 Q 215 135 235 155" stroke="#F5A623" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 140 210 Q 160 230 185 215" stroke="#F5A623" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 220 220 Q 245 240 265 210" stroke="#F5A623" strokeWidth="7" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* Wild Porcini Mushrooms */}
        {hasVeggie('mushroom') && (
          <g fill="#6B4423" stroke="#482C14" strokeWidth="1" className="transition-opacity duration-300">
            <g transform="translate(130, 175) rotate(-20)">
              <path d="M 0 10 A 15 15 0 0 1 30 10 Z" fill="#7A4E2A" />
              <rect x="11" y="10" width="8" height="12" fill="#E8DEC8" rx="2" />
            </g>
            <g transform="translate(230, 130) rotate(35)">
              <path d="M 0 10 A 15 15 0 0 1 30 10 Z" fill="#7A4E2A" />
              <rect x="11" y="10" width="8" height="12" fill="#E8DEC8" rx="2" />
            </g>
            <g transform="translate(200, 230) rotate(-45)">
              <path d="M 0 10 A 15 15 0 0 1 30 10 Z" fill="#7A4E2A" />
              <rect x="11" y="10" width="8" height="12" fill="#E8DEC8" rx="2" />
            </g>
            <g transform="translate(145, 115) rotate(15)">
              <path d="M 0 10 A 14 14 0 0 1 28 10 Z" fill="#69401F" />
              <rect x="10" y="10" width="7" height="10" fill="#E8DEC8" rx="2" />
            </g>
          </g>
        )}

        {/* Kalamata Black Olives */}
        {hasVeggie('olive') && (
          <g fill="#241B26" stroke="#4A3B4E" strokeWidth="2" className="transition-opacity duration-300">
            <circle cx="120" cy="155" r="9" />
            <circle cx="120" cy="155" r="4" fill="#882A15" opacity="0.6" stroke="none" />

            <circle cx="215" cy="175" r="9" />
            <circle cx="215" cy="175" r="4" fill="#882A15" opacity="0.6" stroke="none" />

            <circle cx="255" cy="205" r="9" />
            <circle cx="255" cy="205" r="4" fill="#882A15" opacity="0.6" stroke="none" />

            <circle cx="170" cy="265" r="9" />
            <circle cx="170" cy="265" r="4" fill="#882A15" opacity="0.6" stroke="none" />

            <circle cx="265" cy="150" r="9" />
            <circle cx="265" cy="150" r="4" fill="#882A15" opacity="0.6" stroke="none" />
          </g>
        )}

        {/* Cherry Tomatoes */}
        {hasVeggie('tomato') && (
          <g className="transition-opacity duration-300">
            <circle cx="150" cy="190" r="11" fill="#D82A18" stroke="#8E180B" strokeWidth="1" />
            <circle cx="148" cy="188" r="4" fill="#FF8D66" opacity="0.7" />

            <circle cx="240" cy="190" r="11" fill="#D82A18" stroke="#8E180B" strokeWidth="1" />
            <circle cx="238" cy="188" r="4" fill="#FF8D66" opacity="0.7" />

            <circle cx="195" cy="125" r="11" fill="#D82A18" stroke="#8E180B" strokeWidth="1" />
            <circle cx="193" cy="123" r="4" fill="#FF8D66" opacity="0.7" />

            <circle cx="215" cy="260" r="11" fill="#D82A18" stroke="#8E180B" strokeWidth="1" />
            <circle cx="213" cy="258" r="4" fill="#FF8D66" opacity="0.7" />
          </g>
        )}

        {/* Caramelized Sweet Onions */}
        {hasVeggie('onion') && (
          <g stroke="#9C5A20" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" className="transition-opacity duration-300">
            <path d="M 125 180 Q 140 195 160 185" />
            <path d="M 210 160 Q 230 145 245 165" />
            <path d="M 175 230 Q 195 245 220 230" />
            <path d="M 235 225 Q 255 240 270 220" />
            <path d="M 160 145 Q 175 160 190 145" />
          </g>
        )}

        {/* Pickled Jalapeños */}
        {hasVeggie('jalape') && (
          <g fill="#437728" stroke="#254714" strokeWidth="2" className="transition-opacity duration-300">
            <circle cx="180" cy="165" r="9" />
            <circle cx="180" cy="165" r="4" fill="#6EA848" stroke="none" />

            <circle cx="225" cy="210" r="9" />
            <circle cx="225" cy="210" r="4" fill="#6EA848" stroke="none" />

            <circle cx="145" cy="225" r="9" />
            <circle cx="145" cy="225" r="4" fill="#6EA848" stroke="none" />

            <circle cx="260" cy="175" r="9" />
            <circle cx="260" cy="175" r="4" fill="#6EA848" stroke="none" />
          </g>
        )}

        {/* Confit Garlic Cloves */}
        {hasVeggie('garlic') && (
          <g fill="#EFE3AF" stroke="#BFAF79" strokeWidth="1" opacity="0.95" className="transition-opacity duration-300">
            <ellipse cx="160" cy="130" rx="9" ry="5" transform="rotate(-30 160 130)" />
            <ellipse cx="235" cy="245" rx="9" ry="5" transform="rotate(40 235 245)" />
            <ellipse cx="155" cy="240" rx="9" ry="5" transform="rotate(20 155 240)" />
          </g>
        )}

        {/* Baby Spinach Leaves */}
        {hasVeggie('spinach') && (
          <g fill="#2D5A27" stroke="#1C3818" strokeWidth="1" opacity="0.85" className="transition-opacity duration-300">
            <path d="M 125 130 Q 140 120 150 135 Q 140 145 125 130 Z" />
            <path d="M 230 195 Q 245 180 260 200 Q 245 210 230 195 Z" />
            <path d="M 180 250 Q 195 235 210 255 Q 195 265 180 250 Z" />
          </g>
        )}

        {/* Fresh Genovese Basil Leaves (Crown Glory) */}
        {hasVeggie('basil') && (
          <g fill="#2E7D32" stroke="#1B5E20" strokeWidth="1" className="transition-all duration-300 drop-shadow-sm">
            {/* Center triple leaf sprig */}
            <g transform="translate(200, 200)">
              <path d="M 0 0 C -18 -20 -15 -35 0 -45 C 15 -35 18 -20 0 0 Z" fill="#388E3C" />
              <line x1="0" y1="0" x2="0" y2="-40" stroke="#1B5E20" strokeWidth="1" />

              <path d="M 0 0 C -25 -10 -35 5 -35 25 C -20 30 -5 18 0 0 Z" fill="#2E7D32" />
              <line x1="0" y1="0" x2="-30" y2="22" stroke="#1B5E20" strokeWidth="1" />

              <path d="M 0 0 C 25 -10 35 5 35 25 C 20 30 5 18 0 0 Z" fill="#2E7D32" />
              <line x1="0" y1="0" x2="30" y2="22" stroke="#1B5E20" strokeWidth="1" />
            </g>

            {/* Perimeter leaves */}
            <g transform="translate(140, 150) rotate(-45)">
              <path d="M 0 0 C -12 -15 -10 -28 0 -35 C 10 -28 12 -15 0 0 Z" />
            </g>
            <g transform="translate(260, 160) rotate(50)">
              <path d="M 0 0 C -12 -15 -10 -28 0 -35 C 10 -28 12 -15 0 0 Z" />
            </g>
            <g transform="translate(170, 240) rotate(120)">
              <path d="M 0 0 C -12 -15 -10 -28 0 -35 C 10 -28 12 -15 0 0 Z" />
            </g>
          </g>
        )}

        {/* Center Olive Oil Drizzle Sheen */}
        <path
          d="M 170 170 Q 200 150 215 185 T 190 225"
          stroke="#E6B800"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};
