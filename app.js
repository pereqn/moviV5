// minimal app.js for V1.3 (core features)
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=(d)=>new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
const fmtDM=(d)=>new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long'});
const monthTitle=(y,m)=>new Date(y,m,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
const todayISO=()=>new Date().toISOString().slice(0,10);
const addDaysISO=(iso,n)=>{const d=new Date(iso);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};

let currentDate=todayISO(); let currentFilter='all';
function saveLS(k,v){localStorage.setItem(k,JSON.stringify(v))}
function loadLS(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(e){return f}}

let userSettings=loadLS('movi_settings',{theme:'auto',callApp:'phone',mapApp:'google',city:''});
let userProfile=loadLS('movi_profile',{name:'Исполнитель',phone:'+7 '});
saveLS('movi_settings',userSettings); saveLS('movi_profile',userProfile);

let orders=loadLS('movi_orders',null);
let requests=loadLS('movi_requests',null);
if(!orders||!Object.keys(orders).length){
  const d0=todayISO(), d_1=addDaysISO(d0,-1), d1=addDaysISO(d0,1);
  orders={};
  orders[d0]=[{name:'Наташа',street:'Победы',house:'12',apt:'',price:1200,phone:'+7 (900) 123-45-67',type:'мебель',time:'12:30',comment:'Комод, лифт работает',status:'active',gate:'нет',elevator:'да',company:'ООО Комод',contact:'Ольга',customer_note:''},
              {name:'Сергей',street:'Мира',house:'2',apt:'',price:800,phone:'+7 (900) 765-43-21',type:'прочее',time:'12:50',comment:'Коробки, шлагбаум',status:'active',gate:'да',elevator:'нет',company:'',contact:'',customer_note:'Оплата наличными'},
              {name:'Олег',street:'Центральная',house:'9',apt:'14',price:950,phone:'+7 (900) 222-22-22',type:'прочее',time:'16:15',comment:'Пара коробок',status:'done',gate:'нет',elevator:'да',company:'',contact:'',customer_note:''}];
  orders[d_1]=[{name:'Антон',street:'Балтийская',house:'8',apt:'',price:1100,phone:'+7 (900) 222-33-44',type:'техника',time:'10:00',comment:'Холодильник, без лифта',status:'done',gate:'нет',elevator:'нет',company:'',contact:'',customer_note:''}];
  orders[d1]=[{name:'Ольга',street:'Москва пр-т',house:'44',apt:'',price:1600,phone:'+7 (900) 555-66-77',type:'мебель',time:'19:00',comment:'Шкаф-купе',status:'active',gate:'нет',elevator:'да',company:'',contact:'',customer_note:''}];
}
if(!requests){requests=[{id:'r1',name:'Илья',phone:'+7 (900) 000-00-01',street:'Гайдара',house:'5',apt:'',type:'мебель',time:'12:30',price:1500,comment:'Диван на 3й этаж, без лифта',date:todayISO(),gate:'нет',elevator:'нет',company:'',contact:'',customer_note:''},
                        {id:'r2',name:'Марина',phone:'+7 (900) 000-00-02',street:'Ленинский',house:'21',apt:'',type:'техника',time:'18:00',price:900,comment:'Стиралка, аккуратно',date:addDaysISO(todayISO(),1),gate:'да',elevator:'да',company:'',contact:'',customer_note:''}]};
function persistAll(){saveLS('movi_orders',orders);saveLS('movi_requests',requests);saveLS('movi_settings',userSettings);saveLS('movi_profile',userProfile)}

const prefersDark=window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){const m=userSettings.theme||'auto';let t=m;if(m==='auto') t=prefersDark.matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}
prefersDark.addEventListener('change',applyTheme); applyTheme();

const dateStrip=$("#dateStrip");
function chipStatus(iso){const day=orders[iso]||[];return {hasActive: day.some(o=>o.status!=='done')}}
function renderDateChips(){
  dateStrip.innerHTML='';
  const base=new Date(currentDate);
  [-1,0,1].forEach(off=>{
    const dt=new Date(base);dt.setDate(base.getDate()+off); const iso=dt.toISOString().slice(0,10);
    const label=dt.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
    const chip=document.createElement('button'); chip.className='chip'+(off===0?' active':'');
    const {hasActive}=chipStatus(iso); const dot=document.createElement('span'); dot.className='dot '+(hasActive?'active':'');
    chip.append(document.createTextNode(label),dot); chip.addEventListener('click',()=>{currentDate=iso; renderDateChips(); renderDay()});
    dateStrip.appendChild(chip);
  });
}

let touchX=null,touchY=null;
function onTouchStart(e){const t=e.touches?e.touches[0]:e; touchX=t.clientX; touchY=t.clientY}
function onTouchEnd(e){
  if(touchX===null||!views.home.classList.contains('active')) return;
  const t=e.changedTouches?e.changedTouches[0]:e; const dx=t.clientX-touchX, dy=t.clientY-touchY;
  if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){ currentDate=addDaysISO(currentDate, dx<0?+1:-1); renderDateChips(); renderDay(true, dx<0?'left':'right') }
  touchX=touchY=null;
}
document.addEventListener('touchstart',onTouchStart,{passive:true}); document.addEventListener('touchend',onTouchEnd,{passive:true});
document.addEventListener('mousedown',onTouchStart); document.addEventListener('mouseup',onTouchEnd);

function parseHM(s){ if(!s) return null; const [h,m]=s.split(':').map(n=>parseInt(n,10)); if(isNaN(h)||isNaN(m)) return null; return h*60+m }
function findConflicts(day){ const slots=day.map((o,i)=>({i,t:parseHM(o.time)})).filter(x=>x.t!=null); const set=new Set(); for(let a=0;a<slots.length;a++){for(let b=a+1;b<slots.length;b++){ if(Math.abs(slots[a].t-slots[b].t)<=60){set.add(slots[a].i);set.add(slots[b].i)} }} return set }

const svgPhone='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v2a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5 2h2a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.06a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgMap='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 3v15M15 6v15" stroke="currentColor" stroke-width="1.6"/></svg>';

function statusBadge(s){const cls=s==='done'?'done':'active'; const txt=s==='done'?'ВЫПОЛНЕНО':'АКТИВНО'; return `<span class="badge ${cls}">${txt}</span>`}
function buildFullAddress(o){ const city=userSettings.city?(userSettings.city+', '):''; const street=o.street||''; const house=o.house||''; const apt=o.apt?(', кв. '+o.apt):''; if(o.address&&!street) return o.address; return city+[street,house].filter(Boolean).join(' ')+apt }
function digitsForURL(p){return (p||'').replace(/\D/g,'').replace(/^8/,'7')}
function openCall(p){const d=digitsForURL(p); if(!d) return; if(userSettings.callApp==='whatsapp') window.location.href=`https://wa.me/${d}`; else if(userSettings.callApp==='telegram') window.location.href=`tg://resolve?phone=${d}`; else window.location.href=`tel:+${d}`}
function makeMapUrl(a){const q=encodeURIComponent(a); if(userSettings.mapApp==='yandex') return `https://yandex.ru/maps/?text=${q}`; if(userSettings.mapApp==='2gis') return `https://2gis.ru/search/${q}`; return `https://www.google.com/maps/search/?api=1&query=${q}`}

function cardHTML(item,i,dateISO){
  const fullAddr=buildFullAddress(item);
  return `<div class="card" data-index="${i}" data-date="${dateISO}">
    <div class="kebab"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" fill="currentColor"></circle><circle cx="12" cy="12" r="2" fill="currentColor"></circle><circle cx="12" cy="19" r="2" fill="currentColor"></circle></svg></div>
    <h4>${item.name} ${statusBadge(item.status)}</h4>
    <div class="line">Адрес: ${fullAddr}</div>
    <div class="line">Телефон: ${item.phone}</div>
    <div class="line">Цена: ₽ ${item.price}</div>
    <div class="expand">
      <div class="meta">Тип/Время: ${item.type} · ${item.time||'--:--'}</div>
      <div class="meta">Шлагбаум: ${(item.gate||'нет')==='да'?'Да':'Нет'} · Лифт: ${(item.elevator||'нет')==='да'?'Да':'Нет'}</div>
      ${(item.company||item.contact)?`<div class="meta"><strong>Заказчик:</strong> ${[item.company,item.contact].filter(Boolean).join(' — ')}</div>`:''}
      <div class="quick">
        <button class="icbtn callBtn" title="Позвонить">${svgPhone}</button>
        <a class="icbtn" href="${makeMapUrl(fullAddr)}" title="Маршрут" target="_blank" rel="noopener">${svgMap}</a>
      </div>
    </div>
    <div class="menu">
      <button class="editBtn">Редактировать</button>
      ${item.status==='active'?'<button class="markDoneBtn">Отметить выполнено</button>':'<button class="markActiveBtn">Вернуть в активные</button>'}
      <button class="delBtn">Удалить</button>
    </div>
  </div>`
}

function requestCardHTML(r){
  const addr=buildFullAddress(r); const dm=fmtDM(r.date);
  return `<div class="card" data-id="${r.id}">
    <h4>${r.name}</h4>
    <div class="line">Дата: ${dm}</div>
    <div class="line">Адрес: ${addr}</div>
    <div class="line">Телефон: ${r.phone}</div>
    <div class="line">Цена: ₽ ${r.price}</div>
    <div class="expand">
      <div class="meta">Время: ${r.time||'--:--'}</div>
      <div class="meta">Тип: ${r.type} · Шлагбаум: ${(r.gate||'нет')==='да'?'Да':'Нет'} · Лифт: ${(r.elevator||'нет')==='да'?'Да':'Нет'}</div>
      <div class="quick">
        <button class="icbtn callBtn" title="Позвонить">${svgPhone}</button>
        <a class="icbtn" href="${makeMapUrl(addr)}" title="Маршрут" target="_blank" rel="noopener">${svgMap}</a>
      </div>
    </div>
    <div class="actions" style="margin-top:10px">
      <button class="btn primary acceptBtn">Принять</button>
      <button class="btn declineBtn">Отклонить</button>
    </div>
  </div>`
}

function renderDay(withSwipeAnim=false,dir='left'){
  const list=$("#ordersList"), empty=$("#emptyDay"); const all=orders[currentDate]||[];
  list.innerHTML=all.map((it,i)=>cardHTML(it,i,currentDate)).join(''); empty.style.display=all.length?'none':'block';
  $$("#ordersList .card").forEach(card=>{
    const panel=$(".expand",card); let open=false;
    card.addEventListener('click',(e)=>{
      if(e.target.closest('.kebab')||e.target.closest('.menu')||e.target.closest('.editBtn')||e.target.closest('.delBtn')||e.target.closest('.markDoneBtn')||e.target.closest('.markActiveBtn')||e.target.closest('.callBtn')) return;
      if(!open){panel.style.display='block';panel.style.height='auto';const end=panel.scrollHeight;panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)';requestAnimationFrame(()=>{card.classList.add('expanded');panel.style.height=end+'px';panel.style.opacity='1';panel.style.transform='translateY(0)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){panel.style.height='auto';panel.removeEventListener('transitionend',onEnd)}})}
      else{const start=panel.scrollHeight;panel.style.height=start+'px';requestAnimationFrame(()=>{panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){card.classList.remove('expanded');panel.style.display='';panel.removeEventListener('transitionend',onEnd)}})}
      open=!open;
    });
    const kebab=$(".kebab",card), menu=$(".menu",card);
    kebab.addEventListener('click',(e)=>{e.stopPropagation();const show=menu.style.display!=='block'; $$("#ordersList .menu").forEach(m=>m.style.display='none'); menu.style.display=show?'block':'none'});
    $(".editBtn",card).addEventListener('click',(e)=>e.stopPropagation());
    $(".delBtn",card).addEventListener('click',(e)=>e.stopPropagation());
    $(".markDoneBtn",card)?.addEventListener('click',(e)=>e.stopPropagation());
    $(".markActiveBtn",card)?.addEventListener('click',(e)=>e.stopPropagation());
    $(".callBtn",card)?.addEventListener('click',(e)=>{e.stopPropagation(); const idx=parseInt(card.dataset.index,10); const o=(orders[currentDate]||[])[idx]; if(o) openCall(o.phone) });
  });
  if(withSwipeAnim){ list.animate([{transform:`translateX(${dir==='left'?'40px':'-40px'})`,opacity:.0},{transform:'translateX(0)',opacity:1}],{duration:180,easing:'ease-out'}) }
}

function renderRequests(){
  const list=$("#requestsList"), empty=$("#emptyReq");
  if(!requests.length){ empty.style.display='block'; list.innerHTML=''; return }
  empty.style.display='none'; list.innerHTML=requests.map(r=>requestCardHTML(r)).join('');
  $$("#requestsList .card").forEach(card=>{
    const id=card.dataset.id; const panel=$(".expand",card); let open=false;
    card.addEventListener('click',(e)=>{
      if(e.target.closest('.actions')||e.target.closest('.callBtn')) return;
      if(!open){panel.style.display='block';panel.style.height='auto';const end=panel.scrollHeight;panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)';requestAnimationFrame(()=>{card.classList.add('expanded');panel.style.height=end+'px';panel.style.opacity='1';panel.style.transform='translateY(0)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){panel.style.height='auto';panel.removeEventListener('transitionend',onEnd)}})}
      else{const start=panel.scrollHeight;panel.style.height=start+'px';requestAnimationFrame(()=>{panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){card.classList.remove('expanded');panel.style.display='';panel.removeEventListener('transitionend',onEnd)}})}
      open=!open;
    });
    $(".acceptBtn",card).addEventListener('click',()=>acceptRequest(id));
    $(".declineBtn",card).addEventListener('click',()=>declineRequest(id));
    $(".callBtn",card).addEventListener('click',()=>{const r=requests.find(x=>x.id===id); if(r) openCall(r.phone)});
  });
}
function acceptRequest(id){
  const idx=requests.findIndex(r=>r.id===id); if(idx<0) return; const r=requests[idx];
  if(!orders[r.date]) orders[r.date]=[];
  orders[r.date].push({name:r.name,street:r.street,house:r.house,apt:r.apt,price:r.price,phone:r.phone,type:r.type,gate:r.gate||'нет',elevator:r.elevator||'нет',time:r.time,comment:r.comment,status:'active',company:r.company||'',contact:r.contact||'',customer_note:r.customer_note||''});
  requests.splice(idx,1); persistAll(); renderRequests(); renderDateChips(); renderDay(); showToast('Заявка принята');
}
function declineRequest(id){ const idx=requests.findIndex(r=>r.id===id); if(idx<0) return; requests.splice(idx,1); persistAll(); renderRequests(); showToast('Заявка отклонена') }

$("#addOrderBtn").addEventListener('click',()=>{ $("#f_date").value=currentDate; $("#f_gate").value='нет'; $("#f_elevator").value='нет'; openModal('orderModal') });

function openModal(id){ $("#"+id).classList.add('open') } function closeModal(id){ $("#"+id).classList.remove('open') }
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.getAttribute('data-close'))));

$("#saveOrder").addEventListener('click',()=>{
  const data={name:$("#f_name").value||'Без имени',phone:$("#f_phone").value||'',street:$("#f_street").value||'',house:$("#f_house").value||'',apt:$("#f_apt").value||'',price:parseInt($("#f_price").value||'0',10),time:$("#f_time").value||'',type:$("#f_type").value,gate:$("#f_gate").value||'нет',elevator:$("#f_elevator").value||'нет',company:$("#f_company").value||'',contact:$("#f_contact").value||'',customer_note:$("#f_customer_note").value||'',comment:$("#f_comment").value||'',status:'active'};
  const date=$("#f_date").value||currentDate; if(!orders[date]) orders[date]=[]; orders[date].push(data); persistAll(); closeModal('orderModal'); currentDate=date; renderDateChips(); renderDay(); showToast('Заказ добавлен · '+fmt(date));
});

const views={home:$("#view-home"),requests:$("#view-requests"),settings:$("#view-settings"),profile:$("#view-profile"),calendar:$("#view-calendar")};
function showView(key){
  Object.values(views).forEach(v=>v.classList.remove('active')); views[key].classList.add('active');
  $$(".navbtn.circ").forEach(b=>b.classList.remove('active')); if(key==='home') $$(".navbtn.circ")[0]?.classList.add('active'); if(key==='requests') $$(".navbtn.circ")[1]?.classList.add('active');
  $$(".iconbtn[data-top]").forEach(b=>b.classList.remove('active')); if(key==='profile') $("#profileBtn").classList.add('active'); if(key==='settings') $("#settingsBtn").classList.add('active');
  $("#pageTitle").textContent=({home:'Главный экран',requests:'Заявки',settings:'Настройки',profile:'Профиль',calendar:'Календарь'})[key]||'MOVI';
  $("#dateStrip").style.display = key==='home' ? '' : 'none';
  if(key==='home'){ renderDateChips(); renderDay() }
  if(key==='requests'){ renderRequests() }
  if(key==='calendar'){ initCalendarFromCurrent(); renderCalendar() }
}
$$(".navbtn.circ").forEach((btn,idx)=>{ btn.addEventListener('click',()=>{ const map={0:'home',1:'requests'}; if(map[idx]) showView(map[idx]) }) });
$("#profileBtn").addEventListener('click',()=>{ showView('profile') });
$("#settingsBtn").addEventListener('click',()=>{ showView('settings') });
$("#calendarBtn").addEventListener('click',()=>{ showView('calendar') });

let calYear,calMonth;
function initCalendarFromCurrent(){ const d=new Date(currentDate); calYear=d.getFullYear(); calMonth=d.getMonth() }
function monthDaysGrid(y,m){
  const first=new Date(y,m,1); const startDay=(first.getDay()+6)%7; const daysInMonth=new Date(y,m+1,0).getDate(); const cells=[];
  for(let i=0;i<startDay;i++) cells.push({muted:true});
  for(let d=1; d<=daysInMonth; d++){ const iso=new Date(y,m,d).toISOString().slice(0,10); const hasActive=(orders[iso]||[]).some(o=>o.status!=='done'); const hasAny=(orders[iso]||[]).length>0;
    cells.push({muted:false,d,iso,dot: hasActive?'active':(hasAny?'none':'empty')});
  }
  while(cells.length%7!==0) cells.push({muted:true}); return cells;
}
function renderCalendar(){
  $("#calTitle").textContent=monthTitle(calYear,calMonth);
  const grid=$("#calGrid"); const cells=monthDaysGrid(calYear,calMonth);
  grid.innerHTML=cells.map(c=> c.muted?`<div class="day muted"><div class="dnum"></div></div>`:
    `<div class="day" data-iso="${c.iso}"><div class="dnum">${String(c.d)}</div><div class="${c.dot==='active'?'dotmini active':'dotmini'}"></div></div>`
  ).join('');
  $$("#calGrid .day").forEach(el=>{ if(!el.dataset.iso) return; el.addEventListener('click',()=>{ currentDate=el.dataset.iso; showView('home'); showToast('День выбран: '+fmt(currentDate)) }) });
}
$("#calPrev").addEventListener('click',()=>{ calMonth--; if(calMonth<0){calMonth=11;calYear--} renderCalendar() });
$("#calNext").addEventListener('click',()=>{ calMonth++; if(calMonth>11){calMonth=0;calYear++} renderCalendar() });
$("#backToHome").addEventListener('click',()=>showView('home'));

function showToast(msg){const t=$("#toast"); t.querySelector('span').textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1600)}

document.addEventListener('keydown',e=>{ if(!views.home.classList.contains('active')) return; if(e.key==='ArrowLeft'){currentDate=addDaysISO(currentDate,-1);renderDateChips();renderDay(true,'right')} if(e.key==='ArrowRight'){currentDate=addDaysISO(currentDate,1);renderDateChips();renderDay(true,'left')} });

renderDateChips(); renderDay();
