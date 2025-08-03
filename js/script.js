import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

import app from './firebaseSetup.js'



const auth = getAuth(app)
auth.languageCode = 'en'
const provider = new GoogleAuthProvider()
let currentUser = auth.currentUser
const userIcon = document.querySelector('#userIcon')

// Use event delegation to handle clicks
userIcon.addEventListener('click', (event) => {
	const target = event.target
	if (target.id === 'loginButton') {
		signInWithGoogle()
	} else if (target.id === 'userProfile') {
		window.location.href = 'profile.html'
	}
})

async function signInWithGoogle() {
	try {
		// Disable the button to prevent multiple clicks
		const loginButton = document.querySelector('#loginButton')
		if (loginButton) {
			loginButton.style.opacity = '0.6'
			loginButton.style.pointerEvents = 'none'
		}
		
		const result = await signInWithPopup(auth, provider)
		const user = result.user
		
		const firestore = getFirestore(app)
		
		// Check if user already has a profile
		const authorsRef = collection(firestore, "authors")
		const q = query(authorsRef, where("email", "==", user.email))
		const querySnapshot = await getDocs(q)
		
		if (querySnapshot.empty) {
			// Create new profile only if user doesn't have one
			const doc = await addDoc(collection(firestore, "authors"), {
				displayName: user.displayName,
				email: user.email,
				bio: "",
				imageUrl: user.photoURL || "https://placehold.jp/150x150.png"
			})
			console.log("User profile created at:", doc.id)
		} else {
			console.log("User profile already exists")
		}
	} catch (error) {
		console.error("Sign in error:", error)
		
		// Re-enable the button on error
		const loginButton = document.querySelector('#loginButton')
		if (loginButton) {
			loginButton.style.opacity = '1'
			loginButton.style.pointerEvents = 'auto'
		}
		
		// Show user-friendly error message
		if (error.code === 'auth/popup-closed-by-user') {
			console.log('User cancelled sign-in')
		} else if (error.code === 'auth/popup-blocked') {
			alert('Pop-up was blocked. Please allow pop-ups for this site and try again.')
		} else if (error.code === 'auth/unauthorized-domain') {
			alert('Domain not authorized. Please check Firebase settings.')
		} else {
			console.log('Sign-in error:', error.message)
		}
	}
}



auth.onAuthStateChanged((user) => {
	console.log('Auth state changed:', user ? 'Signed in' : 'Signed out')
	
	if (user) {
		console.log('User signed in:', user.email)
		userIcon.innerHTML = '<div id="userProfile">Profile</div>'
		
		// Show profile link when user is signed in
		const profileLink = document.querySelector('#profileLink')
		if (profileLink) {
			profileLink.style.display = 'block'
		}
	} else {
		console.log('User signed out')
		userIcon.innerHTML = '<div id="loginButton">Sign In</div>'
		currentUser = null
		
		// Hide profile link when user is signed out
		const profileLink = document.querySelector('#profileLink')
		if (profileLink) {
			profileLink.style.display = 'none'
		}
	}
})


async function signOutWithGoogle() {
	try {
		console.log('Signing out...')
		await signOut(auth)
		console.log('Sign out successful')
	} catch (error) {
		console.error('Sign out error:', error)
		alert('Error signing out. Please try again.')
	}
}



export default auth
