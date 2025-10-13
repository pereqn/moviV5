// MOVI prototype JS v5
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const fmt = (d)=> new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
const fmtDM = (d)=> new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
const todayISO = ()=> new Date().toISOString().slice(0,10);
const addDaysISO = (iso, delta)=>{ const d=new Date(iso); d.setDate(d.getDate()+delta); return d.toISOString().slice(0,10); };

let currentDate = todayISO();
let currentFilter = 'all'; // all | active | done

let orders = {};
let requests = [
  {id:'r1', name:'Илья', phone:'+7 900 000-00-01', address:'Гайдара, 5', type:'мебель', time:'12:30', price:1500, comment:'Диван на 3й этаж, без лифта', date: todayISO(), gate:'нет', elevator:'нет'},
  {id:'r2', name:'Марина', phone:'+7 900 000-00-02', address:'Ленинский, 21', type:'техника', time:'18:00', price:900, comment:'Стиралка, нужен аккуратный подъём', date: addDaysISO(todayISO(),1), gate:'да', elevator:'да'}
];
let editing = {date:null, index:null};

function seedDemo(){
  const d0 = todayISO();
  const d_1 = addDaysISO(d0,-1);
  const d1 = addDaysISO(d0,1);
  orders[d0]=[
    {name:'Наташа', address:'Победы, 12', price:1200, phone:'+7 900 123-45-67', type:'мебель', time:'12:30', comment:'Комод, лифт работает', status:'active', gate:'нет', elevator:'да'},
    {name:'Сергей', address:'Мира, 2', price:800, phone:'+7 900 765-43-21', type:'прочее', time:'12:50', comment:'Коробки, шлагбаум', status:'active', gate:'да', elevator:'нет'},
    {name:'Олег', address:'Центральная, 9', price:950, phone:'+7 900 222-22-22', type:'прочее', time:'16:15', comment:'Пара коробок', status:'done', gate:'нет', elevator:'да'}
  ];
  orders[d_1]=[
    {name:'Антон', address:'Балтийская, 8', price:1100, phone:'+7 900 222-33-44', type:'техника', time:'10:00', comment:'Холодильник, без лифта', status:'done', gate:'нет', elevator:'нет'}
  ];
  orders[d1]=[
    {name:'Ольга', address:'Москва пр-т, 44', price:1600, phone:'+7 900 555-66-77', type:'мебель', time:'19:00', comment:'Шкаф-купе', status:'active', gate:'нет', elevator:'да'}
  ];
}
seedDemo();

/* ===== Date strip with status dots ===== */
const dateStrip = $("#dateStrip");
function chipStatus(iso){
  const day = orders[iso] || [];
  const hasActive = day.some(o=>o.status!=='done');
  const isEmpty = day.length===0;
  return {hasActive, isEmpty};
}
function renderDateChips(){
  dateStrip.innerHTML='';
  const base = new Date(currentDate);
  const today = todayISO();
  [-1,0,1].forEach((off)=>{
    const dt = new Date(base); dt.setDate(base.getDate()+off);
    const iso = dt.toISOString().slice(0,10);
    let label;
    if(off===0 && iso===today){ label = 'Сегодня · ' + fmtDM(iso); } else { label = fmtDM(iso); }
    const chip = document.createElement('button');
    chip.className='chip'+(off===0?' active':'');
    const {hasActive} = chipStatus(iso);
    const dot = document.createElement('span');
    dot.className = 'dot ' + (hasActive ? 'active' : '');
    chip.append(document.createTextNode(label), dot);
    chip.addEventListener('click', ()=>{ currentDate = iso; renderDateChips(); renderDay(); renderWeekStats(); renderDayMonthStats(); });
    dateStrip.appendChild(chip);
  });
}
renderDateChips();

/* ===== Filter chips ===== */
$$("#filterBar .fchip").forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$("#filterBar .fchip").forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderDay();
  });
});

/* ===== Week + Day/Month analytics ===== */
function weekBounds(iso){
  const d = new Date(iso);
  const day = (d.getDay()+6)%7; // Mon=0..Sun=6
  const start = new Date(d); start.setDate(d.getDate()-day);
  const end = new Date(start); end.setDate(start.getDate()+6);
  const sISO = start.toISOString().slice(0,10);
  const eISO = end.toISOString().slice(0,10);
  return {start:sISO, end:eISO};
}
function rangeISO(startISO, endISO){
  const out=[]; let cur = new Date(startISO); const end = new Date(endISO);
  while(cur<=end){ out.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1); }
  return out;
}
function renderWeekStats(){
  const {start, end} = weekBounds(currentDate);
  const days = rangeISO(start, end);
  let total=0, active=0, done=0, revenue=0;
  days.forEach(d=>{
    (orders[d]||[]).forEach(o=>{
      total++; if(o.status==='done'){ done++; revenue += (parseInt(o.price||0,10)||0); } else { active++; }
    })
  });
  $("#weekStats").textContent = `Неделя ${fmt(start)} — ${fmt(end)}: всего ${total} • активные ${active} • выполненные ${done} • ₽${revenue}`;
}
function renderDayMonthStats(){
  const dayArr = orders[currentDate] || [];
  const dayActive = dayArr.filter(o=>o.status!=='done').length;
  const dayDone = dayArr.filter(o=>o.status==='done').length;
  const dayRevenue = dayArr.filter(o=>o.status==='done').reduce((s,o)=>s+(parseInt(o.price||0,10)||0),0);

  const d = new Date(currentDate);
  const y = d.getFullYear(); const m = d.getMonth(); // 0-11
  let monthRevenue=0, monthActive=0, monthDone=0, monthTotal=0;
  Object.keys(orders).forEach(key=>{
    const kd = new Date(key);
    if(kd.getFullYear()===y && kd.getMonth()===m){
      (orders[key]||[]).forEach(o=>{
        monthTotal++;
        if(o.status==='done'){ monthDone++; monthRevenue += (parseInt(o.price||0,10)||0); }
        else { monthActive++; }
      });
    }
  });
  $("#dayMonthStats").textContent = `День: активные ${dayActive} • выполненные ${dayDone} • ₽${dayRevenue}  |  Месяц: всего ${monthTotal} • активные ${monthActive} • выполненные ${monthDone} • ₽${monthRevenue}`;
}
renderWeekStats();
renderDayMonthStats();

/* ===== Views switching ===== */
const views = { home: $("#view-home"), requests: $("#view-requests"), settings: $("#view-settings") };
function showView(key){
  Object.values(views).forEach(v=>v.classList.remove('active'));
  views[key].classList.add('active');
  $$(".navbtn").forEach(b=>b.classList.remove('active'));
  const mapping = {home:0, requests:1, settings:2};
  if(mapping[key]!=null) $$(".navbtn")[mapping[key]].classList.add('active');
  const title = {home:'Главный экран', requests:'Заявки', settings:'Настройки'}[key] || 'Главный экран';
  $("#pageTitle").textContent = title;
}
$$(".navbtn").forEach((btn,idx)=>{
  btn.addEventListener('click', ()=>{
    if(btn.id==='addOrderBtn'){ openModal('orderModal'); return; }
    const map = {0:'home',1:'requests',2:'settings'};
    if(map[idx]){ showView(map[idx]); if(map[idx]==='requests') renderRequests(); if(map[idx]==='home') renderDay(); }
  });
});

/* ===== Conflict detection (same-day, <60min apart) ===== */
function parseHM(str){ if(!str) return null; const [h,m]=str.split(':').map(n=>parseInt(n,10)); if(isNaN(h)||isNaN(m)) return null; return h*60+m; }
function findConflicts(day){
  const slots = day.map((o,i)=>({i, t:parseHM(o.time)})).filter(x=>x.t!=null);
  const set = new Set();
  for(let a=0;a<slots.length;a++){
    for(let b=a+1;b<slots.length;b++){
      if(Math.abs(slots[a].t - slots[b].t) <= 60){ set.add(slots[a].i); set.add(slots[b].i); }
    }
  }
  return set; // indexes with conflicts
}

/* ===== Icons (inline SVG) ===== */
const svgPhone = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v2a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5 2h2a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.06a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgMap = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 3v15M15 6v15" stroke="currentColor" stroke-width="1.6"/></svg>';
const svgCheck = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgWarn = '⚠';

/* ===== Cards ===== */
function statusBadge(status){
  const cls = status==='done' ? 'done' : 'active';
  const txt = status==='done' ? 'ВЫПОЛНЕНО' : 'АКТИВНО';
  return `<span class="badge ${cls}">${txt}</span>`;
}
function mapUrl(address){ return `https://maps.google.com/?q=${encodeURIComponent(address)}`; }
function telUrl(phone){ return `tel:${phone.replace(/[^+\d]/g,'')}`; }

function cardHTML(item, i, dateISO, conflict=false){
  return `<div class="card" data-index="${i}" data-date="${dateISO}">
    <div class="kebab" aria-label="Больше">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="2" fill="currentColor"></circle>
        <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
        <circle cx="12" cy="19" r="2" fill="currentColor"></circle>
      </svg>
    </div>
    <h4>${item.name} ${statusBadge(item.status)} ${conflict ? `<span class="cwarn" title="Конфликт времени">${svgWarn}</span>` : ''}</h4>
    <div class="meta">${item.address}</div>
    <div class="price">₽ ${item.price}</div>
    <div class="contact">☎ ${item.phone}</div>
    <div class="expand">
      <div class="meta">Тип: ${item.type} · Время: ${item.time || '--:--'} · Шлагбаум: ${(item.gate||'нет')==='да' ? 'Да' : 'Нет'} · Лифт: ${(item.elevator||'нет')==='да' ? 'Да' : 'Нет'}</div>
      <div>${item.comment || ''}</div>
      <div class="quick">
        <a class="icbtn" href="${telUrl(item.phone)}" title="Позвонить" aria-label="Позвонить">${svgPhone}</a>
        <a class="icbtn" href="${mapUrl(item.address)}" title="Маршрут" aria-label="Маршрут" target="_blank" rel="noopener">${svgMap}</a>
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
      if(e.target.closest('.kebab') || e.target.closest('.menu') || e.target.closest('.editBtn') || e.target.closest('.delBtn') || e.target.closest('.markDoneBtn') || e.target.closest('.markActiveBtn') || e.target.closest('.markDoneIcon')) return;
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
  renderDay();
  renderDateChips();
  renderWeekStats();
  renderDayMonthStats();
  showToast(status==='done' ? 'Отмечено как выполнено' : 'Вернули в активные');
}

/* ===== Requests ===== */
function renderRequests(){
  const list = $("#requestsList");
  const empty = $("#emptyReq");
  if(!requests.length){ empty.style.display = 'block'; list.innerHTML=''; return; }
  empty.style.display = 'none';
  list.innerHTML = requests.map(r=>`<div class="card" data-id="${r.id}">
    <h4>${r.name}</h4>
    <div class="meta">${r.address}</div>
    <div class="price">₽ ${r.price}</div>
    <div class="contact">☎ ${r.phone}</div>
    <div class="expand">
      <div class="meta">Тип: ${r.type} · Время: ${r.time || '--:--'} · Шлагбаум: ${(r.gate||'нет')==='да'?'Да':'Нет'} · Лифт: ${(r.elevator||'нет')==='да'?'Да':'Нет'}</div>
      <div>${r.comment || ''}</div>
      <div class="meta">Дата: ${fmt(r.date)}</div>
      <div class="quick">
        <a class="icbtn" href="${'tel:'+r.phone.replace(/[^+\\d]/g,'')}" title="Позвонить" aria-label="Позвонить"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v2a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5 2h2a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.06a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        <a class="icbtn" href="${'https://maps.google.com/?q='+encodeURIComponent('')}" title="Маршрут" aria-label="Маршрут" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 3v15M15 6v15" stroke="currentColor" stroke-width="1.6"/></svg></a>
      </div>
    </div>
    <div class="actions" style="margin-top:10px">
      <button class="btn primary acceptBtn">Принять</button>
      <button class="btn declineBtn">Отклонить</button>
    </div>
  </div>`).join('');
  $$("#requestsList .card").forEach(card=>{
    card.addEventListener('click',(e)=>{ if(e.target.closest('.actions')) return; card.classList.toggle('expanded'); });
    $(".acceptBtn",card).addEventListener('click',()=> acceptRequest(card.dataset.id));
    $(".declineBtn",card).addEventListener('click',()=> declineRequest(card.dataset.id));
  });
}

function acceptRequest(id){
  const idx = requests.findIndex(r=>r.id===id);
  if(idx<0) return;
  const r = requests[idx];
  if(!orders[r.date]) orders[r.date]=[];
  orders[r.date].push({
    name:r.name, address:r.address, price:r.price, phone:r.phone, type:r.type, gate:r.gate || 'нет', elevator:r.elevator || 'нет',
    time:r.time, comment:r.comment, status:'active'
  });
  requests.splice(idx,1);
  renderRequests();
  if(fmt(currentDate)===fmt(r.date)) renderDay();
  renderDateChips();
  renderWeekStats();
  renderDayMonthStats();
  showToast('Заявка принята');
}
function declineRequest(id){
  const idx = requests.findIndex(r=>r.id===id);
  if(idx<0) return;
  requests.splice(idx,1);
  renderRequests();
  showToast('Заявка отклонена');
}

/* ===== Modals ===== */
function openModal(id){ $("#"+id).classList.add('open'); }
function closeModal(id){ $("#"+id).classList.remove('open'); }
$$('[data-close]').forEach(btn=> btn.addEventListener('click', ()=> closeModal(btn.getAttribute('data-close')) ));

$("#calendarBtn").addEventListener('click', ()=>{
  $("#calendarInput").value = currentDate;
  openModal('calendarModal');
});
$("#goToDate").addEventListener('click', ()=>{
  const d = $("#calendarInput").value || todayISO();
  currentDate = d;
  closeModal('calendarModal');
  renderDateChips(); renderDay(true,'left'); renderWeekStats(); renderDayMonthStats();
  showToast('Открыт день: '+fmt(d));
});

$("#addOrderBtn").addEventListener('click', ()=>{
  $("#f_date").value = currentDate;
  $("#f_gate").value = 'нет';
  $("#f_elevator").value = 'нет';
});
$("#saveOrder").addEventListener('click', ()=>{
  const data = {
    name: $("#f_name").value || 'Без имени',
    phone: $("#f_phone").value || '',
    address: $("#f_address").value || '',
    price: parseInt($("#f_price").value||'0',10),
    time: $("#f_time").value || '',
    type: $("#f_type").value,
    gate: $("#f_gate").value || 'нет',
    elevator: $("#f_elevator").value || 'нет',
    comment: $("#f_comment").value || '',
    status: 'active'
  };
  const date = $("#f_date").value || currentDate;
  if(!orders[date]) orders[date]=[];
  orders[date].push(data);
  ["f_name","f_phone","f_address","f_price","f_time","f_comment"].forEach(id=> $("#"+id).value='');
  $("#f_type").value='мебель'; $("#f_gate").value='нет'; $("#f_elevator").value='нет'; $("#f_date").value=currentDate;
  closeModal('orderModal');
  currentDate = date;
  renderDateChips(); renderDay(); renderWeekStats(); renderDayMonthStats();
  showToast('Заказ добавлен · '+fmt(date));
});

function openEditFor(date, index){
  editing = {date, index};
  const o = orders[date][index];
  $("#e_name").value = o.name; $("#e_phone").value = o.phone; $("#e_address").value = o.address;
  $("#e_price").value = o.price; $("#e_time").value = o.time; $("#e_type").value = o.type;
  $("#e_gate").value = o.gate || 'нет'; $("#e_elevator").value = o.elevator || 'нет';
  $("#e_comment").value = o.comment; $("#e_date").value = date;
  openModal('editModal');
}
$("#updateOrder").addEventListener('click', ()=>{
  const {date,index} = editing;
  const o = orders[date][index];
  const newDate = $("#e_date").value || date;
  const data = {
    name: $("#e_name").value, phone: $("#e_phone").value, address: $("#e_address").value,
    price: parseInt($("#e_price").value||'0',10), time: $("#e_time").value,
    type: $("#e_type").value, gate: $("#e_gate").value || 'нет', elevator: $("#e_elevator").value || 'нет',
    comment: $("#e_comment").value, status: o.status || 'active'
  };
  orders[date].splice(index,1);
  if(!orders[newDate]) orders[newDate]=[];
  orders[newDate].push(data);
  closeModal('editModal');
  currentDate = newDate;
  renderDateChips(); renderDay(); renderWeekStats(); renderDayMonthStats();
  showToast('Заказ обновлён');
});
$("#deleteOrder").addEventListener('click', ()=>{
  const {date,index} = editing;
  orders[date].splice(index,1);
  closeModal('editModal');
  renderDateChips(); renderDay(); renderWeekStats(); renderDayMonthStats();
  showToast('Заказ удалён');
});

/* ===== Theme (dark/light) ===== */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  const toggler = $("#themeToggle");
  if(toggler) toggler.checked = (theme==='dark');
  localStorage.setItem('theme', theme);
}
(function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved){ applyTheme(saved); } else { applyTheme('light'); }
})();
$("#themeToggle")?.addEventListener('change', (e)=> applyTheme(e.target.checked ? 'dark' : 'light'));

/* ===== Toast ===== */
let toastTimer=null;
function showToast(msg){
  const t=$("#toast"); t.querySelector('span').textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=> t.classList.remove('show'), 1600);
}

/* ===== Swipe support (dates) ===== */
let touchX=null, touchY=null;
function onTouchStart(e){ const t=e.touches? e.touches[0]:e; touchX=t.clientX; touchY=t.clientY; }
function onTouchEnd(e){
  if(touchX===null) return;
  const t=e.changedTouches? e.changedTouches[0]:e;
  const dx = t.clientX - touchX;
  const dy = t.clientY - touchY;
  if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
    currentDate = addDaysISO(currentDate, dx<0 ? +1 : -1);
    renderDateChips(); renderDay(true, dx<0 ? 'left':'right'); renderWeekStats(); renderDayMonthStats();
  }
  touchX=touchY=null;
}
document.addEventListener('touchstart', onTouchStart, {passive:true});
document.addEventListener('touchend', onTouchEnd, {passive:true});
document.addEventListener('mousedown', onTouchStart);
document.addEventListener('mouseup', onTouchEnd);

/* ===== Helpers ===== */
function deleteOrder(date, index){
  orders[date].splice(index,1);
  renderDay(); renderDateChips(); renderWeekStats(); renderDayMonthStats();
  showToast('Заказ удалён');
}
