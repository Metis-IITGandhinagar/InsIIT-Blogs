import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { db } from './firebaseSetup.js'
const blogs = document.querySelector('#blogs')
const loadingIndicator = document.querySelector('#loadingContainer')


async function getBlogs () {
		const querySnapshot = await getDocs(collection(db, "blogsRef"))
		 querySnapshot.forEach((doc) => {
			const docData = doc.data()
			blogs.innerHTML += `<a class="blog" id="${doc.id}" href="/viewBlog?blogId=${docData.blogId}"><img class="blogImage" src="./assets/placeholderImage.jpg"><h3>${docData.title}</h3><p>${docData.subline}</p></a>`
		
		

	  
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
