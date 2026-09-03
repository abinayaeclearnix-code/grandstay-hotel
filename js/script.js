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
      });
    }

    if (page === "customers") initCustomers();
  });

  function setupNavigation() {
    const toggle = $(".menu-toggle");
    const nav = $(".nav-links");
    if (toggle && nav) {
      toggle.addEventListener("click", () => nav.classList.toggle("open"));
    }
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
    renderRooms(hotelData.rooms);
    $$("#room-filters .filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        $$("#room-filters .filter-btn").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        const filter = button.dataset.filter;
        renderRooms(filter === "All" ? hotelData.rooms : hotelData.rooms.filter(r => r.category === filter));
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
        <div class="room-top">
          <div><div class="room-id">${escapeHtml(room.id)}</div><h2>${escapeHtml(room.category)}</h2></div>
          <div class="price">${formatCurrency(room.tariff)}<small> / night</small></div>
        </div>
        <div class="room-body">
          <div class="room-meta"><span>👤 ${room.capacity} Guests</span><span>🛏 ${escapeHtml(room.bed)}</span><span>⌂ ${escapeHtml(room.view)}</span></div>
          <div class="facilities">${room.facilities.map(f => `<span class="chip">${escapeHtml(f)}</span>`).join("")}</div>
          <div class="room-footer"><span class="availability">● ${escapeHtml(room.availability)}</span><a class="btn btn-primary btn-small" href="booking.html?room=${encodeURIComponent(room.category)}">Book Now</a></div>
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
    const guests = $("#guests");

    const today = new Date();
    const isoToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    checkIn.min = isoToday;
    checkOut.min = isoToday;

    roomSelect.innerHTML += hotelData.rooms.map(room =>
      `<option value="${escapeHtml(room.category)}">${escapeHtml(room.category)} — ${formatCurrency(room.tariff)}/night</option>`
    ).join("");

    const requestedRoom = new URLSearchParams(window.location.search).get("room");
    if (requestedRoom && hotelData.rooms.some(r => r.category === requestedRoom)) roomSelect.value = requestedRoom;

    roomSelect.addEventListener("change", () => {
      const room = getSelectedRoom();
      guests.max = room ? room.capacity : 4;
      if (room && Number(guests.value) > room.capacity) guests.value = room.capacity;
      calculateBooking();
    });
    checkIn.addEventListener("change", () => { checkOut.min = checkIn.value || isoToday; calculateBooking(); });
    checkOut.addEventListener("change", calculateBooking);
    guests.addEventListener("input", calculateBooking);

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

    const total = nights * room.tariff;
    costEl.textContent = formatCurrency(total);
    summaryEl.textContent = `${room.category} · ${nights} night${nights === 1 ? "" : "s"} × ${formatCurrency(room.tariff)}`;
    return { valid: true, nights, total, room };
  }

  function handleBookingSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = $("#form-message");
    const result = calculateBooking();
    const room = getSelectedRoom();
    const guests = Number($("#guests").value);
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

    if (guests > room.capacity) {
      showFormMessage(`The ${room.category} allows a maximum of ${room.capacity} guests.`, "error");
      return;
    }

    if (room.availability.toLowerCase() !== "available") {
      showFormMessage("This room is currently unavailable.", "error");
      return;
    }

    const booking = {
      id: `GS-${Date.now().toString().slice(-6)}`,
      customerName: $("#customer-name").value.trim(),
      email: $("#email").value.trim(),
      phone: $("#phone").value.trim(),
      room: room.category,
      checkIn,
      checkOut,
      nights: result.nights,
      amount: result.total,
      guests,
      request: $("#request").value.trim(),
      status: "Confirmed",
      createdAt: new Date().toISOString()
    };

    const bookings = JSON.parse(localStorage.getItem("grandstayBookings") || "[]");
    bookings.unshift(booking);
    localStorage.setItem("grandstayBookings", JSON.stringify(bookings));

    showFormMessage(`Booking ${booking.id} confirmed for ${booking.customerName}. Estimated cost: ${formatCurrency(booking.amount)}.`, "success");
    form.reset();
    $("#estimated-cost").textContent = "₹0";
    $("#stay-summary").textContent = "Booking saved. You can view it on the Customers page.";
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

    const bookings = JSON.parse(localStorage.getItem("grandstayBookings") || "[]");
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
      <td>${b.nights}</td>
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
