document.addEventListener('DOMContentLoaded', () => {
    const pendingList = document.getElementById('pending-blogs-list');
    const reviewedList = document.getElementById('reviewed-blogs-list');

    const mockPendingBlogs = [
        { id: 'blog1', title: 'My First Post on Quantum Computing', author: 'Alex Doe', club: 'Metis' },
        { id: 'blog2', title: 'A Deep Dive into Neural Networks', author: 'Brenda Smith', club: 'Scale' },
        { id: 'blog3', title: 'The Art of Creative Writing', author: 'Charlie Brown', club: 'LitSoc' }
    ];

    const mockReviewedBlogs = [
        { id: 'blog4', title: 'Campus Event Recap', author: 'Diana Prince', club: 'Metis', status: 'published' },
        { id: 'blog5', title: 'Why Rust is the Future', author: 'Alex Doe', club: 'Metis', status: 'rejected' }
    ];

    function renderBlogs() {
        pendingList.innerHTML = '';
        reviewedList.innerHTML = '';

        if (mockPendingBlogs.length > 0) {
            mockPendingBlogs.forEach(blog => {
                pendingList.innerHTML += createBlogItemHTML(blog, true);
            });
        } else {
            pendingList.innerHTML = `<p class="no-blogs-admin">No pending blogs for your clubs.</p>`;
        }

        if (mockReviewedBlogs.length > 0) {
            mockReviewedBlogs.forEach(blog => {
                reviewedList.innerHTML += createBlogItemHTML(blog, false);
            });
        } else {
            reviewedList.innerHTML = `<p class="no-blogs-admin">No blogs have been reviewed yet.</p>`;
        }

        addEventListenersToButtons();
    }

    function createBlogItemHTML(blog, isPending) {
        const actions = isPending
            ? `<button class="approve-btn" data-id="${blog.id}">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                   <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/>
               </svg>
               Approve
           </button>
           <button class="reject-btn" data-id="${blog.id}">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                   <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
               </svg>
               Reject
           </button>`
        : `<span class="status-tag ${blog.status === 'published' ? 'status-approved' : 'status-rejected'}">${blog.status}</span>`;

    return `
        <div class="blog-item" id="item-${blog.id}">
            <div class="blog-item-info">
                <h4><a href="#" onclick="event.preventDefault(); alert('This is a demo link.')">${blog.title}</a></h4>
                <p>By: ${blog.author} | Club: ${blog.club}</p>
            </div>
            <div class="blog-item-actions">
                ${actions}
            </div>
        </div>
    `;
    }

    function addEventListenersToButtons() {
        document.querySelectorAll('.approve-btn, .reject-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const blogItem = e.target.closest('.blog-item');
                const blogId = button.dataset.id;
                const action = button.classList.contains('approve-btn') ? 'approved' : 'rejected';
                
                blogItem.style.transition = 'opacity 0.3s ease';
                blogItem.style.opacity = '0';
                setTimeout(() => {
                    blogItem.remove();
                    if (pendingList.children.length === 0) {
                         pendingList.innerHTML = `<p class="no-blogs-admin">No pending blogs for your clubs.</p>`;
                    }
                }, 300);
                
                alert(`Blog "${blogId}" has been ${action}. (This is a UI demo)`);
            });
        });
    }

    renderBlogs();
});
