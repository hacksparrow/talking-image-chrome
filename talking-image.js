/*********************************************************
* Talking Image by Hage Yaapa <captain@hacksparrow.com>  *
* License: MIT                                           *
*********************************************************/

(function() {

'use strict';

// The grand function to perform the miracle of giving sound to images
var setup = function(source) {

  // Object to keep the references to various audio objects - key is the URL, and the value is the audio element
  var audios = {};

  // Check if an audio option is set
  var is_set = function(option, options) {
    if (options) return (options.indexOf(option) > -1) ? true : false;
    // Disable all options except "autoplay" and "sync", if loaded without the audio attribute - usecase for browser extension
    else if (option == 'autoplay' || option == 'sync') return true;
    else return false;
  }

  // Render audio for the image located at the URL
  var render_audio = function(img, url, options) {

    jBinary.loadData(url, function(err, data) {

      // Proceed only if the image was loaded successfully
      if (!err) {

          var d = new jDataView(data);
          // We will use this object for storing relevant information about the audio
          var audio = {
            format: false,
            offset: false,
            volume: 1,
          }

          // Let's read the binary data and look for embedded audio
          var i = 0;
          while (i < d.byteLength) {

            // Detect mp3 data
            if (d.getChar(i) == '\x49'
              && d.getChar(i+1) == '\x44' 
              && d.getChar(i+2) == '\x33'
              && d.getChar(i+3) == '\x03'
              && d.getChar(i+4) == '\x00'
              && d.getChar(i+5) == '\x00'
              && d.getChar(i+6) == '\x00'
              && d.getChar(i+7) == '\x00'
              ) {
                audio.format = 'mpeg';
                audio.offset = i;
                break;
            }
            // Detect ogg data
            else if (d.getChar(i) == '\x4F'
              && d.getChar(i+1) == '\x67' 
              && d.getChar(i+2) == '\x67'
              && d.getChar(i+3) == '\x53'
              && d.getChar(i+4) == '\x00'
              && d.getChar(i+5) == '\x02'
              && d.getChar(i+6) == '\x00'
              && d.getChar(i+7) == '\x00'
              && d.getChar(i+8) == '\x00'
              && d.getChar(i+9) == '\x00'
              && d.getChar(i+10) == '\x00'
              && d.getChar(i+11) == '\x00'
              && d.getChar(i+12) == '\x00'
              && d.getChar(i+13) == '\x00'
              ) {
              
                audio.format = 'ogg';
                audio.offset = i;
                break;
          }

          i++;
        }

        // If audio data was found, embed it on the page
        if (audio.format) {

          // Images to be sync should be hidden only if there is audio data
          if (is_set('sync', options)) img.style.visibility = 'hidden';

          // Reset the cursor
          d.seek(0);
          // Extract the audio data
          d.getString(audio.offset);

          var audio_el = document.createElement('audio');
          // Convert binary data to base64 encoded string and assign it to the audio object usind Data URL
          var audio_data = 'data:audio/'+ audio.format +';base64,' + window.btoa(d.getString());
          audio_el.setAttribute('src', audio_data);

          // Apply options
          if (is_set('controls', options)) audio_el.setAttribute('controls', 'controls');
          if (is_set('autoplay', options)) audio_el.setAttribute('autoplay', 'true');
          if (is_set('loop', options)) audio_el.setAttribute('loop', 'true');
          if (is_set('volume', options)) {
            var volume = options.split('volume=')[1].split(' ')[0];
            // We are prefxing with + to convert string to int
            audio.volume = +volume;
            audio_el.volume = +volume;
          }

          if (is_set('sync', options)) {
            // Reset the animation by re-loading the image
            img.setAttribute('src', url);
            img.style.visibility = 'visible';
          }

          // Add the audio element to the list of audios
          audios[url] = audio_el;

          // Attach the audio element to the body
          document.body.appendChild(audio_el);


          // The sound can be muted by clicked on the image, and toggled - we don't pause because GIF images don't pause
          img.onclick = function() {
            var audio_el = audios[img.getAttribute('src')];
            if (audio_el.volume == 0) audio_el.volume = audio.volume;
            else audio_el.volume = 0;
          }

        }

      }

    });
  }


  // Let's inspect all the images in the document for potential 'talkies'
  var talkies = document.getElementsByTagName('img');

  Array.prototype.forEach.call(talkies, function(img) {
    var options = img.getAttribute('audio'); //.split(' ');
    var url = img.getAttribute('src');

    // load the audio for this image
    render_audio(img, url, options);
  });


};

// Detect if an image or webpage is loaded and behave accordingly
var file_type = document.location.href.split('.').pop();
// If it is a directly loaded image
if (['gif', 'jpg', 'jpeg', 'png'].indexOf(file_type) > -1) setup('extension');

// If it is a webpage - images will not trigger this event
window.onload = function() {
  // If the webpage comes with the Talking Image library, let it handle it
  if (typeof TALKING_IMAGE_VERSION != 'undefined') return;
  else setup('webpage');
}

})();