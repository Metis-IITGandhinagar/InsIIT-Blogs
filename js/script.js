import { signOut, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { collection, addDoc, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { auth, db } from './firebaseSetup.js'

const provider = new GoogleAuthProvider()
let currentUser = auth.currentUser
const userIcon = document.querySelector('#userIcon')

async function signInWithGoogle() {
	try {
		const result = await signInWithPopup(auth, provider)
		const user = result.user
		
		// Check if user already exists in Firestore
		const userDocRef = doc(db, "authors", user.uid)
		const userDoc = await getDoc(userDocRef)
		
		if (!userDoc.exists()) {
			// Create new user profile
			await setDoc(userDocRef, {
				displayName: user.displayName,
				email: user.email,
				bio: "Hey there! I'm using IITGN blogs",
				imageUrl: user.photoURL || "https://placehold.jp/150x150.png",
				uid: user.uid,
				createdAt: new Date()
			})
			console.log("New user profile created")
		} else {
			console.log("User profile already exists")
		}
		
		// Force a page reload to update the UI
		window.location.reload()
	} catch (error) {
		console.error("Sign in error:", error)
	}
}

auth.onAuthStateChanged(async (user) => {
	if (user) {
		// Show loading state
		userIcon.innerHTML = '<div class="loading-btn">Loading...</div>'
		
		try {
			// Check if user profile exists in Firestore
			const userDocRef = doc(db, "authors", user.uid)
			const userDoc = await getDoc(userDocRef)
			
			if (userDoc.exists()) {
				// User profile exists, show full menu
				userIcon.innerHTML = `
					<div class="user-menu">
						<img src="${user.photoURL || 'https://placehold.jp/150x150.png'}" alt="Profile" class="user-avatar">
						<div class="user-dropdown">
							<div class="user-info">
								<span class="user-name">${user.displayName}</span>
								<span class="user-email">${user.email}</span>
							</div>
							<div class="user-actions">
								<button id="profileButton" class="profile-btn">Profile</button>
								<button id="logoutButton" class="logout-btn">Sign Out</button>
							</div>
						</div>
					</div>
				`
				
				// Add event listeners
				document.getElementById('logoutButton').addEventListener('click', signOutWithGoogle)
				document.getElementById('profileButton').addEventListener('click', () => {
					console.log('Profile button clicked, navigating to profile.html')
					window.location.href = 'profile.html'
				})
			} else {
				// User profile doesn't exist, show sign in button
				console.log('User profile not found, showing sign in button')
				userIcon.innerHTML = '<div id="loginButton" class="login-btn">Sign In with Google</div>'
				document.getElementById('loginButton').addEventListener('click', signInWithGoogle)
			}
		} catch (error) {
			console.error('Error checking user profile:', error)
			// On error, show sign in button
			userIcon.innerHTML = '<div id="loginButton" class="login-btn">Sign In with Google</div>'
			document.getElementById('loginButton').addEventListener('click', signInWithGoogle)
		}
		
		currentUser = user
	} else {
		userIcon.innerHTML = '<div id="loginButton" class="login-btn">Sign In with Google</div>'
		document.getElementById('loginButton').addEventListener('click', signInWithGoogle)
		currentUser = null
	}
})

function signOutWithGoogle() {
	signOut(auth).then(() => {
		console.log("User signed out")
	}).catch((error) => {
		console.error("Sign out error:", error)
	})
}

export { auth, currentUser }
