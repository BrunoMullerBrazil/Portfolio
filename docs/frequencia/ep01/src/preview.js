const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/ep01.html');await p.waitForFunction('window.READY===true',{timeout:60000});
const times=process.argv.slice(3).map(Number);const out=process.argv[2];
for(const t of times){await p.evaluate(t=>render(t),t);await p.screenshot({path:`${out}/f_${t}.png`});}
// build contact sheet via canvas in page
console.log('errors:',errs.join('\n')||'none');await b.close();})();
