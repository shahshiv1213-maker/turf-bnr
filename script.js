const $ = (s) => document.querySelector(s);
let venues = [], slots = [], selectedDate = "", selected = null, searchText = "";

/* ================= Language: English / नेपाली ================= */
const TEXT = {
  en: {
    nav_find: "Find a turf", nav_mine: "My bookings", nav_owner: "Owner dashboard",
    hero_eyebrow: "BIRATNAGAR FUTSAL BOOKING",
    hero_title: "Find your game.<br><em>Own the night.</em>",
    hero_sub: "Live hourly availability for Biratnagar’s futsal community.",
    area: "AREA", search: "SEARCH", area_all: "All Biratnagar", search_ph: "Name, area or facility", show_slots: "Show slots",
    open_note: "OPEN ALL SEVEN DAYS · NEPAL TIME", choose: "Choose your one-hour slot",
    available: "Available", selected: "Selected", booked: "Booked",
    mine_eyebrow: "YOUR DEVICE", mine_title: "My recent bookings",
    mine_note: "Bookings confirmed from this browser appear below. The owner dashboard shows the official complete list.",
    owner_eyebrow: "TURF OWNER ACCESS", owner_title: "See every booked slot",
    owner_note: "Use the private owner PIN. This is part of the same website—there is no separate owner domain.",
    pin_ph: "Enter owner PIN", open_dash: "Open dashboard",
    th_code: "Code", th_player: "Player", th_phone: "Phone", th_futsal: "Futsal", th_when: "Date & time", th_status: "Status",
    reserve: "RESERVE YOUR SLOT", your_name: "Your name", phone_label: "Phone number", confirm: "Confirm booking",
    footer_tag: "Biratnagar futsal, made easier.", footer_hours: "7 AM — 10 PM · All 7 days",
    lang_btn: "नेपाली",
    today: "Today", no_match: "No futsal matched your search.", loading: "Loading live availability…",
    load_fail: "Could not load availability.", listing: "BIRATNAGAR LISTING",
    price_contact: "Price: Contact turf owner", price_hr: "Price: NPR {n} per hour",
    booking_failed: "Booking failed.", confirmed: "Confirmed! Reference:", saving: "Saving your booking…",
    net_error: "Could not reach the server. Please try again in a moment.",
    no_owner: "No bookings yet.", no_mine: "No bookings from this browser yet.", ref: "Ref",
    owner_fail: "Could not open dashboard.", start_fail: "Could not load the booking website. Please refresh.",
    st_confirmed: "confirmed", st_held: "held", st_cancelled: "cancelled"
  },
  ne: {
    nav_find: "टर्फ खोज्नुहोस्", nav_mine: "मेरा बुकिङहरू", nav_owner: "मालिक ड्यासबोर्ड",
    hero_eyebrow: "बिराटनगर फुटसल बुकिङ",
    hero_title: "आफ्नो खेल खोज्नुहोस्।<br><em>रात तपाईंकै हुन्छ।</em>",
    hero_sub: "बिराटनगरका फुटसल खेलाडीहरूका लागि घण्टाअनुसारको लाइभ उपलब्धता।",
    area: "क्षेत्र", search: "खोजी", area_all: "सम्पूर्ण बिराटनगर", search_ph: "नाम, क्षेत्र वा सुविधा", show_slots: "समय हेर्नुहोस्",
    open_note: "हप्ताका सातै दिन खुला · नेपाली समय", choose: "आफ्नो एक घण्टाको समय छान्नुहोस्",
    available: "उपलब्ध", selected: "छानिएको", booked: "बुक भइसकेको",
    mine_eyebrow: "तपाईंको डिभाइस", mine_title: "मेरा हालैका बुकिङहरू",
    mine_note: "यो ब्राउजरबाट पक्का गरिएका बुकिङहरू तल देखिन्छन्। पूर्ण आधिकारिक सूची मालिक ड्यासबोर्डमा हुन्छ।",
    owner_eyebrow: "टर्फ मालिक पहुँच", owner_title: "सबै बुक भएका समय हेर्नुहोस्",
    owner_note: "मालिकको निजी पिन प्रयोग गर्नुहोस्। यो उही वेबसाइटकै भाग हो—छुट्टै मालिक डोमेन छैन।",
    pin_ph: "मालिकको पिन हाल्नुहोस्", open_dash: "ड्यासबोर्ड खोल्नुहोस्",
    th_code: "कोड", th_player: "खेलाडी", th_phone: "फोन", th_futsal: "फुटसल", th_when: "मिति र समय", th_status: "स्थिति",
    reserve: "आफ्नो समय बुक गर्नुहोस्", your_name: "तपाईंको नाम", phone_label: "फोन नम्बर", confirm: "बुकिङ पक्का गर्नुहोस्",
    footer_tag: "बिराटनगरमा फुटसल बुकिङ, अझ सजिलो।", footer_hours: "बिहान ७ — राति १० · सातै दिन",
    lang_btn: "English",
    today: "आज", no_match: "तपाईंको खोजीसँग मिल्ने फुटसल भेटिएन।", loading: "लाइभ उपलब्धता लोड हुँदैछ…",
    load_fail: "उपलब्धता लोड गर्न सकिएन।", listing: "बिराटनगर सूची",
    price_contact: "मूल्य: टर्फ मालिकसँग सम्पर्क गर्नुहोस्", price_hr: "मूल्य: प्रति घण्टा रु {n}",
    booking_failed: "बुकिङ असफल भयो।", confirmed: "पक्का भयो! सन्दर्भ नम्बर:", saving: "तपाईंको बुकिङ सुरक्षित गर्दै…",
    net_error: "सर्भरसँग सम्पर्क हुन सकेन। केही बेरपछि फेरि प्रयास गर्नुहोस्।",
    no_owner: "अहिलेसम्म कुनै बुकिङ छैन।", no_mine: "यो ब्राउजरबाट अहिलेसम्म कुनै बुकिङ छैन।", ref: "सन्दर्भ",
    owner_fail: "ड्यासबोर्ड खोल्न सकिएन।", start_fail: "बुकिङ वेबसाइट लोड गर्न सकिएन। कृपया पेज रिफ्रेस गर्नुहोस्।",
    st_confirmed: "पक्का भएको", st_held: "रोकिएको", st_cancelled: "रद्द गरिएको"
  }
};
// Messages and facility names that come from the Python server (English) -> Nepali
const SERVER_NE = {
  "Choose a valid futsal.": "कृपया मान्य फुटसल छान्नुहोस्।",
  "Please complete the booking form.": "कृपया बुकिङ फारम पूरा गर्नुहोस्।",
  "Enter a valid phone number.": "मान्य फोन नम्बर हाल्नुहोस्।",
  "Choose a valid booking date.": "मान्य मिति छान्नुहोस्।",
  "Bookings cannot be made for a past date.": "बितेको मितिको लागि बुकिङ गर्न मिल्दैन।",
  "That slot was just booked. Please choose another time.": "यो समय भर्खरै बुक भयो। कृपया अर्को समय छान्नुहोस्।",
  "Booking could not be saved. Please try again.": "बुकिङ सुरक्षित गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।",
  "Owner PIN required.": "मालिकको पिन आवश्यक छ।",
  "Could not load owner bookings.": "मालिकका बुकिङहरू लोड गर्न सकिएन।",
  "Could not load bookings.": "बुकिङहरू लोड गर्न सकिएन।",
  "Database is not configured. Add Supabase environment variables.": "डाटाबेस जडान भएको छैन। Supabase environment variables थप्नुहोस्।",
  "Hourly slots": "घण्टाअनुसार समय", "Open daily": "दैनिक खुला", "5-a-side": "५ जनाको खेल", "Local tournaments": "स्थानीय प्रतियोगिता"
};

let lang = "en";
try { lang = localStorage.getItem("turf-bnr-lang") === "ne" ? "ne" : "en"; } catch (e) {}
const t = (key) => (TEXT[lang] && TEXT[lang][key]) || TEXT.en[key] || key;
const serverMsg = (msg) => (lang === "ne" && SERVER_NE[msg]) || msg;

function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const text = t(el.dataset.i18n);
    const textNode = [...el.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
    if (!el.children.length) el.textContent = text;
    else if (textNode) textNode.nodeValue = ` ${text} `; // keeps the arrow / dot icons next to the text
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  $(".language").textContent = t("lang_btn");
  if (venues.length) { buildDates(); renderVenues(); }
  if (selected) showSelectedDetails();
  renderMyBookings();
}
function toggleLanguage() {
  lang = lang === "ne" ? "en" : "ne";
  try { localStorage.setItem("turf-bnr-lang", lang); } catch (e) {}
  applyLanguage();
}

/* ================= Booking website ================= */
const localDate = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const formatTime = (value) => { const [h, m] = value.slice(0, 5).split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);

function buildDates() {
  const strip = $("#date-strip"); strip.innerHTML = "";
  if (!selectedDate) selectedDate = localDate(0);
  for (let i = 0; i < 7; i++) {
    const iso = localDate(i), date = new Date(`${iso}T12:00:00`);
    const button = document.createElement("button");
    button.className = `date-button ${iso === selectedDate ? "active" : ""}`;
    button.innerHTML = `<small>${i === 0 ? t("today") : date.toLocaleDateString(lang === "ne" ? "ne-NP" : undefined, {weekday:"short"})}</small>${String(date.getDate()).padStart(2,"0")}`;
    button.onclick = () => { selectedDate = iso; document.querySelectorAll(".date-button").forEach(x => x.classList.remove("active")); button.classList.add("active"); renderVenues(); };
    strip.append(button);
  }
}

function buildFilters() {
  [...new Set(venues.map(v => v.area))].forEach(area => $("#area-filter").add(new Option(area, area)));
  $("#area-filter").onchange = renderVenues;
  $("#search").oninput = event => { searchText = event.target.value.toLowerCase(); renderVenues(); };
  $("#show-slots").onclick = () => { renderVenues(); $("#find-view").scrollIntoView({behavior:"smooth"}); };
}

async function renderVenues() {
  const grid = $("#venue-grid"), message = $("#load-message"), area = $("#area-filter").value;
  message.textContent = "";
  const filtered = venues.filter(v => !area || v.area === area).filter(v => `${v.name} ${v.area} ${v.address} ${(v.facilities || []).join(" ")}`.toLowerCase().includes(searchText));
  if (!filtered.length) { grid.innerHTML = `<div class="no-results">${t("no_match")}</div>`; return; }
  grid.innerHTML = `<div class="no-results">${t("loading")}</div>`;
  try {
    // ONE request for all futsals (was one per futsal), so the server and database are asked only once.
    const response = await fetch(`/api/bookings?date=${selectedDate}`);
    let data; try { data = await response.json(); } catch (e) { throw new Error(t("load_fail")); }
    if (!response.ok) throw new Error(serverMsg(data.error) || t("load_fail"));
    if (!Array.isArray(data)) throw new Error(t("load_fail"));
    const results = filtered.map(venue => [venue, new Set(data.filter(item => item.venue_id === venue.id).map(item => item.start_time.slice(0, 5)))]);
    grid.innerHTML = ""; results.forEach(([venue, busy]) => grid.append(renderCard(venue, busy)));
  } catch (error) { grid.innerHTML = ""; message.textContent = error.message || t("load_fail"); }
}

function renderCard(venue, busy) {
  const card = document.createElement("article"); card.className = "venue-card";
  const facilities = (venue.facilities || []).map(serverMsg).join(" · ");
  card.innerHTML = `<div class="venue-top"><div class="venue-badges"><span class="badge">${t("listing")}</span><span class="phone-pill">☎ ${escapeHTML(venue.phone)}</span></div><h3>${escapeHTML(venue.name)}</h3><p>${escapeHTML(venue.area)} · ${escapeHTML(venue.address)}<br>${escapeHTML(facilities)}</p></div><div class="slot-list"></div>`;
  const list = card.querySelector(".slot-list");
  slots.forEach(slot => { const btn = document.createElement("button"), isBusy = busy.has(slot.start); btn.type = "button"; btn.className = "time-slot"; btn.disabled = isBusy; btn.textContent = formatTime(slot.start); if (!isBusy) btn.onclick = () => openDrawer(venue, slot, btn); list.append(btn); });
  return card;
}

function showSelectedDetails() {
  const {venue, slot} = selected;
  $("#selected-title").textContent = venue.name;
  $("#selected-detail").textContent = `${selectedDate} · ${formatTime(slot.start)}–${formatTime(slot.end)} · ${venue.area}`;
  $("#selected-price").textContent = venue.price > 0 ? t("price_hr").replace("{n}", venue.price) : t("price_contact");
}
function openDrawer(venue, slot, button) {
  document.querySelectorAll(".time-slot.selected").forEach(x => x.classList.remove("selected")); button.classList.add("selected"); selected = {venue, slot};
  showSelectedDetails();
  $("#booking-message").textContent = ""; $("#booking-drawer").classList.add("open");
}
function closeDrawer() { $("#booking-drawer").classList.remove("open"); }
function renderMyBookings() { const target = $("#my-bookings"); let records = []; try { records = JSON.parse(localStorage.getItem("turf-bnr-bookings") || "[]"); } catch (e) {} target.innerHTML = records.length ? records.map(item => `<article class="history-item"><b>${escapeHTML(item.venue_name)}</b><br><span class="muted">${escapeHTML(item.booking_date)} · ${formatTime(item.start_time)} · ${t("ref")}: ${escapeHTML(item.booking_code)}</span></article>`).join("") : `<div class="no-results">${t("no_mine")}</div>`; }
function addMyBooking(booking) { let records = []; try { records = JSON.parse(localStorage.getItem("turf-bnr-bookings") || "[]"); records.unshift(booking); localStorage.setItem("turf-bnr-bookings", JSON.stringify(records.slice(0, 12))); } catch (e) {} renderMyBookings(); }

$("#booking-form").addEventListener("submit", async event => {
  event.preventDefault(); if (!selected) return;
  const form = event.target, button = form.querySelector(".confirm"), message = $("#booking-message");
  button.disabled = true; message.className = ""; message.textContent = t("saving");
  try {
    const response = await fetch("/api/bookings", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({venue_id:selected.venue.id, booking_date:selectedDate, start_time:selected.slot.start, full_name:$("#full-name").value, phone:$("#phone").value})});
    let data = {}; try { data = await response.json(); } catch (e) {}
    // Only show "Confirmed" when the server says the database really saved it.
    if (!response.ok || !data.booking) { message.textContent = serverMsg(data.error) || t("booking_failed"); message.className = "error"; return; }
    message.className = ""; message.textContent = `${t("confirmed")} ${data.booking.booking_code}`; addMyBooking(data.booking); form.reset(); setTimeout(() => { closeDrawer(); renderVenues(); }, 900);
  } catch (error) { message.textContent = t("net_error"); message.className = "error"; }
  finally { button.disabled = false; }
});
$("#close-drawer").onclick = closeDrawer; $("#close-drawer-button").onclick = closeDrawer;
$(".language").addEventListener("click", toggleLanguage);
document.querySelectorAll(".nav-link").forEach(tab => tab.onclick = () => { document.querySelectorAll(".nav-link").forEach(x => x.classList.remove("active")); tab.classList.add("active"); ["find","mine","owner"].forEach(view => document.getElementById(`${view}-view`).hidden = view !== tab.dataset.view); if (tab.dataset.view === "mine") renderMyBookings(); });
$("#load-owner").onclick = async () => {
  try {
    const response = await fetch("/api/owner/bookings", {headers:{"X-Owner-Pin":$("#owner-pin").value}});
    let data; try { data = await response.json(); } catch (e) { data = {}; }
    if (!response.ok) { alert(serverMsg(data.error) || t("owner_fail")); return; }
    $("#owner-results").hidden = false;
    $("#owner-table").innerHTML = data.length ? data.map(row => `<tr><td>${escapeHTML(row.booking_code)}</td><td>${escapeHTML(row.full_name)}</td><td>${escapeHTML(row.phone)}</td><td>${escapeHTML(row.venue_name)}</td><td>${escapeHTML(row.booking_date)} ${formatTime(row.start_time)}</td><td>${escapeHTML(t("st_" + row.status))}</td></tr>`).join("") : `<tr><td colspan="6">${t("no_owner")}</td></tr>`;
  } catch (error) { alert(t("net_error")); }
};
async function start() { try { const response = await fetch("/api/venues"), data = await response.json(); venues = data.venues; slots = data.slots; buildDates(); buildFilters(); renderVenues(); } catch (e) { $("#load-message").textContent = t("start_fail"); } }
applyLanguage();
start();
