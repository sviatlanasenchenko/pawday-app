(function(){
// При CAT_MIN = 3 порода проходит; карточка предупреждает о постепенном
// знакомстве с кошкой. Породная оценка не гарантирует совместимость.
const CAT_MIN = 4;
const QUESTION_ORDER = ['family','home','size','experience','alone','walk','leash','care','budget','noise','adoption','goal','activity','training','allergy'];
const PREFERENCE_OPTIONS = {
 sizes:[['small'],['medium'],['large'],['giant'],['any']],
 housing:['apartment','house_no_yard','house_fenced_yard','outdoor_enclosure'],
 leash:['off_leash','leash','unsure'],grooming:['minimal','regular'],
 careBudget:['economy','regular','unsure'],barking:['no_frequent','ok'],
 breedType:['all','mixes_only','purebred_only']
};
// =====================================================================
// Подбор породы собаки — версия 6 (подсказки вместо пустой выдачи)
// Порядок: жёсткие фильтры → баллы 0..1 по критериям → штрафы →
//          разнообразие выдачи → объяснения
// =====================================================================

/* ---------- ВАРИАНТЫ ОТВЕТОВ (ID для кода) ----------
 1  purpose      "family" | "adventure" | "sport" | "unsure"
 2  sizes        ["small","medium","large","giant"] или ["any"]
 3  housing      "apartment" | "house_no_yard" | "house_fenced_yard" | "outdoor_enclosure"
 4  household    массив: "adults_only","kids_under6","kids_under16","cats_other_pets","other_dog"
 5  experience   "first" | "had_dog" | "trained_self"
 6  hoursAlone   "2_4" | "4_6" | "6_plus"
 7  walkTime     "30m" | "1h" | "2h" | "3h_plus"
 8  activity     "slow_walks" | "park_play" | "sport"
 9  trainingTime "under15" | "15_30" | "30_60"
 10 leash        "off_leash" | "leash" | "unsure"
 11 barking      "no_frequent" (не готов мириться) | "ok" (готов мириться)
 12 grooming     "minimal" | "brush_self" | "groomer_ok"   (старое "regular" = "brush_self")
 13 careBudget   "economy" | "regular" | "unsure"
 14 breedType    "all" | "mixes_only" | "purebred_only"
 15 shedding     "minimal" | "some_ok" | "dont_care"          — шерсть в доме
 16 priorities   массив из 1–2 значений (что главное):
                 "kids" | "low_shedding" | "calm" | "easy_training" | "low_cost" | "pets" | "alone" | "active"
*/

/* ---------- ПОЛЯ ПОРОДЫ В БАЗЕ (шкала 1..5, если не указано иное) ----------
 name, size ("small"|"medium"|"large"|"giant"), weightKg (число), isMixed (bool)
 energy             — сколько физической активности нужно
 endurance          — выносливость (походы, бег)
 trainability       — насколько легко обучается
 mentalNeeds        — сколько занятий/игр для головы нужно
 experienceNeeded   — насколько сложна для новичка
 goodWithYoungKids  — дети до 6 лет
 goodWithOlderKids  — дети до 16 лет
 goodWithCats, goodWithDogs
 apartmentFriendly
 outdoorSuitable    (bool) — может жить в вольере круглый год
 aloneTolerance
 offLeashReliability — подзыв, низкий охотничий инстинкт
 barking, grooming
 careCost           — стоимость ухода (1 = эконом, 5 = дорого)
 adaptability       — спокойно переносит новые места и перемены
 walkMinutes        — порог прогулки в минутах в день (колонка «Порог прогулки, мин»)
 shedding           — линька (1..5)
 professionalGrooming (bool) — нужна регулярная стрижка у грумера
 exposureBoost      — поправка на частоту показа, считается функцией calibrateExposure()
*/

const TIER_WIDTH = 0.05; // баллы в пределах 5% считаются равными

// Ответ → "сколько может дать человек" (0..1)
const WALK_MIN = { "30m": 30, "1h": 60, "2h": 120, "3h_plus": 180 };
const WALK = { "30m": 0.2, "1h": 0.45, "2h": 0.75, "3h_plus": 1 }; // запасной вариант, если у породы нет порога в минутах
const ACTIVITY = { slow_walks: 0.2, park_play: 0.55, sport: 1 };
const TRAINING = { under15: 0.2, "15_30": 0.55, "30_60": 1 };
const EXPERIENCE = { first: 0.2, had_dog: 0.55, trained_self: 1 };
const ALONE = { "2_4": 0.3, "4_6": 0.6, "6_plus": 0.9 }; // сколько одиночества должна вынести собака

const WEIGHTS = { trainingEase: 3, endurance: 3, health: 2, individual: 2,
  purpose: 3.5, walk: 3, energy: 2, training: 2, experience: 2,
  youngKids: 3, olderKids: 2, cats: 2, dogs: 2,
  housing: 2, alone: 2, leash: 1.5, barking: 2.5,
  grooming: 1.5, budget: 2, shedding: 2, groomer: 1.5, calm: 2, easy: 2,
};

const LABELS = {
  purpose: "your goals", walk: "daily walks", energy: "activity level", training: "training time",
  experience: "owner experience", youngKids: "young children", olderKids: "older children",
  cats: "cats and other pets", dogs: "other dogs", housing: "living space",
  alone: "time alone", leash: "off-leash walks", barking: "noise",
  grooming: "grooming", budget: "care budget", shedding: "little shedding", groomer: "groomer visits", calm: "calm at home", easy: "easy to train",
};

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const n5 = (v) => clamp01((Number(v) - 1) / 4);
const norm = (s) => String(s ?? "").trim().toLowerCase();

// demand — сколько требуется, capacity — сколько есть.
// Нехватка штрафуется сильно, избыток — слабо.
function fit(demand, capacity, shortPenalty = 1.5, excessPenalty = 0) {
  const d = demand - capacity;
  return clamp01(1 - (d > 0 ? d * shortPenalty : -d * excessPenalty));
}

/* ---------- 1. ЖЁСТКИЕ ФИЛЬТРЫ ---------- */
// Возвращает причину исключения или null
function hardFilterReason(b, a) {
  const sizes = (a.sizes || []).map(norm);
  if (sizes.length && !sizes.includes("any") && !sizes.includes(norm(b.size))) return "size";
  if (a.breedType === "mixes_only" && !b.isMixed) return "breedType";
  if (a.breedType === "purebred_only" && b.isMixed) return "breedType";
  if (a.housing === "outdoor_enclosure" && !b.outdoorSuitable) return "housing";
  const hh = a.household || [];
  if (hh.includes("kids_under6") && b.goodWithYoungKids <= 1) return "kids";
  if (hh.includes("other_dog") && b.goodWithDogs <= 1) return "dogs";
  return null;
}

/* ---------- 2. СООТВЕТСТВИЕ ПО КРИТЕРИЯМ ---------- */
// User-proposed exponential model. The coefficient is editorial, not a
// veterinary dose or a calibrated probability. Unknown is never fabricated.
function calculateWalkTimeScore(userMinutes, requiredMinutes, exclusive=false) {
  if(!Number.isFinite(userMinutes)||userMinutes<0||!Number.isFinite(requiredMinutes)||requiredMinutes<=0)return null;
  if(userMinutes>=requiredMinutes)return exclusive&&userMinutes===requiredMinutes?.5:1;
  return Math.exp(-.035*(requiredMinutes-userMinutes));
}
function walkCapacity(a){return a.daily_walk_minutes!==undefined?a.daily_walk_minutes:WALK_MIN[a.walkTime];}
function trainingFit(b,a){return fit(n5(b.mentalNeeds),TRAINING[a.trainingTime],1.5,0);}
function calculateHousingScore(a,b){
  if(a.housing!=='apartment'&&a.living_space!=='apartment')return 1;
  let score=1;
  if((b.barking??b.barking_level)>=4)score*=.7;
  // Do not substitute outdoor energy needs for activity inside the home.
  if((b.indoorActivityLevel??b.indoor_activity_level)>=4)score*=.75;
  if(b.apartmentFriendly===1)score*=.5;
  return score;
}
function evaluateCoatAndShedding(a,b){
  let score=1;
  if(a.low_shedding_preferred||['some_ok','prefer_low'].includes(a.shedding)){
    const shedding=b.shedding??b.shedding_level;
    if(!Number.isFinite(shedding)||b.sheddingUncertain)score*=.5;
    else if(shedding>=4)score*=.4;
  }
  if(a.grooming==='minimal'||a.max_grooming_time==='low'){
    if((b.grooming??0)>=4||b.grooming_needs==='high'||b.professionalGrooming||b.dailySkinCare)score*=.6;
  }
  // Neither a hypoallergenic label nor an undercoat establishes allergy safety.
  return {score,allergyReviewRequired:a.has_allergy===true||['yes','unsure'].includes(a.allergy)};
}
function criterionFits(b, a) {
  const f = {};
  const hh = a.household || [];

  // Q1 — цель
  if (a.purpose === "family") f.purpose = (n5(b.goodWithOlderKids) + n5(b.adaptability) + (1 - Math.abs(n5(b.energy) - 0.5))) / 3;
  if (a.purpose === "adventure") f.purpose = (2 * n5(b.endurance) + n5(b.energy) + n5(b.adaptability)) / 4;
  if (a.purpose === "sport") f.purpose = (n5(b.endurance) + n5(b.trainability) + n5(b.mentalNeeds) + n5(b.energy)) / 4;

  // Q7 — сколько минут в день человек может гулять, против порога породы в минутах
  f.walk=calculateWalkTimeScore(walkCapacity(a),b.walkMinutes,b.exerciseMinimumExclusive)??NaN;

  // Q8 — чем заниматься вместе: тип активности против энергичности породы
  if (a.activity && ACTIVITY[a.activity] != null) {
    f.energy = fit(n5(b.energy), ACTIVITY[a.activity], 1.2, 0.8);
  }


  // Q9 — время на игры и обучение
  if (a.trainingTime) f.training = fit(n5(b.mentalNeeds), TRAINING[a.trainingTime], 1.5, 0.6);

  // Q5 — опыт
  if (a.experience) f.experience = fit(n5(b.experienceNeeded), EXPERIENCE[a.experience], 2);

  // Q4 — кто живёт с собакой (несколько вариантов)
  if (hh.includes("kids_under6")) f.youngKids = n5(b.goodWithYoungKids);
  if (hh.includes("kids_under16")) f.olderKids = n5(b.goodWithOlderKids);
  if (hh.includes("cats_other_pets")) f.cats = n5(b.goodWithCats);
  if (hh.includes("other_dog")) f.dogs = n5(b.goodWithDogs);

  // Q3 — жильё
  if (a.housing) {
    const af = n5(b.apartmentFriendly);
    f.housing = { apartment: af, house_no_yard: 0.4 + 0.6 * af, house_fenced_yard: 1, outdoor_enclosure: 1 }[a.housing] ?? 1;
  }

  // Q6 — одна дома
  if (a.hoursAlone) f.alone = fit(ALONE[a.hoursAlone], n5(b.aloneTolerance));

  // Q10 — без поводка
  if (a.leash === "off_leash") f.leash = n5(b.offLeashReliability);
  if (a.leash === "unsure") f.leash = 0.5 + 0.5 * n5(b.offLeashReliability);

  // Q11 — лай
  if (a.barking === "no_frequent") f.barking = fit(n5(b.barking), 0.3);

  // Q12 — уход за шерстью: время на уход и готовность к грумеру
  const groomAns = a.grooming === "regular" ? "brush_self" : a.grooming;
  if (groomAns === "minimal") {
    f.grooming = fit(n5(b.grooming), 0.3);
    f.groomer = b.professionalGrooming ? 0.2 : 1;
  }
  if (groomAns === "brush_self") f.groomer = b.professionalGrooming ? 0.4 : 1;

  // Q13 — бюджет на уход: регулярный грумер делает содержание заметно дороже
  if (a.careBudget === "economy") f.budget = fit(n5(b.careCost), 0.3) * (b.professionalGrooming ? 0.7 : 1);

  // Q15 — шерсть в доме
  if (b.shedding != null) {
    if (a.shedding === "minimal") f.shedding = fit(n5(b.shedding), 0.1, 2);
    if (a.shedding === "some_ok") f.shedding = fit(n5(b.shedding), 0.6, 1.2);
  }

  // Q16 — приоритеты, у которых нет своего вопроса: добавляются только если выбраны
  const pr = a.priorities || [];
  // «Спокойная дома» — только про энергичность. Лай решается вопросом 11:
  // если человек не готов мириться с лаем, этот критерий уже есть и получит двойной вес
  if (pr.includes("calm")) f.calm = 1 - n5(b.energy);
  if (pr.includes("easy_training")) f.easy = (n5(b.trainability) + 1 - n5(b.experienceNeeded)) / 2;
  // Приоритет работает, даже если в своём вопросе человек ответил нейтрально
  if (pr.includes("low_shedding") && f.shedding == null && b.shedding != null) f.shedding = fit(n5(b.shedding), 0.1, 2);
  if (pr.includes("low_cost") && f.budget == null) f.budget = fit(n5(b.careCost), 0.3) * (b.professionalGrooming ? 0.7 : 1);
  if (pr.includes("low_cost") && f.groomer == null) f.groomer = b.professionalGrooming ? 0.4 : 1;


  if(Array.isArray(a.purpose)){
    const values=a.purpose.map(p=>criterionFits(b,{...a,purpose:p,activity:undefined}).purpose).filter(Number.isFinite);
    if(values.length)f.purpose=values.reduce((x,y)=>x+y,0)/values.length;
  }
  if(Array.isArray(a.activity)&&a.activity.length){
    const selected=a.activity.filter(k=>ACTIVITY[k]!=null).sort((x,y)=>ACTIVITY[y]-ACTIVITY[x])[0];
    if(selected)f.energy=fit(n5(b.energy),ACTIVITY[selected],1.2,.8);
  }
  if(a.experience==='first'||a.experience==='had_dog')f.trainingEase=(n5(b.trainability)+1-n5(b.experienceNeeded))/2;
  const acts=Array.isArray(a.activity)?a.activity:[a.activity];
  const goals=Array.isArray(a.purpose)?a.purpose:[a.purpose];
  if(acts.includes('sport')||goals.includes('adventure')||goals.includes('sport'))f.endurance=n5(b.endurance);
  if(a.careBudget==='unsure')f.budget=fit(n5(b.careCost),.5);
  // Capacity is an upper limit, not a requirement to exhaust the dog.
  if(TRAINING[a.trainingTime]!=null)f.training=trainingFit(b,a);
  if(a.experience==='had_dog')f.experience=fit(n5(b.experienceNeeded),EXPERIENCE.first,2);
  // The UI asks willingness to spend grooming time, not refusal to use a groomer.
  if(a.grooming==='regular')delete f.groomer;
  if(a.grooming==='minimal'&&b.dailySkinCare)f.grooming=Math.min(f.grooming??1,.4);
  if(a.careBudget==='unsure')delete f.budget;
  // A high breed tolerance rating cannot establish safe six-hour absences.
  if(a.hoursAlone==='4_6')f.alone=Math.min(f.alone,.5);
  if(a.hoursAlone==='6_plus')f.alone=Math.min(f.alone,.25);
  if(a.housing==='outdoor_enclosure')f.housing=.5; // climate/shelter/social contact are not established by this quiz
  if(a.housing==='apartment')f.housing=calculateHousingScore(a,b);
  // Family companionship is not a surrogate question about children.
  const purposeFit=p=>p==='family'?(n5(b.adaptability)+1-Math.abs(n5(b.energy)-.5))/2:
    p==='adventure'?(2*n5(b.endurance)+n5(b.energy)+n5(b.adaptability))/4:
    p==='sport'?(n5(b.endurance)+n5(b.trainability)+n5(b.mentalNeeds)+n5(b.energy))/4:null;
  const purposes=[...new Set(goals)].map(purposeFit).filter(v=>v!==null);
  if(purposes.length)f.purpose=purposes.reduce((s,v)=>s+v,0)/purposes.length;
  if(b.brachycephalic)f.health=.5; // editorial precaution, not a medical probability
  if(b.isMixed){
    f.individual=.5;
    if(f.shedding!=null)f.shedding=Math.min(f.shedding,.5);
    if(b.id?.startsWith('mixed-'))for(const k of ['purpose','youngKids','olderKids','cats','dogs','leash','alone','trainingEase'])if(f[k]!=null)f[k]=Math.min(f[k],.5);
  }
  if(a.mergedActivities)delete f.purpose; // One merged activity answer, no duplicated goal score.
  return f;
}

/* ---------- 3. ИТОГОВЫЙ БАЛЛ ---------- */
// Какие критерии получают двойной вес при выборе приоритета
const PRIORITY = {
  kids: ["youngKids", "olderKids"],
  low_shedding: ["shedding", "groomer"],
  calm: ["calm", "barking"],
  easy_training: ["easy", "experience"],
  low_cost: ["budget", "groomer"],
  pets: ["cats", "dogs"],
  alone: ["alone"],
  active: ["walk", "energy", "purpose"],
};
const PRIORITY_FACTOR = 2;

function weightsFor(a) {
  const w = { ...WEIGHTS };
  for (const p of (a.priorities || []).slice(0, 2)) {
    for (const k of PRIORITY[p] || []) w[k] = WEIGHTS[k] * PRIORITY_FACTOR;
  }
  return w;
}

function scoreBreed(b, a) {
  const fits = criterionFits(b, a);
  const W = weightsFor(a);
  let sum = 0, wsum = 0;
  const invalidKeys=Object.entries(fits).filter(([,v])=>!Number.isFinite(v)).map(([k])=>k);
  // Score preferences separately. Walk, apartment and coat shortages are
  // multiplicative and cannot be diluted by unrelated positive traits.
  for (const [k, v] of Object.entries(fits)) {
    if(k==='walk'||(k==='housing'&&a.housing==='apartment'))continue;
    if(Number.isFinite(v)&&Number.isFinite(W[k])){sum+=W[k]*v;wsum+=W[k];}
  }
  let score = wsum ? sum / wsum : 0.5;
  const walkMultiplier=Number.isFinite(fits.walk)?fits.walk:0;
  const housingMultiplier=calculateHousingScore(a,b);
  const coatEvaluation=evaluateCoatAndShedding(a,b);
  score*=walkMultiplier*housingMultiplier*coatEvaluation.score;
  if(invalidKeys.length)score=0;

  // Серьёзные несоответствия режут балл, даже если остальное подходит
  const hh = a.household || [];
  if (hh.includes("kids_under6") && b.goodWithYoungKids <= 2) score *= 0.4;
  if (hh.includes("cats_other_pets") && b.goodWithCats <= 1) score *= 0.4;
  if (a.experience === "first" && b.experienceNeeded >= 5) score *= 0.5;
  if (a.hoursAlone === "6_plus" && b.aloneTolerance <= 1) score *= 0.5;
  if (a.leash === "off_leash" && b.offLeashReliability <= 1) score *= 0.6;
  if (a.housing!=='apartment'&&a.barking==='no_frequent'&&b.barking>=4)score*=.6;

  // Поправка на частоту показа действует только среди почти равных пород (см. TIER_WIDTH):
  // хорошая порода не вытесняется заметно худшей, но из равных чаще выбираются редкие.
  // Important mismatches must not disappear inside the weighted average.
  if(hh.includes('cats_other_pets')&&b.goodWithCats===2)score*=.65;
  if(a.leash==='off_leash'&&b.offLeashReliability===2)score*=.65;
  if(fits.training!=null&&fits.training<.4)score*=.6;
  // Editorial precaution: respiratory/heat burden cannot be averaged away by easy coat care.
  if(b.brachycephalic)score*=.8;
  const rank = score;
  return { breed: b, score, rank, fits, invalidKeys, multipliers:{walk:walkMultiplier,housing:housingMultiplier,coat:coatEvaluation.score} };
}

/* ---------- 4. РАЗНООБРАЗИЕ ВЫДАЧИ ---------- */
const TRAITS = ["energy", "trainability", "apartmentFriendly", "goodWithOlderKids", "grooming", "barking"];

function similarity(x, y) {
  const d = TRAITS.reduce((s, t) => s + Math.abs(n5(x[t]) - n5(y[t])), 0) / TRAITS.length;
  return (1 - d) * (norm(x.size) === norm(y.size) ? 1 : 0.8);
}

function diversify(ranked, k, lambda = 0.3) {
  const pool = [...ranked], picked = [];
  while (picked.length < k && pool.length) {
    let bi = 0, bv = -Infinity;
    pool.forEach((r, i) => {
      const sim = picked.length ? Math.max(...picked.map((p) => similarity(r.breed, p.breed))) : 0;
      const v = r.rank - lambda * sim;
      if (v > bv) { bv = v; bi = i; }
    });
    picked.push(pool.splice(bi, 1)[0]);
  }
  return picked;
}

/* ---------- 5. ОБЪЯСНЕНИЯ ---------- */
function explain(fits, a = {}) {
  const e = Object.entries(fits);
  const W = weightsFor(a);
  return {
    // В плюсах первыми идут критерии, которые человек отметил как главные
    pros: e.filter(([, v]) => v >= 0.85).sort((x, y) => W[y[0]] - W[x[0]]).slice(0, 3).map(([k]) => LABELS[k]),
    cons: e.filter(([, v]) => v < 0.6).map(([k]) => LABELS[k]),
  };
}

/* ---------- ПОДСКАЗКИ ПРИ ПУСТОЙ ИЛИ КОРОТКОЙ ВЫДАЧЕ ----------
   Смягчаются только ответы-предпочтения: размер, вольер, метис/порода.
   Ответы о безопасности (дети до 6 лет, другая собака) никогда не предлагается менять.
*/
const MIN_RESULTS = 3;
const SIZE_ORDER = ["small", "medium", "large", "giant"];
const SIZE_NAME = {
  small: ["Small", "Мелкая", "小型"], medium: ["Medium", "Средняя", "中型"],
  large: ["Large", "Крупная", "大型"], giant: ["Giant", "Гигантская", "巨型"],
};

function relaxOptions(a) {
  const out = [];
  const sizes = (a.sizes || []).map(norm).filter((x) => SIZE_ORDER.includes(x));
  if (sizes.length && !(a.sizes || []).includes("any")) {
    const idx = sizes.map((x) => SIZE_ORDER.indexOf(x));
    for (const n of [Math.min(...idx) - 1, Math.max(...idx) + 1]) {
      const add = SIZE_ORDER[n];
      if (add) out.push({
        key: "sizes", value: [...sizes, add],
        label: {
          en: `Also consider size "${SIZE_NAME[add][0]}"`,
          ru: `Рассмотреть и размер «${SIZE_NAME[add][1]}»`,
          zh: `也考虑「${SIZE_NAME[add][2]}」体型`,
        },
      });
    }
  }
  if (a.housing === "outdoor_enclosure") out.push({
    key: "housing", value: "house_fenced_yard",
    label: {
      en: "The dog lives in the house with a fenced yard, not in an outdoor kennel",
      ru: "Собака живёт в доме с огороженным участком, а не в вольере",
      zh: "狗住在带围栏院子的房子里，而不是室外犬舍",
    },
  });
  if (a.breedType === "mixes_only") out.push({
    key: "breedType", value: "all",
    label: { en: "Consider purebred dogs too", ru: "Рассмотреть и породистых собак", zh: "也考虑纯种犬" },
  });
  if (a.breedType === "purebred_only") out.push({
    key: "breedType", value: "all",
    label: { en: "Consider mixed-breed dogs too", ru: "Рассмотреть и метисов", zh: "也考虑混种犬" },
  });
  return out;
}

// Возвращает до 3 подсказок: какой ответ поменять и сколько пород тогда станет доступно
function suggestRelaxations(allBreeds, answers, currentCount = 0) {
  return relaxOptions(answers)
    .map((o) => {
      const changed = { ...answers, [o.key]: o.value };
      const count = allBreeds.filter((b) => !hardFilterReason(b, changed)).length;
      return { answer: o.key, newValue: o.value, label: o.label, addedBreeds: count - currentCount };
    })
    .filter((x) => x.addedBreeds > 0)
    .sort((x, y) => y.addedBreeds - x.addedBreeds)
    .slice(0, 3);
}

/* ---------- ГЛАВНАЯ ФУНКЦИЯ ---------- */
function legacyMatchBreeds(allBreeds, answers, topN = 5) {
  const excluded = {};
  const candidates = allBreeds.filter((b) => {
    const r = hardFilterReason(b, answers);
    if (r) excluded[r] = (excluded[r] || 0) + 1;
    return !r;
  });

  const ranked = candidates
    .map((b) => scoreBreed(b, answers))
    // Породы в пределах TIER_WIDTH считаются равными; среди них порядок зависит
    // от частоты показа и небольшой случайности, чтобы выдача не застывала
    .sort((x, y) => y.rank - x.rank);

  return {
    // Отбор идёт с учётом разнообразия, а показ — строго по убыванию процента совпадения
    results: diversify(ranked, topN).sort((x, y) => y.score - x.score).map((r) => ({
      name: r.breed.name,
      size: r.breed.size,
      matchPercent: Math.round(r.score * 100),
      ...explain(r.fits, answers),
    })),
    totalCandidates: candidates.length,
    fewResults: candidates.length < 3,
    // Если подходящих пород меньше MIN_RESULTS — варианты, какой ответ смягчить (см. suggestRelaxations)
    suggestions: candidates.length < MIN_RESULTS ? suggestRelaxations(allBreeds, answers, candidates.length) : [],
    // Какой фильтр отсеял больше всего — для подсказки "попробуйте изменить ответ"
    mostRestrictive: Object.entries(excluded).sort((x, y) => y[1] - x[1])[0]?.[0] ?? null,
  };
}

/* ---------- ПРОВЕРКА РАСПРЕДЕЛЕНИЯ ---------- */
const OPTIONS = {
  purpose: ["family", "adventure", "sport", "unsure"],
  sizes: [["small"], ["medium"], ["large"], ["giant"], ["any"], ["small", "medium"]],
  housing: ["apartment", "house_no_yard", "house_fenced_yard", "outdoor_enclosure"],
  experience: ["first", "had_dog", "trained_self"],
  hoursAlone: ["2_4", "4_6", "6_plus"],
  walkTime: ["30m", "1h", "2h", "3h_plus"],
  activity: ["slow_walks", "park_play", "sport"],
  trainingTime: ["under15", "15_30", "30_60"],
  leash: ["off_leash", "leash", "unsure"],
  barking: ["no_frequent", "ok"],
  grooming: ["minimal", "brush_self", "groomer_ok"],
  shedding: ["minimal", "some_ok", "dont_care"],
  careBudget: ["economy", "regular", "unsure"],
  breedType: ["all", "all", "mixes_only", "purebred_only"],
};
const HOUSEHOLD = ["kids_under6", "kids_under16", "cats_other_pets", "other_dog"];
const PRIORITIES = Object.keys(PRIORITY);

function simulate(allBreeds, runs = 500) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const counts = {};
  let empty = 0;
  for (let i = 0; i < runs; i++) {
    const a = Object.fromEntries(Object.entries(OPTIONS).map(([k, v]) => [k, pick(v)]));
    const hh = HOUSEHOLD.filter(() => Math.random() < 0.3);
    a.household = hh.length ? hh : ["adults_only"];
    a.priorities = PRIORITIES.filter(() => Math.random() < 0.2).slice(0, 2);
    const { results } = matchBreeds(allBreeds, a, 3);
    if (!results.length) empty++;
    results.forEach((r) => (counts[r.name] = (counts[r.name] || 0) + 1));
  }
  return {
    topBreeds: Object.entries(counts).sort((x, y) => y[1] - x[1]), // сверху — те, кто "перетягивает"
    neverShown: allBreeds.map((b) => b.name).filter((n) => !counts[n]), // породы, которые никогда не выпадают
    emptyResultsPercent: Math.round((empty / runs) * 100),
  };
}

/* ---------- КАЛИБРОВКА ЧАСТОТЫ ПОКАЗА ----------
   Запускайте один раз после каждого изменения базы (не при каждом подборе).
   Функция прогоняет тысячи случайных анкет, смотрит, какие породы попадают в топ-5
   слишком часто или слишком редко, и записывает каждой породе поле exposureBoost
   в пределах 0.92–1.1. Сохраните эти значения в базу.
*/
function calibrateExposure(allBreeds, { rounds = 3, runs = 4000 } = {}) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  allBreeds.forEach((b) => (b.exposureBoost = 1));
  for (let it = 0; it < rounds; it++) {
    const counts = {};
    let slots = 0;
    for (let i = 0; i < runs; i++) {
      const a = Object.fromEntries(Object.entries(OPTIONS).map(([k, v]) => [k, pick(v)]));
      const hh = HOUSEHOLD.filter(() => Math.random() < 0.3);
      a.household = hh.length ? hh : ["adults_only"];
      a.priorities = PRIORITIES.filter(() => Math.random() < 0.2).slice(0, 2);
      matchBreeds(allBreeds, a, 5).results.forEach((r) => {
        counts[r.name] = (counts[r.name] || 0) + 1;
        slots++;
      });
    }
    const avg = slots / allBreeds.length;
    allBreeds.forEach((b) => {
      const share = (counts[b.name] || 0.5) / avg;
      const step = Math.min(1.06, Math.max(0.94, Math.pow(share, -0.04)));
      b.exposureBoost = Math.min(1.1, Math.max(0.92, b.exposureBoost * step));
    });
  }
  return Object.fromEntries(allBreeds.map((b) => [b.name, +b.exposureBoost.toFixed(3)]));
}


const COMMON_US=new Set(['French Bulldog','Labrador Retriever','Golden Retriever','German Shepherd Dog','Dachshund','Miniature Dachshund','Miniature Poodle','Toy Poodle','Standard Poodle','Beagle','Rottweiler','German Shorthaired Pointer','English Bulldog','Cane Corso','Cavalier King Charles Spaniel','Yorkshire Terrier','Australian Shepherd','Doberman Pinscher','Pembroke Welsh Corgi','Miniature Schnauzer','Boxer','Pomeranian','Bernese Mountain Dog','Shih Tzu','Great Dane','Boston Terrier','Chihuahua','Havanese','Border Collie','English Springer Spaniel','Miniature American Shepherd (Mini Aussie)','Shetland Sheepdog','Siberian Husky','Brittany','Belgian Malinois','American Cocker Spaniel','Basset Hound','English Cocker Spaniel','Vizsla','Maltese','Pug','Rough Collie','Smooth Collie','English Mastiff','Rhodesian Ridgeback','Papillon','Portuguese Water Dog','Shiba Inu','West Highland White Terrier','Newfoundland','Australian Cattle Dog','Whippet','Bichon Frise','Dalmatian']);
const normalize=a=>({...a,household:(a.household||[]).map(k=>k==='cats'?'cats_other_pets':k),shedding:({low_only:'minimal',prefer_low:'some_ok',any:'dont_care'})[a.shedding]||a.shedding});
// Product exclusions survive database imports; these are editorial scope rules.
const NOT_RECOMMENDED=new Set(['Staffordshire Bull Terrier','American Staffordshire Terrier','American Bulldog','American Pit Bull Terrier','Bull Terrier','Bully-Type Mix (Pit Bull type)']);
function reason(b,a){
 if(NOT_RECOMMENDED.has(b.name))return 'catalog';
 if(a.housing==='apartment'&&(b.requiresYard===true||b.requires_yard===true))return 'housing';
 const original=hardFilterReason(b,normalize(a));if(original)return original;
 if(normalize(a).shedding==='minimal'&&(b.isMixed||b.lowSheddingConfirmed===false||!(b.shedding<=2)))return 'shedding';
 if(['first','had_dog'].includes(a.experience)&&(b.experienceNeeded>=4||b.size==='giant'))return 'experience';
 if((a.household||[]).includes('kids_under6')&&b.goodWithYoungKids<=2)return 'kids';
 const acts=Array.isArray(a.activity)?a.activity:[a.activity];
 if(acts.includes('sport')&&b.endurance<=2)return 'endurance';
 if(a.careBudget==='economy'&&b.careCost>=5)return 'budget';
 return null;
}
function explanationKeys(fits,a={}){const W=weightsFor(a);const e=Object.entries(fits);return {pros:e.filter(([,v])=>v>=.85).sort((x,y)=>W[y[0]]-W[x[0]]).slice(0,3).map(([k])=>k),cons:e.filter(([,v])=>v<.6).map(([k])=>k)};}
// A single mandatory policy shared by ranking, UI assessment and diagnostics.
const preyById=new Map((typeof window!=='undefined'?window.pawdayV6Full||[]:[]).map(b=>[b.id,b['Prey drive, level']]));
function priorityFailures(b,a){
 const hh=a.household||[],keys=[];
 // Imported Pawday_v46_fix rules: questionnaire limits cannot be averaged away.
 const userWalk=walkCapacity(a),needWalk=Number(b.walkMinutes);
 if(Number.isFinite(userWalk)&&userWalk>=0&&needWalk>1.5*userWalk)keys.push('walk');
 if(a.housing==='apartment'&&b.apartmentFriendly<=2)keys.push('housing');
 if(a.housing==='house_no_yard'&&b.apartmentFriendly<=1)keys.push('housing');
 if(a.careBudget==='economy'&&(b.careCost>=4||b.professionalGrooming))keys.push('budget');
 const activities=(Array.isArray(a.activity)?a.activity:[a.activity]).filter(Boolean);
 if(activities.length&&activities.every(x=>x==='slow_walks')&&b.energy>=5)keys.push('energy');
 const requireRating=(condition,field,key,min=4)=>{if(condition&&!(Number.isInteger(b[field])&&b[field]>=min&&b[field]<=5))keys.push(key);};
 const sizes=(a.sizes||[]).map(norm);
 if(sizes.length&&!sizes.includes('any')&&!sizes.includes(norm(b.size)))keys.push('size');
 requireRating(hh.includes('kids_under6'),'goodWithYoungKids','youngKids');
 requireRating(hh.includes('kids_under16'),'goodWithOlderKids','olderKids');
 requireRating(hh.includes('cats_other_pets')||hh.includes('cats'),'goodWithCats','cats',CAT_MIN);
 requireRating(hh.includes('other_dog'),'goodWithDogs','dogs');
 requireRating(a.leash==='off_leash','offLeashReliability','leash');
 if(a.leash==='off_leash'&&(b.preyDriveLevel??preyById.get(b.id))!==1)keys.push('leash');
 // Cat compatibility cannot establish safety with birds, rabbits or rodents.
 if(hh.includes('small_pets')||hh.includes('cats_other_pets'))keys.push('smallPets');
 if(b.individualAssessmentRequired&&(hh.some(k=>['kids_under6','kids_under16','cats','cats_other_pets','small_pets','other_dog'].includes(k))||a.leash==='off_leash'))keys.push('individual');
 return [...new Set(keys)];
}
// One gate implementation for the counter, ranking and suggestion evaluation.
// The counter deliberately omits Q12–15. Existing activity/training rules remain
// final-selection checks, so the counter is an upper bound, never a guarantee.
function qualificationFailures(b,answers={},includeRanking=false){
 const a=includeRanking?answers:{...answers,purpose:undefined,activity:undefined,trainingTime:undefined,allergy:undefined};
 const keys=[reason(b,a),...priorityFailures(b,a)].filter(Boolean);
 if(a.grooming==='minimal'&&(!(Number(b.grooming)<=2)||b.professionalGrooming||b.dailySkinCare))keys.push('grooming');
 if(a.walkTime!==undefined||a.daily_walk_minutes!==undefined){
  const walk=calculateWalkTimeScore(walkCapacity(a),b.walkMinutes,b.exerciseMinimumExclusive);
  if(walk===null||walk<.4)keys.push('walk');
 }
 if(includeRanking&&a.trainingTime){
  const training=trainingFit(b,a);
  if(!Number.isFinite(training)||training<.4)keys.push('training');
 }
 if((a.hoursAlone==='4_6'&&b.aloneTolerance<=1)||(a.hoursAlone==='6_plus'&&b.aloneTolerance<=2))keys.push('alone');
 if(a.barking==='no_frequent'&&b.barking>=4)keys.push('barking');
 return [...new Set(keys)];
}
function countQualified(rows,partialAnswers={}){
 return {count:rows.filter(b=>!qualificationFailures(b,partialAnswers).length).length,total:rows.length};
}
function finalFailures(r,mandatory){
 return [...new Set([...mandatory,...Object.entries(r.fits).filter(([,v])=>!Number.isFinite(v)).map(([k])=>k),...(!Number.isFinite(r.score)||r.score<.65?['overall']:[])])];
}
function suggestRelaxations(all,a){
 // Facts, including household, are never candidates for replacement.
 const fixed={...a};for(const key of Object.keys(PREFERENCE_OPTIONS))delete fixed[key];
 const pool=all.filter(b=>!qualificationFailures(b,fixed,true).length);
 if(!pool.length)return [];
 const equal=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const singles=Object.entries(PREFERENCE_OPTIONS).flatMap(([key,values])=>values.filter(v=>!equal(a[key],v)).map(value=>({[key]:value})));
 const changes=[...singles];
 for(let i=0;i<singles.length;i++)for(let j=i+1;j<singles.length;j++)if(Object.keys(singles[i])[0]!==Object.keys(singles[j])[0])changes.push({...singles[i],...singles[j]});
 const found=[];
 for(const change of changes){
  const next={...a,...change},normalized=normalize(next),matched=[];
  for(const b of pool){
   const failed=qualificationFailures(b,next,true);if(failed.length)continue;
   const r=scoreBreed(b,normalized);if(!finalFailures(r,failed).length)matched.push(b);
  }
  if(matched.length)found.push({changes:change,count:matched.length,breeds:matched.map(b=>({id:b.id,name:b.name})),keys:Object.keys(change)});
 }
 found.sort((x,y)=>y.count-x.count||x.keys.length-y.keys.length||JSON.stringify(x.changes).localeCompare(JSON.stringify(y.changes)));
 // A pair that adds nothing over one of its single changes is not useful.
 return found.filter(r=>!found.some(s=>s.keys.length<r.keys.length&&s.count>=r.count&&s.keys.every(k=>equal(s.changes[k],r.changes[k])))).slice(0,3);
}
function rankBreeds(all,a,topN=5,options={}){

 // Resolve mandatory constraints before reading any scoring fields. The
 // diagnostic pool is separate and cannot re-enter primary recommendations.
 const gates=all.map(breed=>({breed,hardReason:reason(breed,a),priorityKeys:qualificationFailures(breed,a,true)}));
 const excluded={},candidates=gates.filter(g=>{if(g.hardReason)excluded[g.hardReason]=(excluded[g.hardReason]||0)+1;return !g.hardReason;});
 const primaryPool=candidates.filter(g=>!g.priorityKeys.length);
 const diagnosticPool=candidates.filter(g=>g.priorityKeys.length);
 const normalized=normalize(a),scorePool=pool=>pool.map(g=>({...scoreBreed(g.breed,normalized),priorityKeys:g.priorityKeys}));
 const ranked=[...scorePool(primaryPool),...scorePool(diagnosticPool)].sort((x,y)=>y.score-x.score||x.breed.name.localeCompare(y.breed.name));
 // Build five-card pages so diversity remains effective with 'show more'.
 // Editorial recommendation gates, not scientifically validated probabilities.
 // Failed requirements stay visible as compromises but cannot win the main list.
 const qualified=[],compromises=[];
 for(const r of ranked){
   r.compromiseKeys=finalFailures(r,r.priorityKeys);
   (r.compromiseKeys.length?compromises:qualified).push(r);
 }
 const pool=[...qualified],picked=[];
 while(pool.length&&picked.length<topN){
   const batch=[];
   while(batch.length<Math.min(5,topN-picked.length)&&pool.length>batch.length){
     const remaining=pool.filter(r=>!batch.includes(r)),best=Math.max(...remaining.map(r=>r.score));
     const eligible=remaining.filter(r=>r.score>=best-.05);
     const value=r=>r.score-.04*(batch.length?Math.max(...batch.map(p=>similarity(r.breed,p.breed))):0)+(a.prioritizeCommon&&r.score>=best-.03&&COMMON_US.has(r.breed.name)? .005:0);
     eligible.sort((x,y)=>value(y)-value(x)||y.score-x.score||x.breed.name.localeCompare(y.breed.name));
     batch.push(eligible[0]);
   }
   batch.sort((x,y)=>y.score-x.score);picked.push(...batch);
   for(const r of batch)pool.splice(pool.indexOf(r),1);
 }
 // Counts describe actual failures, never hypothetical counts from weaker filters.
 const failureCounts={...excluded};
 for(const r of compromises)for(const key of r.compromiseKeys)failureCounts[key]=(failureCounts[key]||0)+1;
 compromises.sort((x,y)=>x.compromiseKeys.length-y.compromiseKeys.length||y.score-x.score||x.breed.name.localeCompare(y.breed.name));
 const relaxations=qualified.length||options.suggestions===false?[]:suggestRelaxations(all,a);
 const allergyReviewRequired=['yes','unsure'].includes(a.allergy);
 return {picked,ranked,compromises,qualifiedCount:qualified.length,eligibleCandidates:candidates.length,excluded:failureCounts,relaxations,importantCount:countQualified(all,a).count,allergyReviewRequired,totalCandidates:qualified.length,fewResults:qualified.length<3,mostRestrictive:Object.entries(failureCounts).sort((x,y)=>y[1]-x[1])[0]?.[0]||null};
}
function matchBreeds(all,a,topN=5){const o=rankBreeds(all,a,topN);return {...o,results:o.picked.map(r=>({name:r.breed.name,size:r.breed.size,matchPercent:Math.round(r.score*100),...explanationKeys(r.fits,a)})),suggestions:o.relaxations};}
const api={CAT_MIN,QUESTION_ORDER,PREFERENCE_OPTIONS,countQualified,qualificationFailures,suggestRelaxations,rankBreeds,priorityFailures,applyHardFilters:(all,a)=>all.filter(b=>!qualificationFailures(b,a,true).length),calculateWalkTimeScore,calculateHousingScore,evaluateCoatAndShedding,hardFilterReason:(b,a)=>qualificationFailures(b,a,true)[0]||null,hardFilterReasons:(b,a)=>qualificationFailures(b,a,true),criterionFits:(b,a)=>criterionFits(b,normalize(a)),scoreBreed:(b,a)=>scoreBreed(b,normalize(a)),explanationKeys,matchBreeds,simulate,fit,WEIGHTS};
if(typeof window!=='undefined')window.PawdayMatcherV2=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;

})();
