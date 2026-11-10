const {chromium}=require('playwright');const {spawn}=require('child_process');
const [,,a,b,out]=process.argv;const FPS=24;
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+__dirname+'/ep01b.html');await p.waitForFunction('window.READY===true',{timeout:60000});
const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',''+FPS,'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out]);
for(let i=+a;i<+b;i++){await p.evaluate(t=>renderV(t),i/FPS);const buf=await p.screenshot({type:'jpeg',quality:95});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await br.close();})();
