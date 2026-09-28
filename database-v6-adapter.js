/* Uploaded database is authoritative; existing rendering and assets are reused. */
const previousBreeds=[...breeds];
window.pawdayRatings=Object.fromEntries(window.pawdayV6Rows.map(r=>[r.name,r]));
const v6FullById=new Map(window.pawdayV6Full.map(b=>[b.id,b]));
const v6Text=(b,key)=>Object.fromEntries(['ru','en','zh'].map(lang=>[lang,b.text[lang]?.[key]||b.text.en[key]||'']));
const v6Breeds=window.pawdayV6Rows.map(r=>{
 const f=v6FullById.get(r.id),prior=previousBreeds.find(b=>b.evidence.id===r.id||b.latin===r.name),e=prior?.evidence||{};
 if(prior&&window.pawdayPhotos[prior.latin])window.pawdayPhotos[r.name]=window.pawdayPhotos[prior.latin];
 const care=r.grooming<=2?0:r.grooming===3?1:2,train=r.mentalNeeds<=2?0:r.mentalNeeds===3?1:2;
 const evidence={...e,id:r.id,role:v6Text(f,'Original purpose'),instincts:v6Text(f,'Instincts and traits'),description:v6Text(f,'Instincts and traits'),mental:v6Text(f,'Mental engagement'),leash:v6Text(f,'Lead and chasing guidance'),grooming:v6Text(f,'Grooming guidance'),health:v6Text(f,'Health to discuss'),lifestyleGroup:v6Text(f,'Lifestyle group'),care,mentalTier:train,preyLevel:f['Prey drive, level'],vocalLevel:f['Vocal tendency, level'],shortFace:r.brachycephalic,reviewStatus:f['Review status'],editorialProfile:f['Review status']==='editorial-profile',conflicts:[],variantNote:null,marketSources:[],exercise:{description:v6Text(f,'Exercise guidance from source'),planningThresholdMinutes:r.walkMinutes},sources:(f.Sources||'').split(/[;\s]+/).filter(x=>/^https?:/.test(x)).map(url=>({url,publisher:new URL(url).hostname})),resultProfile:{strengths:[v6Text(f,'Strengths')],lifespan:{description:v6Text(f,'Lifespan description'),sourceUrl:null},otherDogs:v6Text(f,'With other dogs'),otherPets:v6Text(f,'With cats and small pets')}};
 return {...prior,name:f.names,latin:r.name,ratings:r,evidence,sizeCode:['small','medium','large','giant'].indexOf(r.size),size:v6Text(f,'Size'),weightKg:r.weightKg,isMixed:r.isMixed,outdoorSuitable:r.outdoorSuitable,shortFace:r.brachycephalic,care,train,energy:r.energy<=2?1:r.energy<=4?2:3,exp:r.experienceNeeded<=2?0:r.experienceNeeded===3?1:2,watch:evidence.leash};
});
breeds.splice(0,breeds.length,...v6Breeds);
// Maintain the existing low/variable/unknown presentation from the full scale.
window.pawdayCoats=Object.fromEntries(window.pawdayV6Rows.map(r=>[r.name,{shedding:r.isMixed?'variable':r.lowSheddingConfirmed?'low':'rated',rating:r.shedding,sourceUrl:null}]));
