const API = 'https://insighthub-server.onrender.com';

const projectList = document.getElementById('projectList');
const previewArea = document.getElementById('previewArea');

async function fetchProjects() {
    if (!projectList) return;

    const search = document.getElementById('searchInput')?.value || '';
    const keyword = document.getElementById('keywordSearch')?.value || '';
    const tech = document.getElementById('techSearch')?.value || '';
    const dept = document.getElementById('deptFilter')?.value || '';
    const year = document.getElementById('yearFilter')?.value || '';

    const combinedSearch = search || keyword;

    const url = `${API}/api/projects?search=${encodeURIComponent(combinedSearch)}&dept=${encodeURIComponent(dept)}&year=${encodeURIComponent(year)}&tech=${encodeURIComponent(tech)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        projectList.innerHTML = '';
        
        if (data.length === 0) {
            projectList.innerHTML = '<p class="glass-card">No approved projects found.</p>';
            return;
        }

        data.forEach(project => {
            const item = document.createElement('div');
            item.className = 'list-item glass-card';
            item.innerHTML = `
                <h3>${project.title}</h3>
                <p><strong>By:</strong> ${project.student_name || 'Anonymous'}</p>
                <p>${project.department} | ${project.year}</p>
            `;
            
            item.onclick = () => showPreview(project);
            projectList.appendChild(item);
        });
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

function showPreview(project) {
    if (!previewArea) return;
    previewArea.innerHTML = `
        <div class="glass-card preview-content">
            <h2>${project.title}</h2>
            <p><strong>Student:</strong> ${project.student_name}</p>
            <p><strong>Supervisor:</strong> ${project.supervisor}</p>
            <p><strong>Technologies:</strong> ${project.technologies || 'N/A'}</p>
            <p><strong>Abstract:</strong> ${project.abstractdescrip}</p>
            
            <div class="button-group">
                <a href="project.html?id=${project.id}" class="button-design">View Full Details & Comments</a>
                <button onclick="bookmarkProject(${project.id})" class="button-design secondary">Bookmark</button>
                <button onclick="requestAccess(${project.id})" class="button-design secondary">Contact Author</button>
            </div>
        </div>
    `;
}

const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchProjects();
    });
}

document.getElementById('deptFilter')?.addEventListener('change', fetchProjects);
document.getElementById('yearFilter')?.addEventListener('change', fetchProjects);


const submissionForm = document.getElementById('submissionForm');

if (submissionForm) {
    submissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(submissionForm);

        try {
            const response = await fetch(`${API}/api/projects`, {
                method: 'POST',
                credentials: 'include',
                body: formData 
            });

            if (response.ok) {
                alert("Success! Your project has been submitted for admin review.");
                submissionForm.reset();
                window.location.href = "search.html";
            } else {
                const errorData = await response.json();
                alert("Failed to submit: " + (errorData.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Could not connect to server.");
        }
    });
}

async function bookmarkProject(projectId) {
    const statusRes = await fetch(`${API}/api/user-status`, { credentials: 'include' });
    const status = await statusRes.json();

    if (!status.loggedIn) {
        alert("Please login to bookmark projects.");
        window.location.href = "auth/account.html";
        return;
    }

    const res = await fetch(`${API}/api/bookmarks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: status.userId, projectId })
    });

    if (res.ok) alert("Project added to your bookmarks!");
}

function requestAccess(id) { 
    alert("Authorization request sent to the author and supervisor."); 
}

async function loadSingleProject() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    const titleDisplay = document.getElementById('displayTitle'); 
    if (!id || !titleDisplay) return;

    try {
        const res = await fetch(`${API}/api/projects/${id}`);
        const p = await res.json();

        titleDisplay.innerText = p.title;
        document.getElementById('displayAbstract').innerText = p.abstractdescrip;
        document.getElementById('displayStudent').innerText = p.student_name || 'Anonymous';
        document.getElementById('displayDept').innerText = p.department;
        
        const pdfLink = document.getElementById('pdfLink');
        if (p.file_path && pdfLink) pdfLink.href = p.file_path;

    } catch (err) {
        console.error("Error loading project detail:", err);
    }
}

async function initPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id && !document.getElementById('projectList')) {
        try {
            const response = await fetch(`${API}/api/projects/${id}`);
            const project = await response.json();

            if (document.getElementById('displayTitle')) {
                document.getElementById('displayTitle').innerText = project.title;
                document.getElementById('displayAbstract').innerText = project.abstractdescrip;
                document.getElementById('displayStudent').innerText = project.student_name || 'Anonymous';
                document.getElementById('displayDept').innerText = project.department;
                document.getElementById('displayYear').innerText = project.year;
            }
        } catch (err) {
            console.error("Error loading project page:", err);
        }
    } 
    
    else if (document.getElementById('projectList')) {
        fetchProjects();
    }
}

initPage();

if (projectList) {
    fetchProjects();
}