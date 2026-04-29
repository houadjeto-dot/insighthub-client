const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

async function loadProjectDetails() {
    if (!projectId) {
        document.getElementById('title').innerText = "No project selected.";
        return;
    }

    try {
        const resp = await fetch(`/api/projects/${projectId}`);
        if (!resp.ok) throw new Error("Project not found");
        const project = await resp.json();

        document.getElementById('title').innerText = project.title;
        document.getElementById('abstract').innerText = project.abstractdescrip || '—';
        document.getElementById('studentName').innerText = project.student_name || 'Anonymous';
        document.getElementById('department').innerText = project.department || '—';
        document.getElementById('supervisor').innerText = project.supervisor || '—';
        document.getElementById('year').innerText = project.year || '—';
        document.getElementById('technologies').innerText = project.technologies || 'N/A';

        // Show file / video links if they exist
        const linksSection = document.getElementById('links-section');
        if (linksSection) {
            let linksHTML = '';
            if (project.file_path) {
                linksHTML += `<a href="${project.file_path}" target="_blank" class="button-design">📄 View PDF</a>`;
            }
            if (project.external_link) {
                linksHTML += `<a href="${project.external_link}" target="_blank" class="button-design btn-outline">🔗 External Link</a>`;
            }
            if (project.video_link) {
                linksHTML += `<a href="${project.video_link}" target="_blank" class="button-design btn-outline">🎥 Demo Video</a>`;
            }
            linksSection.innerHTML = linksHTML;
        }

        const contactBtn = document.getElementById('contactBtn');
        if (contactBtn) {
            contactBtn.onclick = () => {
                const subject = encodeURIComponent(`Inquiry about Project: ${project.title}`);
                window.location.href = `mailto:admin@academiccity.edu.gh?subject=${subject}`;
            };
        }

        loadComments();

    } catch (err) {
        console.error("Error loading project details:", err);
        document.getElementById('title').innerText = "Could not load project.";
    }
}

const bookmarkBtn = document.getElementById('bookmarkBtn');
if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', async () => {
        const statusRes = await fetch('/api/user-status');
        const status = await statusRes.json();

        if (!status.loggedIn) {
            alert("Please login to bookmark projects.");
            window.location.href = "auth/login.html";
            return;
        }

        const res = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: status.userId, 
                projectId: projectId 
            })
        });

        if (res.ok) {
            alert("Project successfully bookmarked!");
        } else {
            alert("Failed to bookmark project.");
        }
    });
}

async function loadComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    try {
        const commResp = await fetch(`/api/projects/${projectId}/comments`);
        const comments = await commResp.json();
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="opacity:0.6;">No comments yet. Be the first to post!</p>';
            return;
        }

        commentsList.innerHTML = comments.map(c => `
            <div class="comment-card glass" style="margin-bottom: 12px; padding: 15px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0;">${c.content}</p>
                <small style="opacity: 0.5; font-size: 0.8rem;">Posted on ${new Date(c.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error loading comments:", err);
    }
}

const submitCommentBtn = document.getElementById('submitComment');
if (submitCommentBtn) {
    submitCommentBtn.addEventListener('click', async () => {
        const commentInput = document.getElementById('commentInput');
        const text = commentInput.value.trim();

        if (!text) {
            alert("Please enter a comment.");
            return;
        }

        const res = await fetch(`/api/projects/${projectId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (res.ok) {
            commentInput.value = ''; 
            loadComments(); 
        } else {
            alert("Failed to post comment.");
        }
    });
}

loadProjectDetails();