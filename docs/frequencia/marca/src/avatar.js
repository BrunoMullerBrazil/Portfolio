const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1080}});
await p.goto('file://'+__dirname+'/avatar.html');await p.waitForFunction('window.READY');await p.evaluate(()=>document.fonts.load('600 100px Oswald'));await p.evaluate(()=>document.fonts.ready);
for(const k of ['A','B','C']){await p.evaluate(k=>draw(k),k);await p.screenshot({path:`avatar_${k}.png`});}await b.close();})();
