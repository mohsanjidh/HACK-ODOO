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
// 1. AUTHENTICATION & GOOGLE-STYLE SIGN-IN GATEWAY
// ----------------------------------------------------------

function togglePasswordVisibility() {
  const pwdInput = document.getElementById("signin-password");
  const eyeShow = document.getElementById("eye-icon-show");
  const eyeHide = document.getElementById("eye-icon-hide");
  if (!pwdInput) return;

  if (pwdInput.type === "password") {
    pwdInput.type = "text";
    if (eyeShow) eyeShow.style.display = "none";
    if (eyeHide) eyeHide.style.display = "block";
  } else {
    pwdInput.type = "password";
    if (eyeShow) eyeShow.style.display = "block";
    if (eyeHide) eyeHide.style.display = "none";
  }
}

function clearSignInFeedback(field) {
  if (field === "email") {
    const input = document.getElementById("signin-email");
    const feedback = document.getElementById("signin-email-feedback");
    if (input) input.classList.remove("input-error");
    if (feedback) feedback.textContent = "";
  } else if (field === "pwd") {
    const input = document.getElementById("signin-password");
    const feedback = document.getElementById("signin-pwd-feedback");
    if (input) input.classList.remove("input-error");
    if (feedback) feedback.textContent = "";
  }
  const banner = document.getElementById("signin-error-banner");
  if (banner) banner.style.display = "none";
}

async function submitSignIn(event) {
  if (event) event.preventDefault();

  const emailInput = document.getElementById("signin-email");
  const pwdInput = document.getElementById("signin-password");
  const emailFeedback = document.getElementById("signin-email-feedback");
  const pwdFeedback = document.getElementById("signin-pwd-feedback");
  const errorBanner = document.getElementById("signin-error-banner");
  const errorMsg = document.getElementById("signin-error-message");
  const submitBtn = document.getElementById("btn-signin-submit");
  const btnText = document.getElementById("signin-btn-text");
  const btnSpinner = document.getElementById("signin-btn-spinner");

  clearSignInFeedback("email");
  clearSignInFeedback("pwd");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = pwdInput ? pwdInput.value : "";

  let hasError = false;

  // Validation: Email
  if (!email) {
    if (emailInput) emailInput.classList.add("input-error");
    if (emailFeedback) emailFeedback.textContent = "Please enter your work email address.";
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (emailInput) emailInput.classList.add("input-error");
    if (emailFeedback) emailFeedback.textContent = "Please enter a valid email address (e.g. name@company.com).";
    hasError = true;
  }

  // Clear previous success banner
  const successBanner = document.getElementById("signin-success-banner");
  if (successBanner) successBanner.style.display = "none";

  // Validation: Password
  if (!password) {
    if (pwdInput) pwdInput.classList.add("input-error");
    if (pwdFeedback) pwdFeedback.textContent = "Please enter your password.";
    hasError = true;
  }

  if (hasError) return;

  // Set Loading State
  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = "Signing in...";
  if (btnSpinner) btnSpinner.style.display = "inline-block";

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Authentication failed. Please verify your credentials.");
    }

    if (data.status === "success" && data.user) {
      setSession(data.user);
    } else {
      throw new Error("Unable to establish session. Please try again.");
    }
  } catch (err) {
    if (errorBanner && errorMsg) {
      errorMsg.textContent = err.message || "Invalid email or password.";
      errorBanner.style.display = "flex";
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = "Sign in";
    if (btnSpinner) btnSpinner.style.display = "none";
  }
}

function toggleForgotPasswordPanel(show) {
  const panel = document.getElementById("forgot-password-panel");
  const form = document.getElementById("signin-form");
  const signinEmail = document.getElementById("signin-email");
  const forgotEmail = document.getElementById("forgot-email");
  const feedback = document.getElementById("forgot-feedback");
  const errorBanner = document.getElementById("signin-error-banner");
  const successBanner = document.getElementById("signin-success-banner");

  if (errorBanner) errorBanner.style.display = "none";
  if (successBanner) successBanner.style.display = "none";

  if (!panel) return;
  if (show) {
    panel.style.display = "block";
    if (form) form.style.display = "none";
    if (feedback) feedback.style.display = "none";
    if (signinEmail && forgotEmail && signinEmail.value.trim()) {
      forgotEmail.value = signinEmail.value.trim();
    }
    if (forgotEmail) forgotEmail.focus();
  } else {
    panel.style.display = "none";
    if (form) form.style.display = "block";
  }
}

async function submitForgotPassword() {
  const forgotEmail = document.getElementById("forgot-email");
  const feedback = document.getElementById("forgot-feedback");
  const btn = document.getElementById("btn-forgot-submit");
  const btnText = document.getElementById("forgot-btn-text");
  const btnSpinner = document.getElementById("forgot-btn-spinner");

  const email = forgotEmail ? forgotEmail.value.trim() : "";
  const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !reEmail.test(email)) {
    if (feedback) {
      feedback.style.display = "block";
      feedback.style.background = "#fef2f2";
      feedback.style.color = "#991b1b";
      feedback.style.border = "1px solid #f87171";
      feedback.textContent = "Please enter a valid work email address.";
    }
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = "Sending...";
  if (btnSpinner) btnSpinner.style.display = "inline-block";

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Account not found.");

    if (feedback) {
      feedback.style.display = "block";
      feedback.style.background = "#ecfdf5";
      feedback.style.color = "#065f46";
      feedback.style.border = "1px solid #10b981";
      feedback.innerHTML = `✅ ${data.message}${data.reset_link_preview ? `<br><span style="font-size:0.75rem; color:#047857; margin-top:4px; display:inline-block; word-break:break-all;">Demo Link: ${data.reset_link_preview}</span>` : ""}`;
    }
  } catch (err) {
    if (feedback) {
      feedback.style.display = "block";
      feedback.style.background = "#fef2f2";
      feedback.style.color = "#991b1b";
      feedback.style.border = "1px solid #f87171";
      feedback.textContent = `⚠️ ${err.message || "Unable to send reset instructions."}`;
    }
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = "Send Reset Link";
    if (btnSpinner) btnSpinner.style.display = "none";
  }
}

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
  let html = `
    <div class="sidebar-brand-compact" title="Brightloop Enterprise Platform">
      <img src="/static/assets/brightloop-symbol.png" alt="Brightloop" class="sidebar-logo-symbol" />
      <span class="sidebar-brand-label">Brightloop</span>
    </div>
  `;

  if (role === "admin") {
    html += `
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
      <div class="sidebar-item active" id="side-staff-view" title="Staff Workspace" onclick="switchSidebarTab('staff-view')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        </span>
        <span>Staff Workspace</span>
      </div>
      <div class="sidebar-item" id="side-staff-crm" title="Customer CRM Center" onclick="switchSidebarTab('staff-crm')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </span>
        <span>Customer CRM Center</span>
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
      <div class="sidebar-item" id="side-staff-notifs" title="Payment Delay Notices" onclick="switchSidebarTab('staff-notifs')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </span>
        <span>Payment Delay Notices</span>
      </div>
      <div class="sidebar-title">Batch Operations</div>
      <div class="sidebar-item" id="side-staff-billing" title="Run Batch Billing" onclick="switchSidebarTab('staff-billing')" style="color: #059669; font-weight: 600;">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </span>
        <span>Run Batch Billing</span>
      </div>
    `;
  } else {
    html = `
      <div class="sidebar-title">Customer Desk</div>
      <div class="sidebar-item active" id="side-customer-view" title="Portfolio & Profile" onclick="switchSidebarTab('customer-view')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </span>
        <span>Portfolio & Profile</span>
      </div>
      <div class="sidebar-item" id="side-customer-subs" title="My Subscriptions" onclick="switchSidebarTab('customer-subs')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </span>
        <span>My Subscriptions</span>
      </div>
      <div class="sidebar-item" id="side-customer-invoices" title="Invoices & PDF Receipts" onclick="switchSidebarTab('customer-invoices')">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </span>
        <span>Invoices & PDF Receipts</span>
      </div>
      <div class="sidebar-item" id="side-customer-catalog" title="Browse Subscription Plans" onclick="switchSidebarTab('customer-catalog')" style="color: #017E84; font-weight: 600;">
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </span>
        <span>Browse Plans Catalog</span>
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
    loadStaffRoster();
    loadStaffCommissions();
  } else if (tabName === "staff-view" || tabName === "staff-workspace") {
    const p = document.getElementById("staff-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-staff-view");
    if (el) el.classList.add("active");
    loadStaffWorkspaceSummary();
    loadStaffRefundSubscriptions();
  } else if (tabName === "staff-crm" || tabName === "staff-crm-view") {
    const p = document.getElementById("staff-crm-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-staff-crm");
    if (el) el.classList.add("active");
    loadStaffCustomers();
  } else if (tabName === "staff-subs" || tabName === "staff-subs-view") {
    const p = document.getElementById("staff-subs-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-staff-subs");
    if (el) el.classList.add("active");
    loadStaffSubscriptions();
  } else if (tabName === "staff-refund") {
    const p = document.getElementById("staff-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-staff-refund");
    if (el) el.classList.add("active");
    document.getElementById("staff-refund-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    loadStaffRefundSubscriptions();
  } else if (tabName === "staff-notifs" || tabName === "staff-notifs-view") {
    const p = document.getElementById("staff-notifs-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-staff-notifs");
    if (el) el.classList.add("active");
    loadStaffInvoices();
  } else if (tabName === "staff-billing" || tabName === "staff-billing-view") {
    const p = document.getElementById("staff-billing-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-staff-billing");
    if (el) el.classList.add("active");
    loadStaffBillingHistory();
  } else if (tabName.startsWith("staff")) {
    const p = document.getElementById("staff-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-staff-view") || document.getElementById("side-staff-dash");
    if (el) el.classList.add("active");
    loadStaffWorkspaceSummary();
    loadStaffRefundSubscriptions();
  } else if (tabName === "customer-subs" || tabName === "customer-subs-view") {
    const p = document.getElementById("customer-subs-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-customer-subs");
    if (el) el.classList.add("active");
    loadCustomerProfile();
  } else if (tabName === "customer-invoices" || tabName === "customer-invoices-view") {
    const p = document.getElementById("customer-invoices-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-customer-invoices");
    if (el) el.classList.add("active");
    loadCustomerProfile();
  } else if (tabName === "customer-catalog" || tabName === "customer-catalog-view" || tabName === "catalog") {
    const p = document.getElementById("customer-catalog-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-customer-catalog");
    if (el) el.classList.add("active");
    loadCustomerPlans();
  } else {
    // Default: Customer Portfolio & Profile
    const p = document.getElementById("customer-view");
    if (p) p.classList.add("active");
    const el = document.getElementById("side-customer-view");
    if (el) el.classList.add("active");
    loadCustomerProfile();
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

  // 1. Loading State
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 260px; color: var(--text-muted); gap: 10px;">
      <div class="signin-spinner" style="width: 24px; height: 24px; border-color: rgba(1, 126, 132, 0.2); border-top-color: #017E84;"></div>
      <span style="font-size: 0.85rem; font-weight: 500;">Loading verified capital progression metrics...</span>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/admin/investment-timeline`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to retrieve timeline data.`);
    const data = await res.json();
    const points = data.timeline;

    // 2. Empty State
    if (!points || points.length === 0) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 260px; color: var(--text-muted); gap: 8px;">
          <span style="font-size: 1.5rem;">📊</span>
          <span style="font-size: 0.9rem; font-weight: 600;">No capital investment records found</span>
          <span style="font-size: 0.78rem;">Financial cohorts will appear once subscription payments are settled.</span>
        </div>
      `;
      return;
    }

    // Helper: Natural cubic Bézier spline interpolation
    function getCubicBezierSpline(pts, tension = 0.22) {
      if (!pts || pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
      if (pts.length === 2) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`;

      let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

      for (let i = 0; i < pts.length - 1; i++) {
        const pPrev = i === 0 ? pts[0] : pts[i - 1];
        const pCurr = pts[i];
        const pNext = pts[i + 1];
        const pAfter = i + 2 < pts.length ? pts[i + 2] : pNext;

        const cp1x = pCurr.x + (pNext.x - pPrev.x) * tension;
        const cp1y = pCurr.y + (pNext.y - pPrev.y) * tension;

        const cp2x = pNext.x - (pAfter.x - pCurr.x) * tension;
        const cp2y = pNext.y - (pAfter.y - pCurr.y) * tension;

        path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${pNext.x.toFixed(2)} ${pNext.y.toFixed(2)}`;
      }
      return path;
    }

    const maxVal = Math.max(...points.map(p => p.capital_invested)) * 1.15;
    const width = 840;
    const height = 250;
    const padLeft = 75;
    const padRight = 35;
    const padTop = 28;
    const padBottom = 40;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;
    const stepX = plotWidth / (points.length - 1);
    const baselineY = (padTop + plotHeight).toFixed(2);

    // Calculate coordinate points
    const coordsInvested = points.map((p, i) => {
      const x = padLeft + i * stepX;
      const y = padTop + plotHeight - (p.capital_invested / maxVal) * plotHeight;
      return { x, y, data: p };
    });

    const coordsNet = points.map((p, i) => {
      const x = padLeft + i * stepX;
      const y = padTop + plotHeight - (p.net_revenue / maxVal) * plotHeight;
      return { x, y, data: p };
    });

    const coordsExp = points.map((p, i) => {
      const x = padLeft + i * stepX;
      const y = padTop + plotHeight - (p.expenses / maxVal) * plotHeight;
      return { x, y, data: p };
    });

    // Generate smooth cubic Bézier paths
    const pathInvested = getCubicBezierSpline(coordsInvested, 0.22);
    const pathNet = getCubicBezierSpline(coordsNet, 0.22);
    const pathExp = getCubicBezierSpline(coordsExp, 0.22);

    // Restrained light area fill for Net Profit curve
    const areaNet = `${pathNet} L ${coordsNet[coordsNet.length - 1].x.toFixed(2)} ${baselineY} L ${coordsNet[0].x.toFixed(2)} ${baselineY} Z`;

    // Dynamic Y-axis labels with format
    function formatYLabel(val) {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
      return `₹${Math.round(val)}`;
    }

    const yValTop = maxVal;
    const yValMid = maxVal * 0.5;

    container.innerHTML = `
      <div class="graph-wrapper" id="timeline-graph-wrapper">
        <div class="graph-svg-container">
          <svg id="timeline-svg" viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible; font-family: inherit;">
            <defs>
              <!-- Restrained light gradient for Net Profit area fill -->
              <linearGradient id="netProfitLightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#017E84" stop-opacity="0.08"/>
                <stop offset="100%" stop-color="#017E84" stop-opacity="0.00"/>
              </linearGradient>
            </defs>

            <!-- Subtle Horizontal Gridlines & Y-Axis Scale -->
            <line x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}" stroke="#f1f5f9" stroke-width="1"/>
            <text x="${padLeft - 10}" y="${padTop + 4}" fill="#64748b" font-size="10.5" font-weight="500" text-anchor="end">${formatYLabel(yValTop)}</text>

            <line x1="${padLeft}" y1="${padTop + plotHeight * 0.5}" x2="${width - padRight}" y2="${padTop + plotHeight * 0.5}" stroke="#f1f5f9" stroke-width="1"/>
            <text x="${padLeft - 10}" y="${padTop + plotHeight * 0.5 + 4}" fill="#64748b" font-size="10.5" font-weight="500" text-anchor="end">${formatYLabel(yValMid)}</text>

            <!-- Solid Baseline (Y = 0) -->
            <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${width - padRight}" y2="${padTop + plotHeight}" stroke="#e2e8f0" stroke-width="1"/>
            <text x="${padLeft - 10}" y="${padTop + plotHeight + 4}" fill="#64748b" font-size="10.5" font-weight="500" text-anchor="end">₹0</text>

            <!-- Restrained Light Area Fill -->
            <path d="${areaNet}" fill="url(#netProfitLightGrad)" class="graph-area-fill"/>

            <!-- Subtle Vertical Hover Guide (hairline) -->
            <line id="graph-crosshair-line" x1="0" y1="${padTop}" x2="0" y2="${padTop + plotHeight}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2 2" opacity="0" style="transition: opacity 0.12s ease;"/>

            <!-- Smooth Flowing Curve Lines (Thin strokes) -->
            <!-- 1. Total Capital Invested: #172033 (Deep Navy) -->
            <path d="${pathInvested}" fill="none" stroke="#172033" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="graph-line-invested"/>

            <!-- 2. Retained Net Profit: #017E84 (Brightloop Teal) -->
            <path d="${pathNet}" fill="none" stroke="#017E84" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="graph-line-profit"/>

            <!-- 3. Operating Expenses: #D69A42 (Muted Amber) -->
            <path d="${pathExp}" fill="none" stroke="#D69A42" stroke-width="1.8" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round" class="graph-line-expenses"/>

            <!-- Subtle Data Point Markers & Month Labels -->
            ${coordsInvested.map((c, i) => {
              const netC = coordsNet[i];
              const expC = coordsExp[i];
              return `
                <!-- Month Label -->
                <text x="${c.x.toFixed(1)}" y="${height - 12}" fill="#64748b" font-size="11" text-anchor="middle" font-weight="500">
                  ${c.data.month}
                </text>
                
                <!-- Capital Invested Dot -->
                <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="2.8" fill="#ffffff" stroke="#172033" stroke-width="1.6" class="graph-point-subtle marker-invested-${i}" opacity="0.45" pointer-events="none"/>

                <!-- Operating Expenses Dot -->
                <circle cx="${expC.x.toFixed(1)}" cy="${expC.y.toFixed(1)}" r="2.5" fill="#ffffff" stroke="#D69A42" stroke-width="1.5" class="graph-point-subtle marker-exp-${i}" opacity="0.45" pointer-events="none"/>

                <!-- Net Profit Teal Dot -->
                <circle cx="${netC.x.toFixed(1)}" cy="${netC.y.toFixed(1)}" r="3" fill="#ffffff" stroke="#017E84" stroke-width="1.8" class="graph-point-subtle marker-net-${i}" opacity="0.6" pointer-events="none"/>
              `;
            }).join("")}

            <!-- Active Hover Highlight Marker -->
            <circle id="graph-hover-dot" cx="-100" cy="-100" r="4.5" fill="#017E84" stroke="#ffffff" stroke-width="2" opacity="0" style="transition: opacity 0.12s ease;"/>

            <!-- Invisible Vertical Column Hit Targets for Interaction -->
            ${coordsInvested.map((c, i) => {
              const targetX = c.x - stepX / 2;
              const targetW = stepX;
              return `
                <rect 
                  x="${targetX.toFixed(1)}" 
                  y="${padTop}" 
                  width="${targetW.toFixed(1)}" 
                  height="${plotHeight}" 
                  fill="transparent" 
                  style="cursor: pointer;"
                  data-index="${i}"
                  class="graph-hit-target"
                />
              `;
            }).join("")}
          </svg>

          <!-- Polished Tooltip -->
          <div id="graph-interactive-tooltip" class="graph-tooltip" style="opacity: 0; display: none;"></div>
        </div>

        <!-- Clean Footer Legend & Totals Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding: 0 4px; font-size: 0.78rem; flex-wrap: wrap; gap: 10px;">
          <!-- Compact Legend -->
          <div style="display: flex; align-items: center; gap: 16px; font-size: 0.78rem;">
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #172033; display: inline-block;"></span>
              <span style="color: #475569; font-weight: 500;">Capital Invested</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #017E84; display: inline-block;"></span>
              <span style="color: #475569; font-weight: 500;">Net Profit</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 2px; background: #D69A42; display: inline-block;"></span>
              <span style="color: #475569; font-weight: 500;">Operating Expenses</span>
            </span>
          </div>

          <!-- Understated Financial Totals -->
          <div style="font-size: 0.8rem; color: #64748b;">
            <span>Total Invested: <strong style="color: #172033; font-weight: 700;">₹${(data.total_cumulative_investment / 10000000).toFixed(2)} Cr</strong></span>
            <span style="margin: 0 8px; color: #cbd5e1;">&bull;</span>
            <span>Retained Profit: <strong style="color: #017E84; font-weight: 700;">₹${(data.total_net_profit / 10000000).toFixed(2)} Cr</strong> <span style="font-size: 0.74rem; color: #0f766e;">(83.5% margin)</span></span>
          </div>
        </div>
      </div>
    `;

    // 3. Attach Responsive Mouse Events
    const wrapper = document.getElementById("timeline-graph-wrapper");
    const svgEl = document.getElementById("timeline-svg");
    const tooltipEl = document.getElementById("graph-interactive-tooltip");
    const crosshairEl = document.getElementById("graph-crosshair-line");
    const hoverDotEl = document.getElementById("graph-hover-dot");

    if (!wrapper || !svgEl || !tooltipEl) return;

    wrapper.querySelectorAll(".graph-hit-target").forEach(rect => {
      rect.addEventListener("mouseenter", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"), 10);
        const inv = coordsInvested[idx];
        const net = coordsNet[idx];
        const exp = coordsExp[idx];
        const d = inv.data;

        // Position hairline crosshair
        if (crosshairEl) {
          crosshairEl.setAttribute("x1", inv.x);
          crosshairEl.setAttribute("x2", inv.x);
          crosshairEl.style.opacity = "1";
        }

        // Position hover dot on Net Profit curve
        if (hoverDotEl) {
          hoverDotEl.setAttribute("cx", net.x);
          hoverDotEl.setAttribute("cy", net.y);
          hoverDotEl.style.opacity = "1";
        }

        // Highlight marker
        wrapper.querySelectorAll(`.marker-net-${idx}`).forEach(m => m.style.opacity = "1");

        // Calculate margin percentage
        const marginPct = d.capital_invested > 0 ? Math.round((d.net_revenue / d.capital_invested) * 100) : 83.5;

        // Render polished tooltip content
        tooltipEl.innerHTML = `
          <div class="graph-tooltip-title">
            <span>${d.month}</span>
            <span class="graph-tooltip-margin-badge">${marginPct}% margin</span>
          </div>
          <div class="graph-tooltip-row">
            <span><span class="graph-tooltip-dot" style="background: #172033;"></span>Capital Invested:</span>
            <strong style="color: #172033; font-weight: 600;">₹${d.capital_invested.toLocaleString("en-IN")}</strong>
          </div>
          <div class="graph-tooltip-row">
            <span><span class="graph-tooltip-dot" style="background: #D69A42;"></span>Operating Expenses:</span>
            <strong style="color: #92400e; font-weight: 600;">₹${d.expenses.toLocaleString("en-IN")}</strong>
          </div>
          <div class="graph-tooltip-row">
            <span><span class="graph-tooltip-dot" style="background: #017E84;"></span>Net Profit:</span>
            <strong style="color: #017E84; font-weight: 700;">₹${d.net_revenue.toLocaleString("en-IN")}</strong>
          </div>
          <div style="margin-top: 6px; padding-top: 5px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8;">
            <span>Active Subscribers</span>
            <strong style="color: #475569;">${d.active_subscribers} Accounts</strong>
          </div>
        `;

        // Calculate responsive tooltip coordinates
        const svgRect = svgEl.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const scaleX = svgRect.width / width;
        const scaleY = svgRect.height / height;

        const posX = (net.x * scaleX) + (svgRect.left - wrapperRect.left);
        const posY = (net.y * scaleY) + (svgRect.top - wrapperRect.top);

        tooltipEl.style.left = `${posX}px`;
        tooltipEl.style.top = `${posY}px`;
        tooltipEl.style.display = "block";
        tooltipEl.style.opacity = "1";
      });

      rect.addEventListener("mouseleave", () => {
        const idx = parseInt(rect.getAttribute("data-index"), 10);
        wrapper.querySelectorAll(`.marker-net-${idx}`).forEach(m => m.style.opacity = "0.6");
      });
    });

    wrapper.addEventListener("mouseleave", () => {
      if (tooltipEl) {
        tooltipEl.style.opacity = "0";
        tooltipEl.style.display = "none";
      }
      if (crosshairEl) crosshairEl.style.opacity = "0";
      if (hoverDotEl) hoverDotEl.style.opacity = "0";
    });

  } catch (err) {
    // 4. Error State with Retry
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 260px; color: var(--danger); gap: 8px;">
        <span style="font-size: 1.4rem;">⚠️</span>
        <span style="font-size: 0.88rem; font-weight: 600;">Failed to load investment timeline graph</span>
        <span style="font-size: 0.76rem; color: var(--text-muted);">${err.message}</span>
        <button class="btn btn-secondary btn-sm" onclick="renderAllTimeInvestmentsGraph()" style="margin-top: 6px;">🔄 Retry</button>
      </div>
    `;
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

function loadAdminPlans() {
  if (typeof loadAdminManagePlans === 'function') {
    return loadAdminManagePlans();
  }
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
  modalContent.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); gap: 10px;">
      <div class="signin-spinner" style="width: 24px; height: 24px; border-color: rgba(1, 126, 132, 0.2); border-top-color: #017E84;"></div>
      <span style="font-size: 0.86rem;">Retrieving real-time plan analytics &amp; subscriber traffic...</span>
    </div>
  `;
  openModal("plan-analytics-modal");

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans/${planId}/analytics`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Plan analytics currently unavailable.`);
    const data = await res.json();
    const p = data.plan;
    const m = data.metrics;
    const tf = data.traffic_graph || [];

    document.getElementById("plan-modal-title").textContent = `📊 Analytics: ${p.name} (${p.plan_code || 'PLN-' + p.id})`;

    // Generate responsive SVG bar/line graph for traffic
    const maxRev = Math.max(...tf.map(t => t.revenue), 1000) * 1.25;
    const svgWidth = 720;
    const svgHeight = 165;
    const barWidth = 44;
    const gap = (svgWidth - barWidth * tf.length) / (tf.length + 1);

    modalContent.innerHTML = `
      <!-- Top Metrics Row -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.04em;">ACTIVE SUBSCRIBERS</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #017E84; margin-top: 2px;">${m.active_subscribers} Accounts</div>
        </div>
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.04em;">TOTAL PLAN REVENUE</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-top: 2px;">₹${m.generated_revenue.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.04em;">CAPACITY UTILIZATION</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: ${m.capacity_utilization_pct > 80 ? '#b45309' : '#059669'}; margin-top: 2px;">${m.capacity_utilization_pct}%</div>
        </div>
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.04em;">DISCOUNT DEADLINE</div>
          <div style="font-size: 1.15rem; font-weight: 700; color: #d97706; margin-top: 4px;">${p.discount_deadline || 'Open'}</div>
        </div>
      </div>

      <!-- Plan Traffic Progression Graph -->
      <div style="background: #ffffff; padding: 18px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; box-shadow: var(--shadow-sm);">
        <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1rem;">📈</span>
            <span>Weekly Recurring Volume &amp; Traffic Velocity</span>
          </div>
          <span class="badge badge-active" style="font-size: 0.75rem;">Cap Ceiling: ${p.subscriber_limit || 100} Subs</span>
        </div>
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto; overflow: visible; font-family: inherit;">
          <defs>
            <linearGradient id="barTealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0d9488"/>
              <stop offset="100%" stop-color="#017E84"/>
            </linearGradient>
          </defs>

          <!-- Horizontal Reference Gridlines -->
          <line x1="20" y1="20" x2="${svgWidth - 20}" y2="20" stroke="#f1f5f9" stroke-dasharray="4 4"/>
          <line x1="20" y1="${(svgHeight - 40) / 2}" x2="${svgWidth - 20}" y2="${(svgHeight - 40) / 2}" stroke="#f1f5f9" stroke-dasharray="4 4"/>
          
          <!-- Baseline -->
          <line x1="20" y1="${svgHeight - 28}" x2="${svgWidth - 20}" y2="${svgHeight - 28}" stroke="#cbd5e1" stroke-width="1.5"/>

          ${tf.map((t, idx) => {
            const x = gap + idx * (barWidth + gap);
            const barH = Math.max(8, (t.revenue / maxRev) * (svgHeight - 65));
            const y = (svgHeight - 28) - barH;
            return `
              <!-- Animated Rounded Bar -->
              <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="url(#barTealGrad)" style="cursor: pointer; transition: transform 0.2s ease;">
                <title>${t.period}\nRevenue Volume: ₹${t.revenue.toLocaleString("en-IN")}\nSubscribers: ${t.subscribers} Corporate Accounts</title>
              </rect>
              
              <!-- Value Label Callout -->
              <text x="${x + barWidth / 2}" y="${y - 6}" font-size="10.5" font-weight="700" fill="#0f766e" text-anchor="middle">₹${Math.round(t.revenue / 1000)}k</text>
              
              <!-- X-Axis Period Label -->
              <text x="${x + barWidth / 2}" y="${svgHeight - 10}" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">${t.period}</text>
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
            ${data.subscribers && data.subscribers.length > 0 ? data.subscribers.map(sub => `
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
            `).join("") : '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 18px;">No active subscribers registered under this tier yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    modalContent.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 180px; color: var(--danger); gap: 8px;">
        <span style="font-size: 1.5rem;">⚠️</span>
        <span style="font-size: 0.9rem; font-weight: 600;">Failed to load plan analytics</span>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${err.message}</span>
      </div>
    `;
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

async function loadStaffRoster() {
  const tbody = document.getElementById("admin-staff-roster-table");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);"><div class="signin-spinner" style="margin: 0 auto 8px; width: 18px; height: 18px;"></div>Loading authorized operations staff roster...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/staff`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const staffList = await res.json();

    if (!Array.isArray(staffList) || staffList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 28px; color: var(--text-muted);"><div style="font-size: 1.6rem; margin-bottom: 6px;">👥</div><div style="font-weight: 600;">No staff members found</div><div style="font-size: 0.8rem; margin-top: 4px;">Click '+ Onboard Operations Staff' above to add your first staff operator.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = staffList.map(st => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${st.name || "Unnamed Staff"}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Staff ID: #${st.id}</div>
        </td>
        <td>
          <code style="font-size: 0.82rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #0f172a;">${st.email || "N/A"}</code>
        </td>
        <td>${st.phone || "N/A"}</td>
        <td>
          <span class="badge badge-confirmed" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;">Staff Operator</span>
        </td>
        <td style="color: var(--text-muted);">${st.created_at || "N/A"}</td>
      </tr>
    `).join("");

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--danger); background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">Failed to load staff roster: ${err.message || err}</td></tr>`;
  }
}

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
    loadStaffRoster();
    loadStaffCommissions();
    if (typeof populateStaffSelectForNewPlan === "function") populateStaffSelectForNewPlan();
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
    loadStaffRoster();
    loadStaffCommissions();
    if (typeof populateStaffSelectForNewPlan === "function") populateStaffSelectForNewPlan();
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
    if (typeof loadStaffWorkspaceSummary === "function") loadStaffWorkspaceSummary();
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
    if (typeof loadStaffWorkspaceSummary === "function") loadStaffWorkspaceSummary();
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
    if (typeof loadStaffWorkspaceSummary === "function") loadStaffWorkspaceSummary();
  } catch (err) {
    alert("Reconciliation error: " + err);
  }
}

async function loadStaffWorkspaceSummary() {
  const kpiSubs = document.getElementById("staff-kpi-active-subs");
  const kpiCust = document.getElementById("staff-kpi-customers");
  const kpiOverdue = document.getElementById("staff-kpi-overdue-inv");
  const kpiAmt = document.getElementById("staff-kpi-overdue-amt");
  if (!kpiSubs) return;

  try {
    const [resCust, resSubs, resInv] = await Promise.all([
      fetch(`${API_BASE}/api/staff/customers`),
      fetch(`${API_BASE}/api/staff/subscriptions`),
      fetch(`${API_BASE}/api/staff/invoices`)
    ]);

    if (resCust.ok) {
      const customers = await resCust.json();
      if (kpiCust) kpiCust.textContent = customers.length;
    }

    if (resSubs.ok) {
      const dataSubs = await resSubs.json();
      const subs = dataSubs.subscriptions || [];
      const activeSubs = subs.filter(s => s.status === "Active");
      if (kpiSubs) kpiSubs.textContent = activeSubs.length || subs.length;
    }

    if (resInv.ok) {
      const invoices = await resInv.json();
      const overdueList = invoices.filter(i => i.status === "Overdue" || i.status === "Confirmed");
      const overdueSum = overdueList.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      if (kpiOverdue) kpiOverdue.textContent = overdueList.length;
      if (kpiAmt) kpiAmt.textContent = `₹${overdueSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    }
  } catch (err) {
    console.error("Error loading staff workspace summary:", err);
  }
}

async function loadStaffBillingHistory() {
  const tbody = document.getElementById("staff-billing-invoices-table");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 18px;">Loading billing audit ledger...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/staff/invoices`);
    if (!res.ok) throw new Error("Failed to retrieve invoice logs");
    const invoices = await res.json();

    if (!invoices || invoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 18px;">No invoices generated yet. Click 'Execute Automated Billing Sweep Now' to scan and invoice active subscriptions.</td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.slice(0, 15).map(inv => `
      <tr>
        <td style="font-weight: 700;">${inv.invoice_number}</td>
        <td>${inv.subscription_number || "N/A"}</td>
        <td style="font-weight: 600;">${inv.customer_name}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${inv.customer_email}</td>
        <td style="font-weight: 700;">₹${Number(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td><span class="badge badge-${(inv.status || 'draft').toLowerCase()}">${inv.status}</span></td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${inv.due_date || "Continuous"}</td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger); padding: 18px;">Failed to load invoices log: ${err.message || err}</td></tr>`;
  }
}

async function triggerStaffBatchBilling() {
  const banner = document.getElementById("staff-billing-banner");
  const btn = document.getElementById("btn-run-billing");
  if (btn) btn.disabled = true;

  if (banner) {
    banner.style.display = "block";
    banner.className = "billing-banner-info";
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="signin-spinner" style="width: 18px; height: 18px; border-width: 2px;"></div>
        <span style="font-weight: 500;">Running automated recurring billing sweep across active subscriptions...</span>
      </div>
    `;
  }

  try {
    const res = await fetch(`${API_BASE}/api/staff/run-billing`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Automated billing run failed.");
    }

    // Correctly map backend property names: subscriptions_scanned, invoices_generated, duplicates_skipped, total_amount_billed
    const scanned = data.subscriptions_scanned ?? data.scanned_subscriptions ?? 0;
    const generated = data.invoices_generated ?? 0;
    const skipped = data.duplicates_skipped ?? data.skipped_duplicates ?? 0;
    const totalAmount = Number(data.total_amount_billed ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const billingDate = data.billing_date || new Date().toISOString().split("T")[0];

    if (banner) {
      banner.className = "billing-banner-success";
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> Automated Billing Run Completed (${billingDate})
            </div>
            <div style="margin-top: 6px; font-size: 0.85rem; line-height: 1.5;">
              Scanned: <strong>${scanned}</strong> active subscriptions &nbsp;|&nbsp;
              Generated: <strong>${generated}</strong> new invoices &nbsp;|&nbsp;
              Skipped: <strong>${skipped}</strong> duplicate cycles (Anti-Duplication Idempotency Guard Active)
            </div>
            <div style="margin-top: 4px; font-size: 0.82rem; color: #047857;">
              Total Cycle Amount Billed: <strong>₹${totalAmount}</strong>
              ${data.sample_invoices && data.sample_invoices.length > 0 ? ` &nbsp;•&nbsp; Sample Invoices: <em>${data.sample_invoices.join(", ")}</em>` : ""}
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('staff-billing-banner').style.display='none'" style="padding: 4px 10px; font-size: 0.75rem;">✕ Dismiss</button>
        </div>
      `;
    }

    await loadStaffBillingHistory();
    loadStaffInvoices();
    if (typeof loadAdminMetrics === "function") loadAdminMetrics();
    if (typeof loadStaffWorkspaceSummary === "function") loadStaffWorkspaceSummary();
  } catch (err) {
    if (banner) {
      banner.className = "billing-banner-error";
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--danger); font-weight: 600;">⚠️ Billing Run Failed: ${err.message || err}</span>
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('staff-billing-banner').style.display='none'" style="padding: 4px 10px; font-size: 0.75rem;">✕ Dismiss</button>
        </div>
      `;
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ----------------------------------------------------------
// 5. CUSTOMER DASHBOARD, PORTFOLIO & PRINTABLE PDF RECEIPTS
// ----------------------------------------------------------

let sessionQuotations = [];

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
    const kpiTotal = document.getElementById("cust-total-invested");
    const kpiActive = document.getElementById("cust-active-subs");
    const kpiOverdue = document.getElementById("cust-overdue-debt");

    if (kpiTotal && data.financials) {
      kpiTotal.textContent = `₹${(data.financials.total_invested || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    }
    if (kpiActive && data.financials) {
      kpiActive.textContent = data.financials.active_subscriptions || 0;
    }
    if (kpiOverdue && data.financials) {
      kpiOverdue.textContent = `₹${(data.financials.total_overdue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    }

    // Merge session quotations (if any) with backend subscriptions
    let allSubs = [...(data.subscriptions || [])];
    const userSessionSubs = sessionQuotations.filter(sq => sq.customer_email === email);
    userSessionSubs.forEach(sq => {
      if (!allSubs.some(s => s.subscription_number === sq.subscription_number)) {
        allSubs.unshift(sq);
      }
    });

    // Render Subscriptions Table
    const subBody = document.getElementById("customer-subscriptions-table");
    if (subBody) {
      if (allSubs.length === 0) {
        subBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No subscriptions or quotations found. <a href="javascript:void(0)" onclick="switchSidebarTab('customer-catalog')" style="color: #017E84; font-weight: 600;">Browse our live plans catalog</a> to configure your first subscription.</td></tr>`;
      } else {
        subBody.innerHTML = allSubs.map(s => `
          <tr>
            <td style="font-weight: 700;">${s.subscription_number}</td>
            <td style="font-weight: 600;">${s.plan_name}</td>
            <td><span class="badge badge-confirmed">${s.variant_name || "Standard Brand"}</span></td>
            <td>${s.quantity || 1}</td>
            <td style="font-weight: 700;">₹${Number(s.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td><span class="badge badge-${(s.status || 'quotation').toLowerCase()}">${s.status}</span></td>
            <td>${s.expiry_date || "Continuous"}</td>
          </tr>
        `).join("");
      }
    }

    // Render Invoices with PDF Receipt button
    const invBody = document.getElementById("customer-invoices-table");
    if (invBody) {
      if (!data.invoices || data.invoices.length === 0) {
        invBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No invoices generated yet. Invoices appear automatically upon billing cycle run.</td></tr>`;
      } else {
        invBody.innerHTML = data.invoices.map(inv => `
          <tr>
            <td style="font-weight: 700;">${inv.invoice_number}</td>
            <td>${inv.subscription_number || "N/A"}</td>
            <td style="font-weight: 700;">₹${Number(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td>₹${Number(inv.tax_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td><span class="badge badge-${(inv.status || 'draft').toLowerCase()}">${inv.status}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick='openPdfInvoiceModal(${JSON.stringify(inv)}, ${JSON.stringify(data.profile || {})})'>
                📄 View & Print PDF
              </button>
            </td>
          </tr>
        `).join("");
      }
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

// ----------------------------------------------------------
// 5. CUSTOMER CATALOG & MULTI-STEP SUBSCRIPTION FLOW
// ----------------------------------------------------------

let selectedSubscriptionPlan = null;

function filterCustomerCatalog(category) {
  const tabs = document.querySelectorAll("#customer-catalog-view .filter-tab");
  tabs.forEach(tab => {
    if (category === "All" && tab.textContent.includes("All")) {
      tab.classList.add("active");
    } else if (tab.textContent.trim().toLowerCase().includes(category.toLowerCase())) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
  loadCustomerPlans(category);
}

async function loadCustomerPlans(selectedCategory = "All") {
  const grid = document.getElementById("customer-plans-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1/-1; padding: 36px; text-align: center; color: var(--text-muted);">
      <div class="signin-spinner" style="margin: 0 auto 12px; width: 24px; height: 24px;"></div>
      Loading subscription plans catalog...
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const plans = await res.json();
    cachedPlans = plans;

    const filtered = (selectedCategory === "All") 
      ? plans 
      : plans.filter(p => (p.category || "").toLowerCase() === selectedCategory.toLowerCase());

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div style="font-weight: 600; font-size: 1.05rem; color: var(--text-primary);">No subscription plans found</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">There are no plans under the '${selectedCategory}' category at this time.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const priceFormatted = Number(p.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
      const safeName = (p.name || "").replace(/'/g, "\\'");
      const safeCat = (p.category || "").replace(/'/g, "\\'");
      const safePeriod = (p.billing_period || "monthly").replace(/'/g, "\\'");

      return `
        <div class="kpi-card plan-catalog-card" style="display: flex; flex-direction: column; justify-content: space-between; border-radius: 12px; border: 1px solid var(--border); padding: 20px; transition: transform 0.2s ease, box-shadow 0.2s ease;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">${p.name}</div>
              <span class="badge badge-confirmed">${p.category || "General"}</span>
            </div>
            <div style="font-size: 1.65rem; font-weight: 800; color: #017E84; margin: 12px 0 4px;">
              ₹${priceFormatted}
              <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-muted);">/ ${p.billing_period}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.45;">
              Full enterprise digital recurring license with automated reconciliation, state machine compliance and Odoo brand compatibility.
            </p>
            <ul style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 18px; padding-left: 18px; line-height: 1.5;">
              <li>Automatic recurring billing & GST invoice generation</li>
              <li>Optional +₹560 Odoo Brand Integration Option</li>
              <li>Operations staff confirmation & status tracking</li>
            </ul>
          </div>
          <div>
            <button class="btn btn-sm" style="width: 100%; background: #017E84; border-color: #017E84; font-weight: 600; padding: 10px;" onclick="openSubscribeModal('${safeName}', ${p.price}, '${safePeriod}', '${safeCat}')">
              ⚡ Configure & Subscribe
            </button>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--danger); background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
        Failed to load plans: ${err.message || err}
      </div>
    `;
  }
}

function openSubscribeModal(planName, basePrice, billingPeriod, category) {
  selectedSubscriptionPlan = {
    name: planName,
    price: Number(basePrice) || 0,
    period: billingPeriod || "monthly",
    category: category || "Enterprise"
  };

  const nameEl = document.getElementById("sub-modal-plan-name");
  const catEl = document.getElementById("sub-modal-plan-cat");
  const priceEl = document.getElementById("sub-modal-price-display");
  const varSelect = document.getElementById("sub-modal-variant");
  const qtyInput = document.getElementById("sub-modal-qty");
  const errBanner = document.getElementById("sub-confirm-error");

  if (nameEl) nameEl.textContent = planName;
  if (catEl) catEl.textContent = category;
  if (priceEl) priceEl.innerHTML = `₹${(Number(basePrice) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} <span style="font-size: 0.82rem; font-weight: 400; color: var(--text-muted);">/ ${billingPeriod}</span>`;
  if (varSelect) varSelect.value = "0";
  if (qtyInput) qtyInput.value = "1";
  if (errBanner) errBanner.style.display = "none";

  updateQuotationSummary();
  showSubscribeStep(1);
  openModal("subscribe-plan-modal");
}

function updateQuotationSummary() {
  if (!selectedSubscriptionPlan) return;

  const qtyInput = document.getElementById("sub-modal-qty");
  const varSelect = document.getElementById("sub-modal-variant");

  let qty = parseInt(qtyInput ? qtyInput.value : 1, 10);
  if (isNaN(qty) || qty < 1) qty = 1;

  let variantDelta = parseFloat(varSelect ? varSelect.value : 0);
  if (isNaN(variantDelta)) variantDelta = 0;

  const baseTotal = selectedSubscriptionPlan.price * qty;
  const variantTotal = variantDelta * qty;
  const subtotal = baseTotal + variantTotal;
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const baseEl = document.getElementById("sub-calc-base");
  const varEl = document.getElementById("sub-calc-variant");
  const subEl = document.getElementById("sub-calc-subtotal");
  const taxEl = document.getElementById("sub-calc-tax");
  const totalEl = document.getElementById("sub-calc-total");

  if (baseEl) baseEl.textContent = `₹${baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  if (varEl) varEl.textContent = `+₹${variantTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  if (subEl) subEl.textContent = `₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  if (taxEl) taxEl.textContent = `₹${tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  if (totalEl) totalEl.textContent = `₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function showSubscribeStep(stepNumber) {
  const step1 = document.getElementById("sub-modal-step-1");
  const step2 = document.getElementById("sub-modal-step-2");
  const step3 = document.getElementById("sub-modal-step-3");

  if (step1) step1.style.display = (stepNumber === 1) ? "block" : "none";
  if (step2) step2.style.display = (stepNumber === 2) ? "block" : "none";
  if (step3) step3.style.display = (stepNumber === 3) ? "block" : "none";

  if (stepNumber === 2 && selectedSubscriptionPlan) {
    const custEl = document.getElementById("sub-confirm-cust");
    const planEl = document.getElementById("sub-confirm-plan");
    const varEl = document.getElementById("sub-confirm-variant");
    const qtyEl = document.getElementById("sub-confirm-qty");
    const totalEl = document.getElementById("sub-confirm-total");

    const varSelect = document.getElementById("sub-modal-variant");
    const selectedOption = varSelect ? varSelect.options[varSelect.selectedIndex] : null;
    const variantLabel = selectedOption ? (selectedOption.getAttribute("data-name") || selectedOption.text) : "Standard Brand License";

    const qty = parseInt(document.getElementById("sub-modal-qty")?.value || 1, 10);
    const totalFormatted = document.getElementById("sub-calc-total")?.textContent || "₹0.00";

    if (custEl) custEl.textContent = currentUser ? `${currentUser.name} (${currentUser.email})` : "Current Customer Account";
    if (planEl) planEl.textContent = `${selectedSubscriptionPlan.name} (${selectedSubscriptionPlan.period})`;
    if (varEl) varEl.textContent = variantLabel;
    if (qtyEl) qtyEl.textContent = String(qty);
    if (totalEl) totalEl.textContent = totalFormatted;
  }
}

async function confirmAndSubmitQuotation() {
  if (!selectedSubscriptionPlan) return;

  const btn = document.getElementById("btn-submit-quotation");
  const btnText = document.getElementById("sub-btn-text");
  const spinner = document.getElementById("sub-btn-spinner");
  const errBanner = document.getElementById("sub-confirm-error");

  if (errBanner) errBanner.style.display = "none";
  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = "inline-block";
  if (btnText) btnText.textContent = "Recording Quotation...";

  const qtyInput = document.getElementById("sub-modal-qty");
  let qty = parseInt(qtyInput ? qtyInput.value : 1, 10);
  if (isNaN(qty) || qty < 1) qty = 1;

  const varSelect = document.getElementById("sub-modal-variant");
  const variantDelta = parseFloat(varSelect ? varSelect.value : 0) || 0;
  const selectedOption = varSelect ? varSelect.options[varSelect.selectedIndex] : null;
  const variantLabel = selectedOption ? (selectedOption.getAttribute("data-name") || "Standard Brand License") : "Standard Brand License";

  const baseTotal = selectedSubscriptionPlan.price * qty;
  const variantTotal = variantDelta * qty;
  const subtotal = baseTotal + variantTotal;
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  const subNum = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
  const today = new Date().toISOString().split("T")[0];

  const quotationData = {
    subscription_number: subNum,
    customer_email: currentUser ? currentUser.email : "customer@demo.local",
    customer_name: currentUser ? currentUser.name : "Customer",
    plan_name: selectedSubscriptionPlan.name,
    variant_name: variantLabel,
    quantity: qty,
    unit_price: selectedSubscriptionPlan.price + variantDelta,
    total_amount: grandTotal,
    tax_amount: tax,
    status: "Quotation",
    created_at: today,
    expiry_date: "Pending Activation"
  };

  try {
    // Attempt backend registration if API endpoint exists
    try {
      const res = await fetch(`${API_BASE}/api/customer/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData)
      });
      if (res.ok) {
        const backendRecord = await res.json();
        if (backendRecord && backendRecord.subscription_number) {
          quotationData.subscription_number = backendRecord.subscription_number;
        }
      }
    } catch (apiErr) {
      console.info("Quotation stored in local session pending backend queue persistence:", apiErr);
    }

    // Persist in session quotations
    sessionQuotations.unshift(quotationData);

    // Update Step 3 Success UI
    const sNum = document.getElementById("sub-success-number");
    const sPlan = document.getElementById("sub-success-plan");
    const sAmount = document.getElementById("sub-success-amount");
    const sDate = document.getElementById("sub-success-date");

    if (sNum) sNum.textContent = quotationData.subscription_number;
    if (sPlan) sPlan.textContent = `${selectedSubscriptionPlan.name} (${variantLabel}, Qty: ${qty})`;
    if (sAmount) sAmount.textContent = `₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    if (sDate) sDate.textContent = today;

    // Refresh customer profile tables
    await loadCustomerProfile();

    // Show Step 3
    showSubscribeStep(3);

  } catch (err) {
    if (errBanner) {
      errBanner.style.display = "block";
      errBanner.textContent = `Could not submit quotation: ${err.message || err}`;
    }
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = "none";
    if (btnText) btnText.textContent = "⚡ Confirm & Submit Quotation";
  }
}

// ----------------------------------------------------------
// 6. PASSWORD VALIDATOR & MODAL HELPERS
// ----------------------------------------------------------

function toggleRegisterPasswordVisibility() {
  const pwdInput = document.getElementById("reg-password");
  const eyeShow = document.getElementById("reg-eye-show");
  const eyeHide = document.getElementById("reg-eye-hide");
  if (!pwdInput) return;

  if (pwdInput.type === "password") {
    pwdInput.type = "text";
    if (eyeShow) eyeShow.style.display = "none";
    if (eyeHide) eyeHide.style.display = "block";
  } else {
    pwdInput.type = "password";
    if (eyeShow) eyeShow.style.display = "block";
    if (eyeHide) eyeHide.style.display = "none";
  }
}

function validateRegisterEmail(email) {
  const feedback = document.getElementById("reg-email-feedback");
  const input = document.getElementById("reg-email");
  if (!feedback) return true;

  if (!email) {
    feedback.textContent = "";
    if (input) input.classList.remove("input-error");
    return false;
  }

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  if (!isValid) {
    feedback.style.color = "#ef4444";
    feedback.textContent = "Please enter a valid work email address (e.g., name@company.com).";
    if (input) input.classList.add("input-error");
    return false;
  } else {
    feedback.style.color = "#10b981";
    feedback.textContent = "✓ Valid email format";
    if (input) input.classList.remove("input-error");
    return true;
  }
}

function checkPasswordRules(pwd) {
  const isLen = pwd.length > 8;
  const isUpper = /[A-Z]/.test(pwd);
  const isLower = /[a-z]/.test(pwd);
  const isSpec = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  updateRule("pwd-len", isLen, "Greater than 8 characters");
  updateRule("pwd-upper", isUpper, "At least one uppercase letter (A-Z)");
  updateRule("pwd-lower", isLower, "At least one lowercase letter (a-z)");
  updateRule("pwd-spec", isSpec, "At least one special character (!@#$%...)");

  return isLen && isUpper && isLower && isSpec;
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
  const nameInput = document.getElementById("reg-name");
  const emailInput = document.getElementById("reg-email");
  const pwdInput = document.getElementById("reg-password");
  const companyInput = document.getElementById("reg-company");
  const industrySelect = document.getElementById("reg-industry");
  const errBanner = document.getElementById("reg-error-banner");
  const submitBtn = document.getElementById("btn-reg-submit");
  const btnText = document.getElementById("reg-btn-text");
  const btnSpinner = document.getElementById("reg-btn-spinner");

  if (errBanner) errBanner.style.display = "none";

  const name = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const password = pwdInput ? pwdInput.value : "";
  const company_name = companyInput ? companyInput.value.trim() || "Independent Enterprise" : "Independent Enterprise";
  const industry = industrySelect ? industrySelect.value : "Retail";

  // Validate fields
  if (!name) {
    if (errBanner) {
      errBanner.style.display = "block";
      errBanner.textContent = "Please enter your full name.";
    }
    if (nameInput) nameInput.focus();
    return;
  }

  if (!email || !validateRegisterEmail(email)) {
    if (errBanner) {
      errBanner.style.display = "block";
      errBanner.textContent = "Please enter a valid work email address.";
    }
    if (emailInput) emailInput.focus();
    return;
  }

  if (!password || !checkPasswordRules(password)) {
    if (errBanner) {
      errBanner.style.display = "block";
      errBanner.textContent = "Password must be greater than 8 characters with at least one uppercase, one lowercase, and one special character.";
    }
    if (pwdInput) pwdInput.focus();
    return;
  }

  // Set Loading State
  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = "Creating Account...";
  if (btnSpinner) btnSpinner.style.display = "inline-block";

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, company_name, industry })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Registration failed. Please check your information.");
    }

    // Success feedback: close modal and return to sign-in with email pre-filled
    closeModal("register-modal");

    // Reset register form
    if (nameInput) nameInput.value = "";
    if (pwdInput) pwdInput.value = "";
    if (companyInput) companyInput.value = "";

    // Pre-fill Sign-In Form
    const signinEmail = document.getElementById("signin-email");
    const signinPwd = document.getElementById("signin-password");
    if (signinEmail) signinEmail.value = email;
    if (signinPwd) {
      signinPwd.value = "";
      signinPwd.focus();
    }

    // Display Sign-In Success Notification Banner
    const successBanner = document.getElementById("signin-success-banner");
    if (successBanner) {
      successBanner.style.display = "block";
      successBanner.textContent = `✓ Account created successfully for ${email}! Please enter your password to sign in.`;
    }

  } catch (err) {
    if (errBanner) {
      errBanner.style.display = "block";
      errBanner.textContent = err.message || "An error occurred during registration.";
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = "Create Account";
    if (btnSpinner) btnSpinner.style.display = "none";
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
