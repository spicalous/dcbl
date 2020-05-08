---
---
(function() {
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

  function validateRSVPId(id) {
    if (!id) {
      return 'Please input an id';
    }
    if (5 < id.length || id.length < 5) {
      return 'RSVP ID must be 5 characters';
    }
    if (!id.match(/[A-Za-z0-9]{5}/)) {
      return 'RSVP ID must only contain numbers and letters';
    }
    return '';
  }

  window.onload = function() {
    var btnLoading = $('#btn-rsvp-submit-loading');
    var btnSubmit = $('#btn-rsvp-submit');
    var inputRSVPId = $('#input-rsvp-id');
    var form = $('form');

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
      alert('Something went wrong! ' + message + ', please contact DCBLwedding@hotmail.com');
    }

    function handleSuccess(id, token) {
      setBtnLoading(false);
      window.localStorage.setItem('rsvpId', id);
      window.localStorage.setItem('token', token);
      window.location.href = '/rsvp-form';
    }

    function handleSubmit(event) {
      event.preventDefault();
      var id = (inputRSVPId.val() || '').toUpperCase();
      form.addClass('was-validated');

      var invalidReason = validateRSVPId(id);
      if (invalidReason) {
        $('.invalid-feedback').text(invalidReason);
        return;
      }

      form.removeClass('was-validated');
      setBtnLoading(true);

      var settings = { dataType: 'json', timeout: 8888 };
      $.ajax('{{ site.rsvpIdURL }}' + id, settings)
        .done(function(data) {
          if (!(data && data.token)) {
            handleError('Error 1');
            return;
          }
          handleSuccess(id, data.token);
        })
        .fail(function(jqXHR) {
          var msg = 'Error 2: Failed to find RSVP ID';
          if (jqXHR.responseJSON && jqXHR.responseJSON.errorMessage) {
            msg + ', errorMessage: ' + jqXHR.responseJSON.errorMessage;
          }
          handleError(msg);
        });
    }

    form.on('submit', handleSubmit);
    btnSubmit.click(handleSubmit);
  };

}());