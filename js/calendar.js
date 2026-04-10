// ============================================
// AVAILABILITY CALENDAR - VIEW ONLY (NO SELECTION)
// ============================================

class AvailabilityCalendar {
    constructor() {
        this.currentMonth = new Date();
        this.today = new Date();
        this.today.setHours(0, 0, 0, 0);
        this.apiUrl = typeof CALENDAR_CONFIG !== 'undefined' ? CALENDAR_CONFIG.API_URL : 'http://localhost:3000';
        this.unavailableDates = new Set();
        this.busySlots = [];
        this.init();
    }

    async init() {
        await this.loadAvailabilityData();
        this.renderCalendars();
        this.setupEventListeners();
    }

    async loadAvailabilityData() {
        try {
            const { startDate, endDate } = this.getDateRange(3);
            const response = await fetch(
                `${this.apiUrl}/api/availability?` +
                `startDate=${startDate.toISOString()}&` +
                `endDate=${endDate.toISOString()}`
            );

            if (response.ok) {
                const data = await response.json();
                
                if (data.unavailableDates && Array.isArray(data.unavailableDates)) {
                    this.setUnavailableDates(data.unavailableDates);
                }
                
                this.busySlots = data.busySlots || [];
                console.log('✓ Loaded from Google Calendar:', Array.from(this.unavailableDates));
                if (typeof logDebug !== 'undefined') {
                    logDebug('Busy slots:', this.busySlots);
                }
                return;
            }

            // Fallback to JSON file if API not available
            console.warn('Google Calendar API unavailable, using fallback data');
            await this.loadFallbackData();
            
            console.log('Loaded from fallback (JSON):', Array.from(this.unavailableDates));
        } catch (error) {
            console.error('Error loading availability data:', error);
            // Hardcoded fallback
            this.setUnavailableDates([
                '2025-12-01', '2025-12-02', '2025-12-12', '2025-12-13',
                '2025-12-24', '2025-12-25', '2025-12-26'
            ]);
            console.log('Using hardcoded fallback dates');
        }
    }

    getDateRange(monthsAhead) {
        const startDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
        const endDate = new Date(this.today.getFullYear(), this.today.getMonth() + monthsAhead, 0);
        return { startDate, endDate };
    }

    setUnavailableDates(dates) {
        this.unavailableDates = new Set(
            dates.filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
        );
    }

    normalizeDate(date) {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }

    getBusyEvent(dateString) {
        return this.busySlots.find(slot => this.formatDate(new Date(slot.startTime)) === dateString);
    }

    async loadFallbackData() {
        const fallbackResponse = await fetch('data/availability.json');
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.unavailableDates && Array.isArray(fallbackData.unavailableDates)) {
            this.setUnavailableDates(fallbackData.unavailableDates);
        }
    }

    setupEventListeners() {
        [['prev-month', -1], ['next-month', 1]].forEach(([id, step]) =>
            document.getElementById(id).addEventListener('click', () => this.changeMonth(step))
        );
    }

    changeMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.renderCalendars();
    }

    renderCalendars() {
        const month1 = new Date(this.currentMonth);
        const month2 = new Date(this.currentMonth);
        month2.setMonth(month2.getMonth() + 1);

        document.getElementById('month1-label').textContent = this.formatMonthYear(month1);
        document.getElementById('month2-label').textContent = this.formatMonthYear(month2);

        this.renderMonth(month1, 'calendar-body-1');
        this.renderMonth(month2, 'calendar-body-2');

        this.updateNavigationButtons();
    }

    renderMonth(date, bodyId) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const tbody = document.getElementById(bodyId);
        tbody.innerHTML = '';

        let dayCount = 1;
        let nextMonthDay = 1;
        const today = this.today;

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

    createDayCell(day, date, isOutsideMonth) {
        // Create DIV instead of BUTTON - not clickable
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = day;

        const today = this.today;
        const cellDate = this.normalizeDate(date);

        if (isOutsideMonth) {
            div.classList.add('outside-month');
        }

        if (cellDate < today) {
            div.classList.add('disabled');
        }

        if (this.isSameDate(cellDate, today)) {
            div.classList.add('today');
        }

        const dateString = this.formatDate(cellDate);
        if (this.unavailableDates.has(dateString)) {
            div.classList.add('unavailable');
            const busyEvent = this.getBusyEvent(dateString);
            if (busyEvent) {
                div.setAttribute('title', `Busy: ${busyEvent.title}`);
                div.setAttribute('data-busy', busyEvent.title);
            }
        } else if (cellDate >= today) {
            div.classList.add('available');
        }

        return div;
    }

    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatMonthYear(date) {
        const options = { month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-month');
        prevBtn.disabled = this.currentMonth.getMonth() === this.today.getMonth() &&
            this.currentMonth.getFullYear() === this.today.getFullYear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AvailabilityCalendar();
});