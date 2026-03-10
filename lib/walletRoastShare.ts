export type WalletRoastShareLanguage = 'en' | 'zh'

export interface WalletRoastShareScene {
  id: 'cook' | 'survivor' | 'champagne'
  title: string
  caption: string
  artDataUrl: string
  accent: string
  accentSoft: string
  accentText: string
}

const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const buildChampagneSceneSvg = () => svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#120f33"/>
      <stop offset="55%" stop-color="#1d1244"/>
      <stop offset="100%" stop-color="#0b0e1b"/>
    </linearGradient>
    <linearGradient id="frog" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#9ae66f"/>
      <stop offset="100%" stop-color="#4a8d2b"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff6cf" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#f3c55f" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="720" fill="url(#bg)"/>
  <circle cx="150" cy="120" r="120" fill="#ffd272" opacity="0.1"/>
  <circle cx="920" cy="130" r="120" fill="#ff8cb7" opacity="0.12"/>
  <circle cx="910" cy="560" r="120" fill="#ffc56a" opacity="0.12"/>
  <circle cx="190" cy="520" r="90" fill="#ff93c7" opacity="0.12"/>

  <g stroke-linecap="round" fill="none">
    <g stroke="#ffd978" stroke-width="8">
      <path d="M120 118 L78 62"/><path d="M120 118 L56 124"/><path d="M120 118 L84 172"/><path d="M120 118 L160 58"/><path d="M120 118 L188 130"/><path d="M120 118 L164 178"/>
    </g>
    <g stroke="#ffa7d8" stroke-width="7">
      <path d="M920 132 L874 72"/><path d="M920 132 L854 126"/><path d="M920 132 L872 184"/><path d="M920 132 L962 76"/><path d="M920 132 L986 122"/><path d="M920 132 L968 190"/>
    </g>
    <g stroke="#ffc96d" stroke-width="7">
      <path d="M892 560 L846 500"/><path d="M892 560 L826 552"/><path d="M892 560 L846 612"/><path d="M892 560 L936 504"/><path d="M892 560 L958 548"/><path d="M892 560 L940 620"/>
    </g>
  </g>

  <g transform="translate(210 130)">
    <path d="M170 430 C220 364 360 336 466 430 L512 600 L122 600 Z" fill="#0b111a"/>
    <path d="M188 430 C248 382 354 366 446 430 L396 600 L236 600 Z" fill="#141d28"/>
    <path d="M270 434 L316 490 L364 434 L390 454 L336 524 L246 454 Z" fill="#05080d"/>
    <circle cx="318" cy="454" r="16" fill="#0b0f15"/>

    <ellipse cx="318" cy="210" rx="220" ry="178" fill="url(#frog)"/>
    <ellipse cx="250" cy="150" rx="78" ry="58" fill="#f8ffef"/>
    <ellipse cx="386" cy="150" rx="78" ry="58" fill="#f8ffef"/>
    <ellipse cx="252" cy="154" rx="31" ry="34" fill="#111"/>
    <ellipse cx="384" cy="154" rx="31" ry="34" fill="#111"/>
    <circle cx="242" cy="144" r="8" fill="#fff"/>
    <circle cx="374" cy="144" r="8" fill="#fff"/>
    <path d="M158 134 C204 98 300 96 348 124" stroke="#2f5e1f" stroke-width="12" fill="none" opacity="0.6"/>
    <path d="M286 124 C334 98 430 102 480 138" stroke="#2f5e1f" stroke-width="12" fill="none" opacity="0.6"/>
    <path d="M190 270 C248 330 392 330 448 270" stroke="#a55a35" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M132 220 C174 286 126 344 214 382" stroke="#5b9a30" stroke-width="18" fill="none" opacity="0.6"/>
    <path d="M506 226 C462 290 508 348 424 384" stroke="#5b9a30" stroke-width="18" fill="none" opacity="0.6"/>

    <g transform="translate(466 326)">
      <path d="M0 0 C16 -12 56 -14 78 4 L70 42 C58 56 28 62 8 50 Z" fill="#e8f5ff" fill-opacity="0.26" stroke="#f6f9ff" stroke-opacity="0.8" stroke-width="5"/>
      <path d="M12 18 C28 12 48 12 64 18 L58 34 C42 40 30 40 18 34 Z" fill="url(#glass)"/>
      <rect x="36" y="42" width="6" height="62" rx="3" fill="#f5f7ff" fill-opacity="0.85"/>
      <ellipse cx="39" cy="108" rx="24" ry="8" fill="#f5f7ff" fill-opacity="0.55"/>
    </g>
  </g>
</svg>`)

const buildCookSceneSvg = () => svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4ccb5"/>
      <stop offset="50%" stop-color="#b7af99"/>
      <stop offset="100%" stop-color="#8c8474"/>
    </linearGradient>
    <linearGradient id="frog" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#88d05f"/>
      <stop offset="100%" stop-color="#4f8e32"/>
    </linearGradient>
    <linearGradient id="apron" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ea4d39"/>
      <stop offset="100%" stop-color="#b52220"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="720" fill="url(#bg)"/>
  <rect x="54" y="70" width="972" height="180" rx="28" fill="#cbc4ae" stroke="#554d43" stroke-opacity="0.3" stroke-width="6"/>
  <rect x="74" y="388" width="932" height="218" rx="18" fill="#7e7567"/>
  <rect x="124" y="286" width="270" height="120" rx="18" fill="#9a907f"/>
  <rect x="446" y="286" width="236" height="120" rx="18" fill="#948978"/>
  <rect x="726" y="272" width="240" height="152" rx="18" fill="#9d927f"/>
  <path d="M94 192 C124 160 144 226 166 190" stroke="#7b6f5f" stroke-width="10" opacity="0.45"/>
  <path d="M976 176 C952 132 926 220 902 164" stroke="#7b6f5f" stroke-width="10" opacity="0.45"/>
  <path d="M286 220 C302 190 330 246 352 210" stroke="#7b6f5f" stroke-width="10" opacity="0.45"/>
  <path d="M560 214 C588 176 610 248 632 204" stroke="#7b6f5f" stroke-width="10" opacity="0.45"/>
  <path d="M126 610 C154 640 190 610 214 636" stroke="#574d3e" stroke-width="12" opacity="0.45"/>
  <path d="M888 594 C926 640 962 592 996 628" stroke="#574d3e" stroke-width="12" opacity="0.45"/>
  <path d="M98 86 C80 146 104 200 94 244" stroke="#ffffff" stroke-width="12" opacity="0.52" fill="none" stroke-linecap="round"/>
  <path d="M946 82 C926 140 952 188 944 238" stroke="#ffffff" stroke-width="12" opacity="0.5" fill="none" stroke-linecap="round"/>
  <path d="M814 106 C796 156 828 210 818 258" stroke="#ffffff" stroke-width="10" opacity="0.42" fill="none" stroke-linecap="round"/>

  <g transform="translate(255 118)">
    <path d="M218 316 C254 294 378 294 416 316 L408 552 L226 552 Z" fill="#245dc6"/>
    <path d="M196 324 C244 290 392 286 444 326 L420 592 L218 592 Z" fill="url(#apron)"/>
    <path d="M228 338 C234 350 246 376 248 404" stroke="#6a180d" stroke-width="10" fill="none" opacity="0.5"/>
    <path d="M406 350 C396 378 392 410 394 438" stroke="#6a180d" stroke-width="10" fill="none" opacity="0.45"/>
    <ellipse cx="322" cy="176" rx="198" ry="168" fill="url(#frog)"/>
    <path d="M164 50 C220 10 418 14 470 62 L454 106 C396 84 252 82 176 112 Z" fill="#d73328"/>
    <path d="M448 60 C466 64 480 74 492 92 L424 104 C374 108 304 112 210 120 L170 110 C204 72 374 38 448 60 Z" fill="#b81917"/>
    <path d="M406 38 C430 44 442 52 450 66" stroke="#ffcb4f" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M418 54 L432 38 L448 56" stroke="#ffcb4f" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="252" cy="158" rx="72" ry="56" fill="#f8fff0"/>
    <ellipse cx="392" cy="158" rx="72" ry="56" fill="#f8fff0"/>
    <ellipse cx="254" cy="164" rx="28" ry="30" fill="#101010"/>
    <ellipse cx="390" cy="164" rx="28" ry="30" fill="#101010"/>
    <circle cx="244" cy="154" r="7" fill="#fff"/>
    <circle cx="380" cy="154" r="7" fill="#fff"/>
    <path d="M208 272 C270 250 372 252 430 270" stroke="#9b5535" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M228 182 C212 232 220 260 244 284" stroke="#4b7d2f" stroke-width="16" fill="none" opacity="0.56"/>
    <path d="M412 178 C428 230 420 258 396 284" stroke="#4b7d2f" stroke-width="16" fill="none" opacity="0.56"/>
    <path d="M266 196 C246 214 244 248 254 278" stroke="#7dc9ff" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.9"/>
    <path d="M376 196 C394 214 396 248 386 278" stroke="#7dc9ff" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.9"/>
    <ellipse cx="248" cy="252" rx="20" ry="34" fill="#7dc9ff" opacity="0.74"/>
    <ellipse cx="392" cy="252" rx="20" ry="34" fill="#7dc9ff" opacity="0.74"/>
  </g>
</svg>`)

const buildSurvivorSceneSvg = () => svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#281507"/>
      <stop offset="55%" stop-color="#4a2109"/>
      <stop offset="100%" stop-color="#1a1309"/>
    </linearGradient>
    <linearGradient id="frog" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#9fe46a"/>
      <stop offset="100%" stop-color="#4e8a2c"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="720" fill="url(#bg)"/>
  <circle cx="158" cy="138" r="128" fill="#ffbb55" opacity="0.1"/>
  <circle cx="924" cy="144" r="122" fill="#ffa24d" opacity="0.12"/>
  <circle cx="888" cy="560" r="96" fill="#ffd36f" opacity="0.12"/>
  <path d="M80 520 L280 420 L374 490 L174 590 Z" fill="#ff8f41" opacity="0.18"/>
  <path d="M764 468 L944 396 L1012 480 L832 556 Z" fill="#ffcc67" opacity="0.16"/>
  <path d="M164 96 L198 132 L158 174 L128 142 Z" fill="#ffd46a" opacity="0.75"/>
  <path d="M898 114 L930 146 L894 182 L862 148 Z" fill="#ff9c7f" opacity="0.74"/>
  <g transform="translate(218 116)">
    <path d="M152 412 C216 354 394 344 480 418 L524 592 L104 592 Z" fill="#15120e"/>
    <path d="M196 412 C256 372 376 364 444 414 L398 592 L240 592 Z" fill="#24201a"/>
    <path d="M218 360 C246 328 396 324 428 360 L418 432 C348 442 288 442 228 430 Z" fill="#2e251d"/>
    <ellipse cx="320" cy="196" rx="216" ry="176" fill="url(#frog)"/>
    <ellipse cx="250" cy="160" rx="76" ry="56" fill="#f5ffee"/>
    <ellipse cx="390" cy="160" rx="76" ry="56" fill="#f5ffee"/>
    <rect x="184" y="128" width="272" height="82" rx="40" fill="#141414"/>
    <rect x="198" y="144" width="110" height="48" rx="22" fill="#1f1f1f"/>
    <rect x="330" y="144" width="110" height="48" rx="22" fill="#1f1f1f"/>
    <path d="M200 144 L440 190" stroke="#ffa143" stroke-width="8" opacity="0.6"/>
    <path d="M188 270 C248 316 390 316 448 270" stroke="#a65b36" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M134 216 C176 282 140 336 212 372" stroke="#5a972f" stroke-width="18" fill="none" opacity="0.6"/>
    <path d="M506 216 C466 284 500 338 430 372" stroke="#5a972f" stroke-width="18" fill="none" opacity="0.6"/>
    <rect x="430" y="330" width="58" height="16" rx="8" fill="#f2f2f2"/>
    <rect x="438" y="336" width="40" height="6" rx="3" fill="#cfd4da"/>
  </g>
</svg>`)

export const getWalletRoastShareScene = (
  score: number,
  language: WalletRoastShareLanguage
): WalletRoastShareScene => {
  if (score >= 80) {
    return {
      id: 'champagne',
      title: language === 'zh' ? '烟花香槟局' : 'Champagne Flex',
      caption:
        language === 'zh'
          ? '高分钱包别谦虚，烟花和香槟都该端上来。'
          : 'This bag earned the fireworks treatment.',
      artDataUrl: buildChampagneSceneSvg(),
      accent: '#6de6b2',
      accentSoft: 'rgba(109,230,178,0.14)',
      accentText: '#dffff1'
    }
  }

  if (score >= 60) {
    return {
      id: 'survivor',
      title: language === 'zh' ? '幸存者模式' : 'Still Alive Arc',
      caption:
        language === 'zh'
          ? '这钱包还没封神，但已经有一点主角光环了。'
          : 'Not elite yet, but it survived long enough to look dangerous.',
      artDataUrl: buildSurvivorSceneSvg(),
      accent: '#ffb25f',
      accentSoft: 'rgba(255,178,95,0.14)',
      accentText: '#ffe5bd'
    }
  }

  return {
    id: 'cook',
    title: language === 'zh' ? '后厨打工蛙' : 'Fry Cook Arc',
    caption:
      language === 'zh'
        ? '低分就别装稳重了，哭图才有传播性。'
        : 'A low score needs tears if you want the screenshot to travel.',
    artDataUrl: buildCookSceneSvg(),
    accent: '#ff7d73',
    accentSoft: 'rgba(255,125,115,0.14)',
    accentText: '#ffe2df'
  }
}
