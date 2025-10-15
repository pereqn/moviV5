// MOVI v8 — full logic with requested changes
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const fmt = (d)=> new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
const todayISO = ()=> new Date().toISOString().slice(0,10);
const addDaysISO = (iso, delta)=>{ const d=new Date(iso); d.setDate(d.getDate()+delta); return d.toISOString().slice(0,10); };

let currentDate = todayISO();
let currentFilter = 'all'; // all | active | done

/* ===== Persistent storage helpers ===== */
function saveLS(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function loadLS(key, fallback){ try{ const v = JSON.parse(localStorage.getItem(key) || 'null'); return v==null ? fallback : v; }catch(e){ return fallback; } }

/* ===== User settings & profile ===== */
let userSettings = loadLS('movi_settings', { theme:'auto', callApp:'phone', mapApp:'google', city:'' });
let userProfile  = loadLS('movi_profile', { name:'Исполнитель', phone:'+7 ' });
saveLS('movi_settings', userSettings);
saveLS('movi_profile', userProfile);

/* ===== Orders & Requests (persistent) ===== */
let orders = loadLS('movi_orders', null);
let requests = loadLS('movi_requests', null);
if(!orders || !Object.keys(orders).length){
  const d0 = todayISO();
  const d_1 = addDaysISO(d0,-1);
  const d1 = addDaysISO(d0,1);
  orders = {};
  orders[d0]=[
    {name:'Наташа', street:'Победы', house:'12', apt:'', price:1200, phone:'+7 (900) 123-45-67', type:'мебель', time:'12:30', comment:'Комод, лифт работает', status:'active', gate:'нет', elevator:'да', company:'ООО Комод', contact:'Ольга', customer_note:''},
    {name:'Сергей', street:'Мира', house:'2', apt:'', price:800, phone:'+7 (900) 765-43-21', type:'прочее', time:'12:50', comment:'Коробки, шлагбаум', status:'active', gate:'да', elevator:'нет', company:'', contact:'', customer_note:'Оплата наличными'},
    {name:'Олег', street:'Центральная', house:'9', apt:'14', price:950, phone:'+7 (900) 222-22-22', type:'прочее', time:'16:15', comment:'Пара коробок', status:'done', gate:'нет', elevator:'да', company:'', contact:'', customer_note:''}
  ];
  orders[d_1]=[
    {name:'Антон', street:'Балтийская', house:'8', apt:'', price:1100, phone:'+7 (900) 222-33-44', type:'техника', time:'10:00', comment:'Холодильник, без лифта', status:'done', gate:'нет', elevator:'нет', company:'', contact:'', customer_note:''}
  ];
  orders[d1]=[
    {name:'Ольга', street:'Москва пр-т', house:'44', apt:'', price:1600, phone:'+7 (900) 555-66-77', type:'мебель', time:'19:00', comment:'Шкаф-купе', status:'active', gate:'нет', elevator:'да', company:'', contact:'', customer_note:''}
  ];
}
if(!requests){ requests = [
  {id:'r1', name:'Илья', phone:'+7 (900) 000-00-01', street:'Гайдара', house:'5', apt:'', type:'мебель', time:'12:30', price:1500, comment:'Диван на 3й этаж, без лифта', date: todayISO(), gate:'нет', elevator:'нет', company:'', contact:'', customer_note:''},
  {id:'r2', name:'Марина', phone:'+7 (900) 000-00-02', street:'Ленинский', house:'21', apt:'', type:'техника', time:'18:00', price:900, comment:'Стиралка, нужен аккуратный подъём', date: addDaysISO(todayISO(),1), gate:'да', elevator:'да', company:'', contact:'', customer_note:''}
];}
function persistAll(){
  saveLS('movi_orders', orders);
  saveLS('movi_requests', requests);
  saveLS('movi_settings', userSettings);
  saveLS('movi_profile', userProfile);
}

/* ===== Phone mask (RU) ===== */
function onlyDigits(s){ return (s||'').replace(/\D/g,''); }
function formatRUPhone(raw){
  let d = onlyDigits(raw);
  if(d.startsWith('8')) d = '7' + d.slice(1);
  if(!d.startsWith('7')) d = '7' + d;
  d = d.slice(0,11);
  let res = '+7';
  if(d.length>1){
    res += ' (' + d.slice(1,4);
    if(d.length>=4) res += ') ';
    if(d.length>=7){ res += d.slice(4,7) + '-' + d.slice(7,9) + '-' + d.slice(9,11); }
    else if(d.length>4){ res += d.slice(4); }
  }
  return res;
}
function attachPhoneMask(el){
  if(!el) return;
  el.addEventListener('input', ()=>{
    el.value = formatRUPhone(el.value);
    el.setSelectionRange(el.value.length, el.value.length);
  });
  el.addEventListener('blur', ()=>{ el.value = formatRUPhone(el.value); });
}

/* ===== Theme (auto/light/dark) ===== */
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
function applyThemeFromSettings(){
  const mode = userSettings.theme || 'auto';
  let theme = mode;
  if(mode==='auto'){ theme = prefersDark.matches ? 'dark':'light'; }
  document.documentElement.setAttribute('data-theme', theme);
}
prefersDark.addEventListener('change', applyThemeFromSettings);
applyThemeFromSettings();

/* ===== Date strip only (no month strip) ===== */
const dateStrip = $("#dateStrip");
function chipStatus(iso){
  const day = orders[iso] || [];
  const hasActive = day.some(o=>o.status!=='done');
  return {hasActive};
}
function renderDateChips(){
  dateStrip.innerHTML='';
  const base = new Date(currentDate);
  [-1,0,1].forEach((off)=>{
    const dt = new Date(base); dt.setDate(base.getDate()+off);
    const iso = dt.toISOString().slice(0,10);
    const label = dt.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
    const chip = document.createElement('button');
    chip.className='chip'+(off===0?' active':'');
    const {hasActive} = chipStatus(iso);
    const dot = document.createElement('span');
    dot.className = 'dot ' + (hasActive ? 'active' : '');
    chip.append(document.createTextNode(label), dot);
    chip.addEventListener('click', ()=>{ currentDate = iso; renderDateChips(); renderDay(); });
    dateStrip.appendChild(chip);
  });
}
renderDateChips();

/* Swipe for days */
let touchX=null, touchY=null;
function onTouchStart(e){ const t=e.touches? e.touches[0]:e; touchX=t.clientX; touchY=t.clientY; }
function onTouchEnd(e){
  if(touchX===null) return;
  const t=e.changedTouches? e.changedTouches[0]:e;
  const dx = t.clientX - touchX;
  const dy = t.clientY - touchY;
  if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
    currentDate = addDaysISO(currentDate, dx<0 ? +1 : -1);
    renderDateChips(); renderDay(true, dx<0 ? 'left':'right');
  }
  touchX=touchY=null;
}
document.addEventListener('touchstart', onTouchStart, {passive:true});
document.addEventListener('touchend', onTouchEnd, {passive:true});
document.addEventListener('mousedown', onTouchStart);
document.addEventListener('mouseup', onTouchEnd);

/* ===== Filters now live in Profile ===== */
function attachProfileFilters(){
  $$("#filterBar .fchip").forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$("#filterBar .fchip").forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      // Обновляем Home, чтобы эффект сразу виден
      renderDay();
      showToast('Фильтр: ' + (currentFilter==='all'?'Все': currentFilter==='active'?'Активные':'Выполненные'));
    });
  });
}

/* ===== Conflict detection ===== */
function parseHM(str){ if(!str) return null; const [h,m]=str.split(':').map(n=>parseInt(n,10)); if(isNaN(h)||isNaN(m)) return null; return h*60+m; }
function findConflicts(day){
  const slots = day.map((o,i)=>({i, t:parseHM(o.time)})).filter(x=>x.t!=null);
  const set = new Set();
  for(let a=0;a<slots.length;a++){
    for(let b=a+1;b<b.length;b++){
      if(Math.abs(slots[a].t - slots[b].t) <= 60){ set.add(slots[a].i); set.add(slots[b].i); }
    }
  }
  return set;
}

/* ===== Icons ===== */
const svgPhone = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v2a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5 2h2a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.06a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgMap = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 3v15M15 6v15" stroke="currentColor" stroke-width="1.6"/></svg>';
const svgCheck = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgWarn = '⚠';

/* ===== Helpers ===== */
function statusBadge(status){ const cls = status==='done' ? 'done' : 'active'; const txt = status==='done' ? 'ВЫПОЛНЕНО' : 'АКТИВНО'; return `<span class="badge ${cls}">${txt}</span>`; }
function buildFullAddress(o){
  const city = userSettings.city ? (userSettings.city + ', ') : '';
  const street = o.street || '';
  const house = o.house || '';
  const apt = o.apt ? (', кв. ' + o.apt) : '';
  if(o.address && !street){ return o.address; }
  return city + [street, house].filter(Boolean).join(' ') + apt;
}
function digitsForURL(phone){ return (phone||'').replace(/\D/g,'').replace(/^8/,'7'); }

function openCall(phone){
  const digits = digitsForURL(phone);
  if(!digits) return;
  if(userSettings.callApp==='whatsapp'){
    window.location.href = `https://wa.me/${digits}`;
  } else if(userSettings.callApp==='telegram'){
    window.location.href = `tg://resolve?phone=${digits}`;
  } else {
    window.location.href = `tel:+${digits}`;
  }
}

function makeMapUrl(address){
  const q = encodeURIComponent(address);
  if(userSettings.mapApp==='yandex') return `https://yandex.ru/maps/?text=${q}`;
  if(userSettings.mapApp==='2gis') return `https://2gis.ru/search/${q}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/* ===== Cards (vertical layout) ===== */
function cardHTML(item, i, dateISO, conflict=false){
  const fullAddr = buildFullAddress(item);
  return `<div class="card" data-index="${i}" data-date="${dateISO}">
    <div class="kebab" aria-label="Больше">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="2" fill="currentColor"></circle>
        <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
        <circle cx="12" cy="19" r="2" fill="currentColor"></circle>
      </svg>
    </div>
    <h4>${item.name} ${statusBadge(item.status)} ${conflict ? `<span class="cwarn" title="Конфликт времени">${svgWarn}</span>` : ''}</h4>
    <div class="line">Адрес: ${fullAddr}</div>
    <div class="line">Телефон: ${item.phone}</div>
    <div class="line">Цена: ₽ ${item.price}</div>
    <div class="line">Тип/Время: ${item.type} · ${item.time || '--:--'}</div>
    <div class="line">Шлагбаум: ${(item.gate||'нет')==='да' ? 'Да' : 'Нет'} · Лифт: ${(item.elevator||'нет')==='да' ? 'Да' : 'Нет'}</div>

    <div class="expand">
      ${(item.company||item.contact||item.customer_note) ? `<div class="line"><strong>Заказчик:</strong> ${[item.company, item.contact].filter(Boolean).join(' — ')}</div>` : ''}
      ${item.customer_note ? `<div class="meta">Заметка: ${item.customer_note}</div>` : ''}
      <div class="meta">${item.comment || ''}</div>

      <div class="quick">
        <button class="icbtn callBtn" title="Позвонить" aria-label="Позвонить">${svgPhone}</button>
        <a class="icbtn" href="${makeMapUrl(fullAddr)}" title="Маршрут" aria-label="Маршрут" target="_blank" rel="noopener">${svgMap}</a>
      </div>
      ${item.status==='active' ? `<div class="donebar"><button class="icbtn markDoneIcon" title="Отметить выполнено" aria-label="Отметить выполнено">${svgCheck}</button></div>` : ''}
      ${conflict ? `<div class="warn">${svgWarn} Конфликт по времени (пересечение в пределах 60 мин)</div>` : ''}
    </div>
    <div class="menu">
      <button class="editBtn">Редактировать</button>
      ${item.status==='active' ? '<button class="markDoneBtn">Отметить выполнено</button>' : '<button class="markActiveBtn">Вернуть в активные</button>'}
      <button class="delBtn">Удалить</button>
    </div>
  </div>`;
}

function renderDay(withSwipeAnim=false, dir='left'){
  const list = $("#ordersList");
  const empty = $("#emptyDay");
  const all = orders[currentDate] || [];
  const conflicts = findConflicts(all);
  const filtered = all.filter(o=> currentFilter==='all' ? true : (currentFilter==='active' ? o.status!=='done' : o.status==='done'));
  list.innerHTML = filtered.map((it,i)=>{
    const origIndex = all.indexOf(it);
    const isConflict = conflicts.has(origIndex);
    return cardHTML(it, origIndex, currentDate, isConflict);
  }).join('');
  empty.style.display = filtered.length? 'none':'block';

  $$("#ordersList .card").forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target.closest('.kebab') || e.target.closest('.menu') || e.target.closest('.editBtn') || e.target.closest('.delBtn') || e.target.closest('.markDoneBtn') || e.target.closest('.markActiveBtn') || e.target.closest('.markDoneIcon') || e.target.closest('.callBtn')) return;
      card.classList.toggle('expanded');
    });
    const kebab = $(".kebab", card);
    const menu = $(".menu", card);
    kebab.addEventListener('click', (e)=>{
      e.stopPropagation(); const open = menu.style.display==='block';
      $$("#ordersList .menu").forEach(m=>m.style.display='none'); menu.style.display = open ? 'none' : 'block';
    });
    const done = $(".markDoneBtn", card);
    if(done){ done.addEventListener('click', (e)=>{ e.stopPropagation(); setStatus(card.dataset.date, parseInt(card.dataset.index,10), 'done'); }); }
    const active = $(".markActiveBtn", card);
    if(active){ active.addEventListener('click', (e)=>{ e.stopPropagation(); setStatus(card.dataset.date, parseInt(card.dataset.index,10), 'active'); }); }
    const doneIcon = $(".markDoneIcon", card);
    if(doneIcon){ doneIcon.addEventListener('click', (e)=>{ e.stopPropagation(); setStatus(card.dataset.date, parseInt(card.dataset.index,10), 'done'); }); }
    const callBtn = $(".callBtn", card);
    if(callBtn){ callBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const idx = parseInt(card.dataset.index,10); openCall(all[idx].phone); }); }
    $(".editBtn", card).addEventListener('click', (e)=>{ e.stopPropagation(); openEditFor(card.dataset.date, parseInt(card.dataset.index,10)); });
    $(".delBtn", card).addEventListener('click', (e)=>{ e.stopPropagation(); deleteOrder(card.dataset.date, parseInt(card.dataset.index,10)); });
  });

  if(withSwipeAnim){
    list.animate([{transform:`translateX(${dir==='left' ? '40px':'-40px'})`, opacity:.0},{transform:'translateX(0)', opacity:1}], {duration:180, easing:'ease-out'});
  }
}
renderDay();

function setStatus(date, index, status){
  orders[date][index].status = status==='done' ? 'done' : 'active';
  persistAll();
  renderDay();
  showToast(status==='done' ? 'Отмечено как выполнено' : 'Вернули в активные');
}

/* ===== Requests ===== */
function renderRequests(){
  const list = $("#requestsList");
  const empty = $("#emptyReq");
  if(!requests.length){ empty.style.display = 'block'; list.innerHTML=''; return; }
  empty.style.display = 'none';
  list.innerHTML = requests.map(r=>{
    const addr = buildFullAddress(r);
    return `<div class="card" data-id="${r.id}">
      <h4>${r.name}</h4>
      <div class="line">Адрес: ${addr}</div>
      <div class="line">Телефон: ${r.phone}</div>
      <div class="line">Цена: ₽ ${r.price}</div>
      <div class="expand">
        <div class="meta">Тип: ${r.type} · Время: ${r.time || '--:--'} · Шлагбаум: ${(r.gate||'нет')==='да'?'Да':'Нет'} · Лифт: ${(r.elevator||'нет')==='да'?'Да':'Нет'}</div>
        ${r.customer_note ? `<div class="meta">Заметка: ${r.customer_note}</div>` : ''}
        <div class="meta">Дата: ${fmt(r.date)}</div>
        <div class="quick">
          <button class="icbtn callBtn" title="Позвонить" aria-label="Позвонить">${svgPhone}</button>
          <a class="icbtn" href="${makeMapUrl(addr)}" title="Маршрут" aria-label="Маршрут" target="_blank" rel="noopener">${svgMap}</a>
        </div>
      </div>
      <div class="actions" style="margin-top:10px">
        <button class="btn primary acceptBtn">Принять</button>
        <button class="btn declineBtn">Отклонить</button>
      </div>
    </div>`;
  }).join('');
  $$("#requestsList .card").forEach(card=>{
    card.addEventListener('click',(e)=>{ if(e.target.closest('.actions')) return; card.classList.toggle('expanded'); });
    $(".acceptBtn",card).addEventListener('click',()=> acceptRequest(card.dataset.id));
    $(".declineBtn",card).addEventListener('click',()=> declineRequest(card.dataset.id));
    $(".callBtn",card).addEventListener('click',()=>{
      const id = card.dataset.id;
      const r = requests.find(x=>x.id===id);
      if(r) openCall(r.phone);
    });
  });
}

function acceptRequest(id){
  const idx = requests.findIndex(r=>r.id===id);
  if(idx<0) return;
  const r = requests[idx];
  if(!orders[r.date]) orders[r.date]=[];
  orders[r.date].push({
    name:r.name, street:r.street, house:r.house, apt:r.apt, price:r.price, phone:r.phone, type:r.type, gate:r.gate || 'нет', elevator:r.elevator || 'нет',
    time:r.time, comment:r.comment, status:'active', company:r.company||'', contact:r.contact||'', customer_note:r.customer_note||''
  });
  requests.splice(idx,1);
  persistAll();
  renderRequests();
  renderDateChips(); renderDay();
  showToast('Заявка принята');
}
function declineRequest(id){
  const idx = requests.findIndex(r=>r.id===id);
  if(idx<0) return;
  requests.splice(idx,1);
  persistAll();
  renderRequests();
  showToast('Заявка отклонена');
}

/* ===== Modals ===== */
function openModal(id){ $("#"+id).classList.add('open'); }
function closeModal(id){ $("#"+id).classList.remove('open'); }
$$('[data-close]').forEach(btn=> btn.addEventListener('click', ()=> closeModal(btn.getAttribute('data-close')) ));

/* ===== Calendar ===== */
$("#calendarBtn").addEventListener('click', ()=>{
  $("#calendarInput").value = currentDate;
  openModal('calendarModal');
});
$("#goToDate").addEventListener('click', ()=>{
  const d = $("#calendarInput").value || todayISO();
  currentDate = d;
  closeModal('calendarModal');
  renderDateChips(); renderDay(true,'left');
  showToast('Открыт день: '+fmt(d));
});

/* ===== Add/Edit Order ===== */
$("#addOrderBtn").addEventListener('click', ()=>{
  $("#f_date").value = currentDate;
  $("#f_gate").value = 'нет'; $("#f_elevator").value = 'нет';
  attachPhoneMask($("#f_phone"));
});

$("#saveOrder").addEventListener('click', ()=>{
  const data = {
    name: $("#f_name").value || 'Без имени',
    phone: $("#f_phone").value || '',
    street: $("#f_street").value || '',
    house: $("#f_house").value || '',
    apt: $("#f_apt").value || '',
    price: parseInt($("#f_price").value||'0',10),
    time: $("#f_time").value || '',
    type: $("#f_type").value,
    gate: $("#f_gate").value || 'нет',
    elevator: $("#f_elevator").value || 'нет',
    company: $("#f_company").value || '',
    contact: $("#f_contact").value || '',
    customer_note: $("#f_customer_note").value || '',
    comment: $("#f_comment").value || '',
    status: 'active'
  };
  const date = $("#f_date").value || currentDate;
  if(!orders[date]) orders[date]=[];
  orders[date].push(data);
  persistAll();
  ["f_name","f_phone","f_street","f_house","f_apt","f_price","f_time","f_company","f_contact","f_customer_note","f_comment"].forEach(id=> $("#"+id).value='');
  $("#f_type").value='мебель'; $("#f_gate").value='нет'; $("#f_elevator").value='нет'; $("#f_date").value=currentDate;
  closeModal('orderModal');
  currentDate = date;
  renderDateChips(); renderDay();
  showToast('Заказ добавлен · '+fmt(date));
});

function openEditFor(date, index){
  const o = orders[date][index]; if(!o) return;
  window._editing = {date, index};
  $("#e_name").value = o.name; $("#e_phone").value = o.phone;
  $("#e_street").value = o.street||''; $("#e_house").value = o.house||''; $("#e_apt").value = o.apt||'';
  $("#e_price").value = o.price; $("#e_time").value = o.time; $("#e_type").value = o.type;
  $("#e_gate").value = o.gate || 'нет'; $("#e_elevator").value = o.elevator || 'нет';
  $("#e_company").value = o.company||''; $("#e_contact").value = o.contact||''; $("#e_customer_note").value = o.customer_note||'';
  $("#e_comment").value = o.comment; $("#e_date").value = date;
  attachPhoneMask($("#e_phone"));
  openModal('editModal');
}
$("#updateOrder").addEventListener('click', ()=>{
  const ed = window._editing; if(!ed) return;
  const {date,index} = ed;
  const o = orders[date][index];
  const newDate = $("#e_date").value || date;
  const data = {
    name: $("#e_name").value, phone: $("#e_phone").value,
    street: $("#e_street").value||'', house: $("#e_house").value||'', apt: $("#e_apt").value||'',
    price: parseInt($("#e_price").value||'0',10), time: $("#e_time").value,
    type: $("#e_type").value, gate: $("#e_gate").value || 'нет', elevator: $("#e_elevator").value || 'нет',
    company: $("#e_company").value||'', contact: $("#e_contact").value||'', customer_note: $("#e_customer_note").value||'',
    comment: $("#e_comment").value, status: o.status || 'active'
  };
  orders[date].splice(index,1);
  if(!orders[newDate]) orders[newDate]=[];
  orders[newDate].push(data);
  persistAll();
  closeModal('editModal');
  currentDate = newDate;
  renderDateChips(); renderDay();
  showToast('Заказ обновлён');
});
$("#deleteOrder").addEventListener('click', ()=>{
  const ed = window._editing; if(!ed) return;
  const {date,index} = ed;
  orders[date].splice(index,1);
  persistAll();
  closeModal('editModal');
  renderDateChips(); renderDay();
  showToast('Заказ удалён');
});

/* ===== Views switching (top active state + bottom nav 3 centered) ===== */
const views = { home: $("#view-home"), requests: $("#view-requests"), settings: $("#view-settings"), profile: $("#view-profile") };
function showView(key){
  Object.values(views).forEach(v=>v.classList.remove('active'));
  views[key].classList.add('active');
  // Bottom nav active
  $$(".navbtn").forEach(b=>b.classList.remove('active'));
  const mapping = {home:0, requests:1};
  if(mapping[key]!=null) $$(".navbtn")[mapping[key]].classList.add('active');
  // Top icons active state
  $$(".iconbtn[data-top]").forEach(b=>b.classList.remove('active'));
  if(key==='profile') $("#profileBtn").classList.add('active');
  if(key==='settings') $("#settingsBtn").classList.add('active');
  // Title
  const title = {home:'Главный экран', requests:'Заявки', settings:'Настройки', profile:'Профиль'}[key] || 'MOVI';
  $("#pageTitle").textContent = title;
}
$$(".navbtn").forEach((btn,idx)=>{
  btn.addEventListener('click', ()=>{
    if(btn.id==='addOrderBtn'){ openModal('orderModal'); return; }
    const map = {0:'home',1:'requests'};
    if(map[idx]){
      showView(map[idx]);
      if(map[idx]==='requests') renderRequests();
      if(map[idx]==='home') renderDay();
    }
  });
});
$("#profileBtn").addEventListener('click', ()=>{ showView('profile'); renderProfileStats(); syncProfileUI(); attachProfileFilters(); });
$("#settingsBtn").addEventListener('click', ()=>{ showView('settings'); syncSettingsUI(); });

/* ===== Settings UI sync ===== */
function syncSettingsUI(){
  $("#themeSelect").value = userSettings.theme || 'auto';
  $("#cityInput").value = userSettings.city || '';
  $("#callAppSelect").value = userSettings.callApp || 'phone';
  $("#mapAppSelect").value = userSettings.mapApp || 'google';
}
$("#themeSelect")?.addEventListener('change', (e)=>{
  userSettings.theme = e.target.value; saveLS('movi_settings', userSettings); applyThemeFromSettings();
});
$("#cityInput")?.addEventListener('input', (e)=>{ userSettings.city = e.target.value; saveLS('movi_settings', userSettings); renderDay(); renderRequests(); });
$("#callAppSelect")?.addEventListener('change', (e)=>{ userSettings.callApp = e.target.value; saveLS('movi_settings', userSettings); });
$("#mapAppSelect")?.addEventListener('change', (e)=>{ userSettings.mapApp = e.target.value; saveLS('movi_settings', userSettings); });

/* ===== Profile UI & stats ===== */
function syncProfileUI(){
  $("#p_name").value = userProfile.name || '';
  $("#p_phone").value = userProfile.phone || '';
  attachPhoneMask($("#p_phone"));
}
$("#saveProfileBtn").addEventListener('click', ()=>{
  userProfile.name = $("#p_name").value || 'Исполнитель';
  userProfile.phone = $("#p_phone").value || '+7 ';
  saveLS('movi_profile', userProfile);
  showToast('Профиль сохранён');
  renderProfileStats();
});
function renderProfileStats(){
  const all = Object.entries(orders).flatMap(([date,arr])=>arr.map(o=>({date, ...o})));
  const total = all.length;
  const done = all.filter(o=>o.status==='done').length;
  const active = total - done;
  const revenue = all.filter(o=>o.status==='done').reduce((s,o)=>s+(parseInt(o.price||0,10)||0),0);

  $("#profileStats").innerHTML = `
    <div class="cardlike"><div class="meta">Всего заказов</div><div class="price">${total}</div></div>
    <div class="cardlike"><div class="meta">Выполнено</div><div class="price">${done}</div></div>
    <div class="cardlike"><div class="meta">Активные</div><div class="price">${active}</div></div>
    <div class="cardlike"><div class="meta">Заработано ₽</div><div class="price">${revenue}</div></div>
  `;

  const agg = {};
  all.forEach(o=>{
    const ym = (o.date||'').slice(0,7);
    if(!agg[ym]) agg[ym] = {count:0, done:0, revenue:0};
    agg[ym].count += 1;
    if(o.status==='done'){ agg[ym].done += 1; agg[ym].revenue += (parseInt(o.price||0,10)||0); }
  });
  const rows = Object.entries(agg).sort((a,b)=> a[0] > b[0] ? -1 : 1).map(([ym, val])=>{
    if(!ym) return '';
    const monthName = new Date(`${ym}-01`).toLocaleDateString('ru-RU',{month:'long', year:'numeric'});
    return `<div class="row"><span style="text-transform:capitalize">${monthName}</span><span>${val.count} / выполнено ${val.done} • ₽${val.revenue}</span></div>`;
  }).join('');
  $("#monthlyStats").innerHTML = rows || '<div class="meta">Нет данных</div>';
}
renderProfileStats();

/* ===== Toast ===== */
let toastTimer=null;
function showToast(msg){
  const t=$("#toast"); t.querySelector('span').textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=> t.classList.remove('show'), 1600);
}

/* ===== Global key arrows for day nav ===== */
document.addEventListener('keydown', (e)=>{
  if(e.key==='ArrowLeft'){ currentDate = addDaysISO(currentDate,-1); renderDateChips(); renderDay(true,'right'); }
  if(e.key==='ArrowRight'){ currentDate = addDaysISO(currentDate,1); renderDateChips(); renderDay(true,'left'); }
});
