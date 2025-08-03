import app from './firebaseSetup.js'
import { getFirestore, collection, doc, getDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

const firestore = getFirestore(app)
const blogTitle = document.querySelector('#title')
const subline = document.querySelector('#subline')
const author = document.querySelector('#author')
const body = document.querySelector('#body')

// Function to make author name clickable
function makeAuthorClickable(authorElement, authorName) {
	authorElement.style.color = '#667eea';
	authorElement.style.cursor = 'pointer';
	authorElement.style.textDecoration = 'none';
	authorElement.style.fontWeight = '600';
	authorElement.classList.add('clickable-username');
	
	authorElement.addEventListener('click', async () => {
		// First try to find user by display name, then by username
		try {
			const userQuery = query(
				collection(firestore, 'authors'),
				where('displayName', '==', authorName)
			);
			const querySnapshot = await getDocs(userQuery);
			
			let username = null;
			if (!querySnapshot.empty) {
				username = querySnapshot.docs[0].data().username;
			} else {
				// Try searching by username if display name doesn't match
				const usernameQuery = query(
					collection(firestore, 'authors'),
					where('username', '==', authorName.toLowerCase())
				);
				const usernameSnapshot = await getDocs(usernameQuery);
				if (!usernameSnapshot.empty) {
					username = authorName.toLowerCase();
				}
			}
			
			if (username) {
				window.open(`profile.html?user=${encodeURIComponent(username)}`, '_blank');
			} else {
				alert('Author profile not found');
			}
		} catch (error) {
			console.error('Error finding author:', error);
			alert('Error loading author profile');
		}
	});
	
	authorElement.addEventListener('mouseenter', () => {
		authorElement.style.textDecoration = 'underline';
	});
	
	authorElement.addEventListener('mouseleave', () => {
		authorElement.style.textDecoration = 'none';
	});
}


async function loadBlog() {
	const urlParams = new URLSearchParams(window.location.search);
	console.log('hello')
	const blogId = urlParams.get('blogId')
	const blogRef = doc(firestore, "blogs", blogId)
	console.log('hilo')
	console.log(blogRef)
	const blogSnap = await getDoc(blogRef)
	console.log('ji')

	if (blogSnap.exists()) {
		const blogData = blogSnap.data()
		title.innerText = blogSnap.get('title')
		subline.innerText = blogSnap.get('subline')
		const authorName = blogSnap.get('author')
		author.innerText = authorName
		
		// Make author name clickable
		makeAuthorClickable(author, authorName)
		
		body.innerText = blogSnap.get('body')
	} else {
		console.log('Invalid doc')
	}
}


loadBlog()




