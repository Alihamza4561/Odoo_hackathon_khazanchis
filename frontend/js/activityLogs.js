document.addEventListener('DOMContentLoaded', () => {

    let notificationRecords = [];
    
    let activeFilter = 'all';
    let deletionTargetId = null;

    const filterGroupContainer = document.getElementById('filter-group');
    const btnOpenForm = document.getElementById('btn-open-form');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    const notificationTable = document.getElementById('notification-table');
    const listBodyContainer = document.getElementById('notification-list-body');
    const emptyStateView = document.getElementById('empty-state');
    
    const formPanelSection = document.getElementById('form-panel-section');
    const notificationForm = document.getElementById('notification-form');
    const formTypeSelect = document.getElementById('form-type');
    const formMessageInput = document.getElementById('form-message');
    const formTimeInput = document.getElementById('form-time');
    const formStatusSelect = document.getElementById('form-status');
    const formErrorBanner = document.getElementById('form-error-banner');
    
    const btnCancelForm = document.getElementById('btn-cancel-form');
    
    const deleteModal = document.getElementById('delete-modal');
    const btnDeleteYes = document.getElementById('btn-delete-yes');
    const btnDeleteNo = document.getElementById('btn-delete-no');

    async function initializeApplication() {
        try {
            // Fetch live data from backend pipeline
            notificationRecords = await window.AssetFlowAPI.listNotifications();
            notificationRecords.forEach(n => {
                n.timestamp = n.timestamp ? new Date(n.timestamp).getTime() : Date.now();
            });
        } catch (err) {
            console.error("Failed to sync notifications from backend database:", err);
            notificationRecords = [];
        }
        renderInterfacePipeline();
        setupDeclarativeEventListeners();
    }

    function renderInterfacePipeline() {
        listBodyContainer.innerHTML = '';

        let processedDataSet = [...notificationRecords];

        if (activeFilter !== 'all') {
            processedDataSet = processedDataSet.filter(item => item.type === activeFilter);
        }

        const searchQuery = searchInput.value.trim().toLowerCase();
        if (searchQuery) {
            processedDataSet = processedDataSet.filter(item => 
                item.message.toLowerCase().includes(searchQuery)
            );
        }

        if (sortSelect.value === 'newest') {
            processedDataSet.sort((a, b) => b.timestamp - a.timestamp);
        } else if (sortSelect.value === 'oldest') {
            processedDataSet.sort((a, b) => a.timestamp - b.timestamp);
        }

        if (processedDataSet.length === 0) {
            notificationTable.classList.add('hidden');
            emptyStateView.classList.remove('hidden');
            return;
        }

        notificationTable.classList.remove('hidden');
        emptyStateView.classList.add('hidden');

        processedDataSet.forEach(notification => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', notification.id);

            let dotClass = 'alert-dot';
            if (notification.type === 'Approval') dotClass = 'approval-dot';
            if (notification.type === 'Booking') dotClass = 'booking-dot';

            const badgeClass = notification.status === 'Unread' ? 'badge-unread' : 'badge-read';

            tr.innerHTML = `
                <td>
                    <div class="type-indicator-cell">
                        <span class="dot ${dotClass}" title="${notification.type}"></span>
                    </div>
                </td>
                <td><span class="msg-text">${escapeHtmlFormatting(notification.message)}</span></td>
                <td><span class="time-text">${escapeHtmlFormatting(notification.time || notification.time_label)}</span></td>
                <td><span class="badge ${badgeClass}">${notification.status}</span></td>
                <td>
                    <div class="action-cell-container">
                        <button class="btn-utility btn-edit-action">Edit Status</button>
                        <button class="btn-utility btn-delete-action">Delete</button>
                    </div>
                </td>
            `;

            tr.querySelector('.btn-edit-action').addEventListener('click', () => {
                toggleStatusStateTransaction(notification.id);
            });

            tr.querySelector('.btn-delete-action').addEventListener('click', () => {
                interceptDeleteTransactionPrompt(notification.id);
            });

            listBodyContainer.appendChild(tr);
        });
    }

    function toggleStatusStateTransaction(targetId) {
        const item = notificationRecords.find(n => n.id === targetId);
        if (item) {
            item.status = (item.status === 'Unread') ? 'Read' : 'Unread';
            renderInterfacePipeline();
        }
    }

    function interceptDeleteTransactionPrompt(targetId) {
        deletionTargetId = targetId;
        deleteModal.classList.remove('hidden');
    }

    function executeDeletionTransaction() {
        if (!deletionTargetId) return;
        notificationRecords = notificationRecords.filter(n => n.id !== deletionTargetId);
        deletionTargetId = null;
        deleteModal.classList.add('hidden');
        renderInterfacePipeline();
    }

    function handleFormSubmission(e) {
        e.preventDefault();
        formErrorBanner.classList.add('hidden');
        formErrorBanner.textContent = '';

        const type = formTypeSelect.value;
        const message = formMessageInput.value.trim();
        const time = formTimeInput.value.trim();
        const status = formStatusSelect.value;

        if (!type || !message || !time || !status) {
            formErrorBanner.textContent = 'All verification fields are strictly mandatory fields.';
            formErrorBanner.classList.remove('hidden');
            return;
        }

        const freshNotification = {
            id: 'notif_' + Date.now() + Math.random().toString(36).substr(2, 4),
            type: type,
            message: message,
            time: time,
            status: status,
            timestamp: Date.now() 
        };

        notificationRecords.unshift(freshNotification);

        notificationForm.reset();
        formPanelSection.classList.add('hidden');
        renderInterfacePipeline();
    }

    function setupDeclarativeEventListeners() {
        filterGroupContainer.addEventListener('click', (e) => {
            const clickTarget = e.target.closest('.btn-filter');
            if (!clickTarget) return;

            document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
            clickTarget.classList.add('active');

            activeFilter = clickTarget.getAttribute('data-filter');
            renderInterfacePipeline();
        });

        searchInput.addEventListener('input', renderInterfacePipeline);
        sortSelect.addEventListener('change', renderInterfacePipeline);

        btnOpenForm.addEventListener('click', () => {
            formErrorBanner.classList.add('hidden');
            notificationForm.reset();
            formPanelSection.classList.remove('hidden');
            formPanelSection.scrollIntoView({ behavior: 'smooth' });
        });

        btnCancelForm.addEventListener('click', () => {
            notificationForm.reset();
            formPanelSection.classList.add('hidden');
        });

        notificationForm.addEventListener('submit', handleFormSubmission);

        btnDeleteNo.addEventListener('click', () => {
            deletionTargetId = null;
            deleteModal.classList.add('hidden');
        });

        btnDeleteYes.addEventListener('click', executeDeletionTransaction);
    }

    function escapeHtmlFormatting(stringInput) {
        const parsingDivElement = document.createElement('div');
        parsingDivElement.textContent = stringInput;
        return parsingDivElement.innerHTML;
    }

    initializeApplication();
});