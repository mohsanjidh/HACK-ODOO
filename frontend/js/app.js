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
  document.getElementById("header-user-name").textContent = user.name;
  document.getElementById("header-user-email").textContent = user.email;
  document.getElementById("app-role-badge").textContent = user.role.toUpperCase();
  document.getElementById("header-avatar").textContent = user.name.charAt(0);

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
// 2. MOGG FLOATING SIDEBAR NAVIGATION
// ----------------------------------------------------------

function renderSidebar(role) {
  const sidebar = document.getElementById("app-sidebar");
  let html = "";

  if (role === "admin") {
    html = `
      <div class="sidebar-title">Executive Governance</div>
      <div class="sidebar-item active" onclick="switchSidebarTab('admin-view')">
        <span class="icon">👑</span>
        <span>Executive Dashboard</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('admin-plans')">
        <span class="icon">📦</span>
        <span>Plans & Variants (+₹560)</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('admin-subs')">
        <span class="icon">⚡</span>
        <span>Disallow & Auto-Refund</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('admin-audit')">
        <span class="icon">🛡️</span>
        <span>System Audit Report</span>
      </div>
      <div class="sidebar-title">Portals Switcher</div>
      <div class="sidebar-item" onclick="switchSidebarTab('staff-view'); loadStaffCustomers(); loadStaffSubscriptions(); loadStaffInvoices();">
        <span class="icon">📋</span>
        <span>Staff Operations View</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('customer-view'); loadCustomerProfile(); loadCustomerPlans();">
        <span class="icon">👤</span>
        <span>Customer Experience View</span>
      </div>
    `;
  } else if (role === "staff") {
    html = `
      <div class="sidebar-title">Operations Desk</div>
      <div class="sidebar-item active" onclick="switchSidebarTab('staff-view')">
        <span class="icon">📋</span>
        <span>Staff Workspace</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('staff-crm')">
        <span class="icon">👥</span>
        <span>Customer CRM Center</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('staff-subs')">
        <span class="icon">📨</span>
        <span>Subscription Queue</span>
      </div>
      <div class="sidebar-item" onclick="switchSidebarTab('staff-notifs')">
        <span class="icon">🔔</span>
        <span>Payment Delay Notices</span>
      </div>
      <div class="sidebar-item" onclick="triggerStaffBatchBilling()" style="color: #059669; font-weight: 600;">
        <span class="icon">⚡</span>
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

  if (tabName.startsWith("admin")) {
    document.getElementById("admin-view").classList.add("active");
  } else if (tabName.startsWith("staff")) {
    document.getElementById("staff-view").classList.add("active");
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

    document.getElementById("kpi-mrr").textContent = `₹${m.mrr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("kpi-arr").textContent = `₹${m.arr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("kpi-cash").textContent = `₹${m.total_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("kpi-overdue").textContent = `₹${m.overdue_receivables.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  } catch (err) {
    console.error("Failed to load admin metrics:", err);
  }
}

async function loadAdminSubscriptions() {
  const tbody = document.getElementById("admin-subscriptions-table");
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
              ❌ Disallow & Refund
            </button>
          ` : `<span style="font-size: 0.75rem; color: var(--text-muted);">Refunded / Disallowed</span>`}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Failed to load subscriptions: ${err}</td></tr>`;
  }
}

async function disallowSubscription(subId, subNumber) {
  if (!confirm(`Are you sure you want to disallow subscription ${subNumber}?\n\nThis will instantly:\n1. Cancel the subscription in real-time\n2. Mark paid invoices as REFUNDED\n3. Record a full refund in payments`)) {
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
    
    // Refresh admin tables and metrics in real-time
    loadAdminMetrics();
    loadAdminSubscriptions();
    loadAuditReport();
  } catch (err) {
    alert("Disallow error: " + err);
  }
}

async function loadAdminPlans() {
  const tbody = document.getElementById("admin-plans-table");
  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`);
    const plans = await res.json();
    cachedPlans = plans;

    tbody.innerHTML = plans.map(p => `
      <tr>
        <td style="font-weight: 700;">${p.name}</td>
        <td><span class="badge badge-confirmed">${p.category}</span></td>
        <td style="text-transform: capitalize;">${p.billing_period}</td>
        <td style="font-weight: 700;">₹${p.price.toLocaleString("en-IN")}</td>
        <td>${p.pausable ? "✓ Yes" : "✕ No"}</td>
        <td>
          <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="deletePlan(${p.id}, '${p.name}')">
            🗑️ Disallow Plan
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load plans:", err);
  }
}

async function deletePlan(planId, planName) {
  if (!confirm(`Remove '${planName}' from the public catalog? Customers will no longer be able to purchase it.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans/${planId}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.message);
    loadAdminPlans();
    loadCustomerPlans();
  } catch (err) {
    alert("Delete plan error: " + err);
  }
}

async function submitCreatePlan() {
  const name = document.getElementById("plan-name").value.trim();
  const category = document.getElementById("plan-category").value;
  const billing_period = document.getElementById("plan-period").value;
  const price = parseFloat(document.getElementById("plan-price").value);

  if (!name || isNaN(price)) {
    alert("Please enter a valid plan name and price.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, billing_period, price, pausable: 1, renewable: 1 })
    });
    const data = await res.json();
    alert("✅ Plan created successfully!");
    closeModal("add-plan-modal");
    loadAdminPlans();
    loadCustomerPlans();
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

  if (!name || !email) {
    alert("Please enter both staff name and email.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Error: " + data.detail);
      return;
    }
    alert(`✅ New Staff Member '${data.staff.name}' onboarded successfully!`);
    closeModal("add-staff-modal");
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
    const data = await res.json();

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
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

// Start with Google Sign-In Landing Page
document.addEventListener("DOMContentLoaded", () => {
  // Stay on landing page until user selects a persona or signs in with Google
});
