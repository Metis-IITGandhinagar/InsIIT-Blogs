import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

import app from './firebaseSetup.js'



const auth = getAuth(app)
auth.languageCode = 'en'
const provider = new GoogleAuthProvider()
let currentUser = auth.currentUser
const userIcon = document.querySelector('#userIcon')
const loginButton = document.querySelector('#loginButton')
const logoutButton = document.querySelector('#logoutButton')
const createBlogButton = document.querySelector('#createBlog')

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

async function signInWithGoogle() {
	signInWithPopup(auth, provider)
	  .then((result) => {
	    /** @type {firebase.auth.OAuthCredential} */

	    // This gives you a Google Access Token. You can use it to access the Google API.
	    // The signed-in user info.
	    var user = result.user
	    // IdP data available in result.additionalUserInfo.profile.
	      // ...
	    
	    const firestore = getFirestore(app)
	    return addDoc(collection(firestore, "authors"), {
		    displayName: user.displayName,
		    email: user.email,
		    bio: "Hey there! I'm using IITGN blogs",
		    imageUrl: "https://placehold.jp/150x150.png"
	    })
	    
	  }).then((doc) => {
		  console.log("User saved at:", doc)
	
	  }).catch((error) => {
	    // Handle Errors here.
	    var errorCode = error.code
	    var errorMessage = error.message
	    // The email of the user's account used.
	    var email = error.email
	    // The firebase.auth.AuthCredential type that was used.
	    console.log(error)
	    // ...
	  })
	     
}



auth.onAuthStateChanged((user) => {
	if (user) {
		userIcon.innerHTML = '<div id="logoutButton">Signout</div>'
		userIcon.addEventListener('click', signOutWithGoogle)
		currentUser = user
	} else {
		userIcon.innerHTML = '<div id="loginButton">Sign In</div>'
		userIcon.addEventListener('click', signInWithGoogle)
		currentUser = null
	}
})

// Create Blog button event listener
createBlogButton.addEventListener('click', function() {
	if (currentUser) {
		// User is logged in, navigate to create blog page
		window.location.href = 'createBlog.html';
	} else {
		// User is not logged in, show toast message
		showToast('Please login first!');
	}
});


function signOutWithGoogle() {
	signOut(auth)
}



export default auth
