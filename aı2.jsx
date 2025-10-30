import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AI Evreni Kart Paketi - v10.6 (Unicode-safe)
 * - Koleksiyon & Çanta: aynı genişlik (max-w-[1400px])
 * - Kart detayları TR; Tamam/Geri/Parçala akışları
 * - Craft (Toz Paketi): Medium/Large/Mega oranlarından rastgele kart açılışı
 * - Çanta: sadece kaynak/frag öğeleri
 * - Epic pity (10. açılış en az Epic)
 * - Unicode hatası için yıldız sembolleri artık doğrudan karakterle (★ ☆),
 *   hiçbir \u kaçışı kullanılmıyor.
 */

/** @typedef {"Common"|"Rare"|"Epic"|"Legendary"|"Ultimate"} Rarity */

// === Paket görselleri ===
const PACK_IMAGES = {
  normal: "https://r.resimlink.com/nvf8iHW7.png",
  medium: "https://r.resimlink.com/QVORcLq3Y.png",
  large:  "https://r.resimlink.com/fAGMxK3_NU.png",
  mega:   "https://r.resimlink.com/cIH18jRW.png",
};

// === Kart havuzu ===
const CARD_POOL = [
  { id: "lirili", name: "Lirili Larila", rarity: "Common", stars: 1, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/5/52/Lirili_Larila.jpeg" },
  { id: "trippi", name: "Trippi Troppi", rarity: "Common", stars: 1, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/2/26/Trippi_TroppiFISH.jpeg" },
  { id: "frigo", name: "Frigo Camelo", rarity: "Common", stars: 1, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/6/61/Frigo_Camelo.jpg" },
  { id: "vacca", name: "Vacca Saturno", rarity: "Common", stars: 1, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/6/62/Saturno_Saturnita.png" },
  { id: "zibra", name: "Zibra Zubra Zibralini", rarity: "Common", stars: 1, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/9/96/Zibra_zubra_zibralini.png" },

  { id: "ballerinaCap", name: "Ballerina Cappuccino", rarity: "Rare", stars: 2, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/9/9a/Ballerina_cappucappu.png" },
  { id: "bobrito", name: "Bobrito Bandito", rarity: "Rare", stars: 2, imageUrl: null },
  { id: "burbaloni", name: "Burbaloni Luliloli", rarity: "Rare", stars: 2, imageUrl: null },
  { id: "bombombini", name: "Bombombini Gusini", rarity: "Rare", stars: 2, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/8/8a/Bombombini_gusini_original.jpg" },
  { id: "tralalero", name: "Tralalero Tralala", rarity: "Rare", stars: 2, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/e/e0/Tralalelo_tralala.png" },

  { id: "capAssa", name: "Cappuccino Assassino", rarity: "Epic", stars: 3, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/2/29/Cappuccino_assassino.png" },
  { id: "chimp", name: "Chimpanzini Bananini", rarity: "Epic", stars: 3, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/5/50/Chimpanzini_Bananino.png" },
  { id: "boneca", name: "Boneca Ambalabu", rarity: "Epic", stars: 3, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/3/3e/Boneka-Ambalabu.png" },
  { id: "brr", name: "Brr Brr Patapim", rarity: "Epic", stars: 3, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/14/Brr_brr_patapim.jpg" },

  { id: "tatatata", name: "Tatatata Sahur", rarity: "Legendary", stars: 4, imageUrl: null },
  { id: "mateo", name: "Mateo", rarity: "Legendary", stars: 4, imageUrl: null },
  { id: "ecco", name: "Ecco Cavallo Virtuoso", rarity: "Legendary", stars: 4, imageUrl: null },
  { id: "bombardino", name: "Bombardino Crocodilo", rarity: "Legendary", stars: 4, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Bombardiro_Crocodillo.jpg" },

  { id: "tung3sahur", name: "Tung Tung Tung Sahur", rarity: "Ultimate", stars: 5, imageUrl: "https://static.wikitide.net/italianbrainrotwiki/f/fa/Tung_tung_tung_sahur.png" },

  { id: "cappuccinoBallerina", name: "Cappuccino Ballerina", rarity: "Rare", stars: 2, imageUrl: null },
  { id: "udindin", name: "U Din Din Din Din Dun Ma Din Din Din Dun", rarity: "Rare", stars: 2, imageUrl: null },
];

const ULTIMATE_IDS = ["tung3sahur"];

// === Kart detayları (TR) ===
const CARD_DETAILS = {
  lirili:       { lore: "Ritim oyunlarıyla rakipleri şaşırtır.",        powers: ["Ses Dalgası: 1 tur sersemlet"],         tags: ["Ses","Ritim"],         atk: 38, def: 30, spd: 56 },
  trippi:       { lore: "Psikedelik titreşimler yaratır.",              powers: ["Görsel Halü: Kritik şansı +5"],          tags: ["Psi","Vibe"],          atk: 34, def: 28, spd: 60 },
  frigo:        { lore: "Çöl sıcağında bile soğukkanlıdır.",            powers: ["Termal Şok: Hız -15"],                  tags: ["Buz","Dayanıklılık"],   atk: 42, def: 48, spd: 22 },
  vacca:        { lore: "Satürn halkalarının bekçisi.",                 powers: ["Halka Bariyeri: 1 vuruş engeller"],     tags: ["Kozmos","Savunma"],     atk: 40, def: 55, spd: 25 },
  zibra:        { lore: "Zigzag enerjisiyle yıldırım gibi.",            powers: ["Zigzag Atılım: İlk tur hız +20"],       tags: ["Hız","Elektrik"],       atk: 44, def: 33, spd: 72 },
  ballerinaCap: { lore: "Kafeinli adımlarla sahnede.",                  powers: ["Espresso Pirueti: Kombo +1"],           tags: ["Dans","Kafein"],        atk: 52, def: 35, spd: 70 },
  bobrito:      { lore: "Salsa soslu sürprizlerin ustası.",             powers: ["Baharat Tozu: Zırh -10"],               tags: ["Mizah","Kurnaz"],       atk: 46, def: 30, spd: 58 },
  burbaloni:    { lore: "Baloncuk kalkanıyla rakipleri sarar.",         powers: ["Kabarcık Kalkanı: 2 tur -15 hasar"],    tags: ["Kalkan","Kontrol"],     atk: 40, def: 50, spd: 34 },
  bombombini:   { lore: "Mikro şeker bombalarıyla vur-kaç.",            powers: ["Cuk Cuk Bomb: Küçük alan hasarı"],      tags: ["AoE","Şaka"],           atk: 55, def: 32, spd: 52 },
  tralalero:    { lore: "Gizemli koro, mavi timsah ve dev ayak izi.",   powers: ["Koro Çağrısı: Moral +10"],              tags: ["İkonik","Ses"],         atk: 50, def: 44, spd: 48 },
  capAssa:      { lore: "Süt köpüğü yumuşak, bıçak gibi keskin.",       powers: ["Latte Bıçağı: Kritik +30"],             tags: ["Saldırı","Kafein"],     atk: 70, def: 38, spd: 64 },
  chimp:        { lore: "Muz gücüyle akrobatik atlayışlar.",            powers: ["Muz Kaydır: İsabet -10"],               tags: ["Çeviklik","Komik"],     atk: 58, def: 36, spd: 68 },
  boneca:       { lore: "Tılsımlı bez ruhu.",                           powers: ["Bez Büyüsü: Durum temizleme"],           tags: ["Destek","Tılsım"],       atk: 40, def: 46, spd: 40 },
  brr:          { lore: "Kutup davulu ritmiyle dondurur.",              powers: ["Don Davulu: Saldırı -10"],              tags: ["Buz","Ritim"],          atk: 54, def: 42, spd: 38 },
  tatatata:     { lore: "Gece davulu ufka yayılır.",                    powers: ["Sahur Çağrısı: İlk tur enerji +1"],      tags: ["Gece","Ritim"],         atk: 66, def: 48, spd: 52 },
  mateo:        { lore: "Kaybolan yolların rehberi.",                   powers: ["Pusula: Kart çek +1"],                   tags: ["Keşif"],                  atk: 48, def: 44, spd: 60 },
  ecco:         { lore: "Virtüöz nal sesleri sahayı titretiyor.",       powers: ["Viyola Nalı: Epic sinerji +5"],          tags: ["At","Virtüöz"],         atk: 62, def: 45, spd: 58 },
  bombardino:   { lore: "Suda sinsi, karada yırtıcı.",                   powers: ["Timsah Kapanı: Tek hedef hasar"],        tags: ["Yırtıcı","Kıstırma"],   atk: 72, def: 52, spd: 46 },
  tung3sahur:   { lore: "Üç zilde üç kat yankı.",                       powers: ["Üçlü Yankı: Her 3. açılış +1 parça"],    tags: ["Ultimate","Ritim"],      atk: 85, def: 60, spd: 70 },
};

// === Nadirlik teması ===
const RARITY_INFO = {
  Common:    { color: "border-gray-300",  text: "text-gray-800" },
  Rare:      { color: "border-blue-400",  text: "text-blue-700" },
  Epic:      { color: "border-purple-500",text: "text-purple-700" },
  Legendary: { color: "border-amber-500", text: "text-amber-700" },
  Ultimate:  { color: "border-rose-500",  text: "text-rose-700" },
};

// === Paket türleri ===
const PACK_TYPES = {
  normal: { label: "Normal", cost: 10,  size: 1, odds: { Common: 0.70, Rare: 0.20, Epic: 0.09, Legendary: 0.01 }, ultimateFragmentChance: 0.002 },
  medium: { label: "Medium", cost: 25,  size: 1, odds: { Common: 0.60, Rare: 0.22, Epic: 0.14, Legendary: 0.04 }, ultimateFragmentChance: 0.004 },
  large:  { label: "Large",  cost: 50,  size: 1, odds: { Common: 0.50, Rare: 0.22, Epic: 0.22, Legendary: 0.06 }, ultimateFragmentChance: 0.006 },
  mega:   { label: "Mega",   cost: 100, size: 1, odds: { Common: 0.40, Rare: 0.20, Epic: 0.30, Legendary: 0.10 }, ultimateFragmentChance: 0.010 },
};

const PACK_CONFIG = { pityAtLeastRare: false, ultimateFragmentsToComplete: 5, ultimateGlobalCap: 10000 };
const LS_KEY = "ai-evreni-pack-v10";
const LS_ULT_GLOBAL_MINTED = "ai-evreni-ultimate-minted";
const DUST_PACK_COST = 30;
const PITY_THRESHOLD = 9;

// === Yardımcılar ===
function dayKey(){ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function initDailyQuests(){ return [
  { id:"q1", title:"3 paket aç",               progress:0, target:3, reward:{gold:40,dust:4}, done:false, claimed:false },
  { id:"q2", title:"1 Epic+ bul",              progress:0, target:1, reward:{gold:26,dust:3}, done:false, claimed:false },
  { id:"q3", title:"1 Ultimate parçası düşür", progress:0, target:1, reward:{gold:52,dust:6}, done:false, claimed:false },
]; }
function updateQuestProgress(quests,event){ const next=quests.map(q=>({...q})); for(const q of next){ if(q.done) continue; if(q.id==="q1"&&event.type==="PACK_OPENED") q.progress+=1; if(q.id==="q2"&&event.type==="FOUND_RARITY"&&["Epic","Legendary","Ultimate"].includes(event.rarity)) q.progress+=1; if(q.id==="q3"&&event.type==="ULT_FRAGMENT") q.progress+=1; if(q.progress>=q.target) q.done=true; } return next; }
function isWeeklyDiscountDay(){ const d=new Date().getDay(); return d===4; }
function getPackCost(key){ const base = PACK_TYPES[key]?.cost||0; if(!base) return base; return (isWeeklyDiscountDay() && ["medium","large","mega"].includes(key)) ? Math.ceil(base*0.9) : base; }
function weekendBuff(mult=1){ const d=new Date().getDay(); return (d===0||d===6)? mult*1.5 : mult; }
function pickRarity(odds){ const r=Math.random(); const {Common,Rare,Epic,Legendary}=odds; if(r<Legendary) return "Legendary"; if(r<Legendary+Epic) return "Epic"; if(r<Legendary+Epic+Rare) return "Rare"; return "Common"; }
function sampleCard(r){ const list=CARD_POOL.filter(c=>c.rarity===r); return list[Math.floor(Math.random()*list.length)] ?? CARD_POOL[0]; }
function stars(n){ const filled = "★"; const empty  = "☆"; const safeN = Math.max(0, Math.min(5, n|0)); const f = Array(safeN).fill(filled).join(""); const e = Array(5 - safeN).fill(empty).join(""); return f + e; }
function getGlobalMinted(){ const raw=localStorage.getItem(LS_ULT_GLOBAL_MINTED); return raw? (parseInt(raw,10)||0):0; }
function setGlobalMinted(v){ localStorage.setItem(LS_ULT_GLOBAL_MINTED, String(v)); }

const DISENCHANT_DUST = { Common:2, Rare:5, Epic:12, Legendary:25, Ultimate:60 };
function getDisenchantValue(r){ return DISENCHANT_DUST[r]||0; }

function playTone(){ /* sessiz */ }
function playRaritySound(){ /* sessiz */ }

function Shimmer({className=""}){ return (<div className={`relative overflow-hidden bg-slate-200/70 ${className}`}><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"/></div>); }
function MediaImage({src,alt,className="",imgClassName="",ratio="cover"}){ const [loaded,setLoaded]=useState(false); const [error,setError]=useState(false); return (<div className={`relative ${className}`}>{!loaded && !error && <Shimmer className="w-full h-full rounded-xl" />}{!error ? (<img src={src||""} alt={alt||""} loading="lazy" decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer" onLoad={()=>setLoaded(true)} onError={()=>setError(true)} draggable={false} className={`w-full h-full ${ratio==='cover'?'object-cover':'object-contain'} select-none ${loaded? 'opacity-100':'opacity-0'} transition-opacity duration-300 ${imgClassName}`} />) : (<div className="w-full h-full grid place-items-center text-3xl select-none" aria-hidden>?</div>)}</div>); }
function rarityChip(r,extra=""){ const i=RARITY_INFO[r]; return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${i.color} ${extra}`}>{r}</span>; }
function StatBar({label,value}){ return (<div className="w-full text-xs mb-1"><div className="flex justify-between"><span>{label}</span><span>{value}</span></div><div className="h-2 bg-slate-200 rounded"><div className="h-2 rounded bg-gradient-to-r from-slate-700 to-slate-900" style={{width:`${value}%`}}/></div></div>); }

const CARD_WIDTH_CSS = "clamp(168px, 40vw, 256px)";
const AVATAR_BOX_PCT = 0.52;

function CardFront({card}){ const style=RARITY_INFO[card.rarity]; return (
  <div className={`relative rounded-2xl shadow-2xl border ${style.color} bg-white/80 backdrop-blur p-3 flex flex-col items-center justify-center gap-2`} style={{ width: CARD_WIDTH_CSS }}>
    <div className="aspect-[2/3] w-full relative">
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-2">
        <div className="relative rounded-xl border border-white/60 shadow-inner overflow-hidden" style={{ width: `${AVATAR_BOX_PCT*100}%`, aspectRatio: "1 / 1" }}>
          {card.imageUrl ? <MediaImage src={card.imageUrl} alt={card.name} ratio="contain" /> : <div className="w-full h-full grid place-items-center text-5xl">?</div>}
        </div>
        <div className={`text-[clamp(12px,2.8vw,16px)] text-center font-bold ${style.text}`}>{card.name}</div>
        <div className="text-[clamp(10px,2.4vw,13px)] text-slate-700">{stars(card.stars)}</div>
        {rarityChip(card.rarity)}
      </div>
    </div>
  </div>
); }

function CardBack({card}){ const d=CARD_DETAILS[card.id]||{lore:"(Bilgi yok)",powers:[],tags:[],atk:40,def:40,spd:40}; return (
  <div className="relative rounded-2xl shadow-2xl border border-slate-300 bg-white/90 backdrop-blur p-3" style={{ width: CARD_WIDTH_CSS }}>
    <div className="aspect-[2/3] w-full relative">
      <div className="relative w-full h-full flex flex-col">
        <div className="font-bold mb-1 text-[clamp(12px,2.8vw,16px)]">{card.name}</div>
        <div className="text-[clamp(10px,2.4vw,13px)] text-slate-600 mb-2">{stars(card.stars)} - {card.rarity}</div>
        <div className="text-[clamp(11px,2.6vw,14px)] mb-2">{d.lore}</div>
        <div className="mb-2 flex flex-wrap gap-1">{(d.tags||[]).map((t,i)=>(<span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border">{t}</span>))}</div>
        <div className="mb-2">
          <div className="font-semibold text-[clamp(11px,2.6vw,14px)] mb-1">Güçler</div>
          {(d.powers||[]).length? <ul className="list-disc pl-5 text-[clamp(11px,2.6vw,14px)] space-y-1">{d.powers.map((p,i)=>(<li key={i}>{p}</li>))}</ul> : <div className="text-xs text-slate-500">(Henüz güç bilgisi yok)</div>}
        </div>
        <div className="mt-auto">
          <div className="font-semibold text-[clamp(11px,2.6vw,14px)] mb-1">İstatistikler</div>
          <StatBar label="Saldırı" value={d.atk}/>
          <StatBar label="Savunma" value={d.def}/>
          <StatBar label="Hız" value={d.spd}/>
        </div>
      </div>
    </div>
  </div>
); }

function CardReveal({slot,onClose}){
  const [flipped,setFlipped]=useState(false);
  const {card,fragmentFor}=slot||{};
  useEffect(()=>{ if(card) playRaritySound(card.rarity); setFlipped(false); },[card]);
  const particles = Array.from({length:20});
  if(!slot) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.35}} className="relative">
          {particles.map((_,i)=>(
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-white"
              initial={{opacity:1,x:0,y:0,scale:0.6}}
              animate={{opacity:0,x:Math.cos((i/particles.length)*Math.PI*2)*120,y:Math.sin((i/particles.length)*Math.PI*2)*120,scale:1}}
              transition={{duration:0.9, delay:i*0.01}}
            />
          ))}
          <motion.div style={{transformStyle:'preserve-3d'}} className="cursor-pointer" onClick={()=>setFlipped(f=>!f)} animate={{rotateY:flipped?180:0}} transition={{duration:0.5}}>
            <div style={{backfaceVisibility:'hidden', position:'absolute'}}><CardFront card={card}/></div>
            <div style={{backfaceVisibility:'hidden', transform:'rotateY(180deg)'}}><CardBack card={card}/></div>
          </motion.div>
          {fragmentFor && (
            <motion.div initial={{y:-10,opacity:0}} animate={{y:0,opacity:1}} className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] px-2 py-0.5 rounded-full bg-rose-600 text-white border border-rose-300 shadow">Ultimate Parça +1</motion.div>
          )}
          <button onClick={onClose} className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded bg-emerald-600 text-white border border-emerald-300 shadow">Tamam</button>
        </motion.div>
      </div>
    </div>
  );
}

// Detay ekranı için flip'li kart
function FlipCard({card}){
  const [flipped,setFlipped]=useState(false);
  useEffect(()=>{ setFlipped(false); },[card]);
  if(!card) return null;
  return (
    <div className="relative" style={{width: CARD_WIDTH_CSS}}>
      <motion.div style={{transformStyle:'preserve-3d'}} className="cursor-pointer mx-auto" onClick={()=>setFlipped(f=>!f)} animate={{rotateY:flipped?180:0}} transition={{duration:0.45}}>
        <div style={{backfaceVisibility:'hidden', position:'absolute'}}><CardFront card={card}/></div>
        <div style={{backfaceVisibility:'hidden', transform:'rotateY(180deg)'}}><CardBack card={card}/></div>
      </motion.div>
      <div className="text-center text-[11px] text-slate-500 mt-[calc(256px*2/3+56px)]">(Kartı çevirmek için dokun)</div>
    </div>
  );
}

// Sağ panel: kart detay bilgileri + aksiyonlar
function CardInfoPanel({card,onBack,onDisenchant}){
  const d = CARD_DETAILS[card?.id]||{lore:"(Bilgi yok)",powers:[],tags:[],atk:40,def:40,spd:40};
  if(!card) return null;
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-lg font-bold">{card.name}</div>
        {rarityChip(card.rarity, 'ml-1')}
      </div>
      <div className="text-sm text-slate-600 mb-2">{stars(card.stars)} • {card.rarity}</div>
      <div className="mb-3">
        <div className="font-semibold mb-1">Öykü</div>
        <div className="text-sm">{d.lore}</div>
      </div>
      <div className="mb-3">
        <div className="font-semibold mb-1">Etiketler</div>
        <div className="flex flex-wrap gap-1">{(d.tags||[]).map((t,i)=>(<span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border">{t}</span>))}</div>
      </div>
      <div className="mb-3">
        <div className="font-semibold mb-1">Güçler</div>
        {(d.powers||[]).length? <ul className="list-disc pl-5 text-sm space-y-1">{d.powers.map((p,i)=>(<li key={i}>{p}</li>))}</ul> : <div className="text-xs text-slate-500">(Henüz güç bilgisi yok)</div>}
      </div>
      <div className="mb-4">
        <div className="font-semibold mb-1">İstatistikler</div>
        <StatBar label="Saldırı" value={d.atk}/>
        <StatBar label="Savunma" value={d.def}/>
        <StatBar label="Hız" value={d.spd}/>
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} className="px-3 py-1.5 rounded bg-slate-100 border">Geri</button>
        <button onClick={onDisenchant} className="px-3 py-1.5 rounded bg-rose-600 text-white border border-rose-300">Parçala</button>
      </div>
    </div>
  );
}

// Ek self-tests (Unicode ve pity kontrolü)
function runSelfTests(){
  try{
    console.group("[AI Evreni] Self Tests v10.6");
    const s0 = stars(0), s3 = stars(3), s5 = stars(5);
    console.assert(s0 === "☆☆☆☆☆" && s3 === "★★★☆☆" && s5 === "★★★★★", "stars() unicode");
    const sum = 0.70+0.20+0.09+0.01; console.assert(Math.abs(sum-1) < 1e-9, 'odds sum');
    let pity = 9; // zorla epic
    const dummy = { odds: PACK_TYPES.medium.odds, ultimateFragmentChance: 0 };
    const resR = (function(){ const r = (pity >= 9) ? 'Epic' : pickRarity(dummy.odds); return r; })();
    console.assert(["Common","Rare","Epic","Legendary"].includes(resR), "rarity pick");
  }catch(e){ console.error("Self test error:", e);} finally { console.groupEnd(); }
}

function ConfirmModal({title,desc,confirmText,onClose,onConfirm}){
  return (
    <ModalShell title={title} onClose={onClose} wClass="max-w-[520px]">
      <p className="text-sm text-slate-700 mb-3">{desc}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1.5 rounded bg-slate-100 border">Vazgeç</button>
        <button onClick={()=>{ onConfirm(); onClose(); }} className="px-3 py-1.5 rounded bg-rose-600 text-white border border-rose-300">{confirmText}</button>
      </div>
    </ModalShell>
  );
}

// === Modal Shell ===
function ModalShell({title,onClose,children,wClass="max-w-[1400px]"}){
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} className={`bg-white/90 backdrop-blur rounded-2xl border shadow-xl w-[min(96vw,1400px)] ${wClass} max-h-[90vh] overflow-auto`}>
          <div className="p-3 border-b flex items-center justify-between"><div className="font-bold">{title}</div><button className="text-xs px-2 py-1 rounded bg-slate-100 border" onClick={onClose}>Kapat</button></div>
          <div className="p-4">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

// === Pack Tile ===
function PackTile({label,img,onOpen,disabled}){
  return (
    <motion.button 
      whileHover={{scale:disabled?1:1.02}} 
      whileTap={{scale:disabled?1:0.98}}
      disabled={disabled} onClick={onOpen}
      className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border ${disabled? 'opacity-50 cursor-not-allowed':'cursor-pointer'}`}>
      <MediaImage src={img} alt={label} className="w-full h-full" imgClassName="object-cover" ratio="cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"/>
      <div className="absolute bottom-2 left-2 right-2 text-center text-white font-extrabold drop-shadow text-[clamp(12px,3.2vw,16px)]">{label}</div>
    </motion.button>
  );
}

// === Craft Panel ===
function CraftingPanel({onOpenDustPack,dust}){
  return (
    <div className="bg-white/80 backdrop-blur border rounded-xl p-3">
      <div className="font-semibold mb-1">Crafting Atölyesi</div>
      <div className="text-sm text-slate-600 mb-2">Dust: <b>{dust}</b></div>
      <div className="text-xs text-slate-500 mb-3">Dust paketi Medium/Large/Mega oranlarından rasgele kart verir (tek açılış).</div>
      <button onClick={onOpenDustPack} disabled={dust < DUST_PACK_COST} className={`px-3 py-2 rounded-xl border text-sm ${dust < DUST_PACK_COST ? 'bg-gray-100 text-gray-400':'bg-emerald-600 text-white'}`}>Toz Paketi Aç (−{DUST_PACK_COST} dust)</button>
    </div>
  );
}

export default function AIEvreniPackGame(){
  const [state,setState] = useState(()=>{
    try{ const raw=localStorage.getItem(LS_KEY); if(raw) return JSON.parse(raw); }catch{}
    return { gold:700, inventory:{}, fragments:{}, openedPacks:0, ultimatesOwned:{}, dust:0, quests:initDailyQuests(), lastQuestDay:dayKey(), lastLoginRewardDay:null, loginStreak:0, pityEpic:0 };
  });
  const [pendingSlot,setPendingSlot] = useState(null);
  const [showCollection,setShowCollection] = useState(false);
  const [showBag,setShowBag] = useState(false);
  const [showQuests,setShowQuests] = useState(false);
  const [showCraft,setShowCraft] = useState(false);
  const [detailId,setDetailId] = useState(null);
  const [confirmDisenchant,setConfirmDisenchant] = useState(null);

  const [q,setQ] = useState("");
  const [rarityFilter,setRarityFilter] = useState("All");
  const [sortKey,setSortKey] = useState("rarity");

  const distinctCount = useMemo(()=> new Set([...(Object.keys(state.inventory||{})), ...(Object.keys(state.ultimatesOwned||{}))]).size,[state.inventory,state.ultimatesOwned]);

  useEffect(()=>{ if(state.lastQuestDay!==dayKey()) setState(s=>({...s, quests:initDailyQuests(), lastQuestDay:dayKey()})); },[]);
  useEffect(()=>{ runSelfTests(); },[]);
  useEffect(()=>{ localStorage.setItem(LS_KEY, JSON.stringify(state)); },[state]);

  function addGold(n){ setState(s=>({...s, gold: Math.max(0, (s.gold||0) + n)})); }
  function addDust(n){ setState(s=>({...s, dust: Math.max(0, (s.dust||0) + n)})); }

  function rollSlot(pack){
    const forceEpic = state.pityEpic >= PITY_THRESHOLD;
    const gotFrag=Math.random()< (pack.ultimateFragmentChance||0) * weekendBuff(1);
    const rarity = forceEpic ? 'Epic' : pickRarity(pack.odds);
    const card=sampleCard(rarity);
    const fragmentFor=gotFrag? ULTIMATE_IDS[Math.floor(Math.random()*ULTIMATE_IDS.length)] : null;
    return { card, fragmentFor, forced: forceEpic };
  }

  function openPackFlow(key){
    const pack = PACK_TYPES[key]; if(!pack) return; const price = getPackCost(key); if(state.gold<price) return; addGold(-price);
    const slot = rollSlot(pack);
    setTimeout(()=> setPendingSlot(slot), 200);
    let qs = updateQuestProgress(state.quests,{type:"PACK_OPENED"});
    qs = updateQuestProgress(qs,{type:"FOUND_RARITY",rarity:slot.card.rarity});
    if(slot.fragmentFor) qs = updateQuestProgress(qs,{type:"ULT_FRAGMENT"});
    setState(s=>({
      ...s,
      pityEpic: (slot.card.rarity==='Epic' || slot.card.rarity==='Legendary' || slot.card.rarity==='Ultimate' || slot.forced) ? 0 : Math.min(PITY_THRESHOLD, (s.pityEpic||0)+1),
      quests: qs
    }));
  }

  function openDustPack(){
    if((state.dust||0) < DUST_PACK_COST) return;
    addDust(-DUST_PACK_COST);
    const pool = ["medium","large","mega"]; 
    const key = pool[Math.floor(Math.random()*pool.length)];
    const pack = PACK_TYPES[key];
    const slot = rollSlot(pack);
    setTimeout(()=> setPendingSlot(slot), 150);
    let qs = updateQuestProgress(state.quests,{type:"PACK_OPENED"});
    qs = updateQuestProgress(qs,{type:"FOUND_RARITY",rarity:slot.card.rarity});
    if(slot.fragmentFor) qs = updateQuestProgress(qs,{type:"ULT_FRAGMENT"});
    setState(s=>({
      ...s,
      pityEpic: (slot.card.rarity==='Epic' || slot.card.rarity==='Legendary' || slot.card.rarity==='Ultimate' || slot.forced) ? 0 : Math.min(PITY_THRESHOLD, (s.pityEpic||0)+1),
      quests: qs
    }));
  }

  function finalizeReveal(){
    const slot=pendingSlot; if(!slot) return; setPendingSlot(null);
    setState(s=>{
      const inv={...s.inventory}; const fr={...s.fragments}; const ult={...s.ultimatesOwned}; let minted=getGlobalMinted();
      const card=slot.card;
      if(!inv[card.id] && card.rarity!=="Ultimate") inv[card.id]=1;
      if(slot.fragmentFor){ const id=slot.fragmentFor; fr[id]=(fr[id]||0)+1; if(fr[id]>=PACK_CONFIG.ultimateFragmentsToComplete && !ult[id]){ if(minted<PACK_CONFIG.ultimateGlobalCap){ ult[id]=true; inv[id]=1; minted+=1; setGlobalMinted(minted); } } }
      return { ...s, inventory:inv, fragments:fr, ultimatesOwned:ult, openedPacks:s.openedPacks+1 };
    });
  }

  function claimDailyLogin(){ setState(s=>{ if(s.lastLoginRewardDay===dayKey()) return s; const nextStreak = (s.lastLoginRewardDay === null || s.lastLoginRewardDay === dayKey()) ? (s.loginStreak||0)+1 : 1; const bonusGold = 20 + 10*Math.min(7, nextStreak); const bonusDust = Math.floor(nextStreak/3); return { ...s, gold: (s.gold||0) + bonusGold, dust: (s.dust||0) + bonusDust, lastLoginRewardDay: dayKey(), loginStreak: nextStreak }; }); }

  function openDetail(id){ setDetailId(id); }
  function closeDetail(){ setDetailId(null); }

  function disenchant(id){
    const card = CARD_POOL.find(c=>c.id===id); if(!card) return;
    if(card.rarity==='Ultimate') { alert('Ultimate kartlar parçalanamaz.'); return; }
    setConfirmDisenchant({ id, value: getDisenchantValue(card.rarity) });
  }
  function doDisenchant(id){ const card = CARD_POOL.find(c=>c.id===id); if(!card) return; const value = getDisenchantValue(card.rarity); setState(s=>{ const inv = {...s.inventory}; if(!inv[id]) return s; delete inv[id]; const newDust = (s.dust||0) + value; return { ...s, inventory: inv, dust: newDust }; }); setDetailId(null); }

  function claimQuest(id){
    setState(s=>{
      const qs = s.quests.map(q=>({...q}));
      const q = qs.find(x=>x.id===id);
      let g=s.gold, d=s.dust||0;
      if(q && q.done && !q.claimed){ if(q.reward.gold) g+=q.reward.gold; if(q.reward.dust) d+=q.reward.dust; q.claimed=true; }
      return { ...s, quests: qs, gold: g, dust: d };
    });
  }

  const fragmentList = useMemo(()=> ULTIMATE_IDS.map(id=>({ id, have:state.fragments[id]||0, need:PACK_CONFIG.ultimateFragmentsToComplete, owned:!!state.ultimatesOwned[id] })), [state.fragments,state.ultimatesOwned]);
  const selectedCard = useMemo(()=> detailId ? CARD_POOL.find(c=>c.id===detailId) || null : null, [detailId]);

  const collectionList = useMemo(()=>{
    const list = CARD_POOL.filter(c=>state.inventory[c.id]||state.ultimatesOwned[c.id]);
    const term = q.trim().toLowerCase();
    const filtered = list.filter(c=>{
      if(rarityFilter!=="All" && c.rarity!==rarityFilter) return false;
      if(term && !c.name.toLowerCase().includes(term)) return false;
      return true;
    });
    const order = {Common:0,Rare:1,Epic:2,Legendary:3,Ultimate:4};
    filtered.sort((a,b)=>{
      if(sortKey==='name') return a.name.localeCompare(b.name);
      if(sortKey==='stars') return (b.stars||0)-(a.stars||0);
      return order[a.rarity]-order[b.rarity];
    });
    return filtered;
  }, [state.inventory,state.ultimatesOwned,q,rarityFilter,sortKey]);

  return (
    <div className="min-h-screen relative text-slate-800">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-2 flex items-center gap-2">
          <div className="font-extrabold tracking-tight text-base md:text-lg">AI Evreni Kart Paketi</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={claimDailyLogin} className={`px-2 py-1 rounded text-xs md:text-sm ${state.lastLoginRewardDay!==dayKey()?'bg-emerald-600 text-white':'bg-gray-200 text-gray-500'}`}>Giriş Bonusu</button>
            <div className="px-2 py-1 rounded bg-white border text-sm" title="Günlük seri">Streak <b>{state.loginStreak||0}</b></div>
            <div className="px-2 py-1 rounded bg-white border text-sm">Gold <b>{state.gold}</b></div>
            <div className="px-2 py-1 rounded bg-white border text-sm">Dust <b>{state.dust||0}</b></div>
            <button onClick={()=>setShowCollection(true)} className="px-2 py-1 rounded bg-slate-800 text-white text-xs md:text-sm">Koleksiyon ({distinctCount})</button>
            <button onClick={()=>setShowBag(true)} className="px-2 py-1 rounded bg-slate-700 text-white text-xs md:text-sm">Çanta</button>
            <button onClick={()=>setShowQuests(true)} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs md:text-sm">Görevler</button>
            <button onClick={()=>setShowCraft(true)} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs md:text-sm">Craft</button>
            <button onClick={()=>{ localStorage.removeItem(LS_KEY); window.location.reload(); }} className="px-2 py-1 rounded bg-rose-600 text-white text-xs md:text-sm">Sıfırla</button>
          </div>
        </div>
      </div>

      {/* Hub */}
      <main className="relative max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border text-[11px]">SEZON 1 - AI EVRENİ</div>
          <h1 className="mt-3 text-2xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-rose-500 to-emerald-600">Brainrot Karakterleri - Kart Paketleri</h1>
          <p className="mt-2 text-slate-700 max-w-3xl mx-auto text-sm md:text-base">Paket görseline tıkla, kart merkezde açılır. Kartın üstüne tıklayarak ön/arka yüze geç. "Tamam" ile kapatınca koleksiyona eklenir. 5 parça bir Ultimate eder. Epic pity aktif (10. en az Epic).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(PACK_TYPES).map(([key,pack])=> (
            <PackTile
              key={key}
              label={`${pack.label} - ${getPackCost(key)} Gold${isWeeklyDiscountDay() && ["medium","large","mega"].includes(key) ? " (-10%)" : ""}`}
              img={PACK_IMAGES[key]}
              onOpen={()=>openPackFlow(key)}
              disabled={state.gold < getPackCost(key)}
            />
          ))}
        </div>

        {/* İstatistikler */}
        <div className="mt-6 md:mt-8 grid md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white/80 backdrop-blur border rounded-2xl p-3 md:p-4 shadow-sm"><div className="text-xs text-slate-500 mb-1">Açılan Paket</div><div className="text-2xl font-bold">{state.openedPacks}</div></div>
          <div className="bg-white/80 backdrop-blur border rounded-2xl p-3 md:p-4 shadow-sm"><div className="text-xs text-slate-500 mb-1">Koleksiyondaki Kart</div><div className="text-2xl font-bold">{distinctCount}</div></div>
          <div className="bg-white/80 backdrop-blur border rounded-2xl p-3 md:p-4 shadow-sm"><div className="text-xs text-slate-500 mb-1">Ultimate Basılan (demo)</div><div className="text-2xl font-bold">{getGlobalMinted()} / {PACK_CONFIG.ultimateGlobalCap}</div></div>
        </div>

        {/* Ultimate Parçalar */}
        <div className="mt-6 md:mt-8">
          <h3 className="text-lg font-semibold mb-2">Ultimate Parça Durumu</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {fragmentList.map(({id,have,need,owned})=>{ const c=CARD_POOL.find(x=>x.id===id); if(!c) return null; return (
              <div key={id} className="bg-white/80 backdrop-blur border rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  {c.imageUrl ? <MediaImage src={c.imageUrl} alt={c.name} className="w-10 h-10"/> : <div className="text-2xl">?</div>}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{c.name} {owned && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700">TAMAMLANDI</span>}</div>
                  <div className="text-xs text-slate-600">Parça: <b>{have}</b> / {need}</div>
                </div>
              </div>
            ); })}
          </div>
        </div>
      </main>

      {/* Reveal (Kart) */}
      <AnimatePresence>
        {pendingSlot && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <CardReveal slot={pendingSlot} onClose={finalizeReveal}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Koleksiyon Modal */}
      {showCollection && (
        <ModalShell title="Koleksiyon" onClose={()=>setShowCollection(false)} wClass="max-w-[1400px] mx-auto">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ara" className="px-2 py-1 border rounded"/>
            <select value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)} className="px-2 py-1 border rounded">
              <option>All</option><option>Common</option><option>Rare</option><option>Epic</option><option>Legendary</option><option>Ultimate</option>
            </select>
            <select value={sortKey} onChange={e=>setSortKey(e.target.value)} className="px-2 py-1 border rounded">
              <option value="rarity">Nadirlik</option>
              <option value="name">İsim</option>
              <option value="stars">Yıldız</option>
            </select>
          </div>
          {!collectionList.length ? <div className="text-sm text-slate-600">Henüz kart yok.</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {collectionList.map(c=>{
                const s=RARITY_INFO[c.rarity];
                return (
                  <button key={c.id} onClick={()=>openDetail(c.id)} className={`flex items-center gap-3 p-3 bg-white/80 backdrop-blur border ${s.color} rounded-xl shadow-sm hover:shadow transition`}>
                    <div className="w-10 h-10 flex items-center justify-center">{c.imageUrl ? <MediaImage src={c.imageUrl} alt={c.name} className="w-10 h-10"/> : <div className="text-2xl">?</div>}</div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold truncate">{c.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2"><span>{stars(c.stars)}</span>{rarityChip(c.rarity)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ModalShell>
      )}

      {/* Çanta Modal */}
      {showBag && (
        <ModalShell title="Çanta" onClose={()=>setShowBag(false)} wClass="max-w-[1400px]">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white/80 backdrop-blur border rounded-xl p-3">
              <div className="font-semibold mb-1">Kaynaklar</div>
              <div className="text-sm">Dust: <b>{state.dust||0}</b></div>
              <button onClick={()=>setShowCraft(true)} className="mt-2 px-2 py-1 rounded bg-emerald-600 text-white text-xs">Craft'a Git</button>
            </div>
            <div className="md:col-span-2 bg-white/80 backdrop-blur border rounded-xl p-3">
              <div className="font-semibold mb-2">Ultimate Parçaları</div>
              {!fragmentList.length ? <div className="text-sm text-slate-600">Parça yok.</div> : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fragmentList.map(({id,have,need,owned})=>{ const c=CARD_POOL.find(x=>x.id===id); if(!c) return null; return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur border rounded-xl">
                      <div className="w-10 h-10 flex items-center justify-center">{c.imageUrl ? <MediaImage src={c.imageUrl} alt={c.name} className="w-10 h-10"/> : <div className="text-2xl">?</div>}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{c.name} {owned && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700">TAMAMLANDI</span>}</div>
                        <div className="text-xs text-slate-600">Parça: <b>{have}</b> / {need}</div>
                      </div>
                    </div>
                  ); })}
                </div>
              )}
            </div>
          </div>
        </ModalShell>
      )}

      {/* Görevler */}
      {showQuests && (
        <ModalShell title="Günlük Görevler" onClose={()=>setShowQuests(false)} wClass="max-w-[900px]">
          {state.quests.map(q=> (
            <div key={q.id} className="border rounded-lg p-2 mb-2 bg-white/80 backdrop-blur">
              <div className="text-sm font-medium">{q.title}</div>
              <div className="text-xs text-slate-600 mb-1">{q.progress} / {q.target}</div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-500">Ödül: {q.reward.gold||0} Gold + {q.reward.dust||0} Dust</div>
                <button onClick={()=>claimQuest(q.id)} disabled={!q.done || q.claimed} className={`px-2 py-1 rounded text-xs ${q.done && !q.claimed ? 'bg-emerald-600 text-white':'bg-gray-200 text-gray-500'}`}>{q.claimed? 'Alındı' : 'Ödülü Al'}</button>
              </div>
            </div>
          ))}
          <div className="text-[11px] text-slate-500">Günlük reset: tarayıcı saatine göre gün başında.</div>
        </ModalShell>
      )}

      {/* Craft */}
      {showCraft && (
        <ModalShell title="Crafting" onClose={()=>setShowCraft(false)} wClass="max-w-[900px]">
          <CraftingPanel onOpenDustPack={openDustPack} dust={state.dust||0} />
        </ModalShell>
      )}

      {/* Kart Detayı */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ModalShell title={selectedCard.name} onClose={closeDetail} wClass="max-w-[1400px]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="flex justify-center"><FlipCard card={selectedCard} /></div>
                <CardInfoPanel card={selectedCard} onBack={closeDetail} onDisenchant={()=>disenchant(selectedCard.id)} />
              </div>
            </ModalShell>
          </motion.div>
        )}
      </AnimatePresence>

      {confirmDisenchant && (
        <ConfirmModal
          title="Parçala?"
          desc={`Bu kartı parçalarsan ${getDisenchantValue((CARD_POOL.find(c=>c.id===confirmDisenchant.id)||{}).rarity||'Common')} toz kazanacaksın. Onaylıyor musun?`}
          confirmText="Parçala"
          onClose={()=>setConfirmDisenchant(null)}
          onConfirm={()=>doDisenchant(confirmDisenchant.id)}
        />
      )}

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%);} }
      `}</style>
    </div>
  );
}
