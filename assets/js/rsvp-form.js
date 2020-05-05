(function() {

  function handleError(message) {
    alert(message);
    window.location.href = '/rsvp';
  }

  var token = window.localStorage.getItem('fbtoken');
  debugger;
  if (!token) {
    console.log('unauthenticated');
    window.location.href = '/rsvp';
  }

  firebase.initializeApp({
    apiKey: "AIzaSyBHXUu-oaBHd94QDzNgHWtP8KfEnGUhkEY",
    authDomain: "dcbl-test.firebaseapp.com",
    databaseURL: "https://dcbl-test.firebaseio.com",
    projectId: "dcbl-test",
    storageBucket: "dcbl-test.appspot.com",
    messagingSenderId: "129224597683",
    appId: "1:129224597683:web:61f5b19413bb0a0ff9d0c6",
    measurementId: "G-MCKH3HEWPW"
  });

  firebase.auth().signInWithCustomToken(token)
    .then(function(fbData) {
      console.log('success!');
    })
    .catch(function(error) {
      window.localStorage.remoteItem('fbtoken');
      handleError('Error: Failed to authenticate RSVP ID, errorCode:' + error.code + ', errorMessage:' + error.message);
    });

  window.onload = function() {
  };

}());