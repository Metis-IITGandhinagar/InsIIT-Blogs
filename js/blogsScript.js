import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import app from './firebaseSetup.js'

console.log('blogsScript.js loaded')
const firestore = getFirestore(app)
const auth = getAuth(app)
const blogs = document.querySelector('#blogs')
const loadingIndicator = document.querySelector('#loadingContainer')

console.log('Firestore instance:', firestore)
console.log('Auth instance:', auth)


async function getBlogs () {
		const querySnapshot = await getDocs(collection(firestore, "blogsRef"))
		 querySnapshot.forEach((doc) => {
			const docData = doc.data()
			// Changed the href to use a relative path instead of absolute
			blogs.innerHTML += `<a class="blog" id="${doc.id}" href="viewBlog.html?blogId=${docData.blogId}"><img class="blogImage" src="./assets/placeholderImage.jpg"><h3>${docData.title}</h3><p>${docData.subline}</p></a>`
		
		

	  
		 })
	hideLoadingIndicator()
	console.log('hi')



}

try {
	getBlogs()
	hideLoadingIndicator()
} catch(error) {
	console.log(error)
}
function hideLoadingIndicator() {
	loadingIndicator.style.display = 'none'
	console.log('l')
	loadingIndicator.style.visibility = 'hidden'
}
