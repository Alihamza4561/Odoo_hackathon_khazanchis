document.addEventListener('DOMContentLoaded', () => {

    let maintenanceRequests = [];

    let activeDeletionTargetId = null;
    let pendingTechMoveContext = null;

    const PRIORITY_WEIGHTS = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

    const searchInput = document.getElementById('search-input');
    const filterPriority = document.getElementById('filter-priority');
    const sortSelect = document.getElementById('sort-select');
    const btnOpenForm = document.getElementById('btn-open-form');
    
    const formSection = document.getElementById('maintenance-form-section');
    const maintenanceForm = document.getElementById('maintenance-form');
    const formTitleHeading = document.getElementById('form-title');
    const requestIdInput = document.getElementById('request-id');
    const assetIdInput = document.getElementById('asset-id');
    const assetNameInput = document.getElementById('asset-name');
    const issueTitleInput = document.getElementById('issue-title');
    const issueDescInput = document.getElementById('issue-desc');
    const prioritySelect = document.getElementById('priority-select');
    const requestedByInput = document.getElementById('requested-by');
    const formErrorBanner = document.getElementById('form-error-banner');
    
    const btnCancelForm = document.getElementById('btn-cancel-form');
    const toastNotification = document.getElementById('toast-notification');

    const viewModal = document.getElementById('view-modal');
    const btnCloseView = document.getElementById('btn-close-view');
    const techModal = document.getElementById('tech-modal');
    const techSelect = document.getElementById('tech-select');
    const btnCancelTech = document.getElementById('btn-cancel-tech');
    const btnConfirmTech = document.getElementById('btn-confirm-tech');
    const deleteModal = document.getElementById('delete-modal');
    const btnDeleteYes = document.getElementById('btn-delete-yes');
    const btnDeleteNo = document.getElementById('btn-delete-no');

    async function initializeApplication() {
        try {
            const responseData = await window.AssetFlowAPI.listMaintenanceRequests();
            maintenanceRequests = responseData.map(req => ({
                id: req.id,
                assetId: String(req.asset_id),
                assetName: req.asset_name || "Unknown Asset",
                issueTitle: req.issue_title,
                issueDesc: req.issue_description,
                priority: req.priority || "Medium",
                status: req.status || "Pending",
                technician: req.assigned_technician || "",
                requestedBy: req.requested_by || "System",
                createdDate: req.created_date,
                timestamp: Date.now()
            }));
        } catch (err) {
            console.error("Failed to parse Kanban cards from database:", err);
            maintenanceRequests = [];
        }
        renderKanbanWorkspace();
        setupGlobalActionsRegistry();
    }

    function renderKanbanWorkspace() {
        const columns = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];
        
        columns.forEach(status => {
            const container = document.getElementById(`container-${status}`);
            if (container) container.innerHTML = '';
        });

        let processedData = [...maintenanceRequests];

        const searchQuery = searchInput.value.trim().toLowerCase();
        if (searchQuery) {
            processedData = processedData.filter(req => 
                req.assetId.toLowerCase().includes(searchQuery) ||
                req.assetName.toLowerCase().includes(searchQuery) ||
                req.issueTitle.toLowerCase().includes(searchQuery)
            );
        }

        const priorityFilter = filterPriority.value;
        if (priorityFilter !== 'All') {
            processedData = processedData.filter(req => req.priority === priorityFilter);
        }

        const activeSort = sortSelect.value;
        if (activeSort === 'newest') {
            processedData.sort((a, b) => b.timestamp - a.timestamp);
        } else if (activeSort === 'oldest') {
            processedData.sort((a, b) => a.timestamp - b.timestamp);
        } else if (activeSort === 'priority') {
            processedData.sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]);
        }

        const statusCounts = { 'Pending': 0, 'Approved': 0, 'Technician Assigned': 0, 'In Progress': 0, 'Resolved': 0 };

        processedData.forEach(request => {
            statusCounts[request.status]++;
            const targetContainer = document.getElementById(`container-${request.status}`);
            if (targetContainer) {
                const cardElement = buildRequestCardDOM(request);
                targetContainer.appendChild(cardElement);
            }
        });

        columns.forEach(status => {
            const countLabel = document.getElementById(`count-${status}`);
            if (countLabel) countLabel.textContent = statusCounts[status];

            const activeContainer = document.getElementById(`container-${status}`);
            if (activeContainer && activeContainer.children.length === 0) {
                activeContainer.innerHTML = `
                    <div class="empty-column-placeholder">
                        <p>No maintenance requests.</p>
                    </div>
                `;
            }
        });
    }

    function buildRequestCardDOM(request) {
        const card = document.createElement('div');
        card.classList.add('kanban-card');
        if (request.status === 'Resolved') {
            card.classList.add('resolved-card-theme');
        }

        let inlineInfoMeta = '';
        if (request.status === 'Technician Assigned' && request.technician) {
            inlineInfoMeta = `<div class="card-info-pane"><span class="tech-tag-lbl">Technician:</span> ${escapeHtml(request.technician)}</div>`;
        } else if (request.status === 'In Progress') {
            inlineInfoMeta = `<div class="card-info-pane">Execution Progress: Active Workflow</div>`;
        } else if (request.status === 'Resolved' && request.resolvedDate) {
            inlineInfoMeta = `<div class="card-info-pane"><span class="tech-tag-lbl">Resolved:</span> ${request.resolvedDate}</div>`;
        }

        const priorityBadgeClass = `badge-${request.priority.toLowerCase()}`;

        card.innerHTML = `
            <div class="card-top-row">
                <span class="asset-id-lbl">${escapeHtml(request.assetId)}</span>
                <span class="badge ${priorityBadgeClass}">${request.priority}</span>
            </div>
            <h4 class="card-title">${escapeHtml(request.issueTitle)}</h4>
            ${inlineInfoMeta}
            <div class="card-footer-controls">
                <div class="card-action-links">
                    <button class="btn-micro-action btn-view-trigger">View</button>
                    <button class="btn-micro-action btn-edit-trigger">Edit</button>
                    <button class="btn-micro-action btn-delete-trigger">Delete</button>
                </div>
                <div class="card-move-wrapper">
                    <label>Move:</label>
                    <select class="custom-select select-move-dropdown">
                        <option value="Pending" ${request.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Approved" ${request.status === 'Approved' ? 'selected' : ''}>Approved</option>
                        <option value="Technician Assigned" ${request.status === 'Technician Assigned' ? 'selected' : ''}>Technician Assigned</option>
                        <option value="In Progress" ${request.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${request.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
            </div>
        `;

        card.querySelector('.btn-view-trigger').addEventListener('click', () => triggerViewModal(request.id));
        card.querySelector('.btn-edit-trigger').addEventListener('click', () => openMaintenanceForm(request.id));
        card.querySelector('.btn-delete-trigger').addEventListener('click', () => initiateDeleteSequence(request.id));
        
        card.querySelector('.select-move-dropdown').addEventListener('change', (e) => {
            executeMoveTransactionPipeline(request.id, e.target.value);
        });

        return card;
    }

    function openMaintenanceForm(editId = null) {
        formErrorBanner.classList.add('hidden');
        formErrorBanner.textContent = '';

        if (editId) {
            formTitleHeading.textContent = 'Edit Maintenance Request';
            const record = maintenanceRequests.find(r => r.id === editId);
            if (!record) return;

            requestIdInput.value = record.id;
            assetIdInput.value = record.assetId;
            assetNameInput.value = record.assetName;
            issueTitleInput.value = record.issueTitle;
            issueDescInput.value = record.issueDesc;
            prioritySelect.value = record.priority;
            requestedByInput.value = record.requestedBy;
        } else {
            formTitleHeading.textContent = 'Create Maintenance Request';
            requestIdInput.value = '';
            maintenanceForm.reset();
        }

        formSection.classList.remove('hidden');
        formSection.scrollIntoView({ behavior: 'smooth' });
    }

    function closeMaintenanceForm() {
        formSection.classList.add('hidden');
        maintenanceForm.reset();
    }

    function handleFormSubmission(e) {
        e.preventDefault();
        formErrorBanner.classList.add('hidden');

        const targetId = requestIdInput.value;
        const assetId = assetIdInput.value.trim();
        const assetName = assetNameInput.value.trim();
        const issueTitle = issueTitleInput.value.trim();
        const issueDesc = issueDescInput.value.trim();
        const priority = prioritySelect.value;
        const requestedBy = requestedByInput.value.trim();

        if (!assetId || !assetName || !issueTitle || !issueDesc || !requestedBy) {
            formErrorBanner.textContent = 'Validation Failed: Please fill out all mandatory fields.';
            formErrorBanner.classList.remove('hidden');
            return;
        }

        if (targetId) {
            const existingRecord = maintenanceRequests.find(r => r.id === targetId);
            if (existingRecord) {
                existingRecord.assetId = assetId;
                existingRecord.assetName = assetName;
                existingRecord.issueTitle = issueTitle;
                existingRecord.issueDesc = issueDesc;
                existingRecord.priority = priority;
                existingRecord.requestedBy = requestedBy;
                
                triggerToastAlert('Maintenance request updated successfully.');
            }
        } else {
            const newRequest = {
                id: 'req_' + Date.now() + Math.random().toString(36).substr(2, 4),
                assetId: assetId,
                assetName: assetName,
                issueTitle: issueTitle,
                issueDesc: issueDesc,
                priority: priority,
                requestedBy: requestedBy,
                status: 'Pending',
                technician: '',
                resolvedDate: '',
                createdDate: formatSystemDisplayDate(new Date()),
                timestamp: Date.now()
            };
            maintenanceRequests.push(newRequest);
            triggerToastAlert('New maintenance request added successfully.');
        }

        renderKanbanWorkspace();
        closeMaintenanceForm();
    }

    function executeMoveTransactionPipeline(id, destinationStatus) {
        const targetRequest = maintenanceRequests.find(r => r.id === id);
        if (!targetRequest) return;

        if (destinationStatus === 'Technician Assigned' && !targetRequest.technician) {
            pendingTechMoveContext = { id: id, targetStatus: destinationStatus };
            techSelect.selectedIndex = 0;
            techModal.classList.remove('hidden');
            return;
        }

        if (destinationStatus === 'Resolved') {
            targetRequest.resolvedDate = formatSystemDisplayDate(new Date());
        } else {
            targetRequest.resolvedDate = '';
        }

        targetRequest.status = destinationStatus;
        renderKanbanWorkspace();
        triggerToastAlert(`Request moved to ${destinationStatus}.`);
    }

    function triggerViewModal(id) {
        const data = maintenanceRequests.find(r => r.id === id);
        if (!data) return;

        document.getElementById('view-asset-id').textContent = data.assetId;
        document.getElementById('view-asset-name').textContent = data.assetName;
        document.getElementById('view-issue-title').textContent = data.issueTitle;
        document.getElementById('view-issue-desc').textContent = data.issueDesc;
        document.getElementById('view-current-status').textContent = data.status;
        document.getElementById('view-requested-by').textContent = data.requestedBy;
        document.getElementById('view-created-date').textContent = data.createdDate;

        const priorityBadge = document.getElementById('view-badge-priority');
        priorityBadge.textContent = data.priority;
        priorityBadge.className = `badge badge-${data.priority.toLowerCase()}`;

        const techRow = document.getElementById('view-tech-row');
        if (data.technician) {
            document.getElementById('view-technician').textContent = data.technician;
            techRow.style.display = 'block';
        } else {
            techRow.style.display = 'none';
        }

        viewModal.classList.remove('hidden');
    }

    function initiateDeleteSequence(id) {
        activeDeletionTargetId = id;
        deleteModal.classList.remove('hidden');
    }

    function executeDeletionTransaction() {
        if (!activeDeletionTargetId) return;
        
        maintenanceRequests = maintenanceRequests.filter(r => r.id !== activeDeletionTargetId);
        activeDeletionTargetId = null;
        deleteModal.classList.add('hidden');
        
        renderKanbanWorkspace();
        triggerToastAlert('Maintenance request removed successfully.');
    }

    function triggerToastAlert(msg) {
        toastNotification.textContent = msg;
        toastNotification.classList.remove('hidden');
        setTimeout(() => {
            toastNotification.classList.add('hidden');
            toastNotification.textContent = '';
        }, 3000);
    }

    function formatSystemDisplayDate(dateObj) {
        const day = dateObj.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[dateObj.getMonth()]}`;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function setupGlobalActionsRegistry() {
        searchInput.addEventListener('input', renderKanbanWorkspace);
        filterPriority.addEventListener('change', renderKanbanWorkspace);
        sortSelect.addEventListener('change', renderKanbanWorkspace);

        btnOpenForm.addEventListener('click', () => openMaintenanceForm());
        btnCancelForm.addEventListener('click', closeMaintenanceForm);
        maintenanceForm.addEventListener('submit', handleFormSubmission);
        btnCloseView.addEventListener('click', () => viewModal.classList.add('hidden'));

        btnCancelTech.addEventListener('click', () => {
            pendingTechMoveContext = null;
            techModal.classList.add('hidden');
            renderKanbanWorkspace();
        });

        btnConfirmTech.addEventListener('click', () => {
            if (!pendingTechMoveContext) return;
            const target = maintenanceRequests.find(r => r.id === pendingTechMoveContext.id);
            if (target) {
                target.technician = techSelect.value;
                target.status = pendingTechMoveContext.targetStatus;
                triggerToastAlert(`Technician ${techSelect.value} assigned successfully.`);
            }
            pendingTechMoveContext = null;
            techModal.classList.add('hidden');
            renderKanbanWorkspace();
        });

        btnDeleteNo.addEventListener('click', () => {
            activeDeletionTargetId = null;
            deleteModal.classList.add('hidden');
        });

        btnDeleteYes.addEventListener('click', executeDeletionTransaction);
    }

    initializeApplication();
});