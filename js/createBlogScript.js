import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import auth from './script.js'
import app from './firebaseSetup.js'

// Toast notification function
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set message
    toastMessage.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

const firestore = getFirestore(app)
const currentUser = auth.currentUser




const form = document.querySelector('#createBlogForm')
form.addEventListener('submit', async (event) => {
	event.preventDefault()
	if (!auth.currentUser) {
		alert('Please log in')
		return
	}


	const formData = new FormData(form)
	const title = formData.get('title')
	const subline = formData.get('subline')
	const body = formData.get('body')
	const author = auth.currentUser.displayName
	try {
		const docRef = await addDoc(collection(firestore, "blogs"), {
				title, 
			subline, 
			body, 
			author,
			authorEmail: auth.currentUser.email, // Store author's email for security
			createdAt: new Date().toISOString() // Add timestamp for sorting/filtering
		})

		const indexRef = await addDoc(collection(firestore, "blogsRef"), {
			title, 
			subline, 
			author, 
			authorEmail: auth.currentUser.email,
			blogId: docRef.id,
			createdAt: new Date().toISOString()
		});

		// Show success toast
		showToast('Blog posted successfully!');
		
		// Reset form
		form.reset();

	} catch (error) {
		console.error('Error creating blog post:', error);
		showToast('Error creating blog post. Please try again.');
	}

})

