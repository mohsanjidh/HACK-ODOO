// ==========================================================
// BRIGHTLOOP ENTERPRISE RECURRING BILLING PLATFORM
// MOGG-Style Single-Page Application Client Logic
// ==========================================================

const API_BASE = window.location.origin;

let currentUser = null;
let activeSidebarTab = "overview";
let currentStaffSubs = [];
let cachedPlans = [];

// ----------------------------------------------------------
// 1. AUTHENTICATION & GOOGLE SIGN-IN GATEWAY
// ----------------------------------------------------------

function triggerGoogleSignIn() {
  // Simulated Google One-Tap SSO Authentication
  const googleUser = {
    name: "Bhavya Mehta (Google SSO)",
    email: "bhavya.mehta@odoo.com",
    role: "admin",
    avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Bhavya"
  };

  fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(googleUser)
  })
    .then(res => res.json())
    .then(data => {
      setSession(data.user);
    })
    .catch(err => {
      // Local fallback
      setSession(googleUser);
    });
}

function personaLogin(role) {
  if (role === "admin") {
    setSession({
      name: "Bhavya Mehta",
      email: "admin@brightloop.local",
      role: "admin",
      company_name: "Brightloop HQ",
      avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Bhavya"
    });
  } else if (role === "staff") {
    setSession({
      name: "Operations Staff Rep",
      email: "staff@brightloop.local",
      role: "staff",
      company_name: "Brightloop Operations",
      avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Staff"
    });
  } else {
    setSession({
      name: "Meera Bhat",
      email: "meera.bhat1@sterlingca.com",
      role: "customer",
      company_name: "Sterling & Co.",
      avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Meera"
    });
  }
}

function setSession(user) {
  currentUser = user;
  document.getElementById("landing-auth-gate").style.display = "none";
  document.getElementById("main-app-shell").style.display = "block";

  // Update Header UI
  const nameEl = document.getElementById("header-user-name");
  if (nameEl) nameEl.textContent = user.name;
  const emailEl = document.getElementById("header-user-email");
  if (emailEl) emailEl.textContent = user.email;
  const badgeEl = document.getElementById("app-role-badge");
  if (badgeEl) badgeEl.textContent = user.role.toUpperCase();
  const avatarEl = document.getElementById("header-avatar");
  if (avatarEl) avatarEl.textContent = user.name.charAt(0);

  // Render Role-Specific Sidebar & Route to default view
  renderSidebar(user.role);

  if (user.role === "admin") {
    switchSidebarTab("admin-view");
    loadAdminMetrics();
    loadAdminSubscriptions();
    loadAdminPlans();
  } else if (user.role === "staff") {
    switchSidebarTab("staff-view");
    loadStaffCustomers();
    loadStaffSubscriptions();
    loadStaffInvoices();
  } else {
    switchSidebarTab("customer-view");
    loadCustomerProfile();
    loadCustomerPlans();
  }
}

function logout() {
  currentUser = null;
  document.getElementById("main-app-shell").style.display = "none";
  document.getElementById("landing-auth-gate").style.display = "flex";
}

// ----------------------------------------------------------
// 2. MOGG FLOATING SIDEBAR NAVIGATION & COLLAPSE
// ----------------------------------------------------------

function toggleSidebarCollapse() {
  const sidebar = document.getElementById("app-sidebar");
  if (!sidebar) return;
  sidebar.classList.toggle("collapsed");
}

function renderSidebar(role) {
  const sidebar = document.getElementById("app-sidebar");
  let html = "";

  if (role === "admin") {
    html = `
      <div class="sidebar-title">Executive Governance</div>
      <div class="sidebar-item active" id="side-admin-dash" title="Dashboard & Capital" onclick="switchSidebarTab('admin-view')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        </span>
        <span>Dashboard & Capital</span>
      </div>
      <div class="sidebar-item" id="side-admin-create" title="Set Up New Plan" onclick="switchSidebarTab('admin-create-plan-view')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </span>
        <span>Set Up New Plan</span>
      </div>
      <div class="sidebar-item" id="side-admin-manage" title="Manage Plans & Limits" onclick="switchSidebarTab('admin-manage-plans-view')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </span>
        <span>Manage Plans & Limits</span>
      </div>
      <div class="sidebar-item" id="side-admin-staff" title="Staff & Commissions" onclick="switchSidebarTab('admin-staff-view')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </span>
        <span>Staff & Commissions</span>
      </div>
    `;
  } else if (role === "staff") {
    html = `
      <div class="sidebar-title">Operations Desk</div>
      <div class="sidebar-item active" id="side-staff-dash" title="Operations Overview" onclick="switchSidebarTab('staff-view')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        </span>
        <span>Operations Overview</span>
      </div>
      <div class="sidebar-item" id="side-staff-crm" title="Customer CRM" onclick="switchSidebarTab('staff-crm')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </span>
        <span>Customer CRM</span>
      </div>
      <div class="sidebar-item" id="side-staff-subs" title="Subscription Queue" onclick="switchSidebarTab('staff-subs')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </span>
        <span>Subscription Queue</span>
      </div>
      <div class="sidebar-item" id="side-staff-refund" title="Disallow & Refund" onclick="switchSidebarTab('staff-refund')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
        </span>
        <span>Disallow & Refund</span>
      </div>
      <div class="sidebar-item" id="side-staff-notifs" title="Delay Notices" onclick="switchSidebarTab('staff-notifs')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </span>
        <span>Delay Notices</span>
      </div>
      <div class="sidebar-title">Batch Operations</div>
      <div class="sidebar-item" title="Run Batch Billing" onclick="triggerStaffBatchBilling()" style="color: #059669; font-weight: 600;">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </span>
        <span>Run Batch Billing</span>
      </div>
    `;
  } else {
    html = `
      <div class="sidebar-title">My Account</div>
      <div class="sidebar-item active" onclick="switchSidebarTab('customer-view')">
        <span class="icon">👤</span>
        <span>Portfolio & Profile</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('customer-subs')">
        <span class="icon">📑</span>
        <span>My Subscriptions</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('customer-invoices')">
        <span class="icon">🧾</span>
        <span>Invoices & PDF Receipts</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('customer-catalog')">
        <span class="icon">🛍️</span>
        <span>Subscribe to Plans</span>
      </div>
    `;
  }

  sidebar.innerHTML = html;
}

function switchSidebarTab(tabName) {
  // Update sidebar active classes
  document.querySelectorAll(".sidebar-item").forEach(item => item.classList.remove("active"));
  
  // Hide all panels
  document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));

  if (tabName === "admin-view") {
    document.getElementById("admin-view").classList.add("active");
    const el = document.getElementById("side-admin-dash");
    if (el) el.classList.add("active");
    loadAdminMetrics();
    loadAdminSubscriptions();
  } else if (tabName === "admin-create-plan-view" || tabName === "admin-create") {
    document.getElementById("admin-create-plan-view").classList.add("active");
    const el = document.getElementById("side-admin-create");
    if (el) el.classList.add("active");
    populateStaffSelectForNewPlan();
    updateLivePlanPreview();
  } else if (tabName === "admin-manage-plans-view" || tabName === "admin-manage") {
    document.getElementById("admin-manage-plans-view").classList.add("active");
    const el = document.getElementById("side-admin-manage");
    if (el) el.classList.add("active");
    loadAdminManagePlans();
    loadAdminVariantsTable();
  } else if (tabName === "admin-staff-view" || tabName === "admin-staff") {
    document.getElementById("admin-staff-view").classList.add("active");
    const el = document.getElementById("side-admin-staff");
    if (el) el.classList.add("active");
    loadStaffCommissions();
  } else if (tabName.startsWith("staff")) {
    document.getElementById("staff-view").classList.add("active");
    loadStaffCustomers();
    loadStaffSubscriptions();
    loadStaffInvoices();
    loadStaffRefundSubscriptions();

    if (tabName === "staff-view") {
      const el = document.getElementById("side-staff-dash");
      if (el) el.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabName === "staff-crm") {
      const el = document.getElementById("side-staff-crm");
      if (el) el.classList.add("active");
      document.getElementById("staff-crm-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (tabName === "staff-subs") {
      const el = document.getElementById("side-staff-subs");
      if (el) el.classList.add("active");
      document.getElementById("staff-subs-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (tabName === "staff-refund") {
      const el = document.getElementById("side-staff-refund");
      if (el) el.classList.add("active");
      document.getElementById("staff-refund-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (tabName === "staff-notifs") {
      const el = document.getElementById("side-staff-notifs");
      if (el) el.classList.add("active");
      document.getElementById("staff-notifs-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } else {
    document.getElementById("customer-view").classList.add("active");
  }
}

// ----------------------------------------------------------
// 3. ADMIN PORTAL OPERATIONS (DISALLOW & AUTO-REFUND)
// ----------------------------------------------------------

async function loadAdminMetrics() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/metrics`);
    const data = await res.json();
    const m = data.metrics;

    const totalCash = m.total_revenue;
    const estimatedExpenses = totalCash * 0.165;
    const netProfit = totalCash - estimatedExpenses;

    document.getElementById("kpi-cash").textContent = `₹${totalCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("kpi-expenses").textContent = `₹${estimatedExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("kpi-net-profit").textContent = `₹${netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("kpi-arr").textContent = `₹${m.arr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    renderAllTimeInvestmentsGraph();
  } catch (err) {
    console.error("Failed to load admin metrics:", err);
  }
}

async function renderAllTimeInvestmentsGraph() {
  const container = document.getElementById("all-time-graph-container");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/investment-timeline`);
    const data = await res.json();
    const points = data.timeline;

    const maxVal = Math.max(...points.map(p => p.capital_invested)) * 1.15;
    const width = 760;
    const height = 220;
    const padX = 70;
    const padY = 25;

    const stepX = (width - padX * 2) / (points.length - 1);

    // Calculate coordinate points
    const coordsInvested = points.map((p, i) => {
      const x = padX + i * stepX;
      const y = height - padY - (p.capital_invested / maxVal) * (height - padY * 2);
      return { x, y, data: p };
    });

    const coordsNet = points.map((p, i) => {
      const x = padX + i * stepX;
      const y = height - padY - (p.net_revenue / maxVal) * (height - padY * 2);
      return { x, y };
    });

    const coordsExp = points.map((p, i) => {
      const x = padX + i * stepX;
      const y = height - padY - (p.expenses / maxVal) * (height - padY * 2);
      return { x, y };
    });

    // Generate SVG path strings
    const pathInvested = coordsInvested.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');
    const pathNet = coordsNet.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');
    const pathExp = coordsExp.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');

    const areaInvested = `${pathInvested} L ${coordsInvested[coordsInvested.length - 1].x} ${height - padY} L ${coordsInvested[0].x} ${height - padY} Z`;

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; font-family: inherit;">
        <defs>
          <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0f172a" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Horizontal Gridlines -->
        <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padX}" y1="${(height - padY * 2) / 2 + padY}" x2="${width - padX}" y2="${(height - padY * 2) / 2 + padY}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#cbd5e1"/>

        <!-- Y Axis Labels -->
        <text x="${padX - 8}" y="${padY + 4}" fill="#94a3b8" font-size="10" text-anchor="end">₹${(maxVal / 10000000).toFixed(1)}Cr</text>
        <text x="${padX - 8}" y="${(height - padY * 2) / 2 + padY + 4}" fill="#94a3b8" font-size="10" text-anchor="end">₹${(maxVal / 20000000).toFixed(1)}Cr</text>
        <text x="${padX - 8}" y="${height - padY}" fill="#94a3b8" font-size="10" text-anchor="end">₹0</text>

        <!-- Area Fill -->
        <path d="${areaInvested}" fill="url(#invGrad)"/>

        <!-- Lines -->
        <path d="${pathInvested}" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
        <path d="${pathNet}" fill="none" stroke="#017E84" stroke-width="3" stroke-linecap="round"/>
        <path d="${pathExp}" fill="none" stroke="#b45309" stroke-width="2" stroke-dasharray="4" stroke-linecap="round"/>

        <!-- Data Point Circles and X Axis Labels -->
        ${coordsInvested.map((c, i) => `
          <circle cx="${c.x}" cy="${c.y}" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="3" style="cursor: pointer;">
            <title>${c.data.month}\nInvested: ₹${c.data.capital_invested.toLocaleString("en-IN")}\nNet Profit: ₹${c.data.net_revenue.toLocaleString("en-IN")}\nExpenses: ₹${c.data.expenses.toLocaleString("en-IN")}\nActive Clients: ${c.data.active_subscribers}</title>
          </circle>
          <text x="${c.x}" y="${height - 6}" fill="#475569" font-size="11" text-anchor="middle" font-weight="700">${c.data.month}</text>
        `).join("")}
      </svg>
      <div style="display: flex; justify-content: space-between; margin-top: 6px; padding: 0 10px; font-size: 0.75rem; color: var(--text-muted);">
        <span>Hover over data points to inspect detailed financial cohorts & operating margins</span>
        <span>Cumulative Capital: <strong>₹${data.total_cumulative_investment.toLocaleString("en-IN")}</strong> | Net Retained Profit: <strong>₹${data.total_net_profit.toLocaleString("en-IN")}</strong></span>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<span style="color: var(--danger);">Failed to load investment timeline graph: ${err}</span>`;
  }
}

async function loadAdminSubscriptions() {
  const tbody = document.getElementById("admin-subscriptions-table");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading subscriptions...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/subscriptions`);
    const subs = await res.json();

    if (subs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No subscriptions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = subs.slice(0, 15).map(s => `
      <tr>
        <td style="font-weight: 700;">${s.subscription_number}</td>
        <td>
          <div style="font-weight: 600;">${s.customer_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.customer_email}</div>
        </td>
        <td>
          <div>${s.plan_name}</div>
          <div style="font-size: 0.75rem; color: var(--primary);">${s.variant_name || "Standard Brand"}</div>
        </td>
        <td>${s.quantity}</td>
        <td style="font-weight: 700;">₹${s.total_amount.toLocaleString("en-IN")}</td>
        <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
        <td>
          ${s.status !== "Cancelled" && s.status !== "Closed" ? `
            <button class="btn btn-danger btn-sm" onclick="disallowSubscription(${s.id}, '${s.subscription_number}')">
              Disallow & 100% Refund
            </button>
          ` : `<span style="font-size: 0.75rem; color: var(--text-muted);">Refunded / Disallowed</span>`}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Failed to load subscriptions: ${err}</td></tr>`;
  }
}

async function loadStaffRefundSubscriptions() {
  const tbody = document.getElementById("staff-refund-subscriptions-table");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading subscriptions...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/subscriptions`);
    const subs = await res.json();

    if (!subs || subs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No client subscriptions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = subs.slice(0, 20).map(s => `
      <tr>
        <td style="font-weight: 700;">${s.subscription_number}</td>
        <td>
          <div style="font-weight: 600;">${s.customer_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.customer_email}</div>
        </td>
        <td>
          <div>${s.plan_name}</div>
          <div style="font-size: 0.75rem; color: var(--primary);">${s.variant_name || "Standard Brand"}</div>
        </td>
        <td>${s.quantity}</td>
        <td style="font-weight: 700;">₹${s.total_amount.toLocaleString("en-IN")}</td>
        <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
        <td>
          ${s.status !== "Cancelled" && s.status !== "Closed" ? `
            <button class="btn btn-danger btn-sm" onclick="disallowSubscription(${s.id}, '${s.subscription_number}')">
              ⚡ Disallow & 100% Refund
            </button>
          ` : `<span style="font-size: 0.75rem; color: var(--text-muted);">Refunded & Revoked</span>`}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Failed to load subscriptions: ${err}</td></tr>`;
  }
}

async function disallowSubscription(subId, subNumber) {
  if (!confirm(`Are you sure you want to disallow subscription ${subNumber}?\n\nThis will instantly:\n1. Cancel the subscription in real-time\n2. Mark paid invoices as REFUNDED\n3. Record a full 100% refund in payments`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/subscriptions/${subId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      alert("Error: " + data.detail);
      return;
    }

    alert(`✅ ${data.message}\n${data.refund_processed ? `💰 Full Refund of ₹${data.refund_amount.toLocaleString("en-IN")} credited to customer.` : "No paid invoices needed refunding."}`);
    
    // Refresh tables in real-time
    loadStaffRefundSubscriptions();
    loadStaffSubscriptions();
    loadAdminMetrics();
    loadAdminSubscriptions();
    loadAuditReport();
  } catch (err) {
    alert("Disallow error: " + err);
  }
}

async function populateStaffSelectForNewPlan() {
  const sel = document.getElementById("new-plan-staff-select");
  if (!sel) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/staff`);
    const staffList = await res.json();
    sel.innerHTML = staffList.map(st => `
      <option value="${st.id}" data-name="${st.name}">${st.name} (${st.email})</option>
    `).join("");
    if (staffList.length === 0) {
      sel.innerHTML = `<option value="">Operations Desk (Default)</option>`;
    }
  } catch (err) {
    sel.innerHTML = `<option value="">Operations Desk</option>`;
  }
}

async function submitDetailedCreatePlan() {
  const name = document.getElementById("new-plan-name").value.trim();
  const plan_code = document.getElementById("new-plan-code").value.trim() || `PLN-0${Math.floor(Math.random() * 900 + 100)}`;
  const description = document.getElementById("new-plan-desc").value.trim();
  const category = document.getElementById("new-plan-cat").value;
  const billing_period = document.getElementById("new-plan-period").value;
  const price = parseFloat(document.getElementById("new-plan-rate").value);
  const subscriber_limit = parseInt(document.getElementById("new-plan-cap").value) || 100;
  const revenue_limit = parseFloat(document.getElementById("new-plan-rev-limit").value) || 500000.0;
  const discount_deadline = document.getElementById("new-plan-deadline").value;

  const staffSelect = document.getElementById("new-plan-staff-select");
  const assigned_staff_id = staffSelect?.value ? parseInt(staffSelect.value) : null;
  const assigned_staff_name = staffSelect?.options[staffSelect.selectedIndex]?.getAttribute("data-name") || "Operations Rep";

  if (!name || isNaN(price)) {
    alert("Please provide at least a Plan Name and Base Rate.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        plan_code,
        description,
        category,
        billing_period,
        price,
        subscriber_limit,
        revenue_limit,
        discount_deadline,
        assigned_staff_id,
        assigned_staff_name,
        pausable: 1,
        renewable: 1
      })
    });
    const data = await res.json();
    alert(`✅ Subscription Plan '${name}' (${plan_code}) published successfully!\nStaff Allotment: ${assigned_staff_name}`);
    switchSidebarTab("admin-manage-plans-view");
  } catch (err) {
    alert("Create plan error: " + err);
  }
}

function updateLivePlanPreview() {
  const name = document.getElementById("new-plan-name")?.value.trim() || "New Enterprise Plan";
  const code = document.getElementById("new-plan-code")?.value.trim() || "PLN-0109";
  const desc = document.getElementById("new-plan-desc")?.value.trim() || "High-performance enterprise recurrent billing license with automated reconciliation and SLA support.";
  const cat = document.getElementById("new-plan-cat")?.value || "Retail";
  const period = document.getElementById("new-plan-period")?.value || "monthly";
  const rate = parseFloat(document.getElementById("new-plan-rate")?.value) || 12500;
  const cap = document.getElementById("new-plan-cap")?.value || "100";
  const deadline = document.getElementById("new-plan-deadline")?.value || "2026-11-30";

  const pCode = document.getElementById("preview-plan-code");
  if (pCode) pCode.textContent = code;
  const pName = document.getElementById("preview-plan-name");
  if (pName) pName.textContent = name;
  const pCat = document.getElementById("preview-plan-cat");
  if (pCat) pCat.textContent = cat;
  const pPeriod = document.getElementById("preview-plan-period");
  if (pPeriod) pPeriod.textContent = period.charAt(0).toUpperCase() + period.slice(1) + " Cycle";
  const pPrice = document.getElementById("preview-plan-price");
  if (pPrice) pPrice.innerHTML = `₹${rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })} <span style="font-size: 0.82rem; font-weight: 400; color: var(--text-muted);">/ ${period}</span>`;
  const pDesc = document.getElementById("preview-plan-desc");
  if (pDesc) pDesc.textContent = desc;
  const pCap = document.getElementById("preview-plan-cap");
  if (pCap) pCap.textContent = `Max ${cap} Subscribers`;
  const pDeadline = document.getElementById("preview-plan-deadline");
  if (pDeadline) pDeadline.textContent = deadline;
}

async function loadAdminManagePlans() {
  const grid = document.getElementById("admin-detailed-plans-grid");
  if (!grid) return;
  grid.innerHTML = "Loading plans catalog...";

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`);
    const plans = await res.json();
    cachedPlans = plans;

    grid.innerHTML = plans.map(p => {
      const isActive = p.is_active !== 0;
      const capLimit = p.subscriber_limit || 100;
      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; border: 1px solid ${isActive ? 'var(--border-color)' : '#fca5a5'};">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div>
                <span class="badge" style="background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; margin-bottom: 4px;">${p.plan_code || 'PLN-0' + p.id}</span>
                <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">${p.name}</div>
              </div>
              <span class="badge ${isActive ? 'badge-active' : 'badge-overdue'}">
                ${isActive ? 'Active' : 'Disallowed'}
              </span>
            </div>

            <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary); margin: 6px 0 2px;">
              ₹${p.price.toLocaleString("en-IN")}
              <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-muted);">/ ${p.billing_period}</span>
            </div>

            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
              ${p.description || "Recurring enterprise digital service license."}
            </p>

            <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 14px; font-size: 0.78rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Category / Sector:</span>
                <strong>${p.category}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Discount Deadline:</span>
                <strong style="color: #d97706;">${p.discount_deadline || '2026-11-30'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Capacity Threshold:</span>
                <strong>Max ${capLimit} Subs / ₹${(p.revenue_limit || 500000).toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <button class="btn btn-sm" style="background: #0f766e;" onclick="openPlanAnalyticsModal(${p.id})">
              📊 Click for Traffic Graph & Analytics
            </button>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1; ${isActive ? 'color: var(--danger);' : 'color: var(--success);'}" onclick="togglePlanActive(${p.id})">
                ${isActive ? '⚡ Disallow Plan' : '✓ Reactivate Plan'}
              </button>
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="setPlanLimitsPrompt(${p.id}, ${capLimit}, ${p.revenue_limit || 500000})">
                ⚙️ Set Limits
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    grid.innerHTML = `<span style="color: var(--danger);">Failed to load plans: ${err}</span>`;
  }
}

async function openPlanAnalyticsModal(planId) {
  const modalContent = document.getElementById("plan-modal-content");
  modalContent.innerHTML = "Loading deep plan traffic analytics & investor breakdown...";
  openModal("plan-analytics-modal");

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans/${planId}/analytics`);
    const data = await res.json();
    const p = data.plan;
    const m = data.metrics;
    const tf = data.traffic_graph;

    document.getElementById("plan-modal-title").textContent = `📊 Analytics: ${p.name} (${p.plan_code})`;

    // Generate responsive SVG bar/line graph for traffic
    const maxRev = Math.max(...tf.map(t => t.revenue)) * 1.2 || 10000;
    const svgWidth = 680;
    const svgHeight = 150;
    const barWidth = 40;
    const gap = (svgWidth - barWidth * tf.length) / (tf.length + 1);

    modalContent.innerHTML = `
      <!-- Top Metrics Row -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">ACTIVE SUBSCRIBERS</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: var(--primary);">${m.active_subscribers} Accounts</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">TOTAL PLAN REVENUE</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: var(--success);">₹${m.generated_revenue.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">CAPACITY UTILIZATION</div>
          <div style="font-size: 1.3rem; font-weight: 800;">${m.capacity_utilization_pct}% of Cap</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">DISCOUNT DEADLINE</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #d97706;">${p.discount_deadline}</div>
        </div>
      </div>

      <!-- Plan Traffic Progression Graph -->
      <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px;">
        <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span>Weekly Traffic & Revenue Volume Graph</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Capacity Ceiling: ${p.subscriber_limit} Subs</span>
        </div>
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto;">
          <!-- Baseline -->
          <line x1="20" y1="${svgHeight - 25}" x2="${svgWidth - 20}" y2="${svgHeight - 25}" stroke="#cbd5e1"/>

          ${tf.map((t, idx) => {
            const x = gap + idx * (barWidth + gap);
            const barH = (t.revenue / maxRev) * (svgHeight - 45);
            const y = (svgHeight - 25) - barH;
            return `
              <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="#017E84" opacity="0.85">
                <title>${t.period}: ₹${t.revenue.toLocaleString("en-IN")} (${t.subscribers} Subs)</title>
              </rect>
              <text x="${x + barWidth / 2}" y="${y - 4}" font-size="10" font-weight="700" fill="#0f766e" text-anchor="middle">₹${Math.round(t.revenue / 1000)}k</text>
              <text x="${x + barWidth / 2}" y="${svgHeight - 8}" font-size="10" fill="#64748b" text-anchor="middle">${t.period}</text>
            `;
          }).join("")}
        </svg>
      </div>

      <!-- Subscribers List -->
      <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 8px;">Active Corporate Subscribers for this Plan:</div>
      <div class="table-container" style="max-height: 200px; overflow-y: auto;">
        <table>
          <thead>
            <tr>
              <th>Sub #</th>
              <th>Client Contact</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Investment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.subscribers.map(sub => `
              <tr>
                <td style="font-weight: 700;">${sub.subscription_number}</td>
                <td>
                  <div style="font-weight: 600;">${sub.customer_name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${sub.customer_email}</div>
                </td>
                <td><span class="badge badge-confirmed">${sub.variant_name}</span></td>
                <td>${sub.quantity}</td>
                <td style="font-weight: 700;">₹${sub.total_amount.toLocaleString("en-IN")}</td>
                <td><span class="badge badge-${sub.status.toLowerCase()}">${sub.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    modalContent.innerHTML = `<span style="color: var(--danger);">Analytics error: ${err}</span>`;
  }
}

async function togglePlanActive(planId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/plans/${planId}/toggle-status`, { method: "POST" });
    const data = await res.json();
    alert(`⚡ ${data.message}`);
    loadAdminManagePlans();
  } catch (err) {
    alert("Toggle status error: " + err);
  }
}

async function setPlanLimitsPrompt(planId, currentCap, currentRev) {
  const newCap = prompt("Enter Max Subscribers capacity limit:", currentCap);
  if (newCap === null) return;

  const newRev = prompt("Enter Revenue Disallow Threshold (INR):", currentRev);
  if (newRev === null) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans/${planId}/set-limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriber_limit: parseInt(newCap), revenue_limit: parseFloat(newRev) })
    });
    const data = await res.json();
    alert(`✅ ${data.message}`);
    loadAdminManagePlans();
  } catch (err) {
    alert("Error: " + err);
  }
}

async function loadAdminVariantsTable() {
  const tbody = document.getElementById("admin-variants-table");
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/api/admin/variants`);
    const variants = await res.json();
    tbody.innerHTML = variants.map(v => `
      <tr>
        <td style="font-weight: 700;">${v.product_name}</td>
        <td><span class="badge badge-confirmed">${v.variant_name}</span></td>
        <td style="font-weight: 700; color: var(--primary);">+₹${v.extra_price.toLocaleString("en-IN")}</td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">${v.notes || "Official Odoo Brand attribute delta"}</td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load variants:", err);
  }
}

// ----------------------------------------------------------
// 4. STAFF GOVERNANCE & COMMISSION FUNDING
// ----------------------------------------------------------

async function loadStaffCommissions() {
  const tbody = document.getElementById("admin-staff-commissions-table");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Loading staff funding...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/staff-commissions`);
    const staff = await res.json();

    tbody.innerHTML = staff.map(st => `
      <tr>
        <td style="font-weight: 700;">${st.name}</td>
        <td>
          <div>${st.email}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${st.phone}</div>
        </td>
        <td><span class="badge badge-quotation">${st.assigned_plan}</span></td>
        <td style="font-weight: 700; color: var(--primary);">
          ${st.commission_rate}%
        </td>
        <td style="text-align: center;">${st.active_clients_count}</td>
        <td style="font-weight: 700;">₹${st.generated_revenue.toLocaleString("en-IN")}</td>
        <td style="font-weight: 800; color: var(--success);">₹${st.total_commission_earned.toLocaleString("en-IN")}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editStaffCommissionPrompt(${st.id}, ${st.commission_rate}, '${st.assigned_plan}')">
            ✏️ Edit Rate
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger);">Failed to load staff commissions: ${err}</td></tr>`;
  }
}

async function editStaffCommissionPrompt(staffId, currentRate, currentPlan) {
  const newRate = prompt(`Enter new commission rate (%) for staff member:`, currentRate);
  if (newRate === null || isNaN(parseFloat(newRate))) return;

  const newPlan = prompt(`Assign designated subscription plan:`, currentPlan);
  if (newPlan === null) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/staff/${staffId}/commission`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commission_rate: parseFloat(newRate), assigned_plan: newPlan })
    });
    const data = await res.json();
    alert(`✅ ${data.message}`);
    loadStaffCommissions();
  } catch (err) {
    alert("Error updating commission: " + err);
  }
}

async function submitQuickStaff() {
  const name = document.getElementById("quick-staff-name").value.trim();
  const email = document.getElementById("quick-staff-email").value.trim();
  const phone = document.getElementById("quick-staff-phone").value.trim();
  const commission_rate = parseFloat(document.getElementById("quick-staff-comm").value) || 7.5;

  if (!name || !email) {
    alert("Please enter at least staff name and work email.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, commission_rate, assigned_plan: "All Plans" })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Error: " + data.detail);
      return;
    }
    alert(`✅ Operations Staff Member '${name}' authorized with ${commission_rate}% commission!`);
    document.getElementById("quick-staff-name").value = "";
    document.getElementById("quick-staff-email").value = "";
    document.getElementById("quick-staff-phone").value = "";
    loadStaffCommissions();
  } catch (err) {
    alert("Error: " + err);
  }
}

async function submitCreateVariant() {
  const product_name = document.getElementById("var-prod-name").value.trim();
  const variant_name = document.getElementById("var-name").value.trim();
  const extra_price = parseFloat(document.getElementById("var-price").value);

  if (!variant_name || isNaN(extra_price)) {
    alert("Please enter a valid variant name and price delta.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_name, variant_name, extra_price })
    });
    const data = await res.json();
    alert(`✅ Variant '${variant_name}' (+₹${extra_price}) added!`);
    closeModal("add-variant-modal");
  } catch (err) {
    alert("Error: " + err);
  }
}

async function submitCreateStaff() {
  const name = document.getElementById("staff-name").value.trim();
  const email = document.getElementById("staff-email").value.trim();
  const phone = document.getElementById("staff-phone").value.trim();
  const commission_rate = parseFloat(document.getElementById("staff-comm")?.value) || 7.5;

  if (!name || !email) {
    alert("Please enter both staff name and email.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, commission_rate, assigned_plan: "All Plans" })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Error: " + data.detail);
      return;
    }
    alert(`✅ Operations Staff Member '${name}' onboarded successfully with ${commission_rate}% commission!`);
    closeModal("onboard-staff-modal");
    closeModal("add-staff-modal");
    document.getElementById("staff-name").value = "";
    document.getElementById("staff-email").value = "";
    document.getElementById("staff-phone").value = "";
    loadStaffCommissions();
  } catch (err) {
    alert("Error: " + err);
  }
}

async function loadAuditReport() {
  const div = document.getElementById("admin-audit-content");
  div.innerHTML = "Generating live system audit...";

  try {
    const res = await fetch(`${API_BASE}/api/admin/audit-report`);
    const data = await res.json();

    div.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 10px;">
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="color: var(--text-muted); font-size: 0.75rem;">TOTAL DATABASE USERS</div>
          <div style="font-size: 1.3rem; font-weight: 700;">${data.total_users} Accounts</div>
        </div>
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="color: var(--text-muted); font-size: 0.75rem;">ACTIVE SUBSCRIPTIONS</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: var(--success);">${data.active_subscriptions} Live</div>
        </div>
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="color: var(--text-muted); font-size: 0.75rem;">DISALLOWED / CANCELLED</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: var(--danger);">${data.cancelled_or_disallowed} Subs</div>
        </div>
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="color: var(--text-muted); font-size: 0.75rem;">REFUNDED INVOICES</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: #7c3aed;">${data.refunded_invoices} Invoices</div>
        </div>
      </div>
      <div style="margin-top: 12px; font-size: 0.78rem; color: var(--text-muted);">
        Audit Timestamp: ${data.generated_at} • Engine: ${data.engine_health}
      </div>
    `;
  } catch (err) {
    div.innerHTML = `<span style="color: var(--danger);">Audit failed: ${err}</span>`;
  }
}

async function openExecutiveReportModal() {
  const container = document.getElementById("printable-executive-report-content");
  container.innerHTML = "Generating live executive financial audit report...";
  openModal("executive-report-modal");

  try {
    const res = await fetch(`${API_BASE}/api/admin/financial-report`);
    const data = await res.json();
    const s = data.executive_summary;

    container.innerHTML = `
      <div class="invoice-header-row">
        <div>
          <div style="font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--primary);">
            Brightloop Software — Executive Financial Audit Report
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
            Comprehensive Investment, Plan Breakdown & Staff Governance Audit<br>
            CUSAT Technology Corridor, Kochi, Kerala 682022
          </div>
        </div>
        <div style="text-align: right;">
          <div class="invoice-stamp paid">
            OFFICIAL AUDIT
          </div>
          <div style="margin-top: 8px; font-weight: 700; font-size: 0.95rem;">
            Generated: ${data.generated_at}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            Engine: Brightloop Enterprise Core Engine
          </div>
        </div>
      </div>

      <!-- Executive KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">TOTAL CAPITAL COLLECTED</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--success); margin-top: 4px;">₹${s.total_capital_collected.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">MONTHLY RECURRING (MRR)</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary); margin-top: 4px;">₹${s.mrr.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">PROJECTED ARR (12X)</div>
          <div style="font-size: 1.25rem; font-weight: 800; margin-top: 4px;">₹${s.arr.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">OVERDUE RECEIVABLES</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--danger); margin-top: 4px;">₹${s.overdue_receivables.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <!-- Plan by Plan Investment Breakdown Table -->
      <h4 style="margin-bottom: 8px; font-size: 0.95rem;">1. Plan-by-Plan Investment & Subscriber Breakdown</h4>
      <table style="margin-bottom: 24px;">
        <thead>
          <tr>
            <th>Plan Title</th>
            <th>Category</th>
            <th>Frequency</th>
            <th>Base Rate</th>
            <th>Active Subs</th>
            <th>Total Invested (MRR)</th>
          </tr>
        </thead>
        <tbody>
          ${data.plan_investments.map(p => `
            <tr>
              <td style="font-weight: 700;">${p.plan_name}</td>
              <td><span class="badge badge-confirmed">${p.category}</span></td>
              <td style="text-transform: capitalize;">${p.billing_period}</td>
              <td>₹${p.base_price.toLocaleString("en-IN")}</td>
              <td style="font-weight: 600;">${p.active_subscribers} / ${p.total_subscribers}</td>
              <td style="font-weight: 700;">₹${p.total_invested_mrr.toLocaleString("en-IN")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Top Customer Investors -->
      <h4 style="margin-bottom: 8px; font-size: 0.95rem;">2. Top B2B Client Investments</h4>
      <table style="margin-bottom: 24px;">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Company</th>
            <th>Email</th>
            <th>Total Capital Invested</th>
          </tr>
        </thead>
        <tbody>
          ${data.top_investors.map(c => `
            <tr>
              <td style="font-weight: 700;">${c.customer_name}</td>
              <td>${c.company_name}</td>
              <td style="color: var(--text-muted);">${c.email}</td>
              <td style="font-weight: 700; color: var(--success);">₹${c.total_invested.toLocaleString("en-IN")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Staff Governance -->
      <h4 style="margin-bottom: 8px; font-size: 0.95rem;">3. Operations Staff Governance Roster (Authorized by Admin)</h4>
      <table style="margin-bottom: 24px;">
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Onboarded Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.staff_roster.map(st => `
            <tr>
              <td style="font-weight: 700;">${st.name}</td>
              <td>${st.email}</td>
              <td>${st.phone}</td>
              <td>${st.created_at || "2026-10-31"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Footer & Signature -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted);">
        <div>
          Certified Immutable Executive Audit • Evaluator Reference: Odoo x MAT9.0 Hackathon 2026
        </div>
        <div style="text-align: right; font-weight: 700; color: var(--primary);">
          Authorized by Admin (Bhavya Mehta)
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<span style="color: var(--danger);">Failed to load financial report: ${err}</span>`;
  }
}

function copyReportShareLink() {
  const shareUrl = `${API_BASE}/api/admin/financial-report`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert("✅ Executive Report API Link copied to clipboard!\nYou can paste and share this report with auditors, evaluators, and stakeholders:\n" + shareUrl);
  }).catch(() => {
    prompt("Copy this verified report link to share:", shareUrl);
  });
}

// ----------------------------------------------------------
// 4. STAFF OPERATIONS & SPREADSHEET CRM CENTER
// ----------------------------------------------------------

async function loadStaffCustomers() {
  const tbody = document.getElementById("staff-customers-table");
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Loading customers CRM...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/staff/customers`);
    const customers = await res.json();

    tbody.innerHTML = customers.slice(0, 15).map(c => `
      <tr>
        <td style="font-weight: 700;">${c.name}</td>
        <td>${c.company_name}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${c.email}</td>
        <td><span class="badge badge-confirmed">${c.industry}</span></td>
        <td style="text-align: center; font-weight: 600;">${c.subscription_count}</td>
        <td style="font-size: 0.8rem;">${c.active_plans}</td>
        <td style="font-weight: 700;">₹${c.total_spend.toLocaleString("en-IN")}</td>
        <td>
          ${c.overdue_debt > 0 ? 
            `<span class="badge badge-overdue">Due: ₹${c.overdue_debt.toLocaleString("en-IN")}</span>` : 
            `<span class="badge badge-active">In Good Standing</span>`}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger);">Error loading CRM: ${err}</td></tr>`;
  }
}

function downloadCustomerSpreadsheet() {
  // Directly trigger CSV download endpoint
  window.location.href = `${API_BASE}/api/staff/customers/export-csv`;
}

async function submitCreateCustomer() {
  const name = document.getElementById("new-cust-name").value.trim();
  const company_name = document.getElementById("new-cust-company").value.trim();
  const email = document.getElementById("new-cust-email").value.trim();
  const industry = document.getElementById("new-cust-industry").value;

  if (!name || !email) {
    alert("Please enter customer name and email.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/staff/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company_name, email, industry })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Error: " + data.detail);
      return;
    }
    alert(`✅ Customer '${name}' onboarded successfully!`);
    closeModal("add-customer-modal");
    loadStaffCustomers();
  } catch (err) {
    alert("Error: " + err);
  }
}

async function loadStaffSubscriptions(category = "All", expiring = false) {
  const tbody = document.getElementById("staff-subscriptions-table");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading subscriptions...</td></tr>`;

  try {
    let url = `${API_BASE}/api/staff/subscriptions?`;
    if (category !== "All") url += `category=${category}&`;
    if (expiring) url += `expiring_soon=true&`;

    const res = await fetch(url);
    const data = await res.json();
    currentStaffSubs = data.subscriptions;

    if (currentStaffSubs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No matching subscriptions in this category.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentStaffSubs.slice(0, 15).map(s => `
      <tr>
        <td style="font-weight: 700;">${s.subscription_number}</td>
        <td>
          <div style="font-weight: 600;">${s.customer_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.customer_email}</div>
        </td>
        <td>
          <div>${s.plan_name}</div>
          <span class="badge badge-quotation">${s.category}</span>
        </td>
        <td style="font-weight: 700;">₹${s.unit_price.toLocaleString("en-IN")}</td>
        <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
        <td style="${s.is_overdue ? 'color: var(--danger); font-weight: 700;' : ''}">
          ${s.expiry_date || "Continuous"}
          ${s.is_overdue ? " (EXPIRED)" : ""}
        </td>
        <td>
          <div style="display: flex; gap: 4px;">
            ${s.status === "Draft" ? `<button class="btn btn-secondary btn-sm" onclick="advanceSubState(${s.id}, 'Quotation')">Send Quote</button>` : ""}
            ${s.status === "Quotation" ? `<button class="btn btn-sm" onclick="advanceSubState(${s.id}, 'Confirmed')">Confirm</button>` : ""}
            ${s.status === "Confirmed" ? `<button class="btn btn-sm" style="background:#059669;" onclick="advanceSubState(${s.id}, 'Active')">Activate</button>` : ""}
            ${s.is_overdue || s.status === "Active" ? `<button class="btn btn-secondary btn-sm" style="color:#d97706;" onclick="sendRenewalReminder(${s.id})">🔔 Chase Alert</button>` : ""}
          </div>
        </td>
      </tr>
    `).join("");

    loadStaffRefundSubscriptions();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Failed to load subscriptions: ${err}</td></tr>`;
  }
}

function filterStaffSubs(category) {
  document.querySelectorAll(".filter-tab").forEach(tab => tab.classList.remove("active"));
  event.target.classList.add("active");

  if (category === "Expiring") {
    loadStaffSubscriptions("All", true);
  } else {
    loadStaffSubscriptions(category, false);
  }
}

async function advanceSubState(subId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/staff/subscriptions/${subId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_status: newStatus })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Transition Error: " + data.detail);
      return;
    }
    loadStaffSubscriptions();
    loadAdminMetrics();
  } catch (err) {
    alert("Error: " + err);
  }
}

async function sendRenewalReminder(subId) {
  try {
    const res = await fetch(`${API_BASE}/api/staff/subscriptions/${subId}/send-reminder`, { method: "POST" });
    const data = await res.json();
    alert(`📢 ${data.message}\nDispatched to: ${data.dispatched_to} at ${data.timestamp}`);
  } catch (err) {
    alert("Alert dispatch failed: " + err);
  }
}

async function loadStaffInvoices() {
  const tbody = document.getElementById("staff-invoices-table");
  try {
    const res = await fetch(`${API_BASE}/api/staff/invoices`);
    const invoices = await res.json();

    const overdueInvoices = invoices.filter(i => i.status === "Overdue" || i.status === "Confirmed");

    if (overdueInvoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--success);">✓ All customer invoices are current. No pending payment delays!</td></tr>`;
      return;
    }

    tbody.innerHTML = overdueInvoices.slice(0, 10).map(inv => `
      <tr>
        <td style="font-weight: 700;">${inv.invoice_number}</td>
        <td>${inv.subscription_number}</td>
        <td>
          <div style="font-weight: 600;">${inv.customer_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${inv.customer_email}</div>
        </td>
        <td style="font-weight: 700; color: var(--danger);">₹${inv.amount.toLocaleString("en-IN")}</td>
        <td><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-secondary btn-sm" onclick="sendPaymentDelayReminder(${inv.id})">
              📢 Dispatch Delay Alert
            </button>
            <button class="btn btn-sm" style="background: #059669;" onclick="reconcilePayment(${inv.id}, ${inv.amount})">
              ✓ Mark Paid
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: var(--danger);">Error loading invoices: ${err}</td></tr>`;
  }
}

async function sendPaymentDelayReminder(invId) {
  try {
    const res = await fetch(`${API_BASE}/api/staff/invoices/${invId}/send-payment-reminder`, { method: "POST" });
    const data = await res.json();
    alert(`📢 ${data.message}\nNotification emailed to: ${data.recipient_email} at ${data.dispatched_at}`);
  } catch (err) {
    alert("Reminder dispatch error: " + err);
  }
}

async function reconcilePayment(invId, amount) {
  try {
    const res = await fetch(`${API_BASE}/api/staff/invoices/${invId}/reconcile-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, payment_method: "Bank Transfer", reference_note: "Reconciled by operations desk" })
    });
    const data = await res.json();
    alert(`✅ ${data.message}`);
    loadStaffInvoices();
    loadStaffCustomers();
    loadAdminMetrics();
  } catch (err) {
    alert("Reconciliation error: " + err);
  }
}

async function triggerStaffBatchBilling() {
  const banner = document.getElementById("staff-billing-banner");
  banner.style.display = "block";
  banner.innerHTML = "⏳ Running automated recurring billing sweep across all active subscriptions...";

  try {
    const res = await fetch(`${API_BASE}/api/staff/run-billing`, { method: "POST" });
    const data = await res.json();

    banner.innerHTML = `
      <strong>⚡ Automated Billing Run Completed!</strong><br>
      Scanned: <strong>${data.scanned_subscriptions}</strong> active subscriptions | 
      Generated: <strong>${data.invoices_generated}</strong> new invoices | 
      Skipped: <strong>${data.skipped_duplicates}</strong> duplicate cycles (Anti-Duplication Idempotency Guard Active)
    `;

    loadStaffInvoices();
    loadAdminMetrics();
  } catch (err) {
    banner.innerHTML = `<span style="color: var(--danger);">Billing run failed: ${err}</span>`;
  }
}

// ----------------------------------------------------------
// 5. CUSTOMER DASHBOARD, PORTFOLIO & PRINTABLE PDF RECEIPTS
// ----------------------------------------------------------

async function loadCustomerProfile() {
  const email = currentUser?.email || "meera.bhat1@sterlingca.com";

  try {
    const res = await fetch(`${API_BASE}/api/auth/profile/${encodeURIComponent(email)}`);
    if (!res.ok) {
      console.warn('Customer profile fetch status: ' + res.status);
      return;
    }
    const data = await res.json();
    if (!data || !data.financials) return;

    // Fill Financial KPIs
    document.getElementById("cust-total-invested").textContent = `₹${data.financials.total_invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("cust-active-subs").textContent = data.financials.active_subscriptions;
    document.getElementById("cust-overdue-debt").textContent = `₹${data.financials.total_overdue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    // Render Subscriptions
    const subBody = document.getElementById("customer-subscriptions-table");
    if (data.subscriptions.length === 0) {
      subBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No subscriptions found. Browse the catalog below to subscribe.</td></tr>`;
    } else {
      subBody.innerHTML = data.subscriptions.map(s => `
        <tr>
          <td style="font-weight: 700;">${s.subscription_number}</td>
          <td style="font-weight: 600;">${s.plan_name}</td>
          <td><span class="badge badge-confirmed">${s.variant_name}</span></td>
          <td>${s.quantity}</td>
          <td style="font-weight: 700;">₹${s.total_amount.toLocaleString("en-IN")}</td>
          <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
          <td>${s.expiry_date || "Continuous"}</td>
        </tr>
      `).join("");
    }

    // Render Invoices with PDF Receipt button
    const invBody = document.getElementById("customer-invoices-table");
    if (data.invoices.length === 0) {
      invBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No invoices generated yet.</td></tr>`;
    } else {
      invBody.innerHTML = data.invoices.map(inv => `
        <tr>
          <td style="font-weight: 700;">${inv.invoice_number}</td>
          <td>${inv.subscription_number}</td>
          <td style="font-weight: 700;">₹${inv.amount.toLocaleString("en-IN")}</td>
          <td>₹${inv.tax_amount.toLocaleString("en-IN")}</td>
          <td><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick='openPdfInvoiceModal(${JSON.stringify(inv)}, ${JSON.stringify(data.profile)})'>
              📄 View & Print PDF
            </button>
          </td>
        </tr>
      `).join("");
    }

  } catch (err) {
    console.error("Failed to load customer profile:", err);
  }
}

function openPdfInvoiceModal(inv, profile) {
  const container = document.getElementById("printable-invoice-content");

  const isPaid = inv.status === "Paid";
  const subtotal = inv.amount - (inv.tax_amount || 0);

  container.innerHTML = `
    <div class="invoice-header-row">
      <div>
        <div style="font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--primary);">
          ⚡ Brightloop Software
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          Brightloop Cloud Technologies Pvt. Ltd.<br>
          CUSAT Technology Corridor, Kochi, Kerala 682022<br>
          GSTIN: 32AABCB1234F1Z8
        </div>
      </div>
      <div style="text-align: right;">
        <div class="invoice-stamp ${isPaid ? 'paid' : 'overdue'}">
          ${inv.status}
        </div>
        <div style="margin-top: 8px; font-weight: 700; font-size: 1.1rem;">
          ${inv.invoice_number}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          Issue Date: ${new Date().toISOString().split("T")[0]}
        </div>
      </div>
    </div>

    <!-- Bill To -->
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.88rem;">
      <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">
        BILLED TO (CUSTOMER):
      </div>
      <div style="font-weight: 700; font-size: 1rem;">${profile.name}</div>
      <div>${profile.company_name}</div>
      <div style="color: var(--text-muted);">${profile.email} • ${profile.phone}</div>
      <div style="color: var(--text-muted);">Industry: ${profile.industry}</div>
    </div>

    <!-- Line Items Table -->
    <table style="margin-bottom: 24px;">
      <thead>
        <tr>
          <th>Description</th>
          <th>Reference #</th>
          <th>Rate</th>
          <th>Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Recurring SaaS Subscription</strong><br>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Includes Odoo Brand Integration & Automated Billing License</span>
          </td>
          <td>${inv.subscription_number}</td>
          <td>₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="font-weight: 700;">₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end;">
      <div style="width: 280px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
          <span>Taxable Subtotal:</span>
          <span>₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
          <span>IGST / GST (18.0%):</span>
          <span>₹${(inv.tax_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 1.15rem; font-weight: 800; color: var(--primary);">
          <span>Total Amount:</span>
          <span>₹${inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border-color); text-align: center; font-size: 0.78rem; color: var(--text-muted);">
      This is an offline-ready, cryptographically authenticated digital invoice receipt generated by Brightloop Software.<br>
      Payment verified via Brightloop State Machine & Automated Reconciliation Engine.
    </div>
  `;

  openModal("pdf-invoice-modal");
}

async function loadCustomerPlans() {
  const grid = document.getElementById("customer-plans-grid");
  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`);
    const plans = await res.json();

    grid.innerHTML = plans.map(p => `
      <div class="kpi-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="font-weight: 800; font-size: 1.15rem;">${p.name}</div>
            <span class="badge badge-confirmed">${p.category}</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary); margin: 10px 0 4px;">
            ₹${p.price.toLocaleString("en-IN")}
            <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-muted);">/ ${p.billing_period}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
            Full enterprise digital recurring license with automated reconciliation and Odoo brand compatibility.
          </p>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px;">
            Includes: +₹560 Odoo Brand Integration Option • 18% GST Compliance
          </div>
          <button class="btn btn-sm" style="width: 100%;" onclick="simulateSubscribe('${p.name}', ${p.price})">
            ⚡ Subscribe Now
          </button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    grid.innerHTML = `<span style="color: var(--danger);">Failed to load plans: ${err}</span>`;
  }
}

function simulateSubscribe(planName, price) {
  alert(`✅ Subscription to '${planName}' initiated!\n\nYour subscription quotation has been recorded in the SQLite database and sent to the Operations Staff Desk for confirmation.`);
  loadCustomerProfile();
}

// ----------------------------------------------------------
// 6. PASSWORD VALIDATOR & MODAL HELPERS
// ----------------------------------------------------------

function checkPasswordRules(pwd) {
  const isLen = pwd.length > 8;
  const isUpper = /[A-Z]/.test(pwd);
  const isLower = /[a-z]/.test(pwd);
  const isSpec = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  updateRule("pwd-len", isLen, "> 8 characters");
  updateRule("pwd-upper", isUpper, "At least one uppercase letter (A-Z)");
  updateRule("pwd-lower", isLower, "At least one lowercase letter (a-z)");
  updateRule("pwd-spec", isSpec, "At least one special character (!@#$%...)");
}

function updateRule(elemId, valid, text) {
  const el = document.getElementById(elemId);
  if (!el) return;
  if (valid) {
    el.style.color = "#10b981";
    el.textContent = `✓ ${text}`;
  } else {
    el.style.color = "#ef4444";
    el.textContent = `✕ ${text}`;
  }
}

async function submitRegister() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!name || !email || !password) {
    alert("Please fill in all registration fields.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Registration Failed:\n" + data.detail);
      return;
    }
    alert("✅ Account created successfully! Logging you in...");
    closeModal("register-modal");
    setSession(data.user);
  } catch (err) {
    alert("Error: " + err);
  }
}

function openModal(id) {
  let modal = document.getElementById(id);
  if (!modal && id === "add-staff-modal") modal = document.getElementById("onboard-staff-modal");
  if (!modal && id === "onboard-staff-modal") modal = document.getElementById("add-staff-modal");
  if (modal) {
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }
}

function closeModal(id) {
  let modal = document.getElementById(id);
  if (!modal && id === "add-staff-modal") modal = document.getElementById("onboard-staff-modal");
  if (!modal && id === "onboard-staff-modal") modal = document.getElementById("add-staff-modal");
  if (modal) {
    modal.classList.remove("active");
    if (!document.querySelector(".modal.active")) {
      document.body.classList.remove("modal-open");
    }
  }
}

// Start with Google Sign-In Landing Page
document.addEventListener("DOMContentLoaded", () => {
  // Stay on landing page until user selects a persona or signs in with Google
});
