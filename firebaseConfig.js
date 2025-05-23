// THIS FILE IS UNNECESSARY AND ONLY FOR WEB APPS - LEAVING IT HERE IF WE DECIDE TO MAKE IT A WEB APP TOO
// I will fill everything out if we make a web app.

import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
// import {...} from 'firebase/database';


// Initialize Firebase
const firebaseConfig = {
  apiKey: 'api-key',
  authDomain: 'project-id.firebaseapp.com',
  databaseURL: 'https://project-id.firebaseio.com',
  projectId: 'fleetman-8613c', // filled in
  storageBucket: 'project-id.appspot.com',
  messagingSenderId: 'sender-id',
  appId: '1:996148492925:android:44dbbca68d2e4f8e4b8f14', // filled in
  measurementId: 'G-measurement-id', // this is for google analytics I turned this off.
};

const app = initializeApp(firebaseConfig);
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
