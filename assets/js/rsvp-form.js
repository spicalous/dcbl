---
---
(function() {

  function clearTokens() {
    window.localStorage.removeItem('rsvpId');
    window.localStorage.removeItem('token');
  }

  function handleError(message) {
    clearTokens();
    alert('Something went wrong! ' + message + ', please contact DCBLwedding@hotmail.com');
    window.location.href = '/rsvp';
  }

  function handleFBError(msg, error) {
    if (error.code) {
      msg = msg + ', errorCode: ' + error.code;
    }
    if (error.message) {
      msg = msg + ', errorMessage: ' + error.message;
    }
    handleError(msg);
  }


  var rsvpId = window.localStorage.getItem('rsvpId');
  var token = window.localStorage.getItem('token');

  if (!token || !rsvpId) {
    clearTokens();
    window.location.href = '/rsvp';
  }

  firebase.initializeApp({
    apiKey: '{{ site.apiKey }}',
    authDomain: '{{ site.authDomain }}',
    databaseURL: '{{ site.databaseURL }}',
    projectId: '{{ site.projectId }}',
    storageBucket: '{{ site.storageBucket }}',
    messagingSenderId: '{{ site.messagingSenderId }}',
    appId: '{{ site.appId }}',
    measurementId: '{{ site.measurementId }}'
  });

  firebase.auth().signInWithCustomToken(token)
    .then(function() {

      var db = firebase.firestore();

      db.collection('guests').doc(rsvpId)
        .get()
        .then(function(doc) {
          if (!doc.exists) {
            handleError('Error 4: Guest document data does not exist');
          }

          var form = $('form');
          var singleTemplate = $('#single-rsvp');
          var detailTemplate = $('#rsvp-detail');
          var names = doc.data().names;
          var guestToFieldMap = {};

          names.forEach(function(name, index) {
            form.append(singleTemplate.html().replace(/%name%/g, name).replace(/%index%/g, index));
            var radioAccept = $('#person-' + index + '-accept');
            var radioDecline = $('#person-' + index + '-decline');
            var radioLamb = $('#person-' + index + '-lamb');
            var radioFish = $('#person-' + index + '-fish');
            var radioVeg = $('#person-' + index + '-veg');
            var inputDietary = $('#person-' + index + '-dietary');

            function handleAttendanceChanged() {
              if (this.value == 'decline') {
                radioLamb.prop('checked', false);
                radioFish.prop('checked', false);
                radioVeg.prop('checked', false);
              }
              radioLamb.prop('disabled', this.value == 'decline');
              radioFish.prop('disabled', this.value == 'decline');
              radioVeg.prop('disabled', this.value == 'decline');
              inputDietary.prop('disabled', this.value == 'decline');
            }

            radioAccept.change(handleAttendanceChanged);
            radioDecline.change(handleAttendanceChanged);

            guestToFieldMap[name] = {
              radioAccept: radioAccept,
              radioDecline: radioDecline,
              radioLamb: radioLamb,
              radioFish: radioFish,
              radioVeg: radioVeg,
              inputDietary: inputDietary
            };
          });

          form.append(detailTemplate.html());

          var selectChildren = $('#select-children');
          var response = {};

          $('#btn-rsvp-response-submit').click(function() {
            form.addClass('was-validated');

            for (var i = 0; i < names.length; i++) {
              var name = names[i];
              var accepted = guestToFieldMap[name].radioAccept.prop('checked');
              var declined = guestToFieldMap[name].radioDecline.prop('checked');
              var lamb = guestToFieldMap[name].radioLamb.prop('checked');
              var fish = guestToFieldMap[name].radioFish.prop('checked');
              var veg = guestToFieldMap[name].radioVeg.prop('checked');
              var dietary = guestToFieldMap[name].inputDietary.val() || '';

              var validAttendance = accepted || declined;
              var validFood = declined || (accepted && (lamb || fish || veg));
              var validDietary = dietary.length <= 200;
              if (!validAttendance || !validFood || !validDietary) {
                return;
              }

              var foodResponse;
              if (accepted) {
                foodResponse = lamb
                  ? 'lamb'
                  : fish
                    ? 'fish'
                    : 'veg';
              } else {
                foodResponse = '';
              }

              response[name] = {
                accepted: !!accepted,
                food: foodResponse,
                dietary: dietary
              };
            }

            db.collection('responses').doc(rsvpId)
              .set({
                response: response,
                children: selectChildren.val() || '0',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
              })
              .then(function() {
                console.log('Document successfully written!');
              })
              .catch(function(error) {
                handleFBError('Error 6: Error writing document', error);
              });

            form.removeClass('was-validated');
          });

        })
        .catch(function(error) {
          handleFBError('Error 5: Error getting documents', error);
        });
    })
    .catch(function(error) {
      handleFBError('Error 3: Failed to authenticate RSVP ID', error);
    });
}());