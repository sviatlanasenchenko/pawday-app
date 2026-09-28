/* Playful home preferences map to existing goal/activity answers, never housing. */
const playfulChoices=[
 {id:'home',icon:'🛋️',label:L('Дома','At home','在家'),goals:[0]},
 {id:'park',icon:'🌳',label:L('В парке','In the park','公园'),goals:[0,1]},
 {id:'hike',icon:'🏔️',label:L('В походе','On a hike','徒步'),goals:[1]}
];
const playfulRhythms=[L('Спокойно','Easygoing','悠闲'),L('В меру активно','A little adventure','适度活跃'),L('Очень активно','Full of energy','充满活力')];
let playfulPlace='park',playfulRhythm=1;
const renderCompactQuiz=render;
function playfulHome(){
 document.documentElement.lang=lang==='zh'?'zh-Hans':lang;
 document.getElementById('language').value=lang;
 document.getElementById('prototype').textContent='';
 document.title='Pawday — '+t(ui.tag);
 app.innerHTML=`<section class="playful-home"><div class="playful-heading"><span class="home-kicker">${t(L('Твой будущий друг — рядом','Your future friend is out there','未来的伙伴就在身边'))} <span aria-hidden="true">✦</span></span><h1>${t(L('Какая собака тебе подойдёт?','Which dog is your kind of friend?','哪只狗狗适合你？'))}</h1><p>${t(L('Давай найдём друга под твой ритм жизни','Let’s find a friend for your rhythm of life','找到适合你生活节奏的伙伴'))}</p></div><div class="playful-scene" data-scene="${playfulPlace}" data-rhythm="${playfulRhythm}">${playfulChoices.map(c=>`<img class="scene-backdrop ${c.id===playfulPlace?'is-visible':''}" data-backdrop="${c.id}" src="scenes/${c.id}.png" alt="" width="1536" height="1024">`).join('')}<div class="scene-speech" role="status">${t(L('Поиграем?','Want to play?','一起玩吧？'))}</div><div class="home-pet"><button type="button" class="home-dog" data-home-dog aria-label="${t(L('Погладить собачку','Pet the puppy','摸摸小狗'))}"><span class="mascot-sprite" aria-hidden="true"></span></button><button type="button" class="home-ball" data-home-ball aria-label="${t(L('Подбросить мячик','Toss the ball','抛球'))}" title="${t(L('Подбросить мячик','Toss the ball','抛球'))}"></button></div><span class="scene-heart" aria-hidden="true">♥</span></div><div class="playful-controls"><h2>${t(L('Как проведём выходной?','How shall we spend the weekend?','周末怎么过？'))}</h2><div class="place-options" role="group" aria-label="${t(L('Выходной с собакой','A day with your dog','和狗狗度过一天'))}">${playfulChoices.map(c=>`<button class="place-option" type="button" data-place="${c.id}" aria-pressed="${c.id===playfulPlace}"><span class="place-check" aria-hidden="true">✓</span><span class="place-icon" aria-hidden="true">${c.icon}</span><span>${t(c.label)}</span></button>`).join('')}</div><div class="rhythm-heading"><label for="home-rhythm">${t(L('Твой ритм','Your rhythm','你的节奏'))}</label><output for="home-rhythm" id="rhythm-label">${t(playfulRhythms[playfulRhythm])}</output></div><div class="rhythm-track"><span aria-hidden="true">☾</span><input id="home-rhythm" type="range" min="0" max="2" step="1" value="${playfulRhythm}" aria-valuetext="${t(playfulRhythms[playfulRhythm])}" style="--fill:${playfulRhythm*50}%"><span aria-hidden="true">ϟ</span></div></div><button type="button" class="playful-start" data-playful-start>${t(L('Найти моего друга','Find my friend','寻找我的伙伴'))}<span aria-hidden="true">→</span></button><p class="playful-meta">${t(L('≈ 5 минут · Без регистрации','≈ 5 minutes · No sign-up','约5分钟 · 无需注册'))}</p><p class="playful-family">${t(L('До 18 лет — проходи вместе со взрослым','Under 18? Take the quiz with an adult','未满18岁请与大人一起完成'))}</p></section>`;
 const scene=app.querySelector('.playful-scene'),pet=app.querySelector('.home-pet'),speech=app.querySelector('.scene-speech');
 const react=(kind,message)=>{pet.classList.remove('pet-catch','pet-greet');void pet.offsetWidth;pet.classList.add(kind);speech.textContent=t(message);};
 app.querySelectorAll('[data-place]').forEach(button=>button.onclick=()=>{
  playfulPlace=button.dataset.place;scene.dataset.scene=playfulPlace;
  app.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===playfulPlace)));
  app.querySelectorAll('[data-backdrop]').forEach(b=>b.classList.toggle('is-visible',b.dataset.backdrop===playfulPlace));
  react('pet-greet',playfulPlace==='home'?L('Устроимся поуютнее!','Let’s get cozy!','一起舒舒服服！'):playfulPlace==='park'?L('Берём мячик!','Let’s take the ball!','带上球吧！'):L('Навстречу приключениям!','An adventure awaits!','探险去！'));
 });
 const slider=app.querySelector('#home-rhythm');slider.oninput=()=>{
  playfulRhythm=Number(slider.value);scene.dataset.rhythm=String(playfulRhythm);
  slider.style.setProperty('--fill',`${playfulRhythm*50}%`);
  slider.setAttribute('aria-valuetext',t(playfulRhythms[playfulRhythm]));
  app.querySelector('#rhythm-label').textContent=t(playfulRhythms[playfulRhythm]);
  pet.classList.remove('pet-catch','pet-greet');
  speech.textContent=t(playfulRhythm===0?L('Никуда не спешим','No need to rush','慢慢来'):playfulRhythm===1?L('Поиграем?','Want to play?','一起玩吧？'):L('Лови мячик!','Catch the ball!','接球！'));
 };
 app.querySelector('[data-home-dog]').onclick=()=>react('pet-greet',L('Рад тебя видеть!','Happy to see you!','见到你真开心！'));
 app.querySelector('[data-home-ball]').onclick=()=>react('pet-catch',L('Ловлю!','Got it!','接住啦！'));
 app.querySelector('[data-playful-start]').onclick=()=>{
  answers.goal=[...playfulChoices.find(c=>c.id===playfulPlace).goals];
  answers.activity=[playfulRhythm];
  answers.together=[...new Set([playfulPlace==='hike'?2:playfulPlace==='park'?1:0,...(playfulRhythm===2?[3]:[])])];
  compactStarted=true;
  const next=qs.findIndex(Q=>!hasAnswer(Q));
  moveToQuestion(next<0?qs.length:next);
 };
}
render=function(){
 if(step<0){playfulHome();return;}
 compactStarted=true;renderCompactQuiz();
 const Q=qs[step];if(!Q)return;
 app.querySelectorAll('[data-choice]').forEach(button=>{
  const option=(button.dataset.answerKey?questionByKey(button.dataset.answerKey):Q)?.options.find(o=>o.id===Number(button.dataset.choice));
  const icon=document.createElement('span');icon.className='quiz-tile-icon';icon.setAttribute('aria-hidden','true');icon.textContent=option?.icon||'🐾';
  button.prepend(icon);
 });
};
step=-1;render();
