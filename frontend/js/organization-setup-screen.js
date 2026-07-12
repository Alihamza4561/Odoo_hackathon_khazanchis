document.addEventListener('DOMContentLoaded', () => {
    let activeTabId = null;

    const tabButtons = document.querySelectorAll('.tab-btn');
    const createButton = document.getElementById('createBtn');
    const sections = document.querySelectorAll('.content-section');
    const footerActionZone = document.getElementById('footerActionZone');
    const formContainer = document.getElementById('formContainer');

    const FormSchemas = {
        departments: {
            title: 'Create Department',
            editableColumnIndex: 1, // "Head" column index position
            fields: [
                { id: 'deptName', label: 'Department Name', type: 'text', required: true },
                { id: 'deptHead', label: 'Department Head', type: 'text', required: true },
                { id: 'parentDept', label: 'Parent Department', type: 'text', required: false },
                { id: 'deptStatus', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ]
        },
        categories: {
            title: 'Create Category',
            editableColumnIndex: 1, // "Description" column index position
            fields: [
                { id: 'catName', label: 'Category Name', type: 'text', required: true },
                { id: 'catDesc', label: 'Description', type: 'textarea', required: true },
                { id: 'catStatus', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ]
        },
        employees: {
            title: 'Create Employee',
            editableColumnIndex: 0, // "Employee Name" column index position
            fields: [
                { id: 'empName', label: 'Employee Name', type: 'text', required: true },
                { id: 'empDept', label: 'Department', type: 'text', required: true },
                { id: 'empDesignation', label: 'Designation', type: 'text', required: true },
                { id: 'empStatus', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ]
        }
    };

    function initApp() {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                handleTabSwitch(e.currentTarget.getAttribute('data-target'));
            });
        });

        createButton.addEventListener('click', handleCreateRequest);

        sections.forEach(section => {
            section.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-btn')) {
                    handleRowEditToggle(e.target);
                } else if (e.target.classList.contains('delete-btn')) {
                    handleRowDeletion(e.target);
                } else if (e.target.classList.contains('badge')) {
                    handleInlineBadgeToggle(e.target);
                }
            });
        });
    }

    function handleTabSwitch(targetTabId) {
        closeFormLayout();

        if (activeTabId === targetTabId) {
            return;
        }

        activeTabId = targetTabId;

        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetTabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        sections.forEach(section => {
            if (section.id === targetTabId) {
                section.classList.remove('hidden');
                void section.offsetWidth; 
                section.classList.add('visible-state');
            } else {
                section.classList.remove('visible-state');
                section.classList.add('hidden');
            }
        });

        footerActionZone.classList.remove('hidden');
    }

    /**
     * @param {HTMLElement} buttonElement 
     */
    function handleRowEditToggle(buttonElement) {
        const row = buttonElement.closest('tr');
        if (!row || !activeTabId) return;

        const schema = FormSchemas[activeTabId];
        const targetCell = row.cells[schema.editableColumnIndex];
        const isEditing = buttonElement.classList.contains('editing-mode');

        if (!isEditing) {
            buttonElement.classList.add('editing-mode');
            buttonElement.textContent = 'Save';
            row.classList.add('row-in-edit-mode'); 

            const currentText = targetCell.textContent.trim();
            targetCell.innerHTML = `<input type="text" class="table-inline-input" value="${escapeHtml(currentText)}">`;
            const inputField = targetCell.querySelector('input');
            if (inputField) inputField.focus();

        } else {
            const inputField = targetCell.querySelector('input');
            if (inputField) {
                const updatedValue = inputField.value.trim() || '—';
                targetCell.textContent = updatedValue;
            }

            buttonElement.classList.remove('editing-mode');
            buttonElement.textContent = 'Edit';
            row.classList.remove('row-in-edit-mode');
        }
    }

    /**
     * @param {HTMLElement} badgeElement 
     */
    function handleInlineBadgeToggle(badgeElement) {
        const parentRow = badgeElement.closest('tr');
        if (!parentRow || !parentRow.classList.contains('row-in-edit-mode')) return;

        if (badgeElement.classList.contains('badge-active')) {
            badgeElement.classList.remove('badge-active');
            badgeElement.classList.add('badge-inactive');
            badgeElement.textContent = 'Inactive';
        } else {
            badgeElement.classList.remove('badge-inactive');
            badgeElement.classList.add('badge-active');
            badgeElement.textContent = 'Active';
        }
    }

    function handleRowDeletion(buttonElement) {
        const row = buttonElement.closest('tr');
        if (!row) return;
        
        row.style.transition = `all ${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--transition-speed'))}s ease`;
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            row.remove();
        }, 300);
    }

    function handleCreateRequest() {
        if (!activeTabId) return;

        closeFormLayout();
        footerActionZone.classList.add('hidden');

        const schema = FormSchemas[activeTabId];
        if (!schema) return;

        const formMarkup = renderFormFromSchema(schema);
        formContainer.innerHTML = formMarkup;
        formContainer.classList.remove('hidden');

        const generationForm = formContainer.querySelector('#dynamicActionForm');
        generationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            executeFormSave(generationForm);
        });

        formContainer.querySelector('#cancelFormBtn').addEventListener('click', closeFormLayout);
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function renderFormFromSchema(schema) {
        let fieldsHtml = '';

        schema.fields.forEach(field => {
            const isFullWidth = field.type === 'textarea' ? 'form-group-full' : '';
            fieldsHtml += `
                <div class="form-control-block ${isFullWidth}">
                    <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
            `;

            if (field.type === 'select') {
                fieldsHtml += `<select id="${field.id}" class="form-select" ${field.required ? 'required' : ''}>`;
                field.options.forEach(opt => {
                    fieldsHtml += `<option value="${opt}">${opt}</option>`;
                });
                fieldsHtml += `</select>`;
            } else if (field.type === 'textarea') {
                fieldsHtml += `<textarea id="${field.id}" class="form-input" rows="3" ${field.required ? 'required' : ''}></textarea>`;
            } else {
                fieldsHtml += `<input type="${field.type}" id="${field.id}" class="form-input" ${field.required ? 'required' : ''}>`;
            }

            fieldsHtml += `</div>`;
        });

        return `
            <form id="dynamicActionForm" autocomplete="off">
                <div class="form-title">${schema.title}</div>
                <div class="form-grid">
                    ${fieldsHtml}
                </div>
                <div class="form-actions-row">
                    <button type="button" id="cancelFormBtn" class="btn btn-cancel">Cancel</button>
                    <button type="submit" class="btn btn-save">Save</button>
                </div>
            </form>
        `;
    }

    function executeFormSave(formElement) {
        const targetTableBody = document.getElementById(`${activeTabId}TableBody`);
        if (!targetTableBody) return;

        const schema = FormSchemas[activeTabId];
        const rowValues = [];
        let statusValue = 'Active';

        schema.fields.forEach(field => {
            const inputNode = formElement.querySelector(`#${field.id}`);
            if (field.id.toLowerCase().includes('status')) {
                statusValue = inputNode.value;
            } else {
                rowValues.push(inputNode.value || '—');
            }
        });

        const newRow = document.createElement('tr');
        
        let tdElementsHtml = '';
        rowValues.forEach(val => {
            tdElementsHtml += `<td>${escapeHtml(val)}</td>`;
        });

        const badgeClass = statusValue === 'Active' ? 'badge-active' : 'badge-inactive';
        tdElementsHtml += `
            <td><span class="badge ${badgeClass}">${statusValue}</span></td>
            <td>
                <div class="actions-cell-container">
                    <button class="btn edit-btn">Edit</button>
                    <button class="btn delete-btn">Delete</button>
                </div>
            </td>
        `;

        newRow.innerHTML = tdElementsHtml;
        targetTableBody.appendChild(newRow);

        closeFormLayout();
    }

    function closeFormLayout() {
        formContainer.classList.add('hidden');
        formContainer.innerHTML = '';
        
        if (activeTabId) {
            footerActionZone.classList.remove('hidden');
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
    }

    initApp();
});