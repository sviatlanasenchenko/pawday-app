/* Source-linked cat guidance; applies to every profile and all three languages. */
(function(){
 const messages={
  catIntroduction:L('Совместное проживание возможно при постепенном знакомстве и социализации. Узнай об опыте собаки с кошками; предоставь кошке отдельное безопасное место. Это не гарантия совместимости.','Living together may work with gradual introductions and socialisation. Ask about this dog’s experience with cats and give your cat a separate safe space. Compatibility is not guaranteed.','逐步介绍和社会化可能帮助猫狗共同生活。了解这只狗与猫相处的经历，并为猫提供独立安全空间。不能保证相容。'),
  catManagement:L('Жизнь с домашней кошкой может быть возможна, но нужны обучение, контроль погони и постепенное знакомство. Отношение к своей и незнакомой кошке может различаться. Ранняя социализация помогает, но не гарантирует результат.','Living with a resident cat may be possible, with training, prevention of chasing and gradual introductions. A familiar cat and an unfamiliar cat may trigger different responses. Early socialisation can help, but does not guarantee success.','与家中的猫共同生活可能可行，但需要训练、防止追逐和逐步介绍。对熟悉的猫与陌生猫的反应可能不同。早期社会化有帮助，但不保证成功。'),
  catAssessment:L('Источник предупреждает о выраженном риске преследования. Это не означает, что все собаки этой породы не уживаются с кошками. До включения в основную подборку нужна оценка конкретной собаки и её опыта жизни с кошкой.','The source flags substantial chasing risk. This does not mean every dog of this breed is unable to live with cats. An individual assessment and a review of this dog’s history with cats are needed before a primary recommendation.','来源提示明显的追逐风险。这不代表该犬种的每只狗都不能与猫共处。在列入主要推荐前，需要评估具体狗狗及其与猫相处的经历。'),
  catEvidence:L('Данных именно о кошках недостаточно для уверенной рекомендации. Это не признак несовместимости: узнай историю конкретной собаки у заводчика или куратора и оцени её поведение с кошками.','There is not enough cat-specific evidence for a confident recommendation. This is not evidence of incompatibility: ask the breeder or carer about this individual dog’s history and behaviour with cats.','关于与猫共处的证据不足，无法作出有把握的推荐。这不代表不相容：请向繁育者或照护者了解具体狗狗与猫相处的经历和行为。')
 };
 v2Labels.catIntroduction=L('Кошки: постепенное знакомство','Cats: gradual introductions','猫：逐步介绍');
 v2Labels.catManagement=L('Кошки: обучение и контроль','Cats: training and supervision','猫：训练和监督');
 v2Labels.catAssessment=L('Кошки: нужна индивидуальная оценка','Cats: individual assessment needed','猫：需个体评估');
 v2Labels.catEvidence=L('Кошки: недостаточно данных','Cats: evidence is limited','猫：证据有限');
 const keyFor=category=>({introductions:'catIntroduction',management:'catManagement',assessment:'catAssessment',unknown:'catEvidence'})[category]||'catEvidence';
 const beforeConcern=v2Concern;
 v2Concern=function(key){return messages[key]?t(messages[key]):beforeConcern(key);};
 const beforeCard=v2Card;
 v2Card=function(r){
  const b=beforeCard(r),hasCats=v2Answers().household.some(k=>k==='cats'||k==='cats_other_pets');
  if(hasCats){
   const k=keyFor(window.pawdayCatReview?.[r.breed.id]?.category);
   b.pros=b.pros.filter(x=>x!=='cats');
   b.cons=[...new Set([...b.cons.filter(x=>!['cats','catIntroduction'].includes(x)),k])];
   b.issueKeys=b.cons;b.issues=b.cons.map(x=>v2Labels[x]);
  }
  return b;
 };
 for(const b of breeds){
  const review=window.pawdayCatReview?.[b.evidence.id],key=keyFor(review?.category);
  b.evidence.resultProfile.otherPets=messages[key];
 }
 const beforeCompromise=compromiseProfile;
 compromiseProfile=function(r){return beforeCompromise(r).replace('Не подходит: ','Требует внимания: ').replace('Does not fit: ','Needs attention: ').replace('不符合：','需关注：');};
 const beforeResults=renderResults;
 renderResults=function(){
  beforeResults();
  if(!v2Answers().household.some(k=>k==='cats'||k==='cats_other_pets'))return;
  const intro=app.querySelector('.results-intro');if(!intro)return;
  const note=document.createElement('p');note.className='cat-result-note';
  note.textContent=t(L('Кошка уже дома? Важны опыт конкретной собаки, ранняя социализация и спокойное знакомство. Наличие кошки и породный профиль сами по себе не гарантируют совместимость.','Already have a cat? The individual dog’s history, early socialisation and calm introductions matter. A resident cat and a breed profile alone cannot guarantee compatibility.','家里已有猫？具体狗狗的经历、早期社会化和平静的逐步介绍都很重要。已有猫和犬种档案本身不能保证相容。'));
  intro.append(note);
 };
})();
