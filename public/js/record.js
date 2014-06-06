(function(exports) {

exports.URL = exports.URL || exports.webkitURL;

exports.requestAnimationFrame = exports.requestAnimationFrame ||
    exports.webkitRequestAnimationFrame || exports.mozRequestAnimationFrame ||
    exports.msRequestAnimationFrame || exports.oRequestAnimationFrame;

exports.cancelAnimationFrame = exports.cancelAnimationFrame ||
    exports.webkitCancelAnimationFrame || exports.mozCancelAnimationFrame ||
    exports.msCancelAnimationFrame || exports.oCancelAnimationFrame;

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

var ORIGINAL_DOC_TITLE = document.title;
var video = $('video#webcam');
var canvas = $('<canvas></canvas>'); // offscreen canvas.
var rafId = null;
var timeoutId = null;
var startTime = null;
var endTime = null;
var frames = [];
var audioWav;
var webcamStream;
var startFade;
var startTimer;
var timer;

function toggleActivateRecordButton() {

  var b = $('#record-me');
  b.html(b.attr('disabled') ? '<span class="glyphicon glyphicon-record"> Record</span>' : '<span class="glyphicon glyphicon-record"> Recording</span>');

  b.toggleClass('recording');
  b.attr('disabled', !b.attr('disabled'));

}

function turnOnCamera() {
  $('#record-me').attr('disabled', false);

  video.attr({
    autoplay: true,
    controls: false,
    loop: false
  });
  video[0].onloadeddata = function() {
      video[0].muted = true;
  }

  var finishVideoSetup_ = function() {
    // Note: video.onloadedmetadata doesn't fire in Chrome when using getUserMedia so
    // we have to use setTimeout. See crbug.com/110938.
    setTimeout(function() {
      $('#video-controls').removeClass('hide');
      $('#instructions').text('Now get ready to record and hit the Record button below when you are ready to go.  You\'ll receive a series of prompts to respond to.  Hit stop when you are done.');
      video.width(480);//video.clientWidth;
      video.height(360);// video.clientHeight;
      // Canvas is 1/2 for performance. Otherwise, getImageData() readback is
      // awful 100ms+ as 640x480.
      canvas[0].width = 480;
      canvas[0].height = 360;
    }, 1);
  };

  if (webcamStream) {
    video.attr('src', window.URL.createObjectURL(webcamStream));
    finishVideoSetup_();
    audioInit(webcamStream);
  } else {
    navigator.getUserMedia({video: true, audio: true}, function(stream) {
      webcamStream = stream;
      video.attr('src', window.URL.createObjectURL(webcamStream));
      finishVideoSetup_();
      audioInit(webcamStream);
    }, function(e) {
      console.log(e);
      alert('Fine, you get a movie instead of your beautiful face ;)');

      video.attr('src', '/capture.webm');
      finishVideoSetup_();
    });
  }
};

function record() {
  countdowntimer2();
  turnOnCamera();

  frames = []; // clear existing frames;
  startTime = Date.now();

  toggleActivateRecordButton();
  $('#stop-me').attr('disabled', false);

  rafId = requestAnimationFrame(drawVideoFrame_);
  keepDrawing();
  startRecording();
};

function drawVideoFrame_(time) {
  var CANVAS_HEIGHT = 360;
  var CANVAS_WIDTH = 480;
  var ctx = canvas[0].getContext('2d');

  var logoImage = new Image();
  logoImage.src = '../img/recruitMe.svg';

  ctx.drawImage(video[0], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(logoImage, 295, 5, 180,75);
  ctx.lineWidth=5;
  ctx.fillStyle="#ffffff";
  ctx.lineStyle="#000000";
  ctx.font="24px sans-serif";
  ctx.fillText($('#prompt_name').val(), 20, 300);
  ctx.font="18px sans-serif";
  ctx.fillText($('#prompt_title').val(), 20, 320);

  document.title = 'Recording...' + Math.round((Date.now() - startTime) / 1000) + 's';

  var url = canvas[0].toDataURL('image/jpeg', 0.7); // image/jpeg is way faster :(
  frames.push(url);
};

function keepDrawing() {
  var FRAME_RATE = 25;
  timeoutId = setTimeout(function () {
      rafId = requestAnimationFrame(drawVideoFrame_);
      keepDrawing();
  }, 1000 / FRAME_RATE);
}

function stop() {
  //stop the record animation & prompts
  clearTimeout(timer);
  clearInterval(startFade);
  clearInterval(startTimer);
  $('.vidprompt').hide();
  $('.vidprompt').text('');
  $('#timer').hide();
  $('#timer').text('');

  cancelAnimationFrame(rafId);
  clearTimeout(timeoutId);
  endTime = Date.now();
  $('#stop-me').attr('disabled', true);
  document.title = ORIGINAL_DOC_TITLE;

  toggleActivateRecordButton();

  console.log('frames captured: ' + frames.length + ' => ' +
              ((endTime - startTime) / 1000) + 's video');

  var audioPromise = stopRecording();

  audioPromise.done(function(audioBlob) {
    var reader = new FileReader();
    reader.onload = function(event){
        $.post('/submit', JSON.stringify({
          audio: event.target.result,
          video: frames
        }), function(data){
          video.attr('src', 'data:video/webm;base64,' + data);
          video.attr({
            autoplay: true,
            controls: true
          });
          video[0].onloadeddata = function() {
              video[0].muted = false;
              video[0].volume = 1;
          }
          embedVideoPreview();
        }, 'text');
    };

    reader.readAsDataURL(audioBlob);//Convert the blob from clipboard to base64
  });
};

function embedVideoPreview(opt_url) {
  var url = opt_url || null;
  var downloadLink = $('#resume-record a[download]');

  if (downloadLink.length == 0) {
      downloadLink = $('<a></a>');
      var p = $('<p></p>');
      p.append(downloadLink);

      $('#resume-record').append(p);
  }

  downloadLink.attr({
    download: 'capture.webm',
    href: video.attr('src'),
    title: 'Download your video'
  });
  downloadLink.text('[ download video ]');
}

function initEvents() {
  var recordButton = $('#record-me');
  if (recordButton.length) {
    turnOnCamera();
    recordButton.click(record);
  }

  var stopButton = $('#stop-me');
  if (stopButton.length) {
    stopButton.click(stop);
  }
}

initEvents();

function countdowntimer2(){
    var frameprompts = new Array('INTRODUCE YOURSELF','WHAT DO YOU WANT TO DO?','YOUR EDUCATION OR TRAINING','YOUR CURRENT JOB TITLE','OTHER EXPERIENCE, AWARDS, ACCOLADES','ANYTHING ELSE?','SAY THANK YOU');
    var framepromptstimer = new Array(4,5,10,5,10,10,10);
    var frametimer;
    var countdowntimer;

    //start the record animation
    startFade = setInterval(function(){
          $('span.glyphicon-record').fadeOut(800);
          $('span.glyphicon-record').fadeIn(800);
      }, 1600
    );

      $('.vidprompt').show();
      $('#timer').show();

      function func() {
          frametimer = framepromptstimer[0] * 1000;
          countdowntimer = framepromptstimer[0];

          $('.vidprompt').text((frameprompts[0]));

          //start countdown timer
          $('#timer').text(countdowntimer);
          clearInterval(startTimer);
          startTimer = setInterval(countdown, 1000);

          frameprompts.shift();
          framepromptstimer.shift();

          if(frameprompts.length > 0) {
              timer = setTimeout(func, frametimer);
          } else {
              setTimeout(function() {
                  if ($('#record-me').attr('disabled')) {
                      stop();
                  }
              }, frametimer)
          }
      }

      function countdown() {
          countdowntimer = countdowntimer - 1;
          $('#timer').text(countdowntimer);
          if(countdowntimer == 0){
              clearInterval(startTimer);
          }
      }

      func();
}

})(window);

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-22014378-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

  var audio_context;
  var recorder;

  function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);

    recorder = new Recorder(input, {workerPath: '/js/recorderWorker.js'});
  }

  function startRecording() {
    recorder && recorder.record();
  }

  function stopRecording() {
    recorder && recorder.stop();

    var deferred = $.Deferred();

    // create WAV download link using audio data blob
    recorder && recorder.exportWAV(function(blob) {
        deferred.resolve(blob);
      }
    );

    recorder.clear();
    return deferred.promise();
  }

  function audioInit(stream) {
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      window.URL = window.URL || window.webkitURL;

      audio_context = new AudioContext;
    } catch (e) {
      alert('No web audio support in this browser!');
    }

    startUserMedia(stream);
  };
