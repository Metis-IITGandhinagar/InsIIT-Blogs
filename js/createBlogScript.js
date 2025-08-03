import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import app from './firebaseSetup.js'

const firestore = getFirestore(app)
const auth = getAuth(app)
let currentUser = null

// Wait for auth state to be determined
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#createBlogForm')
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault()
            
            if (!currentUser) {
                alert('Please log in to create a blog')
                return
            }

            const formData = new FormData(form)
            const title = formData.get('title')
            const subline = formData.get('subline')
            const body = formData.get('body')
            const author = currentUser.displayName || currentUser.email
            
            try {
                const docRef = await addDoc(collection(firestore, "blogs"), {
                    title, 
                    subline, 
                    body, 
                    author,
                    authorId: currentUser.uid,
                    createdAt: new Date()
                })

                const indexRef = await addDoc(collection(firestore, "blogsRef"), {
                    title, 
                    subline, 
                    author, 
                    blogId: docRef.id,
                    authorId: currentUser.uid,
                    createdAt: new Date()
                })
                
                alert('Blog created successfully!')
                form.reset()
                
            } catch (error) {
                console.error('Error creating blog:', error)
                alert('Error creating blog. Please try again.')
            }
        })
    }
});

