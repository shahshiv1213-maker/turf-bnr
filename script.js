const $ = (s) => document.querySelector(s);
let venues = [], slots = [], selectedDate = "", selected = null, searchText = "";
const localDate = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const formatTime = (value) => { const [h, m] = value.slice(0, 5).split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);

function buildDates() {
  const strip = $("#date-strip");
  for (let i = 0; i < 7; i++) {
    const iso = localDate(i), date = new Date(`${iso}T12:00:00`);
    const button = document.createElement("button");
    button.className = `date-button ${i === 0 ? "active" : ""}`;
    button.innerHTML = `<small>${i === 0 ? "Today" : date.toLocaleDateString(undefined, {weekday:"short"})}</small>${String(date.getDate()).padStart(2,"0")}`;
    button.onclick = () => { selectedDate = iso; document.querySelectorAll(".date-button").forEach(x => x.classList.remove("active")); button.classList.add("active"); renderVenues(); };
    strip.append(button); if (i === 0) selectedDate = iso;
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
  if (!filtered.length) { grid.innerHTML = '<div class="no-results">No futsal matched your search.</div>'; return; }
  grid.innerHTML = '<div class="no-results">Loading live availability…</div>';
  try {
    const results = await Promise.all(filtered.map(async venue => {
      const response = await fetch(`/api/bookings?venue_id=${encodeURIComponent(venue.id)}&date=${selectedDate}`), data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return [venue, new Set(data.map(item => item.start_time.slice(0, 5)))];
    }));
    grid.innerHTML = ""; results.forEach(([venue, busy]) => grid.append(renderCard(venue, busy)));
  } catch (error) { grid.innerHTML = ""; message.textContent = error.message || "Could not load availability."; }
}

function renderCard(venue, busy) {
  const card = document.createElement("article"); card.className = "venue-card";
  const facilities = (venue.facilities || []).join(" · ");
  card.innerHTML = `<div class="venue-top"><div class="venue-badges"><span class="badge">BIRATNAGAR LISTING</span><span class="phone-pill">☎ ${escapeHTML(venue.phone)}</span></div><h3>${escapeHTML(venue.name)}</h3><p>${escapeHTML(venue.area)} · ${escapeHTML(venue.address)}<br>${escapeHTML(facilities)}</p></div><div class="slot-list"></div>`;
  const list = card.querySelector(".slot-list");
  slots.forEach(slot => { const btn = document.createElement("button"), isBusy = busy.has(slot.start); btn.type = "button"; btn.className = "time-slot"; btn.disabled = isBusy; btn.textContent = formatTime(slot.start); if (!isBusy) btn.onclick = () => openDrawer(venue, slot, btn); list.append(btn); });
  return card;
}

function openDrawer(venue, slot, button) {
  document.querySelectorAll(".time-slot.selected").forEach(x => x.classList.remove("selected")); button.classList.add("selected"); selected = {venue, slot};
  $("#selected-title").textContent = venue.name;
  $("#selected-detail").textContent = `${selectedDate} · ${formatTime(slot.start)}–${formatTime(slot.end)} · ${venue.area}`;
  $("#selected-price").textContent = venue.price > 0 ? `Price: NPR ${venue.price} per hour` : "Price: Contact turf owner";
  $("#booking-message").textContent = ""; $("#booking-drawer").classList.add("open");
}
function closeDrawer() { $("#booking-drawer").classList.remove("open"); }
function renderMyBookings() { const target = $("#my-bookings"), records = JSON.parse(localStorage.getItem("turf-bnr-bookings") || "[]"); target.innerHTML = records.length ? records.map(item => `<article class="history-item"><b>${escapeHTML(item.venue_name)}</b><br><span class="muted">${escapeHTML(item.booking_date)} · ${formatTime(item.start_time)} · Ref: ${escapeHTML(item.booking_code)}</span></article>`).join("") : '<div class="no-results">No bookings from this browser yet.</div>'; }
function addMyBooking(booking) { const records = JSON.parse(localStorage.getItem("turf-bnr-bookings") || "[]"); records.unshift(booking); localStorage.setItem("turf-bnr-bookings", JSON.stringify(records.slice(0, 12))); renderMyBookings(); }

$("#booking-form").addEventListener("submit", async event => {
  event.preventDefault(); if (!selected) return;
  const response = await fetch("/api/bookings", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({venue_id:selected.venue.id, booking_date:selectedDate, start_time:selected.slot.start, full_name:$("#full-name").value, phone:$("#phone").value})});
  const data = await response.json(), message = $("#booking-message");
  if (!response.ok) { message.textContent = data.error || "Booking failed."; message.className = "error"; return; }
  message.className = ""; message.textContent = `Confirmed! Reference: ${data.booking.booking_code}`; addMyBooking(data.booking); event.target.reset(); setTimeout(() => { closeDrawer(); renderVenues(); }, 900);
});
$("#close-drawer").onclick = closeDrawer; $("#close-drawer-button").onclick = closeDrawer;
document.querySelectorAll(".nav-link").forEach(tab => tab.onclick = () => { document.querySelectorAll(".nav-link").forEach(x => x.classList.remove("active")); tab.classList.add("active"); ["find","mine","owner"].forEach(view => document.getElementById(`${view}-view`).hidden = view !== tab.dataset.view); if (tab.dataset.view === "mine") renderMyBookings(); });
$("#load-owner").onclick = async () => { const response = await fetch("/api/owner/bookings", {headers:{"X-Owner-Pin":$("#owner-pin").value}}), data = await response.json(); if (!response.ok) { alert(data.error || "Could not open dashboard."); return; } $("#owner-results").hidden = false; $("#owner-table").innerHTML = data.length ? data.map(row => `<tr><td>${escapeHTML(row.booking_code)}</td><td>${escapeHTML(row.full_name)}</td><td>${escapeHTML(row.phone)}</td><td>${escapeHTML(row.venue_name)}</td><td>${escapeHTML(row.booking_date)} ${formatTime(row.start_time)}</td><td>${escapeHTML(row.status)}</td></tr>`).join("") : '<tr><td colspan="6">No bookings yet.</td></tr>'; };
async function start() { try { const response = await fetch("/api/venues"), data = await response.json(); venues = data.venues; slots = data.slots; buildDates(); buildFilters(); renderVenues(); } catch { $("#load-message").textContent = "Start the Python server to load the booking website."; } }
start();
