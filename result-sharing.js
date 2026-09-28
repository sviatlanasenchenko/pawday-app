/* Native share menu with copy fallback and a read-only shared-result view. */
(function(){
 const S=window.PawdayShare,txt=(ru,en,zh)=>t(L(ru,en,zh));
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let shared=null,invalid=false,busy=false;
 function readLink(){
  shared=null;invalid=false;
  try{shared=S.parse(window.location.hash,new Set(breeds.map(b=>b.evidence.id)));if(shared)lang=shared.l;}
  catch{invalid=true;}
 }
 function status(message){const node=app.querySelector('#sharetext');if(node)node.textContent=message;}
 function payloadFor(cards){
  const data=S.snapshot(cards,lang),url=S.url(data,window.location.href);
  const title=txt('Моя подборка Pawday','My Pawday matches','我的Pawday匹配');
  const text=title+'\n'+cards.slice(0,3).map(b=>t(b.name)+' — '+b.matchPercent+'/100').join('\n')+'\n'+txt('Балл подбора — не гарантия совместимости.','Matching scores do not guarantee compatibility.','匹配分数不保证相容性。');
  return {title,text,url};
 }
 function fallback(payload){
  app.querySelector('.share-fallback')?.remove();
  const panel=document.createElement('section');panel.className='share-fallback panel';
  const content=payload.text+'\n\n'+payload.url;
  panel.innerHTML=`<h2>${txt('Отправить подборку','Send these matches','分享匹配')}</h2><p>${txt('Выбери приложение или скопируй текст со ссылкой.','Choose an app or copy the text and link.','选择应用或复制文字和链接。')}</p><div class="share-destinations"><a target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(content)}">WhatsApp</a><a target="_blank" rel="noopener noreferrer" href="https://t.me/share/url?url=${encodeURIComponent(payload.url)}&text=${encodeURIComponent(payload.text)}">Telegram</a><a href="mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(content)}">${txt('Почта','Email','邮件')}</a></div><label for="share-copy-text">${txt('Текст и ссылка на подборку','Result text and link','匹配文字和链接')}</label><textarea id="share-copy-text" readonly rows="6"></textarea><div class="share-copy-actions"><button class="outline" type="button" data-copy-result>${txt('Скопировать','Copy','复制')}</button><button class="textbutton" type="button" data-close-share>${txt('Закрыть','Close','关闭')}</button></div><p class="share-feedback" role="status"></p>`;
  (app.querySelector('.result-actions')||app.querySelector('.shared-actions')).after(panel);
  const textarea=panel.querySelector('textarea');textarea.value=content;
  panel.querySelector('[data-copy-result]').onclick=async()=>{
   try{if(!navigator.clipboard?.writeText)throw Error('Unavailable');await navigator.clipboard.writeText(content);panel.querySelector('.share-feedback').textContent=txt('Текст и ссылка скопированы.','Text and link copied.','文字和链接已复制。');}
   catch{textarea.focus();textarea.select();textarea.setSelectionRange(0,textarea.value.length);panel.querySelector('.share-feedback').textContent=txt('Выделенный текст можно скопировать через меню телефона или Ctrl/Cmd+C.','Copy the selected text using your device menu or Ctrl/Cmd+C.','请使用设备菜单或Ctrl/Cmd+C复制选中的文字。');}
  };
  panel.querySelector('[data-close-share]').onclick=()=>{panel.remove();app.querySelector('[data-share-result]')?.focus();};
  panel.scrollIntoView({block:'center',behavior:'smooth'});panel.querySelector('[data-copy-result]').focus({preventScroll:true});
 }
 async function shareCards(cards){
  if(busy||!cards.length)return;
  const payload=payloadFor(cards);busy=true;
  app.querySelectorAll('[data-share-result]').forEach(b=>b.disabled=true);
  try{const result=await S.send(payload,navigator,fallback);if(result==='shared')status(txt('Подборка передана в меню отправки.','The result was passed to the sharing menu.','匹配已交给分享菜单。'));}
  finally{busy=false;app.querySelectorAll('[data-share-result]').forEach(b=>b.disabled=false);}
 }
 const beforeResults=renderResults;
 renderResults=function(){
  beforeResults();const cards=matchOutcome().matches;if(!cards.length)return;
  const label=txt('Поделиться результатом','Share results','分享结果');
  const old=app.querySelector('[data-share]');
  if(old){old.textContent=txt('Поделиться','Share','分享');old.className='result-share-label';old.dataset.shareResult='';old.setAttribute('aria-label',label);old.onclick=()=>shareCards(cards);}
  const actions=app.querySelector('.result-actions');if(!actions)return;
  const button=document.createElement('button');button.type='button';button.className='outline results-share';button.dataset.shareResult='';button.textContent=label;button.onclick=()=>shareCards(cards);actions.append(button);
  const note=document.createElement('p');note.className='share-privacy';note.textContent=txt('В ссылке — первые три варианта или меньше. Ответы на вопросы не передаются.','The link contains up to three top matches. Questionnaire answers are not shared.','链接包含最多三个首选结果，不分享问卷答案。');actions.append(note);
 };
 function leaveShared(){shared=null;invalid=false;window.history.replaceState(null,'',window.location.pathname+window.location.search);step=-1;render();window.scrollTo({top:0});}
 function renderShared(){
  document.documentElement.lang=lang==='zh'?'zh-Hans':lang;document.getElementById('language').value=lang;
  document.title='Pawday — '+txt('Подборка друга','Shared matches','好友的匹配');
  if(invalid){app.innerHTML=`<section class="warm-results shared-results panel"><h1>${txt('Ссылка на подборку недоступна','This result link is unavailable','此匹配链接不可用')}</h1><p>${txt('Возможно, ссылка скопирована не полностью. Попроси отправить её заново или пройди свой тест.','The link may be incomplete. Ask for a new link or find your own matches.','链接可能不完整。请索取新链接或进行自己的测试。')}</p><button class="primary" data-own-quiz>${txt('Найти моего друга','Find my match','寻找我的伙伴')}</button></section>`;app.querySelector('[data-own-quiz]').onclick=leaveShared;return;}
  const cards=shared.items.map(item=>({...breeds.find(b=>b.evidence.id===item.id),matchPercent:item.score}));
  app.innerHTML=`<section class="warm-results shared-results"><div class="results-intro"><span class="results-eyebrow">PAWDAY</span><h1>${txt('С тобой поделились подборкой','Someone shared their matches','好友分享的匹配')}</h1><p>${txt('Сохранённый результат другого человека','Another person’s saved result','另一位用户保存的结果')}</p></div><div class="shared-cards">${cards.map(b=>`<article class="shared-profile"><h2>${esc(t(b.name))}</h2><p class="snapshot-score">${b.matchPercent}/100 · ${txt('балл подбора','matching score','匹配分数')}</p>${breedPhoto(b)}<p>${esc(t(b.evidence.description))}</p></article>`).join('')}</div><p class="result-individual">${txt('Это не персональная рекомендация для тебя. Ответы и индивидуальные условия автора не передаются. У каждой собаки свой характер; балл не гарантирует совместимость.','These are not personalised recommendations for you. The sender’s answers and individual circumstances are not shared. Every dog is an individual; scores do not guarantee compatibility.','这些不是针对你的个性化推荐。作者的答案和个人情况不会分享。每只狗都有自己的性格，分数不保证相容性。')}</p><div class="shared-actions"><button class="primary" data-own-quiz>${txt('Найти моего друга','Find my match','寻找我的伙伴')}</button><button class="outline" data-share-result>${txt('Поделиться подборкой','Share these matches','分享这些匹配')}</button></div><p id="sharetext" role="status"></p></section>`;
  app.querySelector('[data-own-quiz]').onclick=leaveShared;app.querySelector('[data-share-result]').onclick=()=>shareCards(cards);
 }
 const beforeRender=render;render=function(){if(shared||invalid){renderShared();return;}beforeRender();};
 const brand=document.querySelector('.brand'),beforeBrand=brand.onclick;brand.onclick=e=>{if(shared||invalid){e.preventDefault();leaveShared();}else beforeBrand?.(e);};
 window.addEventListener('hashchange',()=>{readLink();render();});
 readLink();if(shared||invalid||step===qs.length)render();
})();
