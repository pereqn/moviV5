/* ============================================================
   MOVI Driver — V1.4.0 (Supabase Sync Edition)
   Полная интеграция с Supabase (client_orders + orders)
   ============================================================ */

/* --------------------- CONFIG --------------------- */

const SUPABASE_URL = "https://jkxlmpwmqinrrkexnffo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreGxtcHdtcWlucnJrZXhuZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzY3NDEsImV4cCI6MjA3NjIxMjc0MX0.ECWEee_3ijraDW1QGhlmjxsF6uTltkro5IDPKwcvvak";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------------------------------------------------
   Внутренние состояния
--------------------------------------------------------- */

let requests = [];     // заявки из client_orders
let orders = {};       // заказы по датам (из orders таблицы)
let currentDate = new Date().toISOString().slice(0, 10);
let currentFilter = "all";

/* ---------------------------------------------------------
   Загрузка данных
--------------------------------------------------------- */

// Загружаем заявки
async function loadRequests() {
  const { data, error } = await supabase
    .from("client_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ошибка загрузки заявок", error);
    showToast("Ошибка загрузки заявок");
    return;
  }

  requests = data || [];
  renderRequests();
}

// Загружаем принятые заказы
async function loadOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки заказов", error);
    showToast("Ошибка загрузки заказов");
    return;
  }

  orders = {};

  (data || []).forEach(o => {
    if (!orders[o.date]) orders[o.date] = [];
    orders[o.date].push(o);
  });

  renderDay();
  renderDateChips();
}

/* ---------------------------------------------------------
   Принятие заявки → перенос в таблицу orders
--------------------------------------------------------- */

async function acceptRequest(id) {
  const r = requests.find(x => x.id === id);
  if (!r) return;

  // Переводим тип
  const delivery_map = {
    "мебель": "furniture",
    "техника": "delivery",
    "меб": "furniture"
  };
  const deliv = delivery_map[r.delivery_type?.toLowerCase()] || "delivery";

  // Создаем заказ в orders
  const { error: insertError } = await supabase.from("orders").insert({
    delivery_type: deliv,
    date: r.date || null,
    time_from: null,
    time_to: null,
    floors: 0,
    has_elevator: false,
    has_barrier: false,
    assembly_req: false,
    base_price_rub: 0,
    extra_price_rub: 0,
    total_price_rub: 0,
    notes: `Имя: ${r.name}\nТелефон: ${r.phone}\nГород: ${r.city}\nАдрес: ${r.address}\nТип: ${r.delivery_type}`
  });

  if (insertError) {
    console.error(insertError);
    showToast("Ошибка при принятии");
    return;
  }

  // Удаляем заявку
  await supabase.from("client_orders").delete().eq("id", id);

  showToast("Заявка принята");

  await loadRequests();
  await loadOrders();
}

/* ---------------------------------------------------------
   Отклонить заявку
--------------------------------------------------------- */

async function declineRequest(id) {
  await supabase.from("client_orders").delete().eq("id", id);
  showToast("Заявка отклонена");
  loadRequests();
}

/* ---------------------------------------------------------
   Render REQUESTS
--------------------------------------------------------- */

function requestCardHTML(r) {
  return `
    <div class="card" data-id="${r.id}">
      <h4>${r.name}</h4>
      <div class="line">Дата: ${r.date}</div>
      <div class="line">Телефон: ${r.phone}</div>
      <div class="line">Адрес: ${r.address}</div>
      <div class="line">Тип: ${r.delivery_type}</div>

      <div class="actions" style="margin-top:10px">
        <button class="btn primary acceptBtn">Принять</button>
        <button class="btn declineBtn">Отклонить</button>
      </div>
    </div>
  `;
}

function renderRequests() {
  const list = $("#requestsList");
  const empty = $("#emptyReq");

  if (!requests.length) {
    empty.style.display = "block";
    list.innerHTML = "";
    return;
  }

  empty.style.display = "none";
  list.innerHTML = requests.map(r => requestCardHTML(r)).join("");

  $$("#requestsList .card").forEach(card => {
    const id = card.dataset.id;
    $(".acceptBtn", card).addEventListener("click", () => acceptRequest(id));
    $(".declineBtn", card).addEventListener("click", () => declineRequest(id));
  });
}

/* ---------------------------------------------------------
   Render ORDERS (главный экран)
--------------------------------------------------------- */

function renderDateChips() {
  const dateStrip = $("#dateStrip");
  dateStrip.innerHTML = "";

  const base = new Date(currentDate);

  [-1, 0, 1].forEach(offset => {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);

    const iso = d.toISOString().slice(0, 10);

    const chip = document.createElement("button");
    chip.className = "chip" + (iso === currentDate ? " active" : "");
    chip.textContent = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });

    chip.addEventListener("click", () => {
      currentDate = iso;
      renderDateChips();
      renderDay();
    });

    dateStrip.appendChild(chip);
  });
}

function renderDay() {
  const list = $("#ordersList");
  const empty = $("#emptyDay");

  const arr = orders[currentDate] || [];

  if (!arr.length) {
    empty.style.display = "block";
    list.innerHTML = "";
    return;
  }

  empty.style.display = "none";

  list.innerHTML = arr.map(o => `
    <div class="card">
      <h4>${o.delivery_type}</h4>
      <div class="line">Дата: ${o.date}</div>
      <div class="line">Цена: ${o.total_price_rub}</div>
      <div class="line">Описание:<br>${o.notes || "-"}</div>
    </div>
  `).join("");
}

/* ---------------------------------------------------------
   Инициализация + Realtime
--------------------------------------------------------- */

async function init() {
  await loadRequests();
  await loadOrders();

  // Подписка на realtime
  supabase
    .channel("orders-changes")
    .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "client_orders" },
        payload => loadRequests()
    )
    .subscribe();

  showView("home");
}

init();

/* ---------------------------------------------------------
   Views (переход между страницами)
--------------------------------------------------------- */

const views = {
  home: $("#view-home"),
  requests: $("#view-requests"),
  settings: $("#view-settings"),
  profile: $("#view-profile"),
  calendar: $("#view-calendar"),
};

function showView(key) {
  Object.values(views).forEach(v => v.classList.remove("active"));
  views[key].classList.add("active");
}

/* ---------------------------------------------------------
   Toast
--------------------------------------------------------- */

let toastTimer = null;
function showToast(msg) {
  const t = $("#toast");
  t.querySelector("span").textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
}
