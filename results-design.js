/* Presentation only: reuse the current matcher, explanations and result actions. */
const renderResultsBeforeWarm=renderResults;
const resultText=(ru,en,zh)=>t(L(ru,en,zh));
const resultEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function resultFavorites(){try{const value=JSON.parse(localStorage.getItem('pawday-favorites')||'[]');return Array.isArray(value)?value.filter(v=>typeof v==='string'):[];}catch{return [];}}
function compromiseProfile(r){
 const b=v2Card(r),photo=window.pawdayPhotos?.[b.latin];
 const thumbnail=photo?`<img class="compromise-thumb" src="${resultEscape(photo.src)}" alt="${resultEscape(t(b.name))}" width="100" height="100" loading="lazy" decoding="async">`:`<span class="compromise-thumb no-photo">${resultText('Фото пока нет','No photo yet','暂无照片')}</span>`;
 return `<summary class="compromise-preview">${thumbnail}<span>${resultEscape(t(b.name))}<small>${resultText('Не подходит: ','Does not fit: ','不符合：')}${r.compromiseKeys.map(k=>resultEscape(t(v2Labels[k]||v2Labels.overall))).join(', ')}</small></span><span class="compromise-chevron" aria-hidden="true">⌄</span></summary><div class="result-about-body">${breedPhoto(b)||`<p>${resultText('Для этой породы фото пока нет.','No photo is available for this profile yet.','此档案暂无照片。')}</p>`}<p class="compromise-status">${resultText('Не входит в основную подборку','Not a primary recommendation','不属于主要推荐')}</p><strong>${resultText('Что не совпадает','What does not fit','不匹配之处')}</strong><ul>${r.compromiseKeys.map(k=>`<li>${resultEscape(k==='overall'?resultText('Общий балл ниже порога основной рекомендации (65 из 100).','Overall score is below the primary recommendation threshold (65/100).','综合得分低于主要推荐门槛（65/100）。'):v2Concern(k))}</li>`).join('')}</ul>${profileSummary(b)}${breedFacts(b)}</div>`;
}
renderResults=function(){
 renderResultsBeforeWarm();
 const wrap=app.querySelector('.result-wrap');if(!wrap)return;
 wrap.classList.add('warm-results');
 const top=matchOutcome().matches;
 const outcome=v2Outcome();
 const heading=wrap.querySelector('h1');
 heading.textContent=top.length&&outcome.allergyReviewRequired?resultText('Подходят по образу жизни — аллергию нужно проверить','Lifestyle matches — allergy review needed','生活方式匹配——过敏需评估'):top.length?resultText('Основная подборка','Your primary matches','主要匹配'):resultText('Под все условия сразу не подходит ни одна порода','No breed meets all your conditions together','没有犬种同时满足你的所有条件');
 const intro=document.createElement('div');intro.className='results-intro';
 intro.innerHTML=`<span class="results-eyebrow">${resultText('ТВОЙ ПОДБОР','YOUR MATCHES','你的匹配')}</span>`;
 heading.before(intro);intro.append(heading);
 const sub=document.createElement('p');sub.textContent=resultText('По твоему ритму жизни и привычкам','For your lifestyle and daily rhythm','根据你的生活节奏与习惯');intro.append(sub);
 const oldTop=wrap.querySelector('.result-top');oldTop.querySelector('.eyebrow')?.remove();
 const edit=oldTop.querySelector('[data-edit]');edit.textContent='‹';edit.setAttribute('aria-label',t(ui.edit));edit.className='result-back';
 const share=wrap.querySelector('[data-share]');if(share){share.textContent='↥';share.className='result-share';share.setAttribute('aria-label',t(ui.share));oldTop.append(share);}
 const grid=wrap.querySelector('.result-grid');grid.classList.add('warm-result-grid');
 if(outcome.compromises?.length){
  const section=document.createElement('details');section.className='panel compromise-results';
  section.innerHTML=`<summary>${resultText('Не вошли в подборку — посмотреть причины','Not selected — see why','未入选——查看原因')} · ${outcome.compromises.length}</summary><p>${resultText('Варианты с компромиссами. Они не прошли все важные условия и не занимают места в основной подборке.','Options with compromises. They did not meet all important requirements and have no place in the primary ranking.','这些选项需要妥协，未满足所有重要条件，不属于主要排名。')}</p>`;
  const list=document.createElement('div');list.className='compromise-list';
  for(const r of outcome.compromises){const detail=document.createElement('details');detail.className='result-about';detail.innerHTML=compromiseProfile(r);list.append(detail);}
  section.append(list);grid.after(section);
 }
 const cards=[...grid.querySelectorAll('.dogcard')];
 cards.forEach((card,i)=>{
  const b=top[i];if(!b)return;
  card.classList.add(i===0?'featured-match':'alternative-match');
  const name=card.querySelector('h2'),photo=card.querySelector('.breed-photo'),rank=card.querySelector('.rank');
  const media=document.createElement('div');media.className='result-media';
  if(photo)media.append(photo);else media.innerHTML=`<div class="result-no-photo">${resultText('Фото пока нет','Photo coming soon','暂无照片')}</div>`;
  card.prepend(media);
  const badge=document.createElement('span');badge.className='match-badge';
  badge.textContent=outcome.allergyReviewRequired?resultText('Аллергия: требуется проверка','Allergy review needed','需要过敏评估'):b.cons.length?resultText('Стоит познакомиться','Worth exploring','值得了解'):b.matchPercent>=85?resultText('Отличное совпадение','A strong match','高度匹配'):resultText('Возможный друг','A possible friend','可能的伙伴');media.append(badge);
  const favorite=document.createElement('button');favorite.type='button';favorite.className='result-favorite';favorite.dataset.favorite=b.latin;
  const sync=()=>{const on=resultFavorites().includes(b.latin);favorite.textContent=on?'♥':'♡';favorite.setAttribute('aria-pressed',String(on));favorite.setAttribute('aria-label',resultText(on?'Убрать из избранного: ':'В избранное: ',on?'Remove favorite: ':'Favorite: ',on?'取消收藏：':'收藏：')+t(b.name));};sync();
  favorite.onclick=()=>{try{const set=new Set(resultFavorites());set.has(b.latin)?set.delete(b.latin):set.add(b.latin);localStorage.setItem('pawday-favorites',JSON.stringify([...set]));sync();app.querySelector('#sharetext').textContent=resultText('Избранное сохраняется в этом браузере.','Favorites are saved in this browser.','收藏保存在此浏览器中。');}catch{app.querySelector('#sharetext').textContent=resultText('Браузер не разрешил сохранить избранное.','Your browser could not save favorites.','浏览器无法保存收藏。');}};media.append(favorite);
  const detail=document.createElement('details');detail.className='result-about';
  const summary=document.createElement('summary');summary.textContent=resultText('О породе →','About this dog →','了解犬种 →');detail.append(summary);
  const body=document.createElement('div');body.className='result-about-body';detail.append(body);
  [...card.children].filter(el=>el!==media&&el!==name).forEach(el=>body.append(el));
  if(photo?.querySelector('figcaption'))body.prepend(photo.querySelector('figcaption'));
  const why=document.createElement('div');why.className='result-why';
  why.innerHTML=`<h3>${resultText('Почему подходит','Why this match','匹配理由')}</h3><div class="reason-chips">${b.pros.map(k=>`<span>✦ ${resultEscape(t(v2Labels[k]))}</span>`).join('')||`<span>${resultText('По совокупности ответов','Based on your answers','根据综合回答')}</span>`}</div>`;
  const caution=document.createElement('div');caution.className='result-caution';
  caution.innerHTML=`<span aria-hidden="true">ⓘ</span><div><strong>${resultText('Что учесть','Keep in mind','注意事项')}</strong>${b.cons.length?`<ul>${b.cons.map(k=>`<li>${resultEscape(v2Concern(k))}</li>`).join('')}</ul>`:`<p>${resultText('Познакомься с конкретной собакой: характер и потребности могут отличаться.','Meet the individual dog: temperament and needs can vary.','请了解具体犬只：性格和需求可能不同。')}</p>`}</div>`;
  if(i===0){card.append(why,caution,detail);}else{body.prepend(why,caution);card.append(detail);}
 });
 if(cards.length>1){const title=document.createElement('h2');title.className='alternatives-title';title.textContent=cards.length>2?resultText('Ещё два варианта','Two more possibilities','另外两个选择'):resultText('Ещё один вариант','Another possibility','另一个选择');cards[0].after(title);}
 if(cards.length>3){const more=document.createElement('details');more.className='remaining-matches';const summary=document.createElement('summary');summary.textContent=resultText('Другие подходящие варианты','More matching profiles','更多匹配档案');more.append(summary);const content=document.createElement('div');content.className='remaining-grid';more.append(content);cards.slice(3).forEach(card=>content.append(card));grid.append(more);}
 // Keep safety notes and filtering explanations, but move technical material below the selection.
 const notes=document.createElement('details');notes.className='result-method panel';notes.innerHTML=`<summary>${resultText('Как получилась эта подборка','How these matches were selected','匹配说明')}</summary>`;
 [...wrap.children].filter(el=>el.matches('.sub,.ranking-controls')||(el.tagName==='P'&&!el.classList.contains('live-result-note')&&el.textContent.includes(String(breeds.length)))).forEach(el=>notes.append(el));
 const actions=wrap.querySelector('.result-actions');
 const compareButton=actions.querySelector('[data-compare]');if(compareButton){compareButton.textContent='⚖ '+resultText('Сравнить породы','Compare dogs','比较犬种');compareButton.classList.add('results-compare');}
 const footer=document.createElement('div');footer.className='result-footer-actions';
 const editFooter=document.createElement('button');editFooter.type='button';editFooter.textContent=resultText('Изменить ответы','Edit answers','修改回答');editFooter.onclick=edit.onclick;footer.append(editFooter);
 if(top.length){const save=document.createElement('button');save.type='button';save.textContent=resultText('Сохранить подбор','Save matches','保存匹配');save.onclick=()=>{
  const text='Pawday\n\n'+top.map(b=>t(b.name)+' — '+b.matchPercent+' '+resultText('баллов из 100','out of 100','/100')+'\n'+resultText('Почему подходит: ','What fits: ','匹配理由：')+b.pros.map(k=>t(v2Labels[k])).join(', ')+'\n'+resultText('Что учесть: ','Keep in mind: ','注意：')+(b.cons.map(v2Concern).join('; ')||resultText('Индивидуальные особенности собаки.','Individual dogs vary.','个体狗狗可能不同。'))).join('\n\n')+'\n\n'+resultText('Балл подбора — не вероятность совместимости.','Matching scores are not compatibility probabilities.','匹配分数不是相容概率。');
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Pawday-matches.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };footer.append(save);}
 actions.after(footer);footer.after(notes);
 const foot=document.createElement('p');foot.className='result-individual';foot.textContent=resultText('У каждой собаки свой характер. Балл подбора — не гарантия совместимости.','Every dog is an individual. A matching score is not a guarantee of compatibility.','每只狗都有自己的性格，匹配分数不保证相容性。');footer.after(foot);
};
if(step>=qs.length)render();
