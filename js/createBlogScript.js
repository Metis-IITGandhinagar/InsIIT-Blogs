import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { auth, db } from './firebaseSetup.js'




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
		const docRef = await addDoc(collection(db, "blogs"), {
			title, subline, body, author
		})

		const indexRef = await addDoc(collection(db, "blogsRef"), {
			title, subline, author, blogId: docRef.id
		})
		

	} catch (error) {
		console.log(error)
	}

})

