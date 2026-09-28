/* Public result snapshots contain only catalog IDs, scores and display language. */
(function(root){
 const prefix='#pawday-result=';
 function snapshot(cards,language){
  return {v:1,l:['ru','en','zh'].includes(language)?language:'ru',items:cards.slice(0,3).map(b=>({id:b.evidence?.id||b.ratings?.id||b.id,score:Math.round(b.matchPercent)}))};
 }
 function parse(hash,knownIds){
  if(!hash.startsWith(prefix))return null;
  if(hash.length>2500)throw Error('Invalid result');
  let data;try{data=JSON.parse(decodeURIComponent(hash.slice(prefix.length)));}catch{throw Error('Invalid result');}
  if(!data||data.v!==1||!['ru','en','zh'].includes(data.l)||!Array.isArray(data.items)||data.items.length<1||data.items.length>3)throw Error('Invalid result');
  const seen=new Set();
  for(const item of data.items){if(!item||typeof item.id!=='string'||!knownIds.has(item.id)||seen.has(item.id)||!Number.isInteger(item.score)||item.score<0||item.score>100)throw Error('Invalid result');seen.add(item.id);}
  return {v:1,l:data.l,items:data.items.map(({id,score})=>({id,score}))};
 }
 function url(data,base){const u=new URL(base);u.search='';u.hash='pawday-result='+encodeURIComponent(JSON.stringify(data));return u.href;}
 async function send(payload,navigatorObject,onFallback){
  if(typeof navigatorObject.share==='function'){
   try{await navigatorObject.share(payload);return 'shared';}
   catch(error){if(error?.name==='AbortError')return 'cancelled';}
  }
  onFallback(payload);return 'fallback';
 }
 root.PawdayShare={snapshot,parse,url,send,prefix};
})(typeof window==='undefined'?globalThis:window);
