const state = {
    user: null,
    posts: [],
    activePostId: null,
    editingPostId: null,
};

const elements = {
    authPanel: document.getElementById("auth-panel"),
    composerPanel: document.getElementById("composer-panel"),
    postsList: document.getElementById("posts-list"),
    postCount: document.getElementById("post-count"),
    sessionState: document.getElementById("session-state"),
    messageBox: document.getElementById("message-box"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    postForm: document.getElementById("post-form"),
    commentForm: document.getElementById("comment-form"),
    detailEmpty: document.getElementById("detail-empty"),
    detailContent: document.getElementById("detail-content"),
    detailTitle: document.getElementById("detail-title"),
    detailAuthor: document.getElementById("detail-author"),
    detailCreated: document.getElementById("detail-created"),
    detailBody: document.getElementById("detail-body"),
    commentsList: document.getElementById("comments-list"),
    ownerActions: document.getElementById("detail-owner-actions"),
    composerTitle: document.getElementById("composer-title"),
    cancelEdit: document.getElementById("cancel-edit"),
    postSubmit: document.getElementById("post-submit"),
    navNewPost: document.getElementById("nav-new-post"),
    navLogout: document.getElementById("nav-logout"),
    navHome: document.getElementById("nav-home"),
    refreshPosts: document.getElementById("refresh-posts"),
    editPost: document.getElementById("edit-post"),
    deletePost: document.getElementById("delete-post"),
    showLogin: document.getElementById("show-login"),
    showRegister: document.getElementById("show-register"),
};

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
    elements.messageBox.textContent = message;
    elements.messageBox.className = `message-box ${tone}`;
}

function clearMessage() {
    elements.messageBox.textContent = "";
    elements.messageBox.className = "message-box hidden";
}

function formatDate(value) {
    return new Date(value).toLocaleString();
}

function excerpt(text, size = 180) {
    return text.length > size ? `${text.slice(0, size)}...` : text;
}

function setAuthTab(mode) {
    const showLogin = mode === "login";
    elements.loginForm.classList.toggle("hidden", !showLogin);
    elements.registerForm.classList.toggle("hidden", showLogin);
    elements.showLogin.classList.toggle("active", showLogin);
    elements.showRegister.classList.toggle("active", !showLogin);
}

function syncPanels() {
    const authenticated = Boolean(state.user);
    elements.authPanel.classList.toggle("hidden", authenticated);
    elements.composerPanel.classList.toggle("hidden", !authenticated);
    elements.navNewPost.classList.toggle("hidden", !authenticated);
    elements.navLogout.classList.toggle("hidden", !authenticated);
    elements.commentForm.classList.toggle("hidden", !authenticated || !state.activePostId);
    elements.ownerActions.classList.toggle("hidden", !authenticated);
    elements.sessionState.textContent = authenticated ? state.user.username : "Guest";
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
    elements.postCount.textContent = String(state.posts.length);
    if (!state.posts.length) {
        elements.postsList.innerHTML = `<div class="empty-state">No posts yet. Log in and publish the first one.</div>`;
        return;
    }

    elements.postsList.innerHTML = state.posts
        .map(
            (post) => `
                <article class="post-card">
                    <div class="meta-row">
                        <span class="meta-text">By ${post.author.username}</span>
                        <span class="meta-text">${post.comment_count} comments</span>
                    </div>
                    <h4>${escapeHtml(post.title)}</h4>
                    <p>${escapeHtml(excerpt(post.content))}</p>
                    <button class="ghost-button" type="button" data-post-id="${post.id}">Read post</button>
                </article>
            `
        )
        .join("");
}

function renderPostDetail(post) {
    state.activePostId = post.id;
    elements.detailEmpty.classList.add("hidden");
    elements.detailContent.classList.remove("hidden");
    elements.detailTitle.textContent = post.title;
    elements.detailAuthor.textContent = `By ${post.author.username}`;
    elements.detailCreated.textContent = formatDate(post.created_at);
    elements.detailBody.textContent = post.content;
    elements.commentForm.classList.toggle("hidden", !state.user);

    const ownsPost = state.user && state.user.id === post.author.id;
    elements.ownerActions.classList.toggle("hidden", !ownsPost);

    if (!post.comments.length) {
        elements.commentsList.innerHTML = `<div class="empty-state">No comments yet. Start the conversation.</div>`;
    } else {
        elements.commentsList.innerHTML = post.comments
            .map(
                (comment) => `
                    <div class="comment-card">
                        <p>${escapeHtml(comment.content)}</p>
                        <span class="meta-text">${comment.author.username} on ${formatDate(comment.created_at)}</span>
                    </div>
                `
            )
            .join("");
    }
}

function escapeHtml(value) {
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
    state.posts = payload.posts;
    renderPosts();

    if (state.activePostId) {
        const exists = state.posts.some((post) => post.id === state.activePostId);
        if (!exists) {
            state.activePostId = null;
            elements.detailContent.classList.add("hidden");
            elements.detailEmpty.classList.remove("hidden");
            elements.detailTitle.textContent = "Select a post";
        }
    }
}

async function loadPost(postId) {
    const payload = await apiFetch(`/posts/${postId}`);
    renderPostDetail(payload.post);
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
        if (state.activePostId) {
            await loadPost(state.activePostId);
        }
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
        const payload = await apiFetch(path, { method, body });
        resetComposer();
        await loadPosts();
        await loadPost(payload.post.id);
        showMessage(payload.message, "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function handleCommentSubmit(event) {
    event.preventDefault();
    clearMessage();
    if (!state.activePostId) {
        return;
    }

    const formData = new FormData(elements.commentForm);
    const body = JSON.stringify({ content: formData.get("content") });

    try {
        const payload = await apiFetch(`/posts/${state.activePostId}/comments`, { method: "POST", body });
        elements.commentForm.reset();
        renderPostDetail(payload.post);
        await loadPosts();
        showMessage(payload.message, "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function handleDeletePost() {
    clearMessage();
    if (!state.activePostId) {
        return;
    }

    try {
        await apiFetch(`/posts/${state.activePostId}`, { method: "DELETE" });
        state.activePostId = null;
        elements.detailContent.classList.add("hidden");
        elements.detailEmpty.classList.remove("hidden");
        elements.detailTitle.textContent = "Select a post";
        await loadPosts();
        showMessage("Post deleted.", "info");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

function attachEvents() {
    elements.showLogin.addEventListener("click", () => setAuthTab("login"));
    elements.showRegister.addEventListener("click", () => setAuthTab("register"));
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.registerForm.addEventListener("submit", handleRegister);
    elements.postForm.addEventListener("submit", handlePostSubmit);
    elements.commentForm.addEventListener("submit", handleCommentSubmit);
    elements.navLogout.addEventListener("click", handleLogout);
    elements.navNewPost.addEventListener("click", () => {
        resetComposer();
        elements.composerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    elements.navHome.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    elements.refreshPosts.addEventListener("click", async () => {
        clearMessage();
        await loadPosts();
        showMessage("Posts refreshed.", "info");
    });
    elements.cancelEdit.addEventListener("click", resetComposer);
    elements.editPost.addEventListener("click", async () => {
        if (!state.activePostId) {
            return;
        }

        try {
            const payload = await apiFetch(`/posts/${state.activePostId}`);
            loadComposer(payload.post);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
    elements.deletePost.addEventListener("click", handleDeletePost);

    elements.postsList.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-post-id]");
        if (!button) {
            return;
        }

        clearMessage();
        try {
            await loadPost(button.dataset.postId);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function bootstrap() {
    attachEvents();
    setAuthTab("login");

    try {
        await loadSession();
        await loadPosts();
    } catch (error) {
        showMessage(`Unable to reach the API: ${error.message}`, "error");
    }
}

bootstrap();
