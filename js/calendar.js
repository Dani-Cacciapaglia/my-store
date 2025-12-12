// ============================================
// AVAILABILITY CALENDAR - VIEW ONLY (NO SELECTION)
// ============================================

class AvailabilityCalendar {
    constructor() {
        this.currentMonth = new Date();
        this.unavailableDates = new Set();
        this.init();
    }

    async init() {
        await this.loadAvailabilityData();
        this.renderCalendars();
        this.setupEventListeners();
    }

    async loadAvailabilityData() {
        try {
            const response = await fetch('data/availability.json');
            const data = await response.json();
            
            if (data.unavailableDates && Array.isArray(data.unavailableDates)) {
                this.unavailableDates = new Set(data.unavailableDates.filter(date => {
                    return /^\d{4}-\d{2}-\d{2}$/.test(date);
                }));
            }
            
            console.log('Loaded unavailable dates:', Array.from(this.unavailableDates));
        } catch (error) {
            console.error('Error loading availability data:', error);
            this.unavailableDates = new Set([
                '2025-12-01', '2025-12-02', '2025-12-12', '2025-12-13',
                '2025-12-24', '2025-12-25', '2025-12-26'
            ]);
        }
    }

    setupEventListeners() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cellDate = new Date(date);
        cellDate.setHours(0, 0, 0, 0);

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
        const today = new Date();
        const prevBtn = document.getElementById('prev-month');
        
        if (this.currentMonth.getMonth() === today.getMonth() && 
            this.currentMonth.getFullYear() === today.getFullYear()) {
            prevBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AvailabilityCalendar();
});