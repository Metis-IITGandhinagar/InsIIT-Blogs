import { getAuth, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

import app from './firebaseSetup.js'

const auth = getAuth(app)
auth.languageCode = 'en'
const provider = new GoogleAuthProvider()
const db = getFirestore(app)
let currentUser = auth.currentUser
const userIcon = document.querySelector('#userIcon')
const userDropdown = document.querySelector('#userDropdown')
const logoutButton = document.querySelector('#logoutButton')
const viewProfileButton = document.querySelector('#viewProfileButton')


// Helper function to generate username from email
function generateUsernameFromEmail(email) {
	if (!email) return '';
	// Extract the part before @ and remove dots and special characters
	return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}
async function signInWithGoogle() {
	signInWithPopup(auth, provider)
	  .then((result) => {
	    // The signed-in user info.
	    var user = result.user
	    
	    const firestore = getFirestore(app)
	    return addDoc(collection(firestore, "authors"), {
		    displayName: user.displayName,
		    email: user.email,
		    username: generateUsernameFromEmail(user.email),
		    bio: "Hey there! I'm using IITGN blogs",
		    imageUrl: user.photoURL || "https://ui-avatars.io/api/?name=" + encodeURIComponent(user.displayName || user.email) + "&background=dd7a7a&color=fff&size=150"
	    })
	    
	  }).then((doc) => {
		  console.log("User saved at:", doc)
	
	  }).catch((error) => {
	    // Handle Errors here.
	    var errorCode = error.code
	    var errorMessage = error.message
	    // The email of the user's account used.
	    var email = error.email
	    console.log(error)
	  })
}

function updateUserInterface(user) {
	if (user) {
		// User is signed in - show profile image and dropdown
		const photoURL = user.photoURL
		const displayName = user.displayName || 'User'
		
		if (photoURL) {
			userIcon.innerHTML = `<img src="${photoURL}" alt="${displayName}" title="${displayName}">`
			userIcon.classList.add('profile-image')
		} else {
			userIcon.innerHTML = displayName.charAt(0).toUpperCase()
			userIcon.classList.remove('profile-image')
		}
		
		// Show the dropdown
		userDropdown.style.display = 'block'
		
	} else {
		// User is signed out - show sign in button
		userIcon.innerHTML = 'Sign In'
		userIcon.classList.remove('profile-image')
		userDropdown.style.display = 'none'
	}
}

auth.onAuthStateChanged((user) => {
	if (user) {
		// User is signed in.
		const uid = user.uid;
		const email = user.email;
		const displayName = user.displayName;

		console.log("User signed in!");
		console.log("User ID:", uid);
		console.log("User Email:", email);
		console.log("User Display Name:", displayName);

		// Update current user reference
		currentUser = user;
		updateUserInterface(user);

		// Update welcome message
		const userEmailElement = document.getElementById("user-email");
		if (userEmailElement) {
			userEmailElement.textContent = `Welcome, ${displayName || email}!`;
		}

		// Remove previous event listeners to avoid duplicates
		userIcon.removeEventListener('click', signInWithGoogle);
		logoutButton.removeEventListener('click', signOutWithGoogle);
		if (viewProfileButton) {
			viewProfileButton.removeEventListener('click', goToProfile);
		}

		// User is signed in - setup logout and profile buttons
		logoutButton.addEventListener('click', signOutWithGoogle);
		if (viewProfileButton) {
			viewProfileButton.addEventListener('click', goToProfile);
		}



		// Load author profile data if on author page
		if (window.location.pathname.includes('author.html')) {
			loadAuthorProfile();
		}

	} else {
		// User is signed out.
		console.log("No user signed in.");
		currentUser = null;
		updateUserInterface(null);

		// Update welcome message
		const userEmailElement = document.getElementById("user-email");
		if (userEmailElement) {
			userEmailElement.textContent = "Please sign in to access all features.";
		}

		// Remove previous event listeners to avoid duplicates
		userIcon.removeEventListener('click', signInWithGoogle);
		logoutButton.removeEventListener('click', signOutWithGoogle);
		if (viewProfileButton) {
			viewProfileButton.removeEventListener('click', goToProfile);
		}

		// User is signed out - clicking userIcon triggers signin
		userIcon.addEventListener('click', signInWithGoogle);
	}
});

function signOutWithGoogle() {
	signOut(auth)
}

function goToProfile() {
	window.location.href = 'profile.html'
}


export default auth
