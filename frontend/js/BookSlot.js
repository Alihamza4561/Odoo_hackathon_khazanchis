document.addEventListener('DOMContentLoaded', () => {
    
    const TIME_SLOTS = [
        { label: '9:00 AM', value: 9.0 },
        { label: '10:00 AM', value: 10.0 },
        { label: '11:00 AM', value: 11.0 },
        { label: '12:00 PM', value: 12.0 },
        { label: '1:00 PM', value: 13.0 },
        { label: '2:00 PM', value: 14.0 },
        { label: '3:00 PM', value: 15.0 },
        { label: '4:00 PM', value: 16.0 },
        { label: '5:00 PM', value: 17.0 }
    ];

    const START_TIMELINE_HOUR = 9.0;
    const END_TIMELINE_HOUR = 17.0;

    let bookingDataStore = {
        'room-a1': [],
        'room-b2': [],
        'room-c1': [],
        'room-training': [],
        'room-meeting5': []
    };

    let activeDeletionTargetId = null;

    const resourceSelect = document.getElementById('resource-select');
    const timelineGrid = document.getElementById('timeline-grid');
    const scheduleView = document.getElementById('schedule-view');
    const actionSection = document.getElementById('action-section');
    
    const bookingFormSection = document.getElementById('booking-form-section');
    const bookingForm = document.getElementById('booking-form');
    const formTitle = document.getElementById('form-title');
    const formResourceId = document.getElementById('form-resource');
    const bookingIdInput = document.getElementById('booking-id');
    const titleInput = document.getElementById('booking-title');
    const requestedByInput = document.getElementById('requested-by');
    const dateInput = document.getElementById('booking-date');
    const startTimeSelect = document.getElementById('start-time');
    const endTimeSelect = document.getElementById('end-time');
    const purposeInput = document.getElementById('booking-purpose');
    const formErrorMessage = document.getElementById('form-error-message');
    
    const btnOpenBooking = document.getElementById('btn-open-booking');
    const btnCancelBooking = document.getElementById('btn-cancel-booking');
    
    const deleteModal = document.getElementById('delete-modal');
    const btnDeleteYes = document.getElementById('btn-delete-yes');
    const btnDeleteNo = document.getElementById('btn-delete-no');

    function initializeApplication() {
        populateTimeDropdowns();
        renderTimelineFramework();
        renderActiveResourceSchedule();
        setupGlobalEventListeners();
    }

    function populateTimeDropdowns() {
        startTimeSelect.innerHTML = '';
        endTimeSelect.innerHTML = '';
        
        for (let time = START_TIMELINE_HOUR; time < END_TIMELINE_HOUR; time += 0.5) {
            startTimeSelect.appendChild(createTimeOption(time));
        }
        for (let time = START_TIMELINE_HOUR + 0.5; time <= END_TIMELINE_HOUR; time += 0.5) {
            endTimeSelect.appendChild(createTimeOption(time));
        }
    }

    function createTimeOption(timeValue) {
        const option = document.createElement('option');
        option.value = timeValue;
        
        const period = timeValue >= 12 ? 'PM' : 'AM';
        let displayHour = Math.floor(timeValue);
        if (displayHour > 12) displayHour -= 12;
        if (displayHour === 0) displayHour = 12;
        
        const minutes = timeValue % 1 === 0.5 ? '30' : '00';
        option.textContent = `${displayHour}:${minutes} ${period}`;
        return option;
    }

    function renderTimelineFramework() {
        timelineGrid.innerHTML = '';
        
        TIME_SLOTS.forEach(slot => {
            const row = document.createElement('div');
            row.classList.add('time-slot-row');
            
            const labelCell = document.createElement('div');
            labelCell.classList.add('time-label-cell');
            labelCell.textContent = slot.label;
            
            const scheduleCell = document.createElement('div');
            scheduleCell.classList.add('schedule-cell');
            
            row.appendChild(labelCell);
            row.appendChild(scheduleCell);
            timelineGrid.appendChild(row);
        });

        const overlayContainer = document.createElement('div');
        overlayContainer.classList.add('cards-overlay-container');
        overlayContainer.id = 'cards-overlay-container';
        timelineGrid.appendChild(overlayContainer);
    }

    function renderActiveResourceSchedule() {
        const overlayContainer = document.getElementById('cards-overlay-container');
        if (!overlayContainer) return;
        
        overlayContainer.innerHTML = '';
        const currentResource = resourceSelect.value;
        const schedules = bookingDataStore[currentResource] || [];

        schedules.forEach(booking => {
            const cardWrapper = buildBookingCardElement(booking);
            overlayContainer.appendChild(cardWrapper);
        });
    }

    function buildBookingCardElement(booking) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('card-wrapper');
        
        if (booking.type === 'conflict') {
            wrapper.classList.add('conflict-layout');
        } else {
            wrapper.classList.add(booking.type || 'blue');
        }

        const totalTimelineHours = END_TIMELINE_HOUR - START_TIMELINE_HOUR;
        const relativeStartHour = booking.startTime - START_TIMELINE_HOUR;
        const durationHours = booking.endTime - booking.startTime;
        
        const topPercentage = (relativeStartHour / totalTimelineHours) * 100;
        const heightPercentage = (durationHours / totalTimelineHours) * 100;
        
        wrapper.style.top = `${topPercentage}%`;
        wrapper.style.height = `${heightPercentage}%`;

        const startLabel = formatTimeLabel(booking.startTime);
        const endLabel = formatTimeLabel(booking.endTime);

        if (booking.type === 'conflict') {
            wrapper.innerHTML = `
                <div class="conflict-card">
                    <div class="conflict-header-row">
                        <span>${booking.title}</span>
                        <span class="card-time">${startLabel} - ${endLabel}</span>
                    </div>
                    <div class="card-meta-status">${booking.metaStatus}</div>
                    <div class="conflict-message">Slot is unavailable.</div>
                </div>
            `;
        } else {
            wrapper.innerHTML = `
                <div class="booking-card">
                    <div class="card-details">
                        <h4>${booking.metaStatus}</h4>
                        <p>${booking.title}</p>
                        <span class="card-time">${startLabel} - ${endLabel}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-text-action btn-edit" data-id="${booking.id}">Edit</button>
                        <button class="btn-text-action btn-delete" data-id="${booking.id}">Delete</button>
                    </div>
                </div>
            `;
            
            wrapper.querySelector('.btn-edit').addEventListener('click', () => openBookingForm(booking.id));
            wrapper.querySelector('.btn-delete').addEventListener('click', () => confirmDeleteTracking(booking.id));
        }

        return wrapper;
    }

    function formatTimeLabel(timeValue) {
        const period = timeValue >= 12 ? 'PM' : 'AM';
        let hour = Math.floor(timeValue);
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        const minutes = timeValue % 1 === 0.5 ? '30' : '00';
        return `${hour}:${minutes} ${period}`;
    }

    function checkTimeOverlapConflict(resourceId, startTime, endTime, excludeBookingId = null) {
        const currentBookings = bookingDataStore[resourceId] || [];
        
        return currentBookings.some(booking => {
            if (booking.type === 'conflict' || booking.id === excludeBookingId) return false;
            return (startTime < booking.endTime && endTime > booking.startTime);
        });
    }

    function openBookingForm(editId = null) {
        formErrorMessage.classList.add('hidden');
        formErrorMessage.textContent = '';
        
        const currentResource = resourceSelect.value;
        formResourceId.value = currentResource;
        
        bookingDataStore[currentResource] = bookingDataStore[currentResource].filter(b => b.id !== 'temp-simulated-error');
        renderActiveResourceSchedule();

        if (editId) {
            formTitle.textContent = 'Edit Booking';
            const record = bookingDataStore[currentResource].find(b => b.id === editId);
            if (!record) return;

            bookingIdInput.value = record.id;
            titleInput.value = record.title;
            requestedByInput.value = record.requestedBy;
            dateInput.value = record.date;
            startTimeSelect.value = record.startTime;
            endTimeSelect.value = record.endTime;
            purposeInput.value = record.purpose;
        } else {
            formTitle.textContent = 'New Booking';
            bookingIdInput.value = '';
            titleInput.value = '';
            requestedByInput.value = '';
            dateInput.value = new Date().toISOString().split('T')[0];
            startTimeSelect.selectedIndex = 0;
            endTimeSelect.selectedIndex = 0;
            purposeInput.value = '';
        }

        scheduleView.classList.add('hidden');
        bookingFormSection.classList.remove('hidden');
    }

    function closeBookingForm() {
        bookingFormSection.classList.add('hidden');
        scheduleView.classList.remove('hidden');
        bookingForm.reset();
    }

    function handleFormSubmission(e) {
        e.preventDefault();
        formErrorMessage.classList.add('hidden');
        formErrorMessage.textContent = '';

        const resourceId = formResourceId.value;
        const targetId = bookingIdInput.value;
        const title = titleInput.value.trim();
        const requestedBy = requestedByInput.value.trim();
        const date = dateInput.value;
        const startTime = parseFloat(startTimeSelect.value);
        const endTime = parseFloat(endTimeSelect.value);
        const purpose = purposeInput.value.trim();

        if (!title || !requestedBy || !date) {
            showFormError('Please complete all mandatory parameters.');
            return;
        }

        if (startTime >= endTime) {
            showFormError('Operational error: End time parameter must exceed structural start time.');
            return;
        }

        const hasConflict = checkTimeOverlapConflict(resourceId, startTime, endTime, targetId);
        
        if (hasConflict) {
            showFormError('Booking Conflict: This time slot is already occupied.');
            highlightConflictingState(title, startTime, endTime);
            return;
        }

        if (targetId) {
            const record = bookingDataStore[resourceId].find(b => b.id === targetId);
            if (record) {
                record.title = title;
                record.requestedBy = requestedBy;
                record.date = date;
                record.startTime = startTime;
                record.endTime = endTime;
                record.purpose = purpose;
            }
        } else {
            const newBooking = {
                id: 'booking_' + Date.now(),
                title: title,
                requestedBy: requestedBy,
                date: date,
                startTime: startTime,
                endTime: endTime,
                purpose: purpose,
                type: 'green',
                metaStatus: 'Booked'
            };
            bookingDataStore[resourceId].push(newBooking);
        }

        renderActiveResourceSchedule();
        closeBookingForm();
    }

    function showFormError(message) {
        formErrorMessage.textContent = message;
        formErrorMessage.classList.remove('hidden');
    }

    function highlightConflictingState(title, start, end) {
        closeBookingForm();
        const currentResource = resourceSelect.value;
        
        bookingDataStore[currentResource] = bookingDataStore[currentResource].filter(b => b.id !== 'temp-simulated-error');
        
        bookingDataStore[currentResource].push({
            id: 'temp-simulated-error',
            title: 'Requested',
            requestedBy: 'Error Refusal Diagnostics',
            date: dateInput.value,
            startTime: start,
            endTime: end,
            purpose: title,
            type: 'conflict',
            metaStatus: 'Conflict'
        });
        
        renderActiveResourceSchedule();
    }

    function confirmDeleteTracking(id) {
        activeDeletionTargetId = id;
        deleteModal.classList.remove('hidden');
    }

    function executeDeletionTransaction() {
        if (!activeDeletionTargetId) return;
        
        const currentResource = resourceSelect.value;
        bookingDataStore[currentResource] = bookingDataStore[currentResource].filter(b => b.id !== activeDeletionTargetId);
        
        activeDeletionTargetId = null;
        deleteModal.classList.add('hidden');
        renderActiveResourceSchedule();
    }

    function setupGlobalEventListeners() {
        resourceSelect.addEventListener('change', () => {
            renderActiveResourceSchedule();
        });

        btnOpenBooking.addEventListener('click', () => openBookingForm());
        btnCancelBooking.addEventListener('click', closeBookingForm);
        bookingForm.addEventListener('submit', handleFormSubmission);

        btnDeleteNo.addEventListener('click', () => {
            activeDeletionTargetId = null;
            deleteModal.classList.add('hidden');
        });

        btnDeleteYes.addEventListener('click', executeDeletionTransaction);
    }

    initializeApplication();
});