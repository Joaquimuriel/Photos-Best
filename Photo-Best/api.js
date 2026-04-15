/* ES5 version of API interaction module (mocked for local development) using callbacks instead of async/await. */
(function(win){
  var CONFIG = {
    makerWebhookURL: 'YOUR_MAKER_WEBHOOK_URL',
    geminiAPIEndpoint: 'YOUR_GEMINI_API_ENDPOINT',
    maxPhotosPerDay: 3
  };

  function simulateDelay(ms, cb){
    setTimeout(function(){ cb && cb(); }, ms);
  }

  win.sendToMaker = function(photoId, photoURL, cb){
    console.log('Mock: sendToMaker', photoId, photoURL);
    simulateDelay(1500, function(){
      cb && cb({ success: true, enhancedPhotoUrl: 'https://example.com/mock/enhanced/' + photoId + '.jpg' });
    });
  };

  win.sendToGemini = function(photoUrl, cb){
    console.log('Mock: sendToGemini', photoUrl);
    simulateDelay(2000, function(){
      cb && cb({ url: photoUrl.replace('/original/', '/enhanced/') });
    });
  };

  win.checkDaily = function(cb){
    cb && cb({ remaining: CONFIG.maxPhotosPerDay });
  };
})(window);
