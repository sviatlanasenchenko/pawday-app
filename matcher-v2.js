/* Pawday matching v2: user-specified scoring. Scores are heuristic, not probabilities. */
(function(root){
'use strict';
const WALK={'30m':.2,'1h':.45,'2h':.75,'3h_plus':1};
const ACTIVITY={slow_walks:.2,park_play:.55,sport:1};
const TRAINING={under15:.2,'15_30':.55,'30_60':1};
const EXPERIENCE={first:.2,had_dog:.55,trained_self:1};
const ALONE={'2_4':.3,'4_6':.6,'6_plus':.9};
const WEIGHTS={trainingEase:2,shedding:2,purpose:3,energy:4,endurance:2.5,training:2,experience:2,youngKids:3,olderKids:2,cats:2,dogs:2,housing:2,alone:2,leash:1.5,barking:1.5,grooming:1.5,budget:2};
const LABELS={trainingEase:'ease of training',shedding:'shedding',purpose:'your goals',energy:'activity level',endurance:'hiking and running endurance',training:'training time',experience:'owner experience',youngKids:'young children',olderKids:'older children',cats:'cats and other pets',dogs:'other dogs',housing:'living space',alone:'time alone',leash:'off-leash walks',barking:'noise',grooming:'grooming',budget:'care budget'};
const clamp01=x=>Math.max(0,Math.min(1,x)),n5=v=>clamp01((Number(v)-1)/4),norm=s=>String(s??'').trim().toLowerCase();
const list=v=>v==null?[]:Array.isArray(v)?v:[v];
function fit(demand,capacity,shortPenalty=1.5,excessPenalty=0){const d=demand-capacity;return clamp01(1-(d>0?d*shortPenalty:-d*excessPenalty));}
function hardFilterReasons(b,a){
 const sizes=list(a.sizes).map(norm),hh=a.household||[],reasons=[];
 if(sizes.length&&!sizes.includes('any')&&!sizes.includes(norm(b.size)))reasons.push('size');
 if(a.shedding==='low_only'&&b.shedding!=='low')reasons.push('shedding');
 // Named crosses belong to the app's breed category; ancestry stays in the source data.
 const mixed=b.isMixed;
 if(a.breedType==='mixes_only'&&!mixed||a.breedType==='purebred_only'&&mixed)reasons.push('breedType');
 if(a.housing==='outdoor_enclosure'&&!b.outdoorSuitable)reasons.push('housing');
 if(hh.includes('kids_under6')&&b.goodWithYoungKids<=1)reasons.push('kids');
 if(hh.includes('other_dog')&&b.goodWithDogs<=1)reasons.push('dogs');
 return reasons;
}
function hardFilterReason(b,a){return hardFilterReasons(b,a)[0]??null;}
function criterionFits(b,a){
 const f={},hh=a.household||[],purposes=list(a.purpose),p=[];
 if(a.shedding==='low_only'||a.shedding==='prefer_low')f.shedding=b.shedding==='low'?1:.5;
 if(purposes.includes('family'))p.push((n5(b.goodWithOlderKids)+n5(b.adaptability))/2);
 if(purposes.includes('adventure'))p.push((n5(b.endurance)+n5(b.adaptability))/2);
 if(purposes.includes('sport'))p.push((n5(b.endurance)+n5(b.trainability))/2);
 if(p.length)f.purpose=p.reduce((x,y)=>x+y,0)/p.length;
 const w=WALK[a.walkTime],acts=list(a.activity).map(k=>ACTIVITY[k]).filter(v=>v!=null),act=acts.length?Math.max(...acts):undefined;
 if(w!=null||act!=null){const cap=w!=null&&act!=null?Math.min(w,.6*w+.4*act):(w??act);f.energy=fit(n5(b.energy),cap,1.5,0);
 // Available walking time is a capacity, not a demand for a higher-energy dog.
 if(act!=null&&act>=.9)f.endurance=n5(b.endurance);else if(purposes.includes('adventure'))f.endurance=n5(b.endurance);}
 if(TRAINING[a.trainingTime]!=null)f.training=fit(n5(b.mentalNeeds),TRAINING[a.trainingTime],1.5,.2);
 if(a.experience==='first'||a.trainingTime==='under15'||purposes.includes('sport'))f.trainingEase=n5(b.trainability);
 if(EXPERIENCE[a.experience]!=null)f.experience=fit(n5(b.experienceNeeded),EXPERIENCE[a.experience],2);
 if(hh.includes('kids_under6'))f.youngKids=n5(b.goodWithYoungKids);
 if(hh.includes('kids_under16'))f.olderKids=n5(b.goodWithOlderKids);
 if(hh.includes('cats_other_pets'))f.cats=n5(b.goodWithCats);
 if(hh.includes('other_dog'))f.dogs=n5(b.goodWithDogs);
 if(a.housing){const af=n5(b.apartmentFriendly);f.housing={apartment:af,house_no_yard:.4+.6*af,house_fenced_yard:1,outdoor_enclosure:1}[a.housing]??1;}
 if(ALONE[a.hoursAlone]!=null)f.alone=fit(ALONE[a.hoursAlone],n5(b.aloneTolerance));
 if(a.leash==='off_leash')f.leash=n5(b.offLeashReliability);
 if(a.leash==='unsure')f.leash=.5+.5*n5(b.offLeashReliability);
 if(a.barking==='no_frequent')f.barking=fit(n5(b.barking),.3);
 if(a.grooming==='minimal')f.grooming=fit(n5(b.grooming),.3);
 if(a.careBudget==='economy')f.budget=fit(n5(b.careCost),.3);
 return f;
}
function scoreBreed(b,a){const fits=criterionFits(b,a);let sum=0,wsum=0;for(const[k,v]of Object.entries(fits)){sum+=WEIGHTS[k]*v;wsum+=WEIGHTS[k];}let score=wsum?sum/wsum:.5;const hh=a.household||[];
 if(hh.includes('kids_under6')&&b.goodWithYoungKids<=2)score*=.4;
 if(hh.includes('cats_other_pets')&&b.goodWithCats<=1)score*=.4;
 if(a.experience==='first'&&b.experienceNeeded>=5)score*=.5;
 if(a.housing==='apartment'&&b.apartmentFriendly<=1)score*=.5;
 if(a.hoursAlone==='6_plus'&&b.aloneTolerance<=1)score*=.5;
 if(a.leash==='off_leash'&&b.offLeashReliability<=1)score*=.6;
 // Severe time shortfalls cannot be hidden by unrelated strengths.
 for(const k of ['energy','training'])if(fits[k]!=null&&fits[k]<.4)score*=Math.max(.35,fits[k]/.4);
 if(fits.endurance!=null&&fits.endurance<.5)score*=Math.max(.35,fits.endurance/.5);
 return{breed:b,score,fits};}
const TRAITS=['energy','trainability','apartmentFriendly','goodWithOlderKids','grooming','barking'];
function similarity(x,y){const d=TRAITS.reduce((s,t)=>s+Math.abs(n5(x[t])-n5(y[t])),0)/TRAITS.length;return(1-d)*(norm(x.size)===norm(y.size)?1:.8);}
// AKC 2025 registration top 50, checked 2026-09-26. A tie preference, not local stock or suitability.
// https://www.akc.org/expert-advice/dog-breeds/most-popular-dog-breeds-2025/
const COMMON_US=new Set(['French Bulldog','Labrador Retriever','Golden Retriever','German Shepherd Dog','Dachshund','Miniature Dachshund','Miniature Poodle','Toy Poodle','Standard Poodle','Beagle','Rottweiler','German Shorthaired Pointer','English Bulldog','Cane Corso','Cavalier King Charles Spaniel','Yorkshire Terrier','Australian Shepherd','Doberman Pinscher','Pembroke Welsh Corgi','Miniature Schnauzer','Boxer','Pomeranian','Bernese Mountain Dog','Shih Tzu','Great Dane','Boston Terrier','Chihuahua','Havanese','Border Collie','English Springer Spaniel','Miniature American Shepherd (Mini Aussie)','Shetland Sheepdog','Siberian Husky','Brittany','Belgian Malinois','American Cocker Spaniel','Basset Hound','English Cocker Spaniel','Vizsla','Maltese','Pug','Rough Collie','Smooth Collie','English Mastiff','Rhodesian Ridgeback','Papillon','Portuguese Water Dog','Shiba Inu','West Highland White Terrier','Newfoundland','Australian Cattle Dog','Whippet','Bichon Frise','Dalmatian']);
function diversify(ranked,k,lambda=.1,prioritizeCommon=false){
 const pool=[...ranked],picked=[];
 while(picked.length<k&&pool.length){
  const bestScore=Math.max(...pool.map(r=>r.score));
  const preferred=prioritizeCommon&&pool.some(r=>COMMON_US.has(r.breed.name)&&r.score>=bestScore-.03);
  let bi=0,bv=-Infinity;
  pool.forEach((r,i)=>{
   if(r.score<bestScore-.05)return;
   if(preferred&&(!COMMON_US.has(r.breed.name)||r.score<bestScore-.03))return;
   const sim=picked.length?Math.max(...picked.map(p=>similarity(r.breed,p.breed))):0;
   const v=r.score-lambda*sim;
   if(v>bv){bv=v;bi=i;}
  });
  picked.push(pool.splice(bi,1)[0]);
 }
 return picked;
}
function explanationKeys(fits){const e=Object.entries(fits);return{pros:e.filter(([,v])=>v>=.85).sort((x,y)=>WEIGHTS[y[0]]-WEIGHTS[x[0]]).slice(0,3).map(([k])=>k),cons:e.filter(([,v])=>v<.6).map(([k])=>k)};}
function explain(fits){const e=explanationKeys(fits);return{pros:e.pros.map(k=>LABELS[k]),cons:e.cons.map(k=>LABELS[k])};}
function rankBreeds(allBreeds,answers,topN=5,rng=Math.random){const excluded={},candidates=allBreeds.filter(b=>{const reasons=hardFilterReasons(b,answers);for(const r of reasons)excluded[r]=(excluded[r]||0)+1;return !reasons.length;});const ranked=candidates.map(b=>({...scoreBreed(b,answers),tie:rng()})).sort((x,y)=>(y.score-x.score)||y.tie-x.tie);const relaxations=Object.keys(excluded).map(key=>({key,additionalCandidates:allBreeds.filter(b=>{const r=hardFilterReasons(b,answers);return r.length===1&&r[0]===key;}).length})).filter(r=>r.additionalCandidates>0).sort((a,b)=>b.additionalCandidates-a.additionalCandidates);return{relaxations,ranked,picked:diversify(ranked,topN,.1,answers.prioritizeCommon===true),excluded,totalCandidates:candidates.length,fewResults:candidates.length<3,mostRestrictive:relaxations[0]?.key??Object.entries(excluded).sort((x,y)=>y[1]-x[1])[0]?.[0]??null};}
function matchBreeds(allBreeds,answers,topN=5,rng=Math.random){const r=rankBreeds(allBreeds,answers,topN,rng);return{results:r.picked.map(r=>({name:r.breed.name,size:r.breed.size,matchPercent:Math.round(r.score*100),...explain(r.fits)})),totalCandidates:r.totalCandidates,fewResults:r.fewResults,mostRestrictive:r.mostRestrictive};}
const OPTIONS={purpose:['family','adventure','sport','unsure'],sizes:[['small'],['medium'],['large'],['giant'],['any'],['small','medium']],housing:['apartment','house_no_yard','house_fenced_yard','outdoor_enclosure'],experience:['first','had_dog','trained_self'],hoursAlone:['2_4','4_6','6_plus'],walkTime:['30m','1h','2h','3h_plus'],activity:['slow_walks','park_play','sport'],trainingTime:['under15','15_30','30_60'],leash:['off_leash','leash','unsure'],barking:['no_frequent','ok'],grooming:['minimal','regular'],careBudget:['economy','regular','unsure'],breedType:['all','all','mixes_only','purebred_only']};
const HOUSEHOLD=['kids_under6','kids_under16','cats_other_pets','other_dog'];
function simulate(allBreeds,runs=500,rng=Math.random){const pick=arr=>arr[Math.floor(rng()*arr.length)],counts={};let empty=0;for(let i=0;i<runs;i++){const a=Object.fromEntries(Object.entries(OPTIONS).map(([k,v])=>[k,pick(v)])),hh=HOUSEHOLD.filter(()=>rng()<.3);a.household=hh.length?hh:['adults_only'];const{results}=matchBreeds(allBreeds,a,3,rng);if(!results.length)empty++;results.forEach(r=>counts[r.name]=(counts[r.name]||0)+1);}return{topBreeds:Object.entries(counts).sort((x,y)=>y[1]-x[1]),neverShown:allBreeds.map(b=>b.name).filter(n=>!counts[n]),emptyResultsPercent:Math.round(empty/runs*100)};}
const api={matchBreeds,simulate,rankBreeds,hardFilterReasons,hardFilterReason,criterionFits,scoreBreed,diversify,explanationKeys,fit,WEIGHTS};
if(typeof module!=='undefined')module.exports=api;root.PawdayMatcherV2=api;
})(typeof window==='undefined'?globalThis:window);
