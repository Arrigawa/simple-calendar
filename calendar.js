document.addEventListener('DOMContentLoaded', function() {
    // Current date tracking
    let currentDate = new Date();
    let selectedDate = null;
    let draggedEvent = null;
    
    // Multi-day event selection state
    let isInMultiDayMode = false;
    let isDraggingForMultiDayEvent = false;
    let multiDaySelectionStart = null;
    let multiDaySelectionEnd = null;
    let selectedCells = [];
    
    // DOM elements
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const addEventBtn = document.getElementById('add-event');
    const calendarModeBtn = document.getElementById('calendar-mode');
    const modeText = document.getElementById('mode-text');
    const modeDropdown = document.getElementById('mode-dropdown');
    const normalModeBtn = document.getElementById('normal-mode');
    const multiDayModeBtn = document.getElementById('multi-day-mode');
    const modeIndicator = document.getElementById('mode-indicator');
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
    let multiDayEvents = JSON.parse(localStorage.getItem('multiDayEvents')) || [];
    
    // Initialize calendar
    renderCalendar();
    
    // Calendar navigation event listeners
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
    
    // Event creation buttons
    addEventBtn.addEventListener('click', () => {
        openModal();
    });
    
    // Mode dropdown
    calendarModeBtn.addEventListener('click', () => {
        modeDropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
        if (!calendarModeBtn.contains(e.target) && !modeDropdown.contains(e.target)) {
            modeDropdown.classList.add('hidden');
        }
    });
    
    normalModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setCalendarMode('normal');
        modeDropdown.classList.add('hidden');
    });
    
    multiDayModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setCalendarMode('multi-day');
        modeDropdown.classList.add('hidden');
    });
    
    function setCalendarMode(mode) {
        if (mode === 'multi-day') {
            isInMultiDayMode = true;
            document.body.classList.add('calendar-mode-multi');
            modeText.textContent = 'Multi-Day Mode';
            modeIndicator.classList.remove('hidden');
            calendarModeBtn.classList.remove('bg-indigo-600');
            calendarModeBtn.classList.add('bg-indigo-800');
        } else {
            isInMultiDayMode = false;
            document.body.classList.remove('calendar-mode-multi');
            modeText.textContent = 'Normal Mode';
            modeIndicator.classList.add('hidden');
            calendarModeBtn.classList.add('bg-indigo-600');
            calendarModeBtn.classList.remove('bg-indigo-800');
            clearMultiDaySelection();
        }
    }
    
    // Modal event listeners
    closeModalBtn.addEventListener('click', closeModal);
    cancelEventBtn.addEventListener('click', closeModal);
    
    // Sync the hidden date input with the date picker
    eventDatePicker.addEventListener('change', () => {
        if (eventDatePicker.value) {
            eventDateInput.value = eventDatePicker.value;
        }
    });
    
    // Calendar day interactions for multi-day events
    calendarDays.addEventListener('mousedown', handleMultiDayStart);
    calendarDays.addEventListener('mouseover', handleMultiDayDrag);
    document.addEventListener('mouseup', handleMultiDayEnd);
    
    function handleMultiDayStart(e) {
        if (!isInMultiDayMode) return;
        
        const dayCell = e.target.closest('.calendar-day');
        if (!dayCell) return;
        
        // Start multi-day selection
        isDraggingForMultiDayEvent = true;
        multiDaySelectionStart = dayCell;
        selectedCells = [dayCell];
        dayCell.classList.add('being-selected');
        
        e.preventDefault(); // Prevent text selection
    }
    
    function handleMultiDayDrag(e) {
        if (!isInMultiDayMode || !isDraggingForMultiDayEvent) return;
        
        const dayCell = e.target.closest('.calendar-day');
        if (!dayCell) return;
        
        // Avoid duplicates
        if (selectedCells.includes(dayCell)) return;
        
        // Add to selection
        multiDaySelectionEnd = dayCell;
        updateMultiDaySelection();
    }
    
    function handleMultiDayEnd(e) {
        if (!isInMultiDayMode || !isDraggingForMultiDayEvent) return;
        
        if (multiDaySelectionStart && multiDaySelectionEnd) {
            // Calculate date range
            const startDate = new Date(multiDaySelectionStart.getAttribute('data-date'));
            const endDate = new Date(multiDaySelectionEnd.getAttribute('data-date'));
            
            // Open modal with multi-day dates pre-selected
            openMultiDayEventModal(null, startDate, endDate);
        }
        
        isDraggingForMultiDayEvent = false;
        clearMultiDaySelection();
    }
    
    function updateMultiDaySelection() {
        // Clear previous selection
        document.querySelectorAll('.calendar-day.being-selected').forEach(cell => {
            cell.classList.remove('being-selected');
        });
        
        if (!multiDaySelectionStart || !multiDaySelectionEnd) return;
        
        // Get all days between start and end
        const allDays = Array.from(document.querySelectorAll('.calendar-day'));
        const startIdx = allDays.indexOf(multiDaySelectionStart);
        const endIdx = allDays.indexOf(multiDaySelectionEnd);
        
        if (startIdx === -1 || endIdx === -1) return;
        
        // Determine the range (start can be after end if dragging backwards)
        const startPos = Math.min(startIdx, endIdx);
        const endPos = Math.max(startIdx, endIdx);
        
        // Update selected cells
        selectedCells = [];
        for (let i = startPos; i <= endPos; i++) {
            allDays[i].classList.add('being-selected');
            selectedCells.push(allDays[i]);
        }
    }
    
    function clearMultiDaySelection() {
        multiDaySelectionStart = null;
        multiDaySelectionEnd = null;
        selectedCells = [];
        document.querySelectorAll('.calendar-day.being-selected').forEach(cell => {
            cell.classList.remove('being-selected');
        });
    }
    
    // Regular calendar day click (for single-day events)
    calendarDays.addEventListener('click', (e) => {
        // Skip if in multi-day mode or if handling multi-day drag
        if (isInMultiDayMode || isDraggingForMultiDayEvent) return;
        
        const dayCell = e.target.closest('.calendar-day');
        if (!dayCell) return;
        
        // Skip if clicking on an event
        if (e.target.closest('.event') || e.target.closest('.multi-day-event')) return;
        
        const dateAttr = dayCell.getAttribute('data-date');
        if (dateAttr) {
            selectedDate = new Date(dateAttr);
            openModal(null, selectedDate);
        }
    });
    
    // Edit event when clicking on an event
    calendarDays.addEventListener('click', (e) => {
        if (isInMultiDayMode) return; // Skip in multi-day mode
        
        // Single-day event editing
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
            return;
        }
        
        // Multi-day event editing
        const multiEventEl = e.target.closest('.multi-day-event');
        if (multiEventEl) {
            const eventId = multiEventEl.getAttribute('data-id');
            if (eventId) {
                const event = multiDayEvents.find(e => e.id === eventId);
                if (event) {
                    openMultiDayEventModal(event);
                }
            }
            e.stopPropagation();
        }
    });
    
    // Form submission
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });
    
    // Delete event button
    deleteEventBtn.addEventListener('click', () => {
        const eventId = eventIdInput.value;
        
        // Check if it's a multi-day event
        const multiEventIndex = multiDayEvents.findIndex(e => e.id === eventId);
        if (multiEventIndex !== -1) {
            multiDayEvents.splice(multiEventIndex, 1);
            localStorage.setItem('multiDayEvents', JSON.stringify(multiDayEvents));
            renderCalendar();
            closeModal();
            return;
        }
        
        // Regular single-day event
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
    
    // Regular event modal
    function openModal(event = null, date = null) {
        // Clear previous form data
        eventForm.reset();
        eventForm.removeAttribute('data-multi-day');
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
    
    // Multi-day event modal
    function openMultiDayEventModal(event = null, startDate = null, endDate = null) {
        // Clear previous form data
        eventForm.reset();
        deleteEventBtn.classList.add('hidden');
        
        // Mark form as multi-day
        eventForm.setAttribute('data-multi-day', 'true');
        
        if (event) {
            // Editing existing multi-day event
            eventIdInput.value = event.id;
            eventTitleInput.value = event.title;
            eventStartInput.value = event.start || '09:00';
            eventEndInput.value = event.end || '17:00';
            eventColorInput.value = event.color || 'bg-indigo-100 border-indigo-300 text-indigo-800';
            eventDescInput.value = event.description || '';
            
            startDate = new Date(event.startDate);
            endDate = new Date(event.endDate);
            
            modalTitle.textContent = 'Edit Multi-Day Event';
            deleteEventBtn.classList.remove('hidden');
        } else {
            // New multi-day event
            eventIdInput.value = '';
            eventStartInput.value = '09:00';
            eventEndInput.value = '17:00';
            eventColorInput.value = 'bg-indigo-100 border-indigo-300 text-indigo-800';
            
            modalTitle.textContent = 'Add Multi-Day Event';
        }
        
        // Store start and end dates for the multi-day event
        if (startDate && endDate) {
            // Make sure start is before end
            if (startDate > endDate) {
                const temp = startDate;
                startDate = endDate;
                endDate = temp;
            }
            
            eventForm.setAttribute('data-start-date', startDate.toISOString());
            eventForm.setAttribute('data-end-date', endDate.toISOString());
            
            // Set the date picker to show the first day
            eventDatePicker.value = formatDateForPicker(startDate);
            
            // Also set a label showing the date range
            const dateRangeLabel = document.createElement('div');
            dateRangeLabel.id = 'date-range-label';
            dateRangeLabel.className = 'mt-1 text-sm text-indigo-600 font-medium';
            
            // Format dates nicely
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            dateRangeLabel.textContent = `${startDate.toLocaleDateString(undefined, options)} — ${endDate.toLocaleDateString(undefined, options)}`;
            
            const existingLabel = document.getElementById('date-range-label');
            if (existingLabel) {
                existingLabel.remove();
            }
            
            const datePickerContainer = eventDatePicker.parentNode;
            datePickerContainer.appendChild(dateRangeLabel);
        }
        
        // Show modal
        eventModal.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    function closeModal() {
        eventModal.classList.add('opacity-0', 'pointer-events-none');
        
        // Remove date range label if it exists
        const dateRangeLabel = document.getElementById('date-range-label');
        if (dateRangeLabel) {
            dateRangeLabel.remove();
        }
        
        // Remove multi-day flag
        eventForm.removeAttribute('data-multi-day');
        eventForm.removeAttribute('data-start-date');
        eventForm.removeAttribute('data-end-date');
    }
    
    function saveEvent() {
        const eventId = eventIdInput.value || Date.now().toString();
        const title = eventTitleInput.value;
        const start = eventStartInput.value;
        const end = eventEndInput.value;
        const color = eventColorInput.value;
        const description = eventDescInput.value;
        
        // Check if this is a multi-day event
        if (eventForm.hasAttribute('data-multi-day')) {
            let startDate, endDate;
            
            if (eventForm.hasAttribute('data-start-date') && eventForm.hasAttribute('data-end-date')) {
                startDate = new Date(eventForm.getAttribute('data-start-date'));
                endDate = new Date(eventForm.getAttribute('data-end-date'));
            } else {
                // Fallback to single day
                startDate = new Date(eventDatePicker.value);
                endDate = new Date(eventDatePicker.value);
            }
            
            // If editing, find and remove the old multi-day event
            if (eventIdInput.value) {
                const index = multiDayEvents.findIndex(e => e.id === eventId);
                if (index !== -1) {
                    multiDayEvents.splice(index, 1);
                }
            }
            
            // Create new multi-day event
            multiDayEvents.push({
                id: eventId,
                title,
                start,
                end,
                color,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            
            // Save to localStorage
            localStorage.setItem('multiDayEvents', JSON.stringify(multiDayEvents));
        } else {
            // Regular single-day event
            const dateKey = eventDatePicker.value;
            
            if (!events[dateKey]) {
                events[dateKey] = [];
            }
            
            // If editing, remove old event
            if (eventIdInput.value) {
                Object.keys(events).forEach(date => {
                    events[date] = events[date].filter(e => e.id !== eventId);
                    if (events[date].length === 0) {
                        delete events[date];
                    }
                });
            }
            
            // Add event to the date
            events[dateKey].push({
                id: eventId,
                title,
                start,
                end,
                color,
                description,
                dateKey
            });
            
            // Save to localStorage
            localStorage.setItem('calendarEvents', JSON.stringify(events));
        }
        
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
        
        // Store all days for multi-day event rendering
        const allDayCells = [];
        
        // Add previous month days
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
            const dayCell = addDayToCalendar(date, 'text-gray-400 other-month');
            allDayCells.push(dayCell);
        }
        
        // Add current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dayCell = addDayToCalendar(date);
            allDayCells.push(dayCell);
        }
        
        // Add next month days
        for (let i = 1; i <= nextMonthDays; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
            const dayCell = addDayToCalendar(date, 'text-gray-400 other-month');
            allDayCells.push(dayCell);
        }
        
        // Render multi-day events
        renderMultiDayEvents(allDayCells);
        
        // Add drag and drop event listeners for regular events
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
        
        // Add events container for this day
        const eventContainer = document.createElement('div');
        eventContainer.className = 'events';
        day.appendChild(eventContainer);
        
        // Add single-day events for this day
        const dateKey = formatDateKey(date);
        if (events[dateKey] && events[dateKey].length) {
            events[dateKey].forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event ${event.color} text-sm`;
                eventEl.setAttribute('data-id', event.id);
                eventEl.setAttribute('draggable', 'true');
                eventEl.textContent = `${event.start} - ${event.title}`;
                eventContainer.appendChild(eventEl);
            });
        }
        
        calendarDays.appendChild(day);
        return day;
    }
    
    function renderMultiDayEvents(dayCells) {
        if (!multiDayEvents || multiDayEvents.length === 0) return;
        
        multiDayEvents.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            // Find cells that fall within this event's date range
            const eventCells = dayCells.filter(cell => {
                const cellDate = new Date(cell.getAttribute('data-date'));
                return cellDate >= startDate && cellDate <= endDate;
            });
            
            if (eventCells.length > 0) {
                // Create multi-day event elements
                for (let i = 0; i < eventCells.length; i++) {
                    const cell = eventCells[i];
                    const eventContainer = cell.querySelector('.events');
                    
                    // Create event segment
                    const eventSegment = document.createElement('div');
                    eventSegment.setAttribute('data-id', event.id);
                    
                    // Extract color class from event.color
                    const colorClass = event.color ? event.color.split(' ')[0] : 'bg-indigo-100';
                    
                    // Set appropriate class based on position
                    if (i === 0) {
                        eventSegment.className = `multi-day-event start ${colorClass}`;
                        eventSegment.textContent = `${event.start} - ${event.title}`;
                    } else if (i === eventCells.length - 1) {
                        eventSegment.className = `multi-day-event end ${colorClass}`;
                        if (eventCells.length > 2) {
                            eventSegment.textContent = `${event.end}`;
                        } else {
                            // For 2-day events, show full info on both days
                            eventSegment.textContent = `${event.end} - ${event.title}`;
                        }
                    } else {
                        eventSegment.className = `multi-day-event middle ${colorClass}`;
                        // For middle segments, only show title for better readability
                        if (i === Math.floor(eventCells.length / 2)) {
                            eventSegment.textContent = event.title;
                        }
                    }
                    
                    eventContainer.appendChild(eventSegment);
                }
            }
        });
    }
    
    // Regular event drag and drop
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
        if (isInMultiDayMode) return; // Disable dragging in multi-day mode
        
        draggedEvent = {
            element: this,
            id: this.getAttribute('data-id'),
            sourceDate: this.closest('.calendar-day').getAttribute('data-date')
        };
        
        setTimeout(() => {
            this.classList.add('dragging');
        }, 0);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    }
    
    function handleDragEnd() {
        this.classList.remove('dragging');
    }
    
    function handleDragOver(e) {
        if (isInMultiDayMode) return; // Disable dropping in multi-day mode
        
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDragEnter(e) {
        if (isInMultiDayMode) return;
        this.classList.add('drag-over');
    }
    
    function handleDragLeave() {
        this.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        if (isInMultiDayMode) return;
        
        e.stopPropagation();
        this.classList.remove('drag-over');
        
        const targetDateStr = this.getAttribute('data-date');
        if (!targetDateStr || !draggedEvent) return false;
        
        const eventId = e.dataTransfer.getData('text/plain');
        if (!eventId) return false;
        
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
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transform transition-transform duration-300 translate-y-20';
            document.body.appendChild(toast);
        }
        
        // Set message and show
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.remove('translate-y-20');
        }, 10);
        
        // Hide after delay
        setTimeout(() => {
            toast.classList.add('translate-y-20');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }
    
    function formatDateKey(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    
    function formatDateForPicker(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
});