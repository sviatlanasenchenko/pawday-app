/* Separate coat preferences from allergy guidance. Neither coat length nor low
 * shedding establishes an individual person's tolerance. */
qs.splice(qs.findIndex(q=>q.key==='care'),0,
 q('allergy','🌿',L('Есть ли у кого-то дома аллергия на собак?','Does anyone at home have a dog allergy?','家里有人对狗过敏吗？'),L('Полностью гипоаллергенных собак нет. Этот ответ добавит рекомендации, но не определит безопасную породу.','No dog is completely hypoallergenic. This answer adds guidance; it cannot identify a safe breed.','没有完全不会引起过敏的狗。此回答用于提供提示，不能确定安全的犬种。'),[
  o(0,'✓','Нет известной аллергии','No known allergy','没有已知过敏'),
  o(1,'🌿','Да, есть','Yes','有'),
  o(2,'💭','Не знаю / возможно','Unsure / possibly','不确定／可能有')])
);
qs.find(q=>q.key==='allergy').longHelp=L('Аллергены есть в частицах кожи, слюне и моче, а не только на шерсти. При известной или предполагаемой аллергии обсуди выбор с аллергологом. Даже слабая линька не гарантирует отсутствие реакции.','Allergens occur in skin flakes, saliva and urine, not just on fur. Discuss known or suspected allergy with an allergist. Low shedding cannot guarantee freedom from symptoms.','过敏原存在于皮屑、唾液和尿液中，不只在毛发上。如已知或怀疑过敏，请咨询过敏专科医生。掉毛少不能保证不会出现症状。');
chapters.find(c=>c.keys.includes('care')).keys.push('allergy');
// Do not let a removed answer silently filter a returning user's results.
delete answers.shedding;
ui.questions=L(`${qs.length} коротких вопросов`,`${qs.length} quick questions`,`${qs.length}个简短问题`);
function coatSummary(b){
 const coat=window.pawdayCoats[b.latin],level=coat?.shedding;
 const label=level==='rated'?L(`Линька: ${coat.rating} из 5`,`Shedding: ${coat.rating} of 5`,`掉毛：${coat.rating}/5`):level==='low'?L('Линька: слабая','Shedding: low','掉毛：少'):level==='variable'?L('Линька: зависит от конкретной собаки','Shedding: varies by individual','掉毛：因个体而异'):L('Линька: данные ещё не подтверждены','Shedding: not yet verified','掉毛：尚未确认');
 const note=level==='rated'?L('Оценка линьки из базы: 1 — минимальная, 5 — сильная. Уточни особенности конкретной собаки.','Database shedding scale: 1 is minimal, 5 is heavy. Check the individual dog’s coat.','数据库掉毛评分：1为极少，5为严重。请了解具体狗狗的毛发。'):level==='low'?L('Уход за шерстью всё равно нужен. Слабая линька не гарантирует отсутствия аллергии.','Coat care is still needed. Low shedding does not guarantee allergy safety.','仍需护理毛发。掉毛少不代表不会引起过敏。'):L('Уточни линьку и уход у заводчика или приюта. Не считаем неизвестное слабой линькой.','Ask the breeder or shelter about shedding and care. Unknown is not treated as low shedding.','请向繁育者或收容所了解掉毛和护理情况。未知不等于掉毛少。');
 return `<div class="coat-fact"><p><strong>${t(label)}</strong></p><p class="footnote">${t(note)}${coat?.sourceUrl?` <a href="${coat.sourceUrl}" target="_blank" rel="noopener noreferrer">AKC</a>`:''}</p></div>`;
}
function coatAllergyNotice(){
 if(answers.allergy!==1&&answers.allergy!==2)return '';
 return `<aside class="panel"><h2>${t(L('Аллергия требует отдельной проверки','Allergy needs an individual assessment','过敏需要单独评估'))}</h2><p>${t(qs.find(q=>q.key==='allergy').longHelp)}</p><p>${t(L('Результаты ниже учитывают образ жизни, но не подтверждают переносимость собак.','The results below reflect lifestyle, but do not confirm allergy tolerance.','以下结果基于生活方式，不能确认你对狗的过敏耐受情况。'))}</p><a href="https://acaai.org/allergies/allergic-conditions/pet-allergies/" target="_blank" rel="noopener noreferrer">${t(L('Объяснение аллергологов ACAAI','ACAAI allergy guidance','ACAAI 过敏指导'))}</a></aside>`;
}
