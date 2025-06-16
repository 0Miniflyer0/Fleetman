// This file I think is only for web-apps, but I'm not sure.

import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
// import {...} from 'firebase/database';


// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyAsz0bA7E_ZBQdPUDza70lMkFEqX57T-8U', // filled in
  authDomain: 'fleetman-8613c.firebaseapp.com', // filled in
  databaseURL: 'https://fleetman-8613c-default-rtdb.firebaseio.com/', // filled in
  projectId: 'fleetman-8613c', // filled in
  storageBucket: 'fleetman-8613c.appspot.com', // filled in
  messagingSenderId: 'sender-id', // ?
  appId: '1:996148492925:android:44dbbca68d2e4f8e4b8f14', // filled in
  measurementId: 'G-measurement-id', // this is for google analytics I turned this off.
};

const app = initializeApp(firebaseConfig);
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
