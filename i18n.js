/* Idiomas: español (base), inglés e italiano. Traduce el texto de la página en el navegador usando i18n/<idioma>.json. */
(function(){
  var LANGS={es:'ES',en:'EN',it:'IT'};
  var SKIP={SCRIPT:1,STYLE:1,NOSCRIPT:1,TEMPLATE:1,TEXTAREA:1,CODE:1,PRE:1};
  var INLINE={A:1,STRONG:1,B:1,EM:1,I:1,SPAN:1,SMALL:1,BR:1,MARK:1,SUP:1,SUB:1,ABBR:1,U:1};
  var ATTRS=['alt','aria-label','placeholder','title','data-label','data-cap'];
  var LETTER=/[A-Za-zÀ-ÿ]/;
  var lang='es', dict=null, cache={}, touched=new Set(), obs=null, pending=new Set();
  function norm(s){ return s.replace(/\s+/g,' ').trim(); }
  function tag(el){ return (el.tagName||'').toUpperCase(); }
  function skipped(el){ return !!SKIP[tag(el)] || el.getAttribute('translate')==='no' || (el.classList&&el.classList.contains('lang-switch')); }
  function onlyInline(el){ var n=el.getElementsByTagName('*'); for(var i=0;i<n.length;i++){ if(!INLINE[tag(n[i])]) return false; } return true; }
  function directText(el){ var r=[]; for(var c=el.firstChild;c;c=c.nextSibling){ if(c.nodeType===3 && LETTER.test(c.nodeValue)) r.push(c); } return r; }
  function inSegment(el){ var q=el.parentNode; while(q&&q.nodeType===1&&INLINE[tag(q)]) q=q.parentNode; return !!(q&&q.nodeType===1&&directText(q).length&&onlyInline(q)); }
  function look(k){ return dict&&Object.prototype.hasOwnProperty.call(dict,k)?dict[k]:null; }

  function attrs(el){
    ATTRS.forEach(function(a){
      var v=el.getAttribute(a); if(!v||!LETTER.test(v)) return;
      var t=look(norm(v)); if(t==null&&v.indexOf('Ir a ')===0){ var h=look('Ir a'), r=look(norm(v.slice(5))); if(h!=null) t=h+' '+(r==null?v.slice(5):r); } if(t==null) return;
      el.__i18nA=el.__i18nA||{}; if(!(a in el.__i18nA)) el.__i18nA[a]=v; el.setAttribute(a,t); touched.add(el);
    });
    if(tag(el)==='META'&&el.getAttribute('name')==='description'){ var c=el.getAttribute('content'), t2=c&&look(norm(c)); if(t2){ el.__i18nA=el.__i18nA||{}; if(!('content' in el.__i18nA)) el.__i18nA.content=c; el.setAttribute('content',t2); touched.add(el); } }
  }
  function walk(el, covered){
    if(el.nodeType!==1||skipped(el)) return;
    attrs(el);
    var done=covered;
    if(!covered){
      var dt=directText(el);
      if(INLINE[tag(el)] && inSegment(el)) done=true;
      else if(dt.length){
        if(onlyInline(el)){
          var t=look(norm(el.textContent));
          if(t!=null){ if(!el.__i18nO) el.__i18nO={}; if(el.__i18nO.h===undefined) el.__i18nO.h=el.innerHTML; if(/<[a-z]/i.test(t)) el.innerHTML=t; else el.textContent=t; touched.add(el); }
          done=true;
        } else {
          dt.forEach(function(n){ var v=n.nodeValue, t3=look(norm(v)); if(t3==null) return; var m=v.match(/^(\s*)[\s\S]*?(\s*)$/); if(n.__i18nT===undefined) n.__i18nT=v; n.nodeValue=(m?m[1]:'')+t3+(m?m[2]:''); touched.add(n); });
        }
      }
    }
    for(var c=el.firstElementChild;c;c=c.nextElementSibling) walk(c,done);
  }
  function restore(){
    touched.forEach(function(x){
      if(x.nodeType===3){ if(x.__i18nT!==undefined){ x.nodeValue=x.__i18nT; } return; }
      if(x.__i18nO&&x.__i18nO.h!==undefined){ x.innerHTML=x.__i18nO.h; x.__i18nO.h=undefined; }
      if(x.__i18nA){ for(var a in x.__i18nA){ x.setAttribute(a,x.__i18nA[a]); } x.__i18nA=null; }
    });
    touched.clear();
  }
  function pause(){ if(obs) obs.disconnect(); }
  function resume(){ if(obs) obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:ATTRS}); }
  function applyAll(){ pause(); restore(); if(dict){ walk(document.documentElement,false); } document.documentElement.lang=lang; resume(); ui(); }
  function flush(){
    pause();
    pending.forEach(function(n){ var el=n.nodeType===1?n:n.parentNode; if(el&&el.nodeType===1&&document.documentElement.contains(el)){ var top=el; while(top.parentNode&&top.parentNode.nodeType===1&&INLINE[tag(top)]) top=top.parentNode; walk(top,false); } });
    pending.clear(); resume();
  }
  function onMut(recs){
    if(!dict) return;
    recs.forEach(function(r){ if(r.type==='attributes') pending.add(r.target); else { r.addedNodes.forEach(function(n){ pending.add(n); }); } });
    flush();
  }
  function load(l,cb){
    if(l==='es'){ dict=null; cb(); return; }
    if(cache[l]){ dict=cache[l]; cb(); return; }
    fetch('i18n/'+l+'.json?v=2').then(function(r){ return r.json(); }).then(function(d){ cache[l]=d; dict=d; cb(); }).catch(function(){ dict=null; lang='es'; cb(); });
  }
  function ui(){
    var sw=document.querySelector('.lang-switch'); if(!sw) return;
    var lab=sw.querySelector('summary span'); if(lab) lab.textContent=LANGS[lang];
    [].forEach.call(sw.querySelectorAll('.lang-menu a'),function(a){ a.classList.toggle('active',a.getAttribute('data-lang')===lang); });
  }
  function setLang(l,persist){
    if(!LANGS[l]) l='es';
    lang=l; if(persist){ try{ localStorage.setItem('lang',l); }catch(e){} }
    load(l,applyAll);
  }
  window.__t=function(es){ var t=look(norm(es)); return t==null?es:t; };
  var rev=null, revFor=null;
  window.__es=function(t){
    if(!dict) return t;
    if(revFor!==dict){ rev={}; revFor=dict; for(var k in dict){ rev[norm(dict[k].replace(/<[^>]+>/g,''))]=k; } }
    var r=rev[norm(t)]; return r||t;
  };
  window.__lang=function(){ return lang; };
  window.__setLang=setLang;

  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('.lang-menu a[data-lang]'); if(!a) return;
    e.preventDefault(); setLang(a.getAttribute('data-lang'),true);
    var d=a.closest('details'); if(d) d.removeAttribute('open');
  });
  function init(){
    var q=(new URLSearchParams(location.search).get('lang')||'').toLowerCase(), s='';
    try{ s=localStorage.getItem('lang')||''; }catch(e){}
    var l=LANGS[q]?q:(LANGS[s]?s:'es');
    obs=new MutationObserver(onMut);
    if(l==='es'){ resume(); ui(); return; }
    lang=l; load(l,applyAll);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
