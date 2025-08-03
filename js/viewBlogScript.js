import { db } from './firebaseSetup.js'
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
const blogTitle = document.querySelector('#title')
const subline = document.querySelector('#subline')
const author = document.querySelector('#author')
const body = document.querySelector('#body')


async function loadBlog() {
	const urlParams = new URLSearchParams(window.location.search);
	console.log('hello')
	const blogId = urlParams.get('blogId')
	const blogRef = doc(db, "blogs", blogId)
	console.log('hilo')
	console.log(blogRef)
	const blogSnap = await getDoc(blogRef)
	console.log('ji')

	if (blogSnap.exists()) {
		const blogData = blogSnap.data()
		title.innerText = blogSnap.get('title')
		subline.innerText = blogSnap.get('subline')
		author.innerText = blogSnap.get('author')
		body.innerText = blogSnap.get('body')
	} else {
		console.log('Invalid doc')
	}
}


loadBlog()




