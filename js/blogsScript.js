import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import app from './firebaseSetup.js'

const firestore = getFirestore(app)
let blogsContainer = null
let loadingIndicator = null

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    blogsContainer = document.querySelector('#blogs')
    loadingIndicator = document.querySelector('#loadingContainer')
    
    console.log('DOM loaded, starting blog load...')
    
    if (blogsContainer) {
        // Show loading indicator
        showLoadingIndicator()
        
        try {
            await getBlogs()
        } catch(error) {
            console.error('Error loading blogs:', error)
            showErrorMessage('Error loading blogs. Please refresh the page.')
            hideLoadingIndicator()
        }
    } else {
        console.error('Blogs container not found')
    }
})

function showLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex'
        loadingIndicator.style.visibility = 'visible'
    }
}

function hideLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none'
        loadingIndicator.style.visibility = 'hidden'
        loadingIndicator.classList.add('hidden')
    }
}

function showErrorMessage(message) {
    if (blogsContainer) {
        const errorDiv = document.createElement('div')
        errorDiv.style.cssText = 'text-align: center; padding: 40px 20px; color: #e74c3c; font-size: 16px;'
        errorDiv.textContent = message
        blogsContainer.appendChild(errorDiv)
    }
}

function showNoBlogsMessage() {
    if (blogsContainer) {
        const noBlogsDiv = document.createElement('div')
        noBlogsDiv.style.cssText = 'text-align: center; padding: 40px 20px; color: #666; font-size: 16px;'
        noBlogsDiv.innerHTML = `
            <h3>No blogs available yet</h3>
            <p>Be the first to create a blog!</p>
            <a href="createBlog.html" style="color: #667eea; text-decoration: none;">Create Blog →</a>
        `
        blogsContainer.appendChild(noBlogsDiv)
    }
}

async function getBlogs() {
    try {
        console.log('Fetching blogs from Firestore...')
        const querySnapshot = await getDocs(collection(firestore, "blogsRef"))
        
        console.log('Query completed, processing results...')
        
        // Clear existing content first
        const existingBlogs = blogsContainer.querySelectorAll('.blog')
        existingBlogs.forEach(blog => blog.remove())
        
        if (querySnapshot.empty) {
            console.log('No blogs found')
            hideLoadingIndicator()
            showNoBlogsMessage()
            return
        }

        let blogCount = 0
        querySnapshot.forEach((doc) => {
            const docData = doc.data()
            blogCount++
            
            // Create blog card element
            const blogCard = document.createElement('a')
            blogCard.className = 'blog'
            blogCard.id = doc.id
            blogCard.href = `viewBlog.html?blogId=${docData.blogId}`
            
            blogCard.innerHTML = `
                <img class="blogImage" src="./assets/placeholderImage.jpg" alt="Blog Image">
                <div class="blog-content">
                    <h3>${docData.title || 'Untitled'}</h3>
                    <p>${docData.subline || 'No description available'}</p>
                    <span class="author">By ${docData.author || 'Anonymous'}</span>
                </div>
            `
            
            blogsContainer.appendChild(blogCard)
        })
        
        console.log(`${blogCount} blogs loaded successfully`)
        
        // Ensure loading is hidden after all blogs are added
        setTimeout(() => {
            hideLoadingIndicator()
        }, 100)
        
    } catch (error) {
        console.error('Error fetching blogs:', error)
        hideLoadingIndicator()
        showErrorMessage('Error loading blogs. Please check your connection and refresh the page.')
    }
}
