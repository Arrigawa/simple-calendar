document.addEventListener('DOMContentLoaded', function() {
    // Current date tracking
    let currentDate = new Date();
    let selectedDate = null;
    let draggedEvent = null;
    
    // DOM elements
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const addEventBtn = document.getElementById('add-event');
    const eventModal = document.getElementById('event-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const eventForm = document.getElementById('event-form');
    const eventDateInput = document.getElementById('event-date');
    const eventDatePicker = document.getElementById('event-date-picker');
    const eventIdInput = document.getElementById('event-id');
    const eventTitleInput = document.getElementById('event-title');
    const eventStartInput = document.getElementById('event-start');
    const eventEndInput = document.getElementById('event-end');
    const eventColorInput = document.getElementById('event-color');
    const eventDescInput = document.getElementById('event-description');
    const modalTitle = document.getElementById('modal-title');
    const cancelEventBtn = document.getElementById('cancel-event');
    const deleteEventBtn = document.getElementById('delete-event');
    
    // Store events
    let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
    
    // Initialize calendar
    renderCalendar();
    
    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    addEventBtn.addEventListener('click', () => {
        openModal();
    });
    
    closeModalBtn.addEventListener('click', closeModal);
    cancelEventBtn.addEventListener('click', closeModal);
    
    // Sync the hidden date input with the date picker
    eventDatePicker.addEventListener('change', () => {
        if (eventDatePicker.value) {
            eventDateInput.value = eventDatePicker.value;
        }
    });
    
    // Add event on day cell click
    calendarDays.addEventListener('click', (e) => {
        const dayCell = e.target.closest('.calendar-day');
        if (dayCell && !e.target.closest('.event')) {
            const dateAttr = dayCell.getAttribute('data-date');
            if (dateAttr) {
                selectedDate = new Date(dateAttr);
                openModal(null, selectedDate);
            }
        }
    });
    
    // Edit event when clicking on an event
    calendarDays.addEventListener('click', (e) => {
        const eventEl = e.target.closest('.event');
        if (eventEl) {
            const eventId = eventEl.getAttribute('data-id');
            const dateAttr = eventEl.closest('.calendar-day').getAttribute('data-date');
            if (eventId && dateAttr) {
                const date = new Date(dateAttr);
                const dateKey = formatDateKey(date);
                const event = events[dateKey].find(e => e.id === eventId);
                if (event) {
                    openModal(event, date);
                }
            }
            e.stopPropagation();
        }
    });
    
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });
    
    deleteEventBtn.addEventListener('click', () => {
        const eventId = eventIdInput.value;
        const dateKey = eventDateInput.value;
        
        if (eventId && dateKey && events[dateKey]) {
            events[dateKey] = events[dateKey].filter(event => event.id !== eventId);
            
            if (events[dateKey].length === 0) {
                delete events[dateKey];
            }
            
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            renderCalendar();
            closeModal();
        }
    });
    
    function openModal(event = null, date = null) {
        // Clear previous form data
        eventForm.reset();
        deleteEventBtn.classList.add('hidden');
        modalTitle.textContent = 'Add New Event';
        
        // Set default start/end times
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        eventStartInput.value = `${hours}:${minutes}`;
        eventEndInput.value = `${(now.getHours() + 1).toString().padStart(2, '0')}:${minutes}`;
        
        let dateToUse = date || selectedDate || now;
        
        // Format the date for the date picker (YYYY-MM-DD)
        const formattedDate = formatDateForPicker(dateToUse);
        eventDatePicker.value = formattedDate;
        eventDateInput.value = formatDateKey(dateToUse);
        
        if (event) {
            // Editing existing event
            eventIdInput.value = event.id;
            eventTitleInput.value = event.title;
            eventStartInput.value = event.start;
            eventEndInput.value = event.end;
            eventColorInput.value = event.color;
            eventDescInput.value = event.description || '';
            
            // If the event has its own date information
            if (event.dateKey) {
                eventDatePicker.value = event.dateKey;
                eventDateInput.value = event.dateKey;
            }
            
            modalTitle.textContent = 'Edit Event';
            deleteEventBtn.classList.remove('hidden');
        } else {
            // New event
            eventIdInput.value = '';
        }
        
        // Show modal
        eventModal.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    function closeModal() {
        eventModal.classList.add('opacity-0', 'pointer-events-none');
    }
    
    function saveEvent() {
        const eventId = eventIdInput.value || Date.now().toString();
        // Use the date from the date picker instead of the hidden input
        const dateKey = eventDatePicker.value;
        const title = eventTitleInput.value;
        const start = eventStartInput.value;
        const end = eventEndInput.value;
        const color = eventColorInput.value;
        const description = eventDescInput.value;
        
        if (!events[dateKey]) {
            events[dateKey] = [];
        }
        
        // If editing, remove old event from previous date
        if (eventIdInput.value) {
            // Find and remove the event from all date arrays
            Object.keys(events).forEach(date => {
                events[date] = events[date].filter(e => e.id !== eventId);
                // Clean up empty date arrays
                if (events[date].length === 0) {
                    delete events[date];
                }
            });
        }
        
        // Add event to the new date
        events[dateKey].push({
            id: eventId,
            title,
            start,
            end,
            color,
            description,
            dateKey // Store the date with the event for reference
        });
        
        // Save to localStorage
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        
        // Re-render calendar
        renderCalendar();
        closeModal();
    }
    
    function renderCalendar() {
        // Clear previous calendar
        calendarDays.innerHTML = '';
        
        // Set current month/year display
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthEl.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        
        // Get first day of month
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Get days from previous month
        const prevMonthDays = firstDay.getDay();
        const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        
        // Get total days in current month
        const daysInMonth = lastDay.getDate();
        
        // Get days needed from next month
        const nextMonthDays = 6 - lastDay.getDay();
        
        // Add previous month days
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
            addDayToCalendar(date, 'text-gray-400 other-month');
        }
        
        // Add current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            addDayToCalendar(date);
        }
        
        // Add next month days
        for (let i = 1; i <= nextMonthDays; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
            addDayToCalendar(date, 'text-gray-400 other-month');
        }
        
        // Add drag and drop event listeners after rendering calendar
        setupDragAndDrop();
    }
    
    function addDayToCalendar(date, textColor = '') {
        const day = document.createElement('div');
        day.className = `calendar-day ${textColor}`;
        day.setAttribute('data-date', date.toISOString());
        
        // Highlight current day
        const today = new Date();
        if (date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()) {
            day.classList.add('current-day');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        day.appendChild(dayNumber);
        
        // Add events for this day
        const dateKey = formatDateKey(date);
        if (events[dateKey] && events[dateKey].length) {
            const eventContainer = document.createElement('div');
            eventContainer.className = 'events';
            
            events[dateKey].forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event ${event.color} text-sm`;
                eventEl.setAttribute('data-id', event.id);
                eventEl.setAttribute('draggable', 'true'); // Make event draggable
                eventEl.textContent = `${event.start} - ${event.title}`;
                eventContainer.appendChild(eventEl);
            });
            
            day.appendChild(eventContainer);
        }
        
        calendarDays.appendChild(day);
    }
    
    function setupDragAndDrop() {
        const eventElements = document.querySelectorAll('.event');
        const dayElements = document.querySelectorAll('.calendar-day');
        
        // Add event listeners for drag events
        eventElements.forEach(eventEl => {
            eventEl.addEventListener('dragstart', handleDragStart);
            eventEl.addEventListener('dragend', handleDragEnd);
        });
        
        // Add event listeners for drop targets
        dayElements.forEach(dayEl => {
            dayEl.addEventListener('dragover', handleDragOver);
            dayEl.addEventListener('dragenter', handleDragEnter);
            dayEl.addEventListener('dragleave', handleDragLeave);
            dayEl.addEventListener('drop', handleDrop);
        });
    }
    
    function handleDragStart(e) {
        // Store the dragged event
        draggedEvent = {
            element: this,
            id: this.getAttribute('data-id'),
            sourceDate: this.closest('.calendar-day').getAttribute('data-date')
        };
        
        // Add dragging class after a short delay to show transition
        setTimeout(() => {
            this.classList.add('dragging');
        }, 0);
        
        // Set data for drag operation
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    }
    
    function handleDragEnd() {
        this.classList.remove('dragging');
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Allow drop
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDragEnter(e) {
        this.classList.add('drag-over');
    }
    
    function handleDragLeave() {
        this.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        e.stopPropagation(); // Stop the browser from redirecting
        
        // Remove drag-over styling
        this.classList.remove('drag-over');
        
        // Get the target date from the calendar day
        const targetDateStr = this.getAttribute('data-date');
        if (!targetDateStr || !draggedEvent) return false;
        
        // Get event ID from the data transfer
        const eventId = e.dataTransfer.getData('text/plain');
        if (!eventId) return false;
        
        // Move the event to the new date
        moveEventToNewDate(eventId, targetDateStr);
        
        return false;
    }
    
    function moveEventToNewDate(eventId, targetDateStr) {
        // Find the source date and event
        let sourceEvent;
        let sourceDateKey;
        
        // Search for the event in all date entries
        for (const dateKey in events) {
            const foundEvent = events[dateKey].find(event => event.id === eventId);
            if (foundEvent) {
                sourceEvent = foundEvent;
                sourceDateKey = dateKey;
                break;
            }
        }
        
        if (!sourceEvent || !sourceDateKey) return;
        
        // Remove event from source date
        events[sourceDateKey] = events[sourceDateKey].filter(event => event.id !== eventId);
        
        // Clean up if date has no more events
        if (events[sourceDateKey].length === 0) {
            delete events[sourceDateKey];
        }
        
        // Format the target date
        const targetDate = new Date(targetDateStr);
        const targetDateKey = formatDateKey(targetDate);
        
        // Create events array for target date if it doesn't exist
        if (!events[targetDateKey]) {
            events[targetDateKey] = [];
        }
        
        // Add event to target date
        const updatedEvent = {...sourceEvent, dateKey: targetDateKey};
        events[targetDateKey].push(updatedEvent);
        
        // Save to localStorage
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        
        // Re-render calendar
        renderCalendar();
        
        // Show confirmation message
        showToast(`Event moved to ${targetDate.toLocaleDateString()}`);
    }
    
    function showToast(message) {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transform transition-transform duration-300 translate-y-20';
            document.body.appendChild(toast);
        }
        
        // Set toast message and show
        toast.textContent = message;
        setTimeout(() => {
            toast.classList.remove('translate-y-20');
        }, 10);
        
        // Hide toast after a delay
        setTimeout(() => {
            toast.classList.add('translate-y-20');
        }, 3000);
    }
    
    function formatDateKey(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    
    function formatDateForPicker(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
});