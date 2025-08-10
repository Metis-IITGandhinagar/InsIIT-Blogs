import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';
import auth from './script.js';
import app from './firebaseSetup.js';

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

const firestore = getFirestore(app);
const storage = getStorage(app);

let blogData = {
    title: '',
    subtitle: '',
    authorName: '',
    username: '',
    publishDate: '',
    body: '',
    club: ''
};

const blogDetailsStep = document.getElementById('blogDetailsStep');
const blogBodyStep = document.getElementById('blogBodyStep');
const blogDetailsForm = document.getElementById('blogDetailsForm');
const nextToBodyBtn = document.getElementById('nextToBodyStep');
const backToDetailsBtn = document.getElementById('backToDetails');
const blogEditor = document.getElementById('blogEditor');
const editorTitle = document.getElementById('editorTitle');
const publishBtn = document.getElementById('publishBlog');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const loadDraftBtn = document.getElementById('loadDraftBtn');
const linkDialog = document.getElementById('linkDialog');

let currentSelection = { start: 0, end: 0 };

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('publishDate').value = today;
    
    setupMarkdownEditor();
    
    setTimeout(() => {
        if (auth.currentUser) {
            populateUserData();
        }
    }, 1000);

	if (localStorage.getItem('blogDraft')) {
		loadDraftBtn.style.background = '#28a745';
	}
});

function setupMarkdownEditor() {
    blogEditor.contentEditable = false;
    blogEditor.innerHTML = '';
    
    const textarea = document.createElement('textarea');
    textarea.id = 'markdownEditor';
    textarea.className = 'markdown-textarea';
    textarea.placeholder = 'Start writing your blog content here...\n\nYou can use markdown syntax:\n**bold**, *italic*, # Heading, [link](url), ![image](url), etc.';
    textarea.style.cssText = `
        width: 100%;
        min-height: 500px;
        padding: 20px;
        font-size: 1.1rem;
        line-height: 1.7;
        color: #333;
        border: none;
        outline: none;
        resize: vertical;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: transparent;
    `;
    
    blogEditor.appendChild(textarea);
    
    window.markdownEditor = textarea;
    
    textarea.addEventListener('selectionchange', updateSelection);
    textarea.addEventListener('keyup', updateSelection);
    textarea.addEventListener('mouseup', updateSelection);
}

function updateSelection() {
    const textarea = window.markdownEditor;
    currentSelection.start = textarea.selectionStart;
    currentSelection.end = textarea.selectionEnd;
}

function getSelectedText() {
    const textarea = window.markdownEditor;
    return textarea.value.substring(currentSelection.start, currentSelection.end);
}

function insertTextAtCursor(text, selectText = false) {
    const textarea = window.markdownEditor;
    const start = currentSelection.start;
    const end = currentSelection.end;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    textarea.value = beforeText + text + afterText;
    
    if (selectText) {
        textarea.setSelectionRange(start, start + text.length);
    } else {
        textarea.setSelectionRange(start + text.length, start + text.length);
    }
    
    textarea.focus();
    updateSelection();
}

function wrapSelectedText(prefix, suffix = '') {
    const selectedText = getSelectedText();
    const textarea = window.markdownEditor;
    
    if (selectedText) {
        const newText = prefix + selectedText + suffix;
        insertTextAtCursor(newText);
    } else {
        const placeholder = suffix ? 'text' : 'text';
        const newText = prefix + placeholder + suffix;
        insertTextAtCursor(newText, true);
        
        const start = currentSelection.start + prefix.length;
        const end = start + placeholder.length;
        textarea.setSelectionRange(start, end);
    }
}

function insertLine(text) {
    const textarea = window.markdownEditor;
    const beforeCursor = textarea.value.substring(0, currentSelection.start);
    const afterCursor = textarea.value.substring(currentSelection.end);
    
    const atLineStart = beforeCursor.length === 0 || beforeCursor.endsWith('\n');
    const prefix = atLineStart ? '' : '\n';
    const suffix = afterCursor.startsWith('\n') ? '' : '\n';
    
    insertTextAtCursor(prefix + text + suffix);
}

const markdownActions = {
    bold: () => wrapSelectedText('**', '**'),
    italic: () => wrapSelectedText('*', '*'),
    strikethrough: () => wrapSelectedText('~~', '~~'),
    code: () => wrapSelectedText('`', '`'),
    h1: () => insertLine('# Heading 1'),
    h2: () => insertLine('## Heading 2'),
    h3: () => insertLine('### Heading 3'),
    ul: () => insertLine('- List item'),
    ol: () => insertLine('1. List item'),
    quote: () => insertLine('> Quote'),
    codeblock: () => insertLine('```\ncode block\n```'),
    hr: () => insertLine('---'),
    table: () => insertLine('| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |'),
    link: () => showLinkDialog()
};

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('toolbar-btn')) {
        const action = e.target.dataset.md;
        if (action && markdownActions[action]) {
            markdownActions[action]();
        }
    }
});

function showLinkDialog() {
    const selectedText = getSelectedText();
    document.getElementById('linkText').value = selectedText;
    document.getElementById('linkUrl').value = '';
    linkDialog.style.display = 'flex';
    document.getElementById('linkText').focus();
}

function hideDialogs() {
    linkDialog.style.display = 'none';
}

document.getElementById('linkInsert').addEventListener('click', () => {
    const text = document.getElementById('linkText').value || 'link text';
    const url = document.getElementById('linkUrl').value || 'https://';
    const markdown = `[${text}](${url})`;
    insertTextAtCursor(markdown);
    hideDialogs();
});

document.getElementById('linkCancel').addEventListener('click', hideDialogs);

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('md-dialog')) {
        hideDialogs();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideDialogs();
        hidePreview();
    }
});

function showPreview() {
    const markdownContent = window.markdownEditor.value.trim();
    
    if (!markdownContent) {
        showToast('Please write some content to preview', 'error');
        return;
    }
    
    if (typeof window.MarkdownParser === 'undefined') {
        showToast('Markdown parser not loaded. Please refresh the page.', 'error');
        return;
    }
    
    const parser = new window.MarkdownParser();
    const htmlContent = parser.parse(markdownContent);
    
    const title = blogData.title || document.getElementById('title').value || 'Blog Title';
    const subtitle = blogData.subtitle || document.getElementById('subtitle').value || 'Blog Subtitle';
    const author = blogData.authorName || document.getElementById('authorName').value || 'Author';
    const publishDate = blogData.publishDate || document.getElementById('publishDate').value || new Date().toISOString().split('T')[0];
    
    const formattedDate = new Date(publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const previewHTML = `
        <div class="blog-header">
            <h1>${title}</h1>
            <h2 class="blog-subtitle">${subtitle}</h2>
            <div class="blog-meta">
                <span class="author">By ${author}</span> • 
                <span class="date">${formattedDate}</span>
            </div>
        </div>
        <div class="blog-content">
            ${htmlContent}
        </div>
    `;
    
    document.getElementById('previewContent').innerHTML = previewHTML;
    document.getElementById('previewModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hidePreview() {
    document.getElementById('previewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.getElementById('previewBtn').addEventListener('click', showPreview);
document.getElementById('closePreview').addEventListener('click', hidePreview);

document.getElementById('previewModal').addEventListener('click', (e) => {
    if (e.target.id === 'previewModal') {
        hidePreview();
    }
});

function populateUserData() {
    const authorNameInput = document.getElementById('authorName');
    const usernameInput = document.getElementById('username');
    
    if (auth.currentUser) {
        authorNameInput.value = auth.currentUser.displayName || 'Anonymous User';
        usernameInput.value = auth.currentUser.email?.split('@')[0] || 'anonymous';
    }
}

nextToBodyBtn.addEventListener('click', () => {
    if (validateDetailsForm()) {
        saveDetailsData();
        showBodyStep();
    }
});

backToDetailsBtn.addEventListener('click', () => {
    showDetailsStep();
});

function validateDetailsForm() {
    const form = blogDetailsForm;
    const title = form.title.value.trim();
    const subtitle = form.subtitle.value.trim();
    const publishDate = form.publishDate.value;
    const selectedClub = form.querySelector('input[name="club"]:checked');

    if (!title) {
        showToast('Please enter a blog title', 'error');
        return false;
    }

    if (!subtitle) {
        showToast('Please enter a blog subtitle', 'error');
        return false;
    }

    if (!publishDate) {
        showToast('Please select a publish date', 'error');
        return false;
    }

    if (!selectedClub) {
        showToast('Please select a club', 'error');
        return false;
    }

    return true;
}

function saveDetailsData() {
    const form = blogDetailsForm;
    blogData.title = form.title.value.trim();
    blogData.subtitle = form.subtitle.value.trim();
    blogData.authorName = form.authorName.value;
    blogData.username = form.username.value;
    blogData.publishDate = form.publishDate.value;
    blogData.club = form.querySelector('input[name="club"]:checked').value;
}

function showDetailsStep() {
    blogDetailsStep.classList.add('active');
    blogBodyStep.classList.remove('active');
}

function showBodyStep() {
    blogDetailsStep.classList.remove('active');
    blogBodyStep.classList.add('active');
    editorTitle.textContent = blogData.title;
    window.markdownEditor.focus();
}

function saveDraft() {
    const form = blogDetailsForm;
    const draft = {
        title: form.title.value.trim(),
        subtitle: form.subtitle.value.trim(),
        publishDate: form.publishDate.value,
        club: form.querySelector('input[name="club"]:checked')?.value || '',
        body: window.markdownEditor.value.trim()
    };
    
    localStorage.setItem('blogDraft', JSON.stringify(draft));
    showToast('Draft saved successfully!', 'success');
	loadDraftBtn.style.background = '#28a745';
}

function loadDraft() {
    const draftString = localStorage.getItem('blogDraft');
    if (draftString) {
        const draft = JSON.parse(draftString);
        const form = blogDetailsForm;
        
        form.title.value = draft.title || '';
        form.subtitle.value = draft.subtitle || '';
        form.publishDate.value = draft.publishDate || '';
        
        if (draft.club) {
            const clubRadio = form.querySelector(`input[name="club"][value="${draft.club}"]`);
            if (clubRadio) {
                clubRadio.checked = true;
            }
        }
        
        window.markdownEditor.value = draft.body || '';
        
        showToast('Draft loaded successfully!', 'success');
    } else {
        showToast('No saved draft found.', 'error');
    }
}

saveDraftBtn.addEventListener('click', saveDraft);
loadDraftBtn.addEventListener('click', loadDraft);

publishBtn.addEventListener('click', async () => {
    if (!auth.currentUser) {
        showToast('Please log in to publish your blog', 'error');
        return;
    }
    
    const markdownContent = window.markdownEditor.value.trim();
    if (!markdownContent) {
        showToast('Please write some content for your blog', 'error');
        return;
    }
    
    blogData.body = markdownContent;
    
    try {
        publishBtn.disabled = true;
        publishBtn.textContent = 'Submitting...';
        
        let imageUrl = '';
        const imageFile = document.getElementById('coverImage')?.files[0];

        if (imageFile) {
            const storageRef = ref(storage, `blog-images/${Date.now()}-${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }
        
        const docRef = await addDoc(collection(firestore, "blogs"), {
            title: blogData.title,
            subtitle: blogData.subtitle,
            body: blogData.body,
            author: blogData.authorName,
            username: blogData.username,
            publishDate: blogData.publishDate,
            club: blogData.club,
            authorEmail: auth.currentUser.email,
            createdAt: new Date().toISOString(),
            status: 'pending',
            contentType: 'markdown',
            imageUrl: imageUrl
        });

        await addDoc(collection(firestore, "blogsRef"), {
            title: blogData.title,
            subtitle: blogData.subtitle,
            author: blogData.authorName,
            username: blogData.username,
            publishDate: blogData.publishDate,
            club: blogData.club,
            authorEmail: auth.currentUser.email,
            blogId: docRef.id,
            createdAt: new Date().toISOString(),
            status: 'pending',
            contentType: 'markdown',
            imageUrl: imageUrl
        });

        showToast('Blog submitted for review!');
		localStorage.removeItem('blogDraft');
		if (loadDraftBtn) loadDraftBtn.style.background = '#6c757d';
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);

    } catch (error) {
        console.error('Error submitting blog:', error);
        showToast('Error submitting blog. Please try again.', 'error');
    } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Submit for Review';
    }
});

auth.onAuthStateChanged((user) => {
    if (user) {
        populateUserData();
    } else {
        window.location.href = '/index.html';
    }
});
