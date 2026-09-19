/* Land on the invitation and DO NOT SCROLL. Report where he ends up.
   Heights are the visible area with the browser's own bars on screen. */
const {chromium}=require('playwright');
const url=process.argv[2]||('file://'+process.cwd()+'/index.html');
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const D=[['iPhone SE Safari',375,548,1],['iPhone 14 Safari',390,664,1],['iPhone 15 Pro Max Safari',430,739,1],
         ['Galaxy S8+ Chrome',360,628,1],['Pixel 7 Chrome',412,783,1],['Phone landscape',844,340,1],
         ['iPad mini',768,954,0],['iPad Pro',1024,1292,0],['Laptop',1366,650,0],['Desktop',1920,960,0]];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const [n,w,h,m] of D){
  const c=await b.newContext({viewport:{width:w,height:h},isMobile:!!m,hasTouch:!!m,userAgent:m?IOS:undefined});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(''+e));
  await p.goto(url);await p.waitForTimeout(500);await p.click('#gGo');await p.waitForTimeout(300);await p.click('#gSkip');
  await p.waitForTimeout(9000);  // no scrolling at all
  const r=await p.evaluate(()=>{const k=document.getElementById('lKid'),s=document.getElementById('lSay').getBoundingClientRect();
    const t=(k.style.transform.match(/translate3d\(([-\d.]+)px/)||[])[1];
    return {sat:k.classList.contains('sat'), typed:document.getElementById('lNote').classList.contains('typed'),
      x:k.style.transform==='none'?0:+(+t).toFixed(0), noteTop:Math.round(s.top), vh:innerHeight, scrollY};});
  console.log(n.padEnd(26),`${w}x${h}`.padEnd(10),JSON.stringify(r),errs.length?errs:'');
  await c.close();}
 await b.close();})();
