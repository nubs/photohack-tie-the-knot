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
var video = $('video');
var canvas = $('<canvas></canvas>'); // offscreen canvas.
$('body').append(canvas);
canvas = $('canvas');
var rafId = null;
var startTime = null;
var endTime = null;
var frames = [];
var audioWav;

function toggleActivateRecordButton() {
  var b = $('#record-me');
  b.text(b.attr('disabled') ? 'Record' : 'Recording...');
  b.toggleClass('recording');
  b.attr('disabled', !b.attr('disabled'));
}

function turnOnCamera() {
  video = $('video');
  $('#record-me').attr('disabled', false);

  video.controls = false;

  var finishVideoSetup_ = function() {
    // Note: video.onloadedmetadata doesn't fire in Chrome when using getUserMedia so
    // we have to use setTimeout. See crbug.com/110938.
    setTimeout(function() {
      video.width(320);//video.clientWidth;
      video.height(240);// video.clientHeight;
      // Canvas is 1/2 for performance. Otherwise, getImageData() readback is
      // awful 100ms+ as 640x480.
      canvas[0].width = 320;
      canvas[0].height = 240;
    }, 1000);
  };

  navigator.getUserMedia({video: true, audio: true}, function(stream) {
    video.attr('src', window.URL.createObjectURL(stream));
    finishVideoSetup_();
    audioInit(stream);
  }, function(e) {
    console.log(e);
    alert('Fine, you get a movie instead of your beautiful face ;)');

    video.attr('src', '/capture.webm');
    finishVideoSetup_();
  });
};

function record() {
  var ctx = canvas[0].getContext('2d');
  var CANVAS_HEIGHT = 240;
  var CANVAS_WIDTH = 320;

  frames = []; // clear existing frames;
  startTime = Date.now();

  toggleActivateRecordButton();
  $('#stop-me').attr('disabled', false);

  function drawVideoFrame_(time) {
    rafId = requestAnimationFrame(drawVideoFrame_);

    ctx.drawImage(video[0], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineWidth=5;
    ctx.fillStyle="#ffffff";
    ctx.lineStyle="#000000";
    ctx.font="24px sans-serif";
    ctx.fillText("CHECK OUT THIS VIDEO", 20, 200);

    document.title = 'Recording...' + Math.round((Date.now() - startTime) / 1000) + 's';

    // Read back canvas as webp.
    //console.time('canvas.dataURL() took');
    var url = canvas[0].toDataURL('image/webp', 1); // image/jpeg is way faster :(
    //console.timeEnd('canvas.dataURL() took');
    frames.push(url);
 
    // UInt8ClampedArray (for Worker).
    //frames.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data);

    // ImageData
    //frames.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
  };

  rafId = requestAnimationFrame(drawVideoFrame_);
  startRecording();
};

function stop() {
  cancelAnimationFrame(rafId);
  endTime = Date.now();
  $('#stop-me').attr('disabled', true);
  document.title = ORIGINAL_DOC_TITLE;

  toggleActivateRecordButton();

  console.log('frames captured: ' + frames.length + ' => ' +
              ((endTime - startTime) / 1000) + 's video');

  embedVideoPreview();
  stopRecording();
};

function embedVideoPreview(opt_url) {
  var url = opt_url || null;
  var video = $('#video-preview video');
  var downloadLink = $('#video-preview a[download]');

  if (!video.length) {
    video = $('<video></video>');
    video.attr({
      autoplay: true,
      controls: true,
      loop: true
    });
    video.width(320);
    video.height(240);
    $('#video-preview').append(video);
    
    downloadLink = $('<a></a>');
    downloadLink.attr({
      download: 'capture.webm',
      title: 'Download your video'
    });
    downloadLink.text('[ download video ]');
    var p = $('<p></p>');
    p.append(downloadLink);

    $('#video-preview').append(p);

  } else {
    window.URL.revokeObjectURL(video.attr('src'));
  }

  if (!url) {
    var webmBlob = Whammy.fromImageArray(frames, 1000 / 30);
    url = window.URL.createObjectURL(webmBlob);
  }

  video.attr('src', url);
  downloadLink.attr('href', url);
}

function initEvents() {
  turnOnCamera();

  var recordButton = $('#record-me');
  if (recordButton.length) {
    recordButton.click(record);
  }

  var stopButton = $('#stop-me');
  if (stopButton.length) {
    stopButton.click(stop);
  }
}

initEvents();

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
    
    // create WAV download link using audio data blob
    recorder && recorder.exportWAV(function(blob) {
        audioWav = blob;
      }
    );
    
    recorder.clear();
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
