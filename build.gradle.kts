plugins {

  id("com.fleetman.fleetman")

  // Add the Google services Gradle plugin

  id("com.google.gms.google-services")

  ...

  }


dependencies {

  // Import the Firebase BoM

  implementation(platform("com.google.firebase:firebase-bom:33.13.0"))


  // TODO: Add the dependencies for Firebase products you want to use

  // When using the BoM, don't specify versions in Firebase dependencies

  // https://firebase.google.com/docs/android/setup#available-libraries

}
z