---
---
(function() {

  function clearTokens() {
    window.localStorage.removeItem('rsvpId');
    window.localStorage.removeItem('token');
  }

  function handleError(message) {
    clearTokens();
    alert('Something went wrong! ' + message + ', please contact dcblwedding@hotmail.com');
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
    appId: '{{ site.appId }}'
  });

  firebase.auth().signInWithCustomToken(token)
    .then(function() {
      $('#form-loading-spinner').remove();
      $('#form-info').removeClass('d-none');
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
          var wasValidated = false;

          names.forEach(function(name, index) {
            form.append(singleTemplate.html().replace(/%name%/g, name).replace(/%index%/g, index));
            var radioAccept = $('#person-' + index + '-accept');
            var radioAcceptPartial = $('#person-' + index + '-accept-partial');
            var radioDecline = $('#person-' + index + '-decline');
            var radioLamb = $('#person-' + index + '-lamb');
            var radioFish = $('#person-' + index + '-fish');
            var radioVeg = $('#person-' + index + '-veg');
            var radioLambChild = $('#person-' + index + '-lamb-child');
            var radioFishChild = $('#person-' + index + '-fish-child');
            var radioVegChild = $('#person-' + index + '-veg-child');
            var radioCustomChild = $('#person-' + index + '-custom-child');
            var inputDietary = $('#person-' + index + '-dietary');
            var invalidAttendanceFeedback = $('#person-' + index + '-attendance-feedback');
            var invalidFoodFeedback = $('#person-' + index + '-food-feedback');
            var invalidDietaryFeedback = $('#person-' + index + '-dietary-feedback');

            function handleAttendanceChanged() {
              var shouldUncheckAndDisable = this.value == 'accept-partial' || this.value == 'decline';
              if (shouldUncheckAndDisable) {
                radioLamb.prop('checked', false);
                radioFish.prop('checked', false);
                radioVeg.prop('checked', false);
                radioLambChild.prop('checked', false);
                radioFishChild.prop('checked', false);
                radioVegChild.prop('checked', false);
                radioCustomChild.prop('checked', false);
              }
              radioLamb.prop('disabled', shouldUncheckAndDisable);
              radioFish.prop('disabled', shouldUncheckAndDisable);
              radioVeg.prop('disabled', shouldUncheckAndDisable);
              radioLambChild.prop('disabled', shouldUncheckAndDisable);
              radioFishChild.prop('disabled', shouldUncheckAndDisable);
              radioVegChild.prop('disabled', shouldUncheckAndDisable);
              radioCustomChild.prop('disabled', shouldUncheckAndDisable);
              inputDietary.prop('disabled', shouldUncheckAndDisable);
            }

            function handleParentClicked(jqEle) {
              return function() {
                if (!jqEle.prop('disabled')) {
                  jqEle.prop('checked', true);
                  jqEle.trigger('change');
                  if (wasValidated) {
                    validateAndSubmit(false);
                  }
                }
              };
            }

            radioAccept.change(handleAttendanceChanged);
            radioAcceptPartial.change(handleAttendanceChanged);
            radioDecline.change(handleAttendanceChanged);
            radioAccept.parent().parent().click(handleParentClicked(radioAccept));
            radioAcceptPartial.parent().parent().click(handleParentClicked(radioAcceptPartial));
            radioDecline.parent().parent().click(handleParentClicked(radioDecline));
            radioLamb.parent().parent().click(handleParentClicked(radioLamb));
            radioFish.parent().parent().click(handleParentClicked(radioFish));
            radioVeg.parent().parent().click(handleParentClicked(radioVeg));
            radioLambChild.parent().parent().click(handleParentClicked(radioLambChild));
            radioFishChild.parent().parent().click(handleParentClicked(radioFishChild));
            radioVegChild.parent().parent().click(handleParentClicked(radioVegChild));
            radioCustomChild.parent().parent().click(handleParentClicked(radioCustomChild));

            guestToFieldMap[name] = {
              radioAccept: radioAccept,
              radioAcceptPartial: radioAcceptPartial,
              radioDecline: radioDecline,
              radioLamb: radioLamb,
              radioFish: radioFish,
              radioVeg: radioVeg,
              radioLambChild: radioLambChild,
              radioFishChild: radioFishChild,
              radioVegChild: radioVegChild,
              radioCustomChild: radioCustomChild,
              inputDietary: inputDietary,
              invalidAttendanceFeedback: invalidAttendanceFeedback,
              invalidFoodFeedback: invalidFoodFeedback,
              invalidDietaryFeedback: invalidDietaryFeedback
            };
          });

          form.append(detailTemplate.html());

          var btnSubmitResponse = $('#btn-rsvp-response-submit');
          var btnSubmitResponseLoading = $('#btn-rsvp-response-submit-loading');
          var response = {};

          function setBtnLoading(value) {
            if (value) {
              btnSubmitResponse.addClass('d-none');
              btnSubmitResponseLoading.removeClass('d-none');
            } else {
              btnSubmitResponseLoading.addClass('d-none');
              btnSubmitResponse.removeClass('d-none');
            }
          }

          function validateAndSubmit(submit) {
            form.addClass('was-validated');
            wasValidated = true;

            var anyAccepted = false;
            var firstInvalidJQEle = null;

            for (var i = 0; i < names.length; i++) {
              var name = names[i];
              var accepted = guestToFieldMap[name].radioAccept.prop('checked');
              var acceptedPartial = guestToFieldMap[name].radioAcceptPartial.prop('checked');
              var declined = guestToFieldMap[name].radioDecline.prop('checked');
              var lamb = guestToFieldMap[name].radioLamb.prop('checked');
              var fish = guestToFieldMap[name].radioFish.prop('checked');
              var veg = guestToFieldMap[name].radioVeg.prop('checked');
              var lambChild = guestToFieldMap[name].radioLambChild.prop('checked');
              var fishChild = guestToFieldMap[name].radioFishChild.prop('checked');
              var vegChild = guestToFieldMap[name].radioVegChild.prop('checked');
              var customChild = guestToFieldMap[name].radioCustomChild.prop('checked');
              var dietary = guestToFieldMap[name].inputDietary.val() || '';
              var attendanceFeedback = guestToFieldMap[name].invalidAttendanceFeedback;
              var foodFeedback = guestToFieldMap[name].invalidFoodFeedback;
              var dietaryFeedback = guestToFieldMap[name].invalidDietaryFeedback;

              var validAttendance = accepted || acceptedPartial || declined;
              var validFood = acceptedPartial || declined || lamb || fish || veg || lambChild || fishChild ||vegChild || customChild;
              var validDietary = dietary.length <= 200;

              if (!validAttendance) {
                attendanceFeedback.text('Please select an option');
                attendanceFeedback.addClass('d-block');
                attendanceFeedback.parent().children('.radio-border').removeClass('is-valid');
                attendanceFeedback.parent().children('.radio-border').addClass('is-invalid');
                firstInvalidJQEle = firstInvalidJQEle || guestToFieldMap[name].radioAccept;
              } else {
                attendanceFeedback.removeClass('d-block');
                attendanceFeedback.parent().children('.radio-border').removeClass('is-invalid');
                attendanceFeedback.parent().children('.radio-border').addClass('is-valid');
              }
              if (!validFood) {
                foodFeedback.text('Please select an option above (or below for children under 12)');
                foodFeedback.addClass('d-block');
                foodFeedback.parent().children('.radio-border').removeClass('is-valid');
                foodFeedback.parent().children('.radio-border').addClass('is-invalid');
                firstInvalidJQEle = firstInvalidJQEle || guestToFieldMap[name].radioLamb;
              } else {
                foodFeedback.removeClass('d-block');
                foodFeedback.parent().children('.radio-border').removeClass('is-invalid');
                if (declined) {
                  foodFeedback.parent().children('.radio-border').removeClass('is-valid');
                } else {
                  foodFeedback.parent().children('.radio-border').addClass('is-valid');
                }
              }
              if (!validDietary) {
                dietaryFeedback.text('Must be less than 200 characters');
                dietaryFeedback.addClass('d-block');
                firstInvalidJQEle = firstInvalidJQEle || guestToFieldMap[name].inputDietary;
              } else {
                dietaryFeedback.removeClass('d-block');
              }

              var foodResponse;
              if (accepted) {
                anyAccepted = true;
                foodResponse = lamb
                  ? 'lamb'
                  : fish
                    ? 'fish'
                    : veg
                      ? 'veg'
                      : lambChild
                        ? 'lambChild'
                        : fishChild
                          ? 'fishChild'
                          : vegChild
                            ? 'vegChild'
                            : 'customChild';
              } else {
                foodResponse = '';
              }

              response[name] = {
                accepted: accepted ? 'accepted' : acceptedPartial ? 'partial' : 'declined',
                food: foodResponse,
                dietary: dietary
              };
            }

            if (!submit) {
              return;
            }

            // Only scroll if it's a submission
            if (firstInvalidJQEle) {
              $('html, body').animate({ scrollTop: firstInvalidJQEle.offset().top - 20 });
              return;
            }

            form.removeClass('was-validated');
            wasValidated = false;
            setBtnLoading(true);

            db.collection('responses').doc(rsvpId)
              .set({
                response: response,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
              })
              .then(function() {
                setBtnLoading(false);
                $('#modal .modal-body').text(anyAccepted
                  ? 'Thanks for letting us know, we can\'t wait to celebrate with you! 🎉'
                  : 'Thanks for letting us know, we\'re sorry that you won\'t be coming.');
                $('#modal').on('hide.bs.modal', function() {
                  window.location.href = '/';
                });
                $('#modal').modal('show');
              })
              .catch(function(error) {
                setBtnLoading(false);
                handleFBError('Error 6: Error writing document', error);
              });
          }

          btnSubmitResponse.click(function() {
            validateAndSubmit(true);
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