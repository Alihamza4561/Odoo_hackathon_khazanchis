/* AssetFlow — role-handler.js
   Shared on every page. Drives the "Viewing as" role switcher
   in the topbar (for frontend demo purposes, ahead of real auth),
   hides/shows elements marked data-roles="admin,asset-manager",
   and highlights the active sidebar link.*/
(function () {
  const STORAGE_KEY = 'af_role';
  const DEFAULT_ROLE = 'admin';

  const ROLE_LABELS = {
    'admin': 'Admin',
    'asset-manager': 'Asset Manager',
    'department-head': 'Department Head',
    'employee': 'Employee',
  };

  function getRole() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_ROLE;
  }

  function setRole(role) {
    localStorage.setItem(STORAGE_KEY, role);
    applyRole();
    document.dispatchEvent(new CustomEvent('af:role-changed', { detail: { role } }));
  }

  // Elements with data-roles="admin,asset-manager" only show for those roles.
  // Elements with data-roles-hide="employee" hide for those roles (inverse, rarely needed).
  function applyRole() {
    const role = getRole();

    document.querySelectorAll('[data-role-select]').forEach((el) => {
      el.value = role;
    });

    document.querySelectorAll('[data-roles]').forEach((el) => {
      const allowed = el.getAttribute('data-roles').split(',').map((s) => s.trim());
      el.style.display = allowed.includes(role) ? '' : 'none';
    });

    document.querySelectorAll('[data-current-role-label]').forEach((el) => {
      el.textContent = ROLE_LABELS[role] || role;
    });
  }

  function highlightActiveNav() {
    const current = document.body.getAttribute('data-page');
    if (!current) return;
    document.querySelectorAll('.nav-link[data-nav]').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-nav') === current);
    });
  }

  function wireSidebarToggle() {
    const btn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;
    const mq = window.matchMedia('(max-width:900px)');
    const sync = () => { btn.style.display = mq.matches ? 'flex' : 'none'; };
    sync();
    mq.addEventListener('change', sync);
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyRole();
    highlightActiveNav();
    wireSidebarToggle();

    document.querySelectorAll('[data-role-select]').forEach((sel) => {
      sel.addEventListener('change', (e) => setRole(e.target.value));
    });
  });

  window.AssetFlowRole = { getRole, setRole, applyRole, ROLE_LABELS };
})();
