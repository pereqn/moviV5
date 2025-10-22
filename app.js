// --- Safe stub for TelegramGameProxy to avoid TypeError in some shells ---
(function(){
  try{
    if (typeof window !== 'undefined') {
      if (!window.TelegramGameProxy || typeof window.TelegramGameProxy.receiveEvent !== 'function') {
        window.TelegramGameProxy = { receiveEvent: function(){} };
      }
    }
  }catch(e){/* noop */}
})();
// ----------------------------------------------------------------------

// MOVI V1.3.5 — Stable full build with 1.3.4 fixes merged + hotfix
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=(d)=>new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
const fmtDM=(d)=>new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'long'});
const monthTitle=(y,m)=>new Date(y,m,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
const todayISO=()=>new Date().toISOString().slice(0,10);
const addDaysISO=(iso,n)=>{const d=new Date(iso);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};

// Telegram helpers
const TMA=(typeof window!=='undefined' && window.Telegram && Telegram.WebApp)?Telegram.WebApp:null; if(TMA){try{TMA.ready()}catch(e){}}

// ---- DOM refs (declare ONCE) ----
const views={
  start:$("#view-start"), 
  register:$("#view-register"), 
  login:$("#view-login"),
  home:$("#view-home"),
  requests:$("#view-requests"),
  settings:$("#view-settings"),
  profile:$("#view-profile"),
  calendar:$("#view-calendar")
};

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

// Добавление CSS переменных для auth flow
document.documentElement.style.setProperty('--surface-1', '#111827');
document.documentElement.style.setProperty('--surface-3', '#1f2937');
document.documentElement.style.setProperty('--on-surface-tertiary', '#9ca3af');
document.documentElement.style.setProperty('--on-surface-secondary', '#d1d5db');
document.documentElement.style.setProperty('--primary', '#7c3aed');
document.documentElement.style.setProperty('--success', '#22c55e');
document.documentElement.style.setProperty('--danger', '#ef4444');
document.documentElement.style.setProperty('--shadow-lg', '0 12px 30px rgba(0,0,0,.35)');

/* THEME */
const prefersDark=window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){
  const mode=userSettings.theme||'auto'; let theme=mode;
  if(mode==='auto'){ theme = prefersDark.matches ? 'dark' : 'light'; }
  document.documentElement.setAttribute('data-theme', theme);
}
prefersDark.addEventListener('change',applyTheme); applyTheme();

/* Settings UI */
function syncSettingsUI(){
  $("#themeSelect").value=userSettings.theme||'auto';
  $("#cityInput").value=userSettings.city||'';
  $("#callAppSelect").value=userSettings.callApp||'phone';
  $("#mapAppSelect").value=userSettings.mapApp||'google';
}
$("#themeSelect")?.addEventListener('change',e=>{ userSettings.theme=e.target.value; saveLS('movi_settings',userSettings); applyTheme(); });
$("#cityInput")?.addEventListener('input',e=>{ userSettings.city=e.target.value; saveLS('movi_settings',userSettings); renderDay(); renderRequests(); refreshProfileIfOpen(); });
$("#callAppSelect")?.addEventListener('change',e=>{ userSettings.callApp=e.target.value; saveLS('movi_settings',userSettings); });
$("#mapAppSelect")?.addEventListener('change',e=>{ userSettings.mapApp=e.target.value; saveLS('movi_settings',userSettings); });

/* Date chips (home only) */
const dateStrip=$("#dateStrip");
function renderDateChips(){
  dateStrip.innerHTML='';
  const base=new Date(currentDate);
  [-1,0,1].forEach(off=>{
    const dt=new Date(base);dt.setDate(base.getDate()+off); const iso=dt.toISOString().slice(0,10);
    const label=dt.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
    const chip=document.createElement('button'); chip.className='chip'+(off===0?' active':'');
    const hasActive=(orders[iso]||[]).some(o=>o.status!=='done');
    const dot=document.createElement('span'); dot.className='dot'+(hasActive?' active':'');
    chip.append(document.createTextNode(label),dot);
    chip.addEventListener('click',()=>{currentDate=iso; renderDateChips(); renderDay()});
    dateStrip.appendChild(chip);
  });
}

/* Swipe navigation (home only) */
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

/* CALLS & MAPS */
function digitsForURL(p){return (p||'').replace(/\D/g,'').replace(/^8/,'7')}
function tmaOpenLink(url){ if(TMA){ try{ TMA.openLink(url,{try_instant_view:false}); return true }catch(e){ return false } } window.location.href=url; return true }
function tmaOpenTG(url){ if(TMA){ try{ TMA.openTelegramLink(url); return true }catch(e){ return false } } window.location.href=url; return true }

function openCall(phone){
  const d=digitsForURL(phone); if(!d) return;
  const schemeTel = `tel:+${d}`;
  const wa = `https://wa.me/${d}`;
  const tg = `tg://resolve?phone=${d}`;

  if (TMA) {
    if (userSettings.callApp==='telegram') { if(!tmaOpenTG(tg)){ showToast('Не удалось открыть Telegram-профиль'); } return; }
    if (userSettings.callApp==='whatsapp') { if(!tmaOpenLink(wa)){ showToast('Не удалось открыть WhatsApp'); } return; }
    if (navigator.clipboard) { navigator.clipboard.writeText('+'+d).catch(()=>{}); }
    showToast('Номер скопирован, открою Telegram');
    tmaOpenTG(tg);
    return;
  }
  try { window.location.href = schemeTel; } catch(e) { if (userSettings.callApp==='telegram') window.location.href = tg; else window.location.href = wa; }
}

function makeMapUrl(a){const q=encodeURIComponent(a); if(userSettings.mapApp==='yandex') return `https://yandex.ru/maps/?text=${q}`; if(userSettings.mapApp==='2gis') return `https://2gis.ru/search/${q}`; return `https://www.google.com/maps/search/?api=1&query=${q}`}
function buildFullAddress(o){ const city=userSettings.city?(userSettings.city+', '):''; const street=o.street||''; const house=o.house||''; const apt=o.apt?(', кв. '+o.apt):''; if(o.address&&!street) return o.address; return city+[street,house].filter(Boolean).join(' ')+apt }

/* PHONE MASK (RU) */
function formatPhoneRU(raw){
  let d = (raw||'').replace(/\D/g,'');
  if(d.startsWith('8')) d = '7' + d.slice(1);
  if(!d.startsWith('7')) d = '7' + d;
  d = d.slice(0,11);
  const p = ['+7'];
  if(d.length>1){ p.push(' (', d.slice(1,4)); if(d.length>=4)p.push(') '); }
  if(d.length>=7){ p.push(d.slice(4,7), '-', d.slice(7,9)); if(d.length>=11)p.push('-', d.slice(9,11)); }
  else if(d.length>4){ p.push(d.slice(4)); }
  return p.join('');
}
['p_phone','f_phone','e_phone'].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('input',()=>{
    el.value = formatPhoneRU(el.value);
    el.setSelectionRange(el.value.length, el.value.length);
  });
});

/* RENDER */
function statusBadge(s){const cls=s==='done'?'done':'active'; const txt=s==='done'?'ВЫПОЛНЕНО':'АКТИВНО'; return `<span class="badge ${cls}">${txt}</span>`}
function cardHTML(item,i,dateISO){
  const fullAddr=buildFullAddress(item);
  return `<div class="card" data-index="${i}" data-date="${dateISO}">
    <div class="kebab" role="button" aria-label="Открыть меню"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" fill="currentColor"></circle><circle cx="12" cy="12" r="2" fill="currentColor"></circle><circle cx="12" cy="19" r="2" fill="currentColor"></circle></svg></div>
    <h4>${item.name} ${statusBadge(item.status)}</h4>
    <div class="line">Адрес: ${fullAddr}</div>
    <div class="line">Телефон: ${item.phone}</div>
    <div class="line">Цена: ₽ ${item.price}</div>
    <div class="expand">
      <div class="meta">Тип/Время: ${item.type} · ${item.time||'--:--'}</div>
      <div class="meta">Шлагбаум: ${(item.gate||'нет')==='да'?'Да':'Нет'} · Лифт: ${(item.elevator||'нет')==='да'?'Да':'Нет'}</div>
      ${(item.company||item.contact)?`<div class="meta"><strong>Заказчик:</strong> ${[item.company,item.contact].filter(Boolean).join(' — ')}</div>`:''}
      <div class="quick">
        <button class="icbtn callBtn" title="Позвонить">📞</button>
        <a class="icbtn mapBtn" href="${makeMapUrl(fullAddr)}" target="_blank" rel="noopener" title="Маршрут">🗺️</a>
      </div>
    </div>
    <div class="menu">
      <button class="editBtn">Редактировать</button>
      ${item.status==='active'?'<button class="markDoneBtn">Отметить выполнено</button>':'<button class="markActiveBtn">Вернуть в активные</button>'}
      <button class="delBtn">Удалить</button>
    </div>
  </div>`
}

function renderDay(withSwipeAnim=false,dir='left'){
  const list=$("#ordersList"), empty=$("#emptyDay"); const all=orders[currentDate]||[];
  const filtered=all.filter(o=> currentFilter==='all'? true : (currentFilter==='active'? o.status!=='done' : o.status==='done'));
  list.innerHTML=filtered.map((it,i)=>cardHTML(it, all.indexOf(it), currentDate)).join(''); empty.style.display=filtered.length?'none':'block';

  $$("#ordersList .card").forEach(card=>{
    const panel=$(".expand",card); let open=false;
    card.addEventListener('click',(e)=>{
      const withinAction = e.target.closest('.kebab,.menu,.editBtn,.delBtn,.markDoneBtn,.markActiveBtn,.callBtn,.mapBtn');
      if(withinAction) return;
      if(!open){panel.style.display='block';panel.style.height='auto';const end=panel.scrollHeight;panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)';requestAnimationFrame(()=>{card.classList.add('expanded');panel.style.height=end+'px';panel.style.opacity='1';panel.style.transform='translateY(0)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){panel.style.height='auto';panel.removeEventListener('transitionend',onEnd)}})}
      else{const start=panel.scrollHeight;panel.style.height=start+'px';requestAnimationFrame(()=>{panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){card.classList.remove('expanded');panel.style.display='';panel.removeEventListener('transitionend',onEnd)}})}
      open=!open;
    });

    const kebab=$(".kebab",card), menu=$(".menu",card);
    kebab.addEventListener('click',(e)=>{ e.stopPropagation(); const show=menu.style.display!=='block'; $$("#ordersList .menu").forEach(m=>m.style.display='none'); menu.style.display=show?'block':'none' });

    const idx=parseInt(card.dataset.index,10), date=card.dataset.date;
    $(".editBtn",card).addEventListener('click',(e)=>{ e.stopPropagation(); openEditFor(date, idx) });
    $(".delBtn",card).addEventListener('click',(e)=>{ e.stopPropagation(); deleteOrder(date, idx) });
    $(".markDoneBtn",card)?.addEventListener('click',(e)=>{ e.stopPropagation(); setStatus(date, idx, 'done') });
    $(".markActiveBtn",card)?.addEventListener('click',(e)=>{ e.stopPropagation(); setStatus(date, idx, 'active') });
    $(".callBtn",card)?.addEventListener('click',(e)=>{ e.stopPropagation(); const o=(orders[date]||[])[idx]; if(o) openCall(o.phone) });
  });

  if(withSwipeAnim){ list.animate([{transform:`translateX(${dir==='left'?'40px':'-40px'})`,opacity:.0},{transform:'translateX(0)',opacity:1}],{duration:180,easing:'ease-out'}) }

  // live refresh stats if profile is open
  refreshProfileIfOpen();
}

/* REQUESTS */
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
        <button class="icbtn callBtn" title="Позвонить">📞</button>
        <a class="icbtn" href="${makeMapUrl(addr)}" title="Маршрут" target="_blank" rel="noopener">🗺️</a>
      </div>
    </div>
    <div class="actions" style="margin-top:10px">
      <button class="btn primary acceptBtn">Принять</button>
      <button class="btn declineBtn">Отклонить</button>
    </div>
  </div>`
}
function renderRequests(){
  const list=$("#requestsList"), empty=$("#emptyReq");
  if(!requests.length){ empty.style.display='block'; list.innerHTML=''; return }
  empty.style.display='none'; list.innerHTML=requests.map(r=>requestCardHTML(r)).join('');
  $$("#requestsList .card").forEach(card=>{
    const id=card.dataset.id; const panel=$(".expand",card); let open=false;
    card.addEventListener('click',(e)=>{
      if(e.target.closest('.actions,.callBtn')) return;
      if(!open){panel.style.display='block';panel.style.height='auto';const end=panel.scrollHeight;panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)';requestAnimationFrame(()=>{card.classList.add('expanded');panel.style.height=end+'px';panel.style.opacity='1';panel.style.transform='translateY(0)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){panel.style.height='auto';panel.removeEventListener('transitionend',onEnd)}})}
      else{const start=panel.scrollHeight;panel.style.height=start+'px';requestAnimationFrame(()=>{panel.style.height='0px';panel.style.opacity='0';panel.style.transform='translateY(-4px)'});panel.addEventListener('transitionend',function onEnd(e){if(e.propertyName==='height'){card.classList.remove('expanded');panel.style.display='';panel.removeEventListener('transitionend',onEnd)}})}
      open=!open;
    });
    $(".acceptBtn",card).addEventListener('click',()=>{acceptRequest(id)});
    $(".declineBtn",card).addEventListener('click',()=>{declineRequest(id)});
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

/* EDIT / DELETE / STATUS */
function openModal(id){ $("#"+id).classList.add('open') } function closeModal(id){ $("#"+id).classList.remove('open') }
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.getAttribute('data-close'))));

$("#addOrderBtn").addEventListener('click',()=>{ $("#f_date").value=currentDate; $("#f_gate").value='нет'; $("#f_elevator").value='нет'; openModal('orderModal') });
$("#saveOrder").addEventListener('click',()=>{
  const data={name:$("#f_name").value||'Без имени',phone:$("#f_phone").value||'',street:$("#f_street").value||'',house:$("#f_house").value||'',apt:$("#f_apt").value||'',price:parseInt($("#f_price").value||'0',10),time:$("#f_time").value||'',type:$("#f_type").value,gate:$("#f_gate").value||'нет',elevator:$("#f_elevator").value||'нет',company:$("#f_company").value||'',contact:$("#f_contact").value||'',customer_note:$("#f_customer_note").value||'',comment:$("#f_comment").value||'',status:'active'};
  const date=$("#f_date").value||currentDate; if(!orders[date]) orders[date]=[]; orders[date].push(data); persistAll(); closeModal('orderModal'); currentDate=date; renderDateChips(); renderDay(); showToast('Заказ добавлен · '+fmt(date));
});
function openEditFor(date,index){
  const o=(orders[date]||[])[index]; if(!o) return;
  window._editing={date,index};
  $("#e_name").value=o.name||''; $("#e_phone").value=o.phone||'';
  $("#e_street").value=o.street||''; $("#e_house").value=o.house||''; $("#e_apt").value=o.apt||'';
  $("#e_price").value=o.price||0; $("#e_time").value=o.time||''; $("#e_type").value=o.type||'мебель';
  $("#e_gate").value=o.gate||'нет'; $("#e_elevator").value=o.elevator||'нет';
  $("#e_company").value=o.company||''; $("#e_contact").value=o.contact||''; $("#e_customer_note").value=o.customer_note||'';
  $("#e_comment").value=o.comment||''; $("#e_date").value=date;
  openModal('editModal');
}
$("#updateOrder").addEventListener('click',()=>{
  const ed=window._editing; if(!ed) return; const {date,index}=ed; const o=(orders[date]||[])[index]; if(!o) return;
  const newDate=$("#e_date").value||date;
  const data={name:$("#e_name").value,phone:$("#e_phone").value,street:$("#e_street").value||'',house:$("#e_house").value||'',apt:$("#e_apt").value||'',price:parseInt($("#e_price").value||'0',10),time:$("#e_time").value||'',type:$("#e_type").value,gate:$("#e_gate").value||'нет',elevator:$("#e_elevator").value||'нет',company:$("#e_company").value||'',contact:$("#e_contact").value||'',customer_note:$("#e_customer_note").value||'',comment:$("#e_comment").value||'',status:o.status||'active'};
  orders[date].splice(index,1); if(!orders[newDate]) orders[newDate]=[]; orders[newDate].push(data); persistAll();
  closeModal('editModal'); currentDate=newDate; renderDateChips(); renderDay(); showToast('Заказ обновлён');
});
$("#deleteOrder").addEventListener('click',()=>{
  const ed=window._editing; if(!ed) return; const {date,index}=ed;
  orders[date].splice(index,1); persistAll(); closeModal('editModal'); renderDateChips(); renderDay(); showToast('Заказ удалён');
});
function setStatus(date,index,status){
  const o=(orders[date]||[])[index]; if(!o) return; o.status=status; persistAll(); renderDay(); showToast(status==='done'?'Отмечено выполнено':'Вернули в активные');
}

/* AUTH FLOW */
function checkAuthOnLoad() {
  const auth = loadLS('movi_auth', null);
  if (auth && auth.loggedIn) {
    showMainApp();
  } else {
    showView('start');
    hideHeaderAndNav();
  }
}

function hideHeaderAndNav() {
  $("header").style.display = 'none';
  $("nav").style.display = 'none';
}

function showHeaderAndNav() {
  $("header").style.display = '';
  $("nav").style.display = '';
}

function showMainApp() {
  showHeaderAndNav();
  showView('home');
  renderDateChips();
  renderDay();
  syncSettingsUI();
  syncProfileUI();
}

function initAuthHandlers() {
  // Регистрация
  $("#goRegister")?.addEventListener('click', () => showView('register'));
  $("#goLogin")?.addEventListener('click', () => showView('login'));
  $("#switchToLogin")?.addEventListener('click', () => showView('login'));
  $("#switchToRegister")?.addEventListener('click', () => showView('register'));
  
  // Показать/скрыть пароль
  $$(".eye").forEach(eye => {
    eye.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-for');
      const input = $("#" + targetId);
      if (input.type === 'password') {
        input.type = 'text';
        e.target.textContent = '🔒';
      } else {
        input.type = 'password';
        e.target.textContent = '👁';
      }
    });
  });
  
  // Валидация пароля при регистрации
  $("#reg_pass")?.addEventListener('input', validatePassword);
  $("#reg_pass2")?.addEventListener('input', validatePassword);
  
  // Отправка форм
  $("#registerSubmit")?.addEventListener('click', registerUser);
  $("#loginSubmit")?.addEventListener('click', loginUser);
}

function validatePassword() {
  const pass = $("#reg_pass").value;
  const pass2 = $("#reg_pass2").value;
  
  const hints = {
    len: pass.length >= 8,
    latin: /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/.test(pass),
    upper: /[A-Z]/.test(pass),
    match: pass === pass2 && pass.length > 0
  };
  
  Object.keys(hints).forEach(key => {
    const li = $(`[data-k="${key}"]`);
    if (li) {
      li.classList.toggle('ok', hints[key]);
      li.classList.toggle('bad', !hints[key]);
    }
  });
  
  return Object.values(hints).every(Boolean);
}

function registerUser() {
  if (!validatePassword()) {
    showToast('Исправьте ошибки в пароле');
    return;
  }
  
  const name = $("#reg_name").value.trim();
  const phone = $("#reg_phone").value.trim();
  
  if (!name) {
    showToast('Введите имя');
    return;
  }
  
  if (!phone || phone.length < 10) {
    showToast('Введите корректный телефон');
    return;
  }
  
  const userData = {
    name: name,
    phone: phone,
    password: $("#reg_pass").value,
    loggedIn: true
  };
  
  saveLS('movi_auth', userData);
  showMainApp();
  showToast('Регистрация успешна!');
}

function loginUser() {
  const auth = loadLS('movi_auth', null);
  const phone = $("#login_phone").value.trim();
  const password = $("#login_pass").value;
  
  if (!auth) {
    showToast('Аккаунт не найден. Зарегистрируйтесь');
    return;
  }
  
  if (auth.phone === phone && auth.password === password) {
    auth.loggedIn = true;
    saveLS('movi_auth', auth);
    showMainApp();
    showToast('Вход выполнен!');
  } else {
    showToast('Неверный телефон или пароль');
  }
}

function logout() {
  const auth = loadLS('movi_auth', null);
  if (auth) {
    auth.loggedIn = false;
    saveLS('movi_auth', auth);
  }
  showView('start');
  hideHeaderAndNav();
  showToast('Вы вышли из системы');
}

/* VIEWS */
function showView(key){
  // Скрываем хедер и навигацию для auth экранов
  if (['start', 'register', 'login'].includes(key)) {
    hideHeaderAndNav();
  } else {
    showHeaderAndNav();
  }
  
  // Скрыть все views
  $$('.view').forEach(v => v.classList.remove('active'));
  
  // Показать выбранный view
  const view = $("#view-" + key);
  if (view) {
    view.classList.add('active');
  }
  
  // Обновление навигации только для основных экранов
  if (['home', 'requests', 'settings', 'profile', 'calendar'].includes(key)) {
    Object.values(views).forEach(v=>v.classList.remove('active')); 
    if (views[key]) views[key].classList.add('active');
    
    $$(".navbtn.circ").forEach(b=>b.classList.remove('active')); 
    if(key==='home') $$(".navbtn.circ")[0]?.classList.add('active'); 
    if(key==='requests') $$(".navbtn.circ")[1]?.classList.add('active');
    
    $$(".iconbtn[data-top]").forEach(b=>b.classList.remove('active')); 
    if(key==='profile') $("#profileBtn").classList.add('active'); 
    if(key==='settings') $("#settingsBtn").classList.add('active');
    
    $("#pageTitle").textContent=({home:'Главный экран',requests:'Заявки',settings:'Настройки',profile:'Профиль',calendar:'Календарь'})[key]||'MOVI';
    $("#dateStrip").style.display = key==='home' ? '' : 'none';
  }
  
  if(key==='home'){ 
    if (loadLS('movi_auth', null)?.loggedIn) {
      renderDateChips(); 
      renderDay();
    }
  }
  if(key==='requests'){ renderRequests() }
  if(key==='profile'){ attachProfileFilters(); renderProfileStats(); syncProfileUI(); }
  if(key==='settings'){ 
    syncSettingsUI(); 
    // Добавляем кнопку выхода если её нет
    if (!$("#logoutBtn")) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'btn danger';
      logoutBtn.textContent = 'Выйти';
      logoutBtn.style.marginTop = '20px';
      logoutBtn.style.width = '100%';
      logoutBtn.addEventListener('click', logout);
      $(".settings").appendChild(logoutBtn);
    }
  }
  if(key==='calendar'){ initCalendarFromCurrent(); renderCalendar() }
}

$$(".navbtn.circ").forEach((btn,idx)=>{ btn.addEventListener('click',()=>{ const map={0:'home',1:'requests'}; if(map[idx]) showView(map[idx]) }) });
$("#profileBtn").addEventListener('click',()=>{ showView('profile') });
$("#settingsBtn").addEventListener('click',()=>{ showView('settings') });
$("#calendarBtn").addEventListener('click',()=>{ showView('calendar') });

/* PROFILE SAVE */
function syncProfileUI(){ $("#p_name").value=userProfile.name||''; $("#p_phone").value=userProfile.phone||''; }
$("#saveProfileBtn").addEventListener('click',()=>{
  userProfile.name=$("#p_name").value||'Исполнитель';
  userProfile.phone=$("#p_phone").value||'+7 ';
  saveLS('movi_profile',userProfile);
  showToast('Профиль сохранён');
});

/* FILTERS */
let filtersAttached=false;
function attachProfileFilters(){
  if(filtersAttached) return;
  $$("#filterBar .fchip").forEach(btn=>{
    btn.addEventListener('click',()=>{
      $$("#filterBar .fchip").forEach(b=>{ b.classList.toggle('active', b===btn); b.setAttribute('aria-selected', b===btn ? 'true':'false'); });
      currentFilter = btn.dataset.filter;
      renderDay();
      showToast('Фильтр: ' + (currentFilter==='all'?'Все': currentFilter==='active'?'Активные':'Выполненные'));
      refreshProfileIfOpen();
    }, {passive:true});
  });
  filtersAttached=true;
}

/* STATS */
function safeNum(v){ const n=parseInt(v,10); return isNaN(n)?0:n }
function renderProfileStats(){
  try{
    const container=$("#profileStats"), monthly=$("#monthlyStats");
    if(!container || !monthly) return;
    const entries = Object.entries(orders||{});
    const all = entries.flatMap(([date,arr])=> Array.isArray(arr) ? arr.map(o=>({date,...o})) : []);
    const total = all.length;
    const done = all.filter(o=>o.status==='done').length;
    const active = total - done;
    const revenue = all.filter(o=>o.status==='done').reduce((s,o)=> s + safeNum(o.price||0), 0);

    container.innerHTML = `
      <div class="cardlike"><div class="meta">Всего заказов</div><div class="price">${total}</div></div>
      <div class="cardlike"><div class="meta">Выполнено</div><div class="price">${done}</div></div>
      <div class="cardlike"><div class="meta">Активные</div><div class="price">${active}</div></div>
      <div class="cardlike"><div class="meta">Заработано ₽</div><div class="price">${revenue}</div></div>`;

    const agg = {};
    all.forEach(o=>{
      const ym = (o.date||'').slice(0,7);
      if(!ym) return;
      if(!agg[ym]) agg[ym] = {count:0,done:0,revenue:0};
      agg[ym].count += 1;
      if(o.status==='done'){ agg[ym].done += 1; agg[ym].revenue += safeNum(o.price||0); }
    });
    const rows = Object.entries(agg).sort((a,b)=> a[0]>b[0]?-1:1).map(([ym,v])=>{
      const m = new Date(`${ym}-01`).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
      return `<div class="row"><span style="text-transform:capitalize">${m}</span><span>${v.count} / выполнено ${v.done} • ₽${v.revenue}</span></div>`;
    }).join('');
    monthly.innerHTML = rows || '<div class="meta">Нет данных</div>';
  }catch(e){
    console.error('Stats render error', e);
  }
}
function refreshProfileIfOpen(){ if(views.profile.classList.contains('active')) renderProfileStats() }

/* CALENDAR */
let calYear,calMonth;
function initCalendarFromCurrent(){ const d=new Date(currentDate); calYear=d.getFullYear(); calMonth=d.getMonth() }
function monthDaysGrid(y,m){
  const first=new Date(y,m,1); const start=(first.getDay()+6)%7; const days=new Date(y,m+1,0).getDate(); const cells=[];
  for(let i=0;i<start;i++) cells.push({muted:true});
  for(let d=1; d<=days; d++){ const iso=new Date(y,m,d).toISOString().slice(0,10); const hasActive=(orders[iso]||[]).some(o=>o.status!=='done'); const hasAny=(orders[iso]||[]).length>0; cells.push({muted:false,d,iso,dot:hasActive?'active':(hasAny?'none':'empty')}); }
  while(cells.length%7!==0) cells.push({muted:true}); return cells;
}
function renderCalendar(){
  $("#calTitle").textContent=monthTitle(calYear,calMonth);
  const grid=$("#calGrid"); const cells=monthDaysGrid(calYear,calMonth);
  grid.innerHTML=cells.map(c=> c.muted?`<div class="day muted"><div class="dnum"></div></div>`:`<div class="day" data-iso="${c.iso}"><div class="dnum">${String(c.d)}</div><div class="${c.dot==='active'?'dotmini active':'dotmini'}"></div></div>`).join('');
  $$("#calGrid .day").forEach(el=>{ if(!el.dataset.iso) return; el.addEventListener('click',()=>{ currentDate=el.dataset.iso; showToast('День выбран: '+fmt(currentDate)) }) });
}
$("#calPrev")?.addEventListener('click',()=>{ calMonth--; if(calMonth<0){calMonth=11; calYear--} renderCalendar() });
$("#calNext")?.addEventListener('click',()=>{ calMonth++; if(calMonth>11){calMonth=0; calYear++} renderCalendar() });
$("#backToHome")?.addEventListener('click',()=> showView('home'));

/* TOAST */
let toastTimer=null;
function showToast(msg){ const t=$("#toast"); t.querySelector('span').textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),1600) }

// Safety: show JS errors as toast to avoid dead UI
window.addEventListener('error',e=>{ console.error(e.error||e.message); const msg = (e && e.message)? e.message : 'Ошибка скрипта'; showToast(msg) });

/* INIT */
function initApp() {
  initAuthHandlers();
  checkAuthOnLoad();
  applyTheme();
}

// Запуск приложения
initApp();

document.addEventListener('keydown',e=>{ if(!views.home.classList.contains('active')) return; if(e.key==='ArrowLeft'){currentDate=addDaysISO(currentDate,-1);renderDateChips();renderDay(true,'right')} if(e.key==='ArrowRight'){currentDate=addDaysISO(currentDate,1);renderDateChips();renderDay(true,'left')} });