// ============================================
// AVAILABILITY CALENDAR - DYNAMIC IMPLEMENTATION
// ============================================

class AvailabilityCalendar {
    constructor() {
        this.currentMonth = new Date();
        this.selectedDates = [];
        this.unavailableDates = [];
        this.init();
    }

    async init() {
        // Load unavailable dates from JSON
        await this.loadAvailabilityData();
        
        // Render initial calendars
        this.renderCalendars();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async loadAvailabilityData() {
        try {
            const response = await fetch('data/availability.json');
            const data = await response.json();
            this.unavailableDates = data.unavailableDates || [];
        } catch (error) {
            console.log('Using default availability data');
            // Default unavailable dates (example)
            this.unavailableDates = [
                '2025-12-01', '2025-12-02', '2025-12-03', '2025-12-04',
                '2025-12-05', '2025-12-06', '2025-12-07', '2025-12-08',
                '2025-12-12', '2025-12-13', '2025-12-14', '2025-12-16',
                '2025-12-17', '2025-12-18', '2025-12-20', '2025-12-24',
                '2025-12-25', '2025-12-26', '2025-12-27', '2025-12-31',
                '2026-01-01', '2026-01-12', '2026-01-13', '2026-01-14',
                '2026-01-15', '2026-01-16', '2026-01-17', '2026-01-18'
            ];
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

        // Update month labels
        document.getElementById('month1-label').textContent = 
            this.formatMonthYear(month1);
        document.getElementById('month2-label').textContent = 
            this.formatMonthYear(month2);

        // Render calendar bodies
        this.renderMonth(month1, 'calendar-body-1');
        this.renderMonth(month2, 'calendar-body-2');

        // Update navigation buttons
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

        // Create weeks
        for (let week = 0; week < 6; week++) {
            const row = document.createElement('tr');

            for (let day = 0; day < 7; day++) {
                const cell = document.createElement('td');
                const cellDate = new Date(year, month);

                if (week === 0 && day < firstDay) {
                    // Previous month days
                    const prevMonthDay = daysInPrevMonth - firstDay + day + 1;
                    cellDate.setMonth(month - 1);
                    cellDate.setDate(prevMonthDay);
                    cell.appendChild(
                        this.createDayButton(prevMonthDay, cellDate, true)
                    );
                } else if (dayCount > daysInMonth) {
                    // Next month days
                    cellDate.setMonth(month + 1);
                    cellDate.setDate(nextMonthDay);
                    cell.appendChild(
                        this.createDayButton(nextMonthDay, cellDate, true)
                    );
                    nextMonthDay++;
                } else {
                    // Current month days
                    cellDate.setDate(dayCount);
                    cell.appendChild(
                        this.createDayButton(dayCount, cellDate, false)
                    );
                    dayCount++;
                }

                row.appendChild(cell);
            }

            tbody.appendChild(row);
            
            if (dayCount > daysInMonth && nextMonthDay > 7) break;
        }
    }

    createDayButton(day, date, isOutsideMonth) {
        const button = document.createElement('button');
        button.className = 'calendar-day';
        button.textContent = day;
        button.type = 'button';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cellDate = new Date(date);
        cellDate.setHours(0, 0, 0, 0);

        // Add classes based on date state
        if (isOutsideMonth) {
            button.classList.add('outside-month');
        }

        if (cellDate < today) {
            button.classList.add('disabled');
            button.disabled = true;
        }

        if (this.isSameDate(cellDate, today)) {
            button.classList.add('today');
        }

        if (this.isUnavailable(cellDate)) {
            button.classList.add('unavailable');
            button.disabled = true;
        } else {
            button.classList.add('available');
        }

        if (this.isSelected(cellDate)) {
            button.classList.add('selected');
        }

        // Add click handler
        button.addEventListener('click', () => {
            if (!button.disabled) {
                this.handleDateClick(cellDate);
            }
        });

        return button;
    }

    handleDateClick(date) {
        const dateString = this.formatDate(date);
        const index = this.selectedDates.findIndex(d => d === dateString);

        if (index > -1) {
            this.selectedDates.splice(index, 1);
        } else {
            if (this.selectedDates.length >= 2) {
                this.selectedDates = [];
            }
            this.selectedDates.push(dateString);
            this.selectedDates.sort();
        }

        this.renderCalendars();
        
        // Log selection
        if (this.selectedDates.length === 2) {
            console.log('Selected range:', this.selectedDates);
        }
    }

    isUnavailable(date) {
        const dateString = this.formatDate(date);
        return this.unavailableDates.includes(dateString);
    }

    isSelected(date) {
        const dateString = this.formatDate(date);
        return this.selectedDates.includes(dateString);
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
        
        // Disable prev button if current month is this month
        if (this.currentMonth.getMonth() === today.getMonth() && 
            this.currentMonth.getFullYear() === today.getFullYear()) {
            prevBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
        }
    }
}

// Initialize calendar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AvailabilityCalendar();
});