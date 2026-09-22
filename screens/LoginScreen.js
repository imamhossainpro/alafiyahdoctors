import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth'; // অথবা firebase/auth
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth as fbAuth } from '../firebase';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Firebase Console থেকে
});

const onGoogleLogin = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const credential = GoogleAuthProvider.credential(userInfo.idToken);
    await signInWithCredential(fbAuth, credential);
  } catch (error) {
    console.error('Login error:', error);
    alert('লগইন ব্যর্থ: ' + error.message);
  }
};