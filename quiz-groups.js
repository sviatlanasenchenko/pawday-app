/* Thirteen screens; alone and training remain independent answer fields. */
const dayAloneQuestion={...qs.find(q=>q.key==='alone')};
const dayTrainingQuestion={...qs.find(q=>q.key==='training')};
const togetherQuestion=q('together','🎾',L('Как вы хотите проводить время с собакой?','How would you like to spend time with your dog?','你想怎样与狗狗共度时光？'),L('Выбери занятия, которые действительно подходят вашему обычному ритму. Можно несколько.','Choose activities that fit your everyday routine. You can select several.','请选择适合日常节奏的活动，可以多选。'),[
 o(0,'🏡','Общение дома и неспешные прогулки','Company at home and easy walks','居家陪伴和悠闲散步'),
 o(1,'🎾','Активные игры в парке','Active play in the park','在公园活跃玩耍'),
 o(2,'🥾','Походы и длительные прогулки','Hikes and long walks','徒步和长距离散步'),
 o(3,'🎯','Бег, спорт и обучение трюкам','Running, sports and learning tricks','跑步、运动和学习技巧'),
 o(4,'💭','Пока не знаю','Not sure yet','暂时不确定')
],true);
const oldGoalIndex=qs.findIndex(q=>q.key==='goal');
qs.splice(oldGoalIndex,1,togetherQuestion);
for(const key of ['activity','training'])qs.splice(qs.findIndex(q=>q.key===key),1);
const dayQuestion=qs.find(q=>q.key==='alone');
dayQuestion.title=L('Как будет устроен день собаки?','What will your dog’s day look like?','狗狗的一天会怎样安排？');
dayQuestion.sub=L('Ответь на оба пункта. Время одиночества и время занятий учитываются отдельно.','Answer both parts. Time alone and training time are assessed separately.','请回答两个部分，独处与训练时间分别计算。');
dayQuestion.longHelp=dayQuestion.sub;
dayQuestion.parts=[dayAloneQuestion,dayTrainingQuestion];
const plainHasAnswer=hasAnswer;
hasAnswer=function(Q){return Q.parts?Q.parts.every(plainHasAnswer):plainHasAnswer(Q);};
const ungroupedAnswers=v2Answers;
v2Answers=function(source=answers){
 const a=ungroupedAnswers(source),values=source.together||[];
 // Old hidden goal/activity answers cannot override the merged choice.
 a.purpose=[];a.activity=[];a.mergedActivities=true;
 if(!values.includes(4)){
  if(values.includes(0))a.activity.push('slow_walks');
  if(values.includes(1)||values.includes(2))a.activity.push('park_play');
  if(values.includes(2))a.purpose.push('adventure');
  if(values.includes(3)){a.activity.push('sport');a.purpose.push('sport');}
 }
 return a;
};
liveRankingKeys.push('together');
liveText.difference=L('Счётчик показывает соответствие важным условиям. Занятия, время обучения и итоговый балл дополнительно влияют на окончательную подборку.','The counter shows fit with important requirements. Activities, training time and the final score also affect the final selection.','计数器显示重要条件的匹配，活动、训练时间和最终分数也影响最终筛选。');
for(const chapter of chapters){chapter.keys=chapter.keys.filter(k=>!['goal','activity','training'].includes(k));}
chapters.find(c=>c.keys.includes('alone')).keys.push('together');
ui.questions=L('13 коротких шагов','13 quick steps','13个简短步骤');
editAnswer=function(key){
 const index=qs.findIndex(q=>q.key===key||q.parts?.some(part=>part.key===key));
 if(index<0)return;
 step=index;dayId=null;compare=false;render();window.scrollTo({top:0,behavior:'instant'});
};

function groupedOptionMarkup(Q){
 return `<div class="template-options" role="group" aria-label="${t(Q.title)}">${Q.options.map(O=>`<button type="button" class="template-option" data-choice="${O.id}" data-answer-key="${Q.key}" aria-pressed="${selected(Q,O.id)}"><span class="option-copy"><span>${t(O.label)}</span>${liveOptionMarkup(Q,O)}</span><span class="template-dot ${Q.multi?'multi':''}" aria-hidden="true"></span></button>`).join('')}</div>`;
}
function quizAnswersMarkup(Q){
 if(!Q.parts)return `<p class="template-answer-hint">${t(Q.multi?ui.multi:ui.choose)}${Q.multi&&hasAnswer(Q)?` <span class="selection-count">${t(L('Выбрано','Selected','已选'))}: ${answers[Q.key].length}</span>`:''}</p>${groupedOptionMarkup(Q)}`;
 return `<div class="day-answer-blocks">${Q.parts.map(part=>`<section class="day-answer-block"><h3>${t(part.title)}</h3>${groupedOptionMarkup(part)}</section>`).join('')}</div>`;
}
function quizExtraHelp(Q){
 if(Q.parts)return `<p>${t(L('Время одиночества влияет на счётчик важных условий. Время обучения дополнительно учитывается в окончательном подборе.','Time alone affects the important-requirements counter. Training time is also considered in final matching.','独处时间影响重要条件计数，训练时间也会在最终匹配中考虑。'))}</p>`;
 return liveRankingKeys.includes(Q.key)?`<p>${t(Q.key==='allergy'?liveText.allergy:liveText.ranking)}</p>`:'';
}
