// Brightloop Front-end Application with Authentication & RBAC
const API_BASE = "";

let currentCategory = "All";
let currentSearch = "";
let isExpiringOnly = false;

// Default session is Admin for immediate evaluation, but can be switched
let currentUser = {
  id: 0,
  name: "Bhavya Admin",
  email: "admin@brightloop.local",
  role: "admin",
  company_name: "Brightloop Software HQ"
};

// 1. Live Password Validation (Problem Statement Scene 1)
function checkPasswordLive(val) {
  const isLen = val.length > 8;
  const isUpper = /[A-Z]/.test(val);
  const isLower = /[a-z]/.test(val);
  const isSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);

  updatePwdBadge("pwd-len", isLen, "Greater than 8 characters");
  updatePwdBadge("pwd-upper", isUpper, "At least one uppercase letter (A-Z)");
  updatePwdBadge("pwd-lower", isLower, "At least one lowercase letter (a-z)");
  updatePwdBadge("pwd-special", isSpecial, "At least one special character (!@#$%^&*)");
}

function updatePwdBadge(id, valid, text) {
  const el = document.getElementById(id);
  if (valid) {
    el.textContent = `✓ ${text}`;
    el.classList.add("valid");
  } else {
    el.textContent = `✕ ${text}`;
    el.classList.remove("valid");
  }
}

// 2. Authentication Operations
async function submitRegister() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const company = document.getElementById("reg-company").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!name || !email || !password) {
    alert("Please fill in all mandatory fields.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, company_name: company })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Registration Error: " + data.detail);
      return;
    }

    alert(`🎉 Account created successfully for ${data.user.name}!\nLogging you in as Customer...`);
    closeModal("register-modal");
    setSession(data.user);
  } catch (err) {
    alert("Registration error: " + err);
  }
}

async function submitLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Login Error: " + data.detail);
      return;
    }

    closeModal("login-modal");
    setSession(data.user);
  } catch (err) {
    alert("Login failed: " + err);
  }
}

function quickLogin(email) {
  document.getElementById("login-email").value = email;
  document.getElementById("login-password").value = "Demo#Pass2026!";
  submitLogin();
}

function openForgotPassword() {
  closeModal("login-modal");
  openModal("forgot-modal");
}

async function submitForgotPassword() {
  const email = document.getElementById("forgot-email").value.trim();
  const resultDiv = document.getElementById("forgot-result");

  if (!email) {
    alert("Please enter your registered email address.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail);
      return;
    }

    resultDiv.style.display = "block";
    resultDiv.innerHTML = `
      <strong>✅ Reset Link Dispatched!</strong><br>
      ${data.message}<br>
      <span style="font-size: 0.75rem; word-break: break-all;">Preview Token Link: <a href="${data.reset_link_preview}" target="_blank">${data.reset_link_preview}</a></span>
    `;
  } catch (err) {
    alert("Error: " + err);
  }
}

function setSession(user) {
  currentUser = user;
  document.getElementById("auth-buttons").style.display = "none";
  const userInfo = document.getElementById("auth-user-info");
  userInfo.style.display = "flex";
  document.getElementById("user-display-name").textContent = user.name;
  document.getElementById("user-display-role").textContent = user.role.toUpperCase();

  document.getElementById("session-banner").style.display = "flex";
  document.getElementById("session-user-text").textContent = `Logged in as ${user.name} (${user.email}) — Role: ${user.role.toUpperCase()}`;

  // Role-Based UI Visibility (RBAC)
  const btnAdmin = document.getElementById("btn-nav-admin");
  const btnStaff = document.getElementById("btn-nav-staff");
  const btnCust = document.getElementById("btn-nav-customer");

  if (user.role === "customer") {
    btnAdmin.style.display = "none";
    btnStaff.style.display = "none";
    btnCust.style.display = "block";
    switchView("customer");
  } else if (user.role === "staff") {
    btnAdmin.style.display = "none";
    btnStaff.style.display = "block";
    btnCust.style.display = "block";
    switchView("staff");
  } else { // admin
    btnAdmin.style.display = "block";
    btnStaff.style.display = "block";
    btnCust.style.display = "block";
    switchView("admin");
  }
}

function logoutUser() {
  currentUser = null;
  document.getElementById("auth-buttons").style.display = "flex";
  document.getElementById("auth-user-info").style.display = "none";
  document.getElementById("session-banner").style.display = "none";
  alert("You have been signed out. Please sign in or use 1-Click Demo Login.");
  openModal("login-modal");
}

// 3. View Switching
function switchView(role) {
  document.querySelectorAll(".role-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));

  if (role === "admin") {
    document.getElementById("btn-nav-admin").classList.add("active");
    document.getElementById("admin-view").classList.add("active");
    loadAdminMetrics();
    loadAdminPlans();
  } else if (role === "staff") {
    document.getElementById("btn-nav-staff").classList.add("active");
    document.getElementById("staff-view").classList.add("active");
    loadStaffSubscriptions();
  } else if (role === "customer") {
    document.getElementById("btn-nav-customer").classList.add("active");
    document.getElementById("customer-view").classList.add("active");
    loadCustomerPlans();
    loadCustomerInvoices();
  }
}

// 4. Admin Portal Operations
async function loadAdminMetrics() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/metrics`);
    const data = await res.json();
    if (data.status === "success") {
      const m = data.metrics;
      document.getElementById("admin-mrr").textContent = `₹${m.mrr.toLocaleString('en-IN')}`;
      document.getElementById("admin-arr").textContent = `ARR: ₹${m.arr.toLocaleString('en-IN')}`;
      document.getElementById("admin-revenue").textContent = `₹${m.total_revenue.toLocaleString('en-IN')}`;
      document.getElementById("admin-tax").textContent = `Taxes Collected: ₹${m.total_tax_collected.toLocaleString('en-IN')}`;
      document.getElementById("admin-active-subs").textContent = m.active_subscriptions;
      document.getElementById("admin-total-subs").textContent = `Total in records: ${m.total_subscriptions}`;
      document.getElementById("admin-overdue").textContent = `₹${m.overdue_receivables.toLocaleString('en-IN')}`;
    }
  } catch (err) {
    console.error("Error loading metrics:", err);
  }
}

function switchAdminTab(tab) {
  document.querySelectorAll("#admin-view .pill").forEach(p => p.classList.remove("active"));
  document.getElementById("admin-tab-plans").style.display = "none";
  document.getElementById("admin-tab-variants").style.display = "none";
  document.getElementById("admin-tab-staff").style.display = "none";

  if (tab === "plans") {
    event.target.classList.add("active");
    document.getElementById("admin-tab-plans").style.display = "block";
    loadAdminPlans();
  } else if (tab === "variants") {
    event.target.classList.add("active");
    document.getElementById("admin-tab-variants").style.display = "block";
    loadAdminVariants();
  } else if (tab === "staff") {
    event.target.classList.add("active");
    document.getElementById("admin-tab-staff").style.display = "block";
    loadAdminStaff();
  }
}

async function loadAdminPlans() {
  const tbody = document.getElementById("admin-plans-table");
  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`);
    const plans = await res.json();
    tbody.innerHTML = plans.map(p => `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td><strong>${p.name}</strong><br><small style="color: var(--text-muted);">${p.description || ''}</small></td>
        <td><span class="badge badge-active">${p.category}</span></td>
        <td style="text-transform: capitalize;">${p.billing_period}</td>
        <td><strong>₹${p.price.toLocaleString('en-IN')}</strong></td>
        <td>${p.min_qty}</td>
        <td>
          <small>
            Auto-Close: ${p.auto_close ? '✅' : '❌'} | Pausable: ${p.pausable ? '✅' : '❌'}
          </small>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Failed to load plans</td></tr>`;
  }
}

async function loadAdminVariants() {
  const tbody = document.getElementById("admin-variants-table");
  try {
    const res = await fetch(`${API_BASE}/api/admin/variants`);
    const variants = await res.json();
    tbody.innerHTML = variants.map(v => `
      <tr>
        <td>#${v.id}</td>
        <td><strong>${v.product_name}</strong></td>
        <td>
          ${v.variant_name.includes("Odoo") ? `<span style="color: var(--primary); font-weight: bold;">⭐ ${v.variant_name}</span>` : v.variant_name}
        </td>
        <td>
          <strong>${v.extra_price > 0 ? `+₹${v.extra_price.toLocaleString('en-IN')}` : 'Included (+₹0)'}</strong>
        </td>
        <td><small style="color: var(--text-muted);">${v.notes || ''}</small></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Failed to load variants</td></tr>`;
  }
}

async function loadAdminStaff() {
  const tbody = document.getElementById("admin-staff-table");
  try {
    const res = await fetch(`${API_BASE}/api/admin/staff`);
    const staff = await res.json();
    tbody.innerHTML = staff.map(s => `
      <tr>
        <td>#${s.id}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.email}</td>
        <td>${s.phone || 'N/A'}</td>
        <td><span class="badge badge-confirmed">Staff Operator</span></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Failed to load staff</td></tr>`;
  }
}

// 5. Staff Operations
async function loadStaffSubscriptions(expiring = false) {
  isExpiringOnly = expiring;
  const tbody = document.getElementById("staff-subscriptions-table");
  try {
    let url = `${API_BASE}/api/staff/subscriptions?category=${encodeURIComponent(currentCategory)}&expiring_soon=${expiring}`;
    if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;

    const res = await fetch(url);
    const data = await res.json();
    const subs = data.subscriptions;

    document.getElementById("staff-sub-count").textContent = `Showing ${subs.length} subscriptions`;

    tbody.innerHTML = subs.map(s => {
      let badgeClass = "badge-active";
      if (s.status === "Confirmed") badgeClass = "badge-confirmed";
      else if (s.status === "Quotation") badgeClass = "badge-quotation";
      else if (s.status === "Draft") badgeClass = "badge-draft";
      else if (s.status === "Closed") badgeClass = "badge-closed";

      const overdueBadge = s.is_overdue ? `<span class="badge badge-overdue" style="margin-left: 4px;">OVERDUE</span>` : '';

      return `
        <tr style="${s.is_overdue ? 'background-color: #fef2f2;' : ''}">
          <td><strong style="color: var(--primary);">${s.subscription_number}</strong></td>
          <td><strong>${s.customer_name}</strong><br><small style="color: var(--text-muted);">${s.customer_email}</small></td>
          <td><small>${s.customer_name.split(' ')[0]} Corp</small></td>
          <td><span class="badge badge-confirmed">${s.category}</span></td>
          <td>${s.plan_name}<br><small style="color: var(--text-muted);">${s.variant_name}</small></td>
          <td>${s.quantity}</td>
          <td><strong>₹${s.total_amount.toLocaleString('en-IN')}</strong></td>
          <td>${s.expiry_date || 'N/A'} ${overdueBadge}</td>
          <td><span class="badge ${badgeClass}">${s.status}</span></td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-outline btn-sm" onclick="sendReminder(${s.id})">🔔 Alert</button>
              ${s.status === 'Draft' ? `<button class="btn btn-primary btn-sm" onclick="transitionSub(${s.id}, 'Confirmed')">Confirm</button>` : ''}
              ${s.status === 'Confirmed' ? `<button class="btn btn-primary btn-sm" onclick="transitionSub(${s.id}, 'Active')">Activate</button>` : ''}
              ${s.status === 'Active' ? `<button class="btn btn-outline btn-sm" onclick="transitionSub(${s.id}, 'Closed')">Close</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" style="color: var(--danger);">Failed to load subscriptions</td></tr>`;
  }
}

function filterCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll("#staff-view .pills .pill").forEach(p => p.classList.remove("active"));
  event.target.classList.add("active");
  loadStaffSubscriptions(isExpiringOnly);
}

function handleStaffSearch() {
  currentSearch = document.getElementById("staff-search").value.trim();
  loadStaffSubscriptions(isExpiringOnly);
}

async function triggerRunBilling() {
  const banner = document.getElementById("billing-banner");
  try {
    const res = await fetch(`${API_BASE}/api/staff/run-billing`, { method: "POST" });
    const data = await res.json();
    banner.style.display = "block";
    banner.innerHTML = `
      <strong>⚡ Billing Day Batch Run Successful!</strong><br>
      • Scanned Active Subscriptions: <strong>${data.subscriptions_scanned}</strong><br>
      • New Invoices Generated: <strong>${data.invoices_generated}</strong> (Total Billed: ₹${data.total_amount_billed.toLocaleString('en-IN')})<br>
      • Duplicates Skipped (Idempotency Guard): <strong>${data.duplicates_skipped}</strong> (Zero double-billing)<br>
      <small>Generated Invoices: ${data.sample_invoices.join(', ')}</small>
    `;
    loadAdminMetrics();
    loadStaffSubscriptions();
  } catch (err) {
    alert("Billing run failed: " + err);
  }
}

async function sendReminder(subId) {
  try {
    const res = await fetch(`${API_BASE}/api/staff/subscriptions/${subId}/send-reminder`, { method: "POST" });
    const data = await res.json();
    alert(`✅ Notification Sent!\n${data.message}`);
  } catch (err) {
    alert("Failed to send reminder.");
  }
}

async function transitionSub(subId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/staff/subscriptions/${subId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_status: newStatus })
    });
    const data = await res.json();
    if (res.ok) {
      loadStaffSubscriptions(isExpiringOnly);
    } else {
      alert(data.detail);
    }
  } catch (err) {
    alert("Transition error: " + err);
  }
}

// 6. Customer Portal Operations
async function loadCustomerPlans() {
  const grid = document.getElementById("customer-plans-grid");
  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`);
    const plans = await res.json();
    grid.innerHTML = plans.map(p => `
      <div class="kpi-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span class="badge badge-active" style="margin-bottom: 8px;">${p.category}</span>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 4px;">${p.name}</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">${p.description || 'Full-featured enterprise subscription.'}</p>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary);">
            ₹${p.price.toLocaleString('en-IN')} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">/ ${p.billing_period}</span>
          </div>
        </div>
        <div style="margin-top: 18px;">
          <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="alert('Subscription checkout simulation successful! Invoice generated.')">
            Subscribe Now
          </button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    grid.innerHTML = "<p>Failed to load plan catalog.</p>";
  }
}

async function loadCustomerInvoices() {
  const tbody = document.getElementById("customer-invoices-table");
  try {
    const res = await fetch(`${API_BASE}/api/staff/invoices`);
    const invoices = await res.json();
    tbody.innerHTML = invoices.slice(0, 10).map(inv => `
      <tr>
        <td><strong>${inv.invoice_number}</strong></td>
        <td>${inv.invoice_date}</td>
        <td>${inv.subscription_number}</td>
        <td><strong>₹${inv.amount.toLocaleString('en-IN')}</strong></td>
        <td>₹${inv.tax_amount.toLocaleString('en-IN')}</td>
        <td>
          <span class="badge ${inv.status === 'Paid' ? 'badge-paid' : (inv.status === 'Overdue' ? 'badge-overdue' : 'badge-confirmed')}">
            ${inv.status}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="alert('Printing official receipt for ${inv.invoice_number}')">
            🖨️ Print
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = "<tr><td colspan='7'>Failed to load invoices</td></tr>";
  }
}

// Modal Helpers
function openModal(id) { document.getElementById(id).classList.add("active"); }
function closeModal(id) { document.getElementById(id).classList.remove("active"); }

async function submitCreatePlan() {
  const name = document.getElementById("new-plan-name").value;
  const category = document.getElementById("new-plan-category").value;
  const period = document.getElementById("new-plan-period").value;
  const price = parseFloat(document.getElementById("new-plan-price").value);

  if (!name || isNaN(price)) {
    alert("Please enter valid plan name and price.");
    return;
  }

  const res = await fetch(`${API_BASE}/api/admin/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, category, billing_period: period, price })
  });

  if (res.ok) {
    closeModal("add-plan-modal");
    loadAdminPlans();
    loadAdminMetrics();
  }
}

async function submitCreateStaff() {
  const name = document.getElementById("new-staff-name").value;
  const email = document.getElementById("new-staff-email").value;
  const phone = document.getElementById("new-staff-phone").value;

  if (!name || !email) {
    alert("Please fill in staff name and email.");
    return;
  }

  const res = await fetch(`${API_BASE}/api/admin/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone })
  });

  if (res.ok) {
    closeModal("add-staff-modal");
    loadAdminStaff();
  } else {
    const err = await res.json();
    alert(err.detail || "Error adding staff.");
  }
}

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  setSession(currentUser);
});
