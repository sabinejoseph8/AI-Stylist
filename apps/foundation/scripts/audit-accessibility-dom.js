/* Read-only browser audit. Run through the authorized CUA browser evaluate API.
 * This is a local heuristic, not WCAG certification or screen-reader acceptance. */
(()=>{
 const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
 const name=e=>e.getAttribute('aria-label')||[...(e.labels||[])].map(l=>l.textContent).join(' ')||e.textContent?.trim()||'';
 const targets=[...document.querySelectorAll('button,a,summary,input,select,textarea')].filter(e=>visible(e)&&!e.disabled).map(e=>{
  const element=['checkbox','radio'].includes(e.type)&&e.labels?.length?e.labels[0]:e;
  const r=element.getBoundingClientRect();return{name:name(e).slice(0,120),tag:e.tagName,width:Math.round(r.width*100)/100,height:Math.round(r.height*100)/100};
 });
 const unlabeled=[...document.querySelectorAll('input,select,textarea')].filter(e=>visible(e)&&!name(e)&&!e.getAttribute('aria-labelledby')).map(e=>e.tagName+':'+e.type);
 const missingImageAlt=[...document.querySelectorAll('img')].filter(e=>visible(e)&&!e.hasAttribute('alt')).length;
 const headings=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(e=>({level:Number(e.tagName[1]),text:e.textContent?.trim()}));
 const page=document.querySelector('h1'),nav=document.querySelector('nav'),focused=document.activeElement;
 return{width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rootFont:getComputedStyle(document.documentElement).fontSize,
  smallTargets:targets.filter(t=>t.width<44||t.height<44),unlabeled,missingImageAlt,headings,
  currentPage:page?.textContent,focused:focused?.textContent?.trim().slice(0,120),focusedTag:focused?.tagName,
  navigationHeight:nav?.getBoundingClientRect().height,reservedNavigationHeight:getComputedStyle(document.documentElement).getPropertyValue('--navigation-height').trim(),
  title:document.title,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
})()
