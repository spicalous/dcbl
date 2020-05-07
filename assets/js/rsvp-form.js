(function() {

  function clearTokens() {
    window.localStorage.removeItem('rsvpId');
    window.localStorage.removeItem('token');
  }

  function handleError(message) {
    alert(message);
    clearTokens();
    window.location.href = '/rsvp';
  }

  var rsvpId = window.localStorage.getItem('rsvpId');
  var token = window.localStorage.getItem('token');

  if (!token || !rsvpId) {
    clearTokens();
    window.location.href = '/rsvp';
  }

  firebase.initializeApp({
    apiKey: 'AIzaSyBHXUu-oaBHd94QDzNgHWtP8KfEnGUhkEY',
    authDomain: 'dcbl-test.firebaseapp.com',
    databaseURL: 'https://dcbl-test.firebaseio.com',
    projectId: 'dcbl-test',
    storageBucket: 'dcbl-test.appspot.com',
    messagingSenderId: '129224597683',
    appId: '1:129224597683:web:61f5b19413bb0a0ff9d0c6',
    measurementId: 'G-MCKH3HEWPW'
  });

  firebase.auth().signInWithCustomToken(token)
    .then(function() {
      console.log('success!');
    })
    .catch(function(error) {
      handleError('Error: Failed to authenticate RSVP ID, errorCode:' + error.code + ', errorMessage:' + error.message);
    });

  var db = firebase.firestore();

  db.collection('guests').where('rsvpId', '==', rsvpId)
    .get()
    .then(function(querySnapshot) {
      var form = $('form');
      var singleTemplate = $('#single-rsvp');
      var detailTemplate = $('#rsvp-detail');
      var count = 0;

      querySnapshot.forEach(function(doc) {
        // doc.data() is never undefined for query doc snapshots
        form.prepend(singleTemplate.html().replace(/%name%/g, doc.data().name).replace(/%index%/g, count));
        var radioAccept = $('#person-' + count + '-accept');
        var radioDecline = $('#person-' + count + '-decline');
        var radioLamb = $('#person-' + count + '-lamb');
        var radioFish = $('#person-' + count + '-fish');
        var radioVeg = $('#person-' + count + '-veg');

        function handleAttendanceChanged() {
          if (this.value == 'decline') {
            radioLamb.prop('checked', false);
            radioFish.prop('checked', false);
            radioVeg.prop('checked', false);
          }
          radioLamb.prop('disabled', this.value == 'decline');
          radioFish.prop('disabled', this.value == 'decline');
          radioVeg.prop('disabled', this.value == 'decline');
        }

        radioAccept.change(handleAttendanceChanged);
        radioDecline.change(handleAttendanceChanged);

        count++;
      });

      form.append(detailTemplate.html());
      $('#btn-rsvp-response-submit').click(function() {
        form.addClass('was-validated');

        for (var i = 0; i < count; i++) {
          var accepted = $('#person-' + i + '-accept').prop('checked');
          var declined = $('#person-' + i + '-decline').prop('checked');
          var lamb = $('#person-' + i + '-lamb').prop('checked');
          var fish = $('#person-' + i + '-fish').prop('checked');
          var veg = $('#person-' + i + '-veg').prop('checked');
          var validAttendance = accepted || declined;
          var validFood = declined || (accepted && (lamb || fish || veg));
          if (!validAttendance || !validFood) {
            return;
          }
        }
        console.log('do something');

        // form.removeClass('was-validated');
      });

    })
    .catch(function(error) {
      handleError('Error getting documents, errorCode:' + error.code + ', errorMessage:' + error.message);
    });

}());