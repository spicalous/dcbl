(function() {
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

  function validateRSVPId(id) {
    if (!id) {
      return 'Please input an id';
    }
    if (5 < id.length || id.length < 5) {
      return 'RSVP ID must be 5 characters';
    }
    if (!id.match(/[A-Za-z]{5}/)) {
      return 'RSVP ID must only contain letters';
    }
    return '';
  }

  window.onload = function() {
    var PLEASE_CONTACT = ', please contact DCBLwedding@hotmail.com';
    var btnLoading = $('#btn-rsvp-submit-loading');
    var btnSubmit = $('#btn-rsvp-submit');
    var inputRSVPId = $('#input-rsvp-id');

    function setBtnLoading(value) {
      if (value) {
        btnLoading.removeClass('d-none');
        btnSubmit.addClass('d-none');
      } else {
        btnLoading.addClass('d-none');
        btnSubmit.removeClass('d-none');
      }
    }

    function handleError(message) {
      setBtnLoading(false);
      alert(message + PLEASE_CONTACT);
    }

    function handleSuccess(id, token) {
      setBtnLoading(false);
      window.localStorage.setItem('rsvpId', id);
      window.localStorage.setItem('token', token);
      window.location.href = '/rsvp-form';
    }

    btnSubmit.click(function() {
      var id = inputRSVPId.val();
      var form = $('form');
      form.addClass('was-validated');

      var invalidReason = validateRSVPId(id);
      if (invalidReason) {
        $('.invalid-feedback').text(invalidReason);
        return;
      }

      id = id.toUpperCase();
      form.removeClass('was-validated');
      setBtnLoading(true);

      var settings = { dataType: 'json', timeout: 8888 };
      $.ajax('https://us-central1-dcbl-test.cloudfunctions.net/authenticate?id=' + id, settings)
        .done(function(data) {
          if (!(data && data.token)) {
            handleError('Error: Failed to check RSVP ID');
            return;
          }
          firebase.auth().signInWithCustomToken(data.token)
            .then(function() {
              handleSuccess(id, data.token);
            })
            .catch(function(error) {
              handleError('Error: Failed to authenticate RSVP ID, errorCode:' + error.code + ', errorMessage:' + error.message);
            });
        })
        .fail(function(jqXHR) {
          var msg = 'Error: Failed to verify RSVP ID';
          handleError(jqXHR.responseJSON && jqXHR.responseJSON.errorMessage
            ? jqXHR.responseJSON.errorMessage
            : msg);
        });
    });
  };

}());