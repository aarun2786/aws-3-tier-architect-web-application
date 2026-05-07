const state = {
    user: null,
    posts: [],
    editingPostId: null,
    searchQuery: "",
};

const localPosts = [
    {
        id: "you-and-me",
        title: "You and Me",
        content: "You bring the ideas, I help shape them into something that works. Step by step, this little blog becomes more useful, more polished, and more yours.",
        author: {
            username: "Codex",
        },
        comment_count: 0,
    },
    {
        id: "dummy-post",
        title: "Dummy Post",
        content: "This is a simple dummy post for testing the blog feed layout, search, and spacing on the home page.",
        author: {
            username: "Demo User",
        },
        comment_count: 0,
    },
];

const elements = {
    authPanel: document.getElementById("auth-panel"),
    authModal: document.getElementById("auth-modal"),
    authTitle: document.getElementById("auth-title"),
    closeAuthModal: document.getElementById("close-auth-modal"),
    composerPanel: document.getElementById("composer-panel"),
    postsList: document.getElementById("posts-list"),
    messageBox: document.getElementById("message-box"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    postForm: document.getElementById("post-form"),
    composerTitle: document.getElementById("composer-title"),
    cancelEdit: document.getElementById("cancel-edit"),
    postSubmit: document.getElementById("post-submit"),
    navNewPost: document.getElementById("nav-new-post"),
    navLogout: document.getElementById("nav-logout"),
    navUser: document.getElementById("nav-user"),
    navUserAvatar: document.getElementById("nav-user-avatar"),
    navUserLabel: document.getElementById("nav-user-label"),
    navSearch: document.getElementById("nav-search"),
    switchRegister: document.getElementById("switch-register"),
    switchLogin: document.getElementById("switch-login"),
};

let messageHideTimer = null;

async function apiFetch(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Request failed");
    }

    return payload;
}

function showMessage(message, tone = "info") {
    if (messageHideTimer) {
        window.clearTimeout(messageHideTimer);
    }

    elements.messageBox.textContent = message;
    elements.messageBox.className = `message-box ${tone}`;
    messageHideTimer = window.setTimeout(clearMessage, 5000);
}

function clearMessage() {
    if (messageHideTimer) {
        window.clearTimeout(messageHideTimer);
        messageHideTimer = null;
    }

    elements.messageBox.textContent = "";
    elements.messageBox.className = "message-box hidden";
}

function formatDate(value) {
    return new Date(value).toLocaleString();
}

function textValue(value) {
    return value == null ? "" : String(value);
}

function excerpt(text, size = 180) {
    text = textValue(text);
    return text.length > size ? `${text.slice(0, size)}...` : text;
}

function userInitial(user) {
    const username = textValue(user?.username).trim();
    return username ? username.charAt(0).toUpperCase() : "";
}

function setAuthTab(mode) {
    const showLogin = mode === "login";
    elements.loginForm.classList.toggle("hidden", !showLogin);
    elements.registerForm.classList.toggle("hidden", showLogin);
    elements.authTitle.textContent = showLogin ? "Sign in" : "Create account";
}

function focusAuthField(mode) {
    const form = mode === "register" ? elements.registerForm : elements.loginForm;
    const input = form.querySelector("input");
    if (input) {
        input.focus();
    }
}

function openAuthModal(mode = "login") {
    setAuthTab(mode);
    elements.authPanel.classList.remove("hidden");
    elements.authModal.classList.remove("hidden");
    window.setTimeout(() => focusAuthField(mode), 0);
}

function closeAuthModal() {
    elements.authModal.classList.add("hidden");
}

function syncPanels() {
    const authenticated = Boolean(state.user);
    elements.authPanel.classList.toggle("hidden", authenticated);
    elements.composerPanel.classList.toggle("hidden", !authenticated);
    elements.navNewPost.classList.toggle("hidden", !authenticated);
    elements.navLogout.classList.toggle("hidden", !authenticated);
    elements.navUser.classList.toggle("authenticated", authenticated);
    elements.navUserLabel.textContent = authenticated ? state.user.username : "Login";
    elements.navUserAvatar.textContent = userInitial(state.user);
    if (authenticated) {
        closeAuthModal();
    }
}

function resetComposer() {
    state.editingPostId = null;
    elements.postForm.reset();
    elements.composerTitle.textContent = "Create a new post";
    elements.postSubmit.textContent = "Publish post";
    elements.cancelEdit.classList.add("hidden");
}

function loadComposer(post) {
    state.editingPostId = post.id;
    elements.postForm.querySelector('[name="title"]').value = post.title;
    elements.postForm.querySelector('[name="content"]').value = post.content;
    elements.composerTitle.textContent = "Edit your post";
    elements.postSubmit.textContent = "Save changes";
    elements.cancelEdit.classList.remove("hidden");
    elements.composerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPosts() {
    if (!state.posts.length) {
        elements.postsList.innerHTML = `<div class="empty-state">No posts yet. Log in and publish the first one.</div>`;
        return;
    }

    const query = state.searchQuery.trim().toLowerCase();
    const posts = query
        ? state.posts.filter((post) => {
            const searchable = [
                post.title,
                post.content,
                post.author?.username,
            ].map(textValue).join(" ").toLowerCase();

            return searchable.includes(query);
        })
        : state.posts;

    if (!posts.length) {
        elements.postsList.innerHTML = `<div class="empty-state">No posts match "${escapeHtml(state.searchQuery)}".</div>`;
        return;
    }

    elements.postsList.innerHTML = posts
        .map(
            (post) => `
                <article class="post-card">
                    <div class="meta-row">
                        <span class="meta-text">By ${escapeHtml(post.author?.username || "Unknown")}</span>
                        <span class="meta-text">${post.comment_count || 0} comments</span>
                    </div>
                    <h4>${escapeHtml(post.title || "Untitled post")}</h4>
                    <p>${escapeHtml(excerpt(post.content))}</p>
                </article>
            `
        )
        .join("");
}

function escapeHtml(value) {
    value = textValue(value);
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

async function loadSession() {
    const payload = await apiFetch("/session");
    state.user = payload.user;
    syncPanels();
}

async function loadPosts() {
    const payload = await apiFetch("/posts");
    if (!Array.isArray(payload.posts)) {
        throw new Error("Invalid API response from /api/posts. Check NGINX /api proxy configuration.");
    }

    state.posts = [...localPosts, ...payload.posts];
    renderPosts();
}

async function handleLogin(event) {
    event.preventDefault();
    clearMessage();
    const formData = new FormData(elements.loginForm);
    const body = JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    try {
        await apiFetch("/auth/login", { method: "POST", body });
        elements.loginForm.reset();
        await loadSession();
        await loadPosts();
        closeAuthModal();
        showMessage("Login successful.", "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearMessage();
    const formData = new FormData(elements.registerForm);
    const body = JSON.stringify({
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        confirm_password: formData.get("confirm_password"),
    });

    try {
        await apiFetch("/auth/register", { method: "POST", body });
        elements.registerForm.reset();
        await loadSession();
        await loadPosts();
        closeAuthModal();
        showMessage("Account created and logged in.", "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function handleLogout() {
    clearMessage();
    try {
        await apiFetch("/auth/logout", { method: "POST" });
        state.user = null;
        syncPanels();
        resetComposer();
        showMessage("Logged out.", "info");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function handlePostSubmit(event) {
    event.preventDefault();
    clearMessage();
    const formData = new FormData(elements.postForm);
    const body = JSON.stringify({
        title: formData.get("title"),
        content: formData.get("content"),
    });

    const isEditing = Boolean(state.editingPostId);
    const path = isEditing ? `/posts/${state.editingPostId}` : "/posts";
    const method = isEditing ? "PUT" : "POST";

    try {
        await apiFetch(path, { method, body });
        resetComposer();
        await loadPosts();
        showMessage(isEditing ? "Post updated." : "Post published.", "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

function attachEvents() {
    elements.switchRegister.addEventListener("click", () => {
        setAuthTab("register");
        focusAuthField("register");
    });
    elements.switchLogin.addEventListener("click", () => {
        setAuthTab("login");
        focusAuthField("login");
    });
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.registerForm.addEventListener("submit", handleRegister);
    elements.postForm.addEventListener("submit", handlePostSubmit);
    elements.navLogout.addEventListener("click", handleLogout);
    elements.navNewPost.addEventListener("click", () => {
        resetComposer();
        elements.composerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    elements.navUser.addEventListener("click", () => {
        if (state.user) {
            elements.composerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        openAuthModal("login");
    });
    elements.closeAuthModal.addEventListener("click", closeAuthModal);
    elements.authModal.addEventListener("click", (event) => {
        if (event.target.hasAttribute("data-close-auth")) {
            closeAuthModal();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !elements.authModal.classList.contains("hidden")) {
            closeAuthModal();
        }
    });
    elements.navSearch.addEventListener("input", (event) => {
        state.searchQuery = event.target.value;
        renderPosts();
    });
    elements.navSearch.closest("form").addEventListener("submit", (event) => {
        event.preventDefault();
        elements.postsList.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    elements.cancelEdit.addEventListener("click", resetComposer);
}

async function bootstrap() {
    attachEvents();
    setAuthTab("login");
    state.posts = [...localPosts];
    renderPosts();

    try {
        await loadSession();
        await loadPosts();
    } catch (error) {
        showMessage(`Unable to reach the API: ${error.message}`, "error");
    }
}

bootstrap();
