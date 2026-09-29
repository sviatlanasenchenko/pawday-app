/* Photo attribution is always accessible, including when breed details are closed. */
(function(){
 'use strict';
 const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tr=(ru,en,zh)=>t(L(ru,en,zh));
 function update(){
  let footer=document.getElementById('pawday-photo-credits');
  if(!footer){footer=document.createElement('footer');footer.id='pawday-photo-credits';footer.className='pawday-photo-credits';document.getElementById('app').after(footer);}
  if(footer.dataset.lang!==lang){
   const open=footer.querySelector('details')?.open;
   footer.dataset.lang=lang;
   footer.innerHTML=`<details${open?' open':''}><summary>${tr('Фотографии и авторы','Photos & credits','照片与署名')}</summary><p>${tr('Фотографии отдельных собак иллюстрируют породы и типы. Внешность других собак может отличаться. Авторство и лицензия каждого снимка указаны ниже.','Photographs show individual examples of breeds and types. Other dogs may look different. Each image’s author and license are listed below.','照片展示各犬种和类型的个体示例，其他狗狗的外观可能不同。每张照片的作者和许可列于下方。')}</p><label for="photo-credit-search">${tr('Найти породу или автора','Find a breed or photographer','搜索犬种或摄影师')}</label><input id="photo-credit-search" type="search" autocomplete="off"><ul>${Object.entries(window.pawdayPhotos).map(([name,p])=>{
    const b=breeds.find(b=>b.latin===name),label=b?t(b.name):name;
    return `<li data-search="${esc((label+' '+name+' '+p.credit).toLowerCase())}"><strong>${esc(label)}</strong><span>${esc(p.credit)}</span><a href="${esc(p.sourcePage)}" target="_blank" rel="noopener noreferrer">${esc(p.sourceTitle||name)}</a><a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a><small>${tr('Отображение уменьшено; снимок не ретуширован. Предыдущие изменения: см. оригинал.','Displayed at a reduced size; no retouching. See the source for prior edits.','缩小显示，未修饰。先前修改请见原始页面。')}</small></li>`;
   }).join('')}</ul><p class="photo-credit-empty" hidden>${tr('Совпадений нет.','No matching credits.','未找到匹配项。')}</p></details>`;
   footer.querySelector('input').oninput=e=>{const q=e.target.value.trim().toLowerCase();let count=0;footer.querySelectorAll('li').forEach(li=>{li.hidden=!li.dataset.search.includes(q);if(!li.hidden)count++;});footer.querySelector('.photo-credit-empty').hidden=count>0;};
  }
  const homeCredit=document.querySelector('.pawday-photo-credit'),photo=window.pawdayPhotos['Miniature Poodle'];
  if(homeCredit&&photo){homeCredit.textContent=tr('Фото: ','Photo: ','照片：')+photo.credit+' · '+photo.license+' ↗';homeCredit.href=photo.sourcePage;}
 }
 const style=document.createElement('style');style.textContent=`.pawday-photo-credits{max-width:1100px;margin:28px auto;padding:18px 24px;border-top:1px solid #dce4d7;color:#36564b;font:13px/1.65 Arial,sans-serif}.pawday-photo-credits summary{cursor:pointer;font-weight:700}.pawday-photo-credits input{display:block;width:100%;max-width:450px;margin:8px 0 20px;padding:10px 12px;border:1px solid #9aafa1;border-radius:10px;background:#fffdf8;color:#123b32;font:inherit}.pawday-photo-credits ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pawday-photo-credits li{display:flex;flex-direction:column;padding:15px;border:1px solid #dce4d7;border-radius:12px;overflow-wrap:anywhere}.pawday-photo-credits li[hidden]{display:none}.pawday-photo-credits a{color:#285e49;text-decoration:underline}.pawday-photo-credits strong{font-size:15px}.pawday-photo-credits small{margin-top:8px;color:#52685d}@media(max-width:650px){.pawday-photo-credits ul{grid-template-columns:1fr}.pawday-photo-credits{padding:16px}}`;
 document.head.append(style);
 const previous=render;
 render=function(){const result=previous.apply(this,arguments);update();return result;};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update,{once:true});else update();
})();
