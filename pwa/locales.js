(function(){
 const host=window; const base=new URL("./",document.baseURI).pathname;
 const pages={en:base,ru:base+'ru/',zh:base+'zh/'};
 const metadata={
  en:{title:'Pawday — Find the right dog for your lifestyle',description:'Find a dog breed that fits your lifestyle. Explore 142 profiles with a free, 5-minute quiz. Available in English, Russian and Chinese.',locale:'en_US'},
  ru:{title:'Pawday — Какая собака подойдёт вашему образу жизни',description:'Подберите породу собаки под свой образ жизни. Бесплатная анкета на 5 минут, 142 профиля и понятные рекомендации. Без регистрации.',locale:'ru_RU'},
  zh:{title:'Pawday — 寻找适合你生活方式的狗狗',description:'用约5分钟的免费问卷，寻找适合你生活方式的狗狗。了解142个犬种及类型，无需注册。支持简体中文、英语和俄语。',locale:'zh_CN'}
 };
 const pathLang=()=>host.location.pathname.slice(base.length).replace(/\/+$/,'')==='ru'?'ru':host.location.pathname.slice(base.length).replace(/\/+$/,'')==='zh'?'zh':'en';
 const titles={ru:'Какая собака тебе подойдёт?',en:'Which dog is right for you?',zh:'哪种狗狗适合你？'};
 function syncNativeTitle(){
  const block=host.document.querySelector('.uc-pawday-title');if(!block)return;
  const title=block.querySelector('h1');if(title)title.textContent=titles[lang];
  block.style.display=step<0&&!host.location.hash.startsWith('#pawday-result=')?'':'none';
 }
 const previousRender=render;
 render=function(){previousRender();syncNativeTitle();};
 function syncLanguage(updatePath){
  const m=metadata[lang],code=lang==='zh'?'zh-Hans':lang;
  document.documentElement.lang=code;host.document.documentElement.lang=code;
  document.title=m.title;host.document.title=m.title;
  if(updatePath){
   let hash=host.location.hash;
   try{if(hash.startsWith('#pawday-result=')){const snapshot=JSON.parse(decodeURIComponent(hash.slice(15)));snapshot.l=lang;hash='#pawday-result='+encodeURIComponent(JSON.stringify(snapshot));}}catch{}
   host.history.replaceState(null,'',pages[lang]+host.location.search+hash);
  }
  const set=(selector,value)=>host.document.querySelector(selector)?.setAttribute('content',value);
  set('meta[name="description"]',m.description);set('meta[property="og:title"]',m.title);set('meta[property="og:description"]',m.description);set('meta[property="og:locale"]',m.locale);
  set('meta[property="og:url"]',host.location.origin+pages[lang]);
  host.document.querySelector('link[rel="canonical"]')?.setAttribute('href',host.location.origin+pages[lang]);
  document.getElementById('language').setAttribute('aria-label',lang==='ru'?'Язык':lang==='zh'?'语言':'Language');
  document.querySelector('.skip-link').textContent=lang==='ru'?'К вопросам':lang==='zh'?'跳至问卷':'Skip to questions';
 }
 const originalHome=playfulHome;
 playfulHome=function(){
  originalHome();
  const home=app.querySelector('.playful-home');if(!home)return;
  const copy=document.createElement('div');copy.className='pawday-hero-copy';
  const visual=document.createElement('div');visual.className='pawday-hero-visual';
  const heading=home.querySelector('.playful-heading');
  if(host.document.querySelector('.uc-pawday-title'))heading.querySelector('h1')?.remove();
  heading.querySelector('p').textContent=t(L('Ответь на 13 вопросов и узнай, какие породы подходят твоему образу жизни.','Answer 13 questions to discover dog breeds that fit your lifestyle.','回答13个问题，了解哪些犬种适合你的生活方式。'));
  const start=home.querySelector('.playful-start');
  start.firstChild.textContent=t(L('Подобрать породу','Find my dog breed','寻找适合我的犬种'));
  copy.append(heading,start,home.querySelector('.playful-meta'),home.querySelector('.playful-family'));
  const controls=home.querySelector('.playful-controls');
  const note=document.createElement('p');note.className='pawday-control-note';
  note.textContent=t(L('Эти предпочтения учтём в подборе.','We’ll use these preferences in your matches.','我们会在匹配时考虑这些偏好。'));
  controls.querySelector('h2').after(note);
  visual.append(home.querySelector('.playful-scene'),controls);
  home.append(copy,visual);
  const preview=document.createElement('section');preview.className='pawday-result-preview';
  const example=breeds.find(b=>b.latin==='Miniature Poodle'),photo=window.pawdayPhotos['Miniature Poodle'];
  preview.innerHTML=`<div><span class="home-kicker">${t(L('После анкеты','After the quiz','完成问卷后'))}</span><h2>${t(L('Породы, с которыми стоит познакомиться','Meet breeds worth getting to know','认识值得了解的犬种'))}</h2><p>${t(L('Посмотри, что подходит твоей жизни и к чему стоит подготовиться: прогулки, уход и общение.','Explore what fits your life and what to plan for: walks, grooming and companionship.','了解哪些犬种适合你的生活，以及散步、护理和陪伴需要做哪些准备。'))}</p></div><article class="pawday-example-card"><div class="pawday-example-top"><span class="pawday-example-label">${t(L('Пример результата','Example result','结果示例'))}</span><img src="${photo.src}" alt="${t(example.name)}" width="1080" height="1080" loading="lazy"></div><div class="pawday-example-body"><div class="pawday-example-title"><h3>${t(example.name)}</h3><span class="pawday-example-size">${t(example.size)}</span></div><dl class="pawday-example-facts"><div><dt>${t(L('Характер','Temperament','性格'))}</dt><dd>${t(L('Активный, любит учиться','Active and eager to learn','活跃，喜欢学习'))}</dd></div><div><dt>${t(L('Занятия','Activities','活动'))}</dt><dd>${t(L('Игры, обучение и общение каждый день','Daily play, learning and companionship','每天游戏、学习和陪伴'))}</dd></div><div><dt>${t(L('Уход','Grooming','护理'))}</dt><dd>${t(L('Регулярная стрижка и расчёсывание','Regular clipping and brushing','定期修剪和梳毛'))}</dd></div></dl><small>${t(L('Это пример. Твоя подборка появится после анкеты.','This is an example. Take the quiz to see your matches.','此卡片仅为示例。完成问卷后查看你的匹配结果。'))}</small><a class="pawday-photo-credit" href="${photo.sourcePage}" target="_blank" rel="noopener noreferrer">${t(L('Фото: ','Photo: ','照片：'))+photoEscape(photo.credit)+' · '+photoEscape(photo.license)} ↗</a></div></article>`;
  home.after(preview);
 };
 if(!host.location.hash.startsWith('#pawday-result=')){lang=pathLang();render();}
 syncLanguage(false);
 const select=document.getElementById('language'),previous=select.onchange;
 select.onchange=function(e){previous.call(this,e);syncLanguage(true);};
 host.addEventListener('popstate',()=>{lang=pathLang();render();syncLanguage(false);});
})();
