import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: 'AIzaSyAsz0bA7E_ZBQdPUDza70lMkFEqX57T-8U',
    authDomain: 'fleetman-8613c.firebaseapp.com',
    databaseURL: 'https://fleetman-8613c-default-rtdb.firebaseio.com/',
    projectId: 'fleetman-8613c',
    storageBucket: 'fleetman-8613c.appspot.com',
    messagingSenderId: 'sender-id',
    appId: '1:996148492925:android:44dbbca68d2e4f8e4b8f14',
    measurementId: 'G-measurement-id',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

export { app, database };