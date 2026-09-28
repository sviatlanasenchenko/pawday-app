/* Live eligibility uses the same engine gates as results. No breed data here. */
const liveText={
 important:L('Подходят по важным условиям','Fit your important requirements','符合重要条件'),
 zero:L('0 пород — под это сочетание в нашей базе пока нет вариантов','0 breeds — our database has no profiles for this combination yet','0个犬种——我们的数据库暂时没有符合此组合的档案'),
 empty:L('Под это сочетание нет пород. Можно выбрать другой вариант или идти дальше — в конце покажем, что ближе всего.','No breeds fit this combination. You can choose another option or continue — we’ll show the closest profiles at the end.','没有符合此组合的犬种。可以选择其他选项或继续，最后会显示最接近的档案。'),
 continue:L('Продолжить так','Continue with these answers','按当前回答继续'),
 familyZero:L('Под этот состав семьи и выбранные условия в базе нет подходящих пород. Эти факты менять не нужно — продолжай с реальными ответами.','No profiles fit this household and your selected conditions. Keep these facts accurate and continue with your real answers.','数据库中没有符合这个家庭组成及所选条件的犬种。请保留真实情况并继续回答。'),
 kids:L('Отлично, что думаешь о детях заранее. Мы оставим породы, которые обычно терпеливы с малышами. Но даже с самой спокойной собакой ребёнок до 6 лет должен быть рядом с ней только под присмотром взрослого.',"Good that you're thinking about kids early. We'll keep breeds that are usually patient with small children. Even with the calmest dog, a child under 6 should only be with the dog under adult supervision.",'很高兴你提前考虑孩子。我们会保留通常对幼童有耐心的犬种。但即使是最温和的狗，6岁以下孩子也只能在成人监督下与它相处。'),
 smallPets:L('Совместимость с кроликами, грызунами и птицами в базе не подтверждена. Поэтому основная подборка будет пустой: каждую собаку нужно оценивать индивидуально со специалистом.','Compatibility with rabbits, rodents and birds is unverified in our database. Primary matches will therefore be empty: each dog needs individual assessment with a specialist.','数据库尚未确认与兔、啮齿动物及鸟类的相容性，因此主要匹配将为空，需要与专业人士逐只评估。'),
 ranking:L('Этот вопрос не меняет счётчик важных условий, а помогает расставить породы по порядку. Занятия и время обучения дополнительно учитываются в окончательной подборке.','This question keeps the important-requirements count unchanged and helps rank breeds. Activities and training time also affect final selection.','此问题不改变重要条件计数，而是帮助排序。活动和训练时间也会影响最终筛选。'),
 allergy:L('Этот вопрос не сужает список: он добавляет предупреждение об аллергии.','This question does not narrow the list: it adds allergy guidance.','此问题不缩小名单，只添加过敏提示。'),
 difference:L('Счётчик учитывает важные условия первых 11 вопросов; окончательная подборка дополнительно учитывает занятия, обучение и общий балл.','The counter covers the first 11 important requirements; final matches also account for activities, training and the overall score.','计数器考虑前11题的重要条件，最终匹配还会考虑活动、训练及总分。'),
 narrowed:L('Что сузило выбор','What narrowed the selection','哪些条件缩小了范围'),
 suggestions:L('Если ваши предпочтения могут измениться','If your preferences can change','如果你的偏好可以改变'),
 noSuggestion:L('Изменения одного или двух предпочтений не дали подходящих пород. Сохрани реальные ответы; дальнейший подбор стоит обсудить со специалистом.','Changing one or two preferences did not produce matches. Keep your real answers and discuss individual matching with a specialist.','改变一两个偏好仍未找到匹配。请保留真实回答，并与专业人士讨论个体匹配。'),
 facts:L('Состав семьи, опыт, время отсутствия и прогулок в этих подсказках не меняются. Выбирай изменения только если они реально вам подходят.','These suggestions keep your household, experience, absence and walking time unchanged. Choose a change only if it genuinely works for you.','这些建议不会改变家庭组成、经验、离家时间或散步时间。仅选择现实可行的变化。'),
 preferences:{home:L('Жильё','Home','住房'),size:L('Размер','Size','体型'),leash:L('Поводок','Leash','牵引绳'),care:L('Уход','Coat care','毛发护理'),budget:L('Бюджет','Budget','预算'),noise:L('Лай','Barking','吠叫'),adoption:L('Происхождение','Breed type','犬只类型')}
};
const livePreferenceKeys=['size','leash','care','budget','noise','adoption','home'];
const liveRankingKeys=['goal','activity','training','allergy'];
const liveEngineToUI={sizes:'size',housing:'home',leash:'leash',grooming:'care',careBudget:'budget',barking:'noise',breedType:'adoption'};
const liveUIValues={size:['small','medium','large','giant','any'],home:['apartment','house_no_yard','house_fenced_yard','outdoor_enclosure'],leash:['off_leash','leash','unsure'],care:['minimal','regular'],budget:['economy','regular','unsure'],noise:['no_frequent','ok'],adoption:['all','mixes_only','all','purebred_only']};
const liveEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function liveCount(source=answers){return matcherV2.countQualified(window.pawdayV6Rows,v2Answers(source));}
function livePreview(Q,O,source=answers){const next=answerAfterChoice(source,Q.key,O.id);return {...liveCount(next),answers:next};}
function liveCountLabel(count,total){return t(L(`Подходят ${count} пород из ${total}`,`${count} of ${total} breeds fit so far`,`目前${total}个犬种中有${count}个符合条件`));}
function liveOptionMarkup(Q,O){
 if(liveRankingKeys.includes(Q.key))return '';
 const preview=livePreview(Q,O);
 return `<small class="option-count ${preview.count===0?'zero-count':''}" data-preview-count="${preview.count}">${preview.count?t(L(`→ ${preview.count} пород`,`→ ${preview.count} breeds`,`→ ${preview.count}个犬种`)):t(liveText.zero)}</small>`;
}
let livePrevious=null;
function liveCounterMarkup(Q){
 const {count,total}=liveCount(),changed=livePrevious?.key===Q.key&&livePrevious.count!==count;
 livePrevious={key:Q.key,count};
 let html=`<div class="live-counter ${changed?'counter-change':''}" role="status" aria-live="polite" aria-atomic="true"><strong>${liveCountLabel(count,total)}</strong><small>${t(liveText.important)}</small></div>`;
 // Explanations live inside the question's collapsed help.
 if(Q.key==='family'&&answers.family?.includes(1))html+=`<p class="live-note">${t(liveText.kids)}</p>`;
 if(Q.key==='family'&&answers.family?.includes(5))html+=`<p class="live-note">${t(liveText.smallPets)}</p>`;
 if(count===0&&hasAnswer(Q)){
  if(Q.key==='family')html+=`<div class="live-zero"><p>${t(liveText.familyZero)}</p></div>`;
  else if(livePreferenceKeys.includes(Q.key)){
   const alternatives=Q.options.map(O=>({O,...livePreview(Q,O)})).filter(r=>r.count>0&&(!Q.multi||r.answers[Q.key].length));
   html+=`<div class="live-zero"><p>${t(liveText.empty)}</p><div class="live-alternatives">${alternatives.map(({O,count})=>`<button type="button" class="outline" data-live-choice="${O.id}">${t(O.label)} · ${count}</button>`).join('')}<button type="button" class="outline" data-live-continue>${t(liveText.continue)}</button></div></div>`;
  }
 }
 return html;
}
function bindLiveCounter(Q){
 app.querySelectorAll('[data-live-choice]').forEach(b=>b.onclick=()=>pick(Q.key,Number(b.dataset.liveChoice)));
 const next=app.querySelector('[data-live-continue]');if(next)next.onclick=()=>moveToQuestion(step+1);
}
function liveConstraintTrace(source=answers){
 const partial={},trace=[];let previous=liveCount({}).count;
 for(const Q of qs){
  if(liveRankingKeys.includes(Q.key)||source[Q.key]===undefined)continue;
  // Household sub-options are accumulated; none is offered as a relaxation.
  const values=Q.key==='family'?(source.family||[]).map(id=>[id]):[source[Q.key]];
  for(const value of values){
   partial[Q.key]=Q.key==='family'?[...(partial.family||[]),...value]:value;
   const count=liveCount(partial).count;
   const ids=Q.key==='family'?value:Array.isArray(value)?value:[value];
   if(count<previous)trace.push({key:Q.key,label:Q.options.filter(o=>ids.includes(o.id)).map(o=>o.label),before:previous,after:count,drop:previous-count});
   previous=count;
  }
 }
 return trace.sort((a,b)=>b.drop-a.drop);
}
function liveRelaxationChanges(r){
 const result={};
 for(const [engine,value] of Object.entries(r.changes)){
  const key=liveEngineToUI[engine];if(!livePreferenceKeys.includes(key))throw Error('Invalid relaxation key');
  const values=Array.isArray(value)?value:[value];
  const ids=values.map(v=>liveUIValues[key].indexOf(v));if(ids.some(id=>id<0))throw Error('Invalid relaxation value');
  result[key]=key==='size'?ids:ids[0];
 }
 return result;
}
function liveRelaxationLabel(r){
 const changes=liveRelaxationChanges(r);
 const labels=Object.entries(changes).map(([key,value])=>{
  const ids=Array.isArray(value)?value:[value],Q=qs.find(q=>q.key===key);
  return t(liveText.preferences[key])+': '+Q.options.filter(o=>ids.includes(o.id)).map(o=>t(o.label)).join(', ');
 }).join(t(L(' и ',' and ','，以及')));
 const names=r.breeds.slice(0,3).map(b=>{const profile=breeds.find(x=>x.latin===b.name);return profile?t(profile.name):b.name;}).join(', ')+(r.breeds.length>3?'…':'');
 return t(L(`Если выбрать «${labels}» — подойдёт ${r.count} пород (${names})`,`If you choose “${labels}” — ${r.count} breeds fit (${names})`,`如果选择“${labels}”，将有${r.count}个犬种符合条件（${names}）`));
}
function liveResultsExplanation(outcome){
 let html=`<p class="live-result-note">${t(liveText.difference)} ${liveCountLabel(liveCount().count,breeds.length)}.</p>`;
 if(outcome.totalCandidates)return html;
 const trace=liveConstraintTrace();
 html+=`<section class="panel live-diagnostics"><h2>${t(liveText.narrowed)}</h2>${trace.length?`<ul>${trace.map(r=>`<li>${liveEscape(r.label.map(t).join(', '))}: ${t(L(`из ${r.before} подходит ${r.after}`,`${r.before} → ${r.after} fit`,`${r.before} → ${r.after}个符合`))}</li>`).join('')}</ul>`:`<p>${t(liveText.difference)}</p>`}${answers.family?.includes(5)?`<p>${t(liveText.smallPets)}</p>`:''}<h3>${t(liveText.suggestions)}</h3><p>${t(liveText.facts)}</p>${outcome.relaxations.length?`<div class="live-alternatives">${outcome.relaxations.map((r,i)=>`<button class="outline" type="button" data-live-relaxation="${i}">${liveEscape(liveRelaxationLabel(r))}</button>`).join('')}</div>`:`<p>${t(liveText.noSuggestion)}</p>`}</section>`;
 return html;
}
function bindLiveResults(){
 app.querySelectorAll('[data-live-relaxation]').forEach(button=>button.onclick=()=>{
  const suggestion=v2Outcome().relaxations[Number(button.dataset.liveRelaxation)];if(!suggestion)return;
  answers={...answers,...liveRelaxationChanges(suggestion)};dayId=null;compare=false;
  step=qs.length;render();window.scrollTo({top:0,behavior:'instant'});
 });
}
