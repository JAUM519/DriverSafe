export function IlustracionLogin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img"
      aria-label="Bus con un conductor que lleva un reloj inteligente que mide su frecuencia cardíaca y saturación de oxígeno">
      <style>{`
        .latido { transform-origin: 66px 72px; animation: latido 1.2s ease-in-out infinite; }
        .ecg { stroke-dasharray: 90; animation: ecg 2.4s linear infinite; }
        .senal { animation: senal 2s ease-in-out infinite; }
        .senal-2 { animation-delay: .3s; }
        .flota { animation: flota 4s ease-in-out infinite; }
        .flota-2 { animation-delay: 1.3s; }
        .flota-3 { animation-delay: 2.6s; }
        .pulso { transform-origin: 186px 141px; animation: pulso 1.8s ease-out infinite; }
        @keyframes latido { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.18); } 30% { transform: scale(1); } 45% { transform: scale(1.1); } }
        @keyframes ecg { from { stroke-dashoffset: 180; } to { stroke-dashoffset: 0; } }
        @keyframes senal { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
        @keyframes flota { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes pulso { from { transform: scale(1); opacity: .6; } to { transform: scale(2.6); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      <circle cx="240" cy="190" r="168" fill="#fff" opacity=".06" />
      <circle cx="240" cy="190" r="120" fill="#fff" opacity=".05" />

      <g fill="#1E3A8A" opacity=".55">
        <rect x="34" y="168" width="40" height="122" rx="4" />
        <rect x="80" y="196" width="30" height="94" rx="4" />
        <rect x="116" y="150" width="44" height="140" rx="4" />
        <rect x="318" y="176" width="38" height="114" rx="4" />
        <rect x="362" y="140" width="50" height="150" rx="4" />
        <rect x="418" y="190" width="30" height="100" rx="4" />
      </g>
      <g fill="#93C5FD" opacity=".35">
        {[0, 1, 2, 3].map((i) => <rect key={`a${i}`} x="124" y={162 + i * 22} width="8" height="10" rx="1.5" />)}
        {[0, 1, 2, 3].map((i) => <rect key={`b${i}`} x="142" y={162 + i * 22} width="8" height="10" rx="1.5" />)}
        {[0, 1, 2, 3, 4].map((i) => <rect key={`c${i}`} x="372" y={152 + i * 22} width="8" height="10" rx="1.5" />)}
        {[0, 1, 2, 3, 4].map((i) => <rect key={`d${i}`} x="392" y={152 + i * 22} width="8" height="10" rx="1.5" />)}
      </g>

      <rect x="14" y="288" width="452" height="58" rx="29" fill="#1E3A8A" />
      <line x1="48" y1="322" x2="432" y2="322" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeDasharray="20 16" opacity=".35" />

      <g>
        <rect x="428" y="252" width="6" height="40" rx="2" fill="#78350F" />
        <circle cx="431" cy="242" r="20" fill="#10B981" />
        <circle cx="420" cy="252" r="12" fill="#059669" />
        <rect x="44" y="258" width="5" height="34" rx="2" fill="#78350F" />
        <circle cx="46" cy="252" r="15" fill="#10B981" />
        <circle cx="55" cy="260" r="9" fill="#059669" />
      </g>

      <ellipse cx="222" cy="306" rx="164" ry="7" fill="#0F172A" opacity=".3" />

      <defs>
        <clipPath id="carroceria">
          <rect x="70" y="170" width="304" height="114" rx="18" />
        </clipPath>
        <clipPath id="ventana-conductor">
          <rect x="316" y="196" width="50" height="44" rx="6" />
        </clipPath>
      </defs>

      <rect x="92" y="160" width="250" height="16" rx="8" fill="#CBD5E1" />
      <g clipPath="url(#carroceria)">
        <rect x="70" y="170" width="304" height="114" fill="#F8FAFC" />
        <rect x="70" y="248" width="304" height="10" fill="#10B981" />
        <rect x="70" y="258" width="304" height="26" fill="#E2E8F0" />
        <circle cx="132" cy="288" r="31" fill="#334155" />
        <circle cx="312" cy="288" r="31" fill="#334155" />
        <rect x="366" y="258" width="10" height="9" rx="2" fill="#FDE68A" />
        <rect x="70" y="252" width="6" height="12" rx="2" fill="#EF4444" />
      </g>

      <rect x="88" y="178" width="56" height="14" rx="3" fill="#0F172A" />
      <text x="116" y="189" fill="#FBBF24" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">BUS04</text>

      {[88, 146, 204, 262].map((x, i) => (
        <g key={x}>
          <rect x={x} y="196" width="50" height="44" rx="6" fill="#1E40AF" />
          {i % 2 === 1 && <circle cx={x + 25} cy="224" r="8" fill="#60A5FA" opacity=".55" />}
          {i % 2 === 1 && <rect x={x + 14} y="230" width="22" height="10" rx="5" fill="#60A5FA" opacity=".55" />}
          <path d={`M${x + 8} 240 L${x + 30} 196 H${x + 40} L${x + 18} 240 Z`} fill="#fff" opacity=".12" />
        </g>
      ))}

      <rect x="316" y="196" width="50" height="44" rx="6" fill="#1E40AF" />
      <g clipPath="url(#ventana-conductor)">
        <rect x="324" y="226" width="30" height="20" rx="9" fill="#2563EB" />
        <circle cx="339" cy="213" r="9.5" fill="#1F2937" />
        <circle cx="340" cy="216" r="8" fill="#FDBA74" />
        <rect x="346" y="229" width="7" height="6" rx="1.5" fill="#22C55E" />
        <line x1="356" y1="224" x2="362" y2="238" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        <path d="M324 240 L346 196 H356 L334 240 Z" fill="#fff" opacity=".12" />
      </g>

      <circle cx="132" cy="288" r="23" fill="#0F172A" />
      <circle cx="132" cy="288" r="10" fill="#94A3B8" />
      <circle cx="132" cy="288" r="4" fill="#0F172A" />
      <circle cx="312" cy="288" r="23" fill="#0F172A" />
      <circle cx="312" cy="288" r="10" fill="#94A3B8" />
      <circle cx="312" cy="288" r="4" fill="#0F172A" />

      <path d="M300 130 Q 330 160 346 226" stroke="#fff" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" opacity=".55" />

      <g className="flota flota-2">
        <path className="senal" d="M290 34 Q300 26 310 34" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
        <path className="senal senal-2" d="M283 26 Q300 12 317 26" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
        <rect x="287" y="44" width="26" height="90" rx="8" fill="#0F172A" />
        <rect x="274" y="62" width="52" height="52" rx="14" fill="#1E293B" stroke="#334155" strokeWidth="3" />
        <polyline className="ecg" points="282,92 290,92 294,82 299,102 304,86 308,92 318,92" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="300" y="78" fill="#fff" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle">78</text>
      </g>

      <g className="flota">
        <rect x="34" y="40" width="176" height="64" rx="16" fill="#fff" />
        <circle cx="66" cy="72" r="16" fill="#FEE2E2" />
        <path className="latido" d="M66 80 L59 73 A4.2 4.2 0 0 1 66 66.5 A4.2 4.2 0 0 1 73 73 Z" fill="#EF4444" />
        <text x="90" y="65" fill="#64748B" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500">Frecuencia cardíaca</text>
        <text x="90" y="89" fill="#0F172A" fontSize="19" fontFamily="Inter, sans-serif" fontWeight="800">78 <tspan fontSize="11" fontWeight="600" fill="#64748B">lpm</tspan></text>
        <polyline points="156,84 166,84 170,76 175,92 180,80 184,84 198,84" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g className="flota flota-3">
        <rect x="350" y="34" width="106" height="92" rx="16" fill="#fff" />
        <circle cx="403" cy="70" r="22" stroke="#DBEAFE" strokeWidth="7" />
        <circle cx="403" cy="70" r="22" stroke="#2563EB" strokeWidth="7" strokeLinecap="round"
          strokeDasharray="134 139" transform="rotate(-90 403 70)" />
        <text x="403" y="75" fill="#0F172A" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="800" textAnchor="middle">97%</text>
        <text x="403" y="113" fill="#64748B" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500" textAnchor="middle">SpO₂</text>
      </g>

      <g>
        <rect x="166" y="126" width="104" height="30" rx="15" fill="#fff" />
        <circle className="pulso" cx="186" cy="141" r="5" fill="#22C55E" />
        <circle cx="186" cy="141" r="5" fill="#22C55E" />
        <text x="198" y="145.5" fill="#15803D" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">Normal</text>
      </g>

      <g fill="#fff">
        <circle cx="236" cy="40" r="2" opacity=".5" />
        <circle cx="22" cy="140" r="2.5" opacity=".35" />
        <circle cx="464" cy="150" r="2" opacity=".4" />
        <circle cx="250" cy="96" r="1.5" opacity=".4" />
      </g>
    </svg>
  );
}
