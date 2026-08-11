// ============================================
// AVAILABILITY + BOOKING / PRICE ESTIMATOR WIDGET
// Single calendar: shows the same available/unavailable/today visual cues
// the old view-only calendar used, AND doubles as the check-in / check-out
// picker. Selecting a range that contains a blacked-out date is blocked.
// ============================================
const PRICING_CONFIG = {

    rooms: {

        standard: {
            id: "standard",
            name: "Appartamento Ulivo",
            description: "Bilocale",
            maxGuests: 4
        },

        premium: {
            id: "premium",
            name: "Appartamento Saline",
            description: "Trilocale",
            maxGuests: 5
        }

    }

};

function isHighSeason(checkin, checkout) {

    const current = new Date(checkin);

    while (current < checkout) {

        const month = current.getMonth() + 1;

        if (month === 6 || month === 7 || month === 8) {
            return true;
        }

        current.setDate(current.getDate() + 1);
    }

    return false;
}
/**
 * Core price calculation. Returns a breakdown object.
 */
function calculateEstimate({
    checkin,
    checkout,
    roomId,
    adults,
    children
}) {

    const nights =
        Math.round((checkout - checkin) / (1000 * 60 * 60 * 24));
    if (nights <= 0 || adults < 1)
        return null;

    const room = PRICING_CONFIG.rooms[roomId];
    if (!room)
        return null;

    const totalGuests = adults + children;
    const extraGuests = Math.max(0, totalGuests - 2);
    const highSeason = isHighSeason(checkin, checkout);

    let dailyPrice = 0;
    let total = 0;
    let discount = "";
    let surcharge = "";
    let childPricePerGuest = 0;
    let childrenTotal = 0;

    // ======================================
    // BILOCALE - Appartamento Ulivo
    // ======================================
    if (roomId === "standard") {
      // In alta stagione minimo 3 notti
      if (highSeason && nights < 3) {
        return {
          unavailable: true,
          unavailableMessage: "Minimo 3 notti in alta stagione per il bilocale."
        };
      }

      const seasonMultiplier = highSeason ? 1.25 : 1.0;

      // Pacchetto 6 notti (totale fisso) + costo aggiuntivo per ogni letto extra (totale)
      if (nights >= 6) {
        total = 650 + extraGuests * 350;
        // applica incremento stagionale sul totale pacchetto
        total = total * seasonMultiplier;
        discount = "Pacchetto 6 notti";
        childPricePerGuest = extraGuests > 0 ? 350 / nights : 0;
        childrenTotal = childPricePerGuest * children * nights;
      } else {
        // calcolo giornaliero (110 base + 60 per letto extra)
        const nightlyBase = 110 + extraGuests * 60;
        const nightly = nightlyBase * seasonMultiplier;
        total = nightly * nights;
        childPricePerGuest = extraGuests > 0 ? 60 * seasonMultiplier : 0;
        childrenTotal = childPricePerGuest * children * nights;
      }

      dailyPrice = total / nights;
    }

    // ======================================
    // TRILOCALE - Appartamento Saline
    // ======================================
    else {
      // In alta stagione minimo 3 notti
      if (highSeason && nights < 3) {
        return {
          unavailable: true,
          unavailableMessage: "Minimo 3 notti in alta stagione per il trilocale."
        };
      }

      const seasonMultiplier = highSeason ? 1.10 : 1.0;

      // Il trilocale non è prenotabile in alta stagione per massimo due ospiti
      if (highSeason && totalGuests <= 2) {
        return {
          unavailable: true,
          unavailableMessage: "Il trilocale non è disponibile per massimo due ospiti in alta stagione."
        };
      }

      // Pacchetto 6 notti (totale fisso) per fasce ospiti
      if (nights >= 6) {
        if (totalGuests <= 2) {
          total = 650;
        } else {
          total = 1200 + (totalGuests === 5 ? 30 * nights : 0);
        }
        // applica incremento stagionale sul totale pacchetto
        total = total * seasonMultiplier;
        discount = "Pacchetto 6 notti";
      } else {
        // calcolo giornaliero: 119 per la fascia fino a 2 ospiti, 229 per fasce superiori
        const nightlyBase = totalGuests <= 2 ? 119 : 229;
        const nightly = nightlyBase * seasonMultiplier;
        total = nightly * nights;

        // supplemento quinta persona
        if (totalGuests === 5) {
          total += 30 * nights;
          surcharge = "+30 €/nt quinta persona";
        }
      }

      dailyPrice = total / nights;
      childPricePerGuest = 0;
      childrenTotal = 0;
    }

    return {
        room,
        nights,
        dailyPrice,
        total,
        discount,
        surcharge,
        totalGuests,
        childPricePerGuest,
        childrenTotal
    };
}

function formatEUR(amount) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * ============================================================================
 * AVAILABILITY + BOOKING WIDGET
 * ============================================================================
 */
class BookingEstimator {
  constructor() {
    this.currentMonth = new Date();
    this.currentMonth.setDate(1);
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);

    this.apiUrl = typeof CALENDAR_CONFIG !== 'undefined' ? CALENDAR_CONFIG.API_URL : 'http://localhost:8787';
    this.unavailableDates = new Set();
    this.busySlots = [];

    this.checkin = null;
    this.checkout = null;
    this.selectedRoom = 'standard';

    this.els = {
      month1Label: document.getElementById('booking-month1-label'),
      month2Label: document.getElementById('booking-month2-label'),
      body1: document.getElementById('booking-calendar-body-1'),
      body2: document.getElementById('booking-calendar-body-2'),
      prevBtn: document.getElementById('booking-prev-month'),
      nextBtn: document.getElementById('booking-next-month'),
      checkinDisplay: document.getElementById('checkin-display'),
      checkoutDisplay: document.getElementById('checkout-display'),
      resetDatesBtn: document.getElementById('reset-dates'),
      roomOptions: document.getElementById('room-options'),
      adultsInput: document.getElementById('adults-count'),
      childrenInput: document.getElementById('children-count'),
      guestWarning: document.getElementById('guest-warning'),
      dateWarning: document.getElementById('date-warning'),
      summaryContent: document.getElementById('summary-content'),
      summaryTotal: document.getElementById('summary-total'),
      totalPrice: document.getElementById('total-price'),
      requestBtn: document.getElementById('request-booking-btn'),
    };
    this.requestButtons = Array.from(document.querySelectorAll('#request-booking-btn, #request-booking-top'));

    if (!this.els.body1) {
      // Booking widget markup not present on this page — nothing to do.
      return;
    }

    this.init();
  }

  async init() {
    await this.loadAvailabilityData();
    this.renderCalendars();
    this.bindEvents();
    this.updateSummary();
  }

  /**
   * Same data source / fallback chain as the old view-only calendar:
   * live API -> static data/availability.json -> hardcoded dates.
   */
  async loadAvailabilityData() {
    try {
      const startDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
      const endDate = new Date(this.today.getFullYear(), this.today.getMonth() + 12, 0);

      const response = await fetch(
        `${this.apiUrl}/api/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.unavailableDates)) {
          this.unavailableDates = new Set(data.unavailableDates);
          this.busySlots = data.busySlots || [];
          return;
        }
      }
      throw new Error('API unavailable');
    } catch (err) {
      console.warn('Booking widget: falling back to static availability.json', err);
      try {
        const res = await fetch('data/availability.json');
        const data = await res.json();
        this.unavailableDates = new Set(data.unavailableDates || []);
      } catch (fallbackErr) {
        console.error('Booking widget: could not load availability data, using hardcoded fallback', fallbackErr);
        this.unavailableDates = new Set([
          '2025-12-01', '2025-12-02', '2025-12-12', '2025-12-13',
          '2025-12-24', '2025-12-25', '2025-12-26',
        ]);
      }
    }
  }

  bindEvents() {
    this.els.prevBtn.addEventListener('click', () => this.changeMonth(-1));
    this.els.nextBtn.addEventListener('click', () => this.changeMonth(1));
    this.els.resetDatesBtn.addEventListener('click', () => this.resetDates());

    this.els.roomOptions.querySelectorAll('input[name="room"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        this.selectedRoom = e.target.value;
        this.clampGuestsToRoom();
        this.updateSummary();
      });
    });

    document.querySelectorAll('.stepper-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const step = parseInt(btn.getAttribute('data-step'), 10);
        const input = document.getElementById(targetId);
        if (!input) return;

        const min = parseInt(input.min, 10) || 0;
        const max = parseInt(input.max, 10) || 99;
        const next = Math.min(max, Math.max(min, parseInt(input.value, 10) + step));
        input.value = next;

        this.clampGuestsToRoom(targetId);
        this.updateSummary();
      });
    });

    this.requestButtons.forEach((button) => {
      button.addEventListener('click', (event) => this.handleRequestBooking(event));
    });
  }

  clampGuestsToRoom() {
    const room = PRICING_CONFIG.rooms[this.selectedRoom];
    let adults = parseInt(this.els.adultsInput.value, 10);
    let children = parseInt(this.els.childrenInput.value, 10);

    this.els.adultsInput.max = room.maxGuests;

    if (adults + children > room.maxGuests) {
      // Trim children first, then adults, to fit the apartment's capacity.
      const overflow = adults + children - room.maxGuests;
      const trimFromChildren = Math.min(overflow, children);
      children -= trimFromChildren;
      const remainingOverflow = overflow - trimFromChildren;
      if (remainingOverflow > 0) {
        adults = Math.max(1, adults - remainingOverflow);
      }
      this.els.adultsInput.value = adults;
      this.els.childrenInput.value = children;
    }

    if (adults + children >= room.maxGuests) {
      this.els.guestWarning.textContent = `Capienza massima raggiunta per ${room.name} (${room.maxGuests} ospiti).`;
    } else {
      this.els.guestWarning.textContent = '';
    }
  }

  resetDates() {
    this.checkin = null;
    this.checkout = null;
    this.clearDateWarning();
    this.renderCalendars();
    this.updateSummary();
  }

  changeMonth(direction) {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
    this.renderCalendars();
  }

  renderCalendars() {
    const month1 = new Date(this.currentMonth);
    const month2 = new Date(this.currentMonth);
    month2.setMonth(month2.getMonth() + 1);

    this.els.month1Label.textContent = this.formatMonthYear(month1);
    this.els.month2Label.textContent = this.formatMonthYear(month2);

    this.renderMonth(month1, this.els.body1);
    this.renderMonth(month2, this.els.body2);

    this.els.prevBtn.disabled =
      this.currentMonth.getMonth() === this.today.getMonth() &&
      this.currentMonth.getFullYear() === this.today.getFullYear();

    this.els.checkinDisplay.textContent = this.checkin ? this.formatDisplayDate(this.checkin) : '—';
    this.els.checkoutDisplay.textContent = this.checkout ? this.formatDisplayDate(this.checkout) : '—';
  }

  renderMonth(date, tbody) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    tbody.innerHTML = '';

    let dayCount = 1;
    let nextMonthDay = 1;

    for (let week = 0; week < 6; week++) {
      const row = document.createElement('tr');

      for (let day = 0; day < 7; day++) {
        const cell = document.createElement('td');
        const cellDate = new Date(year, month);

        if (week === 0 && day < firstDay) {
          const prevMonthDay = daysInPrevMonth - firstDay + day + 1;
          cellDate.setMonth(month - 1);
          cellDate.setDate(prevMonthDay);
          cell.appendChild(this.createDayCell(prevMonthDay, cellDate, true));
        } else if (dayCount > daysInMonth) {
          cellDate.setMonth(month + 1);
          cellDate.setDate(nextMonthDay);
          cell.appendChild(this.createDayCell(nextMonthDay, cellDate, true));
          nextMonthDay++;
        } else {
          cellDate.setDate(dayCount);
          cell.appendChild(this.createDayCell(dayCount, cellDate, false));
          dayCount++;
        }

        row.appendChild(cell);
      }

      tbody.appendChild(row);
      if (dayCount > daysInMonth && nextMonthDay > 7) break;
    }
  }

  /**
   * Builds one day cell. Visual states (today / disabled / unavailable /
   * available) reuse the exact same classes + CSS as the old view-only
   * calendar, so the look-and-feel (crossed-out unavailable days, bold
   * "today" outline, etc.) carries over unchanged. Available days are also
   * clickable so this same calendar drives the check-in/check-out picker.
   */
  createDayCell(day, date, isOutsideMonth) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.textContent = day;

    const cellDate = this.normalizeDate(date);
    const dateString = this.formatDate(cellDate);
    const isPast = cellDate < this.today;
    const isUnavailable = this.unavailableDates.has(dateString);

    if (isOutsideMonth) div.classList.add('outside-month');
    if (this.isSameDate(cellDate, this.today)) div.classList.add('today');

    if (isPast || isUnavailable) {
      // Same visual cue the view-only calendar used: 'unavailable' draws the
      // diagonal strike-through, 'disabled' greys out past days.
      div.classList.add(isUnavailable ? 'unavailable' : 'disabled');
      if (isUnavailable) {
        const busyEvent = this.busySlots.find(
          (slot) => this.formatDate(new Date(slot.startTime)) === dateString
        );
        if (busyEvent) {
          div.setAttribute('title', `Occupato: ${busyEvent.title}`);
        }
      }
      // Not clickable — matches "barred dates are not selectable".
    } else {
      div.classList.add('available', 'selectable');
      div.addEventListener('click', () => this.handleDateClick(cellDate));
    }

    if (this.checkin && this.isSameDate(cellDate, this.checkin)) {
      div.classList.add('selected-start');
    }
    if (this.checkout && this.isSameDate(cellDate, this.checkout)) {
      div.classList.add('selected-end');
    }
    if (this.checkin && this.checkout && cellDate > this.checkin && cellDate < this.checkout) {
      div.classList.add('in-range');
    }

    return div;
  }

  handleDateClick(date) {
    if (!this.checkin || (this.checkin && this.checkout)) {
      // Start a new selection
      this.checkin = date;
      this.checkout = null;
      this.clearDateWarning();
      this.renderCalendars();
      this.updateSummary();
      return;
    }

    // We already have a check-in date; this click is choosing check-out.
    if (date <= this.checkin) {
      // Clicked before (or on) the current check-in — treat as a new start.
      this.checkin = date;
      this.checkout = null;
      this.clearDateWarning();
      this.renderCalendars();
      this.updateSummary();
      return;
    }

    if (this.rangeHasUnavailableDate(this.checkin, date)) {
      // A barred day sits inside the requested range: the operation is
      // impossible. Block it, keep the current check-in, and ask the user
      // to pick different dates instead of silently guessing a new range.
      this.showDateWarning(
        'Il periodo selezionato include date già occupate. Scegli una data di check-out precedente al giorno non disponibile, oppure seleziona un nuovo check-in.'
      );
      return;
    }

    this.checkout = date;
    this.clearDateWarning();
    this.renderCalendars();
    this.updateSummary();
  }

  rangeHasUnavailableDate(checkin, checkout) {
    const cursor = new Date(checkin);
    while (cursor < checkout) {
      if (this.unavailableDates.has(this.formatDate(cursor))) {
        return true;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }

  showDateWarning(message) {
    if (this.els.dateWarning) {
      this.els.dateWarning.textContent = message;
    }
  }

  clearDateWarning() {
    if (this.els.dateWarning) {
      this.els.dateWarning.textContent = '';
    }
  }

  updateSummary() {
    const adults = parseInt(this.els.adultsInput.value, 10) || 0;
    const children = parseInt(this.els.childrenInput.value, 10) || 0;

    if (!this.checkin || !this.checkout) {
      this.els.summaryContent.innerHTML = '<p class="summary-placeholder">Seleziona le date, la sistemazione e gli ospiti per vedere una stima del prezzo.</p>';
      this.els.summaryTotal.style.display = 'none';
      this.setRequestLink(null);
      return;
    }

    const estimate = calculateEstimate({
      checkin: this.checkin,
      checkout: this.checkout,
      roomId: this.selectedRoom,
      adults,
      children,
    });

if (!estimate) {

    this.els.summaryContent.innerHTML =
        '<p class="summary-placeholder">Seleziona almeno una notte e un adulto.</p>';

    this.els.summaryTotal.style.display = "none";

    this.setRequestLink(null);

    return;

}

if (estimate.unavailable) {
    this.els.summaryContent.innerHTML = `
        <p class="summary-placeholder">
        ${estimate.unavailableMessage || "La selezione non è disponibile per il periodo o il numero di notti scelto."}
        </p>
    `;
    this.els.summaryTotal.style.display = "none";
    this.setRequestLink(null);
    return;
}

const rows = [

`<div class="summary-row">
<span>Appartamento</span>
<span>${estimate.room.name}</span>
</div>`,

`<div class="summary-row">
<span>Notti</span>
<span>${estimate.nights}</span>
</div>`,

`<div class="summary-row">
<span>Ospiti</span>
<span>${estimate.totalGuests}</span>
</div>`,

`<div class="summary-row">
<span>Tariffa giornaliera</span>
<span>${formatEUR(estimate.dailyPrice)}</span>
</div>`

];

if (estimate.discount) {

rows.push(

`<div class="summary-row">
<span>Sconto</span>
<span>${estimate.discount}</span>
</div>`

);

}

if (estimate.surcharge) {

rows.push(

`<div class="summary-row">
<span>Maggiorazione</span>
<span>${estimate.surcharge}</span>
</div>`

);

}

    if (children > 0) {
      rows.push(
        `<div class="summary-row"><span>Bambini (${children} × ${formatEUR(estimate.childPricePerGuest)})</span><span>${formatEUR(estimate.childrenTotal)}</span></div>`
      );
    }

    this.els.summaryContent.innerHTML = rows.join('');
    this.els.summaryTotal.style.display = 'flex';
    this.els.totalPrice.textContent = formatEUR(estimate.total);
    this.setRequestLink(estimate);
  }

  handleRequestBooking(event) {
    if (!this.checkin || !this.checkout) {
      event.preventDefault();
      return;
    }

    const room = PRICING_CONFIG.rooms[this.selectedRoom];
    const adults = parseInt(this.els.adultsInput.value, 10) || 0;
    const children = parseInt(this.els.childrenInput.value, 10) || 0;

    const estimate = calculateEstimate({
      checkin: this.checkin,
      checkout: this.checkout,
      roomId: this.selectedRoom,
      adults,
      children,
    });

    const bookingData = {
      checkin: this.formatDate(this.checkin),
      checkout: this.formatDate(this.checkout),
      apartment: room.name,
      adults,
      children,
      quotation: estimate ? formatEUR(estimate.total) : '',
    };

    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
  }

  setRequestLink(estimate) {
    if (!this.requestButtons) return;
    if (!estimate) {
      this.requestButtons.forEach((button) => button.classList.add('disabled-link'));
      return;
    }
    this.requestButtons.forEach((button) => button.classList.remove('disabled-link'));
  }

  normalizeDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  isSameDate(a, b) {
    return a.toDateString() === b.toDateString();
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(date) {
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatMonthYear(date) {
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BookingEstimator();
});