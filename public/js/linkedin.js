function onLinkedInLoad() {
  IN.Event.on("linkedin", "click", startLinkedinSharing);
}

function startLinkedinSharing() {
    IN.User.authorize(doLinkedinSharing)
}

function doLinkedinSharing() {
  IN.API.Raw("/people/~/shares")
    .method("POST")
    .body( JSON.stringify( {
        "content": {
          "submitted-url": $('#youtubeLink a').attr('href'),
          "title": "My Video Resume",
          "description": "Please view my video resume that was created with the Photohack Resume builder tool.",
          "submitted-image-url": "http://photohack.herokuapp.com/img/recruitde-icon.png"
        },
        "visibility": {
          "code": "anyone"
        },
        "comment": "This is a test posting from the Photohack hackathon."
      })
    )
    .result(function(r) {
      alert("POST OK");
    })
    .error(function(r) {
      alert("POST FAIL");
    });
}
