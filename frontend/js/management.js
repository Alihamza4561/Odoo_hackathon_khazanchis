/* script.js */

document.addEventListener('DOMContentLoaded', () => {

    // --- Core Memory Architecture Data Pipeline - Initialized Empty ---
    let maintenanceRequests = [];

    let activeDeletionTargetId = null;
    let pendingTechMoveContext = null;

    const PRIORITY_WEIGHTS = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

    // --- DOM Elements Cache Engine ---
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

    // Modals References
    const viewModal = document.getElementById('view-modal');
    const btnCloseView = document.getElementById('btn-close-view');
    const techModal = document.getElementById('tech-modal');
    const techSelect = document.getElementById('tech-select');
    const btnCancelTech = document.getElementById('btn-cancel-tech');
    const btnConfirmTech = document.getElementById('btn-confirm-tech');
    const deleteModal = document.getElementById('delete-modal');
    const btnDeleteYes = document.getElementById('btn-delete-yes');
    const btnDeleteNo = document.getElementById('btn-delete-no');

    // --- Application Initialization Module ---
    function initializeApplication() {
        renderKanbanWorkspace();
        setupGlobalActionsRegistry();
    }

    // --- Kanban Layout Rendering Framework Engine ---
    function renderKanbanWorkspace() {
        const columns = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];
        
        // 1. Reset each column storage baseline arrays configuration state metrics mapping
        columns.forEach(status => {
            const container = document.getElementById(`container-${status}`);
            if (container) container.innerHTML = '';
        });

        // 2. Filter & Sort Memory State Extraction Core Arrays Calculations
        let processedData = [...maintenanceRequests];

        // Search Verification Rule Evaluation
        const searchQuery = searchInput.value.trim().toLowerCase();
        if (searchQuery) {
            processedData = processedData.filter(req => 
                req.assetId.toLowerCase().includes(searchQuery) ||
                req.assetName.toLowerCase().includes(searchQuery) ||
                req.issueTitle.toLowerCase().includes(searchQuery)
            );
        }

        // Priority Filtration Extraction Evaluation Rule
        const priorityFilter = filterPriority.value;
        if (priorityFilter !== 'All') {
            processedData = processedData.filter(req => req.priority === priorityFilter);
        }

        // Chronological Metric Array Sorting Execution Logic Maps
        const activeSort = sortSelect.value;
        if (activeSort === 'newest') {
            processedData.sort((a, b) => b.timestamp - a.timestamp);
        } else if (activeSort === 'oldest') {
            processedData.sort((a, b) => a.timestamp - b.timestamp);
        } else if (activeSort === 'priority') {
            processedData.sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]);
        }

        // 3. Counter Initialization Map Registry Setup Loop
        const statusCounts = { 'Pending': 0, 'Approved': 0, 'Technician Assigned': 0, 'In Progress': 0, 'Resolved': 0 };

        // 4. Dom Fragment Assembly Pipeline Iteration Framework Loop
        processedData.forEach(request => {
            statusCounts[request.status]++;
            const targetContainer = document.getElementById(`container-${request.status}`);
            if (targetContainer) {
                const cardElement = buildRequestCardDOM(request);
                targetContainer.appendChild(cardElement);
            }
        });

        // 5. Update Column Status Header Metrics Indicators Value Trackers
        columns.forEach(status => {
            const countLabel = document.getElementById(`count-${status}`);
            if (countLabel) countLabel.textContent = statusCounts[status];

            // Render visual fallback empty notice panel elements safely if no entries pass constraints
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

        // Generate contextual tag info strings values mappings
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

        // Safe closure action registration mapping assignments binding triggers
        card.querySelector('.btn-view-trigger').addEventListener('click', () => triggerViewModal(request.id));
        card.querySelector('.btn-edit-trigger').addEventListener('click', () => openMaintenanceForm(request.id));
        card.querySelector('.btn-delete-trigger').addEventListener('click', () => initiateDeleteSequence(request.id));
        
        card.querySelector('.select-move-dropdown').addEventListener('change', (e) => {
            executeMoveTransactionPipeline(request.id, e.target.value);
        });

        return card;
    }

    // --- State Transaction Pipelines Management Handlers ---
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

        // Structural Parameter Validation Engine Rules
        if (!assetId || !assetName || !issueTitle || !issueDesc || !requestedBy) {
            formErrorBanner.textContent = 'Validation Failed: Please fill out all mandatory request input parameters fields.';
            formErrorBanner.classList.remove('hidden');
            return;
        }

        if (targetId) {
            // Memory Array Data Record Updates Transaction Mutation
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
            // New Record Insertion Pipeline Execution Transaction Mode
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
            triggerToastAlert('New maintenance request added to Pending successfully.');
        }

        renderKanbanWorkspace();
        closeMaintenanceForm();
    }

    function executeMoveTransactionPipeline(id, destinationStatus) {
        const targetRequest = maintenanceRequests.find(r => r.id === id);
        if (!targetRequest) return;

        if (destinationStatus === 'Technician Assigned' && !targetRequest.technician) {
            // Intermediate state handler capture interceptor rule for sub-dialog modal validation trigger mapping
            pendingTechMoveContext = { id: id, targetStatus: destinationStatus };
            techSelect.selectedIndex = 0;
            techModal.classList.remove('hidden');
            return;
        }

        // Apply final metrics changes dynamically if moving into final baseline resolution metrics states rules
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

    // --- Declarative Framework Utility Helpers ---
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
        const month = months[dateObj.getMonth()];
        return `${day} ${month}`;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Declarative Event Infrastructure Wiring Registry Mapping Layer ---
    function setupGlobalActionsRegistry() {
        
        // Toolbar Stream Interceptors Filter Event Registry Listeners Mapping Rules
        searchInput.addEventListener('input', renderKanbanWorkspace);
        filterPriority.addEventListener('change', renderKanbanWorkspace);
        sortSelect.addEventListener('change', renderKanbanWorkspace);

        // Standard Panels Visibility Toggling Interface Bindings Elements
        btnOpenForm.addEventListener('click', () => openMaintenanceForm());
        btnCancelForm.addEventListener('click', closeMaintenanceForm);
        maintenanceForm.addEventListener('submit', handleFormSubmission);

        // Core General Modal View Controls Closures Triggers Mappings Interceptors
        btnCloseView.addEventListener('click', () => viewModal.classList.add('hidden'));

        // Technicians Processing Sub-Modal Interceptor Workflow Buttons Mapping Elements Actions
        btnCancelTech.addEventListener('click', () => {
            pendingTechMoveContext = null;
            techModal.classList.add('hidden');
            renderKanbanWorkspace(); // Redraw system board state metrics layout map boundary
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

        // Global Deletion Destruction Validation Confirmation Action Triggers Interceptors
        btnDeleteNo.addEventListener('click', () => {
            activeDeletionTargetId = null;
            deleteModal.classList.add('hidden');
        });

        btnDeleteYes.addEventListener('click', executeDeletionTransaction);
    }

    // Execute application routine baseline setup operations loops
    initializeApplication();
});