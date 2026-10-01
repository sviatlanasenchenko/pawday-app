/* Preserve the three home rhythm levels through the merged-question adapter. */
(function(){
 const previousAnswers=v2Answers;
 v2Answers=function(source=answers){
  const result=previousAnswers(source);
  const rhythm=source.homeRhythm;
  const sameChoices=JSON.stringify(source.together)===JSON.stringify(source.homeRhythmChoices);
  if(Number.isInteger(rhythm)&&rhythm>=0&&rhythm<=2&&sameChoices){
   result.activity=[['slow_walks','park_play','sport'][rhythm]];
  }
  return result;
 };
 const previousPick=pick;
 pick=function(key,value){
  if(key==='together'){delete answers.homeRhythm;delete answers.homeRhythmChoices;}
  return previousPick.apply(this,arguments);
 };
 const previousHome=playfulHome;
 playfulHome=function(){
  previousHome();
  const button=app.querySelector('[data-playful-start]'),start=button.onclick;
  button.onclick=function(event){
   answers.homeRhythm=playfulRhythm;
   answers.homeRhythmChoices=[...new Set([playfulPlace==='hike'?2:playfulPlace==='park'?1:0,...(playfulRhythm===2?[3]:[])])];
   return start.call(this,event);
  };
 };
})();
