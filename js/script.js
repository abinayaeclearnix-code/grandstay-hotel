(() => {
  "use strict";

  const XML_PATH = "data/hotel.xml";
  let hotelData = { rooms: [], details: {} };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    const page = document.body.dataset.page;

    if (["rooms", "tariff", "booking"].includes(page)) {
      loadHotelData().then(() => {
        if (page === "rooms") initRooms();
        if (page === "tariff") initTariff();
        if (page === "booking") initBooking();
        hideLoader();
      });
    }

    if (page === "customers") initCustomers();
    if (page === "home") initHome();
    setupScrollHeader();
    window.setTimeout(hideLoader, 900);
  });

  function setupNavigation() {
    const toggle = $(".menu-toggle");
    const nav = $(".nav-links");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
      nav.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (!link || link.origin !== window.location.origin) return;
        event.preventDefault();
        document.body.classList.add("page-leaving");
        window.setTimeout(() => { window.location.href = link.href; }, 220);
      });
    }
  }

  function setupScrollHeader() {
    const header = $(".site-header");
    if (!header) return;
    const update = () => header.classList.toggle("scrolled", window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function hideLoader() {
    $(".app-loader")?.classList.add("is-hidden");
  }

  function initHome() {
    const form = $(".hero-search");
    if (!form) return;
    const today = new Date();
    const isoToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const checkIn = form.querySelector("[name=checkIn]");
    const checkOut = form.querySelector("[name=checkOut]");
    if (checkIn) checkIn.min = isoToday;
    if (checkOut) checkOut.min = isoToday;
    checkIn?.addEventListener("change", () => { if (checkOut) checkOut.min = checkIn.value || isoToday; });
  }

  async function loadHotelData() {
    try {
      const response = await fetch(XML_PATH);
      if (!response.ok) throw new Error(`XML request failed: ${response.status}`);
      const xmlText = await response.text();
      const xml = new DOMParser().parseFromString(xmlText, "application/xml");

      if (xml.querySelector("parsererror")) throw new Error("The hotel XML could not be parsed.");

      const text = (parent, tag) => parent?.querySelector(`:scope > ${tag}`)?.textContent.trim() || "";
      const detailsNode = xml.querySelector("details");

      hotelData.details = {
        name: text(detailsNode, "name"),
        location: text(detailsNode, "location"),
        checkIn: text(detailsNode, "checkIn"),
        checkOut: text(detailsNode, "checkOut")
      };

      hotelData.rooms = [...xml.querySelectorAll("rooms > room")].map((node) => ({
        id: text(node, "id"),
        category: text(node, "category"),
        tariff: Number(text(node, "tariff")),
        capacity: Number(text(node, "capacity")),
        availability: text(node, "availability"),
        bed: text(node, "bed"),
        view: text(node, "view"),
        facilities: [...node.querySelectorAll("facilities > item")].map((item) => item.textContent.trim())
      }));

      if (!hotelData.rooms.length) throw new Error("No rooms were found in the XML data.");
    } catch (error) {
      console.error(error);
      showDataError(error.message);
    }
  }

  function showDataError(message) {
    $$(".loading").forEach((el) => {
      el.textContent = `Unable to load hotel data: ${message}`;
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  }

  function initRooms() {
    let visibleRooms = hotelData.rooms;
    const search = $("#room-search");
    const sort = $("#room-sort");
    const update = () => {
      const query = search?.value.trim().toLowerCase() || "";
      const filter = $("#room-filters .filter-btn.active")?.dataset.filter || "All";
      visibleRooms = hotelData.rooms.filter(room => {
        const matchesFilter = filter === "All" || room.category === filter;
        const haystack = `${room.category} ${room.bed} ${room.view} ${room.facilities.join(" ")}`.toLowerCase();
        return matchesFilter && haystack.includes(query);
      });
      if (sort?.value === "low") visibleRooms.sort((a, b) => a.tariff - b.tariff);
      if (sort?.value === "high") visibleRooms.sort((a, b) => b.tariff - a.tariff);
      if (sort?.value === "capacity") visibleRooms.sort((a, b) => b.capacity - a.capacity);
      renderRooms(visibleRooms);
    };
    update();
    search?.addEventListener("input", update);
    sort?.addEventListener("change", update);
    $$("#room-filters .filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        $$("#room-filters .filter-btn").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        update();
      });
    });
  }

  function renderRooms(rooms) {
    const grid = $("#rooms-grid");
    if (!grid) return;

    if (!rooms.length) {
      grid.innerHTML = '<div class="empty-state"><h3>No matching rooms</h3><p>Try another category.</p></div>';
      return;
    }

    grid.innerHTML = rooms.map(room => `
      <article class="room-card" data-category="${escapeHtml(room.category)}">
        <div class="room-visual" role="img" aria-label="${escapeHtml(room.category)} room interior"></div>
        <div class="room-top">
          <div><div class="room-id">${escapeHtml(room.id)}</div><h2>${escapeHtml(room.category)}</h2><p class="room-type">${escapeHtml(room.view)} · Signature collection</p></div>
          <div class="price">${formatCurrency(room.tariff)}<small> / night</small></div>
        </div>
        <div class="room-body">
          <div class="room-meta"><span>👤 ${room.capacity} Guests</span><span>🛏 ${escapeHtml(room.bed)}</span><span>⌂ ${escapeHtml(room.view)}</span></div>
          <div class="facilities">${room.facilities.map(f => `<span class="chip">${escapeHtml(f)}</span>`).join("")}</div>
          <div class="room-footer"><span class="availability">● ${escapeHtml(room.availability)}</span><div class="room-actions"><a class="text-link" href="booking.html?room=${encodeURIComponent(room.category)}">View Details</a><a class="btn btn-primary btn-small" href="booking.html?room=${encodeURIComponent(room.category)}">Book Now</a></div></div>
        </div>
      </article>
    `).join("");
  }

  function initTariff() {
    const body = $("#tariff-body");
    if (!body) return;

    body.innerHTML = hotelData.rooms.map(room => {
      const hasBreakfast = room.facilities.some(f => f.toLowerCase().includes("breakfast"));
      const hasWifi = room.facilities.some(f => f.toLowerCase().includes("wi-fi"));
      const hasService = room.facilities.some(f => f.toLowerCase().includes("room service"));
      return `<tr>
        <td class="room-name">${escapeHtml(room.category)}</td>
        <td>${room.capacity}</td>
        <td class="money">${formatCurrency(room.tariff)}</td>
        <td>${hasBreakfast ? "✓" : "—"}</td>
        <td>${hasWifi ? "✓" : "—"}</td>
        <td>${hasService ? "✓" : "—"}</td>
        <td><a class="btn btn-primary btn-small" href="booking.html?room=${encodeURIComponent(room.category)}">Book</a></td>
      </tr>`;
    }).join("");
  }

  function initBooking() {
    const roomSelect = $("#room-category");
    const form = $("#booking-form");
    const checkIn = $("#check-in");
    const checkOut = $("#check-out");
    const adults = $("#adults");
    const children = $("#children");
    const rooms = $("#rooms");
    const addons = $$("[data-addon]");

    const today = new Date();
    const isoToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    checkIn.min = isoToday;
    checkOut.min = isoToday;

    roomSelect.innerHTML += hotelData.rooms.map(room =>
      `<option value="${escapeHtml(room.category)}">${escapeHtml(room.category)} — ${formatCurrency(room.tariff)}/night</option>`
    ).join("");

    const requestedRoom = new URLSearchParams(window.location.search).get("room");
    if (requestedRoom && hotelData.rooms.some(r => r.category === requestedRoom)) roomSelect.value = requestedRoom;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkIn")) checkIn.value = params.get("checkIn");
    if (params.get("checkOut")) checkOut.value = params.get("checkOut");
    if (params.get("guests")) adults.value = Math.max(1, Number.parseInt(params.get("guests"), 10) || 1);

    roomSelect?.addEventListener("change", () => {
      const room = getSelectedRoom();
      adults.max = room ? room.capacity * Number(rooms.value || 1) : 12;
      if (room && Number(adults.value) > Number(adults.max)) adults.value = adults.max;
      calculateBooking();
    });
    adults?.addEventListener("input", calculateBooking);
    children?.addEventListener("input", calculateBooking);
    rooms?.addEventListener("input", () => {
      const room = getSelectedRoom();
      adults.max = room ? room.capacity * Number(rooms.value || 1) : 12;
      calculateBooking();
    });
    checkIn?.addEventListener("change", () => { checkOut.min = checkIn.value || isoToday; calculateBooking(); });
    checkOut?.addEventListener("change", calculateBooking);
    addons.forEach(addon => addon.addEventListener("change", calculateBooking));

    form.addEventListener("submit", handleBookingSubmit);
    calculateBooking();
  }

  function getSelectedRoom() {
    return hotelData.rooms.find(r => r.category === $("#room-category")?.value);
  }

  function calculateBooking() {
    const room = getSelectedRoom();
    const checkIn = $("#check-in")?.value;
    const checkOut = $("#check-out")?.value;
    const roomCount = Math.max(1, Number($("#rooms")?.value || 1));
    const costEl = $("#estimated-cost");
    const summaryEl = $("#stay-summary");

    if (!room || !checkIn || !checkOut) {
      if (costEl) costEl.textContent = "₹0";
      if (summaryEl) summaryEl.textContent = "Select room and dates to calculate.";
      return { valid: false };
    }

    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    const nights = Math.round((end - start) / 86400000);

    if (nights <= 0) {
      costEl.textContent = "₹0";
      summaryEl.textContent = "Check-out must be after check-in.";
      return { valid: false };
    }

    const roomTotal = nights * room.tariff * roomCount;
    const addonTotal = getSelectedAddons().reduce((sum, addon) => sum + (addon.perNight ? addon.price * nights * roomCount : addon.price), 0);
    const subtotal = roomTotal + addonTotal;
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + tax;
    costEl.textContent = formatCurrency(total);
    summaryEl.textContent = `${room.category} · ${roomCount} room${roomCount === 1 ? "" : "s"} · ${nights} night${nights === 1 ? "" : "s"} × ${formatCurrency(room.tariff)}`;
    const breakdown = { roomTotal, addonTotal, tax, total };
    const breakdownEl = $("#price-breakdown");
    if (breakdownEl) breakdownEl.innerHTML = `<p><span>Room stay</span><strong>${formatCurrency(roomTotal)}</strong></p><p><span>Enhancements</span><strong>${formatCurrency(addonTotal)}</strong></p><p><span>Taxes (12%)</span><strong>${formatCurrency(tax)}</strong></p><p class="total"><span>Total</span><strong>${formatCurrency(total)}</strong></p>`;
    return { valid: true, nights, total, room, roomCount, breakdown };
  }

  function getSelectedAddons() {
    return $$("[data-addon]:checked").map(input => ({
      name: input.dataset.addon,
      price: Number(input.dataset.price),
      perNight: input.dataset.addon === "breakfast"
    }));
  }

  function handleBookingSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = $("#form-message");
    const result = calculateBooking();
    const room = getSelectedRoom();
    const adults = Number($("#adults").value);
    const children = Number($("#children").value || 0);
    const rooms = Number($("#rooms").value);
    const guests = adults + children;
    const checkIn = $("#check-in").value;
    const checkOut = $("#check-out").value;

    if (!form.checkValidity()) {
      showFormMessage("Please complete all required fields with valid information.", "error");
      form.reportValidity();
      return;
    }

    if (!result.valid) {
      showFormMessage("Please select valid check-in and check-out dates.", "error");
      return;
    }

    if (!room) {
      showFormMessage("Please select a room category.", "error");
      return;
    }

    if (guests > room.capacity * rooms) {
      showFormMessage(`${room.category} allows a maximum of ${room.capacity * rooms} guests for ${rooms} room${rooms === 1 ? "" : "s"}.`, "error");
      return;
    }

    if (room.availability.toLowerCase() !== "available") {
      showFormMessage("This room is currently unavailable.", "error");
      return;
    }

    const booking = {
      id: `GST-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      customerName: $("#customer-name").value.trim(),
      email: $("#email").value.trim(),
      phone: $("#phone").value.trim(),
      room: room.category,
      checkIn,
      checkOut,
      nights: result.nights,
      amount: result.total,
      breakdown: result.breakdown,
      addons: getSelectedAddons(),
      guests,
      adults,
      children,
      rooms,
      request: $("#request").value.trim(),
      status: "Confirmed",
      createdAt: new Date().toISOString()
    };

    const bookings = JSON.parse(localStorage.getItem("grandstayBookings") || localStorage.getItem("amairaBookings") || "[]");
    bookings.unshift(booking);
    localStorage.setItem("grandstayBookings", JSON.stringify(bookings));

    showFormMessage(`Reservation ${booking.id} confirmed for ${booking.customerName}. Estimated cost: ${formatCurrency(booking.amount)}.`, "success");
    showConfirmation(booking);
    form.reset();
    $("#estimated-cost").textContent = "₹0";
    $("#stay-summary").textContent = "Booking saved. You can view it on the Reservations page.";
  }

  function showConfirmation(booking) {
    const confirmation = $("#confirmation");
    if (!confirmation) return;
    $("#confirmation-name").textContent = booking.customerName;
    $("#confirmation-id").textContent = booking.id;
    $("#confirmation-room").textContent = booking.room;
    $("#confirmation-stay").textContent = `${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}`;
    $("#confirmation-total").textContent = formatCurrency(booking.amount);
    $("#download-confirmation")?.addEventListener("click", () => downloadConfirmation(booking), { once: true });
    $("#print-confirmation")?.addEventListener("click", () => window.print());
    confirmation.hidden = false;
    confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function downloadConfirmation(booking) {
    const content = [
      "GRANDSTAY HOTEL", "Where Luxury Feels Like Home", "", "RESERVATION CONFIRMED",
      `Reservation ID: ${booking.id}`, `Guest: ${booking.customerName}`, `Room: ${booking.room}`,
      `Stay: ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}`, `Guests: ${booking.guests}`,
      `Total: ${formatCurrency(booking.amount)}`
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${booking.id}-grandstay-confirmation.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function showFormMessage(text, type) {
    const el = $("#form-message");
    if (!el) return;
    el.textContent = text;
    el.className = `form-message ${type}`;
  }

  function initCustomers() {
    const search = $("#booking-search");
    renderBookings();

    search?.addEventListener("input", () => renderBookings(search.value.trim().toLowerCase()));
  }

  function renderBookings(query = "") {
    const body = $("#bookings-body");
    const count = $("#booking-count");
    const empty = $("#empty-bookings");
    if (!body) return;

    const bookings = JSON.parse(localStorage.getItem("grandstayBookings") || localStorage.getItem("amairaBookings") || "[]");
    const filtered = bookings.filter(b => {
      const haystack = `${b.id} ${b.customerName} ${b.room}`.toLowerCase();
      return haystack.includes(query);
    });

    if (count) count.textContent = `${filtered.length} booking${filtered.length === 1 ? "" : "s"}`;
    body.innerHTML = filtered.map(b => `<tr>
      <td><strong>${escapeHtml(b.id)}</strong></td>
      <td>${escapeHtml(b.customerName)}</td>
      <td>${escapeHtml(b.room)}</td>
      <td>${formatDate(b.checkIn)}</td>
      <td>${formatDate(b.checkOut)}</td>
      <td>${b.guests || 1}</td>
      <td class="money">${formatCurrency(b.amount)}</td>
      <td><span class="status">${escapeHtml(b.status)}</span></td>
    </tr>`).join("");

    if (empty) empty.hidden = filtered.length > 0;
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }
})();
