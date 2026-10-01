const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'), build=process.env.PAWDAY_PWA_ROOT||path.join(root,'pwa-build'), original=process.env.PAWDAY_PWA_ROOT||path.join(root,'pawday-site/dist');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/pawday-assets\//,'/');
 if(name.endsWith('/'))name+='index.html';
 let file=path.join(build,name);if(!fs.existsSync(file))file=path.join(original,name);
 if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
 for(const prefix of ['/','/pawday-assets/']){
  const context=await browser.newContext({viewport:{width:390,height:844}}), page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+prefix);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  assert.equal(await page.evaluate(()=>breeds.length),142);
  assert.equal(await page.evaluate(()=>qs.length),13);
  const manifest=await page.evaluate(async()=>await(await fetch(document.querySelector('[rel=manifest]').href)).json());
  assert.equal(manifest.display,'standalone');assert.equal(manifest.icons.length,2);
  const cdp=await context.newCDPSession(page);await cdp.send('Page.enable');
  const result=await cdp.send('Page.getAppManifest');assert.equal(result.errors.length,0,JSON.stringify(result.errors));
  for(const [route,language] of [['ru/','ru'],['zh/','zh'],['en/','en']]){
   await context.setOffline(true);await page.goto(origin+prefix+route);
   assert.equal(await page.locator('html').getAttribute('lang'),language==='zh'?'zh-Hans':language);
   await page.locator('.playful-start').click();
   assert.equal(await page.evaluate(()=>step),0);
   await page.evaluate(()=>{answers={family:[0],home:0,size:[0]};render();});
   assert.equal(await page.evaluate(()=>liveCount(answers).count),41);
   await page.evaluate(()=>{step=qs.length;render();});
   assert((await page.locator('body').innerText()).length>300);
  }
  await page.goto(origin+prefix+'ru/');
  await page.locator('#language').selectOption('zh');
  assert.equal(new URL(page.url()).pathname,prefix+'zh/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: '+prefix+' manifest, service worker, 3 languages offline, quiz, size=41, mobile width.');
  await context.close();
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
