   const STORAGE_KEY = "job_application_tracker_v1";
    let memoryStore = null;

    const applicationForm = document.getElementById("applicationForm");
    const applicationId = document.getElementById("applicationId");
    const companyInput = document.getElementById("companyInput");
    const roleInput = document.getElementById("roleInput");
    const statusInput = document.getElementById("statusInput");
    const dateInput = document.getElementById("dateInput");
    const formTitle = document.getElementById("formTitle");
    const saveButton = document.getElementById("saveButton");
    const clearButton = document.getElementById("clearButton");
    const searchInput = document.getElementById("searchInput");
    const applicationsWrap = document.getElementById("applicationsWrap");
    const filterButtons = document.querySelectorAll(".filter-btn");

    const countEls = {
      applied: document.getElementById("appliedCount"),
      interview: document.getElementById("interviewCount"),
      rejected: document.getElementById("rejectedCount"),
      offer: document.getElementById("offerCount")
    };

    let applications = loadApplications();
    let activeFilter = "all";
    dateInput.valueAsDate = new Date();

    function loadApplications() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        return memoryStore || [];
      }
    }

    function saveApplications() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      } catch (error) {
        memoryStore = JSON.parse(JSON.stringify(applications));
      }
    }

    function escapeHTML(text) {
      return String(text).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
    }

    function formatDate(value) {
      if (!value) return "—";
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
    }

    function resetForm() {
      applicationForm.reset();
      applicationId.value = "";
      dateInput.valueAsDate = new Date();
      formTitle.textContent = "Add application";
      saveButton.textContent = "Save application";
      companyInput.focus();
    }

    function getVisibleApplications() {
      const query = searchInput.value.trim().toLowerCase();
      return applications
        .filter(app => activeFilter === "all" || app.status === activeFilter)
        .filter(app => !query || app.company.toLowerCase().includes(query) || app.role.toLowerCase().includes(query))
        .sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
    }

    function renderCounts() {
      const counts = { applied: 0, interview: 0, rejected: 0, offer: 0 };
      applications.forEach(app => { counts[app.status] = (counts[app.status] || 0) + 1; });
      Object.entries(countEls).forEach(([status, element]) => { element.textContent = counts[status] || 0; });
    }

    function renderApplications() {
      const visible = getVisibleApplications();
      if (!visible.length) {
        applicationsWrap.innerHTML = `<div class="empty-state"><strong>${applications.length ? "No matching applications" : "No applications yet"}</strong>${applications.length ? "Try another filter or search term." : "Add your first job application using the form."}</div>`;
        return;
      }

      applicationsWrap.innerHTML = `
        <table>
          <thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Date applied</th><th>Actions</th></tr></thead>
          <tbody>
            ${visible.map(app => `
              <tr>
                <td data-label="Company" class="company-cell">${escapeHTML(app.company)}</td>
                <td data-label="Role" class="role-cell">${escapeHTML(app.role)}</td>
                <td data-label="Status"><span class="status-badge status-${app.status}">${escapeHTML(app.status)}</span></td>
                <td data-label="Date" class="date-cell">${formatDate(app.dateApplied)}</td>
                <td data-label="Actions" class="actions-cell">
                  <button class="btn-ghost small-btn" type="button" onclick="editApplication('${app.id}')">Edit</button>
                  <button class="btn-danger small-btn" type="button" onclick="deleteApplication('${app.id}')">Delete</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>`;
    }

    function render() { renderCounts(); renderApplications(); }

    applicationForm.addEventListener("submit", event => {
      event.preventDefault();
      const company = companyInput.value.trim();
      const role = roleInput.value.trim();
      const status = statusInput.value;
      const dateApplied = dateInput.value;
      const id = applicationId.value;
      if (!company || !role || !status || !dateApplied) return;

      if (id) {
        applications = applications.map(app => app.id === id ? { ...app, company, role, status, dateApplied, updatedAt: new Date().toISOString() } : app);
      } else {
        applications.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), company, role, status, dateApplied, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }

      saveApplications();
      resetForm();
      render();
    });

    clearButton.addEventListener("click", resetForm);
    searchInput.addEventListener("input", renderApplications);

    filterButtons.forEach(button => {
      button.addEventListener("click", () => {
        filterButtons.forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        activeFilter = button.dataset.filter;
        renderApplications();
      });
    });

    function editApplication(id) {
      const app = applications.find(item => item.id === id);
      if (!app) return;
      applicationId.value = app.id;
      companyInput.value = app.company;
      roleInput.value = app.role;
      statusInput.value = app.status;
      dateInput.value = app.dateApplied;
      formTitle.textContent = "Edit application";
      saveButton.textContent = "Update application";
      companyInput.focus();
    }

    function deleteApplication(id) {
      applications = applications.filter(app => app.id !== id);
      saveApplications();
      if (applicationId.value === id) resetForm();
      render();
    }

    render();