function renderCodespaceEditor(editor) {
  const normalized = String(editor || "vscode").toLowerCase();
  const icons = {
    vscode: {
      label: "Visual Studio Code",
      icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path fill='currentColor' d='M3.59 7.05a1 1 0 0 0-.32.72v8.46a1 1 0 0 0 1.62.78l3.17-2.64 5.26 4.78a1 1 0 0 0 .67.25h.12l4.83-.9A1 1 0 0 0 19.5 17V7a1 1 0 0 0-.86-.99l-4.83-.9h-.12a1 1 0 0 0-.67.25L8.06 9.16 4.89 6.52a1 1 0 0 0-1.3.53ZM8.17 12l-2.28 1.9v-3.8Zm2.41 0 4.46-4.05v8.1Zm6.46-4.86v9.72l-2.9.53V6.61Z'/></svg>",
    },
    jetbrains: {
      label: "JetBrains IDE",
      icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path fill='currentColor' d='M3 3h18v18H3V3Zm12.43 3.69-2.43 2.43-2.43-2.43-2.44 2.44 2.43 2.43-2.43 2.43 2.44 2.44 2.43-2.43 2.43 2.43 2.44-2.44-2.43-2.43 2.43-2.43-2.44-2.43Z'/></svg>",
    },
    web: {
      label: "VS Code for Web",
      icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path fill='currentColor' d='M5 3h14a2 2 0 0 1 2 2v2h-2V5H5v14h14v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm9 8h6v2h-6v3l-4-4 4-4v3Z'/></svg>",
    },
  };

  const fallback = {
    label: `Editor: ${normalized}`,
    icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path fill='currentColor' d='M4 4h16v16H4V4Zm4 2v12h8V6H8Z'/></svg>",
  };

  const config = icons[normalized] || fallback;
  return `
    <span class="codespace-editor">
      <span class="codespace-editor__icon" aria-hidden="true">${
        config.icon
      }</span>
      <span class="codespace-editor__label">${escapeHtml(config.label)}</span>
    </span>
  `;
}

async function handleDashboardCodespaceAction(event) {
  if (!dashboardEditMode) return;
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const codespaceId = target.dataset.id;
  if (!codespaceId) return;
  if (target.dataset.action === "edit-codespace") {
    const codespace = findCodespaceById(codespaceId);
    if (codespace) {
      populateCodespaceForm(codespace);
      setDashboardEditMode(true);
    }
  } else if (target.dataset.action === "delete-codespace") {
    await removeCodespace(codespaceId);
  }
}

async function handleDashboardNoteAction(event) {
  if (!dashboardEditMode) return;
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const noteId = target.dataset.id;
  if (!noteId) return;

  if (target.dataset.action === "edit-note") {
    const note = findNoteById(noteId);
    if (note) {
      populateNoteForm(note);
      setDashboardEditMode(true);
    }
  } else if (target.dataset.action === "delete-note") {
    await removeNote(noteId);
  }
}
function findNoteById(noteId) {
  return ADMIN_TEAM_NOTES.find((note) => note.id === noteId) || null;
}

function findCodespaceById(codespaceId) {
  return (
    PROJECT_CODESPACES.find((codespace) => codespace.id === codespaceId) || null
  );
}

function populateNoteForm(note) {
  const form = document.getElementById("dashboard-note-form");
  if (!form || !note) return;
  form.dataset.editingId = note.id;
  const titleInput = form.querySelector("#dashboard-note-title");
  const bodyInput = form.querySelector("#dashboard-note-body");
  const authorInput = form.querySelector("#dashboard-note-author");
  if (titleInput) titleInput.value = note.title || "";
  if (bodyInput) bodyInput.value = note.body || "";
  if (authorInput) authorInput.value = note.author || "";
  setNoteTaskRows(note.tasks || []);
  ensureNoteTaskRowExists();
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Update note";
  const focusTarget = form.querySelector("#dashboard-note-title");
  focusTarget?.focus();
}

function resetNoteForm() {
  const form = document.getElementById("dashboard-note-form");
  if (!form) return;
  form.reset();
  delete form.dataset.editingId;
  clearNoteTaskRows();
  ensureNoteTaskRowExists();
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Add note";
}

function populateCodespaceForm(codespace) {
  const form = document.getElementById("dashboard-codespace-form");
  if (!form || !codespace) return;

  form.classList.remove("hidden");
  form.dataset.editingId = codespace.id;

  const projectInput = form.querySelector("#dashboard-codespace-project");
  const repositoryInput = form.querySelector("#dashboard-codespace-repo");
  const branchInput = form.querySelector("#dashboard-codespace-branch");
  const statusSelect = form.querySelector("#dashboard-codespace-status");
  const regionInput = form.querySelector("#dashboard-codespace-region");
  const urlInput = form.querySelector("#dashboard-codespace-url");
  const repoUrlInput = form.querySelector("#dashboard-codespace-repo-url");
  const editorSelect = form.querySelector("#dashboard-codespace-editor");
  const descriptionInput = form.querySelector(
    "#dashboard-codespace-description"
  );

  if (projectInput) projectInput.value = codespace.project || "";
  if (repositoryInput) repositoryInput.value = codespace.repository || "";
  if (branchInput) branchInput.value = codespace.branch || "";
  if (statusSelect)
    statusSelect.value = String(codespace.status || "running").toLowerCase();
  if (regionInput) regionInput.value = codespace.region || "";
  if (urlInput) urlInput.value = codespace.url || "";
  if (repoUrlInput) repoUrlInput.value = codespace.repo_url || "";
  if (editorSelect)
    editorSelect.value = String(codespace.editor || "vscode").toLowerCase();
  if (descriptionInput)
    descriptionInput.value = codespace.description ? codespace.description : "";

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Update codespace";

  const focusTarget = projectInput || form.querySelector("input, textarea");
  focusTarget?.focus();
}

function resetCodespaceForm() {
  const form = document.getElementById("dashboard-codespace-form");
  if (!form) return;

  form.reset();
  delete form.dataset.editingId;

  const statusSelect = form.querySelector("#dashboard-codespace-status");
  const editorSelect = form.querySelector("#dashboard-codespace-editor");
  if (statusSelect) statusSelect.value = "running";
  if (editorSelect) editorSelect.value = "vscode";

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Add codespace";
}

function removeNote(noteId) {
  if (!noteId) return;

  const index = ADMIN_TEAM_NOTES.findIndex((note) => note.id === noteId);
  if (index >= 0) {
    ADMIN_TEAM_NOTES.splice(index, 1);
    renderAdminTeamNotes("dashboard-team-notes");
  }

  if (
    document.getElementById("dashboard-note-form")?.dataset.editingId === noteId
  ) {
    resetNoteForm();
  }

  stageDashboardChange("notes", noteId, "delete");
  showNotification(
    "Note removal queued. Click Save changes to apply.",
    "info",
    "Pending removal"
  );
}

function removeCodespace(codespaceId) {
  if (!codespaceId) return;
  const index = PROJECT_CODESPACES.findIndex(
    (codespace) => codespace.id === codespaceId
  );
  if (index >= 0) {
    PROJECT_CODESPACES.splice(index, 1);
    renderAdminCodespaces("dashboard-codespaces");
  }
  if (
    document.getElementById("dashboard-codespace-form")?.dataset.editingId ===
    codespaceId
  ) {
    resetCodespaceForm();
  }
  stageDashboardChange("codespaces", codespaceId, "delete");
  showNotification(
    "Codespace removal queued. Click Save changes to apply.",
    "info",
    "Pending removal"
  );
}
const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:4010/api"
    : `${window.location.protocol}//${window.location.hostname}/api`;

const TEAM_MEMBERS = [
  {
    name: "Oleksandr Koval",
    role: "Technical Lead",
    review:
      "Oleksandr is the backbone of our technical strategy. His deep expertise ensures our platforms are robust, scalable, and secure.",
    bio: "Ukrainian student who has a passion for technology and innovation. Has experience in web development and cloud computing. Created a full-stack project like this website. Has some knowledge in machine learning, graph building, R and C++",
    tenure: "Joined 2025",
    focusAreas: [
      "Platform Architecture",
      "Cloud Transferring",
      "AI Integration",
    ],
    location: "Vinnytsia, Ukraine",
    contact: {
      email: "muaronok@gmail.com",
      linkedin: "https://www.linkedin.com/in/oleksandr-koval-932015384/",
      github: "https://github.com/oleksandkov",
      website:
        "https://raw.githack.com/oleksandkov/oleksandkov-maded/refs/heads/main/website/index.html",
    },
    image:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Halyna Liubchych",
    role: "Product Strategist",
    review:
      "Halyna translates customer voices into actionable plans. Her roadmaps balance ambition with realistic delivery timelines.",
    bio: "Ukrainian experienced book redactor with a strong background in editing and publishing. Halyna brings a keen eye for detail and a passion for clear, impactful communication to every project.",
    tenure: "Joined 2025",
    focusAreas: [
      "Vision & Roadmaps",
      "Stakeholder Facilitation",
      "Impact Reporting",
    ],
    location: "Kyiv, Ukraine",
    contact: {
      email: "galina.lubchich@gmail.com",
      linkedin: "https://www.linkedin.com/in/halyna-liubchych-9a255353/",
    },
    image:
      "https://images.unsplash.com/photo-1521570177351-293a39c1a356?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Andriy Koval",
    role: "UX Researcher",
    review:
      "Andriy is an experienced data analyst. Worked in a field of Ai learing and data science. Have experience in R over 5 years. Strone knowledge of statistics and mathematics.",
    bio: "Ukrainian data analyst with a strong background in statistics and mathematics. Andriy brings a methodical approach to problem-solving and a passion for uncovering insights from complex datasets.",
    tenure: "Joined 2025",
    focusAreas: ["Field Studies", "Service Blueprints", "Accessibility Audits"],
    location: "Edmonton, Canada",
    contact: {
      email: "andriy.koval@gov.ab.ca",
      linkedin: "https://www.linkedin.com/in/andriy-v-koval/",
    },
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
  },
];

function formatNotificationTooltip(state, title) {
  const normalized = normalizeNotificationState(state);
  if (!normalized.sent) {
    return title ? `Send a notification for “${title}”` : "Send a notification";
  }
  const sentAt = normalized.sent_at
    ? formatEventDateTime(normalized.sent_at, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;
  if (title) {
    return sentAt
      ? `Notification sent for “${title}” on ${sentAt}`
      : `Notification already sent for “${title}”`;
  }
  return sentAt
    ? `Notification sent on ${sentAt}`
    : "Notification already sent";
}

function renderArticleNotificationAction(article) {
  if (!CAN_MANAGE_ARTICLES || !article || article.pendingAction) return "";
  const state = normalizeNotificationState(article.notification_state);
  const sent = state.sent;
  const classes = ["icon-button", "icon-button-notify"];
  if (sent) {
    classes.push("icon-button-notify--sent");
  }
  const tooltip = formatNotificationTooltip(state, article.title || "");
  const label = sent ? "Notified" : "Notify";
  const icon = sent ? "✅" : "📣";
  const disabledAttr = sent ? "disabled" : "";
  return `<button type="button" class="${classes.join(
    " "
  )}" data-action="notify-article" data-id="${escapeHtml(
    article.id
  )}" aria-label="${escapeHtml(tooltip)}" title="${escapeHtml(
    tooltip
  )}" ${disabledAttr}>${icon} ${label}</button>`;
}

function renderPodcastNotificationAction(podcast) {
  if (!CAN_MANAGE_ARTICLES || !podcast || podcast.pendingAction) return "";
  const state = normalizeNotificationState(podcast.notification_state);
  const sent = state.sent;
  const classes = ["icon-button", "icon-button-notify"];
  if (sent) {
    classes.push("icon-button-notify--sent");
  }
  const tooltip = formatNotificationTooltip(state, podcast.title || "");
  const label = sent ? "Notified" : "Notify";
  const icon = sent ? "✅" : "📣";
  const disabledAttr = sent ? "disabled" : "";
  return `<button type="button" class="${classes.join(
    " "
  )}" data-action="notify-podcast" data-id="${escapeHtml(
    podcast.id
  )}" aria-label="${escapeHtml(tooltip)}" title="${escapeHtml(
    tooltip
  )}" ${disabledAttr}>${icon} ${label}</button>`;
}

function initializeHeroParallax() {
  const hero = document.querySelector(".hero-parallax");
  if (!hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    hero.style.setProperty("--hero-parallax-offset", "0px");
    return;
  }

  let ticking = false;

  const updateParallax = () => {
    const rect = hero.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const heroTop = rect.top + scrollY;
    const rawOffset = scrollY - heroTop;
    const limit = rect.height;
    const clampedOffset = Math.max(-limit, Math.min(limit, rawOffset));
    hero.style.setProperty("--hero-parallax-offset", `${clampedOffset}px`);
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    }
  };

  requestUpdate();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", (event) => {
      if (event.matches) {
        hero.style.setProperty("--hero-parallax-offset", "0px");
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
      } else {
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
        requestUpdate();
        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);
      }
    });
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener((event) => {
      if (event.matches) {
        hero.style.setProperty("--hero-parallax-offset", "0px");
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
      } else {
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
        requestUpdate();
        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);
      }
    });
  }
}

const PROJECT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const CODESPACE_STATUS_OPTIONS = [
  { value: "running", label: "Running" },
  { value: "idle", label: "Idle" },
  { value: "stopped", label: "Stopped" },
  { value: "error", label: "Error" },
];

const CODESPACE_EDITOR_OPTIONS = [
  { value: "vscode", label: "Visual Studio Code" },
  { value: "jetbrains", label: "JetBrains IDE" },
  { value: "web", label: "VS Code for Web" },
];

const ADMIN_TEAM_NOTES = [];

const PROJECT_CODESPACES = [];

const DASHBOARD_ARTICLES = [];
const DOCUMENT_LIBRARY = [];
const DASHBOARD_PODCASTS = [];

let CAN_MANAGE_ARTICLES = false;
let articleHeroImagePickerReset = null;
let articleHeroImageStatusTimeout = null;
const articleAttachmentPickerResets = new WeakMap();
const articleGalleryPickerResets = new WeakMap();
const articleAudioPickerResets = new WeakMap();
let podcastAudioPickerReset = null;
let podcastAudioPicker = null;

let dashboardEditMode = false;
let dashboardViewMode = "guest";
let guestArticleEditMode = false;
let guestArticleEditorHome = null;
let guestPodcastEditMode = false;
let dashboardAdminDataLoaded = false;
let noteTaskCounter = 0;
let articleLinkCounter = 0;
let articleAttachmentCounter = 0;
let articleImageCounter = 0;
let articleAudioCounter = 0;
let activeArticleAttachmentUploads = 0;
let activeArticleImageUploads = 0;
let activeArticleAudioUploads = 0;
let activePodcastAudioUploads = 0;
let podcastAudioData = null;

const DASHBOARD_PENDING_CHANGES = {
  notes: new Map(),
  codespaces: new Map(),
  articles: new Map(),
  podcasts: new Map(),
};

let dashboardHasPendingChanges = false;

function getPendingChangeStore(entity) {
  return DASHBOARD_PENDING_CHANGES[entity] || null;
}

function getPendingChangeCount(entity) {
  const store = getPendingChangeStore(entity);
  return store ? store.size : 0;
}

function hasPendingChangesFor(entity) {
  return getPendingChangeCount(entity) > 0;
}

function hasPendingDashboardChanges() {
  return Object.values(DASHBOARD_PENDING_CHANGES).some(
    (store) => store && store.size > 0
  );
}

function updateDashboardSaveButtonState() {
  const saveBtn = document.getElementById("dashboard-save-button");
  if (!saveBtn) return;

  const isBusy = saveBtn.dataset.busy === "true";
  const allowSaveContext =
    dashboardEditMode ||
    guestArticleEditMode ||
    guestPodcastEditMode ||
    dashboardHasPendingChanges;
  const shouldEnable =
    allowSaveContext && !isBusy && dashboardHasPendingChanges;
  saveBtn.disabled = !shouldEnable;
  saveBtn.setAttribute("aria-disabled", shouldEnable ? "false" : "true");

  updateGuestSaveButtonsState();
}

function updateDashboardSaveButtonVisibility() {
  const saveBtn = document.getElementById("dashboard-save-button");
  if (!saveBtn) return;

  const shouldShow =
    dashboardEditMode ||
    guestArticleEditMode ||
    guestPodcastEditMode ||
    dashboardHasPendingChanges;

  saveBtn.classList.toggle("hidden", !shouldShow);

  updateGuestSaveButtonsState();
}

function updateGuestSaveButtonsState() {
  const canManageGuest = CAN_MANAGE_ARTICLES && dashboardViewMode === "guest";

  const articleButton = document.getElementById("guest-article-save-button");
  if (articleButton) {
    const busy = articleButton.dataset.busy === "true";
    const articleChanges = hasPendingChangesFor("articles");
    const shouldShow =
      canManageGuest && (guestArticleEditMode || articleChanges);
    articleButton.classList.toggle("hidden", !shouldShow);
    const canSave = canManageGuest && articleChanges && !busy;
    articleButton.disabled = !canSave;
    articleButton.setAttribute("aria-disabled", !canSave ? "true" : "false");
  }

  const podcastButton = document.getElementById("guest-podcast-save-button");
  if (podcastButton) {
    const busy = podcastButton.dataset.busy === "true";
    const podcastChanges = hasPendingChangesFor("podcasts");
    const shouldShow =
      canManageGuest && (guestPodcastEditMode || podcastChanges);
    podcastButton.classList.toggle("hidden", !shouldShow);
    const canSave = canManageGuest && podcastChanges && !busy;
    podcastButton.disabled = !canSave;
    podcastButton.setAttribute("aria-disabled", !canSave ? "true" : "false");
  }
}

function setDashboardSaveButtonBusy(busy) {
  const saveBtn = document.getElementById("dashboard-save-button");
  if (!saveBtn) return;

  if (busy) {
    if (!saveBtn.dataset.busyLabel) {
      saveBtn.dataset.busyLabel = saveBtn.textContent || "Save changes";
    }
    saveBtn.dataset.busy = "true";
    saveBtn.disabled = true;
    saveBtn.setAttribute("aria-busy", "true");
    saveBtn.textContent = "Saving…";
  } else {
    saveBtn.dataset.busy = "false";
    saveBtn.removeAttribute("aria-busy");
    if (saveBtn.dataset.busyLabel) {
      saveBtn.textContent = saveBtn.dataset.busyLabel;
      delete saveBtn.dataset.busyLabel;
    }
    updateDashboardSaveButtonState();
  }
}

function setDashboardDirtyState(forceState) {
  const nextState =
    typeof forceState === "boolean" ? forceState : hasPendingDashboardChanges();
  const normalized = Boolean(nextState);

  if (dashboardHasPendingChanges === normalized) {
    updateDashboardSaveButtonState();
    return;
  }

  dashboardHasPendingChanges = normalized;
  if (typeof document !== "undefined" && document.body) {
    document.body.dataset.dashboardDirty = normalized ? "true" : "false";
  }

  updateDashboardSaveButtonVisibility();
  updateDashboardSaveButtonState();
}

function resetDashboardPendingChanges() {
  Object.values(DASHBOARD_PENDING_CHANGES).forEach((store) => {
    if (store?.clear) store.clear();
  });

  const collections = [
    ADMIN_TEAM_NOTES,
    PROJECT_CODESPACES,
    DASHBOARD_ARTICLES,
    DASHBOARD_PODCASTS,
  ];

  collections.forEach((items) => {
    items.forEach((item) => {
      if (item && typeof item === "object" && "pendingAction" in item) {
        delete item.pendingAction;
      }
    });
  });

  setDashboardDirtyState(false);
}

function stageDashboardChange(entity, id, action, payload) {
  const store = getPendingChangeStore(entity);
  if (!store) return;

  const key = id || generateUniqueId(`${entity}-change`);
  const existing = store.get(key);

  if (!action) {
    store.delete(key);
  } else if (action === "delete") {
    if (existing?.action === "create") {
      store.delete(key);
    } else {
      store.set(key, { action: "delete" });
    }
  } else {
    let nextAction = action;
    if (existing?.action === "create" && action === "update") {
      nextAction = "create";
    }
    store.set(key, {
      action: nextAction,
      payload: payload ?? null,
    });
  }

  if (store.size === 0) {
    setDashboardDirtyState();
    return;
  }

  setDashboardDirtyState(true);
}

function renderAdminArticleCard(article) {
  if (!article) return "";
  const pendingBadge = renderPendingBadge(article.pendingAction);
  const actionsMarkup = CAN_MANAGE_ARTICLES
    ? `<div class="dashboard-article-actions">
        ${renderArticleNotificationAction(article)}
        <button type="button" class="icon-button" data-action="edit-article" data-id="${escapeHtml(
          article.id
        )}">Edit</button>
        <button type="button" class="icon-button icon-button-danger" data-action="delete-article" data-id="${escapeHtml(
          article.id
        )}">Delete</button>
      </div>`
    : "";
  const authorChips = renderArticleAuthorChips(article.authors);
  const isGuestEditPreview =
    dashboardViewMode === "guest" && guestArticleEditMode;

  if (isGuestEditPreview) {
    const articleImageSource =
      selectPreferredAssetUrl(article, {
        mode: "hero",
      }) ||
      article.image_src ||
      article.image_url;
    const heroAltRaw = article.title || "Article image";
    let mediaMarkup = "";
    if (articleImageSource) {
      const previewUrl = resolveAssetUrl(articleImageSource);
      mediaMarkup = `
        <div class="dashboard-article-compact-media">
          <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(
        heroAltRaw
      )}" loading="lazy" />
        </div>`;
    } else {
      const initial =
        (article.title || "A").trim().charAt(0).toUpperCase() || "A";
      mediaMarkup = `
        <div class="dashboard-article-compact-media dashboard-article-compact-media--placeholder" aria-hidden="true">
          <span>${escapeHtml(initial)}</span>
        </div>`;
    }

    return `
      <article class="dashboard-article dashboard-article--compact" data-id="${escapeHtml(
        article.id
      )}">
        ${mediaMarkup}
        <div class="dashboard-article-compact-body">
          <h4>${escapeHtml(article.title)}${
      pendingBadge ? ` ${pendingBadge}` : ""
    }</h4>
          <div class="dashboard-article-authors">${authorChips}</div>
        </div>
        ${actionsMarkup}
      </article>
    `;
  }

  const articleImageSource =
    selectPreferredAssetUrl(article, {
      mode: "hero",
    }) ||
    article.image_src ||
    article.image_url;
  const imageMarkup = articleImageSource
    ? (() => {
        const previewUrl = resolveAssetUrl(articleImageSource);
        const fallbackBase = article.title
          ? `${slugifyForFilename(article.title, "article")}-hero`
          : "guest-article-image";
        const heroAltRaw = article.title || "Article image";
        const { downloadHref, downloadName } = resolveImageLightboxDetails(
          article,
          {
            previewUrl,
            fallbackName: fallbackBase,
            fallbackTitle: article.title,
          }
        );
        const lightboxAttributes = buildLightboxAttributes({
          src: previewUrl,
          alt: heroAltRaw,
          caption: article.description || "",
          downloadHref,
          downloadName,
        });
        const ariaLabel = escapeHtml(
          `Open ${article.title || "article"} image in fullscreen`
        );
        return `
         <figure class="dashboard-article-thumb">
           <button type="button" class="lightbox-trigger" ${lightboxAttributes} aria-label="${ariaLabel}">
             <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(
          heroAltRaw
        )}" loading="lazy" />
             <span class="lightbox-trigger__icon" aria-hidden="true">🔍</span>
           </button>
         </figure>`;
      })()
    : "";
  const linksMarkup = renderArticleLinksList(article.links);
  const attachmentsMarkup = renderArticleAttachmentsList(article.attachments);
  const galleryMarkup = renderArticleGallery(article.gallery_images, {
    variant: "admin",
    contextTitle: article.title,
  });
  const audioMarkup = renderArticleAudioTracks(article.audio_tracks, {
    variant: "admin",
  });

  return `
    <article class="dashboard-article" data-id="${escapeHtml(article.id)}">
      <header class="dashboard-article-header">
        <div>
          <h4>${escapeHtml(article.title)}${
    pendingBadge ? ` ${pendingBadge}` : ""
  }</h4>
          <div class="dashboard-article-authors">${authorChips}</div>
        </div>
        ${actionsMarkup}
      </header>
      ${imageMarkup}
      ${
        article.description
          ? `<p class="dashboard-article-description">${escapeHtml(
              article.description
            )}</p>`
          : ""
      }
  ${linksMarkup}
  ${galleryMarkup}
  ${audioMarkup}
  ${attachmentsMarkup}
    </article>
  `;
}

function collectPendingDashboardOperations() {
  const entities = ["notes", "codespaces", "articles", "podcasts"];
  const operations = [];
  entities.forEach((entity) => {
    const store = getPendingChangeStore(entity);
    if (!store) return;
    store.forEach((change, id) => {
      operations.push({ entity, id, ...change });
    });
  });
  return operations;
}

const NOTIFICATION_PREFERENCE_KEY = "notifications.preference";
const NOTIFICATION_CONTACT_KEY = "notifications.contact";
const NOTIFICATION_VERIFIED_KEY = "notifications.contact.verified";

let notificationsEnabled = getStoredNotificationPreference();
let notificationModalResolver = null;
let notificationModalLastFocus = null;
let notificationModalOptions = null;
let notificationModalElements = null;
let notificationModalKeydownBound = false;

function applyNotificationPreferenceToDom() {
  if (typeof document === "undefined" || !document.body) return;
  document.body.dataset.notifications = notificationsEnabled ? "on" : "off";
}

applyNotificationPreferenceToDom();

const DASHBOARD_VIEW_MODE_STORAGE_KEY = "dashboardViewModePreference";

function getStoredDashboardViewMode() {
  try {
    const stored = localStorage.getItem(DASHBOARD_VIEW_MODE_STORAGE_KEY);
    return stored === "admin" || stored === "guest" ? stored : null;
  } catch (error) {
    return null;
  }
}

function setStoredDashboardViewMode(mode) {
  try {
    if (mode === "admin" || mode === "guest") {
      localStorage.setItem(DASHBOARD_VIEW_MODE_STORAGE_KEY, mode);
    } else {
      localStorage.removeItem(DASHBOARD_VIEW_MODE_STORAGE_KEY);
    }
  } catch (error) {
    // Ignore storage errors to avoid blocking UI updates.
  }
}

function getStoredNotificationPreference() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
    if (stored === "off") return false;
    if (stored === "on") return true;
  } catch (error) {
    // Ignore storage issues, fall back to enabled state.
  }
  return true;
}

function getStoredNotificationContact() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_CONTACT_KEY);
    return stored ? stored.trim() : "";
  } catch (error) {
    return "";
  }
}

function persistNotificationContact(email) {
  try {
    const value = email ? String(email).trim() : "";
    if (value) {
      localStorage.setItem(NOTIFICATION_CONTACT_KEY, value);
    } else {
      localStorage.removeItem(NOTIFICATION_CONTACT_KEY);
    }
  } catch (error) {
    // Ignore persistence issues silently.
  }
}

function getStoredNotificationVerification() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_VERIFIED_KEY);
    return stored === "true";
  } catch (error) {
    return false;
  }
}

function persistNotificationVerification(enabled) {
  try {
    if (enabled) {
      localStorage.setItem(NOTIFICATION_VERIFIED_KEY, "true");
    } else {
      localStorage.removeItem(NOTIFICATION_VERIFIED_KEY);
    }
  } catch (error) {
    // Ignore persistence issues silently.
  }
}

function persistNotificationPreference(enabled) {
  try {
    localStorage.setItem(NOTIFICATION_PREFERENCE_KEY, enabled ? "on" : "off");
  } catch (error) {
    // Silently ignore persistence failures.
  }
}

function setNotificationsEnabled(nextEnabled, options = {}) {
  const desired = Boolean(nextEnabled);
  if (notificationsEnabled === desired) {
    updateNotificationToggleUi();
    return;
  }
  notificationsEnabled = desired;
  persistNotificationPreference(desired);
  applyNotificationPreferenceToDom();
  updateNotificationToggleUi();
  if (options.announce !== false) {
    showNotification(
      desired ? "Notifications are now turned on." : "Notifications are muted.",
      desired ? "success" : "info",
      "Notifications",
      { force: true }
    );
  }
}

function ensureNotificationModalElements() {
  if (notificationModalElements) {
    return notificationModalElements;
  }
  if (typeof document === "undefined") return null;
  const modal = document.getElementById("notification-optin-modal");
  if (!modal) return null;
  const form = document.getElementById("notification-optin-form");
  const emailInput = document.getElementById("notification-optin-email");
  const verifiedInput = document.getElementById(
    "notification-optin-verification"
  );
  const submitButton = modal.querySelector('button[type="submit"]');

  notificationModalElements = {
    modal,
    form,
    emailInput,
    verifiedInput,
    submitButton,
  };

  if (!modal.dataset.bound) {
    const closeControls = modal.querySelectorAll('[data-action="close-modal"]');
    closeControls.forEach((control) => {
      control.addEventListener("click", () => closeNotificationOptInModal());
    });

    modal.addEventListener("click", (event) => {
      const target = event.target;
      if (
        target === modal ||
        (target &&
          target.classList &&
          target.classList.contains("modal__backdrop"))
      ) {
        closeNotificationOptInModal();
      }
    });

    form?.addEventListener("submit", handleNotificationModalSubmit);
    modal.dataset.bound = "true";
  }

  if (!notificationModalKeydownBound) {
    document.addEventListener("keydown", handleNotificationModalKeydown);
    notificationModalKeydownBound = true;
  }

  return notificationModalElements;
}

function openNotificationOptInModal(options = {}) {
  const elements = ensureNotificationModalElements();
  if (!elements) {
    return Promise.resolve(null);
  }

  const { modal, emailInput, verifiedInput, submitButton } = elements;

  if (notificationModalResolver) {
    notificationModalResolver(null);
    notificationModalResolver = null;
  }

  notificationModalLastFocus = document.activeElement;
  notificationModalOptions = { ...options };

  const storedEmail = getStoredNotificationContact();
  const storedVerified = getStoredNotificationVerification();

  if (emailInput) {
    const emailCandidate =
      typeof options.prefillEmail === "string" && options.prefillEmail.trim()
        ? options.prefillEmail.trim()
        : storedEmail;
    emailInput.value = emailCandidate || "";
  }

  if (verifiedInput) {
    const verifiedCandidate =
      typeof options.prefillVerified === "boolean"
        ? options.prefillVerified
        : storedVerified;
    verifiedInput.checked = Boolean(verifiedCandidate);
  }

  modal.setAttribute("aria-hidden", "false");
  document.body.dataset.notificationModal = "open";

  setNotificationModalBusy(false);

  requestAnimationFrame(() => {
    modal.classList.add("modal--visible");
    if (emailInput) {
      emailInput.focus();
      emailInput.select?.();
    } else {
      submitButton?.focus();
    }
  });

  return new Promise((resolve) => {
    notificationModalResolver = resolve;
  });
}

function ensureNotificationModalStructure() {
  if (typeof document === "undefined") return null;
  let modal = document.getElementById("notification-optin-modal");
  if (modal) return modal;
  if (!document.body) return null;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
      <div
        class="modal notification-modal"
        id="notification-optin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-optin-title"
        aria-hidden="true"
      >
        <div class="modal__backdrop" data-action="close-modal"></div>
        <div class="modal__dialog" role="document">
          <header class="modal__header">
            <h2 id="notification-optin-title">Enable content alerts</h2>
            <button
              type="button"
              class="modal__close"
              data-action="close-modal"
              aria-label="Close notification preferences"
            >
              ×
            </button>
          </header>
          <div class="modal__body">
            <p>
              Stay in the loop when new articles or podcast episodes are
              published. You can switch this off anytime from the footer toggle.
            </p>
            <form class="modal__form" id="notification-optin-form">
              <fieldset>
                <legend class="sr-only">Notification destinations</legend>
                <div class="form-field">
                  <label for="notification-optin-email">Delivery email</label>
                  <input
                    type="email"
                    id="notification-optin-email"
                    name="email"
                    placeholder="you@example.com"
                    autocomplete="email"
                    required
                  />
                  <p class="form-hint">
                    We'll send updates to this address when new content goes
                    live.
                  </p>
                </div>
                <div class="form-field">
                  <label class="checkbox">
                    <input
                      type="checkbox"
                      id="notification-optin-verification"
                      name="verified"
                    />
                    <span>I'm a verified team member (skip manual confirmation)</span>
                  </label>
                </div>
              </fieldset>
            </form>
          </div>
          <footer class="modal__footer">
            <button type="button" class="button-secondary" data-action="close-modal">
              Not now
            </button>
            <button type="submit" form="notification-optin-form" class="button-primary">
              Enable notifications
            </button>
          </footer>
        </div>
      </div>
    `.trim();

  modal = wrapper.firstElementChild;
  if (!modal) return null;
  document.body.appendChild(modal);
  return modal;
}

function ensureNotificationModalElements() {
  if (notificationModalElements) {
    return notificationModalElements;
  }
  if (typeof document === "undefined") return null;
  const modal = ensureNotificationModalStructure();
  if (!modal) return null;
  const form = modal.querySelector("#notification-optin-form");
  const emailInput = modal.querySelector("#notification-optin-email");
  const verifiedInput = modal.querySelector("#notification-optin-verification");
  const submitButton = modal.querySelector('button[type="submit"]');
  const closeControls = modal.querySelectorAll('[data-action="close-modal"]');

  notificationModalElements = {
    modal,
    form,
    emailInput,
    verifiedInput,
    submitButton,
  };

  if (!modal.dataset.bound) {
    if (closeControls?.length) {
      closeControls.forEach((control) => {
        control.addEventListener("click", () => closeNotificationOptInModal());
      });
    }

    modal.addEventListener("click", (event) => {
      const target = event.target;
      if (
        target === modal ||
        (target &&
          target.classList &&
          target.classList.contains("modal__backdrop"))
      ) {
        closeNotificationOptInModal();
      }
    });

    form?.addEventListener("submit", handleNotificationModalSubmit);
    modal.dataset.bound = "true";
  }

  if (!notificationModalKeydownBound) {
    document.addEventListener("keydown", handleNotificationModalKeydown);
    notificationModalKeydownBound = true;
  }

  return notificationModalElements;
}

function closeNotificationOptInModal(result = null) {
  const elements = ensureNotificationModalElements();
  if (!elements) return;
  const { modal, form } = elements;
  if (!modal) return;

  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove("modal--visible");
  delete document.body.dataset.notificationModal;
  form?.reset();
  setNotificationModalBusy(false);

  if (notificationModalResolver) {
    notificationModalResolver(result);
    notificationModalResolver = null;
  }

  const returnFocus = notificationModalLastFocus;
  notificationModalLastFocus = null;
  notificationModalOptions = null;

  if (returnFocus && typeof returnFocus.focus === "function") {
    requestAnimationFrame(() => returnFocus.focus());
  }
}

function setNotificationModalBusy(busy) {
  const elements = ensureNotificationModalElements();
  if (!elements) return;
  const { submitButton } = elements;
  if (!submitButton) return;
  if (busy) {
    submitButton.disabled = true;
    submitButton.dataset.originalLabel =
      submitButton.dataset.originalLabel || submitButton.textContent || "";
    submitButton.textContent = "Enabling…";
    submitButton.setAttribute("aria-busy", "true");
  } else {
    if (submitButton.dataset.originalLabel) {
      submitButton.textContent = submitButton.dataset.originalLabel;
      delete submitButton.dataset.originalLabel;
    }
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
  }
}

async function handleNotificationModalSubmit(event) {
  event.preventDefault();
  const elements = ensureNotificationModalElements();
  if (!elements) {
    closeNotificationOptInModal(null);
    return;
  }

  const { emailInput, verifiedInput } = elements;
  const rawEmail = emailInput?.value ? String(emailInput.value).trim() : "";

  if (!rawEmail) {
    emailInput?.focus();
    emailInput?.reportValidity?.();
    return;
  }

  setNotificationModalBusy(true);

  const previousState = notificationsEnabled;
  const verified = Boolean(verifiedInput?.checked);

  persistNotificationContact(rawEmail);
  persistNotificationVerification(verified);

  setNotificationsEnabled(true, { announce: false });

  try {
    await api("/auth/me/notifications", {
      method: "PATCH",
      body: JSON.stringify({ enabled: true }),
    });
  } catch (error) {
    setNotificationsEnabled(previousState, { announce: false });
    const message =
      error?.message || "Failed to enable notifications. Please try again.";
    showNotification(message, "error", "Notifications");
    setNotificationModalBusy(false);
    return;
  }

  setNotificationsEnabled(true);
  closeNotificationOptInModal({ email: rawEmail, verified });
}

function handleNotificationModalKeydown(event) {
  if (event.key !== "Escape") return;
  const elements =
    notificationModalElements || ensureNotificationModalElements();
  if (!elements?.modal) return;
  if (elements.modal.getAttribute("aria-hidden") === "true") return;
  event.preventDefault();
  closeNotificationOptInModal();
}

async function toggleNotifications(event) {
  if (event?.preventDefault) {
    event.preventDefault();
  }

  if (notificationsEnabled) {
    setNotificationsEnabled(false);
    return;
  }

  const storedContact = getStoredNotificationContact();
  const ready = await ensureNotificationsReady({
    prefillEmail: storedContact || undefined,
  });
  if (!ready) {
    updateNotificationToggleUi();
    return;
  }

  setNotificationsEnabled(true);
}

function setNotificationButtonBusy(button, busy) {
  if (!button) return;
  if (busy) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add("is-busy");
    button.setAttribute("aria-busy", "true");
    button.innerHTML = "⏳ Sending…";
  } else {
    button.classList.remove("is-busy");
    button.removeAttribute("aria-busy");
    const wasSent = button.classList.contains("icon-button-notify--sent");
    if (!wasSent) {
      button.disabled = false;
    }
    if (button.dataset.originalLabel) {
      button.innerHTML = button.dataset.originalLabel;
      delete button.dataset.originalLabel;
    }
  }
}

async function ensureNotificationsReady(options = {}) {
  const storedContact = getStoredNotificationContact();
  if (notificationsEnabled && storedContact) {
    return true;
  }

  const user = typeof getUser === "function" ? getUser() : null;
  const emailCandidates = [
    typeof options.prefillEmail === "string" ? options.prefillEmail : null,
    storedContact,
    user?.email,
    user?.contact_email,
    user?.contact?.email,
  ];
  let prefillEmail = "";
  for (const candidate of emailCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      prefillEmail = candidate.trim();
      break;
    }
  }

  const storedVerified = getStoredNotificationVerification();
  const verifiedCandidates = [
    typeof options.prefillVerified === "boolean"
      ? options.prefillVerified
      : null,
    typeof storedVerified === "boolean" ? storedVerified : null,
    typeof user?.email_verified === "boolean" ? user.email_verified : null,
    typeof user?.emailVerified === "boolean" ? user.emailVerified : null,
    typeof user?.verified === "boolean" ? user.verified : null,
    typeof user?.is_verified === "boolean" ? user.is_verified : null,
  ];
  let prefillVerified;
  for (const candidate of verifiedCandidates) {
    if (typeof candidate === "boolean") {
      prefillVerified = candidate;
      break;
    }
  }

  const result = await openNotificationOptInModal({
    prefillEmail,
    prefillVerified,
  });
  return Boolean(result);
}

function applyArticleNotificationUpdate(articleId, payload = {}) {
  if (!articleId) return;
  const index = DASHBOARD_ARTICLES.findIndex(
    (article) => article.id === articleId
  );
  if (index < 0) return;

  const current = DASHBOARD_ARTICLES[index] || {};
  const normalizedState = normalizeNotificationState(
    payload.notification_state || payload
  );
  const next = {
    ...current,
    notification_state: normalizedState,
  };

  if (payload.updated_at) {
    next.updated_at = payload.updated_at;
  } else if (normalizedState.sent_at && !current.pendingAction) {
    next.updated_at = normalizedState.sent_at;
  }

  DASHBOARD_ARTICLES[index] = next;
  renderAdminArticles("dashboard-articles-list");
  renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
}

function applyPodcastNotificationUpdate(podcastId, payload = {}) {
  if (!podcastId) return;
  const index = DASHBOARD_PODCASTS.findIndex(
    (podcast) => podcast.id === podcastId
  );
  if (index < 0) return;

  const current = DASHBOARD_PODCASTS[index] || {};
  const normalizedState = normalizeNotificationState(
    payload.notification_state || payload
  );
  const next = {
    ...current,
    notification_state: normalizedState,
  };

  if (payload.updated_at) {
    next.updated_at = payload.updated_at;
  } else if (normalizedState.sent_at && !current.pendingAction) {
    next.updated_at = normalizedState.sent_at;
  }

  DASHBOARD_PODCASTS[index] = next;
  renderAdminPodcasts("dashboard-podcasts-list");
  renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
}

async function sendArticleNotification(articleId, trigger) {
  if (!articleId) return;
  const article = findArticleById(articleId);
  if (!article) {
    showNotification("Article not found.", "error", "Notifications", {
      force: true,
    });
    return;
  }

  const state = normalizeNotificationState(article.notification_state);
  if (state.sent) {
    showNotification(
      "Notification already sent for this article.",
      "info",
      "Notifications",
      { force: true }
    );
    return;
  }

  const user = typeof getUser === "function" ? getUser() : null;
  const ready = await ensureNotificationsReady({
    prefillEmail: user?.email,
  });
  if (!ready) {
    showNotification(
      "Notification cancelled before sending.",
      "info",
      "Notifications",
      { force: true }
    );
    return;
  }

  if (trigger) {
    setNotificationButtonBusy(trigger, true);
  }

  try {
    const response = await api(`/dashboard/articles/${articleId}/notify`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (response?.article?.notification_state) {
      applyArticleNotificationUpdate(articleId, response.article);
    }

    const recipientCount = Number(response?.recipient_count);
    const message =
      Number.isFinite(recipientCount) && recipientCount > 0
        ? `Notification sent to ${recipientCount} recipient${
            recipientCount === 1 ? "" : "s"
          }.`
        : "Notification sent successfully.";
    showNotification(message, "success", "Notifications", {
      force: true,
    });
  } catch (error) {
    // Errors are already surfaced by the api() helper.
  } finally {
    if (trigger && trigger.isConnected) {
      setNotificationButtonBusy(trigger, false);
    }
  }
}

async function sendPodcastNotification(podcastId, trigger) {
  if (!podcastId) return;
  const podcast = findPodcastById(podcastId);
  if (!podcast) {
    showNotification("Podcast not found.", "error", "Notifications", {
      force: true,
    });
    return;
  }

  const state = normalizeNotificationState(podcast.notification_state);
  if (state.sent) {
    showNotification(
      "Notification already sent for this podcast.",
      "info",
      "Notifications",
      { force: true }
    );
    return;
  }

  const user = typeof getUser === "function" ? getUser() : null;
  const ready = await ensureNotificationsReady({
    prefillEmail: user?.email,
  });
  if (!ready) {
    showNotification(
      "Notification cancelled before sending.",
      "info",
      "Notifications",
      { force: true }
    );
    return;
  }

  if (trigger) {
    setNotificationButtonBusy(trigger, true);
  }

  try {
    const response = await api(`/dashboard/podcasts/${podcastId}/notify`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (response?.podcast?.notification_state) {
      applyPodcastNotificationUpdate(podcastId, response.podcast);
    } else if (response?.notification_state) {
      applyPodcastNotificationUpdate(podcastId, response);
    }

    const recipientCount = Number(response?.recipient_count);
    const message =
      Number.isFinite(recipientCount) && recipientCount > 0
        ? `Notification sent to ${recipientCount} recipient${
            recipientCount === 1 ? "" : "s"
          }.`
        : "Notification sent successfully.";
    showNotification(message, "success", "Notifications", {
      force: true,
    });
  } catch (error) {
    // Errors are already surfaced by the api() helper.
  } finally {
    if (trigger && trigger.isConnected) {
      setNotificationButtonBusy(trigger, false);
    }
  }
}

function ensureNotificationToggle(user) {
  const footer = document.querySelector("footer.footer");
  if (!footer) return null;

  let container = document.getElementById("footer-notification-area");
  if (!container) {
    container = document.createElement("div");
    container.id = "footer-notification-area";
    container.className = "footer-notification-area hidden";
    footer.appendChild(container);
  }

  let toggle = document.getElementById("notifications-toggle");

  if (!user) {
    if (toggle && toggle.parentElement === container) {
      container.removeChild(toggle);
    } else if (
      toggle &&
      toggle.parentElement &&
      toggle.parentElement !== container
    ) {
      toggle.parentElement.removeChild(toggle);
    }
    container.classList.add("hidden");
    return null;
  }

  if (!toggle) {
    toggle = document.createElement("button");
    toggle.id = "notifications-toggle";
    toggle.type = "button";
    toggle.className = "notification-toggle";
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      toggleNotifications(event);
    });
    toggle.dataset.bound = "true";
  } else {
    toggle.classList.add("notification-toggle");
    toggle.type = "button";
    if (!toggle.dataset.bound) {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        toggleNotifications(event);
      });
      toggle.dataset.bound = "true";
    }
  }

  if (toggle.parentElement !== container) {
    container.appendChild(toggle);
  }

  container.classList.remove("hidden");
  updateNotificationToggleUi(toggle);
  return toggle;
}

function updateNotificationToggleUi(target) {
  const button = target || document.getElementById("notifications-toggle");
  if (!button) return;
  button.classList.add("notification-toggle");
  const enabled = notificationsEnabled;
  button.dataset.enabled = enabled ? "true" : "false";
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
  button.setAttribute(
    "aria-label",
    enabled ? "Disable notifications" : "Enable notifications"
  );
  const icon = enabled ? "🔔" : "🔕";
  const label = enabled ? "Notifications On" : "Notifications Off";
  button.innerHTML = `
    <span class="nav-notification-toggle__icon" aria-hidden="true">${icon}</span>
    <span class="nav-notification-toggle__label">${label}</span>
  `;
}

function guestViewOptions(overrides = {}) {
  return {
    showAdminSections: false,
    keepSidebar: true,
    previewLabel: "View as guest",
    returnLabel: "Return to admin view",
    ...overrides,
  };
}

let preferredDashboardViewMode = getStoredDashboardViewMode() || "admin";
let dashboardGuestPreviewLocked = false;
let dashboardViewPreferenceSnapshot = null;

function ensurePreferredDashboardViewMode(options = {}) {
  const { mode, ...rest } = options;
  const hasActiveUploads =
    activeArticleAttachmentUploads > 0 ||
    activeArticleImageUploads > 0 ||
    activeArticleAudioUploads > 0 ||
    activePodcastAudioUploads > 0;

  if (
    !mode &&
    (guestArticleEditMode || guestPodcastEditMode || hasActiveUploads)
  ) {
    return;
  }

  let desired = mode;

  if (!desired) {
    if (!CAN_MANAGE_ARTICLES) {
      desired = "guest";
    } else if (
      dashboardGuestPreviewLocked ||
      guestArticleEditMode ||
      guestPodcastEditMode
    ) {
      desired = "guest";
    } else {
      desired = preferredDashboardViewMode || dashboardViewMode;
    }
  }

  if (desired !== "admin" && desired !== "guest") return;
  if (dashboardViewMode === desired) return;

  setDashboardViewMode(desired, {
    persistPreference: false,
    force: true,
    skipUploadCheck: true,
    ...rest,
  });
}

function generateUniqueId(prefix = "id") {
  const random = Math.random().toString(16).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

function generateNoteTaskId() {
  noteTaskCounter += 1;
  return `note-task-${Date.now()}-${noteTaskCounter}`;
}

function generateArticleLinkId() {
  articleLinkCounter += 1;
  return `article-link-${Date.now()}-${articleLinkCounter}`;
}

function generateArticleAttachmentId() {
  articleAttachmentCounter += 1;
  return `article-attachment-${Date.now()}-${articleAttachmentCounter}`;
}

function generateArticleImageId() {
  articleImageCounter += 1;
  return `article-image-${Date.now()}-${articleImageCounter}`;
}

function generateArticleAudioId() {
  articleAudioCounter += 1;
  return `article-audio-${Date.now()}-${articleAudioCounter}`;
}

function updateNoteTaskCounterFromTasks(tasks = []) {
  tasks.forEach((task) => {
    if (!task || typeof task !== "object") return;
    const id = String(task.id || "");
    const match = id.match(/-(\d+)$/);
    if (!match) return;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > noteTaskCounter) {
      noteTaskCounter = value;
    }
  });
}

function updateArticleLinkCounterFromLinks(links = []) {
  links.forEach((link) => {
    if (!link || typeof link !== "object") return;
    const id = String(link.id || "");
    const match = id.match(/-(\d+)$/);
    if (!match) return;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > articleLinkCounter) {
      articleLinkCounter = value;
    }
  });
}

function updateArticleAttachmentCounterFromAttachments(attachments = []) {
  attachments.forEach((attachment) => {
    if (!attachment || typeof attachment !== "object") return;
    const id = String(attachment.id || "");
    const match = id.match(/-(\d+)$/);
    if (!match) return;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > articleAttachmentCounter) {
      articleAttachmentCounter = value;
    }
  });
}

function updateArticleImageCounterFromImages(images = []) {
  images.forEach((image) => {
    if (!image || typeof image !== "object") return;
    const id = String(image.id || "");
    const match = id.match(/-(\d+)$/);
    if (!match) return;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > articleImageCounter) {
      articleImageCounter = value;
    }
  });
}

function updateArticleAudioCounterFromTracks(tracks = []) {
  tracks.forEach((track) => {
    if (!track || typeof track !== "object") return;
    const id = String(track.id || "");
    const match = id.match(/-(\d+)$/);
    if (!match) return;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > articleAudioCounter) {
      articleAudioCounter = value;
    }
  });
}

function normalizeNotificationState(value) {
  const base = {
    sent: false,
    sent_at: null,
    sent_by: null,
    sent_by_email: null,
    sent_by_id: null,
    recipient_count: 0,
    subject: null,
  };

  if (!value || typeof value !== "object") {
    return base;
  }

  const sentAtRaw = value.sent_at || value.sentAt || null;
  let sentAt = null;
  if (sentAtRaw) {
    const date = new Date(sentAtRaw);
    if (!Number.isNaN(date.getTime())) {
      sentAt = date.toISOString();
    }
  }

  const recipientCount = Number(value.recipient_count ?? value.recipientCount);

  return {
    ...base,
    sent: Boolean(value.sent || sentAt),
    sent_at: sentAt,
    sent_by:
      typeof value.sent_by === "string"
        ? value.sent_by.trim() || null
        : typeof value.sentBy === "string"
        ? value.sentBy.trim() || null
        : null,
    sent_by_email:
      typeof value.sent_by_email === "string"
        ? value.sent_by_email.trim() || null
        : typeof value.sentByEmail === "string"
        ? value.sentByEmail.trim() || null
        : null,
    sent_by_id:
      typeof value.sent_by_id === "string"
        ? value.sent_by_id.trim() || null
        : typeof value.sentById === "string"
        ? value.sentById.trim() || null
        : null,
    recipient_count: Number.isFinite(recipientCount) ? recipientCount : 0,
    subject:
      typeof value.subject === "string"
        ? value.subject.trim() || null
        : typeof value.subjectLine === "string"
        ? value.subjectLine.trim() || null
        : null,
  };
}

function normalizeDashboardNote(note) {
  if (!note || typeof note !== "object") return null;
  const normalizedTasks = Array.isArray(note.tasks)
    ? note.tasks
        .map((task) => {
          if (!task || typeof task !== "object") return null;
          const description = String(task.description || "").trim();
          if (!description) return null;
          const id =
            task.id && String(task.id).trim()
              ? String(task.id).trim()
              : generateNoteTaskId();
          const assigneeRaw = task.assignee;
          const assigneeValue =
            assigneeRaw == null ? null : String(assigneeRaw).trim() || null;
          return {
            id,
            description,
            assignee: assigneeValue,
          };
        })
        .filter(Boolean)
    : [];
  updateNoteTaskCounterFromTasks(normalizedTasks);
  const normalizedNote = {
    id:
      note.id && String(note.id).trim()
        ? String(note.id).trim()
        : generateUniqueId("note"),
    title: String(note.title || "").trim() || "Untitled note",
    body: String(note.body || "").trim(),
    author: note.author ? String(note.author).trim() : "",
    updated_at: note.updated_at || new Date().toISOString(),
    tasks: normalizedTasks,
  };
  return normalizedNote;
}

function normalizeDashboardCodespace(codespace) {
  if (!codespace || typeof codespace !== "object") return null;
  const normalized = {
    id:
      codespace.id && String(codespace.id).trim()
        ? String(codespace.id).trim()
        : generateUniqueId("codespace"),
    project: String(codespace.project || "").trim(),
    repository: String(codespace.repository || "").trim(),
    branch: codespace.branch ? String(codespace.branch).trim() : null,
    status:
      String(codespace.status || "running")
        .trim()
        .toLowerCase() || "running",
    region: codespace.region ? String(codespace.region).trim() : null,
    description: codespace.description
      ? String(codespace.description).trim()
      : null,
    url: codespace.url ? String(codespace.url).trim() : null,
    repo_url: codespace.repo_url ? String(codespace.repo_url).trim() : null,
    editor:
      String(codespace.editor || "vscode")
        .trim()
        .toLowerCase() || "vscode",
    updated_at: codespace.updated_at || new Date().toISOString(),
  };
  if (!normalized.project || !normalized.repository) {
    return null;
  }
  return normalized;
}

function normalizeArticleLink(link) {
  if (!link || typeof link !== "object") return null;
  const url = typeof link.url === "string" ? link.url.trim() : "";
  if (!url) return null;
  const label =
    typeof link.label === "string" ? link.label.trim() : "Learn more";
  const description =
    typeof link.description === "string" ? link.description.trim() : "";
  return {
    id:
      link.id && String(link.id).trim()
        ? String(link.id).trim()
        : generateArticleLinkId(),
    label,
    url,
    description: description || null,
  };
}

function normalizeArticleAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const documentId =
    typeof attachment.document_id === "string"
      ? attachment.document_id.trim()
      : "";
  const url = typeof attachment.url === "string" ? attachment.url.trim() : "";
  const proxyUrl =
    typeof attachment.proxy_url === "string" ? attachment.proxy_url.trim() : "";
  const storageKey =
    typeof attachment.storage_key === "string"
      ? attachment.storage_key.trim()
      : "";
  if (!documentId && !url && !proxyUrl && !storageKey) return null;
  const title =
    typeof attachment.title === "string" ? attachment.title.trim() : "";
  const caption =
    typeof attachment.description === "string"
      ? attachment.description.trim()
      : "";
  const filename =
    typeof attachment.filename === "string" ? attachment.filename.trim() : "";
  const mimeType =
    typeof attachment.mime_type === "string" ? attachment.mime_type.trim() : "";
  const downloadUrl =
    typeof attachment.download_url === "string"
      ? attachment.download_url.trim()
      : "";
  const proxyDownloadUrl =
    typeof attachment.proxy_download_url === "string"
      ? attachment.proxy_download_url.trim()
      : "";
  const fileSizeRaw = Number(attachment.file_size);
  const fileSize =
    Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null;
  return {
    id:
      attachment.id && String(attachment.id).trim()
        ? String(attachment.id).trim()
        : generateArticleAttachmentId(),
    document_id: documentId || null,
    title: title || null,
    url: url || null,
    proxy_url: proxyUrl || null,
    download_url: downloadUrl || null,
    proxy_download_url: proxyDownloadUrl || null,
    preview_url: proxyUrl || url || null,
    effective_download_url:
      proxyDownloadUrl || downloadUrl || proxyUrl || url || null,
    description: caption || null,
    filename: filename || null,
    mime_type: mimeType || null,
    file_size: fileSize,
    storage_key: storageKey || null,
    storage_bucket:
      typeof attachment.storage_bucket === "string"
        ? attachment.storage_bucket.trim() || null
        : null,
  };
}

function normalizeArticleImage(image) {
  if (!image || typeof image !== "object") return null;
  const url = typeof image.url === "string" ? image.url.trim() : "";
  const proxyUrl =
    typeof image.proxy_url === "string" ? image.proxy_url.trim() : "";
  if (!url && !proxyUrl) return null;
  const alt = typeof image.alt === "string" ? image.alt.trim() : "";
  const caption = typeof image.caption === "string" ? image.caption.trim() : "";
  return {
    id:
      image.id && String(image.id).trim()
        ? String(image.id).trim()
        : generateArticleImageId(),
    url: url || null,
    proxy_url: proxyUrl || null,
    display_url: proxyUrl || url || null,
    alt: alt || null,
    caption: caption || null,
    storage_key:
      typeof image.storage_key === "string"
        ? image.storage_key.trim() || null
        : null,
    filename:
      typeof image.filename === "string" ? image.filename.trim() || null : null,
    mime_type:
      typeof image.mime_type === "string"
        ? image.mime_type.trim() || null
        : null,
    file_size:
      Number.isFinite(Number(image.file_size)) && Number(image.file_size) >= 0
        ? Number(image.file_size)
        : null,
  };
}

function normalizeArticleAudioTrack(track) {
  if (!track || typeof track !== "object") return null;
  const url = typeof track.url === "string" ? track.url.trim() : "";
  const streamUrl =
    typeof track.stream_url === "string" ? track.stream_url.trim() : "";
  const proxyUrl =
    typeof track.proxy_url === "string" ? track.proxy_url.trim() : "";
  if (!url && !streamUrl && !proxyUrl) return null;
  const title = typeof track.title === "string" ? track.title.trim() : "";
  const description =
    typeof track.description === "string" ? track.description.trim() : "";
  const filename =
    typeof track.filename === "string" ? track.filename.trim() : "";
  const mimeType =
    typeof track.mime_type === "string" ? track.mime_type.trim() : "";
  const downloadUrl =
    typeof track.download_url === "string" ? track.download_url.trim() : "";
  const downloadProxyUrl =
    typeof track.download_proxy_url === "string"
      ? track.download_proxy_url.trim()
      : "";
  const fileSizeRaw = Number(track.file_size);
  const fileSize =
    Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null;
  const durationRaw = Number(track.duration_seconds);
  const durationSeconds =
    Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null;
  const storageKey =
    typeof track.storage_key === "string" ? track.storage_key.trim() : "";
  const effectiveStream = streamUrl || proxyUrl || url;
  const effectiveDownload =
    downloadProxyUrl || downloadUrl || effectiveStream || null;

  return {
    id:
      track.id && String(track.id).trim()
        ? String(track.id).trim()
        : generateArticleAudioId(),
    title: title || null,
    description: description || null,
    url: url || null,
    stream_url: effectiveStream || null,
    proxy_url: proxyUrl || null,
    download_url: downloadUrl || null,
    download_proxy_url: downloadProxyUrl || null,
    playback_url: effectiveStream || null,
    effective_download_url: effectiveDownload,
    filename: filename || null,
    mime_type: mimeType || null,
    file_size: fileSize,
    duration_seconds: durationSeconds,
    storage_key: storageKey || null,
  };
}

function normalizeDashboardPodcast(podcast) {
  if (!podcast || typeof podcast !== "object") return null;
  const title = String(podcast.title || "").trim();
  if (!title) return null;
  let audio = normalizeArticleAudioTrack(podcast.audio || {});
  if (!audio && podcast.audio_url) {
    audio = normalizeArticleAudioTrack({
      url: podcast.audio_url,
      title: podcast.audio_title || title,
      description: podcast.audio_description || podcast.description || "",
    });
  }
  if (!audio) return null;
  const authors = Array.isArray(podcast.authors)
    ? podcast.authors
        .map((name) => (typeof name === "string" ? name.trim() : ""))
        .filter(Boolean)
    : typeof podcast.authors === "string"
    ? podcast.authors
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];
  return {
    id:
      podcast.id && String(podcast.id).trim()
        ? String(podcast.id).trim()
        : generateUniqueId("podcast"),
    title,
    description: podcast.description ? String(podcast.description).trim() : "",
    authors,
    audio,
    created_at: podcast.created_at || null,
    updated_at: podcast.updated_at || null,
    notification_state: normalizeNotificationState(podcast.notification_state),
  };
}

function normalizeDashboardArticle(article) {
  if (!article || typeof article !== "object") return null;
  const title = String(article.title || "").trim();
  if (!title) return null;
  const imageStorageKey =
    typeof article.image_storage_key === "string"
      ? article.image_storage_key.trim()
      : "";
  const imageFilename =
    typeof article.image_filename === "string"
      ? article.image_filename.trim()
      : "";
  const imageMimeType =
    typeof article.image_mime_type === "string"
      ? article.image_mime_type.trim()
      : "";
  const imageProxyDownloadUrl =
    typeof article.image_proxy_download_url === "string"
      ? article.image_proxy_download_url.trim()
      : "";
  const imageDownloadUrl =
    typeof article.image_download_url === "string"
      ? article.image_download_url.trim()
      : "";
  const imageFileSizeRaw = Number(article.image_file_size);
  const imageFileSize =
    Number.isFinite(imageFileSizeRaw) && imageFileSizeRaw >= 0
      ? imageFileSizeRaw
      : null;
  const normalizedLinks = Array.isArray(article.links)
    ? article.links.map((link) => normalizeArticleLink(link)).filter(Boolean)
    : [];
  const normalizedAttachments = Array.isArray(article.attachments)
    ? article.attachments
        .map((attachment) => normalizeArticleAttachment(attachment))
        .filter(Boolean)
    : [];
  const normalizedImages = Array.isArray(article.gallery_images)
    ? article.gallery_images
        .map((image) => normalizeArticleImage(image))
        .filter(Boolean)
    : [];
  const normalizedAudioTracks = Array.isArray(article.audio_tracks)
    ? article.audio_tracks
        .map((track) => normalizeArticleAudioTrack(track))
        .filter(Boolean)
    : [];
  updateArticleLinkCounterFromLinks(normalizedLinks);
  updateArticleAttachmentCounterFromAttachments(normalizedAttachments);
  updateArticleImageCounterFromImages(normalizedImages);
  updateArticleAudioCounterFromTracks(normalizedAudioTracks);
  return {
    id:
      article.id && String(article.id).trim()
        ? String(article.id).trim()
        : generateUniqueId("article"),
    title,
    description: article.description ? String(article.description).trim() : "",
    image_url: article.image_url ? String(article.image_url).trim() : null,
    image_proxy_url:
      typeof article.image_proxy_url === "string"
        ? article.image_proxy_url.trim() || null
        : null,
    image_src:
      article.image_proxy_url || article.image_url
        ? resolveAssetUrl(
            (article.image_proxy_url || article.image_url || "").trim()
          )
        : null,
    image_storage_key: imageStorageKey || null,
    image_filename: imageFilename || null,
    image_mime_type: imageMimeType || null,
    image_file_size: imageFileSize,
    image_proxy_download_url: imageProxyDownloadUrl || null,
    image_download_url: imageDownloadUrl || null,
    image_effective_download_url:
      imageProxyDownloadUrl || imageDownloadUrl || null,
    download_proxy_url: imageProxyDownloadUrl || null,
    proxy_download_url: imageProxyDownloadUrl || null,
    download_url: imageDownloadUrl || null,
    effective_download_url: imageProxyDownloadUrl || imageDownloadUrl || null,
    authors: Array.isArray(article.authors)
      ? article.authors.map((name) => String(name || "").trim()).filter(Boolean)
      : [],
    links: normalizedLinks,
    attachments: normalizedAttachments,
    gallery_images: normalizedImages,
    audio_tracks: normalizedAudioTracks,
    created_at: article.created_at || null,
    updated_at: article.updated_at || null,
    notification_state: normalizeNotificationState(article.notification_state),
  };
}

function hydrateDashboardState(data) {
  if (!data || typeof data !== "object") return;
  noteTaskCounter = 0;
  articleLinkCounter = 0;
  articleAttachmentCounter = 0;
  if (Array.isArray(data.notes)) {
    const normalizedNotes = data.notes
      .map((note) => normalizeDashboardNote(note))
      .filter(Boolean);
    ADMIN_TEAM_NOTES.splice(0, ADMIN_TEAM_NOTES.length, ...normalizedNotes);
  }
  if (Array.isArray(data.codespaces)) {
    const normalizedCodespaces = data.codespaces
      .map((codespace) => normalizeDashboardCodespace(codespace))
      .filter(Boolean);
    PROJECT_CODESPACES.splice(
      0,
      PROJECT_CODESPACES.length,
      ...normalizedCodespaces
    );
  }
  if (Array.isArray(data.articles)) {
    const normalizedArticles = data.articles
      .map((article) => normalizeDashboardArticle(article))
      .filter(Boolean);
    DASHBOARD_ARTICLES.splice(
      0,
      DASHBOARD_ARTICLES.length,
      ...normalizedArticles
    );
  }
  if (Array.isArray(data.podcasts)) {
    const normalizedPodcasts = data.podcasts
      .map((podcast) => normalizeDashboardPodcast(podcast))
      .filter(Boolean);
    DASHBOARD_PODCASTS.splice(
      0,
      DASHBOARD_PODCASTS.length,
      ...normalizedPodcasts
    );
  }
  if (Array.isArray(data.documents)) {
    DOCUMENT_LIBRARY.splice(0, DOCUMENT_LIBRARY.length, ...data.documents);
  }

  refreshAttachmentDocumentOptions();
}

async function refreshDashboardData(options = {}) {
  const { showToast = false } = options;
  try {
    const [
      notesPayload,
      codespacesPayload,
      articlesPayload,
      documentsPayload,
      articleDocumentsPayload,
      podcastsPayload,
    ] = await Promise.all([
      api("/dashboard/notes"),
      api("/dashboard/codespaces"),
      api("/dashboard/articles"),
      api("/documents"),
      api("/dashboard/articles/documents").catch((error) => {
        if (error?.status === 403) {
          return { documents: [] };
        }
        throw error;
      }),
      api("/dashboard/podcasts"),
    ]);

    const sharedDocuments = Array.isArray(documentsPayload)
      ? documentsPayload
      : documentsPayload?.documents || [];
    const articleDocuments = Array.isArray(articleDocumentsPayload)
      ? articleDocumentsPayload
      : articleDocumentsPayload?.documents || [];
    const mergedDocuments = [
      ...sharedDocuments.map((doc) => ({
        ...doc,
        scope: doc.scope || "shared",
      })),
      ...articleDocuments.map((doc) => ({
        ...doc,
        scope: doc.scope || "article",
      })),
    ];

    hydrateDashboardState({
      notes: notesPayload?.notes || [],
      codespaces: codespacesPayload?.codespaces || [],
      articles: articlesPayload?.articles || [],
      podcasts: podcastsPayload?.podcasts || [],
      documents: mergedDocuments,
    });
    refreshAttachmentDocumentOptions();

    renderAdminTeamNotes("dashboard-team-notes");
    renderAdminCodespaces("dashboard-codespaces");
    renderAdminArticles("dashboard-articles-list");
    renderAdminPodcasts("dashboard-podcasts-list");
    renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
    renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);

    resetDashboardPendingChanges();

    if (showToast) {
      showNotification(
        "Dashboard data synced with MongoDB.",
        "success",
        "Saved"
      );
    }
  } catch (error) {
    if (showToast) {
      showNotification(
        error?.message || "Failed to sync dashboard data.",
        "error",
        "Sync failed"
      );
    }
    throw error;
  }
}

async function loadGuestArticles(options = {}) {
  const { showError = true } = options;
  try {
    const [articlesPayload, podcastsPayload] = await Promise.all([
      api("/dashboard/articles"),
      api("/dashboard/podcasts")
        .then((payload) => payload)
        .catch(() => ({ podcasts: [] })),
    ]);

    const normalizedArticles = (articlesPayload?.articles || [])
      .map((article) => normalizeDashboardArticle(article))
      .filter(Boolean);
    DASHBOARD_ARTICLES.splice(
      0,
      DASHBOARD_ARTICLES.length,
      ...normalizedArticles
    );

    const normalizedPodcasts = (podcastsPayload?.podcasts || [])
      .map((podcast) => normalizeDashboardPodcast(podcast))
      .filter(Boolean);
    DASHBOARD_PODCASTS.splice(
      0,
      DASHBOARD_PODCASTS.length,
      ...normalizedPodcasts
    );

    const token = getToken();
    DOCUMENT_LIBRARY.splice(0, DOCUMENT_LIBRARY.length);
    if (token) {
      try {
        const [documentsPayload, articleDocumentsPayload] = await Promise.all([
          api("/documents"),
          api("/dashboard/articles/documents").catch((error) => {
            if (error?.status === 403) {
              return { documents: [] };
            }
            throw error;
          }),
        ]);
        const sharedDocuments = Array.isArray(documentsPayload)
          ? documentsPayload
          : documentsPayload?.documents || [];
        const articleDocuments = Array.isArray(articleDocumentsPayload)
          ? articleDocumentsPayload
          : articleDocumentsPayload?.documents || [];
        const mergedDocuments = [
          ...sharedDocuments.map((doc) => ({
            ...doc,
            scope: doc.scope || "shared",
          })),
          ...articleDocuments.map((doc) => ({
            ...doc,
            scope: doc.scope || "article",
          })),
        ];
        DOCUMENT_LIBRARY.splice(0, DOCUMENT_LIBRARY.length, ...mergedDocuments);
        refreshAttachmentDocumentOptions();
      } catch (docError) {
        // Ignore document errors for guest-facing load
      }
    }

    renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
    renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
  } catch (error) {
    DASHBOARD_ARTICLES.splice(0, DASHBOARD_ARTICLES.length);
    DASHBOARD_PODCASTS.splice(0, DASHBOARD_PODCASTS.length);
    DOCUMENT_LIBRARY.splice(0, DOCUMENT_LIBRARY.length);
    refreshAttachmentDocumentOptions();
    clearGuestArticlesDisplay();
    clearGuestPodcastsDisplay();

    if (error?.status === 401) {
      showGuestContentAuthGate();
      return;
    }

    if (showError) {
      const container = document.getElementById("guest-articles-list");
      if (container) {
        container.innerHTML =
          '<p class="placeholder">Unable to load articles right now.</p>';
      }
      const wrapper = document.getElementById("guest-articles-wrapper");
      wrapper?.classList.remove("hidden");
    }
  }
}

async function saveDashboardState() {
  const canSaveFromContext =
    dashboardEditMode ||
    guestArticleEditMode ||
    guestPodcastEditMode ||
    dashboardHasPendingChanges;

  if (!canSaveFromContext) {
    showNotification(
      "Enable editing to sync the latest dashboard state.",
      "info",
      "Sync unavailable"
    );
    return;
  }

  if (!hasPendingDashboardChanges()) {
    showNotification(
      "You don't have any unsaved dashboard edits.",
      "info",
      "Nothing to save"
    );
    return;
  }

  const operations = collectPendingDashboardOperations();
  if (!operations.length) {
    setDashboardDirtyState(false);
    showNotification(
      "You don't have any unsaved dashboard edits.",
      "info",
      "Nothing to save"
    );
    return;
  }

  setDashboardSaveButtonBusy(true);

  try {
    for (const operation of operations) {
      const { entity, id, action, payload } = operation;
      if (!action) continue;
      if (entity === "notes") {
        if (action === "create" && payload) {
          await api("/dashboard/notes", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else if (action === "update" && id && payload) {
          await api(`/dashboard/notes/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else if (action === "delete" && id) {
          await api(`/dashboard/notes/${id}`, { method: "DELETE" });
        }
      } else if (entity === "codespaces") {
        if (action === "create" && payload) {
          await api("/dashboard/codespaces", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else if (action === "update" && id && payload) {
          await api(`/dashboard/codespaces/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else if (action === "delete" && id) {
          await api(`/dashboard/codespaces/${id}`, { method: "DELETE" });
        }
      } else if (entity === "articles") {
        if (action === "create" && payload) {
          await api("/dashboard/articles", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else if (action === "update" && id && payload) {
          await api(`/dashboard/articles/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else if (action === "delete" && id) {
          await api(`/dashboard/articles/${id}`, { method: "DELETE" });
        }
      } else if (entity === "podcasts") {
        if (action === "create" && payload) {
          await api("/dashboard/podcasts", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else if (action === "update" && id && payload) {
          await api(`/dashboard/podcasts/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else if (action === "delete" && id) {
          await api(`/dashboard/podcasts/${id}`, { method: "DELETE" });
        }
      }
    }

    resetDashboardPendingChanges();
    await refreshDashboardData({ showToast: false });
    showNotification(
      "Dashboard changes synced with MongoDB and Cloud storage.",
      "success",
      "Saved"
    );
  } catch (error) {
    const message =
      error?.message || "Failed to save dashboard changes. Try again.";
    showNotification(message, "error", "Save failed");
  } finally {
    setDashboardSaveButtonBusy(false);
  }
}

const TEAM_MEMBER_LOOKUP = TEAM_MEMBERS.reduce((map, member) => {
  map.set(member.name, member);
  return map;
}, new Map());

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncateText(text, limit = 120) {
  if (!text) return "";
  const trimmed = String(text).trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trim()}…`;
}

function resolveAssetUrl(url) {
  if (!url) return "";
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:/i.test(trimmed)) return trimmed;
  const base = API_BASE.replace(/\/api$/, "");
  if (trimmed.startsWith("/")) {
    return `${base}${trimmed}`;
  }
  return `${base}/${trimmed}`;
}

function resolveHref(url) {
  if (!url) return "";
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:/i.test(trimmed)) return trimmed;
  return resolveAssetUrl(trimmed);
}

function buildCodespaceLauncherUrl(repository, branch, region) {
  if (!repository || typeof repository !== "string") return null;
  const trimmedRepo = repository.trim();
  if (!trimmedRepo.includes("/")) return null;
  const base = `https://github.com/codespaces/new?repo=${encodeURIComponent(
    trimmedRepo
  )}`;
  const params = [];
  const normalizedBranch = branch ? String(branch).trim() : "";
  if (normalizedBranch) {
    params.push(`ref=${encodeURIComponent(normalizedBranch)}`);
  }
  const normalizedRegion = region ? String(region).trim() : "";
  if (normalizedRegion) {
    params.push(`location=${encodeURIComponent(normalizedRegion)}`);
  }
  return params.length ? `${base}&${params.join("&")}` : base;
}

function renderTeamMemberPicker(containerId, selected = [], options = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const selectedSet = new Set(selected);
  const prefix = String(options.idPrefix || containerId || "team-picker");

  el.innerHTML = TEAM_MEMBERS.map(({ name, role }) => {
    const safeName = escapeHtml(name);
    const safeRole = escapeHtml(role);
    const id = `${prefix}-${safeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;
    const checked = selectedSet.has(name) ? "checked" : "";
    return `
      <label class="team-picker-item" for="${id}">
        <input type="checkbox" id="${id}" name="team" value="${safeName}" ${checked} />
        <div class="team-picker-text">
          <span class="team-picker-name">${safeName}</span>
          <span class="team-picker-role">${safeRole}</span>
        </div>
      </label>
    `;
  }).join("");
}

function getTeamMemberDetails(name) {
  return TEAM_MEMBER_LOOKUP.get(name) || null;
}

function getTeamMemberEmail(name) {
  const details = getTeamMemberDetails(name);
  return details?.contact?.email || null;
}

function getTeamMemberEmails(members = []) {
  const emails = new Set();
  (members || []).forEach((member) => {
    const email = getTeamMemberEmail(member);
    if (email) {
      emails.add(email);
    }
  });
  return Array.from(emails);
}

function formatEventDateTime(value, options = {}) {
  if (!value) return "TBD";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  const {
    dateStyle = "medium",
    timeStyle = "short",
    locale = "en-US",
    ...formatOptions
  } = options;
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    ...formatOptions,
  });
  return formatter.format(date);
}

function formatDurationMinutes(minutes, options = {}) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) {
    return "";
  }
  const style = options.style === "short" ? "short" : "long";
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const parts = [];
  if (hours) {
    const unit = style === "short" ? "hr" : hours === 1 ? "hour" : "hours";
    parts.push(`${hours} ${unit}`);
  }
  if (mins) {
    const unit = style === "short" ? "min" : mins === 1 ? "minute" : "minutes";
    parts.push(`${mins} ${unit}`);
  }
  if (!parts.length) {
    return style === "short" ? "1 min" : "1 minute";
  }
  return parts.join(" ");
}

function formatAudioDuration(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  const totalSeconds = Math.round(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatFileSize(bytes, options = {}) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) {
    return options.fallback || "";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const decimals = size >= 10 || unitIndex === 0 ? 0 : 1;
  const formatted = size.toFixed(decimals);
  return `${formatted} ${units[unitIndex]}`;
}

function formatFileSummary(name, sizeBytes, options = {}) {
  const label = name ? String(name).trim() : "File";
  const sizeLabel = formatFileSize(sizeBytes);
  const base = sizeLabel ? `${label} (${sizeLabel})` : label;
  switch (options.action) {
    case "selected":
      return `${base} selected`;
    case "uploading":
      return `${base} uploading…`;
    case "uploaded":
      return `${base} uploaded`;
    case "error":
      return `${base} failed`;
    default:
      return base;
  }
}

function computeEventEndDate(start, durationMinutes) {
  if (!start) return null;
  const startDate = start instanceof Date ? new Date(start) : new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;
  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return new Date(startDate.getTime() + minutes * 60 * 1000);
}

function formatEventTimeRange(start, durationMinutes, options = {}) {
  const startDate = start instanceof Date ? new Date(start) : new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return "";
  }
  const endDate = computeEventEndDate(startDate, durationMinutes);
  const {
    locale = "en-US",
    hour = "2-digit",
    minute = "2-digit",
    hour12 = false,
    ...formatOptions
  } = options;
  const formatter = new Intl.DateTimeFormat(locale, {
    hour,
    minute,
    hour12,
    ...formatOptions,
  });
  const startLabel = formatter.format(startDate);
  if (!endDate) {
    return startLabel;
  }
  const endLabel = formatter.format(endDate);
  return `${startLabel} - ${endLabel}`;
}

function normalizeEvent(event) {
  if (!event) return null;
  const teamMembers = parseTeamMembers(event.team_members);
  let startAt = event.start_at || null;
  if (startAt) {
    const parsed = new Date(startAt);
    startAt = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  let duration = null;
  if (event.duration_minutes != null && event.duration_minutes !== "") {
    const parsedDuration = Number.parseInt(event.duration_minutes, 10);
    if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
      duration = Math.min(parsedDuration, 24 * 60);
    }
  }
  return {
    ...event,
    team_members: teamMembers,
    start_at: startAt,
    duration_minutes: duration,
  };
}

function buildEventTemplate(event) {
  const when = formatEventDateTime(event.start_at, {
    dateStyle: "full",
    timeStyle: "short",
  });
  const timeRangeLabel = formatEventTimeRange(
    event.start_at,
    event.duration_minutes
  );
  const durationLabel = formatDurationMinutes(event.duration_minutes);
  const members = event.team_members || [];
  const greeting = members.length ? `Hi ${members.join(", ")},` : "Hi team,";

  const attendeeLines = members
    .map((member) => {
      const details = getTeamMemberDetails(member);
      const email = details?.contact?.email;
      return email ? `${member} — ${email}` : member;
    })
    .filter(Boolean);

  const lines = [`Subject: ${event.title}`, "", greeting, ""];

  if (event.description) {
    lines.push(event.description, "");
  }

  lines.push("Event details:");
  lines.push(`When: ${when}`);
  if (timeRangeLabel) {
    lines.push(`Time: ${timeRangeLabel}`);
  }
  if (durationLabel) {
    lines.push(`Duration: ${durationLabel}`);
  }
  if (event.location) {
    lines.push(`Where: ${event.location}`);
  }

  if (attendeeLines.length) {
    lines.push("", "Attendees:");
    attendeeLines.forEach((line) => lines.push(`- ${line}`));
  }

  lines.push("", "See you there!");
  return lines.join("\n");
}

async function copyTextToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showNotification("Template copied to clipboard", "success");
  } catch (error) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "readonly");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    document.body.removeChild(helper);
    showNotification("Template copied", "success");
  }
}

function getSelectedTeamMembers(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return [];
  return Array.from(
    el.querySelectorAll('input[type="checkbox"][name="team"]:checked')
  ).map((input) => input.value);
}

function resetTeamMemberPicker(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.querySelectorAll('input[type="checkbox"][name="team"]').forEach(
    (input) => {
      input.checked = false;
    }
  );
}

function parseTeamMembers(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? "" : String(item).trim()))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseTeamMembers(parsed);
      }
    } catch (err) {
      picker.reset({
        displayText: formatFileSummary(file?.name, file?.size, {
          action: "error",
        }),
        status: "error",
      });
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeProject(project) {
  if (!project) return null;
  const rawImageUrl =
    typeof project.image_url === "string"
      ? project.image_url.trim()
      : project.image_url;
  const rawProxyUrl =
    typeof project.image_proxy_url === "string"
      ? project.image_proxy_url.trim()
      : project.image_proxy_url;
  const githubValue =
    typeof project.github_url === "string"
      ? project.github_url.trim()
      : project.github_url;
  const externalValue =
    typeof project.external_url === "string"
      ? project.external_url.trim()
      : project.external_url;
  const imageSource = rawProxyUrl || rawImageUrl || null;
  return {
    ...project,
    image_url: rawImageUrl || null,
    image_proxy_url: rawProxyUrl || null,
    image_src: imageSource ? resolveAssetUrl(imageSource) : null,
    github_url: githubValue || null,
    github_href: githubValue ? resolveHref(githubValue) : null,
    external_url: externalValue || null,
    external_href: externalValue ? resolveHref(externalValue) : null,
    team_members: parseTeamMembers(project.team_members),
  };
}

function formatStatus(status) {
  if (!status) return "Unknown";
  const normalized = String(status).trim();
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

function getStatusClass(status) {
  const normalized = String(status || "unknown").toLowerCase();
  return normalized.replace(/[^a-z0-9-]/g, "-");
}

function getProjectAnchorId(project) {
  if (project && project.id != null) {
    return `project-${project.id}`;
  }
  const slug = String(project?.title || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `project-${slug || "item"}`;
}

function renderMinimalProject(project) {
  const statusClass = getStatusClass(project.status);
  const description = project.description
    ? `<p>${escapeHtml(truncateText(project.description, 110))}</p>`
    : "";
  const anchorId = getProjectAnchorId(project);
  return `
    <a class="project-mini-link" href="projects.html#${anchorId}">
      <article class="project-mini">
        <div class="project-mini-header">
          <span class="status-badge status-${statusClass}">${escapeHtml(
    formatStatus(project.status)
  )}</span>
        </div>
        <h4>${escapeHtml(project.title)}</h4>
        ${description}
      </article>
    </a>
  `;
}

function renderDetailedProject(project) {
  const statusClass = getStatusClass(project.status);
  const anchorId = getProjectAnchorId(project);
  const imageMarkup = project.image_src
    ? `
        <figure class="project-media">
          <img src="${escapeHtml(project.image_src)}" alt="${escapeHtml(
        project.title
      )} project image" loading="lazy" />
        </figure>
      `
    : `
        <figure class="project-media project-media--fallback">
          <span>${escapeHtml(project.title?.charAt(0) || "P")}</span>
        </figure>
      `;

  const descriptionMarkup = project.description
    ? `<p class="project-description">${escapeHtml(project.description)}</p>`
    : "";

  const teamMarkup = project.team_members.length
    ? `
        <div class="project-team">
          <span class="project-team-label">Team</span>
          <div class="project-team-list">
            ${project.team_members
              .map(
                (member) => `<span class="chip">${escapeHtml(member)}</span>`
              )
              .join("")}
          </div>
        </div>
      `
    : "";

  const linkButtons = [
    project.github_href
      ? `<a href="${escapeHtml(
          project.github_href
        )}" class="project-link project-link--github" target="_blank" rel="noopener">GitHub</a>`
      : "",
    project.external_href
      ? `<a href="${escapeHtml(
          project.external_href
        )}" class="project-link project-link--external" target="_blank" rel="noopener">Live Demo</a>`
      : "",
  ].filter(Boolean);

  const linksMarkup = linkButtons.length
    ? `<div class="project-links">${linkButtons.join("")}</div>`
    : "";

  return `
    <article class="project-card" id="${anchorId}">
      ${imageMarkup}
      <div class="project-content">
        <header class="project-content-header">
          <h3>${escapeHtml(project.title)}</h3>
          <span class="status-badge status-${statusClass}">${escapeHtml(
    formatStatus(project.status)
  )}</span>
        </header>
        ${descriptionMarkup}
        ${teamMarkup}
        ${linksMarkup}
      </div>
    </article>
  `;
}

function renderEventTeamChips(members = []) {
  if (!members.length) {
    return '<span class="chip">No attendees yet</span>';
  }
  return members
    .map((member) => `<span class="chip">${escapeHtml(member)}</span>`)
    .join("");
}

function renderAdminEventCard(event) {
  const template = buildEventTemplate(event);
  const templateEncoded = encodeURIComponent(template);
  const dateLabel = formatEventDateTime(event.start_at, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const timeRangeLabel = formatEventTimeRange(
    event.start_at,
    event.duration_minutes
  );
  const durationLabel = formatDurationMinutes(event.duration_minutes, {
    style: "short",
  });
  const safeTimeRangeLabel = timeRangeLabel ? escapeHtml(timeRangeLabel) : "";
  const safeDurationLabel = durationLabel ? escapeHtml(durationLabel) : "";
  const memberEmails = getTeamMemberEmails(event.team_members);
  const sendDisabledAttr = memberEmails.length
    ? ""
    : ' disabled title="Add team members with email addresses to enable invites"';
  const emailHint = memberEmails.length
    ? `<p class="event-admin-email-hint">Will notify: ${memberEmails
        .map((email) => escapeHtml(email))
        .join(", ")}</p>`
    : `<p class="event-admin-email-hint event-admin-email-hint--empty">Add team members with contact emails to enable email invites.</p>`;
  return `
    <article class="card event-admin-card" data-id="${escapeHtml(event.id)}">
      <div class="event-admin-header">
        <div>
          <strong>${escapeHtml(event.title)}</strong>
          <div class="event-admin-meta">
            <time datetime="${escapeHtml(event.start_at || "")}">${escapeHtml(
    dateLabel
  )}</time>
            ${
              timeRangeLabel
                ? `<span class="event-admin-time-range" aria-label="Time range ${safeTimeRangeLabel}" title="${safeTimeRangeLabel}">${safeTimeRangeLabel}</span>`
                : ""
            }
            ${
              durationLabel
                ? `<span class="event-admin-duration" aria-label="Duration ${safeDurationLabel}" title="${safeDurationLabel}">${safeDurationLabel}</span>`
                : ""
            }
          </div>
        </div>
        ${
          event.location
            ? `<div class="event-admin-location">${escapeHtml(
                event.location
              )}</div>`
            : ""
        }
      </div>
      ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
      <div class="event-admin-team">${renderEventTeamChips(
        event.team_members
      )}</div>
      ${emailHint}
      <div class="event-template">
        <div class="event-template-actions">
          <span>Invitation template</span>
          <button type="button" data-action="copy-template" data-template="${escapeHtml(
            templateEncoded
          )}">
            Copy template
          </button>
        </div>
        <textarea readonly>${escapeHtml(template)}</textarea>
      </div>
      <div class="event-admin-actions">
        <button type="button" data-action="send-event" data-id="${escapeHtml(
          event.id
        )}"${sendDisabledAttr}>Send invites</button>
        <button type="button" class="btn-danger" data-action="delete-event" data-id="${escapeHtml(
          event.id
        )}">Delete event</button>
      </div>
    </article>
  `;
}

function renderDashboardEventCard(event) {
  const dateLabel = formatEventDateTime(event.start_at, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const timeRangeLabel = formatEventTimeRange(
    event.start_at,
    event.duration_minutes
  );
  const timeRangeMarkup = timeRangeLabel
    ? (() => {
        const safe = escapeHtml(timeRangeLabel);
        return `<span class="event-time-range" aria-label="Time range ${safe}" title="${safe}">${safe}</span>`;
      })()
    : "";
  const durationLabel = formatDurationMinutes(event.duration_minutes, {
    style: "short",
  });
  const durationMarkup = durationLabel
    ? (() => {
        const safe = escapeHtml(durationLabel);
        return `<span class="event-duration-badge" aria-label="Duration ${safe}" title="${safe}">${safe}</span>`;
      })()
    : "";
  return `
    <article class="dashboard-event-card">
      <header>
        <div>
          <strong>${escapeHtml(event.title)}</strong>
          ${
            event.location
              ? `<div class="event-meta">${escapeHtml(event.location)}</div>`
              : ""
          }
        </div>
        <div class="event-schedule">
          <time datetime="${escapeHtml(event.start_at || "")}">${escapeHtml(
    dateLabel
  )}</time>
          ${timeRangeMarkup}
          ${durationMarkup}
        </div>
      </header>
      ${
        event.description
          ? `<p>${escapeHtml(truncateText(event.description, 140))}</p>`
          : ""
      }
      <div class="event-team">${renderEventTeamChips(event.team_members)}</div>
    </article>
  `;
}

function renderAdminTeamNotes(targetId, notes = ADMIN_TEAM_NOTES) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.removeEventListener("click", handleDashboardNoteAction);
  container.addEventListener("click", handleDashboardNoteAction);

  if (!notes || !notes.length) {
    container.innerHTML =
      '<p class="placeholder">No internal notes yet. Add one in the admin area.</p>';
    return;
  }

  const sorted = [...notes].sort((a, b) => {
    const aTime = new Date(a.updated_at || 0).getTime();
    const bTime = new Date(b.updated_at || 0).getTime();
    return bTime - aTime;
  });

  container.innerHTML = sorted
    .map((note) => {
      const updatedLabel = formatEventDateTime(note.updated_at, {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const authorLabel = note.author
        ? escapeHtml(note.author)
        : "Internal communications";
      const tasksMarkup = renderNoteTasks(note.tasks);
      const pendingBadge = renderPendingBadge(note.pendingAction);
      return `
        <article class="dashboard-note" data-id="${escapeHtml(note.id)}">
          <div class="dashboard-note-header">
            <h4>${escapeHtml(note.title)}${
        pendingBadge ? ` ${pendingBadge}` : ""
      }</h4>
            <time datetime="${escapeHtml(note.updated_at || "")}">${escapeHtml(
        updatedLabel
      )}</time>
          </div>
          <p>${escapeHtml(note.body)}</p>
          ${tasksMarkup}
          <footer class="dashboard-note-footer">
            <span>${authorLabel}</span>
            <div class="dashboard-note-actions">
              <button type="button" class="icon-button" data-action="edit-note" data-id="${escapeHtml(
                note.id
              )}">Edit</button>
              <button type="button" class="icon-button icon-button-danger" data-action="delete-note" data-id="${escapeHtml(
                note.id
              )}">Delete</button>
            </div>
          </footer>
        </article>
      `;
    })
    .join("");
}

function renderPendingBadge(action) {
  const normalized = String(action || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  let label = "Unsaved";
  if (normalized === "create") {
    label = "Draft";
  } else if (normalized === "update") {
    label = "Unsaved";
  } else if (normalized === "delete") {
    label = "Removing";
  }
  return `<span class="dashboard-pending-badge dashboard-pending-badge--${escapeHtml(
    normalized
  )}">${escapeHtml(label)}</span>`;
}

function getInitials(text = "") {
  const letters = String(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  if (letters) return letters;
  const fallback = String(text).trim();
  return fallback ? fallback.charAt(0).toUpperCase() : "?";
}

function renderNoteTaskAssigneeAvatar(assignee) {
  if (!assignee) {
    return `
      <span class="note-task-avatar note-task-avatar--empty" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.314 0 6 2.239 6 5v1H4v-1c0-2.761 2.686-5 6-5Z" />
        </svg>
      </span>
    `;
  }

  const details = getTeamMemberDetails(assignee);
  if (details?.image) {
    const src = escapeHtml(resolveAssetUrl(details.image));
    const alt = escapeHtml(`${assignee}'s profile photo`);
    return `
      <span class="note-task-avatar">
        <img src="${src}" alt="${alt}" loading="lazy" />
      </span>
    `;
  }

  const initials = getInitials(assignee);
  return `
    <span class="note-task-avatar note-task-avatar--initials">${initials}</span>
  `;
}

function renderNoteTasks(tasks = []) {
  if (!Array.isArray(tasks) || !tasks.length) return "";
  const items = tasks
    .map((task) => {
      const description = escapeHtml(task.description || "Task");
      const hasAssignee = Boolean(task.assignee);
      const label = hasAssignee ? escapeHtml(task.assignee) : "Unassigned";
      const avatarMarkup = renderNoteTaskAssigneeAvatar(
        hasAssignee ? task.assignee : null
      );
      const assigneeClass = hasAssignee ? "" : " note-task-assignee--empty";
      return `
        <li class="note-task-item">
          <span class="note-task-desc">${description}</span>
          <span class="note-task-assignee${assigneeClass}">
            ${avatarMarkup}
            <span class="note-task-assignee-name">${label}</span>
          </span>
        </li>
      `;
    })
    .join("");
  return `
    <div class="note-task-list-wrapper">
      <h5 class="note-task-title">Tasks</h5>
      <ul class="note-task-list">${items}</ul>
    </div>
  `;
}

function buildTeamMemberOptions(selected = "") {
  const normalized = String(selected || "").toLowerCase();
  const options = ['<option value="">Unassigned</option>'];
  TEAM_MEMBERS.forEach(({ name }) => {
    const value = escapeHtml(name);
    const isSelected = normalized === name.toLowerCase() ? "selected" : "";
    options.push(`<option value="${value}" ${isSelected}>${value}</option>`);
  });
  return options.join("");
}

function addNoteTaskRow(task = {}, options = {}) {
  const list = document.getElementById("dashboard-note-tasks-list");
  if (!list) return null;
  const rowId = task.id || generateNoteTaskId();
  const description = task.description || "";
  const assignee = task.assignee || "";
  const row = document.createElement("div");
  row.className = "note-task-form-row";
  row.dataset.id = rowId;
  row.innerHTML = `
    <div class="form-field">
      <label for="${rowId}-desc">Task</label>
      <input
        type="text"
        id="${rowId}-desc"
        name="task-desc"
        placeholder="Write a task"
        value="${escapeHtml(description)}"
        maxlength="160"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-assignee">Assignee</label>
      <select id="${rowId}-assignee" name="task-assignee">
        ${buildTeamMemberOptions(assignee)}
      </select>
    </div>
    <button
      type="button"
      class="icon-button icon-button-danger note-task-remove"
      data-id="${rowId}"
      aria-label="Remove task"
    >Remove</button>
  `;
  list.appendChild(row);
  if (options.focus) {
    const input = row.querySelector('input[name="task-desc"]');
    input?.focus();
  }
  return row;
}

function clearNoteTaskRows() {
  const list = document.getElementById("dashboard-note-tasks-list");
  if (!list) return;
  list.innerHTML = "";
}

function setNoteTaskRows(tasks = []) {
  clearNoteTaskRows();
  const list = document.getElementById("dashboard-note-tasks-list");
  if (!list) return;
  if (!tasks.length) {
    return;
  }
  tasks.forEach((task) => addNoteTaskRow(task));
}

function ensureNoteTaskRowExists() {
  const list = document.getElementById("dashboard-note-tasks-list");
  if (!list) return;
  if (!list.querySelector(".note-task-form-row")) {
    addNoteTaskRow();
  }
}

function collectNoteTasks() {
  const list = document.getElementById("dashboard-note-tasks-list");
  if (!list) return [];
  const tasks = [];
  list.querySelectorAll(".note-task-form-row").forEach((row) => {
    const descriptionInput = row.querySelector('input[name="task-desc"]');
    const assigneeSelect = row.querySelector('select[name="task-assignee"]');
    const description = descriptionInput?.value?.trim();
    const assignee = assigneeSelect?.value?.trim();
    if (!description) return;
    tasks.push({
      id: row.dataset.id || generateNoteTaskId(),
      description,
      assignee: assignee || null,
    });
  });
  return tasks;
}

function bindNoteTaskFormControls() {
  const list = document.getElementById("dashboard-note-tasks-list");
  const addBtn = document.getElementById("dashboard-note-add-task");
  if (list && !list.dataset.bound) {
    list.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(".note-task-remove");
      if (!removeBtn) return;
      const row = removeBtn.closest(".note-task-form-row");
      row?.parentElement?.removeChild(row);
      if (!list.querySelector(".note-task-form-row")) {
        ensureNoteTaskRowExists();
      }
    });
    list.dataset.bound = "true";
  }
  if (addBtn && !addBtn.dataset.bound) {
    addBtn.addEventListener("click", () => addNoteTaskRow({}, { focus: true }));
    addBtn.dataset.bound = "true";
  }
}

function findDocumentById(documentId) {
  if (!documentId) return null;
  return (
    DOCUMENT_LIBRARY.find((doc) => String(doc.id) === String(documentId)) ||
    null
  );
}

function renderArticleAuthorChips(authors = []) {
  if (!Array.isArray(authors) || !authors.length) {
    return '<span class="chip chip-muted">Team</span>';
  }
  return authors
    .map((author) => `<span class="chip">${escapeHtml(author)}</span>`)
    .join("");
}

function renderArticleLinksList(links = []) {
  if (!Array.isArray(links) || !links.length) return "";
  const items = links
    .map((link) => {
      const label = escapeHtml(link.label || "Open link");
      const url = escapeHtml(link.url);
      const description = link.description
        ? `<span class="dashboard-article-link-desc">${escapeHtml(
            link.description
          )}</span>`
        : "";
      return `
        <li>
          <a href="${url}" target="_blank" rel="noopener">${label}</a>
          ${description}
        </li>
      `;
    })
    .join("");
  return `
    <div class="dashboard-article-links">
      <h5>Links</h5>
      <ul>${items}</ul>
    </div>
  `;
}

function selectPreferredAssetUrl(resource = {}, { mode = "preview" } = {}) {
  if (!resource || typeof resource !== "object") {
    return null;
  }

  const priorityByMode = {
    hero: [
      resource.image_proxy_url,
      resource.image_src,
      resource.proxy_url,
      resource.display_url,
      resource.stream_url,
      resource.url,
    ],
    preview: [
      resource.preview_url,
      resource.proxy_url,
      resource.display_url,
      resource.stream_url,
      resource.image_proxy_url,
      resource.image_src,
      resource.url,
      resource.image_url,
    ],
    stream: [
      resource.stream_url,
      resource.playback_url,
      resource.proxy_url,
      resource.url,
      resource.image_proxy_url,
      resource.image_src,
      resource.image_url,
    ],
    download: [
      resource.effective_download_url,
      resource.download_proxy_url,
      resource.proxy_download_url,
      resource.download_url,
      resource.proxy_url,
      resource.stream_url,
      resource.url,
      resource.image_proxy_download_url,
    ],
  };

  const candidates = priorityByMode[mode] || priorityByMode.preview;

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function resolvePodcastMediaDetails(audio) {
  if (!audio || typeof audio !== "object") {
    return {
      playbackSrc: "",
      downloadHref: "",
      downloadFilename: "",
    };
  }

  const playbackCandidate =
    selectPreferredAssetUrl(audio, { mode: "stream" }) ||
    audio.playback_url ||
    audio.stream_url ||
    audio.proxy_url ||
    audio.url ||
    "";

  const downloadCandidate =
    selectPreferredAssetUrl(audio, { mode: "download" }) ||
    audio.effective_download_url ||
    audio.download_proxy_url ||
    audio.proxy_download_url ||
    audio.download_url ||
    playbackCandidate ||
    "";

  const playbackSrc = playbackCandidate
    ? resolveAssetUrl(playbackCandidate)
    : "";
  const downloadHref = downloadCandidate
    ? resolveAssetUrl(downloadCandidate)
    : "";

  const filename =
    typeof audio.filename === "string" && audio.filename.trim()
      ? audio.filename.trim()
      : "";

  return {
    playbackSrc,
    downloadHref,
    downloadFilename: filename,
  };
}

function slugifyForFilename(value, fallback = "file") {
  if (!value) return fallback;
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function extractFileExtensionFromUrl(url) {
  if (!url) return "";
  const sanitized = String(url).split(/[?#]/)[0];
  const match = sanitized.match(/\.([a-zA-Z0-9]{2,5})$/);
  return match ? match[1].toLowerCase() : "";
}

function inferFileExtension(resource = {}, fallbackUrl = "") {
  const sanitize = (value) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim().replace(/^\.+/, "");
    if (!trimmed) return "";
    return /^[a-z0-9]{2,5}$/i.test(trimmed) ? trimmed.toLowerCase() : "";
  };

  const directExtension =
    sanitize(resource.file_extension) ||
    sanitize(resource.extension) ||
    sanitize(resource.image_extension);
  if (directExtension) return directExtension;

  const mimeSource =
    (typeof resource.mime_type === "string" && resource.mime_type) ||
    (typeof resource.image_mime_type === "string" && resource.image_mime_type);
  if (mimeSource) {
    const mimeExt = sanitize(mimeSource.split("/").pop());
    if (mimeExt) return mimeExt;
  }

  const urlExtension =
    sanitize(extractFileExtensionFromUrl(resource.download_url)) ||
    sanitize(extractFileExtensionFromUrl(resource.url)) ||
    sanitize(extractFileExtensionFromUrl(resource.image_url)) ||
    sanitize(extractFileExtensionFromUrl(resource.image_src)) ||
    sanitize(extractFileExtensionFromUrl(fallbackUrl));
  if (urlExtension) return urlExtension;

  return "";
}

function createDownloadFilename(
  baseCandidate,
  extension,
  fallbackBase = "image"
) {
  const sanitizedExtension =
    typeof extension === "string"
      ? extension.replace(/^\.+/, "").toLowerCase()
      : "";
  let base = typeof baseCandidate === "string" ? baseCandidate.trim() : "";
  if (base) {
    base = base.replace(/\.[^.]+$/, "");
  }
  const slug = slugifyForFilename(base, fallbackBase);
  if (!sanitizedExtension) {
    return slug;
  }
  return `${slug}.${sanitizedExtension}`;
}

function resolveImageLightboxDetails(resource = {}, options = {}) {
  const previewUrl = options.previewUrl || "";
  const fallbackName = options.fallbackName || "image";
  const fallbackTitle = options.fallbackTitle || "";
  const downloadCandidate =
    selectPreferredAssetUrl(resource, { mode: "download" }) ||
    resource.effective_download_url ||
    resource.download_proxy_url ||
    resource.proxy_download_url ||
    resource.download_url ||
    resource.url ||
    resource.image_download_url ||
    "";
  const downloadHref = downloadCandidate
    ? resolveAssetUrl(downloadCandidate)
    : previewUrl;

  const inferredExtension = inferFileExtension(
    resource,
    downloadHref || previewUrl
  );
  const baseNameCandidate =
    resource.filename ||
    resource.file_name ||
    resource.image_filename ||
    resource.name ||
    resource.title ||
    fallbackTitle ||
    fallbackName;

  const downloadName = createDownloadFilename(
    baseNameCandidate,
    inferredExtension || options.fallbackExtension || "",
    fallbackName
  );

  return {
    downloadHref,
    downloadName,
  };
}

function buildLightboxAttributes({
  src,
  alt,
  caption,
  downloadHref,
  downloadName,
}) {
  const attributes = [];
  if (src) {
    attributes.push(`data-lightbox-src="${escapeHtml(src)}"`);
  }
  if (alt) {
    attributes.push(`data-lightbox-alt="${escapeHtml(alt)}"`);
  }
  if (caption) {
    attributes.push(`data-lightbox-caption="${escapeHtml(caption)}"`);
  }
  if (downloadHref) {
    attributes.push(`data-lightbox-download="${escapeHtml(downloadHref)}"`);
  }
  if (downloadName) {
    attributes.push(`data-lightbox-name="${escapeHtml(downloadName)}"`);
  }
  return attributes.join(" ");
}

function renderPodcastPlayer(podcast, audio, options = {}) {
  const { playbackSrc, downloadHref, downloadFilename } =
    resolvePodcastMediaDetails(audio);

  if (!playbackSrc) {
    return `
      <p class="podcast-player__empty">Audio for this episode isn't available yet.</p>
    `;
  }

  const summaryParts = Array.isArray(options.summaryParts)
    ? options.summaryParts.filter(Boolean)
    : [];
  const summaryMarkup = summaryParts.length
    ? `<p class="podcast-player__summary">${summaryParts
        .map((part) => escapeHtml(part))
        .join(" • ")}</p>`
    : "";
  const downloadLabel = options.downloadLabel
    ? String(options.downloadLabel)
    : "Download episode";

  let preferredDownloadName = downloadFilename;
  if (!preferredDownloadName && options.fallbackDownloadName) {
    preferredDownloadName = options.fallbackDownloadName;
  }

  const downloadAttribute = preferredDownloadName
    ? `download="${escapeHtml(String(preferredDownloadName))}"`
    : "download";

  const downloadMarkup = downloadHref
    ? `<div class="podcast-player__actions">
        <a class="podcast-player__download" href="${escapeHtml(
          downloadHref
        )}" ${downloadAttribute}>
          <span aria-hidden="true">⬇️</span>
          <span>${escapeHtml(downloadLabel)}</span>
        </a>
      </div>`
    : "";

  const ariaLabel = options.ariaLabel
    ? ` aria-label="${escapeHtml(options.ariaLabel)}"`
    : "";

  return `
    <div class="podcast-player" data-podcast-id="${escapeHtml(
      podcast?.id || ""
    )}">
      <div class="podcast-player__visual" aria-hidden="true">🎧</div>
      <div class="podcast-player__body">
        <span class="podcast-player__label">${escapeHtml(
          options.label || "Listen"
        )}</span>
        ${summaryMarkup}
        <audio class="podcast-player__audio" controls preload="metadata" playsinline controlslist="nodownload noplaybackrate" src="${escapeHtml(
          playbackSrc
        )}"${ariaLabel}></audio>
        ${downloadMarkup}
      </div>
    </div>
  `;
}

function getAttachmentIcon(attachment = {}) {
  const mimeType =
    typeof attachment.mime_type === "string"
      ? attachment.mime_type.toLowerCase()
      : "";
  const extension = (attachment.url || attachment.filename || "")
    .toString()
    .split(".")
    .pop()
    .toLowerCase();
  const ext = extension || mimeType.split("/")[1] || "";
  switch (ext) {
    case "pdf":
      return "📕";
    case "doc":
    case "docx":
      return "📘";
    case "ppt":
    case "pptx":
      return "📊";
    case "xls":
    case "xlsx":
    case "csv":
      return "📈";
    case "zip":
    case "tar":
    case "gz":
      return "🗜️";
    case "mp3":
    case "wav":
    case "flac":
      return "🎧";
    case "mp4":
    case "mov":
    case "avi":
      return "🎬";
    default:
      return "📄";
  }
}

function renderArticleAttachmentsList(attachments = []) {
  if (!Array.isArray(attachments) || !attachments.length) return "";
  const items = attachments
    .map((attachment) => {
      const previewCandidate = selectPreferredAssetUrl(attachment, {
        mode: "preview",
      });
      const downloadCandidate = selectPreferredAssetUrl(attachment, {
        mode: "download",
      });
      const resolvedUrl = previewCandidate
        ? resolveAssetUrl(previewCandidate)
        : null;
      const resolvedDownload = downloadCandidate
        ? resolveAssetUrl(downloadCandidate)
        : resolvedUrl;
      const url = escapeHtml(resolvedDownload || "#");
      const previewUrl = escapeHtml(resolvedUrl || resolvedDownload || "#");
      const title = escapeHtml(
        attachment.title || attachment.description || "Download"
      );
      const description = attachment.description
        ? `<span class="dashboard-article-attachment-desc">${escapeHtml(
            attachment.description
          )}</span>`
        : "";
      const typeLabel = attachment.mime_type
        ? escapeHtml(attachment.mime_type.split("/").pop().toUpperCase())
        : escapeHtml(
            (attachment.url || "").split(".").pop() || "FILE"
          ).toUpperCase();
      const sizeLabel = Number.isFinite(attachment.file_size)
        ? escapeHtml(formatFileSize(attachment.file_size))
        : "";
      const metaLabel = [typeLabel, sizeLabel].filter(Boolean).join(" • ");
      const icon = escapeHtml(getAttachmentIcon(attachment));
      const actions = [];
      if (resolvedUrl) {
        actions.push(
          `<a class="article-attachment-item__action" href="${previewUrl}" target="_blank" rel="noopener">Preview</a>`
        );
      }
      if (resolvedDownload) {
        actions.push(
          `<a class="article-attachment-item__action" href="${url}" download>Download</a>`
        );
      }
      const actionsClass = actions.length
        ? "article-attachment-item__actions"
        : "article-attachment-item__actions article-attachment-item__actions--empty";
      const actionsMarkup = `<div class="${actionsClass}">${actions.join(
        ""
      )}</div>`;
      return `
        <li class="article-attachment-item">
          <div class="article-attachment-item__icon" aria-hidden="true">${icon}</div>
          <div class="article-attachment-item__content">
            <span class="article-attachment-item__title">${title}</span>
            ${
              metaLabel
                ? `<span class="article-attachment-item__meta">${metaLabel}</span>`
                : ""
            }
            ${description}
          </div>
          ${actionsMarkup}
        </li>
      `;
    })
    .join("");
  return `
    <div class="dashboard-article-attachments">
      <h5>Attachments</h5>
      <ul class="article-attachment-item-list">${items}</ul>
    </div>
  `;
}

function renderArticleGallery(
  images,
  { variant = "guest", contextTitle = "" } = {}
) {
  if (!Array.isArray(images) || !images.length) {
    return "";
  }
  const wrapperClass =
    variant === "admin" ? "dashboard-article-gallery" : "guest-article-gallery";
  const itemClass =
    variant === "admin"
      ? "dashboard-article-gallery__item"
      : "guest-article-gallery__item";
  const items = images
    .map((image, index) => {
      const imageSource = selectPreferredAssetUrl(image, { mode: "preview" });
      if (!imageSource) {
        return "";
      }
      const previewUrl = resolveAssetUrl(imageSource);
      const imageUrl = escapeHtml(previewUrl);
      const rawAlt =
        image.alt ||
        image.caption ||
        image.title ||
        `Gallery image ${index + 1}`;
      const altText = escapeHtml(rawAlt);
      const captionText = image.caption || "";
      const captionMarkup = captionText
        ? `<figcaption>${escapeHtml(captionText)}</figcaption>`
        : "";
      const fallbackBase = contextTitle
        ? `${slugifyForFilename(contextTitle, "article")}-image-${index + 1}`
        : `gallery-image-${index + 1}`;
      const { downloadHref, downloadName } = resolveImageLightboxDetails(
        image,
        {
          previewUrl,
          fallbackName: fallbackBase,
          fallbackTitle: rawAlt,
        }
      );
      const lightboxAttributes = buildLightboxAttributes({
        src: previewUrl,
        alt: rawAlt,
        caption: captionText,
        downloadHref,
        downloadName,
      });
      const ariaLabel = escapeHtml(`Open ${rawAlt} in fullscreen`);
      return `
        <figure class="${itemClass}">
          <button type="button" class="lightbox-trigger" ${lightboxAttributes} aria-label="${ariaLabel}">
            <img src="${imageUrl}" alt="${altText}" loading="lazy" />
            <span class="lightbox-trigger__icon" aria-hidden="true">🔍</span>
          </button>
          ${captionMarkup}
        </figure>
      `;
    })
    .join("");
  return `<div class="${wrapperClass}">${items}</div>`;
}

function renderArticleAudioTracks(tracks, { variant = "guest" } = {}) {
  if (!Array.isArray(tracks) || !tracks.length) {
    return "";
  }
  const wrapperClass =
    variant === "admin" ? "dashboard-article-audio" : "guest-article-audio";
  const itemClass =
    variant === "admin"
      ? "dashboard-article-audio__item"
      : "guest-article-audio__item";
  const items = tracks
    .map((track, index) => {
      const title = escapeHtml(
        track.title || track.filename || `Audio track ${index + 1}`
      );
      const descriptionMarkup = track.description
        ? `<p class="${itemClass}-description">${escapeHtml(
            track.description
          )}</p>`
        : "";
      const audioSource =
        selectPreferredAssetUrl(track, { mode: "stream" }) || track.url;
      if (!audioSource) {
        return "";
      }
      const audioSrc = escapeHtml(resolveAssetUrl(audioSource));
      const downloadCandidate =
        selectPreferredAssetUrl(track, { mode: "download" }) || audioSource;
      const downloadUrl = escapeHtml(resolveAssetUrl(downloadCandidate));
      const details = [];
      if (track.mime_type) {
        details.push(
          escapeHtml(track.mime_type.split("/").pop().toUpperCase())
        );
      }
      if (Number.isFinite(track.file_size)) {
        details.push(escapeHtml(formatFileSize(track.file_size)));
      }
      const detailsMarkup = details.length
        ? `<p class="${itemClass}-meta">${details.join(" • ")}</p>`
        : "";

      return `
        <div class="${itemClass}">
          <div class="${itemClass}-header">
            <h5>${title}</h5>
            <div class="${itemClass}-actions">
              <a href="${downloadUrl}" download aria-label="Download ${title}">Download</a>
            </div>
          </div>
          <audio controls preload="none" src="${audioSrc}"></audio>
          ${detailsMarkup}
          ${descriptionMarkup}
        </div>
      `;
    })
    .join("");
  return `<div class="${wrapperClass}">${items}</div>`;
}

function renderAdminArticles(targetId, articles = DASHBOARD_ARTICLES) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.removeEventListener("click", handleDashboardArticleAction);
  if (CAN_MANAGE_ARTICLES) {
    container.addEventListener("click", handleDashboardArticleAction);
  }

  if (!articles || !articles.length) {
    container.innerHTML =
      '<p class="placeholder">No guest articles yet. Add one to welcome visitors.</p>';
    return;
  }

  const sorted = [...articles].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  container.innerHTML = sorted.map(renderAdminArticleCard).join("");
}

function renderGuestArticleCard(article) {
  const articleImageSource =
    selectPreferredAssetUrl(article, {
      mode: "hero",
    }) ||
    article.image_src ||
    article.image_url;
  const imageMarkup = articleImageSource
    ? (() => {
        const previewUrl = resolveAssetUrl(articleImageSource);
        const fallbackBase = article.title
          ? `${slugifyForFilename(article.title, "article")}-hero`
          : "guest-article-image";
        const heroAltRaw = article.title || "Article image";
        const { downloadHref, downloadName } = resolveImageLightboxDetails(
          article,
          {
            previewUrl,
            fallbackName: fallbackBase,
            fallbackTitle: article.title,
          }
        );
        const lightboxAttributes = buildLightboxAttributes({
          src: previewUrl,
          alt: heroAltRaw,
          caption: article.description || "",
          downloadHref,
          downloadName,
        });
        const ariaLabel = escapeHtml(
          `Open ${article.title || "article"} image in fullscreen`
        );
        return `
         <figure class="guest-article-image">
           <button type="button" class="lightbox-trigger" ${lightboxAttributes} aria-label="${ariaLabel}">
             <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(
          heroAltRaw
        )}" loading="lazy" />
             <span class="lightbox-trigger__icon" aria-hidden="true">🔍</span>
           </button>
         </figure>`;
      })()
    : "";
  const authorLine = article.authors.length
    ? `<p class="guest-article-authors">${escapeHtml(
        article.authors.join(", ")
      )}</p>`
    : "";
  const linksMarkup = renderArticleLinksList(article.links);
  const attachmentsMarkup = renderArticleAttachmentsList(article.attachments);
  const galleryMarkup = renderArticleGallery(article.gallery_images, {
    variant: "guest",
    contextTitle: article.title,
  });
  const audioMarkup = renderArticleAudioTracks(article.audio_tracks, {
    variant: "guest",
  });
  const notifyAction = renderArticleNotificationAction(article);
  const actionsMarkup = notifyAction
    ? `<div class="guest-content-actions">${notifyAction}</div>`
    : "";

  return `
    <article class="guest-article-card">
      ${imageMarkup}
      <div class="guest-article-body">
        <h3>${escapeHtml(article.title)}</h3>
        ${authorLine}
        ${
          article.description
            ? `<p class="guest-article-description">${escapeHtml(
                article.description
              )}</p>`
            : ""
        }
        ${linksMarkup}
        ${galleryMarkup}
        ${audioMarkup}
        ${attachmentsMarkup}
        ${actionsMarkup}
      </div>
    </article>
  `;
}

function guestSectionsAreCollapsed() {
  return (
    dashboardViewMode === "guest" &&
    !guestArticleEditMode &&
    !guestPodcastEditMode
  );
}

function getGuestContentTimestamp(item) {
  if (!item) return Number.NEGATIVE_INFINITY;
  const raw = item.updated_at || item.created_at;
  if (!raw) return Number.NEGATIVE_INFINITY;
  const value = new Date(raw).getTime();
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

function renderGuestFeedItem(type, item, cardMarkup) {
  if (!cardMarkup) return "";
  const safeType = type === "podcast" ? "podcast" : "article";
  const typeLabel = safeType === "podcast" ? "Podcast" : "Article";
  const pendingBadge = renderPendingBadge(item?.pendingAction);
  const timestampRaw = item?.updated_at || item?.created_at;
  const timestampLabel = timestampRaw
    ? formatEventDateTime(timestampRaw, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";
  let typeMarkup = escapeHtml(typeLabel);
  if (pendingBadge) {
    typeMarkup = `${typeMarkup} ${pendingBadge}`;
  }

  return `
    <div class="guest-feed-item guest-feed-item--${escapeHtml(
      safeType
    )}" role="listitem">
      <div class="guest-feed-item__meta">
        <span class="guest-feed-item__type">${typeMarkup}</span>
        <span class="guest-feed-item__time">${escapeHtml(timestampLabel)}</span>
      </div>
      ${cardMarkup}
    </div>
  `;
}

function renderGuestContentFeed() {
  const wrapper = document.getElementById("guest-feed-wrapper");
  const list = document.getElementById("guest-feed-list");
  if (!wrapper || !list) return;

  list.removeEventListener("click", handleDashboardArticleAction);
  list.removeEventListener("click", handleDashboardPodcastAction);
  if (CAN_MANAGE_ARTICLES && dashboardViewMode === "guest") {
    list.addEventListener("click", handleDashboardArticleAction);
    list.addEventListener("click", handleDashboardPodcastAction);
  }

  if (dashboardViewMode === "admin") {
    list.innerHTML = "";
    wrapper.classList.add("hidden");
    updateGuestLayoutOrder();
    return;
  }

  wrapper.classList.remove("hidden");

  const combined = [];
  DASHBOARD_ARTICLES.forEach((article) => {
    combined.push({
      type: "article",
      item: article,
      timestamp: getGuestContentTimestamp(article),
    });
  });
  DASHBOARD_PODCASTS.forEach((podcast) => {
    combined.push({
      type: "podcast",
      item: podcast,
      timestamp: getGuestContentTimestamp(podcast),
    });
  });

  const entries = combined
    .filter((entry) => entry.item)
    .sort((a, b) => b.timestamp - a.timestamp);

  const markup = entries
    .map((entry) => {
      const cardMarkup =
        entry.type === "article"
          ? renderGuestArticleCard(entry.item)
          : renderGuestPodcastCard(entry.item);
      return renderGuestFeedItem(entry.type, entry.item, cardMarkup);
    })
    .filter(Boolean)
    .join("");

  if (!markup) {
    const canManage = CAN_MANAGE_ARTICLES;
    let placeholder;
    if (canManage && dashboardViewMode === "guest") {
      placeholder =
        "No guest updates yet. Turn on editing to publish your first article or episode.";
    } else if (canManage) {
      placeholder =
        "Guest updates will appear here. Switch to guest view or start publishing to preview the feed.";
    } else {
      placeholder =
        "Guest articles and podcasts will appear here once they are published.";
    }
    list.innerHTML = `<p class="placeholder">${escapeHtml(placeholder)}</p>`;
    wrapper.classList.remove("hidden");
    updateGuestLayoutOrder();
    return;
  }

  list.innerHTML = markup;
  wrapper.classList.remove("hidden");
  updateGuestLayoutOrder();
}

function updateGuestLayoutOrder() {
  const main = document.querySelector(".dashboard-main");
  const feed = document.getElementById("guest-feed-wrapper");
  if (!main || !feed || feed.classList.contains("hidden")) return;

  const articlesWrapper = document.getElementById("guest-articles-wrapper");
  const podcastsWrapper = document.getElementById("guest-podcasts-wrapper");
  const adminColumns = document.getElementById("dashboard-admin-columns");

  const editingActive = guestArticleEditMode || guestPodcastEditMode;

  if (!editingActive) {
    const beforeNode = articlesWrapper || podcastsWrapper || adminColumns;
    if (beforeNode) {
      main.insertBefore(feed, beforeNode);
    } else if (feed !== main.lastElementChild) {
      main.appendChild(feed);
    }
    return;
  }

  if (adminColumns) {
    main.insertBefore(feed, adminColumns);
  } else {
    main.appendChild(feed);
  }
}

function renderGuestArticles(targetId, articles = DASHBOARD_ARTICLES) {
  const container = document.getElementById(targetId);
  const wrapper = document.getElementById("guest-articles-wrapper");
  const user = getUser();
  if (!container) return;
  container.removeEventListener("click", handleDashboardArticleAction);
  if (CAN_MANAGE_ARTICLES) {
    container.addEventListener("click", handleDashboardArticleAction);
  }
  if (wrapper && user) {
    wrapper.classList.remove("guest-section--locked");
  }
  const hasArticles = Array.isArray(articles) && articles.length > 0;
  const canManageGuestArticles =
    CAN_MANAGE_ARTICLES && dashboardViewMode === "guest";
  const shouldShowWrapper =
    dashboardViewMode === "guest" && (hasArticles || canManageGuestArticles);
  const collapseSections = guestSectionsAreCollapsed();

  if (!hasArticles) {
    container.innerHTML = canManageGuestArticles
      ? '<p class="placeholder">No guest articles yet. Use “Edit guest articles” to publish the first story.</p>'
      : "";
    if (wrapper) {
      const hideWrapper = !shouldShowWrapper || collapseSections;
      wrapper.classList.toggle("hidden", hideWrapper);
    }
    renderGuestContentFeed();
    updateGuestLayoutOrder();
    return;
  }

  const sorted = [...articles].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  container.innerHTML = sorted.map(renderGuestArticleCard).join("");
  if (wrapper) {
    const hideWrapper = !shouldShowWrapper || collapseSections;
    wrapper.classList.toggle("hidden", hideWrapper);
  }
  updateGuestContentOrder();
  renderGuestContentFeed();
  updateGuestLayoutOrder();
}

function clearGuestArticlesDisplay() {
  const wrapper = document.getElementById("guest-articles-wrapper");
  const list = document.getElementById("guest-articles-list");
  if (list) {
    list.innerHTML = "";
  }
  if (wrapper) {
    wrapper.classList.add("hidden");
    wrapper.classList.remove("guest-section--locked");
  }
  renderGuestContentFeed();
}

function showGuestContentAuthGate() {
  const articleWrapper = document.getElementById("guest-articles-wrapper");
  const articleList = document.getElementById("guest-articles-list");
  if (articleList) {
    articleList.innerHTML = "";
  }
  if (articleWrapper) {
    articleWrapper.classList.add("hidden");
    articleWrapper.classList.remove("guest-section--locked");
  }

  const podcastWrapper = document.getElementById("guest-podcasts-wrapper");
  const podcastList = document.getElementById("guest-podcasts-list");
  if (podcastList) {
    podcastList.innerHTML = "";
  }
  if (podcastWrapper) {
    podcastWrapper.classList.add("hidden");
    podcastWrapper.classList.remove("guest-section--locked");
  }

  const feedWrapper = document.getElementById("guest-feed-wrapper");
  const feedList = document.getElementById("guest-feed-list");
  if (feedList) {
    feedList.innerHTML =
      '<p class="placeholder">Register or log in to explore guest articles and podcasts.</p>';
  }
  if (feedWrapper) {
    feedWrapper.classList.remove("hidden");
  }

  updateGuestLayoutOrder();
}

function renderGuestPodcastCard(podcast) {
  if (!podcast || !podcast.audio) return "";
  const audio = podcast.audio;
  const title = escapeHtml(podcast.title);
  const descriptionMarkup = podcast.description
    ? `<p class="guest-podcast-card__description">${escapeHtml(
        podcast.description
      )}</p>`
    : "";
  const playbackSummary = [];
  if (audio.duration_seconds) {
    const durationLabel = formatAudioDuration(audio.duration_seconds);
    if (durationLabel) {
      playbackSummary.push(`Duration ${durationLabel}`);
    }
  }
  if (Number.isFinite(audio.file_size)) {
    playbackSummary.push(formatFileSize(audio.file_size));
  }

  const playerMarkup = renderPodcastPlayer(podcast, audio, {
    label: "Listen now",
    downloadLabel: "Download episode",
    summaryParts: playbackSummary,
    ariaLabel: `Play ${podcast.title}`,
    fallbackDownloadName: `${slugifyForFilename(podcast.title, "episode")}.mp3`,
  });

  const metaParts = [];
  if (podcast.created_at) {
    metaParts.push(
      `Published ${escapeHtml(
        formatEventDateTime(podcast.created_at, {
          dateStyle: "long",
        })
      )}`
    );
  }
  const metaMarkup = metaParts.length
    ? `<div class="guest-podcast-card__meta">${metaParts
        .map((part) => `<span>${part}</span>`)
        .join("")}</div>`
    : "";
  const notifyAction = renderPodcastNotificationAction(podcast);
  const actionsMarkup = notifyAction
    ? `<div class="guest-content-actions">${notifyAction}</div>`
    : "";

  return `
    <article class="guest-podcast-card">
      <header class="guest-podcast-card__header">
        <h4 class="guest-podcast-card__title">${title}</h4>
      </header>
      ${descriptionMarkup}
      ${playerMarkup}
      ${metaMarkup}
      ${actionsMarkup}
    </article>
  `;
}

function renderGuestPodcasts(targetId, podcasts = DASHBOARD_PODCASTS) {
  const container = document.getElementById(targetId);
  const wrapper = document.getElementById("guest-podcasts-wrapper");
  if (!container) return;
  container.removeEventListener("click", handleDashboardPodcastAction);
  if (CAN_MANAGE_ARTICLES) {
    container.addEventListener("click", handleDashboardPodcastAction);
  }

  if (wrapper) {
    wrapper.classList.remove("guest-section--locked");
  }

  const hasPodcasts = Array.isArray(podcasts) && podcasts.length > 0;
  const canManageGuestContent =
    CAN_MANAGE_ARTICLES && dashboardViewMode === "guest";
  const shouldShowWrapper =
    dashboardViewMode === "guest" && (hasPodcasts || canManageGuestContent);
  const collapseSections = guestSectionsAreCollapsed();

  if (!hasPodcasts) {
    container.innerHTML = canManageGuestContent
      ? '<p class="placeholder">No podcasts published yet. Toggle guest editing to publish the first episode.</p>'
      : "";
    if (wrapper) {
      const hideWrapper = !shouldShowWrapper || collapseSections;
      wrapper.classList.toggle("hidden", hideWrapper);
    }
    renderGuestContentFeed();
    updateGuestLayoutOrder();
    return;
  }

  const sorted = [...podcasts].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  container.innerHTML = sorted.map(renderGuestPodcastCard).join("");
  if (wrapper) {
    const hideWrapper = !shouldShowWrapper || collapseSections;
    wrapper.classList.toggle("hidden", hideWrapper);
  }
  updateGuestContentOrder();
  renderGuestContentFeed();
  updateGuestLayoutOrder();
}

function clearGuestPodcastsDisplay() {
  const wrapper = document.getElementById("guest-podcasts-wrapper");
  const list = document.getElementById("guest-podcasts-list");
  if (list) {
    list.innerHTML = "";
  }
  if (wrapper) {
    wrapper.classList.add("hidden");
    wrapper.classList.remove("guest-section--locked");
  }
  renderGuestContentFeed();
}

function getLatestContentTimestamp(collection = []) {
  return collection.reduce((latest, item) => {
    if (!item) return latest;
    const raw = item.updated_at || item.created_at;
    if (!raw) return latest;
    const value = new Date(raw).getTime();
    return Number.isFinite(value) && value > latest ? value : latest;
  }, Number.NEGATIVE_INFINITY);
}

function updateGuestContentOrder() {
  if (guestSectionsAreCollapsed()) {
    return;
  }
  const articlesWrapper = document.getElementById("guest-articles-wrapper");
  const podcastsWrapper = document.getElementById("guest-podcasts-wrapper");
  if (!articlesWrapper || !podcastsWrapper) return;

  const parent = articlesWrapper.parentElement;
  if (!parent || parent !== podcastsWrapper.parentElement) return;

  const latestArticle = getLatestContentTimestamp(DASHBOARD_ARTICLES);
  const latestPodcast = getLatestContentTimestamp(DASHBOARD_PODCASTS);

  const hasArticles = Number.isFinite(latestArticle);
  const hasPodcasts = Number.isFinite(latestPodcast);

  if (!hasArticles && !hasPodcasts) {
    return;
  }

  if (hasPodcasts && (!hasArticles || latestPodcast > latestArticle)) {
    const relation = podcastsWrapper.compareDocumentPosition(articlesWrapper);
    const podcastsBeforeArticles = Boolean(
      relation & Node.DOCUMENT_POSITION_FOLLOWING
    );
    if (!podcastsBeforeArticles) {
      parent.insertBefore(podcastsWrapper, articlesWrapper);
    }
    return;
  }

  if (hasArticles) {
    const relation = articlesWrapper.compareDocumentPosition(podcastsWrapper);
    const articlesBeforePodcasts = Boolean(
      relation & Node.DOCUMENT_POSITION_FOLLOWING
    );
    if (!articlesBeforePodcasts) {
      parent.insertBefore(articlesWrapper, podcastsWrapper);
    }
  }
}

function renderAdminPodcastCard(podcast) {
  if (!podcast || !podcast.audio) return "";
  const audio = podcast.audio;
  const title = escapeHtml(podcast.title);
  const pendingBadge = renderPendingBadge(podcast.pendingAction);
  const descriptionMarkup = podcast.description
    ? `<p class="dashboard-podcast-card__description">${escapeHtml(
        podcast.description
      )}</p>`
    : "";
  const playbackSummary = [];
  if (audio.duration_seconds) {
    const durationLabel = formatAudioDuration(audio.duration_seconds);
    if (durationLabel) {
      playbackSummary.push(`Duration ${durationLabel}`);
    }
  }
  if (Number.isFinite(audio.file_size)) {
    playbackSummary.push(formatFileSize(audio.file_size));
  }

  const playerMarkup = renderPodcastPlayer(podcast, audio, {
    label: "Episode audio",
    downloadLabel: "Download audio",
    summaryParts: playbackSummary,
    ariaLabel: `Play ${podcast.title}`,
    fallbackDownloadName: `${slugifyForFilename(podcast.title, "episode")}.mp3`,
  });

  const metaParts = [];
  if (podcast.updated_at || podcast.created_at) {
    const timestamp = podcast.updated_at || podcast.created_at;
    metaParts.push(
      `Updated ${escapeHtml(
        formatEventDateTime(timestamp, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      )}`
    );
  }
  const metaMarkup = metaParts.length
    ? `<div class="dashboard-podcast-card__meta">${metaParts
        .map((part) => `<span>${part}</span>`)
        .join("")}</div>`
    : "";

  const actionsMarkup = CAN_MANAGE_ARTICLES
    ? `<div class="dashboard-podcast-card__actions">
        ${renderPodcastNotificationAction(podcast)}
        <button type="button" class="icon-button" data-action="edit-podcast" data-id="${escapeHtml(
          podcast.id
        )}">Edit</button>
        <button type="button" class="icon-button icon-button-danger" data-action="delete-podcast" data-id="${escapeHtml(
          podcast.id
        )}">Delete</button>
      </div>`
    : "";

  return `
    <article class="dashboard-podcast-card" data-id="${escapeHtml(podcast.id)}">
      <header class="dashboard-podcast-card__header">
        <h4 class="dashboard-podcast-card__title">${title}${
    pendingBadge ? ` ${pendingBadge}` : ""
  }</h4>
        ${actionsMarkup}
      </header>
      ${descriptionMarkup}
      ${playerMarkup}
      ${metaMarkup}
    </article>
  `;
}

function renderAdminPodcasts(targetId, podcasts = DASHBOARD_PODCASTS) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.removeEventListener("click", handleDashboardPodcastAction);
  if (CAN_MANAGE_ARTICLES) {
    container.addEventListener("click", handleDashboardPodcastAction);
  }

  if (!podcasts || !podcasts.length) {
    container.innerHTML =
      '<p class="placeholder">No podcasts published yet. Add one to keep guests engaged.</p>';
    return;
  }

  const sorted = [...podcasts].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  container.innerHTML = sorted.map(renderAdminPodcastCard).join("");
}

function buildDocumentOptions(selectedId) {
  if (!DOCUMENT_LIBRARY.length) {
    return '<option value="">No documents uploaded yet</option>';
  }
  const options = DOCUMENT_LIBRARY.map((doc) => {
    const value = escapeHtml(doc.id);
    const label = escapeHtml(
      doc.title || doc.name || doc.filename || `Document ${doc.id}`
    );
    const scopeLabel =
      doc.scope === "article"
        ? " (Article upload)"
        : doc.scope === "shared"
        ? ""
        : ` (${escapeHtml(String(doc.scope))})`;
    const sizeLabel = doc.file_size
      ? ` — ${escapeHtml(formatFileSize(doc.file_size))}`
      : "";
    const optionLabel = `${label}${scopeLabel}${sizeLabel}`;
    const isSelected = String(selectedId || "") === String(doc.id);
    return `<option value="${value}" ${
      isSelected ? "selected" : ""
    }>${optionLabel}</option>`;
  });
  return [
    '<option value="">None (upload or paste a link)</option>',
    ...options,
  ].join("");
}

function addArticleLinkRow(initialLink = {}, options = {}) {
  const list = document.getElementById("dashboard-article-links-list");
  if (!list) return null;
  const rowId = initialLink.id || generateArticleLinkId();
  const labelValue = escapeHtml(initialLink.label || "");
  const urlValue = escapeHtml(initialLink.url || "");
  const descriptionValue = escapeHtml(initialLink.description || "");

  const row = document.createElement("div");
  row.className = "article-link-form-row";
  row.dataset.rowId = rowId;
  row.innerHTML = `
    <div class="form-field">
      <label for="${rowId}-label">Label</label>
      <input
        type="text"
        id="${rowId}-label"
        name="article-link-label"
        placeholder="Learn more"
        value="${labelValue}"
        maxlength="80"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-url">URL</label>
      <input
        type="url"
        id="${rowId}-url"
        name="article-link-url"
        placeholder="https://example.com"
        value="${urlValue}"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-desc">Description</label>
      <input
        type="text"
        id="${rowId}-desc"
        name="article-link-description"
        placeholder="Optional context"
        value="${descriptionValue}"
        maxlength="120"
      />
    </div>
    <button
      type="button"
      class="icon-button icon-button-danger"
      data-action="remove-article-link"
      aria-label="Remove link"
    >Remove</button>
  `;

  list.appendChild(row);
  if (options.focus) {
    row.querySelector('input[name="article-link-label"]')?.focus();
  }
  return row;
}

function clearArticleLinkRows() {
  const list = document.getElementById("dashboard-article-links-list");
  if (!list) return;
  list.innerHTML = "";
}

function setArticleLinkRows(links = []) {
  clearArticleLinkRows();
  const list = document.getElementById("dashboard-article-links-list");
  if (!list) return;
  if (!links.length) return;
  links.forEach((link) => addArticleLinkRow(link));
}

function ensureArticleLinkRowExists() {
  const list = document.getElementById("dashboard-article-links-list");
  if (!list) return;
  if (!list.querySelector(".article-link-form-row")) {
    addArticleLinkRow();
  }
}

function collectArticleLinks() {
  const list = document.getElementById("dashboard-article-links-list");
  if (!list) return [];
  const links = [];
  list.querySelectorAll(".article-link-form-row").forEach((row) => {
    const labelInput = row.querySelector('input[name="article-link-label"]');
    const urlInput = row.querySelector('input[name="article-link-url"]');
    const descriptionInput = row.querySelector(
      'input[name="article-link-description"]'
    );
    const label = labelInput?.value?.trim() || "";
    const url = urlInput?.value?.trim();
    const description = descriptionInput?.value?.trim() || "";
    if (!url) return;
    links.push({
      id: row.dataset.rowId || generateArticleLinkId(),
      label: label || null,
      url,
      description: description || null,
    });
  });
  return links;
}

function addArticleAttachmentRow(initialAttachment = {}, options = {}) {
  const list = document.getElementById("dashboard-article-attachments-list");
  if (!list) return null;
  const rowId = initialAttachment.id || generateArticleAttachmentId();
  const documentId = initialAttachment.document_id
    ? String(initialAttachment.document_id).trim()
    : "";
  const doc = documentId ? findDocumentById(documentId) : null;
  const titleValue = escapeHtml(
    initialAttachment.title || doc?.title || doc?.name || doc?.filename || ""
  );
  const urlValue = escapeHtml(
    initialAttachment.url ||
      initialAttachment.download_url ||
      doc?.url ||
      doc?.path ||
      ""
  );
  const descriptionValue = escapeHtml(initialAttachment.description || "");
  const fileInputId = `${rowId}-file`;
  const fileTriggerId = `${rowId}-file-trigger`;
  const fileNameId = `${rowId}-file-name`;
  const linkedDocHint = doc
    ? `<p class="form-hint">Linked to ${escapeHtml(
        doc.title || doc.name || doc.filename || "uploaded document"
      )}. Updating the URL will override the link.</p>`
    : "";

  const row = document.createElement("div");
  row.className = "article-attachment-form-row";
  row.dataset.rowId = rowId;
  if (documentId) {
    row.dataset.documentId = documentId;
  }
  if (initialAttachment.filename) {
    row.dataset.filename = initialAttachment.filename;
  }
  if (initialAttachment.mime_type) {
    row.dataset.mimeType = initialAttachment.mime_type;
  }
  if (initialAttachment.file_size != null) {
    row.dataset.fileSize = String(initialAttachment.file_size);
  }
  if (initialAttachment.storage_key) {
    row.dataset.storageKey = initialAttachment.storage_key;
  }
  if (initialAttachment.storage_bucket) {
    row.dataset.storageBucket = initialAttachment.storage_bucket;
  }
  if (initialAttachment.download_url) {
    row.dataset.downloadUrl = initialAttachment.download_url;
  } else if (initialAttachment.url) {
    row.dataset.downloadUrl = initialAttachment.url;
  } else if (doc?.url || doc?.path) {
    row.dataset.downloadUrl = doc.url || doc.path;
  }

  row.innerHTML = `
    <div class="form-field article-attachment-upload">
      <label for="${fileInputId}">Upload document</label>
      <div class="file-picker">
        <input
          type="file"
          id="${fileInputId}"
          class="file-picker__input article-attachment-file-input"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.zip,.rar,.ppt,.pptx"
        />
        <label
          for="${fileInputId}"
          id="${fileTriggerId}"
          class="file-picker__trigger"
          role="button"
          tabindex="0"
        ></label>
        <span id="${fileNameId}" class="file-picker__filename"></span>
      </div>
      ${linkedDocHint}
      <p class="form-hint">New uploads are saved to Documents and linked automatically.</p>
      <div class="attachment-upload-status" hidden role="status" aria-live="polite">Uploading…</div>
    </div>
    <div class="form-field">
      <label for="${rowId}-title">Display name</label>
      <input
        type="text"
        id="${rowId}-title"
        name="article-attachment-title"
        placeholder="Docker 101 deck"
        value="${titleValue}"
        maxlength="120"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-url">Direct link</label>
      <input
        type="url"
        id="${rowId}-url"
        name="article-attachment-url"
        placeholder="https://example.com/resource.pdf"
        value="${urlValue}"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-desc">Description</label>
      <input
        type="text"
        id="${rowId}-desc"
        name="article-attachment-description"
        placeholder="Optional context"
        value="${descriptionValue}"
        maxlength="160"
      />
    </div>
    <button
      type="button"
      class="icon-button icon-button-danger"
      data-action="remove-article-attachment"
      aria-label="Remove attachment"
    >Remove</button>
  `;

  list.appendChild(row);
  initializeArticleAttachmentRow(row, {
    fileInputId,
    fileTriggerId,
    fileNameId,
  });
  if (options.focus) {
    row.querySelector('input[name="article-attachment-title"]')?.focus();
  }
  return row;
}

function clearArticleAttachmentRows() {
  const list = document.getElementById("dashboard-article-attachments-list");
  if (!list) return;
  list.innerHTML = "";
}

function setArticleAttachmentRows(attachments = []) {
  clearArticleAttachmentRows();
  const list = document.getElementById("dashboard-article-attachments-list");
  if (!list) return;
  if (!attachments.length) return;
  attachments.forEach((attachment) => addArticleAttachmentRow(attachment));
}

function ensureArticleAttachmentRowExists() {
  const list = document.getElementById("dashboard-article-attachments-list");
  if (!list) return;
  if (!list.querySelector(".article-attachment-form-row")) {
    addArticleAttachmentRow();
  }
}

function addDocumentToLibrary(document) {
  if (!document || !document.id) return;
  const idString = String(document.id);
  const normalized = { ...document };
  normalized.scope = normalized.scope || "shared";
  const existingIndex = DOCUMENT_LIBRARY.findIndex(
    (doc) => String(doc.id) === idString
  );
  if (existingIndex >= 0) {
    DOCUMENT_LIBRARY[existingIndex] = normalized;
  } else {
    DOCUMENT_LIBRARY.push(normalized);
  }
}

function refreshAttachmentDocumentOptions({
  selectToUpdate,
  newSelection,
} = {}) {
  const selects = selectToUpdate
    ? [selectToUpdate]
    : Array.from(
        document.querySelectorAll("select.article-attachment-document")
      );
  selects.forEach((select) => {
    const currentValue = newSelection || select.value;
    select.innerHTML = buildDocumentOptions(currentValue);
    if (currentValue) {
      select.value = currentValue;
    }
  });
}

function initializeArticleAttachmentRow(row, ids = {}) {
  if (!row) return;
  const { fileInputId, fileTriggerId, fileNameId } = ids;
  if (!fileInputId || !fileTriggerId || !fileNameId) return;
  const fileInput = document.getElementById(fileInputId);
  const statusEl = row.querySelector(".attachment-upload-status");
  let attachmentStatusTimeoutId = null;
  const picker = setupFilePicker({
    inputId: fileInputId,
    triggerId: fileTriggerId,
    filenameId: fileNameId,
    labels: {
      button: "Upload document from device",
      placeholder: "No document selected",
      icon: "📎",
      variant: "document",
    },
  });
  articleAttachmentPickerResets.set(row, picker.reset);

  if (!fileInput || fileInput.dataset.attachmentBound === "true") {
    return;
  }

  fileInput.dataset.attachmentBound = "true";
  fileInput.addEventListener("change", async () => {
    if (attachmentStatusTimeoutId) {
      window.clearTimeout(attachmentStatusTimeoutId);
      attachmentStatusTimeoutId = null;
    }
    const file = fileInput.files?.[0];
    if (!file) {
      row.dataset.uploading = "false";
      statusEl?.setAttribute("hidden", "");
      return;
    }

    row.dataset.uploading = "true";
    let counted = false;
    adjustArticleAttachmentUploadCount(1);
    counted = true;
    if (statusEl) {
      statusEl.textContent = formatFileSummary(file.name, file.size, {
        action: "uploading",
      });
      statusEl.removeAttribute("hidden");
    }
    picker.setFilename(
      formatFileSummary(file.name, file.size, { action: "uploading" }),
      { status: "uploading" }
    );

    try {
      const document = await uploadArticleAttachment(file);
      if (document) {
        addDocumentToLibrary(document);
        row.dataset.documentId = document.id != null ? String(document.id) : "";
        row.dataset.filename = document.filename || "";
        row.dataset.mimeType = document.mime_type || "";
        row.dataset.fileSize =
          document.file_size != null ? String(document.file_size) : "";
        if (document.storage_key) {
          row.dataset.storageKey = document.storage_key;
        } else {
          delete row.dataset.storageKey;
        }
        if (document.storage_bucket) {
          row.dataset.storageBucket = document.storage_bucket;
        } else {
          delete row.dataset.storageBucket;
        }
        row.dataset.downloadUrl = document.url || document.path || "";
        const titleInput = row.querySelector(
          'input[name="article-attachment-title"]'
        );
        const urlInput = row.querySelector(
          'input[name="article-attachment-url"]'
        );
        if (titleInput && !titleInput.value) {
          titleInput.value =
            document.title || document.filename || document.name || "";
        }
        if (urlInput && !urlInput.value) {
          urlInput.value = document.url || document.path || "";
        }
        if (statusEl) {
          statusEl.textContent = formatFileSummary(
            document.title || document.filename || file.name,
            document.file_size ?? file.size,
            { action: "uploaded" }
          );
          statusEl.removeAttribute("hidden");
          attachmentStatusTimeoutId = window.setTimeout(() => {
            statusEl.setAttribute("hidden", "");
            statusEl.textContent = "";
            attachmentStatusTimeoutId = null;
          }, 4000);
        }
        picker.reset({
          displayText: formatFileSummary(
            document.title || document.filename || file.name,
            document.file_size ?? file.size,
            { action: "uploaded" }
          ),
          status: "uploaded",
        });
        showNotification(
          `Document "${escapeHtml(
            document.title || document.filename || file.name
          )}" uploaded`,
          "success",
          "Attachment ready"
        );
      }
    } catch (error) {
      // uploadArticleAttachment already notifies on failure
      picker.reset({
        displayText: formatFileSummary(file.name, file.size, {
          action: "error",
        }),
        status: "error",
      });
      if (statusEl) {
        const failureMessage =
          error?.message ||
          "Upload failed. Make sure the admin API is running and you have permission.";
        statusEl.textContent = failureMessage;
        statusEl.removeAttribute("hidden");
        attachmentStatusTimeoutId = window.setTimeout(() => {
          statusEl.setAttribute("hidden", "");
          statusEl.textContent = "";
          attachmentStatusTimeoutId = null;
        }, 6000);
      }
    } finally {
      row.dataset.uploading = "false";
      if (counted) {
        adjustArticleAttachmentUploadCount(-1);
      }
      ensurePreferredDashboardViewMode();
    }
  });
}

function collectArticleAttachments() {
  const list = document.getElementById("dashboard-article-attachments-list");
  if (!list) return [];
  const attachments = [];
  list.querySelectorAll(".article-attachment-form-row").forEach((row) => {
    const titleInput = row.querySelector(
      'input[name="article-attachment-title"]'
    );
    const descriptionInput = row.querySelector(
      'input[name="article-attachment-description"]'
    );
    const urlInput = row.querySelector('input[name="article-attachment-url"]');
    const documentId = row.dataset.documentId
      ? String(row.dataset.documentId).trim()
      : "";
    const overrideUrl = urlInput?.value?.trim() || "";
    const datasetUrl = row.dataset.downloadUrl
      ? String(row.dataset.downloadUrl).trim()
      : "";
    const resolvedUrl = overrideUrl || datasetUrl;
    if (!documentId && !resolvedUrl) {
      return;
    }

    const fileSizeRaw = row.dataset.fileSize
      ? Number(row.dataset.fileSize)
      : Number.NaN;
    attachments.push({
      id: row.dataset.rowId || generateArticleAttachmentId(),
      document_id: documentId || null,
      title: titleInput?.value?.trim() || null,
      url: resolvedUrl || null,
      description: descriptionInput?.value?.trim() || null,
      filename: row.dataset.filename || null,
      mime_type: row.dataset.mimeType || null,
      file_size:
        Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null,
      download_url: resolvedUrl || null,
      storage_key: row.dataset.storageKey || null,
      storage_bucket: row.dataset.storageBucket || null,
    });
  });
  return attachments;
}

function clearArticleImageRows() {
  const list = document.getElementById("dashboard-article-gallery-list");
  if (!list) return;
  list.innerHTML = "";
}

function setArticleImageRows(images = []) {
  clearArticleImageRows();
  const list = document.getElementById("dashboard-article-gallery-list");
  if (!list) return;
  if (images.length) {
    images.forEach((image) => addArticleImageRow(image));
  }
  ensureArticleImageRowExists();
}

function ensureArticleImageRowExists() {
  const list = document.getElementById("dashboard-article-gallery-list");
  if (!list) return;
  if (!list.querySelector(".article-gallery-form-row")) {
    addArticleImageRow();
  }
}

function initializeArticleImageRow(row, ids = {}) {
  if (!row) return;
  const { fileInputId, fileTriggerId, fileNameId } = ids;
  if (!fileInputId || !fileTriggerId || !fileNameId) return;
  const fileInput = document.getElementById(fileInputId);
  const statusEl = row.querySelector(".article-image-upload-status");
  let statusTimeoutId = null;
  const picker = setupFilePicker({
    inputId: fileInputId,
    triggerId: fileTriggerId,
    filenameId: fileNameId,
    labels: {
      button: "Upload gallery image",
      placeholder: "No image selected",
      icon: "🖼️",
      variant: "image",
    },
  });
  articleGalleryPickerResets.set(row, picker.reset);

  if (!fileInput || fileInput.dataset.galleryBound === "true") {
    return;
  }

  fileInput.dataset.galleryBound = "true";
  fileInput.addEventListener("change", async () => {
    if (statusTimeoutId) {
      window.clearTimeout(statusTimeoutId);
      statusTimeoutId = null;
    }
    const file = fileInput.files?.[0];
    if (!file) {
      row.dataset.uploading = "false";
      statusEl?.setAttribute("hidden", "");
      picker.reset();
      return;
    }

    row.dataset.uploading = "true";
    adjustArticleImageUploadCount(1);
    picker.setFilename(
      formatFileSummary(file.name, file.size, { action: "uploading" }),
      { status: "uploading" }
    );
    if (statusEl) {
      statusEl.textContent = formatFileSummary(file.name, file.size, {
        action: "uploading",
      });
      statusEl.removeAttribute("hidden");
    }

    try {
      const imageResource = await uploadArticleImage(file);
      const url =
        typeof imageResource === "string" ? imageResource : imageResource?.url;
      if (url) {
        const urlInput = row.querySelector('input[name="article-image-url"]');
        if (urlInput) {
          urlInput.value = url;
        }
        if (imageResource && typeof imageResource === "object") {
          if (imageResource.storage_key) {
            row.dataset.storageKey = String(imageResource.storage_key).trim();
          } else {
            delete row.dataset.storageKey;
          }
          if (imageResource.filename) {
            row.dataset.filename = String(imageResource.filename).trim();
          } else {
            delete row.dataset.filename;
          }
          if (imageResource.mime_type) {
            row.dataset.mimeType = String(imageResource.mime_type).trim();
          } else {
            delete row.dataset.mimeType;
          }
          if (imageResource.file_size != null) {
            row.dataset.fileSize = String(imageResource.file_size);
          } else {
            delete row.dataset.fileSize;
          }
        }
        const renderedSize =
          (imageResource && typeof imageResource === "object"
            ? imageResource.file_size
            : null) ?? file.size;
        picker.reset({
          displayText: formatFileSummary(file.name, renderedSize, {
            action: "uploaded",
          }),
          status: "uploaded",
        });
        if (statusEl) {
          statusEl.textContent = formatFileSummary(file.name, renderedSize, {
            action: "uploaded",
          });
          statusTimeoutId = window.setTimeout(() => {
            statusEl.setAttribute("hidden", "");
            statusEl.textContent = "";
            statusTimeoutId = null;
          }, 4000);
        }
        showNotification(
          `Image "${escapeHtml(file.name)}" uploaded`,
          "success",
          "Gallery ready"
        );
      }
    } catch (error) {
      picker.reset({
        displayText: formatFileSummary(file.name, file.size, {
          action: "error",
        }),
        status: "error",
      });
      if (statusEl) {
        const message =
          error?.message || "Upload failed. Try a different image.";
        statusEl.textContent = message;
        statusEl.removeAttribute("hidden");
        statusTimeoutId = window.setTimeout(() => {
          statusEl.setAttribute("hidden", "");
          statusEl.textContent = "";
          statusTimeoutId = null;
        }, 6000);
      }
    } finally {
      row.dataset.uploading = "false";
      adjustArticleImageUploadCount(-1);
      ensurePreferredDashboardViewMode();
    }
  });
}

function addArticleImageRow(initialImage = {}, options = {}) {
  const list = document.getElementById("dashboard-article-gallery-list");
  if (!list) return null;
  const rowId = initialImage.id || generateArticleImageId();
  const urlValue = escapeHtml(
    initialImage.display_url || initialImage.proxy_url || initialImage.url || ""
  );
  const altValue = escapeHtml(initialImage.alt || "");
  const captionValue = escapeHtml(initialImage.caption || "");
  const fileInputId = `${rowId}-image-file`;
  const fileTriggerId = `${rowId}-image-trigger`;
  const fileNameId = `${rowId}-image-name`;

  const row = document.createElement("div");
  row.className = "article-gallery-form-row";
  row.dataset.rowId = rowId;
  if (initialImage.storage_key) {
    row.dataset.storageKey = String(initialImage.storage_key).trim();
  }
  if (initialImage.filename) {
    row.dataset.filename = String(initialImage.filename).trim();
  }
  if (initialImage.mime_type) {
    row.dataset.mimeType = String(initialImage.mime_type).trim();
  }
  if (initialImage.file_size != null) {
    row.dataset.fileSize = String(initialImage.file_size);
  }
  row.innerHTML = `
    <div class="form-field">
      <label for="${rowId}-url">Image URL</label>
      <input
        type="url"
        id="${rowId}-url"
        name="article-image-url"
        placeholder="https://images.example.com/gallery.jpg"
        value="${urlValue}"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-alt">Alt text</label>
      <input
        type="text"
        id="${rowId}-alt"
        name="article-image-alt"
        placeholder="Describe the image"
        value="${altValue}"
        maxlength="140"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-caption">Caption</label>
      <input
        type="text"
        id="${rowId}-caption"
        name="article-image-caption"
        placeholder="Optional caption"
        value="${captionValue}"
        maxlength="160"
      />
    </div>
    <div class="form-field article-media-picker">
      <input
        type="file"
        id="${fileInputId}"
        class="file-picker__input"
        accept=".png,.jpg,.jpeg,.gif,.webp"
      />
      <label
        for="${fileInputId}"
        id="${fileTriggerId}"
        class="file-picker__trigger"
        role="button"
        tabindex="0"
      ></label>
      <span id="${fileNameId}" class="file-picker__filename"></span>
      <div class="article-upload-status article-image-upload-status" hidden></div>
    </div>
    <button
      type="button"
      class="icon-button icon-button-danger"
      data-action="remove-article-image"
      aria-label="Remove image"
    >Remove</button>
  `;

  list.appendChild(row);
  initializeArticleImageRow(row, {
    fileInputId,
    fileTriggerId,
    fileNameId,
  });

  if (options.focus) {
    row.querySelector('input[name="article-image-url"]')?.focus();
  }
  return row;
}

function collectArticleGalleryImages() {
  const list = document.getElementById("dashboard-article-gallery-list");
  if (!list) return [];
  const images = [];
  list.querySelectorAll(".article-gallery-form-row").forEach((row, index) => {
    const urlInput = row.querySelector('input[name="article-image-url"]');
    const altInput = row.querySelector('input[name="article-image-alt"]');
    const captionInput = row.querySelector(
      'input[name="article-image-caption"]'
    );
    const url = urlInput?.value?.trim();
    const storageKey = (row.dataset.storageKey || "").trim();
    if (!url && !storageKey) return;
    const fileSizeRaw = Number(row.dataset.fileSize);
    images.push({
      id: row.dataset.rowId || generateArticleImageId(),
      url: url || null,
      alt: altInput?.value?.trim() || null,
      caption: captionInput?.value?.trim() || null,
      position: index,
      storage_key: storageKey ? storageKey : null,
      filename: (row.dataset.filename || "").trim() || null,
      mime_type: (row.dataset.mimeType || "").trim() || null,
      file_size:
        Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null,
    });
  });
  return images;
}

function clearArticleAudioRows() {
  const list = document.getElementById("dashboard-article-audio-list");
  if (!list) return;
  list.innerHTML = "";
}

function setArticleAudioRows(tracks = []) {
  clearArticleAudioRows();
  const list = document.getElementById("dashboard-article-audio-list");
  if (!list) return;
  if (tracks.length) {
    tracks.forEach((track) => addArticleAudioRow(track));
  }
  ensureArticleAudioRowExists();
}

function ensureArticleAudioRowExists() {
  const list = document.getElementById("dashboard-article-audio-list");
  if (!list) return;
  if (!list.querySelector(".article-audio-form-row")) {
    addArticleAudioRow();
  }
}

function initializeArticleAudioRow(row, ids = {}) {
  if (!row) return;
  const { fileInputId, fileTriggerId, fileNameId, previewId } = ids;
  if (!fileInputId || !fileTriggerId || !fileNameId || !previewId) return;
  const fileInput = document.getElementById(fileInputId);
  const statusEl = row.querySelector(".article-audio-upload-status");
  const previewEl = document.getElementById(previewId);
  const urlInput = row.querySelector('input[name="article-audio-url"]');
  const downloadLink = row.querySelector(".article-audio-download");
  let statusTimeoutId = null;
  const picker = setupFilePicker({
    inputId: fileInputId,
    triggerId: fileTriggerId,
    filenameId: fileNameId,
    labels: {
      button: "Upload audio",
      placeholder: "No audio selected",
      icon: "🎧",
      variant: "audio",
    },
  });
  articleAudioPickerResets.set(row, picker.reset);

  const applyPreview = (nextUrl) => {
    if (!previewEl) return;
    const safeUrl = nextUrl ? resolveAssetUrl(nextUrl) : "";
    if (safeUrl) {
      previewEl.src = safeUrl;
      previewEl.classList.remove("hidden");
      previewEl.load();
    } else {
      try {
        previewEl.pause();
      } catch (error) {
        // ignore pause errors on detached audio elements
      }
      previewEl.removeAttribute("src");
      previewEl.load();
      previewEl.classList.add("hidden");
    }
  };

  const applyDownloadLink = (nextUrl) => {
    if (!downloadLink) return;
    const safeUrl = nextUrl ? resolveAssetUrl(nextUrl) : "";
    if (safeUrl) {
      downloadLink.href = safeUrl;
      downloadLink.classList.remove("hidden");
    } else {
      downloadLink.removeAttribute("href");
      downloadLink.classList.add("hidden");
    }
  };

  const initialUrl = urlInput?.value?.trim() || "";
  applyPreview(initialUrl);
  applyDownloadLink(row.dataset.downloadUrl || "");

  if (urlInput && urlInput.dataset.audioPreviewBound !== "true") {
    urlInput.addEventListener("input", () => {
      const value = urlInput.value.trim();
      applyPreview(value);
      if (value) {
        row.dataset.downloadUrl = value;
      } else {
        delete row.dataset.downloadUrl;
      }
      applyDownloadLink(row.dataset.downloadUrl || "");
    });
    urlInput.dataset.audioPreviewBound = "true";
  }

  if (!fileInput || fileInput.dataset.audioBound === "true") {
    return;
  }

  fileInput.dataset.audioBound = "true";
  fileInput.addEventListener("change", async () => {
    if (statusTimeoutId) {
      window.clearTimeout(statusTimeoutId);
      statusTimeoutId = null;
    }
    const file = fileInput.files?.[0];
    if (!file) {
      row.dataset.uploading = "false";
      statusEl?.setAttribute("hidden", "");
      picker.reset();
      return;
    }

    row.dataset.uploading = "true";
    adjustArticleAudioUploadCount(1);
    picker.setFilename(
      formatFileSummary(file.name, file.size, { action: "uploading" }),
      { status: "uploading" }
    );
    if (statusEl) {
      statusEl.textContent = formatFileSummary(file.name, file.size, {
        action: "uploading",
      });
      statusEl.removeAttribute("hidden");
    }

    try {
      const track = await uploadArticleAudio(file);
      if (track) {
        const titleInput = row.querySelector(
          'input[name="article-audio-title"]'
        );
        const urlInput = row.querySelector('input[name="article-audio-url"]');
        if (titleInput && !titleInput.value) {
          titleInput.value = track.title || file.name.replace(/\.[^/.]+$/, "");
        }
        if (urlInput) {
          urlInput.value = track.url;
        }
        row.dataset.filename = track.filename || "";
        row.dataset.mimeType = track.mime_type || "";
        row.dataset.fileSize =
          track.file_size != null ? String(track.file_size) : "";
        row.dataset.downloadUrl = track.download_url || track.url || "";
        if (track.storage_key) {
          row.dataset.storageKey = track.storage_key;
        } else {
          delete row.dataset.storageKey;
        }
        if (track.duration_seconds != null) {
          row.dataset.durationSeconds = String(track.duration_seconds);
        } else {
          delete row.dataset.durationSeconds;
        }
        applyPreview(track.url || "");
        applyDownloadLink(row.dataset.downloadUrl || "");
        picker.reset({
          displayText: formatFileSummary(file.name, file.size, {
            action: "uploaded",
          }),
          status: "uploaded",
        });
        if (statusEl) {
          statusEl.textContent = formatFileSummary(file.name, file.size, {
            action: "uploaded",
          });
          statusTimeoutId = window.setTimeout(() => {
            statusEl.setAttribute("hidden", "");
            statusEl.textContent = "";
            statusTimeoutId = null;
          }, 4000);
        }
        showNotification(
          `Audio "${escapeHtml(track.title || file.name)}" uploaded`,
          "success",
          "Audio ready"
        );
      }
    } catch (error) {
      picker.reset({
        displayText: formatFileSummary(file.name, file.size, {
          action: "error",
        }),
        status: "error",
      });
      if (statusEl) {
        const message = error?.message || "Audio upload failed.";
        statusEl.textContent = message;
        statusEl.removeAttribute("hidden");
        statusTimeoutId = window.setTimeout(() => {
          statusEl.setAttribute("hidden", "");
          statusEl.textContent = "";
          statusTimeoutId = null;
        }, 6000);
      }
    } finally {
      row.dataset.uploading = "false";
      adjustArticleAudioUploadCount(-1);
      ensurePreferredDashboardViewMode();
    }
  });
}

function addArticleAudioRow(initialTrack = {}, options = {}) {
  const list = document.getElementById("dashboard-article-audio-list");
  if (!list) return null;
  const rowId = initialTrack.id || generateArticleAudioId();
  const titleValue = escapeHtml(initialTrack.title || "");
  const descriptionValue = escapeHtml(initialTrack.description || "");
  const urlValue = escapeHtml(initialTrack.url || "");
  const fileInputId = `${rowId}-audio-file`;
  const fileTriggerId = `${rowId}-audio-trigger`;
  const fileNameId = `${rowId}-audio-name`;
  const previewId = `${rowId}-audio-preview`;

  const row = document.createElement("div");
  row.className = "article-audio-form-row";
  row.dataset.rowId = rowId;
  if (initialTrack.filename) row.dataset.filename = initialTrack.filename;
  if (initialTrack.mime_type) row.dataset.mimeType = initialTrack.mime_type;
  if (initialTrack.file_size != null)
    row.dataset.fileSize = String(initialTrack.file_size);
  if (initialTrack.download_url)
    row.dataset.downloadUrl = initialTrack.download_url;
  if (initialTrack.duration_seconds != null)
    row.dataset.durationSeconds = String(initialTrack.duration_seconds);
  if (initialTrack.storage_key) {
    row.dataset.storageKey = initialTrack.storage_key;
  }

  const previewClass = initialTrack.url
    ? "article-audio-preview"
    : "article-audio-preview hidden";
  const previewSrc = initialTrack.url
    ? escapeHtml(resolveAssetUrl(initialTrack.url))
    : "";
  const previewSrcAttr = previewSrc ? ` src="${previewSrc}"` : "";
  const downloadHref = initialTrack.download_url
    ? escapeHtml(resolveAssetUrl(initialTrack.download_url))
    : "";
  const downloadClass = downloadHref
    ? "article-audio-download"
    : "article-audio-download hidden";
  const downloadHrefAttr = downloadHref ? ` href="${downloadHref}"` : "";
  const downloadMarkup = `<a class="${downloadClass}"${downloadHrefAttr} download>Download</a>`;

  row.innerHTML = `
    <div class="form-field">
      <label for="${rowId}-title">Audio title</label>
      <input
        type="text"
        id="${rowId}-title"
        name="article-audio-title"
        placeholder="Welcome narration"
        value="${titleValue}"
        maxlength="120"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-desc">Description</label>
      <input
        type="text"
        id="${rowId}-desc"
        name="article-audio-description"
        placeholder="Optional context"
        value="${descriptionValue}"
        maxlength="160"
      />
    </div>
    <div class="form-field">
      <label for="${rowId}-url">Audio URL</label>
      <input
        type="url"
        id="${rowId}-url"
        name="article-audio-url"
        placeholder="https://cdn.example.com/audio.mp3"
        value="${urlValue}"
      />
    </div>
    <div class="form-field article-media-picker">
      <input
        type="file"
        id="${fileInputId}"
        class="file-picker__input"
        accept="audio/*"
      />
      <label
        for="${fileInputId}"
        id="${fileTriggerId}"
        class="file-picker__trigger"
        role="button"
        tabindex="0"
      ></label>
      <span id="${fileNameId}" class="file-picker__filename"></span>
      <div class="article-upload-status article-audio-upload-status" hidden></div>
    </div>
    <div class="article-audio-preview-wrapper">
      <audio
        id="${previewId}"
        class="${previewClass}"
        controls
        preload="none"${previewSrcAttr}
      ></audio>
      ${downloadMarkup}
    </div>
    <button
      type="button"
      class="icon-button icon-button-danger"
      data-action="remove-article-audio"
      aria-label="Remove audio"
    >Remove</button>
  `;

  list.appendChild(row);
  initializeArticleAudioRow(row, {
    fileInputId,
    fileTriggerId,
    fileNameId,
    previewId,
  });

  if (options.focus) {
    row.querySelector('input[name="article-audio-title"]')?.focus();
  }

  return row;
}

function collectArticleAudioTracks() {
  const list = document.getElementById("dashboard-article-audio-list");
  if (!list) return [];
  const tracks = [];
  list.querySelectorAll(".article-audio-form-row").forEach((row) => {
    const titleInput = row.querySelector('input[name="article-audio-title"]');
    const descriptionInput = row.querySelector(
      'input[name="article-audio-description"]'
    );
    const urlInput = row.querySelector('input[name="article-audio-url"]');
    const url = urlInput?.value?.trim();
    if (!url) return;

    const fileSizeRaw = Number(row.dataset.fileSize);
    const durationRaw = Number(row.dataset.durationSeconds);
    tracks.push({
      id: row.dataset.rowId || generateArticleAudioId(),
      title: titleInput?.value?.trim() || null,
      description: descriptionInput?.value?.trim() || null,
      url,
      download_url: row.dataset.downloadUrl || url,
      filename: row.dataset.filename || null,
      mime_type: row.dataset.mimeType || null,
      file_size:
        Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null,
      duration_seconds:
        Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null,
      storage_key: row.dataset.storageKey || null,
    });
  });
  return tracks;
}

function bindArticleFormControls() {
  const addArticleBtn = document.getElementById("dashboard-article-add");
  const cancelButton = document.getElementById("dashboard-article-cancel");
  if (addArticleBtn && !addArticleBtn.dataset.bound) {
    addArticleBtn.dataset.mode = addArticleBtn.dataset.mode || "add";
    addArticleBtn.setAttribute("aria-pressed", "false");
    addArticleBtn.addEventListener("click", () => {
      const mode = addArticleBtn.dataset.mode || "add";
      if (mode === "back") {
        resetArticleForm();
        renderAdminArticles("dashboard-articles-list");
        return;
      }

      if (!guestArticleEditMode && dashboardViewMode === "guest") {
        setGuestArticleEditMode(true);
      }

      resetArticleForm();
      ensureArticleFormRowsInitialized();
      setArticleEditorSessionActive(true, { scroll: true, focus: true });
    });
    addArticleBtn.dataset.bound = "true";
  }

  if (cancelButton && !cancelButton.dataset.bound) {
    cancelButton.addEventListener("click", () => {
      if (dashboardViewMode === "guest" && guestArticleEditMode) {
        setGuestArticleEditMode(false);
      } else {
        resetArticleForm();
        setArticleEditorSessionActive(false);
      }
    });
    cancelButton.dataset.bound = "true";
  }

  const linkList = document.getElementById("dashboard-article-links-list");
  const addLinkBtn = document.getElementById("dashboard-article-add-link");
  if (linkList && !linkList.dataset.bound) {
    linkList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(
        '[data-action="remove-article-link"]'
      );
      if (!removeBtn) return;
      const row = removeBtn.closest(".article-link-form-row");
      row?.remove();
      ensureArticleLinkRowExists();
    });
    linkList.dataset.bound = "true";
  }
  if (addLinkBtn && !addLinkBtn.dataset.bound) {
    addLinkBtn.addEventListener("click", () =>
      addArticleLinkRow({}, { focus: true })
    );
    addLinkBtn.dataset.bound = "true";
  }

  const attachmentList = document.getElementById(
    "dashboard-article-attachments-list"
  );
  const addAttachmentBtn = document.getElementById(
    "dashboard-article-add-attachment"
  );
  if (attachmentList && !attachmentList.dataset.bound) {
    attachmentList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(
        '[data-action="remove-article-attachment"]'
      );
      if (!removeBtn) return;
      const row = removeBtn.closest(".article-attachment-form-row");
      const reset = articleAttachmentPickerResets.get(row);
      if (typeof reset === "function") {
        reset();
        articleAttachmentPickerResets.delete(row);
      }
      row?.remove();
      ensureArticleAttachmentRowExists();
    });
    attachmentList.dataset.bound = "true";
  }
  if (addAttachmentBtn && !addAttachmentBtn.dataset.bound) {
    addAttachmentBtn.addEventListener("click", () =>
      addArticleAttachmentRow({}, { focus: true })
    );
    addAttachmentBtn.dataset.bound = "true";
  }

  const galleryList = document.getElementById("dashboard-article-gallery-list");
  const addImageBtn = document.getElementById("dashboard-article-add-image");
  if (galleryList && !galleryList.dataset.bound) {
    galleryList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(
        '[data-action="remove-article-image"]'
      );
      if (!removeBtn) return;
      const row = removeBtn.closest(".article-gallery-form-row");
      const reset = articleGalleryPickerResets.get(row);
      if (typeof reset === "function") {
        reset();
        articleGalleryPickerResets.delete(row);
      }
      row?.remove();
      ensureArticleImageRowExists();
    });
    galleryList.dataset.bound = "true";
  }
  if (addImageBtn && !addImageBtn.dataset.bound) {
    addImageBtn.addEventListener("click", () =>
      addArticleImageRow({}, { focus: true })
    );
    addImageBtn.dataset.bound = "true";
  }

  const audioList = document.getElementById("dashboard-article-audio-list");
  const addAudioBtn = document.getElementById("dashboard-article-add-audio");
  if (audioList && !audioList.dataset.bound) {
    audioList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(
        '[data-action="remove-article-audio"]'
      );
      if (!removeBtn) return;
      const row = removeBtn.closest(".article-audio-form-row");
      const reset = articleAudioPickerResets.get(row);
      if (typeof reset === "function") {
        reset();
        articleAudioPickerResets.delete(row);
      }
      row?.remove();
      ensureArticleAudioRowExists();
    });
    audioList.dataset.bound = "true";
  }
  if (addAudioBtn && !addAudioBtn.dataset.bound) {
    addAudioBtn.addEventListener("click", () =>
      addArticleAudioRow({}, { focus: true })
    );
    addAudioBtn.dataset.bound = "true";
  }

  initializeArticleHeroImageControl();

  const openAdminBtn = document.getElementById("guest-articles-open-admin");
  if (openAdminBtn && !openAdminBtn.dataset.bound) {
    openAdminBtn.addEventListener("click", (event) => {
      event.preventDefault();
      setDashboardViewMode("admin", {
        showAdminSections: true,
        persistPreference: true,
        unlockGuestPreview: true,
      });
    });
    openAdminBtn.dataset.bound = "true";
  }

  const form = document.getElementById("dashboard-article-form");
  if (form && !form.dataset.submitBound) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitDashboardArticleForm(form);
    });
    form.dataset.submitBound = "true";
  }
}

function ensureArticleFormRowsInitialized() {
  ensureArticleLinkRowExists();
  ensureArticleAttachmentRowExists();
  ensureArticleImageRowExists();
  ensureArticleAudioRowExists();
}

function bindGuestArticleManagementControls() {
  const editToggle = document.getElementById("guest-article-edit-toggle");
  if (editToggle && !editToggle.dataset.bound) {
    editToggle.addEventListener("click", () => {
      if (!CAN_MANAGE_ARTICLES || dashboardViewMode !== "guest") return;
      setGuestArticleEditMode(!guestArticleEditMode);
    });
    editToggle.dataset.bound = "true";
  }

  const saveButton = document.getElementById("guest-article-save-button");
  if (saveButton && !saveButton.dataset.bound) {
    saveButton.addEventListener("click", async () => {
      if (saveButton.dataset.busy === "true") return;
      if (!CAN_MANAGE_ARTICLES || dashboardViewMode !== "guest") return;
      if (!guestArticleEditMode && !hasPendingChangesFor("articles")) {
        setGuestArticleEditMode(true);
      }

      const form = document.getElementById("dashboard-article-form");
      let staged = true;
      if (form && !form.classList.contains("hidden")) {
        staged = await submitDashboardArticleForm(form);
      }

      if (staged !== false) {
        const originalLabel = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.dataset.busy = "true";
        saveButton.textContent = "Saving…";
        try {
          await saveDashboardState();
        } finally {
          delete saveButton.dataset.busy;
          saveButton.textContent = originalLabel;
          saveButton.disabled = false;
        }
      }
    });
    saveButton.dataset.bound = "true";
  }
}

function findArticleById(articleId) {
  if (!articleId) return null;
  return DASHBOARD_ARTICLES.find((article) => article.id === articleId) || null;
}

function setArticleEditorSessionActive(active, options = {}) {
  const isActive = !!active;
  const editor = document.getElementById("guest-article-editor");
  const form = document.getElementById("dashboard-article-form");
  const addButton = document.getElementById("dashboard-article-add");

  if (form) {
    if (isActive) {
      form.classList.remove("hidden");
      form.dataset.articleEditorActive = "true";
    } else {
      if (dashboardViewMode === "admin") {
        form.classList.add("hidden");
      }
      delete form.dataset.articleEditorActive;
    }
  }

  if (editor) {
    editor.classList.toggle("guest-article-editor--editing", isActive);
    if (dashboardViewMode === "admin") {
      editor.classList.toggle("hidden", !isActive);
    }
  }

  if (addButton) {
    addButton.textContent = isActive
      ? "Back to article list"
      : "Add new article";
    addButton.dataset.mode = isActive ? "back" : "add";
    addButton.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  if (isActive && form) {
    const shouldScroll =
      typeof options.scroll === "boolean" ? options.scroll : true;
    const shouldFocus =
      typeof options.focus === "boolean" ? options.focus : true;
    const focusSelector =
      typeof options.focusSelector === "string"
        ? options.focusSelector
        : "#dashboard-article-title";

    if (shouldScroll) {
      const behavior =
        typeof options.scrollBehavior === "string"
          ? options.scrollBehavior
          : "smooth";
      form.scrollIntoView({ behavior, block: "start" });
    }

    if (shouldFocus) {
      const focusTarget = form.querySelector(focusSelector);
      focusTarget?.focus();
    }
  }
}

function populateArticleForm(article, options = {}) {
  const form = document.getElementById("dashboard-article-form");
  if (!form || !article) return;
  form.dataset.editingId = article.id;
  const titleInput = form.querySelector("#dashboard-article-title");
  const descriptionInput = form.querySelector("#dashboard-article-summary");
  const authorsInput = form.querySelector("#dashboard-article-authors");
  const imageInput = form.querySelector("#dashboard-article-image");
  if (titleInput) titleInput.value = article.title || "";
  if (descriptionInput) descriptionInput.value = article.description || "";
  if (authorsInput) authorsInput.value = (article.authors || []).join(", ");
  if (imageInput) {
    imageInput.value =
      article.image_url || article.image_proxy_url || article.image_src || "";
    applyHeroImageMetadata(imageInput, article);
  }
  if (typeof articleHeroImagePickerReset === "function") {
    articleHeroImagePickerReset();
  }
  hideHeroImageStatus();
  setArticleLinkRows(article.links || []);
  setArticleAttachmentRows(article.attachments || []);
  setArticleImageRows(article.gallery_images || []);
  setArticleAudioRows(article.audio_tracks || []);
  ensureArticleFormRowsInitialized();
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Update article";
  setArticleEditorSessionActive(true, options);
}

function resetArticleForm() {
  const form = document.getElementById("dashboard-article-form");
  if (!form) return;
  form.reset();
  delete form.dataset.editingId;
  const imageInput = form.querySelector("#dashboard-article-image");
  if (imageInput) {
    clearHeroImageMetadata(imageInput);
  }
  if (typeof articleHeroImagePickerReset === "function") {
    articleHeroImagePickerReset();
  }
  hideHeroImageStatus();
  clearArticleLinkRows();
  clearArticleAttachmentRows();
  clearArticleImageRows();
  clearArticleAudioRows();
  ensureArticleFormRowsInitialized();
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Publish article";
  setArticleEditorSessionActive(false);
}

function prepareArticleFormForNextEntry(options = {}) {
  const form = document.getElementById("dashboard-article-form");
  if (!form) return;
  form.reset();
  delete form.dataset.editingId;

  const imageInput = form.querySelector("#dashboard-article-image");
  if (imageInput) {
    clearHeroImageMetadata(imageInput);
  }
  if (typeof articleHeroImagePickerReset === "function") {
    articleHeroImagePickerReset();
  }
  hideHeroImageStatus();
  clearArticleLinkRows();
  clearArticleAttachmentRows();
  clearArticleImageRows();
  clearArticleAudioRows();
  ensureArticleFormRowsInitialized();

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Publish article";

  setArticleEditorSessionActive(true, {
    scroll: options.scroll ?? false,
    focus: options.focus ?? true,
    focusSelector: options.focusSelector || "#dashboard-article-title",
  });
}

function collectArticleFormData(form) {
  if (!form) return null;
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const authorsRaw = String(formData.get("authors") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const imageInput = form.querySelector("#dashboard-article-image");
  const imageStorageKey = (imageInput?.dataset.storageKey || "").trim();
  const imageFilename = (imageInput?.dataset.filename || "").trim();
  const imageMimeType = (imageInput?.dataset.mimeType || "").trim();
  const imageFileSizeRaw = Number(imageInput?.dataset.fileSize);
  const imageFileSize =
    Number.isFinite(imageFileSizeRaw) && imageFileSizeRaw >= 0
      ? imageFileSizeRaw
      : null;
  const authors = authorsRaw
    ? authorsRaw
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];
  const links = collectArticleLinks();
  const attachments = collectArticleAttachments();
  const galleryImages = collectArticleGalleryImages();
  const audioTracks = collectArticleAudioTracks();
  if (!title) {
    return null;
  }
  return {
    title,
    description,
    authors,
    image_url: imageUrl || null,
    image_storage_key: imageStorageKey ? imageStorageKey : null,
    image_filename: imageFilename ? imageFilename : null,
    image_mime_type: imageMimeType ? imageMimeType : null,
    image_file_size: imageFileSize,
    links,
    attachments,
    gallery_images: galleryImages,
    audio_tracks: audioTracks,
  };
}

async function submitDashboardArticleForm(form) {
  if (areArticleAttachmentsUploading()) {
    showNotification(
      "Wait for uploads to finish before publishing.",
      "info",
      "Upload in progress"
    );
    return false;
  }

  const payload = collectArticleFormData(form);
  if (!payload) {
    showNotification("Add a title before publishing.", "warning");
    return false;
  }

  const editingId = form.dataset.editingId;
  const clientId = editingId || generateUniqueId("draft-article");
  const normalized = normalizeDashboardArticle({
    id: clientId,
    ...payload,
    updated_at: new Date().toISOString(),
  });
  if (!normalized) {
    showNotification("Unable to stage this article.", "error");
    return false;
  }

  const articleStore = getPendingChangeStore("articles");
  const existingOperation = articleStore?.get(clientId);
  const operationType =
    existingOperation?.action === "create"
      ? "create"
      : editingId
      ? "update"
      : "create";

  normalized.pendingAction = operationType;

  const index = DASHBOARD_ARTICLES.findIndex(
    (article) => article.id === clientId
  );
  if (index >= 0) {
    DASHBOARD_ARTICLES[index] = normalized;
  } else {
    DASHBOARD_ARTICLES.unshift(normalized);
  }

  renderAdminArticles("dashboard-articles-list");
  renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
  const stayInGuestEditor =
    guestArticleEditMode && dashboardViewMode === "guest";
  if (stayInGuestEditor) {
    if (operationType === "create") {
      prepareArticleFormForNextEntry({ focus: true, scroll: false });
    } else {
      populateArticleForm(normalized, { scroll: false, focus: false });
    }
  } else {
    resetArticleForm();
  }
  stageDashboardChange("articles", clientId, operationType, payload);
  showNotification(
    operationType === "update"
      ? "Article update queued. Click Save changes to publish."
      : "Article queued. Click Save changes to publish.",
    "info",
    operationType === "update" ? "Pending update" : "Pending article"
  );
  ensurePreferredDashboardViewMode();
  return true;
}

async function removeArticle(articleId) {
  if (!articleId) return;

  const index = DASHBOARD_ARTICLES.findIndex(
    (article) => article.id === articleId
  );
  if (index >= 0) {
    DASHBOARD_ARTICLES.splice(index, 1);
    renderAdminArticles("dashboard-articles-list");
    renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
  }
  const form = document.getElementById("dashboard-article-form");
  if (form?.dataset.editingId === articleId) {
    if (guestArticleEditMode && dashboardViewMode === "guest") {
      prepareArticleFormForNextEntry({ focus: true, scroll: false });
    } else {
      resetArticleForm();
    }
  }
  stageDashboardChange("articles", articleId, "delete");
  showNotification(
    "Article removal queued. Click Save changes to apply.",
    "info",
    "Pending removal"
  );
}

async function handleDashboardArticleAction(event) {
  if (!CAN_MANAGE_ARTICLES) return;
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const articleId = target.dataset.id;
  if (!articleId) return;
  if (target.dataset.action === "edit-article") {
    const article = findArticleById(articleId);
    if (!article) return;

    if (dashboardViewMode === "guest") {
      if (!guestArticleEditMode) {
        setGuestArticleEditMode(true);
      }
    } else {
      setGuestArticleEditMode(false);
      setGuestPodcastEditMode(false);
      setDashboardViewMode("admin", {
        showAdminSections: true,
        showAdminArticles: true,
        persistPreference: false,
        keepSidebar: true,
        force: true,
      });
      setDashboardEditMode(true);
    }

    populateArticleForm(article, { scroll: true, focus: true });
  } else if (target.dataset.action === "notify-article") {
    await sendArticleNotification(articleId, target);
  } else if (target.dataset.action === "delete-article") {
    await removeArticle(articleId);
  }
}

function isPodcastAudioUploading() {
  return activePodcastAudioUploads > 0;
}

function adjustPodcastAudioUploadCount(delta) {
  if (typeof delta !== "number" || Number.isNaN(delta)) return;
  activePodcastAudioUploads = Math.max(0, activePodcastAudioUploads + delta);
  refreshPodcastUploadBusyState();
}

function refreshPodcastUploadBusyState() {
  setPodcastFormBusy(isPodcastAudioUploading());
}

function setPodcastFormBusy(busy) {
  const form = document.getElementById("dashboard-podcast-form");
  if (!form) return;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    if (!submitButton.dataset.busyLabel) {
      submitButton.dataset.busyLabel = submitButton.textContent || "";
    }
    if (busy) {
      submitButton.disabled = true;
      submitButton.classList.add("is-busy");
      submitButton.setAttribute("aria-busy", "true");
      submitButton.textContent = "Saving…";
    } else {
      submitButton.disabled = false;
      submitButton.classList.remove("is-busy");
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent =
        submitButton.dataset.busyLabel || "Publish podcast";
      delete submitButton.dataset.busyLabel;
    }
  }
  form.dataset.uploading = busy ? "true" : "false";
}

function setPodcastAudioStatus(message, options = {}) {
  const statusEl = document.getElementById("dashboard-podcast-audio-status");
  if (!statusEl) return;
  const safeMessage = message ? String(message).trim() : "";
  if (!safeMessage) {
    statusEl.textContent = "";
    statusEl.setAttribute("hidden", "");
    delete statusEl.dataset.status;
    return;
  }
  statusEl.textContent = safeMessage;
  statusEl.removeAttribute("hidden");
  if (options.status) {
    statusEl.dataset.status = options.status;
  } else {
    delete statusEl.dataset.status;
  }
}

function updatePodcastAudioPreview() {
  const preview = document.getElementById("dashboard-podcast-audio-preview");
  if (!preview) return;
  const urlInput = document.getElementById("dashboard-podcast-audio-url");
  const candidateUrl =
    selectPreferredAssetUrl(podcastAudioData, { mode: "stream" }) ||
    podcastAudioData?.playback_url ||
    podcastAudioData?.stream_url ||
    podcastAudioData?.url ||
    String(urlInput?.value || "").trim();
  const resolvedCandidate = candidateUrl ? resolveAssetUrl(candidateUrl) : "";
  if (resolvedCandidate) {
    preview.src = resolvedCandidate;
    preview.classList.remove("hidden");
  } else {
    preview.pause?.();
    preview.removeAttribute("src");
    preview.classList.add("hidden");
  }
}

function setPodcastAudioData(data, options = {}) {
  podcastAudioData = data ? { ...data } : null;
  const form = document.getElementById("dashboard-podcast-form");
  if (form) {
    if (podcastAudioData) {
      form.dataset.podcastAudio = JSON.stringify(podcastAudioData);
    } else {
      delete form.dataset.podcastAudio;
    }
  }

  if (!options.skipUrlUpdate) {
    const urlInput = document.getElementById("dashboard-podcast-audio-url");
    if (urlInput) {
      const preferredUrl =
        selectPreferredAssetUrl(podcastAudioData, { mode: "stream" }) ||
        podcastAudioData?.playback_url ||
        podcastAudioData?.stream_url ||
        podcastAudioData?.url ||
        "";
      urlInput.value = preferredUrl;
    }
  }

  if (podcastAudioPicker) {
    if (podcastAudioData?.filename) {
      podcastAudioPicker.setFilename(
        formatFileSummary(
          podcastAudioData.filename,
          podcastAudioData.file_size,
          { action: "uploaded" }
        ),
        { status: "uploaded" }
      );
    } else if (typeof podcastAudioPickerReset === "function") {
      podcastAudioPickerReset();
    }
  }

  updatePodcastAudioPreview();
}

function findPodcastById(podcastId) {
  if (!podcastId) return null;
  return DASHBOARD_PODCASTS.find((podcast) => podcast.id === podcastId) || null;
}

function populatePodcastForm(podcast, options = {}) {
  const form = document.getElementById("dashboard-podcast-form");
  if (!form || !podcast) return;
  form.dataset.editingId = podcast.id;
  const editor = document.getElementById("guest-podcast-editor");
  if (editor && dashboardViewMode === "admin") {
    editor.classList.remove("hidden");
  }
  const titleInput = document.getElementById("dashboard-podcast-title");
  const descriptionInput = document.getElementById(
    "dashboard-podcast-description"
  );
  const urlInput = document.getElementById("dashboard-podcast-audio-url");
  if (titleInput) titleInput.value = podcast.title || "";
  if (descriptionInput) descriptionInput.value = podcast.description || "";
  if (urlInput) {
    const preferredUrl =
      selectPreferredAssetUrl(podcast.audio, { mode: "stream" }) ||
      podcast.audio?.playback_url ||
      podcast.audio?.stream_url ||
      podcast.audio?.url ||
      "";
    urlInput.value = preferredUrl;
  }
  setPodcastAudioData(podcast.audio || null, { skipUrlUpdate: true });
  setPodcastAudioStatus("", { status: null });
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Update podcast";
  form.classList.remove("hidden");
  const shouldScroll =
    typeof options.scroll === "boolean" ? options.scroll : true;
  const shouldFocus = typeof options.focus === "boolean" ? options.focus : true;
  if (shouldScroll) {
    const behavior =
      typeof options.scrollBehavior === "string"
        ? options.scrollBehavior
        : "smooth";
    form.scrollIntoView({ behavior, block: "start" });
  }
  if (shouldFocus) {
    titleInput?.focus();
  }
}

function resetPodcastForm() {
  const form = document.getElementById("dashboard-podcast-form");
  if (!form) return;
  form.reset();
  delete form.dataset.editingId;
  delete form.dataset.podcastAudio;
  setPodcastAudioStatus("", { status: null });
  setPodcastAudioData(null, { skipUrlUpdate: true });
  if (typeof podcastAudioPickerReset === "function") {
    podcastAudioPickerReset();
  }
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Publish podcast";
  if (dashboardViewMode === "admin") {
    form.classList.add("hidden");
    const editor = document.getElementById("guest-podcast-editor");
    editor?.classList.add("hidden");
  }
}

function ensurePodcastFormReady() {
  updatePodcastAudioPreview();
}

function collectPodcastFormData(form) {
  if (!form) return null;
  const formData = new FormData(form);
  const title = String(formData.get("podcast_title") || "").trim();
  const description = String(formData.get("podcast_description") || "").trim();
  const audioUrl = String(formData.get("podcast_audio_url") || "").trim();
  if (!title) {
    return null;
  }

  let audioDetails = podcastAudioData ? { ...podcastAudioData } : null;
  if (!audioDetails && audioUrl) {
    audioDetails = {
      url: audioUrl,
      download_url: audioUrl,
      title,
      description,
    };
  }

  if (audioDetails) {
    const preferredStream =
      selectPreferredAssetUrl(audioDetails, { mode: "stream" }) ||
      audioDetails.playback_url ||
      audioDetails.stream_url ||
      audioDetails.url ||
      audioUrl;
    const preferredDownload =
      selectPreferredAssetUrl(audioDetails, { mode: "download" }) ||
      audioDetails.effective_download_url ||
      audioDetails.download_proxy_url ||
      audioDetails.download_url ||
      preferredStream;

    if (!preferredStream) {
      audioDetails = null;
    } else {
      audioDetails.url = preferredStream;
      if (!audioDetails.stream_url) {
        audioDetails.stream_url = preferredStream;
      }
      if (!audioDetails.playback_url) {
        audioDetails.playback_url = preferredStream;
      }
      if (!audioDetails.download_url) {
        audioDetails.download_url = preferredDownload;
      }
      if (!audioDetails.effective_download_url) {
        audioDetails.effective_download_url = preferredDownload;
      }
      if (!audioDetails.title) {
        audioDetails.title = title;
      }
      if (!audioDetails.description && description) {
        audioDetails.description = description;
      }
    }
  }

  if (!audioDetails) {
    return null;
  }

  const normalizedAudio = normalizeArticleAudioTrack(audioDetails);
  if (!normalizedAudio) {
    return null;
  }

  return {
    title,
    description,
    audio: normalizedAudio,
  };
}

async function submitDashboardPodcastForm(form) {
  if (!form) return false;
  if (isPodcastAudioUploading()) {
    showNotification(
      "Wait for the audio upload to finish before publishing.",
      "info"
    );
    return false;
  }

  const payload = collectPodcastFormData(form);
  if (!payload) {
    showNotification(
      "Add a title and audio file or link before publishing.",
      "warning"
    );
    return false;
  }

  const editingId = form.dataset.editingId;
  setPodcastFormBusy(true);
  try {
    const clientId = editingId || generateUniqueId("draft-podcast");
    const normalized = normalizeDashboardPodcast({
      id: clientId,
      ...payload,
      updated_at: new Date().toISOString(),
    });
    if (!normalized) {
      showNotification("Unable to stage this podcast entry.", "error");
      return false;
    }

    const podcastStore = getPendingChangeStore("podcasts");
    const existingOperation = podcastStore?.get(clientId);
    const operationType =
      existingOperation?.action === "create"
        ? "create"
        : editingId
        ? "update"
        : "create";

    normalized.pendingAction = operationType;

    const index = DASHBOARD_PODCASTS.findIndex(
      (podcast) => podcast.id === clientId
    );
    if (index >= 0) {
      DASHBOARD_PODCASTS[index] = normalized;
    } else {
      DASHBOARD_PODCASTS.unshift(normalized);
    }

    renderAdminPodcasts("dashboard-podcasts-list");
    renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
    resetPodcastForm();
    stageDashboardChange("podcasts", clientId, operationType, payload);
    showNotification(
      operationType === "update"
        ? "Podcast update queued. Click Save changes to publish."
        : "Podcast queued. Click Save changes to publish.",
      "info",
      operationType === "update" ? "Pending update" : "Pending podcast"
    );
    return true;
  } finally {
    setPodcastFormBusy(false);
  }
}

function removePodcast(podcastId) {
  if (!podcastId) return;

  const index = DASHBOARD_PODCASTS.findIndex(
    (podcast) => podcast.id === podcastId
  );
  if (index >= 0) {
    DASHBOARD_PODCASTS.splice(index, 1);
    renderAdminPodcasts("dashboard-podcasts-list");
    renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
  }
  const form = document.getElementById("dashboard-podcast-form");
  if (form?.dataset.editingId === podcastId) {
    resetPodcastForm();
  }
  stageDashboardChange("podcasts", podcastId, "delete");
  showNotification(
    "Podcast removal queued. Click Save changes to apply.",
    "info",
    "Pending removal"
  );
}

async function handleDashboardPodcastAction(event) {
  if (!CAN_MANAGE_ARTICLES) return;
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const podcastId = target.dataset.id;
  if (!podcastId) return;
  if (target.dataset.action === "edit-podcast") {
    const podcast = findPodcastById(podcastId);
    if (!podcast) return;

    if (dashboardViewMode === "guest") {
      if (!guestPodcastEditMode) {
        setGuestPodcastEditMode(true);
      }
    } else {
      setGuestArticleEditMode(false);
      setGuestPodcastEditMode(false);
      setDashboardViewMode("admin", {
        showAdminSections: true,
        persistPreference: false,
        keepSidebar: true,
        force: true,
      });
      setDashboardEditMode(true);
    }

    populatePodcastForm(podcast, { scroll: true, focus: true });
  } else if (target.dataset.action === "notify-podcast") {
    await sendPodcastNotification(podcastId, target);
  } else if (target.dataset.action === "delete-podcast") {
    await removePodcast(podcastId);
  }
}

function handlePodcastAudioUrlInput(event) {
  const url = String(event?.target?.value || "").trim();
  if (!url) {
    setPodcastAudioData(null, { skipUrlUpdate: true });
    setPodcastAudioStatus("", { status: null });
    return;
  }
  const nextAudio = {
    ...(podcastAudioData || {}),
    url,
  };
  if (!nextAudio.download_url) {
    nextAudio.download_url = url;
  }
  setPodcastAudioData(nextAudio, { skipUrlUpdate: true });
  setPodcastAudioStatus("", { status: null });
}

async function handlePodcastAudioFileSelection(event) {
  const input = event?.target;
  if (!input || !input.files?.length) {
    return;
  }
  const file = input.files[0];
  setPodcastAudioStatus(
    formatFileSummary(file.name, file.size, { action: "uploading" }),
    { status: "uploading" }
  );
  podcastAudioPicker?.setFilename(
    formatFileSummary(file.name, file.size, { action: "uploading" }),
    { status: "uploading" }
  );

  let counted = false;
  try {
    adjustPodcastAudioUploadCount(1);
    counted = true;
    const uploaded = await uploadPodcastAudio(file);
    const normalized = normalizeArticleAudioTrack(uploaded);
    setPodcastAudioData(normalized, { skipUrlUpdate: false });
    const summary = formatFileSummary(
      uploaded.filename || file.name,
      uploaded.file_size ?? file.size,
      { action: "uploaded" }
    );
    setPodcastAudioStatus(summary, { status: "success" });
    podcastAudioPicker?.setFilename(summary, { status: "uploaded" });
  } catch (error) {
    const message =
      error?.message && typeof error.message === "string"
        ? error.message
        : "Audio upload failed";
    setPodcastAudioStatus(message, { status: "error" });
    podcastAudioPicker?.setFilename(
      formatFileSummary(file.name, file.size, { action: "error" }),
      { status: "error" }
    );
    input.value = "";
    throw error;
  } finally {
    if (counted) {
      adjustPodcastAudioUploadCount(-1);
    }
  }
}

function bindPodcastFormControls() {
  const form = document.getElementById("dashboard-podcast-form");
  const addButton = document.getElementById("dashboard-podcast-add");
  const cancelButton = document.getElementById("dashboard-podcast-cancel");
  const audioUrlInput = document.getElementById("dashboard-podcast-audio-url");
  const audioFileInput = document.getElementById(
    "dashboard-podcast-audio-file"
  );

  if (addButton && !addButton.dataset.bound) {
    addButton.addEventListener("click", () => {
      if (dashboardViewMode === "guest") {
        if (!guestPodcastEditMode) {
          setGuestPodcastEditMode(true);
        }
      } else if (!dashboardEditMode) {
        setDashboardEditMode(true);
      }
      resetPodcastForm();
      form?.classList.remove("hidden");
      ensurePodcastFormReady();
      form?.scrollIntoView({ behavior: "smooth", block: "start" });
      form?.querySelector("#dashboard-podcast-title")?.focus();
    });
    addButton.dataset.bound = "true";
  }

  if (cancelButton && !cancelButton.dataset.bound) {
    cancelButton.addEventListener("click", () => {
      resetPodcastForm();
      form?.classList.add("hidden");
    });
    cancelButton.dataset.bound = "true";
  }

  if (form && !form.dataset.submitBound) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitDashboardPodcastForm(form);
    });
    form.dataset.submitBound = "true";
  }

  if (audioUrlInput && !audioUrlInput.dataset.bound) {
    audioUrlInput.addEventListener("input", handlePodcastAudioUrlInput);
    audioUrlInput.dataset.bound = "true";
  }

  if (!podcastAudioPicker) {
    podcastAudioPicker = setupFilePicker({
      inputId: "dashboard-podcast-audio-file",
      triggerId: "dashboard-podcast-audio-trigger",
      filenameId: "dashboard-podcast-audio-filename",
      labels: {
        button: "Upload audio from device",
        placeholder: "No audio selected",
        icon: "🎙️",
        variant: "audio",
      },
    });
    podcastAudioPickerReset = podcastAudioPicker.reset;
  }

  if (audioFileInput && !audioFileInput.dataset.bound) {
    audioFileInput.addEventListener("change", async (event) => {
      try {
        await handlePodcastAudioFileSelection(event);
      } catch (error) {
        // Error already surfaced via notifications
      }
    });
    audioFileInput.dataset.bound = "true";
  }
}

function renderAdminCodespaces(targetId, codespaces = PROJECT_CODESPACES) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.removeEventListener("click", handleDashboardCodespaceAction);
  container.addEventListener("click", handleDashboardCodespaceAction);

  if (!codespaces || !codespaces.length) {
    container.innerHTML =
      '<p class="placeholder">No Codespaces are currently provisioned.</p>';
    return;
  }

  const sorted = [...codespaces].sort((a, b) => {
    const aTime = new Date(a.updated_at || 0).getTime();
    const bTime = new Date(b.updated_at || 0).getTime();
    return bTime - aTime;
  });

  container.innerHTML = sorted
    .map((codespace) => {
      const updatedLabel = formatEventDateTime(codespace.updated_at, {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const statusClass = getStatusClass(codespace.status);
      const statusLabel = formatStatus(codespace.status);
      const pendingBadge = renderPendingBadge(codespace.pendingAction);
      const repoLine = codespace.repository
        ? `<div class="dashboard-codespace-repo">${escapeHtml(
            codespace.repository
          )}</div>`
        : "";
      const branchChip = codespace.branch
        ? `<span class="chip chip-muted">Branch: ${escapeHtml(
            codespace.branch
          )}</span>`
        : "";
      const regionChip = codespace.region
        ? `<span class="chip chip-muted">${escapeHtml(codespace.region)}</span>`
        : "";
      const chips = [branchChip, regionChip].filter(Boolean).join("\n");
      const chipsMarkup = chips
        ? `<div class="dashboard-codespace-meta">${chips}</div>`
        : "";
      const descriptionMarkup = codespace.description
        ? `<p class="dashboard-codespace-description">${escapeHtml(
            codespace.description
          )}</p>`
        : "";
      const repoLinkMarkup = codespace.repo_url
        ? `<a class="dashboard-codespace-link" href="${escapeHtml(
            codespace.repo_url
          )}" target="_blank" rel="noopener">GitHub repository</a>`
        : "";
      const urlMarkup = codespace.url
        ? `<a class="dashboard-codespace-link" href="${escapeHtml(
            codespace.url
          )}" target="_blank" rel="noopener">Open codespace</a>`
        : "";
      const updatedMarkup = codespace.updated_at
        ? `<time datetime="${escapeHtml(
            codespace.updated_at
          )}">Updated ${escapeHtml(updatedLabel)}</time>`
        : "";

      const editorMarkup = renderCodespaceEditor(codespace.editor);

      return `
        <article class="dashboard-codespace" data-id="${escapeHtml(
          codespace.id
        )}">
          <div class="dashboard-codespace-header">
            <div>
              <strong>${escapeHtml(codespace.project)}${
        pendingBadge ? ` ${pendingBadge}` : ""
      }</strong>
              ${repoLine}
            </div>
            <span class="status-badge status-${statusClass}">${escapeHtml(
        statusLabel
      )}</span>
          </div>
          ${descriptionMarkup}
          ${chipsMarkup}
          <div class="dashboard-codespace-footer">
            ${updatedMarkup}
            ${urlMarkup}
            ${repoLinkMarkup}
            ${editorMarkup}
            <div class="dashboard-codespace-actions">
              <button type="button" class="icon-button" data-action="edit-codespace" data-id="${escapeHtml(
                codespace.id
              )}">Edit</button>
              <button type="button" class="icon-button icon-button-danger" data-action="delete-codespace" data-id="${escapeHtml(
                codespace.id
              )}">Delete</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDashboardGuestMessage(message) {
  const container = document.getElementById("dashboard-guest-message");
  if (!container) return;
  if (!message) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  const { title, body, actions = [] } = message;
  const titleMarkup = title
    ? `<h3 class="dashboard-guest-message__title">${escapeHtml(title)}</h3>`
    : "";
  const bodyMarkup = body
    ? `<p class="dashboard-guest-message__body">${escapeHtml(body)}</p>`
    : "";
  const actionsMarkup =
    Array.isArray(actions) && actions.length
      ? `<div class="dashboard-guest-message__actions">${actions
          .map(({ href, label, variant = "primary" }) => {
            if (!href || !label) return "";
            const safeHref = escapeHtml(href);
            const safeLabel = escapeHtml(label);
            const className =
              variant === "secondary" ? "button-secondary" : "button-primary";
            return `<a class="${className}" href="${safeHref}">${safeLabel}</a>`;
          })
          .filter(Boolean)
          .join("")}</div>`
      : "";

  container.innerHTML = `${titleMarkup}${bodyMarkup}${actionsMarkup}`;
  container.classList.remove("hidden");
}

function setDashboardViewMode(mode, options = {}) {
  const {
    persistPreference = true,
    force = false,
    lockGuestPreview = false,
    unlockGuestPreview = false,
    skipUploadCheck = false,
  } = options;

  if (unlockGuestPreview) {
    dashboardGuestPreviewLocked = false;
    if (dashboardViewPreferenceSnapshot) {
      preferredDashboardViewMode = dashboardViewPreferenceSnapshot;
      dashboardViewPreferenceSnapshot = null;
    }
  }

  if (lockGuestPreview) {
    if (!dashboardGuestPreviewLocked) {
      dashboardGuestPreviewLocked = true;
      dashboardViewPreferenceSnapshot = preferredDashboardViewMode;
    }
    preferredDashboardViewMode = "guest";
  }

  if (
    !skipUploadCheck &&
    (activeArticleAttachmentUploads > 0 ||
      activeArticleImageUploads > 0 ||
      activeArticleAudioUploads > 0 ||
      activePodcastAudioUploads > 0)
  ) {
    return;
  }

  let nextMode = mode === "admin" ? "admin" : "guest";
  if (
    !force &&
    !persistPreference &&
    preferredDashboardViewMode === "guest" &&
    nextMode === "admin"
  ) {
    nextMode = "guest";
  }

  dashboardViewMode = nextMode;

  if (persistPreference) {
    dashboardGuestPreviewLocked = false;
    dashboardViewPreferenceSnapshot = null;
    setStoredDashboardViewMode(nextMode);
    preferredDashboardViewMode = nextMode;
  } else if (dashboardGuestPreviewLocked) {
    preferredDashboardViewMode = "guest";
  }
  document.body.dataset.dashboardViewMode = dashboardViewMode;
  const viewingAsGuest = dashboardViewMode === "guest";
  const showAdminSections =
    !viewingAsGuest && options.showAdminSections !== false;
  const keepSidebar = Boolean(options.keepSidebar);
  const showAdminArticles = Boolean(
    options.showAdminArticles && !viewingAsGuest
  );

  const layout = document.querySelector(".dashboard-layout");
  if (layout) {
    const shouldHaveSidebar = showAdminSections || keepSidebar;
    layout.classList.toggle("has-sidebar", shouldHaveSidebar);
    layout.classList.toggle("dashboard-layout--guest", viewingAsGuest);
  }

  const eventsPanel = document.getElementById("admin-events-panel");
  if (eventsPanel) {
    const shouldHideSidebar = !showAdminSections && !keepSidebar;
    eventsPanel.classList.toggle("hidden", shouldHideSidebar);
    eventsPanel.classList.toggle(
      "dashboard-sidebar--preview",
      !shouldHideSidebar && !showAdminSections
    );
  }

  const eventsSection = document.getElementById("dashboard-events-section");
  eventsSection?.classList.toggle("hidden", !showAdminSections);

  const adminColumns = document.getElementById("dashboard-admin-columns");
  adminColumns?.classList.toggle("hidden", !showAdminSections);

  const notesSection = document.getElementById("dashboard-notes-section");
  notesSection?.classList.toggle("hidden", !showAdminSections);

  const codespacesSection = document.getElementById(
    "dashboard-codespaces-section"
  );
  codespacesSection?.classList.toggle("hidden", !showAdminSections);

  const articlesSection = document.getElementById("dashboard-articles-section");
  if (articlesSection) {
    const shouldShowArticlesSection = showAdminArticles;
    articlesSection.classList.toggle("hidden", !shouldShowArticlesSection);
  }

  const guestArticleEditor = document.getElementById("guest-article-editor");
  const guestArticlesList = document.getElementById("guest-articles-list");
  const adminArticlesAnchor = document.getElementById(
    "dashboard-articles-admin-anchor"
  );

  if (guestArticleEditor && !guestArticleEditorHome) {
    guestArticleEditorHome = guestArticleEditor.parentElement;
  }

  if (guestArticleEditor && guestArticleEditorHome) {
    if (showAdminArticles && adminArticlesAnchor) {
      if (guestArticleEditor.parentElement !== adminArticlesAnchor) {
        adminArticlesAnchor.appendChild(guestArticleEditor);
      }
    } else if (guestArticleEditor.parentElement !== guestArticleEditorHome) {
      if (
        adminArticlesAnchor &&
        guestArticleEditor.parentElement === adminArticlesAnchor
      ) {
        adminArticlesAnchor.removeChild(guestArticleEditor);
      }
      if (
        guestArticlesList &&
        guestArticlesList.parentElement === guestArticleEditorHome
      ) {
        guestArticleEditorHome.insertBefore(
          guestArticleEditor,
          guestArticlesList
        );
      } else {
        guestArticleEditorHome.appendChild(guestArticleEditor);
      }
    }
  }

  const guestArticlesWrapper = document.getElementById(
    "guest-articles-wrapper"
  );
  if (guestArticlesWrapper) {
    guestArticlesWrapper.classList.toggle("hidden", !viewingAsGuest);
  }

  const guestPodcastsWrapper = document.getElementById(
    "guest-podcasts-wrapper"
  );
  if (guestPodcastsWrapper) {
    guestPodcastsWrapper.classList.toggle("hidden", !viewingAsGuest);
  }

  updateArticleEditorVisibility();
  updatePodcastEditorVisibility();

  if (CAN_MANAGE_ARTICLES) {
    if (showAdminSections) {
      renderAdminArticles("dashboard-articles-list");
      renderAdminPodcasts("dashboard-podcasts-list");
    } else if (viewingAsGuest) {
      renderAdminArticles("dashboard-articles-list");
      if (guestPodcastEditMode) {
        renderAdminPodcasts("dashboard-podcasts-list");
      }
    }
  }
  if (viewingAsGuest) {
    renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
  }

  const editToggle = document.getElementById("dashboard-edit-toggle");
  if (editToggle) {
    editToggle.classList.toggle("hidden", !showAdminSections);
    if (!showAdminSections) {
      editToggle.setAttribute("aria-pressed", "false");
    }
  }

  const viewHelper = document.getElementById("dashboard-view-helper");
  viewHelper?.classList.toggle("hidden", viewingAsGuest);

  const viewToggle = document.getElementById("dashboard-view-toggle");
  if (viewToggle) {
    const previewLabel = options.previewLabel || "View as guest";
    const returnLabel = options.returnLabel || "Return to admin view";
    viewToggle.textContent = viewingAsGuest ? returnLabel : previewLabel;
    viewToggle.setAttribute("aria-pressed", viewingAsGuest ? "true" : "false");
  }

  if (viewingAsGuest) {
    setDashboardEditMode(false);
  }

  updateDashboardSaveButtonVisibility();

  if (Object.prototype.hasOwnProperty.call(options, "message")) {
    renderDashboardGuestMessage(options.message);
  } else if (!viewingAsGuest) {
    renderDashboardGuestMessage(null);
  }

  renderGuestContentFeed();
}

function setDashboardEditMode(enabled) {
  const nextMode = !!enabled;
  dashboardEditMode = nextMode;
  document.body.dataset.dashboardEditMode = nextMode ? "true" : "false";
  const toggleBtn = document.getElementById("dashboard-edit-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = nextMode ? "Exit edit mode" : "Edit dashboard";
    toggleBtn.setAttribute("aria-pressed", nextMode ? "true" : "false");
  }
  updateDashboardSaveButtonVisibility();

  document.querySelectorAll(".dashboard-admin-form").forEach((form) => {
    if (nextMode) {
      form.classList.remove("hidden");
    } else {
      form.classList.add("hidden");
    }
  });

  const columns = document.getElementById("dashboard-admin-columns");
  columns?.classList.toggle("is-editing", nextMode);

  document
    .querySelectorAll(
      ".dashboard-note-actions, .dashboard-codespace-actions, .dashboard-article-actions, .dashboard-podcast-card__actions"
    )
    .forEach((actions) => {
      const isPodcastActions = actions.classList.contains(
        "dashboard-podcast-card__actions"
      );
      const shouldShow = nextMode
        ? true
        : isPodcastActions &&
          dashboardViewMode === "guest" &&
          guestPodcastEditMode &&
          CAN_MANAGE_ARTICLES;

      actions.classList.toggle("hidden", !shouldShow);
    });

  if (nextMode) {
    ensureNoteTaskRowExists();
    ensureArticleFormRowsInitialized();
    ensurePodcastFormReady();
    const focusTarget = document.querySelector(
      ".dashboard-admin-form:not(.hidden) input, .dashboard-admin-form:not(.hidden) textarea"
    );
    focusTarget?.focus();
  } else {
    resetNoteForm();
    resetCodespaceForm();
    resetArticleForm();
    resetPodcastForm();
  }

  updatePodcastEditorVisibility();
}

function setArticleFormButtonsBusy(busy) {
  const form = document.getElementById("dashboard-article-form");
  const submitButton = form?.querySelector('button[type="submit"]');
  const guestSaveButton = document.getElementById("guest-article-save-button");
  const targets = [submitButton, guestSaveButton].filter(Boolean);

  targets.forEach((btn) => {
    if (!btn.dataset.busyLabel) {
      btn.dataset.busyLabel = btn.textContent || btn.value || "";
    }
    if (busy) {
      btn.disabled = true;
      btn.classList.add("is-busy");
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Uploading…";
    } else {
      btn.disabled = false;
      btn.classList.remove("is-busy");
      btn.removeAttribute("aria-busy");
      btn.textContent = btn.dataset.busyLabel || btn.textContent;
      delete btn.dataset.busyLabel;
    }
  });

  if (form) {
    form.dataset.attachmentsUploading = busy ? "true" : "false";
  }
}

function adjustArticleAttachmentUploadCount(delta) {
  if (typeof delta !== "number" || Number.isNaN(delta)) return;
  activeArticleAttachmentUploads = Math.max(
    0,
    activeArticleAttachmentUploads + delta
  );
  refreshArticleUploadBusyState();
}

function areArticleAttachmentsUploading() {
  return (
    activeArticleAttachmentUploads > 0 ||
    activeArticleImageUploads > 0 ||
    activeArticleAudioUploads > 0
  );
}

function adjustArticleImageUploadCount(delta) {
  if (typeof delta !== "number" || Number.isNaN(delta)) return;
  activeArticleImageUploads = Math.max(0, activeArticleImageUploads + delta);
  refreshArticleUploadBusyState();
}

function adjustArticleAudioUploadCount(delta) {
  if (typeof delta !== "number" || Number.isNaN(delta)) return;
  activeArticleAudioUploads = Math.max(0, activeArticleAudioUploads + delta);
  refreshArticleUploadBusyState();
}

function refreshArticleUploadBusyState() {
  const busy =
    activeArticleAttachmentUploads +
      activeArticleImageUploads +
      activeArticleAudioUploads >
    0;
  setArticleFormButtonsBusy(busy);
}

function setupFilePicker({ inputId, triggerId, filenameId, labels }) {
  const input = document.getElementById(inputId);
  const trigger = document.getElementById(triggerId);
  const filename = document.getElementById(filenameId);
  if (!input || !trigger || !filename) {
    return { reset: () => {}, setFilename: () => {} };
  }

  if (input._filePicker) {
    return input._filePicker;
  }

  const buttonLabel = labels?.button ?? "Select file";
  const placeholder = labels?.placeholder ?? "No file selected";
  const iconSymbol = labels?.icon ?? "📁";
  const variantClass = labels?.variant
    ? `file-picker__trigger--${labels.variant}`
    : null;
  if (variantClass) {
    trigger.classList.add(variantClass);
  }

  const applyTriggerContent = (labelText = buttonLabel, icon = iconSymbol) => {
    trigger.innerHTML = `
      <span class="file-picker__icon" aria-hidden="true">${escapeHtml(
        icon
      )}</span>
      <span class="file-picker__label">${escapeHtml(labelText)}</span>
    `;
  };

  applyTriggerContent(buttonLabel, iconSymbol);

  const setFilename = (value = "", options = {}) => {
    const hasValue = value && String(value).trim().length > 0;
    const text = hasValue ? String(value).trim() : placeholder;
    filename.textContent = text;
    if (hasValue) {
      trigger.classList.add("file-picker__trigger--has-file");
      filename.classList.add("file-picker__filename--has-value");
    } else {
      trigger.classList.remove("file-picker__trigger--has-file");
      filename.classList.remove("file-picker__filename--has-value");
    }

    if (options.status) {
      filename.dataset.filePickerStatus = options.status;
    } else {
      delete filename.dataset.filePickerStatus;
    }
  };

  setFilename();

  const isLabelTrigger = trigger.tagName === "LABEL";

  if (isLabelTrigger) {
    if (!trigger.hasAttribute("role")) {
      trigger.setAttribute("role", "button");
    }
    if (!trigger.hasAttribute("tabindex")) {
      trigger.setAttribute("tabindex", "0");
    }
  }

  const reset = (options = {}) => {
    input.value = "";
    if (options.displayText) {
      setFilename(options.displayText, options);
    } else {
      setFilename();
    }
  };

  trigger.addEventListener("click", (event) => {
    if (isLabelTrigger) {
      return;
    }
    event.preventDefault();
    input.click();
  });

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) {
      const summary = formatFileSummary(file.name, file.size, {
        action: "selected",
      });
      setFilename(summary, { status: "selected" });
    } else {
      reset();
    }
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });

  input.dataset.pickerBound = "true";
  const pickerApi = {
    reset,
    setFilename: (value, options) => setFilename(value, options),
    setButtonLabel: (value, icon) =>
      applyTriggerContent(value, icon ?? iconSymbol),
  };
  input._filePicker = pickerApi;

  return pickerApi;
}

function hideHeroImageStatus() {
  if (articleHeroImageStatusTimeout) {
    clearTimeout(articleHeroImageStatusTimeout);
    articleHeroImageStatusTimeout = null;
  }
  const statusEl = document.getElementById("dashboard-article-image-status");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.setAttribute("hidden", "");
  }
}

function clearHeroImageMetadata(input) {
  if (!input) return;
  delete input.dataset.storageKey;
  delete input.dataset.filename;
  delete input.dataset.mimeType;
  delete input.dataset.fileSize;
  delete input.dataset.proxyUrl;
  delete input.dataset.proxyDownloadUrl;
}

function applyHeroImageMetadata(input, metadata = {}) {
  if (!input) return;
  clearHeroImageMetadata(input);
  if (!metadata || typeof metadata !== "object") {
    return;
  }

  const assignStringDataset = (prop, value) => {
    if (typeof value === "string" && value.trim()) {
      input.dataset[prop] = value.trim();
    }
  };

  assignStringDataset(
    "storageKey",
    metadata.storage_key || metadata.image_storage_key
  );
  assignStringDataset("filename", metadata.filename || metadata.image_filename);
  assignStringDataset(
    "mimeType",
    metadata.mime_type || metadata.image_mime_type
  );
  assignStringDataset(
    "proxyUrl",
    metadata.proxy_url || metadata.image_proxy_url
  );
  assignStringDataset(
    "proxyDownloadUrl",
    metadata.proxy_download_url || metadata.image_proxy_download_url
  );

  const fileSizeSource =
    metadata.file_size ?? metadata.image_file_size ?? metadata.size;
  const hasFileSize =
    fileSizeSource !== undefined &&
    fileSizeSource !== null &&
    !(typeof fileSizeSource === "string" && !fileSizeSource.trim());
  if (hasFileSize) {
    const fileSizeRaw = Number(fileSizeSource);
    if (Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0) {
      input.dataset.fileSize = String(fileSizeRaw);
    }
  }
}

function initializeArticleHeroImageControl() {
  const fileInputId = "dashboard-article-image-file";
  const triggerId = "dashboard-article-image-trigger";
  const filenameId = "dashboard-article-image-filename";
  const urlInput = document.getElementById("dashboard-article-image");
  const statusEl = document.getElementById("dashboard-article-image-status");
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput || !urlInput) return;

  const picker = setupFilePicker({
    inputId: fileInputId,
    triggerId,
    filenameId,
    labels: {
      button: "Upload image from device",
      placeholder: "No image selected",
      icon: "🖼️",
      variant: "image",
    },
  });
  articleHeroImagePickerReset = picker.reset;

  if (fileInput.dataset.heroBound === "true") {
    return;
  }

  fileInput.dataset.heroBound = "true";
  fileInput.addEventListener("change", async () => {
    if (articleHeroImageStatusTimeout) {
      clearTimeout(articleHeroImageStatusTimeout);
      articleHeroImageStatusTimeout = null;
    }

    const file = fileInput.files?.[0];
    if (!file) {
      hideHeroImageStatus();
      clearHeroImageMetadata(urlInput);
      return;
    }

    if (statusEl) {
      statusEl.textContent = formatFileSummary(file.name, file.size, {
        action: "uploading",
      });
      statusEl.removeAttribute("hidden");
    }

    try {
      const imageResource = await uploadArticleImage(file);
      const url =
        typeof imageResource === "string" ? imageResource : imageResource?.url;
      if (url) {
        const resolvedSize =
          (imageResource && typeof imageResource === "object"
            ? imageResource.file_size
            : null) ?? file.size;
        applyHeroImageMetadata(urlInput, imageResource);
        urlInput.value = url;
        urlInput.dispatchEvent(new Event("input", { bubbles: true }));
        picker.reset({
          displayText: formatFileSummary(file.name, resolvedSize, {
            action: "uploaded",
          }),
          status: "uploaded",
        });
        if (statusEl) {
          statusEl.textContent = `${formatFileSummary(file.name, resolvedSize, {
            action: "uploaded",
          })}. Preview will update automatically.`;
          articleHeroImageStatusTimeout = window.setTimeout(() => {
            statusEl.setAttribute("hidden", "");
            statusEl.textContent = "";
            articleHeroImageStatusTimeout = null;
          }, 4000);
        }
      } else {
        hideHeroImageStatus();
      }
    } catch (error) {
      picker.reset({
        displayText: formatFileSummary(file.name, file.size, {
          action: "error",
        }),
        status: "error",
      });
      if (statusEl) {
        const message =
          error?.message ||
          "Image upload failed. Check your connection or try again.";
        statusEl.textContent = message;
        statusEl.removeAttribute("hidden");
        articleHeroImageStatusTimeout = window.setTimeout(() => {
          statusEl.setAttribute("hidden", "");
          statusEl.textContent = "";
          articleHeroImageStatusTimeout = null;
        }, 6000);
      } else {
        hideHeroImageStatus();
      }
    } finally {
      ensurePreferredDashboardViewMode();
    }
  });

  if (urlInput.dataset.heroInputBound !== "true") {
    urlInput.addEventListener("input", (event) => {
      if (!event?.isTrusted) {
        return;
      }
      if (!urlInput.value.trim()) {
        clearHeroImageMetadata(urlInput);
        return;
      }
      clearHeroImageMetadata(urlInput);
    });
    urlInput.dataset.heroInputBound = "true";
  }
}

function setGuestArticleEditMode(enabled) {
  const canManage = CAN_MANAGE_ARTICLES && dashboardViewMode === "guest";
  const nextMode = canManage && !!enabled;

  if (!nextMode && guestArticleEditMode) {
    guestArticleEditMode = false;
    resetArticleForm();
  } else if (nextMode && !guestArticleEditMode) {
    guestArticleEditMode = true;
    renderAdminArticles("dashboard-articles-list");
    ensureArticleFormRowsInitialized();
  } else if (!nextMode) {
    guestArticleEditMode = false;
  }

  updateArticleEditorVisibility();

  const wrapper = document.getElementById("guest-articles-wrapper");
  wrapper?.classList.toggle("guest-articles--editing", guestArticleEditMode);

  updateDashboardSaveButtonVisibility();

  if (!guestArticleEditMode) {
    setArticleEditorSessionActive(false);
  }

  renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
  updateGuestLayoutOrder();
  updateGuestSaveButtonsState();
}

function updateArticleEditorVisibility() {
  const editor = document.getElementById("guest-article-editor");
  const management = document.getElementById("guest-article-management");
  const form = document.getElementById("dashboard-article-form");
  const saveButton = document.getElementById("guest-article-save-button");
  const toggle = document.getElementById("guest-article-edit-toggle");

  const isAdminView = dashboardViewMode === "admin";
  if (isAdminView) {
    if (guestArticleEditMode) {
      guestArticleEditMode = false;
      resetArticleForm();
    }
    management?.classList.add("hidden");
    editor?.classList.add("hidden");
    form?.classList.add("hidden");
    saveButton?.classList.add("hidden");
    if (toggle) {
      toggle.textContent = "Edit guest articles";
      toggle.setAttribute("aria-pressed", "false");
    }
    updateGuestSaveButtonsState();
    return;
  }

  const canManage = CAN_MANAGE_ARTICLES && dashboardViewMode === "guest";
  management?.classList.toggle("hidden", !canManage);

  if (!canManage) {
    if (guestArticleEditMode) {
      guestArticleEditMode = false;
      resetArticleForm();
    }
    editor?.classList.add("hidden");
    form?.classList.add("hidden");
    saveButton?.classList.add("hidden");
    if (toggle) {
      toggle.textContent = "Edit guest articles";
      toggle.setAttribute("aria-pressed", "false");
    }
    updateGuestSaveButtonsState();
    return;
  }

  editor?.classList.toggle("hidden", !guestArticleEditMode);
  form?.classList.toggle("hidden", !guestArticleEditMode);
  const shouldShowSaveButton =
    CAN_MANAGE_ARTICLES &&
    dashboardViewMode === "guest" &&
    (guestArticleEditMode || hasPendingChangesFor("articles"));
  saveButton?.classList.toggle("hidden", !shouldShowSaveButton);

  if (toggle) {
    toggle.textContent = guestArticleEditMode
      ? "Cancel editing"
      : "Edit guest articles";
    toggle.setAttribute(
      "aria-pressed",
      guestArticleEditMode ? "true" : "false"
    );
  }

  updateGuestSaveButtonsState();
}

function setGuestPodcastEditMode(enabled) {
  const canManage = CAN_MANAGE_ARTICLES && dashboardViewMode === "guest";
  const nextMode = canManage && !!enabled;

  if (!nextMode && guestPodcastEditMode) {
    guestPodcastEditMode = false;
    resetPodcastForm();
  } else if (nextMode && !guestPodcastEditMode) {
    guestPodcastEditMode = true;
    renderAdminPodcasts("dashboard-podcasts-list");
    ensurePodcastFormReady();
  } else if (!nextMode) {
    guestPodcastEditMode = false;
  }

  updatePodcastEditorVisibility();

  const wrapper = document.getElementById("guest-podcasts-wrapper");
  wrapper?.classList.toggle("guest-podcasts--editing", guestPodcastEditMode);

  updateDashboardSaveButtonVisibility();

  if (guestPodcastEditMode) {
    const focusTarget = document.getElementById("dashboard-podcast-title");
    focusTarget?.focus();
  }

  renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
  updateGuestLayoutOrder();
  updateGuestSaveButtonsState();
}

function updatePodcastEditorVisibility() {
  const editor = document.getElementById("guest-podcast-editor");
  const management = document.getElementById("guest-podcast-management");
  const toggle = document.getElementById("guest-podcast-edit-toggle");
  const saveButton = document.getElementById("guest-podcast-save-button");
  const addButton = document.getElementById("dashboard-podcast-add");
  const form = document.getElementById("dashboard-podcast-form");

  const hidePodcastActions = () => {
    document
      .querySelectorAll(".dashboard-podcast-card__actions")
      .forEach((actions) => actions.classList.add("hidden"));
  };

  const isAdminView = dashboardViewMode === "admin";
  if (isAdminView) {
    if (guestPodcastEditMode) {
      guestPodcastEditMode = false;
      resetPodcastForm();
    }
    management?.classList.add("hidden");
    editor?.classList.add("hidden");
    form?.classList.add("hidden");
    addButton?.classList.add("hidden");
    saveButton?.classList.add("hidden");
    if (toggle) {
      toggle.textContent = "Edit guest podcasts";
      toggle.setAttribute("aria-pressed", "false");
    }
    hidePodcastActions();
    updateGuestSaveButtonsState();
    return;
  }

  const canManage = CAN_MANAGE_ARTICLES && dashboardViewMode === "guest";
  management?.classList.toggle("hidden", !canManage);

  if (!canManage) {
    if (guestPodcastEditMode) {
      guestPodcastEditMode = false;
      resetPodcastForm();
    }
    editor?.classList.add("hidden");
    form?.classList.add("hidden");
    addButton?.classList.add("hidden");
    saveButton?.classList.add("hidden");
    if (toggle) {
      toggle.textContent = "Edit guest podcasts";
      toggle.setAttribute("aria-pressed", "false");
    }
    hidePodcastActions();
    updateGuestSaveButtonsState();
    return;
  }

  editor?.classList.toggle("hidden", !guestPodcastEditMode);
  form?.classList.toggle("hidden", !guestPodcastEditMode);
  addButton?.classList.toggle("hidden", !guestPodcastEditMode);
  const shouldShowSaveButton =
    CAN_MANAGE_ARTICLES &&
    dashboardViewMode === "guest" &&
    (guestPodcastEditMode || hasPendingChangesFor("podcasts"));
  saveButton?.classList.toggle("hidden", !shouldShowSaveButton);

  document
    .querySelectorAll(".dashboard-podcast-card__actions")
    .forEach((actions) => {
      actions.classList.toggle("hidden", !guestPodcastEditMode);
    });

  if (toggle) {
    toggle.textContent = guestPodcastEditMode
      ? "Cancel podcast editing"
      : "Edit guest podcasts";
    toggle.setAttribute(
      "aria-pressed",
      guestPodcastEditMode ? "true" : "false"
    );
  }

  updateGuestSaveButtonsState();
}

function bindGuestPodcastManagementControls() {
  const toggle = document.getElementById("guest-podcast-edit-toggle");
  if (toggle && !toggle.dataset.bound) {
    toggle.addEventListener("click", () => {
      if (!CAN_MANAGE_ARTICLES || dashboardViewMode !== "guest") return;
      setGuestPodcastEditMode(!guestPodcastEditMode);
    });
    toggle.dataset.bound = "true";
  }

  const saveButton = document.getElementById("guest-podcast-save-button");
  if (saveButton && !saveButton.dataset.bound) {
    saveButton.addEventListener("click", async () => {
      if (saveButton.dataset.busy === "true") return;
      if (!CAN_MANAGE_ARTICLES || dashboardViewMode !== "guest") return;
      if (!guestPodcastEditMode && !hasPendingChangesFor("podcasts")) {
        setGuestPodcastEditMode(true);
      }

      const form = document.getElementById("dashboard-podcast-form");
      let staged = true;
      if (form && !form.classList.contains("hidden")) {
        staged = await submitDashboardPodcastForm(form);
      }

      if (staged !== false) {
        const originalLabel = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.dataset.busy = "true";
        saveButton.textContent = "Saving…";
        try {
          await saveDashboardState();
        } finally {
          delete saveButton.dataset.busy;
          saveButton.textContent = originalLabel;
          saveButton.disabled = false;
        }
      }
    });
    saveButton.dataset.bound = "true";
  }
}

async function toggleDashboardEditMode() {
  if (dashboardViewMode !== "admin") {
    setDashboardViewMode("admin", {
      showAdminSections: true,
      persistPreference: false,
      force: true,
      unlockGuestPreview: true,
    });
  }
  const nextMode = !dashboardEditMode;
  setDashboardEditMode(nextMode);

  if (!nextMode && hasPendingDashboardChanges()) {
    try {
      await refreshDashboardData({ showToast: false });
      showNotification(
        "Unsaved dashboard edits were discarded.",
        "info",
        "Changes discarded"
      );
    } catch (error) {
      showNotification(
        error?.message || "Unable to reload the dashboard right now.",
        "warning",
        "Reload failed"
      );
    } finally {
      resetDashboardPendingChanges();
    }
  }
}

async function loadDashboardEvents(targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;
  try {
    const events = await fetchEvents();
    const { upcoming } = splitEvents(events);
    if (!upcoming.length) {
      container.innerHTML =
        '<p class="placeholder">No upcoming events yet.</p>';
      return;
    }
    container.innerHTML = upcoming.map(renderDashboardEventCard).join("");
  } catch (error) {
    container.innerHTML =
      '<p class="placeholder">Unable to load events right now.</p>';
  }
}

function getToken() {
  return localStorage.getItem("token");
}

// Helper function to properly decode filename
function decodeFilename(filename) {
  if (!filename) return "Unknown file";

  try {
    // Try different decoding methods
    if (filename.includes("%")) {
      return decodeURIComponent(filename);
    }

    // If filename contains encoded UTF-8 bytes, try to decode
    if (filename.match(/[À-ÿ]/)) {
      return decodeURIComponent(escape(filename));
    }

    return filename;
  } catch (e) {
    // If decoding fails, return the original or a cleaned version
    return filename.replace(/[^\w\s.-]/g, "_");
  }
}

async function uploadProjectImage(file) {
  if (!file) return null;
  const token = getToken();
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(API_BASE + "/projects/upload-image", {
      method: "POST",
      headers: token ? { Authorization: "Bearer " + token } : {},
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.error || "Image upload failed";
      showNotification(message, "error", "Upload Failed");
      const error = new Error(message);
      error.__shown = true;
      throw error;
    }

    showNotification(
      `Image "${file.name}" uploaded successfully!`,
      "success",
      "Upload Complete"
    );

    return data;
  } catch (error) {
    if (!error.__shown) {
      showNotification(
        error?.message || "Image upload failed",
        "error",
        "Upload Failed"
      );
    }
    throw error;
  }
}

async function uploadArticleImage(file) {
  if (!file) return null;
  const token = getToken();
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(API_BASE + "/dashboard/articles/upload-image", {
      method: "POST",
      headers: token ? { Authorization: "Bearer " + token } : {},
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.error || "Image upload failed";
      showNotification(message, "error", "Upload Failed");
      const error = new Error(message);
      error.__shown = true;
      throw error;
    }

    showNotification(
      `Image "${file.name}" uploaded successfully!`,
      "success",
      "Upload Complete"
    );

    return {
      url: typeof data.url === "string" ? data.url : null,
      proxy_url: typeof data.proxy_url === "string" ? data.proxy_url : null,
      proxy_download_url:
        typeof data.proxy_download_url === "string"
          ? data.proxy_download_url
          : null,
      storage_key:
        typeof data.storage_key === "string" ? data.storage_key : null,
      filename: typeof data.filename === "string" ? data.filename : null,
      mime_type: typeof data.mime_type === "string" ? data.mime_type : null,
      file_size:
        Number.isFinite(Number(data.file_size)) && Number(data.file_size) >= 0
          ? Number(data.file_size)
          : null,
    };
  } catch (error) {
    if (!error.__shown) {
      showNotification(
        error?.message || "Image upload failed",
        "error",
        "Upload Failed"
      );
    }
    throw error;
  }
}

async function uploadArticleAttachment(file) {
  if (!file) return null;
  const token = getToken();
  if (!token) {
    const message = "You need to sign in to upload attachments.";
    showNotification(message, "warning");
    throw new Error(message);
  }

  const formData = new FormData();
  formData.append("attachment", file);

  try {
    const res = await fetch(
      API_BASE + "/dashboard/articles/upload-attachment",
      {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.error || "Attachment upload failed";
      showNotification(message, "error", "Upload Failed");
      const error = new Error(message);
      error.__shown = true;
      throw error;
    }

    if (!data.document) {
      const error = new Error("Upload succeeded but no document returned");
      error.__shown = true;
      showNotification(error.message, "error", "Upload Failed");
      throw error;
    }

    data.document.scope = data.document.scope || "article";

    return data.document;
  } catch (error) {
    if (!error.__shown) {
      showNotification(
        error?.message || "Attachment upload failed",
        "error",
        "Upload Failed"
      );
    }
    throw error;
  }
}

async function uploadArticleAudio(file) {
  if (!file) return null;
  const token = getToken();
  if (!token) {
    const message = "You need to sign in to upload audio.";
    showNotification(message, "warning");
    throw new Error(message);
  }

  const formData = new FormData();
  formData.append("audio", file);

  try {
    const res = await fetch(API_BASE + "/dashboard/articles/upload-audio", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.error || "Audio upload failed";
      showNotification(message, "error", "Upload Failed");
      const error = new Error(message);
      error.__shown = true;
      throw error;
    }

    if (!data.track) {
      const error = new Error("Upload succeeded but no audio track returned");
      error.__shown = true;
      showNotification(error.message, "error", "Upload Failed");
      throw error;
    }

    return data.track;
  } catch (error) {
    if (!error.__shown) {
      showNotification(
        error?.message || "Audio upload failed",
        "error",
        "Upload Failed"
      );
    }
    throw error;
  }
}

async function uploadPodcastAudio(file) {
  if (!file) return null;
  const token = getToken();
  if (!token) {
    const message = "You need to sign in to upload audio.";
    showNotification(message, "warning");
    throw new Error(message);
  }

  const formData = new FormData();
  formData.append("audio", file);

  try {
    const res = await fetch(API_BASE + "/dashboard/podcasts/upload-audio", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.error || "Audio upload failed";
      showNotification(message, "error", "Upload Failed");
      const error = new Error(message);
      error.__shown = true;
      throw error;
    }

    if (!data.audio) {
      const error = new Error("Upload succeeded but no audio returned");
      error.__shown = true;
      showNotification(error.message, "error", "Upload Failed");
      throw error;
    }

    return data.audio;
  } catch (error) {
    if (!error.__shown) {
      showNotification(
        error?.message || "Audio upload failed",
        "error",
        "Upload Failed"
      );
    }
    throw error;
  }
}

function setToken(t) {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}
function setUser(u) {
  if (u) localStorage.setItem("user", JSON.stringify(u));
  else localStorage.removeItem("user");
}
function getUser() {
  const v = localStorage.getItem("user");
  return v ? JSON.parse(v) : null;
}

// Pretty Notification System
function showNotification(message, type = "info", title = null, options = {}) {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const opts = typeof options === "object" && options ? options : {};
  const force = Boolean(opts.force);
  const shouldShow = force || notificationsEnabled || type === "error";

  if (!shouldShow) {
    console.info(
      `[notifications muted] ${type.toUpperCase()}: ${String(message)}`
    );
    return;
  }

  const icons = {
    error: "🚨",
    success: "✅",
    warning: "⚠️",
    info: "ℹ️",
  };

  const titles = {
    error: title || "Error",
    success: title || "Success",
    warning: title || "Warning",
    info: title || "Info",
  };

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${icons[type]}</div>
    <div class="notification-content">
      <div class="notification-title">${titles[type]}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" onclick="closeNotification(this)">×</button>
  `;

  container.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    closeNotification(notification.querySelector(".notification-close"));
  }, 5000);
}

function closeNotification(closeBtn) {
  const notification = closeBtn.parentElement;
  notification.classList.add("removing");
  setTimeout(() => {
    if (notification.parentElement) {
      notification.parentElement.removeChild(notification);
    }
  }, 300);
}

async function api(path, options = {}) {
  try {
    const headers = options.headers || {};
    headers["Content-Type"] = "application/json";
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    console.log(`Making API request to: ${API_BASE + path}`);
    const res = await fetch(API_BASE + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage =
        data.error || `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(errorMessage);
      error.status = res.status;
      if (res.status !== 401) {
        showNotification(errorMessage, "error", "Request Failed");
      }
      throw error;
    }
    return data;
  } catch (error) {
    if (error.status === 401) {
      throw error;
    }
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      const connectionError =
        "Cannot connect to server. Please check if the backend is running on port 4010.";
      showNotification(connectionError, "error", "Connection Failed");
      throw new Error(connectionError);
    }
    // Don't show notification again if we already showed it above
    if (
      !error.message.includes("HTTP") &&
      !error.message.includes("Cannot connect")
    ) {
      showNotification(error.message, "error");
    }
    throw error;
  }
}

function updateNav() {
  const user = getUser();
  const navDashboard = document.getElementById("nav-dashboard");
  const navAdmin = document.getElementById("nav-admin");
  const navRegister = document.getElementById("nav-register");
  const navLogin = document.getElementById("nav-login");
  const btnLogout = document.getElementById("btn-logout");
  const dashboardAdminCta = document.getElementById("dashboard-admin-cta");

  ensureNotificationToggle(user);

  if (navDashboard) {
    navDashboard.classList.remove("hidden");
    if (!user) {
      navDashboard.setAttribute(
        "title",
        "Register or log in to unlock full dashboard access"
      );
    } else {
      navDashboard.removeAttribute("title");
    }
  }
  if (navAdmin)
    navAdmin.classList.toggle("hidden", !(user && user.role === "admin"));
  if (dashboardAdminCta)
    dashboardAdminCta.classList.toggle(
      "hidden",
      !(user && user.role === "admin")
    );
  if (navRegister) navRegister.classList.toggle("hidden", !!user);
  if (navLogin) navLogin.classList.toggle("hidden", !!user);
  if (btnLogout) btnLogout.classList.toggle("hidden", !user);
  if (btnLogout)
    btnLogout.onclick = () => {
      setToken(null);
      setUser(null);
      location.href = "index.html";
    };
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

function initializeTopbarNavigation() {
  const topbars = Array.from(document.querySelectorAll(".topbar"));
  if (!topbars.length) return;

  const desktopQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 960px)")
      : null;

  let activeTopbar = null;

  const closeMenu = (topbar) => {
    if (!topbar) return;
    const toggle = topbar.querySelector(".topbar__toggle");
    topbar.dataset.menuOpen = "false";
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
    if (activeTopbar === topbar) {
      activeTopbar = null;
    }
  };

  const closeAllMenus = () => {
    topbars.forEach((bar) => closeMenu(bar));
  };

  const handleDocumentKeydown = (event) => {
    if (event.key !== "Escape") return;
    if (!activeTopbar || activeTopbar.dataset.menuOpen !== "true") return;
    event.preventDefault();
    const toggle = activeTopbar.querySelector(".topbar__toggle");
    closeMenu(activeTopbar);
    toggle?.focus();
  };

  document.addEventListener("keydown", handleDocumentKeydown);

  const handleBreakpointChange = (event) => {
    if (event.matches) {
      closeAllMenus();
    }
  };

  if (desktopQuery?.addEventListener) {
    desktopQuery.addEventListener("change", handleBreakpointChange);
  } else if (desktopQuery?.addListener) {
    desktopQuery.addListener(handleBreakpointChange);
  }

  topbars.forEach((topbar, index) => {
    const toggle = topbar.querySelector(".topbar__toggle");
    const nav = topbar.querySelector(".topbar__nav");
    if (!toggle || !nav) return;

    if (!nav.id) {
      nav.id = `site-navigation-${index + 1}`;
    }
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const alreadyOpen = topbar.dataset.menuOpen === "true";
      if (alreadyOpen) {
        closeMenu(topbar);
      } else {
        closeAllMenus();
        topbar.dataset.menuOpen = "true";
        toggle.setAttribute("aria-expanded", "true");
        activeTopbar = topbar;
      }
    });

    const navItems = nav.querySelectorAll("a[href], button:not([disabled])");
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (desktopQuery && desktopQuery.matches) return;
        closeMenu(topbar);
      });
    });
  });
}

async function loadProjects(targetId, options = {}) {
  const el = document.getElementById(targetId);
  if (!el) return;

  const { layout = "detailed", scrollToHash = false } = options;

  el.classList.remove("projects-minimal", "projects-detailed");
  el.classList.add(
    layout === "minimal" ? "projects-minimal" : "projects-detailed"
  );

  try {
    const { projects } = await api("/projects");
    const normalized = (projects || []).map(normalizeProject);

    if (!normalized.length) {
      el.innerHTML = '<p class="placeholder">No projects published yet.</p>';
      return;
    }

    el.innerHTML = normalized
      .map((project) =>
        layout === "minimal"
          ? renderMinimalProject(project)
          : renderDetailedProject(project)
      )
      .join("");

    if (scrollToHash) {
      const hash = window.location.hash ? window.location.hash.slice(1) : "";
      if (hash) {
        const decoded = decodeURIComponent(hash);
        const target = document.getElementById(decoded);
        if (target) {
          requestAnimationFrame(() =>
            target.scrollIntoView({ behavior: "smooth", block: "start" })
          );
        }
      }
    }
  } catch (error) {
    el.innerHTML =
      '<p class="placeholder">Projects are unavailable right now.</p>';
  }
}

async function fetchEvents() {
  const { events } = await api("/events");
  return (events || []).map(normalizeEvent);
}

function splitEvents(events = []) {
  const now = Date.now();
  const upcoming = [];
  const past = [];
  events.forEach((event) => {
    const date = event.start_at ? new Date(event.start_at) : null;
    if (!date || Number.isNaN(date.getTime())) {
      upcoming.push(event);
      return;
    }
    const durationMinutes = Number(event.duration_minutes);
    const durationMs =
      Number.isFinite(durationMinutes) && durationMinutes > 0
        ? durationMinutes * 60 * 1000
        : 6 * 60 * 60 * 1000;
    const eventEnd = date.getTime() + durationMs;
    if (eventEnd < now) {
      past.push(event);
    } else {
      upcoming.push(event);
    }
  });
  const getTime = (value, fallback) => {
    if (!value) return fallback;
    const parsed = new Date(value);
    const time = parsed.getTime();
    return Number.isNaN(time) ? fallback : time;
  };
  upcoming.sort(
    (a, b) =>
      getTime(a.start_at, Number.POSITIVE_INFINITY) -
      getTime(b.start_at, Number.POSITIVE_INFINITY)
  );
  past.sort(
    (a, b) =>
      getTime(b.start_at, Number.NEGATIVE_INFINITY) -
      getTime(a.start_at, Number.NEGATIVE_INFINITY)
  );
  return { upcoming, past };
}

function buildDocumentAccessors(doc = {}) {
  if (!doc || typeof doc !== "object") {
    return {
      previewUrl: "",
      downloadUrl: "",
      hasPreview: false,
      hasDownload: false,
    };
  }

  const storageKey = doc.storage_key || doc.storageKey || "";
  const previewStorageKey =
    doc.preview_storage_key || doc.previewStorageKey || "";
  const rawPreviewUrl =
    doc.preview_url ||
    doc.previewUrl ||
    doc.url ||
    doc.link ||
    doc.download_url ||
    "";
  const rawDownloadUrl =
    doc.download_url || doc.downloadUrl || doc.url || doc.link || "";

  const encode = (value) =>
    value && typeof value === "string" ? encodeURIComponent(value) : "";
  const encodedStorageKey = encode(storageKey);
  const encodedPreviewKey = encode(previewStorageKey);

  const resolve = (value) => {
    if (!value || typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    return resolveAssetUrl(trimmed);
  };

  let previewUrl = "";
  let downloadUrl = "";

  if (encodedPreviewKey) {
    const mediaBase = `${API_BASE}/media?key=${encodedPreviewKey}`;
    previewUrl = mediaBase;
  }

  if (encodedStorageKey) {
    const mediaBase = `${API_BASE}/media?key=${encodedStorageKey}`;
    if (!previewUrl) {
      previewUrl = mediaBase;
    }
    downloadUrl = `${mediaBase}&download=1`;
  }

  if (!previewUrl) {
    previewUrl = resolve(rawPreviewUrl);
  }
  if (!downloadUrl) {
    downloadUrl = resolve(rawDownloadUrl) || previewUrl;
  }

  return {
    previewUrl,
    downloadUrl,
    hasPreview: Boolean(previewUrl),
    hasDownload: Boolean(downloadUrl),
  };
}

function renderPublicDocumentCard(doc) {
  if (!doc) return "";
  const title = doc.title ? escapeHtml(doc.title) : "Untitled document";
  const descriptionMarkup = doc.description
    ? `<p class="document-card__description">${escapeHtml(doc.description)}</p>`
    : `<p class="document-card__description document-card__description--placeholder">No description provided yet.</p>`;
  const { previewUrl, downloadUrl, hasPreview, hasDownload } =
    buildDocumentAccessors(doc);
  const safePreviewUrl = hasPreview ? escapeHtml(previewUrl) : "";
  const safeDownloadUrl = hasDownload ? escapeHtml(downloadUrl) : "";
  const decodedFilename = doc.filename ? decodeFilename(doc.filename) : "";
  const safeFilename = decodedFilename ? escapeHtml(decodedFilename) : "";

  const metaParts = [];
  if (decodedFilename) metaParts.push(decodedFilename);
  if (doc.mime_type) {
    const typeLabel = doc.mime_type.split("/").pop();
    if (typeLabel) metaParts.push(typeLabel.toUpperCase());
  }
  if (doc.file_size) {
    const sizeLabel = formatFileSize(doc.file_size);
    if (sizeLabel) metaParts.push(sizeLabel);
  }
  const metaMarkup = metaParts.length
    ? `<p class="document-card__meta">${metaParts
        .map((part) => escapeHtml(part))
        .join(" • ")}</p>`
    : "";

  const badgeMarkup = doc.admin_only
    ? '<span class="badge-admin" title="Visible to administrators only">Admin</span>'
    : "";

  const actions = [];
  if (hasPreview) {
    actions.push(`
      <a class="document-card__download" href="${safePreviewUrl}" target="_blank" rel="noopener">
        <span>Preview</span>
        <span class="document-card__download-icon" aria-hidden="true">↗</span>
      </a>
    `);
  }

  if (hasDownload && (!hasPreview || downloadUrl !== previewUrl)) {
    const downloadAttr = safeFilename ? ` download="${safeFilename}"` : "";
    actions.push(`
      <a class="document-card__download" href="${safeDownloadUrl}"${downloadAttr} target="_blank" rel="noopener">
        <span>${hasPreview ? "Download" : "Open"}</span>
        <span class="document-card__download-icon" aria-hidden="true">↗</span>
      </a>
    `);
  }

  if (!actions.length) {
    actions.push(
      '<span class="document-card__download document-card__download--disabled" aria-disabled="true">Link unavailable</span>'
    );
  }

  return `
    <article class="card document-card" data-id="${escapeHtml(doc.id || "")}">
      <header class="document-card__header">
        <div class="document-card__title">
          <h4>${title}</h4>
          ${metaMarkup}
        </div>
        ${badgeMarkup}
      </header>
      ${descriptionMarkup}
      <div class="document-card__actions">
        ${actions.join("")}
      </div>
    </article>
  `;
}

async function loadDocuments(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.classList.add("documents-list");
  el.classList.remove("projects");
  el.innerHTML = '<p class="placeholder">Loading documents…</p>';

  try {
    const docs = await api("/documents");
    if (!Array.isArray(docs) || docs.length === 0) {
      el.innerHTML = '<p class="placeholder">No shared documents yet.</p>';
      return;
    }
    el.innerHTML = docs.map(renderPublicDocumentCard).join("");
  } catch (e) {
    el.innerHTML =
      '<p class="placeholder">Documents are temporarily unavailable.</p>';
  }
}

async function onLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const err = document.getElementById("login-error");

    try {
      const { token, user } = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(token);
      setUser(user);
      const displayName = user.full_name || user.name || user.email;
      showNotification(
        `Welcome back, ${displayName}!`,
        "success",
        "Login Successful"
      );
      setTimeout(() => {
        location.href = "dashboard.html";
      }, 1000);
    } catch (e) {
      err.textContent = ""; // Clear old error text since we show notification now
      // Error notification is already shown by api() function
    }
  });
}

async function onRegisterPage() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const activeUser = getUser();
  if (activeUser) {
    showNotification(
      "You already have an active session.",
      "info",
      "Already Logged In"
    );
    setTimeout(() => {
      location.href = "dashboard.html";
    }, 1000);
    return;
  }

  const resendBtn = document.getElementById("register-resend");
  let pendingResendEmail = "";

  const hideResendButton = () => {
    if (resendBtn) {
      resendBtn.classList.add("hidden");
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend verification email";
    }
    pendingResendEmail = "";
  };

  if (resendBtn && !resendBtn.dataset.bound) {
    resendBtn.addEventListener("click", async () => {
      const email = pendingResendEmail;
      if (!email) {
        showNotification(
          "Enter your email above before requesting a resend.",
          "warning"
        );
        return;
      }
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";
      try {
        const response = await api("/auth/verify/guest/resend", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        const message =
          response?.message ||
          `If ${email} is registered, a fresh verification email is on its way.`;
        showNotification(escapeHtml(message), "success", "Email sent");
      } catch (error) {
        // api() already surfaced the notification
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend verification email";
      }
    });
    resendBtn.dataset.bound = "true";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const surname = document.getElementById("reg-surname").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const passwordConfirm = document.getElementById(
      "reg-password-confirm"
    ).value;
    const err = document.getElementById("register-error");
    const successMsg = document.getElementById("register-success");
    const submitBtn = form.querySelector('button[type="submit"]');

    if (err) err.textContent = "";
    if (successMsg) {
      successMsg.textContent = "";
      successMsg.classList.add("hidden");
    }
    hideResendButton();
    if (submitBtn) submitBtn.disabled = true;

    if (password !== passwordConfirm) {
      if (err) {
        err.textContent = "Passwords do not match.";
      }
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    try {
      const response = await api("/auth/register/guest", {
        method: "POST",
        body: JSON.stringify({ name, surname, email, password }),
      });

      const displayName = `${name} ${surname}`.trim();
      const safeEmail = escapeHtml(email);
      const notificationMessage = displayName
        ? `Almost there, ${displayName}! Check ${email} for a verification link.`
        : `Almost there! Check ${email} for a verification link.`;

      showNotification(
        escapeHtml(notificationMessage),
        "success",
        "Verify your email"
      );

      if (successMsg) {
        const lines = [
          `We've sent a verification link to <strong>${safeEmail}</strong>.`,
          "Open it to activate your guest access. If you don't see it, give it a minute and check your spam folder.",
          "Need a new email? You can request one below.",
        ];
        successMsg.innerHTML = lines.join("<br />");
        successMsg.classList.remove("hidden");
      }

      pendingResendEmail = email;
      if (resendBtn) {
        resendBtn.classList.remove("hidden");
        resendBtn.disabled = false;
      }

      form.reset();
      const confirmInput = document.getElementById("reg-password-confirm");
      confirmInput?.blur();
    } catch (error) {
      if (err) {
        err.textContent =
          error?.message || "Registration failed. Please try again.";
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

async function onVerifyPage() {
  const statusContainer = document.getElementById("verify-status");
  const statusMessage = document.getElementById("verify-status-message");
  if (!statusContainer || !statusMessage) return;

  const loader = statusContainer.querySelector(".verify-status__loader");
  const actions = document.getElementById("verify-actions");
  const loginLink = document.getElementById("verify-login");
  const supportLink = document.getElementById("verify-support");
  const resendBtn = document.getElementById("verify-resend");

  const setState = (state, message) => {
    statusContainer.classList.remove(
      "verify-status--success",
      "verify-status--error"
    );
    if (state === "success") {
      statusContainer.classList.add("verify-status--success");
    } else if (state === "error") {
      statusContainer.classList.add("verify-status--error");
    }
    if (loader) loader.classList.add("hidden");
    statusMessage.textContent = message;
  };

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const emailFromUrl = params.get("email");
  const emailForResend = emailFromUrl ? emailFromUrl.trim().toLowerCase() : "";

  const hideResend = () => {
    if (resendBtn) {
      resendBtn.classList.add("hidden");
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend verification email";
    }
  };

  if (resendBtn && !resendBtn.dataset.bound) {
    resendBtn.addEventListener("click", async () => {
      if (!emailForResend) {
        showNotification(
          "We couldn't detect an email to resend to. Register again to receive a fresh link.",
          "warning"
        );
        return;
      }
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";
      try {
        const response = await api("/auth/verify/guest/resend", {
          method: "POST",
          body: JSON.stringify({ email: emailForResend }),
        });
        const message =
          response?.message ||
          `If ${emailForResend} is registered, a fresh verification email is on its way.`;
        showNotification(escapeHtml(message), "success", "Email sent");
      } catch (error) {
        // handled by api()
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend verification email";
      }
    });
    resendBtn.dataset.bound = "true";
  }

  hideResend();

  if (!token) {
    const message =
      "Missing verification token. Double-check the link from your email.";
    setState("error", message);
    actions?.classList.remove("hidden");
    loginLink?.classList.add("hidden");
    supportLink?.classList.remove("hidden");
    showNotification(escapeHtml(message), "error", "Verification failed");
    if (resendBtn && emailForResend) {
      resendBtn.classList.remove("hidden");
    }
    return;
  }

  if (loader) loader.classList.remove("hidden");

  try {
    const res = await fetch(
      `${API_BASE}/auth/verify/guest?token=${encodeURIComponent(token)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(
        data?.error || `Verification failed with status ${res.status}`
      );
      error.status = res.status;
      if (data?.code) error.code = data.code;
      throw error;
    }

    const message =
      typeof data?.message === "string"
        ? data.message
        : "Email verified successfully. You can now log in.";

    setState("success", message);
    actions?.classList.remove("hidden");
    loginLink?.classList.remove("hidden");
    supportLink?.classList.remove("hidden");
    showNotification(escapeHtml(message), "success", "All set");
    hideResend();
  } catch (error) {
    const code = error?.code;
    let message = error?.message || "Verification failed. Please try again.";
    let showLoginLink = false;
    let allowResend = false;

    if (code === "TOKEN_EXPIRED") {
      message =
        "This verification link has expired. Sign in to request a fresh email.";
      showLoginLink = true;
      allowResend = Boolean(emailForResend);
    } else if (code === "TOKEN_INVALID") {
      message =
        "This verification link is invalid or has already been used. Try logging in to trigger a new one.";
      showLoginLink = true;
      allowResend = Boolean(emailForResend);
    } else if (code === "TOKEN_MISSING") {
      showLoginLink = false;
    }

    setState("error", message);
    actions?.classList.remove("hidden");
    if (showLoginLink) {
      loginLink?.classList.remove("hidden");
    } else {
      loginLink?.classList.add("hidden");
    }
    supportLink?.classList.remove("hidden");
    showNotification(escapeHtml(message), "error", "Verification failed");
    if (resendBtn) {
      if (allowResend) {
        resendBtn.classList.remove("hidden");
      } else {
        hideResend();
      }
    }
  }
}

async function onDashboardPage() {
  const welcome = document.getElementById("welcome");
  if (!welcome) return;
  welcome.classList.add("hidden");

  const viewControls = document.getElementById("dashboard-view-controls");
  const viewToggle = document.getElementById("dashboard-view-toggle");
  const user = getUser();

  initializeImageLightbox();

  CAN_MANAGE_ARTICLES = Boolean(
    user &&
      (user.role === "admin" ||
        (Array.isArray(user.permissions) &&
          user.permissions.includes("manage_articles")))
  );

  const noteForm = document.getElementById("dashboard-note-form");
  const codespaceForm = document.getElementById("dashboard-codespace-form");
  const codespaceStatusSelect = document.getElementById(
    "dashboard-codespace-status"
  );
  const codespaceEditorSelect = document.getElementById(
    "dashboard-codespace-editor"
  );
  const editToggle = document.getElementById("dashboard-edit-toggle");
  const saveButton = document.getElementById("dashboard-save-button");

  const showGuestState = (message, overrides = {}) => {
    setDashboardViewMode(
      "guest",
      guestViewOptions({
        message,
        persistPreference: false,
        ...overrides,
      })
    );
  };

  if (!user) {
    dashboardAdminDataLoaded = false;
    viewControls?.classList.add("hidden");
    showGuestState(
      {
        title: "Register to access the dashboard",
        body: "Create a free account to follow company updates and access the team dashboard.",
        actions: [
          { href: "register.html", label: "Register" },
          { href: "login.html", label: "Log in", variant: "secondary" },
        ],
      },
      { keepSidebar: false }
    );
    DASHBOARD_ARTICLES.splice(0, DASHBOARD_ARTICLES.length);
    DOCUMENT_LIBRARY.splice(0, DOCUMENT_LIBRARY.length);
    clearGuestArticlesDisplay();
    clearGuestPodcastsDisplay();
    setGuestArticleEditMode(false);
    setGuestPodcastEditMode(false);
    await loadGuestArticles({ showError: false });
    return;
  }

  const displayName = user.full_name || user.name || user.email || "User";

  if (user.role !== "admin") {
    dashboardAdminDataLoaded = false;
    viewControls?.classList.add("hidden");
    setDashboardViewMode(
      "guest",
      guestViewOptions({ persistPreference: false, keepSidebar: false })
    );
    await loadGuestArticles({ showError: false });
    setGuestArticleEditMode(false);
    setGuestPodcastEditMode(false);
    return;
  }

  viewControls?.classList.remove("hidden");
  const storedViewMode = getStoredDashboardViewMode();
  if (storedViewMode === "guest") {
    setDashboardViewMode(
      "guest",
      guestViewOptions({ persistPreference: false, keepSidebar: true })
    );
  } else {
    setDashboardViewMode("admin", {
      showAdminSections: true,
      persistPreference: false,
      unlockGuestPreview: true,
    });
  }

  await loadDashboardEvents("dashboard-events");

  try {
    if (!dashboardAdminDataLoaded) {
      await refreshDashboardData();
      dashboardAdminDataLoaded = true;
    } else {
      renderAdminTeamNotes("dashboard-team-notes");
      renderAdminCodespaces("dashboard-codespaces");
      renderAdminArticles("dashboard-articles-list");
      renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
      renderAdminPodcasts("dashboard-podcasts-list");
      renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
    }
  } catch (error) {
    renderAdminTeamNotes("dashboard-team-notes");
    renderAdminCodespaces("dashboard-codespaces");
    renderAdminArticles("dashboard-articles-list");
    renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
    renderAdminPodcasts("dashboard-podcasts-list");
    renderGuestPodcasts("guest-podcasts-list", DASHBOARD_PODCASTS);
  }

  bindNoteTaskFormControls();
  bindArticleFormControls();
  bindGuestArticleManagementControls();
  bindGuestPodcastManagementControls();
  bindPodcastFormControls();
  ensureArticleFormRowsInitialized();
  setDashboardEditMode(false);

  if (editToggle && !editToggle.dataset.bound) {
    editToggle.classList.remove("hidden");
    editToggle.addEventListener("click", (event) => {
      event.preventDefault();
      toggleDashboardEditMode();
    });
    editToggle.dataset.bound = "true";
  }

  if (saveButton && !saveButton.dataset.bound) {
    saveButton.addEventListener("click", async () => {
      await saveDashboardState();
    });
    saveButton.dataset.bound = "true";
  }

  if (codespaceStatusSelect && !codespaceStatusSelect.dataset.populated) {
    codespaceStatusSelect.innerHTML = CODESPACE_STATUS_OPTIONS.map(
      ({ value, label }) =>
        `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
    ).join("");
    codespaceStatusSelect.value = "running";
    codespaceStatusSelect.dataset.populated = "true";
  }

  if (codespaceEditorSelect && !codespaceEditorSelect.dataset.populated) {
    codespaceEditorSelect.innerHTML = CODESPACE_EDITOR_OPTIONS.map(
      ({ value, label }) =>
        `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
    ).join("");
    codespaceEditorSelect.value = "vscode";
    codespaceEditorSelect.dataset.populated = "true";
  }

  if (noteForm && !noteForm.dataset.bound) {
    noteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(noteForm);
      const title = String(formData.get("title") || "").trim();
      const body = String(formData.get("body") || "").trim();
      const authorInput = String(formData.get("author") || "").trim();
      const tasks = collectNoteTasks();
      if (!title || !body) {
        showNotification(
          "Add both a title and note content before saving.",
          "warning"
        );
        return;
      }

      const payload = {
        title,
        body,
        author: authorInput || displayName,
        tasks,
      };

      const editingId = noteForm.dataset.editingId;
      const nowIso = new Date().toISOString();
      const clientId = editingId || generateUniqueId("draft-note");
      const normalized = normalizeDashboardNote({
        id: clientId,
        ...payload,
        updated_at: nowIso,
      });
      if (!normalized) {
        showNotification("Unable to stage this note.", "error");
        return;
      }

      const noteStore = getPendingChangeStore("notes");
      const existingOperation = noteStore?.get(clientId);
      const operationType =
        existingOperation?.action === "create"
          ? "create"
          : editingId
          ? "update"
          : "create";

      normalized.pendingAction = operationType;

      const idx = ADMIN_TEAM_NOTES.findIndex((note) => note.id === clientId);
      if (idx >= 0) {
        ADMIN_TEAM_NOTES[idx] = normalized;
      } else {
        ADMIN_TEAM_NOTES.unshift(normalized);
      }

      renderAdminTeamNotes("dashboard-team-notes");
      stageDashboardChange("notes", clientId, operationType, payload);
      resetNoteForm();
      showNotification(
        operationType === "update"
          ? "Note update queued. Click Save changes to publish."
          : "Note queued. Click Save changes to publish.",
        "info",
        operationType === "update" ? "Pending update" : "Pending note"
      );
    });
    noteForm.dataset.bound = "true";
  }

  if (codespaceForm && !codespaceForm.dataset.bound) {
    codespaceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(codespaceForm);
      const project = String(formData.get("project") || "").trim();
      const repository = String(formData.get("repository") || "").trim();
      const branch = String(formData.get("branch") || "").trim();
      const status = String(formData.get("status") || "running")
        .trim()
        .toLowerCase();
      const region = String(formData.get("region") || "").trim();
      const description = String(formData.get("description") || "").trim();
      let url = String(formData.get("url") || "").trim();
      const repoUrl = String(formData.get("repo_url") || "").trim();
      const editor = String(formData.get("editor") || "vscode")
        .trim()
        .toLowerCase();
      if (!project || !repository) {
        showNotification(
          "Project name and repository are required for a codespace.",
          "warning"
        );
        return;
      }
      if (!repository.includes("/")) {
        showNotification(
          "Use the owner/repo format for repository names.",
          "warning"
        );
        return;
      }
      if (!url) {
        const generated = buildCodespaceLauncherUrl(repository, branch, region);
        if (generated) {
          url = generated;
        }
      }

      const payload = {
        project,
        repository,
        branch: branch || null,
        status,
        region: region || null,
        description: description || null,
        url: url || null,
        repo_url: repoUrl || null,
        editor: editor || "vscode",
      };

      const editingId = codespaceForm.dataset.editingId;
      const clientId = editingId || generateUniqueId("draft-codespace");
      const normalized = normalizeDashboardCodespace({
        id: clientId,
        ...payload,
        updated_at: new Date().toISOString(),
      });
      if (!normalized) {
        showNotification("Unable to stage this codespace.", "error");
        return;
      }

      const codespaceStore = getPendingChangeStore("codespaces");
      const existingOperation = codespaceStore?.get(clientId);
      const operationType =
        existingOperation?.action === "create"
          ? "create"
          : editingId
          ? "update"
          : "create";

      normalized.pendingAction = operationType;

      const idx = PROJECT_CODESPACES.findIndex((item) => item.id === clientId);
      if (idx >= 0) {
        PROJECT_CODESPACES[idx] = normalized;
      } else {
        PROJECT_CODESPACES.unshift(normalized);
      }

      renderAdminCodespaces("dashboard-codespaces");
      stageDashboardChange("codespaces", clientId, operationType, payload);
      codespaceForm.reset();
      if (codespaceStatusSelect) {
        codespaceStatusSelect.value = "running";
      }
      if (codespaceEditorSelect) {
        codespaceEditorSelect.value = "vscode";
      }
      delete codespaceForm.dataset.editingId;
      showNotification(
        operationType === "update"
          ? "Codespace update queued. Click Save changes to publish."
          : "Codespace queued. Click Save changes to publish.",
        "info",
        operationType === "update" ? "Pending update" : "Pending codespace"
      );
    });
    codespaceForm.dataset.bound = "true";
  }

  if (viewToggle && !viewToggle.dataset.bound) {
    viewToggle.addEventListener("click", () => {
      if (dashboardViewMode === "admin") {
        setDashboardViewMode(
          "guest",
          guestViewOptions({
            persistPreference: true,
            keepSidebar: true,
            message: {
              title: "Guest preview enabled",
              body: "You're seeing the dashboard exactly as guests experience it. Switch back to restore admin tools.",
            },
          })
        );
        renderGuestArticles("guest-articles-list", DASHBOARD_ARTICLES);
      } else {
        setDashboardViewMode("admin", {
          showAdminSections: true,
          persistPreference: true,
          unlockGuestPreview: true,
        });
        renderAdminTeamNotes("dashboard-team-notes");
        renderAdminCodespaces("dashboard-codespaces");
        renderAdminArticles("dashboard-articles-list");
      }
    });
    viewToggle.dataset.bound = "true";
  }
}

async function onAdminPage() {
  const user = getUser();
  if (!user) {
    location.href = "login.html";
    return;
  }
  if (user.role !== "admin") {
    location.href = "dashboard.html";
    return;
  }

  function setupDatePicker({
    inputId,
    triggerId,
    displayId,
    menuId,
    titleId,
    daysContainerId,
    hourSelectId,
    minuteSelectId,
    labels,
  }) {
    const input = document.getElementById(inputId);
    const trigger = document.getElementById(triggerId);
    const display = document.getElementById(displayId);
    if (!input || !trigger || !display) {
      return { reset: () => {} };
    }

    const menu = menuId ? document.getElementById(menuId) : null;
    const titleEl = titleId ? document.getElementById(titleId) : null;
    const daysContainer = daysContainerId
      ? document.getElementById(daysContainerId)
      : null;
    const hourSelect = hourSelectId
      ? document.getElementById(hourSelectId)
      : null;
    const minuteSelect = minuteSelectId
      ? document.getElementById(minuteSelectId)
      : null;
    const hasCustomMenu = Boolean(
      menu && titleEl && daysContainer && hourSelect && minuteSelect
    );

    if (input.dataset.pickerBound === "true") {
      const placeholderCached = labels?.placeholder || "No date selected";
      return {
        reset: () => {
          input.value = "";
          display.textContent = placeholderCached;
          trigger.classList.remove("date-picker__trigger--has-value");
          if (hasCustomMenu) {
            menu.dataset.open = "false";
            menu.hidden = true;
          }
        },
      };
    }

    const buttonLabel = labels?.button ?? "Select date";
    const placeholder = labels?.placeholder ?? "No date selected";
    trigger.textContent = buttonLabel;
    display.textContent = placeholder;
    trigger.removeAttribute("data-day");
    if (hasCustomMenu) {
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const pad = (value) => String(value).padStart(2, "0");

    const formatForInput = (date) => {
      return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
          date.getDate()
        )}` + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
      );
    };

    const parseInputValue = (value) => {
      if (!value) return null;
      const [datePart, timePart] = value.split("T");
      if (!datePart || !timePart) return null;
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day) ||
        Number.isNaN(hour) ||
        Number.isNaN(minute)
      ) {
        return null;
      }
      return new Date(year, month - 1, day, hour, minute, 0, 0);
    };

    const formatForDisplay = (date) => {
      if (!date) return placeholder;
      if (labels?.formatter) {
        return labels.formatter(date.toISOString());
      }
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    };

    const updateDisplay = () => {
      const parsed = parseInputValue(input.value);
      if (!parsed) {
        display.textContent = placeholder;
        trigger.classList.remove("date-picker__trigger--has-value");
        trigger.removeAttribute("data-day");
        return;
      }
      display.textContent = formatForDisplay(parsed);
      trigger.classList.add("date-picker__trigger--has-value");
      trigger.dataset.day = String(parsed.getDate());
    };

    if (!hasCustomMenu) {
      const reset = () => {
        input.value = "";
        display.textContent = placeholder;
        trigger.classList.remove("date-picker__trigger--has-value");
        trigger.removeAttribute("data-day");
      };

      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (typeof input.showPicker === "function") {
          input.showPicker();
        } else {
          input.focus();
        }
      });

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          trigger.click();
        }
      });

      input.addEventListener("change", updateDisplay);
      input.addEventListener("input", updateDisplay);
      updateDisplay();
      input.dataset.pickerBound = "true";

      return { reset, updateDisplay };
    }

    let selectedDate = null;
    let viewDate = new Date();
    viewDate.setDate(1);

    const populateTimeSelects = () => {
      if (!hourSelect.dataset.populated) {
        const hourFragment = document.createDocumentFragment();
        for (let h = 0; h < 24; h += 1) {
          const option = document.createElement("option");
          option.value = pad(h);
          option.textContent = pad(h);
          hourFragment.appendChild(option);
        }
        hourSelect.appendChild(hourFragment);
        hourSelect.dataset.populated = "true";
      }
      if (!minuteSelect.dataset.populated) {
        const minuteFragment = document.createDocumentFragment();
        for (let m = 0; m < 60; m += 5) {
          const option = document.createElement("option");
          option.value = pad(m);
          option.textContent = pad(m);
          minuteFragment.appendChild(option);
        }
        minuteSelect.appendChild(minuteFragment);
        minuteSelect.dataset.populated = "true";
      }
    };

    populateTimeSelects();

    const clampMinute = (minute) => {
      if (minute < 0) return "00";
      if (minute > 55) return "55";
      return pad(Math.round(minute / 5) * 5);
    };

    const ensureMinuteOption = (minute) => {
      const normalized = clampMinute(minute);
      if (![...minuteSelect.options].some((opt) => opt.value === normalized)) {
        return minuteSelect.options[0]?.value || "00";
      }
      return normalized;
    };

    const today = new Date();

    const renderCalendar = () => {
      if (!daysContainer || !titleEl) return;
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      titleEl.textContent = `${monthNames[month]} ${year}`;

      const firstDayIndex = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const fragment = document.createDocumentFragment();

      for (let padIndex = 0; padIndex < firstDayIndex; padIndex += 1) {
        const placeholder = document.createElement("span");
        placeholder.className =
          "date-picker__day date-picker__day--placeholder";
        placeholder.setAttribute("aria-hidden", "true");
        fragment.appendChild(placeholder);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "date-picker__day";
        button.textContent = String(day);
        button.dataset.year = String(year);
        button.dataset.month = String(month);
        button.dataset.day = String(day);
        button.setAttribute(
          "aria-label",
          `${monthNames[month]} ${day}, ${year}`
        );

        if (
          year === today.getFullYear() &&
          month === today.getMonth() &&
          day === today.getDate()
        ) {
          button.classList.add("date-picker__day--today");
        }

        if (
          selectedDate &&
          year === selectedDate.getFullYear() &&
          month === selectedDate.getMonth() &&
          day === selectedDate.getDate()
        ) {
          button.classList.add("date-picker__day--selected");
        }

        fragment.appendChild(button);
      }

      const totalCellsUsed = firstDayIndex + daysInMonth;
      const trailingPlaceholders =
        totalCellsUsed % 7 === 0 ? 0 : 7 - (totalCellsUsed % 7);

      for (let padIndex = 0; padIndex < trailingPlaceholders; padIndex += 1) {
        const placeholder = document.createElement("span");
        placeholder.className =
          "date-picker__day date-picker__day--placeholder";
        placeholder.setAttribute("aria-hidden", "true");
        fragment.appendChild(placeholder);
      }

      daysContainer.innerHTML = "";
      daysContainer.appendChild(fragment);
    };

    const isMenuOpen = () => menu?.dataset.open === "true";

    function closeMenu() {
      if (!menu) return;
      menu.dataset.open = "false";
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleKeydown, true);
      syncFromInput();
    }

    function openMenu() {
      if (!menu) return;
      syncFromInput();
      menu.dataset.open = "true";
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      document.addEventListener("click", handleDocumentClick, true);
      document.addEventListener("keydown", handleKeydown, true);
    }

    function handleDocumentClick(event) {
      if (!menu || !isMenuOpen()) return;
      if (menu.contains(event.target) || trigger.contains(event.target)) {
        return;
      }
      closeMenu();
    }

    function handleKeydown(event) {
      if (event.key === "Escape" && isMenuOpen()) {
        event.preventDefault();
        closeMenu();
        trigger.focus();
      }
    }

    const syncFromInput = () => {
      const parsed = parseInputValue(input.value);
      selectedDate = parsed;
      const base = parsed || new Date();
      viewDate = new Date(base.getFullYear(), base.getMonth(), 1);

      const hour = pad(base.getHours());
      const minute = ensureMinuteOption(base.getMinutes());
      hourSelect.value = hour;
      minuteSelect.value = minute;
      if (parsed) {
        trigger.dataset.day = String(parsed.getDate());
      } else {
        trigger.removeAttribute("data-day");
      }
      renderCalendar();
    };

    const ensureSelectedDate = () => {
      if (selectedDate) return;
      const daysInView = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        0
      ).getDate();
      const todayOfMonth = Math.min(new Date().getDate(), daysInView);
      selectedDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        todayOfMonth,
        Number(hourSelect.value || "0"),
        Number(minuteSelect.value || "0"),
        0,
        0
      );
    };

    const applySelection = () => {
      ensureSelectedDate();
      if (!selectedDate) return;
      selectedDate.setHours(Number(hourSelect.value || "0"));
      selectedDate.setMinutes(Number(minuteSelect.value || "0"), 0, 0);
      input.value = formatForInput(selectedDate);
      updateDisplay();
      closeMenu();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const clearSelection = ({ close = false, resetView = false } = {}) => {
      const hadValue = Boolean(input.value);
      input.value = "";
      selectedDate = null;
      if (resetView) {
        viewDate = new Date();
        viewDate.setDate(1);
      }
      display.textContent = placeholder;
      trigger.classList.remove("date-picker__trigger--has-value");
      trigger.removeAttribute("data-day");
      hourSelect.value = hourSelect.options[0]?.value || "00";
      minuteSelect.value = minuteSelect.options[0]?.value || "00";
      renderCalendar();
      if (hadValue) {
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (close) {
        closeMenu();
      }
    };

    const resetPicker = () => {
      clearSelection({ close: true, resetView: true });
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (isMenuOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        trigger.click();
      }
    });

    daysContainer.addEventListener("click", (event) => {
      const target = event.target.closest("button.date-picker__day");
      if (!target) return;
      const year = Number(target.dataset.year);
      const month = Number(target.dataset.month);
      const day = Number(target.dataset.day);
      if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return;
      }
      selectedDate = new Date(
        year,
        month,
        day,
        Number(hourSelect.value || "0"),
        Number(minuteSelect.value || "0"),
        0,
        0
      );
      viewDate = new Date(year, month, 1);
      renderCalendar();
      trigger.dataset.day = String(day);
    });

    menu.addEventListener("click", (event) => {
      const actionTarget = event.target.closest("[data-action]");
      if (!actionTarget) return;
      const action = actionTarget.getAttribute("data-action");
      if (action === "prev-month") {
        viewDate.setMonth(viewDate.getMonth() - 1);
        renderCalendar();
      } else if (action === "next-month") {
        viewDate.setMonth(viewDate.getMonth() + 1);
        renderCalendar();
      } else if (action === "set-now") {
        const now = new Date();
        selectedDate = now;
        viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
        hourSelect.value = pad(now.getHours());
        minuteSelect.value = clampMinute(now.getMinutes());
        renderCalendar();
        applySelection();
      } else if (action === "clear") {
        clearSelection();
      } else if (action === "apply") {
        applySelection();
      }
    });

    hourSelect.addEventListener("change", () => {
      ensureSelectedDate();
      selectedDate.setHours(Number(hourSelect.value || "0"));
    });

    minuteSelect.addEventListener("change", () => {
      ensureSelectedDate();
      selectedDate.setMinutes(Number(minuteSelect.value || "0"));
    });

    input.addEventListener("change", updateDisplay);
    input.addEventListener("input", updateDisplay);
    updateDisplay();

    input.dataset.pickerBound = "true";

    return { reset: resetPicker, updateDisplay };
  }

  function setupDurationControl({
    hoursId,
    minutesId,
    displayId,
    defaults = { hours: 1, minutes: 0 },
  }) {
    const hoursSelect = document.getElementById(hoursId);
    const minutesSelect = document.getElementById(minutesId);
    const display = displayId ? document.getElementById(displayId) : null;
    if (!hoursSelect || !minutesSelect) {
      return {
        getMinutes: () => 60,
        reset: () => {},
        updateSummary: () => {},
      };
    }

    if (!hoursSelect.dataset.populated) {
      const fragment = document.createDocumentFragment();
      for (let h = 0; h <= 12; h += 1) {
        const option = document.createElement("option");
        option.value = String(h);
        option.textContent = `${h} ${h === 1 ? "hour" : "hours"}`;
        fragment.appendChild(option);
      }
      hoursSelect.appendChild(fragment);
      hoursSelect.dataset.populated = "true";
    }

    if (!minutesSelect.dataset.populated) {
      const minuteOptions = [0, 15, 30, 45];
      const fragment = document.createDocumentFragment();
      minuteOptions.forEach((value) => {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = `${value.toString().padStart(2, "0")} minutes`;
        fragment.appendChild(option);
      });
      minutesSelect.appendChild(fragment);
      minutesSelect.dataset.populated = "true";
    }

    const ensureValue = (select, candidate, fallback) => {
      const candidateValue = candidate != null ? String(candidate) : null;
      if (
        candidateValue &&
        [...select.options].some((option) => option.value === candidateValue)
      ) {
        select.value = candidateValue;
        return;
      }
      select.value = fallback ?? select.options[0]?.value ?? "0";
    };

    const defaultHours = Number.isFinite(defaults.hours)
      ? Number(defaults.hours)
      : 1;
    const defaultMinutes = Number.isFinite(defaults.minutes)
      ? Number(defaults.minutes)
      : 0;

    const getMinutes = () => {
      const hours = Number(hoursSelect.value || "0");
      const minutes = Number(minutesSelect.value || "0");
      return hours * 60 + minutes;
    };

    const updateSummary = () => {
      if (!display) return;
      const totalMinutes = getMinutes();
      const summary = formatDurationMinutes(totalMinutes, { style: "short" });
      display.textContent = summary || "Select duration";
    };

    const reset = () => {
      ensureValue(hoursSelect, defaultHours, "1");
      ensureValue(minutesSelect, defaultMinutes, "0");
      updateSummary();
    };

    reset();

    hoursSelect.addEventListener("change", () => {
      updateSummary();
    });
    minutesSelect.addEventListener("change", () => {
      updateSummary();
    });

    return { getMinutes, reset, updateSummary };
  }

  // Project management
  const form = document.getElementById("create-project-form");
  const list = document.getElementById("admin-projects");
  renderTeamMemberPicker("proj-team-picker", [], { idPrefix: "proj-team" });
  renderTeamMemberPicker("event-team-picker", [], { idPrefix: "event-team" });
  const eventForm = document.getElementById("create-event-form");
  const eventsList = document.getElementById("admin-events");
  const projectImagePicker = setupFilePicker({
    inputId: "proj-image-file",
    triggerId: "proj-image-file-label",
    filenameId: "proj-image-file-name",
    labels: {
      button: "Select image",
      placeholder: "No image selected",
    },
  });
  const eventDatePicker = setupDatePicker({
    inputId: "event-start",
    triggerId: "event-start-trigger",
    displayId: "event-start-display",
    menuId: "event-start-menu",
    titleId: "event-start-menu-title",
    daysContainerId: "event-start-days",
    hourSelectId: "event-start-hour",
    minuteSelectId: "event-start-minute",
    labels: {
      button: "Select date & time",
      placeholder: "No date selected",
    },
  });
  if (eventDatePicker.updateDisplay) {
    eventDatePicker.updateDisplay();
  }
  const eventDurationControl = setupDurationControl({
    hoursId: "event-duration-hours",
    minutesId: "event-duration-minutes",
    displayId: "event-duration-display",
    defaults: { hours: 1, minutes: 0 },
  });

  async function refreshProjects() {
    const { projects } = await api("/projects");
    const normalized = (projects || []).map(normalizeProject);

    if (!normalized.length) {
      list.innerHTML =
        '<p class="placeholder">No projects yet. Create one above.</p>';
      return;
    }

    list.innerHTML = normalized
      .map((project) => {
        const statusClass = getStatusClass(project.status);
        const teamMarkup = project.team_members.length
          ? `<div class="project-admin-team">${project.team_members
              .map(
                (member) => `<span class="chip">${escapeHtml(member)}</span>`
              )
              .join("")}</div>`
          : "";
        const links = [
          project.github_href
            ? `<a href="${escapeHtml(
                project.github_href
              )}" target="_blank" rel="noopener">GitHub</a>`
            : "",
          project.external_href
            ? `<a href="${escapeHtml(
                project.external_href
              )}" target="_blank" rel="noopener">External</a>`
            : "",
        ].filter(Boolean);
        const linksMarkup = links.length
          ? `<div class="project-admin-links">${links.join(" · ")}</div>`
          : "";
        const imageMarkup = project.image_src
          ? `<img src="${escapeHtml(project.image_src)}" alt="${escapeHtml(
              project.title
            )} thumbnail" class="project-admin-thumb" loading="lazy" />`
          : "";
        const imageFileSizeValue =
          project.image_file_size != null
            ? Number(project.image_file_size)
            : null;
        const imageSizeLabel = Number.isFinite(imageFileSizeValue)
          ? formatFileSize(imageFileSizeValue, { fallback: "" })
          : "";
        const imageFileLabel = project.image_filename
          ? imageSizeLabel
            ? `${project.image_filename} (${imageSizeLabel})`
            : project.image_filename
          : "";
        const imageMetaSections = [];
        if (imageFileLabel) {
          imageMetaSections.push(
            `<div>${escapeHtml(String(imageFileLabel))}</div>`
          );
        }
        if (project.image_mime_type) {
          imageMetaSections.push(
            `<div>${escapeHtml(String(project.image_mime_type))}</div>`
          );
        }
        if (project.image_storage_key) {
          imageMetaSections.push(
            `<div>Storage key: <code>${escapeHtml(
              String(project.image_storage_key)
            )}</code></div>`
          );
        }
        const imageMetaMarkup = imageMetaSections.length
          ? `<div class="file-info project-admin-fileinfo">${imageMetaSections.join(
              ""
            )}</div>`
          : "";
        const knownStatuses = new Set(
          PROJECT_STATUS_OPTIONS.map((option) => option.value)
        );
        let statusOptions = PROJECT_STATUS_OPTIONS.map(
          ({ value, label }) =>
            `<option value="${escapeHtml(value)}" ${
              value === project.status ? "selected" : ""
            }>${escapeHtml(label)}</option>`
        ).join("");
        if (!knownStatuses.has(project.status)) {
          const fallbackValue = project.status || "unknown";
          statusOptions += `<option value="${escapeHtml(
            fallbackValue
          )}" selected>${escapeHtml(formatStatus(project.status))}</option>`;
        }

        return `
          <div class="card project-admin-card" role="listitem" data-project-id="${escapeHtml(
            project.id
          )}">
            <div class="project-admin-header">
              <div>
                <strong>${escapeHtml(project.title)}</strong>
                <span class="status-badge status-${statusClass}">${escapeHtml(
          formatStatus(project.status)
        )}</span>
              </div>
              ${imageMarkup}
            </div>
            ${
              project.description
                ? `<p class="project-admin-description">${escapeHtml(
                    project.description
                  )}</p>`
                : ""
            }
            ${teamMarkup}
            ${imageMetaMarkup}
            ${linksMarkup}
            <div class="project-admin-actions">
              <label class="project-status-manager">
                <span>Status</span>
                <select
                  class="project-status-select"
                  data-id="${escapeHtml(project.id)}"
                  data-current="${escapeHtml(project.status || "")}">
                  ${statusOptions}
                </select>
              </label>
              <button data-id="${
                project.id
              }" data-action="delete">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");
  }
  list?.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.tagName === "BUTTON" && t.dataset.action === "delete") {
      const id = t.dataset.id;
      try {
        await api("/projects/" + id, { method: "DELETE" });
        showNotification("Project deleted successfully!", "success");
        await refreshProjects();
      } catch (error) {
        // Error notification already shown by api() function
      }
    }
  });
  list?.addEventListener("change", async (e) => {
    const target = e.target;
    if (target.classList?.contains("project-status-select")) {
      const id = target.dataset.id;
      const newStatus = target.value;
      if (!id) return;
      const previous = target.dataset.current || "";
      target.disabled = true;
      try {
        await api("/projects/" + id, {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        });
        showNotification("Project status updated", "success");
        target.dataset.current = newStatus;
        await refreshProjects();
      } catch (error) {
        if (previous) {
          target.value = previous;
        }
        // Error notification already shown by api() function
      } finally {
        target.disabled = false;
      }
    }
  });

  async function refreshEvents() {
    if (!eventsList) return;
    try {
      const events = await fetchEvents();
      if (!events || !events.length) {
        eventsList.innerHTML =
          '<p class="placeholder">No events scheduled yet. Create one above.</p>';
        return;
      }
      const { upcoming, past } = splitEvents(events);
      let html = "";
      if (upcoming.length) {
        html += upcoming.map(renderAdminEventCard).join("");
      } else {
        html += '<p class="placeholder">No upcoming events. Add one above.</p>';
      }
      if (past.length) {
        html += `
          <details class="event-archive">
            <summary>View past events (${past.length})</summary>
            <div class="event-archive-list">${past
              .map(renderAdminEventCard)
              .join("")}</div>
          </details>
        `;
      }
      eventsList.innerHTML = html;
    } catch (error) {
      eventsList.innerHTML =
        '<p class="placeholder">Events are unavailable right now.</p>';
    }
  }

  eventsList?.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.dataset?.action === "delete-event") {
      const id = target.dataset.id;
      if (!id) return;
      target.disabled = true;
      try {
        await api(`/events/${id}`, { method: "DELETE" });
        showNotification("Event removed", "success");
        await refreshEvents();
      } catch (error) {
        target.disabled = false;
      }
    } else if (target.dataset?.action === "send-event") {
      const id = target.dataset.id;
      if (!id) return;
      const originalLabel = target.textContent;
      target.disabled = true;
      target.textContent = "Sending...";
      try {
        const response = await api(`/events/${id}/send`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        const sentCount = response?.sent_to?.length || 0;
        const suffix = sentCount === 1 ? "member" : "members";
        const message = sentCount
          ? `Email invites sent to ${sentCount} ${suffix}.`
          : "Email invites sent.";
        showNotification(message, "success", "Email sent");
        if (Array.isArray(response?.sent_to) && response.sent_to.length) {
          const preview = response.sent_to
            .map((email) => escapeHtml(String(email)))
            .slice(0, 4);
          const remainder = response.sent_to.length - preview.length;
          const detail =
            remainder > 0
              ? `${preview.join(", ")} (+${remainder} more)`
              : preview.join(", ");
          if (detail) {
            showNotification(`Sent to: ${detail}`, "info", "Recipients");
          }
        }
        if (response?.missing?.length) {
          showNotification(
            `Missing email addresses for: ${response.missing.join(", ")}`,
            "warning",
            "Some contacts missing"
          );
        }
      } catch (error) {
        // Error notification already shown by api() helper
      } finally {
        target.disabled = false;
        target.textContent = originalLabel;
      }
    } else if (target.dataset?.action === "copy-template") {
      const encoded = target.dataset.template || "";
      try {
        const text = decodeURIComponent(encoded);
        await copyTextToClipboard(text);
      } catch (err) {
        // Silent failure already handled in copyTextToClipboard fallback
      }
    }
  });

  eventForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("event-title").value.trim();
    const description = document
      .getElementById("event-description")
      .value.trim();
    const startAt = document.getElementById("event-start").value;
    const location = document.getElementById("event-location").value.trim();
    const teamMembers = getSelectedTeamMembers("event-team-picker");
    const durationMinutes =
      typeof eventDurationControl?.getMinutes === "function"
        ? eventDurationControl.getMinutes()
        : 60;

    if (!startAt) {
      showNotification("Please choose a date and time", "warning");
      return;
    }

    if (!durationMinutes || durationMinutes <= 0) {
      showNotification(
        "Set a duration greater than zero for this meeting.",
        "warning"
      );
      return;
    }

    const submitBtn = eventForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await api("/events", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          start_at: startAt,
          location,
          team_members: teamMembers,
          duration_minutes: durationMinutes,
        }),
      });
      showNotification(`Event "${title}" created`, "success");
      eventForm.reset();
      eventDatePicker.reset();
      eventDurationControl.reset();
      resetTeamMemberPicker("event-team-picker");
      await refreshEvents();
    } catch (error) {
      // Notification already handled by api()
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("proj-title").value.trim();
    const description = document.getElementById("proj-desc").value.trim();
    const status = document.getElementById("proj-status").value;
    const imageUrlField = document.getElementById("proj-image");
    const manualImageUrl = imageUrlField.value.trim();
    const imageFileInput = document.getElementById("proj-image-file");
    const imageFile = imageFileInput?.files?.[0] || null;
    const githubUrl = document.getElementById("proj-github").value.trim();
    const externalUrl = document.getElementById("proj-external").value.trim();
    const teamMembers = getSelectedTeamMembers("proj-team-picker");

    let imageUrlToUse = manualImageUrl || null;
    let imageMeta = null;

    if (imageFile) {
      try {
        const uploadResult = await uploadProjectImage(imageFile);
        if (uploadResult && typeof uploadResult === "object") {
          imageUrlToUse = uploadResult.url || null;
          imageMeta = uploadResult;
        } else {
          imageUrlToUse = uploadResult || null;
          imageMeta = null;
        }
      } catch (error) {
        return;
      }
    }

    try {
      await api("/projects", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          status,
          image_url: imageUrlToUse,
          image_storage_key: imageMeta?.storage_key || null,
          image_filename: imageMeta?.filename || null,
          image_mime_type: imageMeta?.mime_type || null,
          image_file_size:
            imageMeta?.file_size != null ? imageMeta.file_size : null,
          github_url: githubUrl || null,
          external_url: externalUrl || null,
          team_members: teamMembers,
        }),
      });
      showNotification(`Project "${title}" created successfully!`, "success");
      form.reset();
      projectImagePicker.reset();
      resetTeamMemberPicker("proj-team-picker");
      await refreshProjects();
    } catch (error) {
      // Error notification already shown by api() function
    }
  });

  // Document management
  const docForm = document.getElementById("create-document-form");
  const docList = document.getElementById("admin-documents");
  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("doc-file-upload");
  const documentFilePicker = setupFilePicker({
    inputId: "doc-file-upload",
    triggerId: "doc-file-upload-label",
    filenameId: "doc-file-upload-name",
    labels: {
      button: "Select file",
      placeholder: "No file selected",
    },
  });

  async function refreshDocuments() {
    const docs = await api("/documents");
    docList.innerHTML = docs
      .map(
        (doc) => `
      <div class="card document-admin-card" role="listitem" data-document-id="${escapeHtml(
        doc.id
      )}">
        <strong>${escapeHtml(doc.title)}</strong>
        ${
          doc.description
            ? `<p style="margin: 8px 0; color: #666; font-style: italic;">${escapeHtml(
                doc.description
              )}</p>`
            : ""
        }
        <div>
          <a href="${API_BASE.replace("/api", "")}${doc.url}" target="_blank">
            ${doc.filename ? "Download File" : "View Document"}
          </a>
        </div>
        ${
          doc.filename
            ? `<div class="file-info">
          <small>File: ${escapeHtml(decodeFilename(doc.filename))} ${
                doc.file_size ? `(${(doc.file_size / 1024).toFixed(1)} KB)` : ""
              }</small>
        </div>`
            : ""
        }
        <div>${
          doc.admin_only
            ? '<span class="badge-admin">Admin Only</span>'
            : "Public"
        }</div>
        <small>Created: ${new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
        }).format(new Date(doc.created_at))}</small>
        <button data-id="${doc.id}" data-action="delete-doc">Delete</button>
      </div>
    `
      )
      .join("");
  }

  docForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("doc-title").value.trim();
    const url = document.getElementById("doc-url").value.trim();
    const description = document.getElementById("doc-description").value.trim();
    const adminOnly = document.getElementById("doc-admin-only").checked;

    try {
      await api("/documents", {
        method: "POST",
        body: JSON.stringify({
          title,
          url,
          description: description || null,
          admin_only: adminOnly,
        }),
      });
      showNotification("Document added successfully!", "success");
      docForm.reset();
      await refreshDocuments();
    } catch (error) {
      // Error notification already shown by api() function
    }
  });

  docList?.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.tagName === "BUTTON" && t.dataset.action === "delete-doc") {
      const id = t.dataset.id;
      try {
        await api("/documents/" + id, { method: "DELETE" });
        showNotification("Document deleted successfully!", "success");
        await refreshDocuments();
      } catch (error) {
        // Error notification already shown by api() function
      }
    }
  });

  // File upload handler
  uploadBtn?.addEventListener("click", async () => {
    const file = fileInput.files[0];
    const titleInput = document.getElementById("file-title");
    const descriptionInput = document.getElementById("file-description");
    const adminOnlyInput = document.getElementById("file-admin-only");
    const progressDiv = document.getElementById("upload-progress");
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    if (!file) {
      showNotification("Please select a file first", "warning");
      return;
    }

    // Show progress
    if (progressDiv) {
      progressDiv.classList.remove("hidden");
      progressFill.style.width = "0%";
      progressText.textContent = "Uploading...";
    }

    const formData = new FormData();
    formData.append("document", file);
    if (titleInput.value.trim()) {
      formData.append("title", titleInput.value.trim());
    }
    if (descriptionInput.value.trim()) {
      formData.append("description", descriptionInput.value.trim());
    }
    formData.append("admin_only", adminOnlyInput.checked);

    // Debug: log what we're sending
    console.log("Uploading file with data:");
    console.log("- Title:", titleInput.value.trim() || "[empty]");
    console.log("- Description:", descriptionInput.value.trim() || "[empty]");
    console.log("- Admin Only:", adminOnlyInput.checked);

    try {
      const response = await fetch(API_BASE + "/documents/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showNotification(
          `File "${file.name}" uploaded successfully!`,
          "success",
          "Upload Complete"
        );
        documentFilePicker.reset();
        if (titleInput) titleInput.value = "";
        if (descriptionInput) descriptionInput.value = "";
        if (adminOnlyInput) adminOnlyInput.checked = false;
        await refreshDocuments();
      } else {
        showNotification(
          `Upload failed: ${result.error || "Unknown error"}`,
          "error",
          "Upload Failed"
        );
      }
    } catch (error) {
      showNotification(
        `Upload error: ${error.message}`,
        "error",
        "Network Error"
      );
    } finally {
      // Hide progress
      if (progressDiv) {
        progressDiv.classList.add("hidden");
      }
      if (progressFill) {
        progressFill.style.width = "0%";
      }
      if (progressText) {
        progressText.textContent = "Uploading...";
      }
    }
  });

  await refreshProjects();
  await refreshEvents();
  await refreshDocuments();
}

function renderMembers(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = TEAM_MEMBERS.map(
    ({ name, role, review, image }) => `
      <article class="member-card">
        <div class="member-avatar" style="background-image: url('${image}');"></div>
        <div class="member-body">
          <h4>${name}</h4>
          <p class="member-role">${role}</p>
          <blockquote>“${review}”</blockquote>
        </div>
      </article>
    `
  ).join("");
}

function renderMemberDetails(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = TEAM_MEMBERS.map(
    ({ name, role, bio, tenure, focusAreas, location, contact, image }) => `
      <article class="member-detail-card">
        <div class="member-detail-avatar" style="background-image: url('${image}');"></div>
        <div class="member-detail-body">
          <header>
            <h3>${name}</h3>
            <div class="member-detail-role">${role}</div>
          </header>
          <p class="member-detail-bio">${bio}</p>
          <ul class="member-detail-meta">
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Tenure:</strong> ${tenure}</li>
          </ul>
          <div class="member-detail-focus">
            ${focusAreas
              .map((area) => `<span class="chip">${area}</span>`)
              .join("")}
          </div>
          <div class="member-detail-links">
            <a href="mailto:${contact.email}">Email</a>
            <a href="${
              contact.linkedin
            }" target="_blank" rel="noopener">LinkedIn</a>
          </div>
        </div>
      </article>
    `
  ).join("");
}

let imageLightboxInitialized = false;
let imageLightboxElements = null;
let imageLightboxLastTrigger = null;

function initializeImageLightbox() {
  if (imageLightboxInitialized) return;

  const root = document.getElementById("image-lightbox");
  if (!root) return;

  const imageEl = root.querySelector("[data-lightbox-image]");
  const captionEl = root.querySelector("[data-lightbox-caption]");
  const downloadEl = root.querySelector("[data-lightbox-download]");
  const closeControls = Array.from(
    root.querySelectorAll('[data-action="close-lightbox"]')
  );
  const backdrop = root.querySelector(".image-lightbox__backdrop");

  if (!imageEl || !captionEl || !downloadEl) {
    return;
  }

  imageLightboxElements = {
    root,
    imageEl,
    captionEl,
    downloadEl,
    closeControls,
    backdrop,
    placeholderSrc: imageEl.getAttribute("src") || "",
  };

  imageLightboxInitialized = true;
  let closeTimer = null;

  const setVisibility = (visible) => {
    if (visible) {
      imageLightboxElements.root.hidden = false;
      requestAnimationFrame(() => {
        imageLightboxElements.root.classList.add("image-lightbox--visible");
        imageLightboxElements.root.classList.remove("image-lightbox--closing");
      });
      document.body.dataset.lightboxOpen = "true";
      return;
    }

    imageLightboxElements.root.classList.remove("image-lightbox--visible");
    imageLightboxElements.root.classList.add("image-lightbox--closing");
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      imageLightboxElements.root.hidden = true;
      imageLightboxElements.root.classList.remove("image-lightbox--closing");
      imageLightboxElements.imageEl.setAttribute(
        "src",
        imageLightboxElements.placeholderSrc
      );
      imageLightboxElements.imageEl.setAttribute("alt", "");
    }, 200);
    document.body.removeAttribute("data-lightbox-open");
  };

  const closeLightbox = () => {
    if (!imageLightboxElements || imageLightboxElements.root.hidden) return;
    setVisibility(false);
    const trigger = imageLightboxLastTrigger;
    imageLightboxLastTrigger = null;
    if (trigger && typeof trigger.focus === "function") {
      trigger.focus({ preventScroll: true });
    }
  };

  const openLightbox = ({ src, alt, caption, downloadHref, downloadName }) => {
    if (!src) return;
    window.clearTimeout(closeTimer);
    imageLightboxElements.imageEl.setAttribute("src", src);
    if (alt) {
      imageLightboxElements.imageEl.setAttribute("alt", alt);
    } else {
      imageLightboxElements.imageEl.setAttribute("alt", "");
    }

    if (caption) {
      imageLightboxElements.captionEl.textContent = caption;
      imageLightboxElements.captionEl.classList.remove("hidden");
    } else {
      imageLightboxElements.captionEl.textContent = "";
      imageLightboxElements.captionEl.classList.add("hidden");
    }

    if (downloadHref) {
      imageLightboxElements.downloadEl.classList.remove("hidden");
      imageLightboxElements.downloadEl.setAttribute("href", downloadHref);
      if (downloadName) {
        imageLightboxElements.downloadEl.setAttribute("download", downloadName);
      } else {
        imageLightboxElements.downloadEl.setAttribute("download", "");
      }
    } else {
      imageLightboxElements.downloadEl.classList.add("hidden");
      imageLightboxElements.downloadEl.setAttribute("href", "#");
      imageLightboxElements.downloadEl.removeAttribute("download");
    }

    setVisibility(true);
    const closeButton = imageLightboxElements.root.querySelector(
      ".image-lightbox__close"
    );
    closeButton?.focus({ preventScroll: true });
  };

  const handleTriggerClick = (event) => {
    const trigger = event.target.closest("[data-lightbox-src]");
    if (!trigger) return;
    event.preventDefault();
    const src = trigger.getAttribute("data-lightbox-src") || "";
    if (!src) return;
    const alt = trigger.getAttribute("data-lightbox-alt") || "";
    const caption = trigger.getAttribute("data-lightbox-caption") || "";
    const downloadHref = trigger.getAttribute("data-lightbox-download") || "";
    const downloadName = trigger.getAttribute("data-lightbox-name") || "";
    imageLightboxLastTrigger = trigger;
    openLightbox({ src, alt, caption, downloadHref, downloadName });
  };

  imageLightboxElements.closeControls.forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      closeLightbox();
    });
  });

  imageLightboxElements.backdrop?.addEventListener("click", (event) => {
    event.preventDefault();
    closeLightbox();
  });

  document.addEventListener("click", handleTriggerClick);
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      document.body.dataset.lightboxOpen === "true"
    ) {
      event.preventDefault();
      closeLightbox();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initializeTopbarNavigation();
  updateNav();
  initializeImageLightbox();
  ensureNotificationModalStructure();
  ensureNotificationModalElements();
  switch (window.PAGE) {
    case "home":
      initializeHeroParallax();
      await loadProjects("projects", { layout: "minimal" });
      await loadDocuments("documents");
      renderMembers("members");
      break;
    case "projects":
      initializeHeroParallax();
      await loadProjects("projects", {
        layout: "detailed",
        scrollToHash: true,
      });
      break;
    case "members":
      initializeHeroParallax();
      renderMembers("members-summary");
      renderMemberDetails("member-details");
      break;
    case "login":
      await onLoginPage();
      break;
    case "register":
      await onRegisterPage();
      break;
    case "verify":
      await onVerifyPage();
      break;
    case "dashboard":
      initializeHeroParallax();
      await onDashboardPage();
      break;
    case "admin":
      initializeHeroParallax();
      await onAdminPage();
      break;
    case "contact":
      initializeHeroParallax();
      break;
  }
});
