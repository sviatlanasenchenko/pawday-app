/* Existing answers only; no extra questions or options. */
(function(){
 const labels={
  ownershipHousehold:L('Состав семьи','Household','家庭组成'),
  ownershipExperience:L('Личный опыт воспитания собаки','Hands-on dog-raising experience','亲自养育狗狗的经验'),
  ownershipTraining:L('Время на обучение','Time for training','训练时间'),
  ownershipWalk:L('Время на прогулки','Time for walks','散步时间'),
  supportedOwnership:L('Обучение и социализация','Training and socialization','训练与社会化')
 };
 Object.assign(v2Labels,labels);
 const messages={
  ownershipHousehold:L('В Pawday этот профиль рассматривается для семьи без детей младше 6 лет. Это правило подбора, а не гарантия совместимости с детьми старшего возраста.','Pawday considers this profile for households without children under 6. This matching rule does not guarantee compatibility with older children.','Pawday仅在家中没有6岁以下儿童时考虑此档案。这是匹配规则，并不保证与年长儿童相容。'),
  ownershipExperience:L('Для основной подборки этого профиля нужен ответ «Есть опыт»: личное участие в уходе, обучении и воспитании собаки.','Primary matching for this profile requires “I have experience”: hands-on care, training and raising a dog.','此档案进入主要匹配需要选择“有养狗经验”，即亲自参与照顾、训练和养育狗狗。'),
  ownershipTraining:L('Для этого профиля Pawday учитывает максимальный доступный ответ «30–60 минут и больше». Он не подтверждает строго больше часа: занятия и социализацию планируют короткими сессиями в течение дня.','For this profile Pawday uses the highest available answer, “30–60 minutes or more.” It does not confirm more than an hour: plan training and socialization in short sessions throughout the day.','对此档案，Pawday采用最高可选项“30–60分钟或更多”。这不确认超过一小时；训练与社会化应分成全天多次短时活动。'),
  ownershipWalk:L('Для этого профиля Pawday требует ответ «Больше 3 часов» как запас времени владельца. Это не предписание гулять столько ежедневно: нагрузку подбирают по возрасту, здоровью и конкретной собаке.','For this profile Pawday requires “Over 3 hours” as owner time capacity. This is not a daily exercise prescription: adjust activity to the dog’s age, health and individual needs.','对此档案，Pawday要求选择“超过3小时”作为主人的可用时间，而非每日运动处方；应按年龄、健康及个体需要安排活动。'),
  supportedOwnership:L('Важны последовательное обучение, социализация и управление поведением. Взрослый отвечает за взаимодействие с детьми; возраст 6–17 лет сам по себе не гарантирует совместимость.','Consistent training, socialization and behavior management matter. An adult is responsible for interactions with children; ages 6–17 alone do not establish compatibility.','持续训练、社会化和行为管理很重要。成人应负责儿童与狗狗的互动；6–17岁这一年龄段本身不能保证相容。')
 };
 const previousConcern=v2Concern;
 v2Concern=function(key){return messages[key]?t(messages[key]):previousConcern(key);};
 const previousCard=v2Card;
 v2Card=function(r){
  const card=previousCard(r);
  if(matcherV2.requiresSupportedOwnership(r.breed)){
   card.cons=[...new Set([...card.cons,'supportedOwnership',...(r.breed.isMixed?['individual']:[])])];
   card.issueKeys=card.cons;card.issues=card.cons.map(v2Concern);
  }
  return card;
 };
 liveCountLabel=function(count,total){return t(L(`По выбранным условиям остаётся ${count} из ${total} профилей`,`${count} of ${total} profiles remain under your selections`,`按所选条件剩余${count}/${total}个档案`));};
 liveText.important=L('Предварительный список — остальные ответы могут его изменить','Preliminary list — later answers may change it','初步名单，后续回答可能改变结果');
 const previousCounter=liveCounterMarkup;
 liveCounterMarkup=function(Q){
  const keys=qs.flatMap(q=>q.parts?q.parts.map(p=>p.key):[q.key]);
  const started=keys.some(k=>k!=='together'&&answers[k]!==undefined&&(!Array.isArray(answers[k])||answers[k].length));
  if(!started)return `<div class="live-counter" role="status" aria-live="polite"><strong>${t(L(`В базе ${breeds.length} профиля`,`Explore ${breeds.length} profiles in the database`,`数据库中有${breeds.length}个档案`))}</strong><small>${t(L('Ответь на вопросы, чтобы сузить подбор','Answer the questions to narrow your matches','回答问题以缩小匹配范围'))}</small></div>`;
  return previousCounter(Q);
 };
 liveText.difference=L('Счётчик учитывает выбранные условия, включая время занятий для профилей с дополнительными требованиями к владельцу. Итоговая подборка также зависит от занятий и общего балла.','The counter includes selected requirements, including training time for profiles with additional owner requirements. Final matches also depend on activities and the overall score.','计数器包含所选条件，包括对主人有额外要求的档案的训练时间。最终匹配还取决于活动和总分。');
 const previousExtraHelp=quizExtraHelp;
 quizExtraHelp=function(Q){return Q.parts?`<p>${t(L('Время отсутствия и обучения учитывается отдельно. Для некоторых профилей максимальное время занятий — обязательное условие основной подборки.','Time away and training time are assessed separately. Some profiles require the highest training-time option for primary matching.','离家与训练时间分别评估。部分档案进入主要匹配需选择最高训练时间选项。'))}</p>`:previousExtraHelp(Q);};
 render();
})();
// Size cards describe one category, not the result of toggling a selection.
(function(){
 const originalOptionMarkup=liveOptionMarkup;
 liveOptionMarkup=function(Q,O){
  if(Q.key!=='size')return originalOptionMarkup(Q,O);
  const {count}=liveCount({...answers,size:[O.id]});
  const ruWord=count%10===1&&count%100!==11?'профиль':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'профиля':'профилей';
  return `<small class="option-count ${count===0?'zero-count':''}" data-preview-count="${count}">${t(L(`${count} ${ruWord}`,`${count} ${count===1?'profile':'profiles'}`,`${count}个档案`))}</small>`;
 };
})();
