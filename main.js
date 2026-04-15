/* Main JavaScript file - ES5 version, orchestrates modules with IIFEs for encapsulation */
(function(win, doc){
  /* --- Configuration (usa config.js global) --- */
  var CONFIG = win.CONFIG || {
    makerWebhookURL: 'YOUR_MAKER_WEBHOOK_URL',
    geminiAPIEndpoint: 'YOUR_GEMINI_API_ENDPOINT',
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
    maxPhotosPerDay: 3,
    maxFileSizeMB: 10,
    allowedFormats: ['.jpg', '.jpeg', '.png', '.webp']
  };

  /* --- Supabase Client --- */
  var SupabaseDB = null;

  /* --- DOM Element Cache --- */
  var dropZone, fileInput, fileSelectButton, imagePreviewContainer, imagePreview,
      enhanceButton, loadingIndicator, comparisonSection, originalImage, enhancedImage,
      downloadButton, photoCounterSpan;

  /* --- State Variables --- */
  var uploadedFile = null;
  var originalImageUrl = null;
  var enhancedImageUrl = null;

  /* --- Utils Module (Encapsulated) --- */
  var Utils = (function(){
    function getUserIdentifier(){
      var userId = localStorage.getItem('photoEnhancerUserId');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('photoEnhancerUserId', userId);
      }
      return userId;
    }

    function updatePhotoCounter(count) {
        var counterSpan = doc.getElementById('photo-counter');
        if (counterSpan) {
            counterSpan.textContent = CONFIG.maxPhotosPerDay - count;
        }
    }

    function displayError(message) {
        alert('Error: ' + message);
        console.error('Error: ' + message);
        hideLoadingIndicator();
        var enhanceBtn = doc.getElementById('enhance-button');
        if (enhanceBtn) enhanceBtn.disabled = false;
    }

    function showLoadingIndicator() {
        var loadingIndicator = doc.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        var enhanceBtn = doc.getElementById('enhance-button');
        if (enhanceBtn) enhanceBtn.disabled = true;
        var comparison = doc.getElementById('comparison');
        if (comparison) comparison.style.display = 'none';
    }

    function hideLoadingIndicator() {
        var loadingIndicator = doc.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        var enhanceBtn = doc.getElementById('enhance-button');
        if (enhanceBtn) enhanceBtn.disabled = false;
    }

    function displayComparisonView(originalURL, enhancedURL) {
        var comparison = doc.getElementById('comparison');
        var origImg = doc.getElementById('original-image');
        var enhImg = doc.getElementById('enhanced-image');
        var downloadBtn = doc.getElementById('download-button');

        if (origImg) origImg.src = originalURL;
        if (enhImg) enhImg.src = enhancedURL;
        if (downloadBtn) downloadBtn.href = enhancedURL;
        if (comparison) comparison.style.display = 'block';
         if (downloadBtn) downloadBtn.style.display = 'inline-block';
    }

    function validateFile(file) {
        if (!file) { return "No file selected."; }
        var fileSizeMB = file.size / 1024 / 1024;
        var fileName = file.name.toLowerCase();
        
        // Check extension
        var validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        var ext = '';
        if (fileName.includes('.jpg')) ext = '.jpg';
        else if (fileName.includes('.jpeg')) ext = '.jpeg';
        else if (fileName.includes('.png')) ext = '.png';
        else if (fileName.includes('.webp')) ext = '.webp';
        
        if (!ext || validExtensions.indexOf(ext) === -1) {
            return 'Invalid file type. Allowed types are: .jpg, .jpeg, .png, .webp';
        }
        if (fileSizeMB > CONFIG.maxFileSizeMB) {
            return 'File size exceeds the limit of ' + CONFIG.maxFileSizeMB + 'MB.';
        }
        return null;
    }

    function checkAndUpdateDailyLimit() {
        var userId = getUserIdentifier();
        var dailyLimitDataStr = localStorage.getItem('dailyLimitData');
        var dailyLimitData = dailyLimitDataStr ? JSON.parse(dailyLimitDataStr) : {};
        var now = new Date();
        var lastResetDate = dailyLimitData.lastResetDate ? new Date(dailyLimitData.lastResetDate) : now;
        var photosUsedToday = dailyLimitData.photosUsedToday || 0;

        var oneDayInMs = 24 * 60 * 60 * 1000;
        if (now - lastResetDate >= oneDayInMs) {
            dailyLimitData.photosUsedToday = 0;
            dailyLimitData.lastResetDate = now.toISOString();
            localStorage.setItem('dailyLimitData', JSON.stringify(dailyLimitData));
            updatePhotoCounter(0);
            return 0;
        } else {
            updatePhotoCounter(photosUsedToday);
            return photosUsedToday;
        }
    }

    function updateDailyLimitFromSupabase() {
        var userId = getUserIdentifier();
        if (SupabaseDB && SupabaseDB.initialized) {
            SupabaseDB.getTodayCount(userId, function(err, count) {
                if (err) {
                    console.log('Erro ao buscar limite diário do Supabase, usando localStorage:', err);
                    checkAndUpdateDailyLimit();
                } else {
                    console.log('Fotos processadas hoje (Supabase):', count);
                    updatePhotoCounter(count);
                }
            });
        } else {
            checkAndUpdateDailyLimit();
        }
    }

    function incrementUsage() {
        var dailyLimitDataStr = localStorage.getItem('dailyLimitData');
        var dailyLimitData = dailyLimitDataStr ? JSON.parse(dailyLimitDataStr) : {};
        dailyLimitData.photosUsedToday = (dailyLimitData.photosUsedToday || 0) + 1;
        dailyLimitData.lastResetDate = dailyLimitData.lastResetDate || new Date().toISOString();
        localStorage.setItem('dailyLimitData', JSON.stringify(dailyLimitData));
        updatePhotoCounter(dailyLimitData.photosUsedToday);
        return dailyLimitData.photosUsedToday;
    }

    function saveToSupabase(originalUrl, enhancedUrl) {
        var userId = getUserIdentifier();
        var photoData = {
            user_identifier: userId,
            original_photo_url: originalUrl,
            enhanced_photo_url: enhancedUrl,
            processing_status: 'completed'
        };

        if (SupabaseDB && SupabaseDB.initialized) {
            SupabaseDB.savePhoto(photoData, function(err, response) {
                if (err) {
                    console.log('Erro ao salvar no Supabase:', err);
                } else {
                    console.log('Foto salva no Supabase:', response);
                }
                /* Incrementar contador local */
                incrementUsage();
            });
        } else {
            /* Fallback: apenas contador local */
            incrementUsage();
        }
    }

    return {
        getUserIdentifier: getUserIdentifier,
        updatePhotoCounter: updatePhotoCounter,
        displayError: displayError,
        showLoadingIndicator: showLoadingIndicator,
        hideLoadingIndicator: hideLoadingIndicator,
        displayComparisonView: displayComparisonView,
        validateFile: validateFile,
        checkAndUpdateDailyLimit: checkAndUpdateDailyLimit,
        incrementUsage: incrementUsage,
        saveToSupabase: saveToSupabase
    };
  })();

  /* Global function for saveToSupabase */
  function savePhotoToSupabase(originalUrl, enhancedUrl) {
      Utils.saveToSupabase(originalUrl, enhancedUrl);
  }

  /* --- Api Module (Encapsulated - Chamada REAL ao Maker.com) --- */
  var Api = (function(){
    function simulateDelay(ms, callback){
      setTimeout(callback, ms);
    }

    // Função para fazer chamada REAL ao Maker.com webhook
    function sendToMakerWebhook(photoId, photoDataURL, callback) {
        var webhookUrl = CONFIG.makerWebhookURL;
        
        if (!webhookUrl || webhookUrl === 'YOUR_MAKER_WEBHOOK_URL') {
            console.log('Maker webhook URL não configurada. Usando mock.');
            mockMakerApiCall(photoId, photoDataURL, callback);
            return;
        }

        console.log('Enviando foto para Maker.com webhook:', webhookUrl);
        
        // Enviar para o webhook do Make.com
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                photoId: photoId,
                photo: photoDataURL, // Base64 da imagem
                timestamp: new Date().toISOString()
            })
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            console.log('Resposta do Maker.com:', data);
            callback({ 
                success: true, 
                enhancedPhotoUrl: data.enhancedPhotoUrl || data.url || data.resultUrl
            });
        })
        .catch(function(error) {
            console.error('Erro ao chamar Maker.com:', error);
            // Fallback para mock em caso de erro
            mockMakerApiCall(photoId, photoDataURL, callback);
        });
    }

    function mockMakerApiCall(photoId, photoURL, callback){
        console.log('Mock API: sendToMaker called with ID:', photoId, 'URL:', photoURL);
        simulateDelay(1500, function(){
            console.log('Mock API: Maker.com processing done.');
            callback({ success: true, enhancedPhotoUrl: 'https://example.com/mock/enhanced/' + photoId + '.jpg' });
        });
    }

    function mockGeminiApiCall(photoUrl, callback){
        console.log('Mock API: Gemini API called with URL:', photoUrl);
        simulateDelay(2000, function(){
            console.log('Mock API: Gemini API processing done.');
            callback({ url: photoUrl.replace('/original/', '/enhanced/') });
        });
    }

    return {
        sendToMakerWebhook: sendToMakerWebhook,
        mockMakerApiCall: mockMakerApiCall,
        mockGeminiApiCall: mockGeminiApiCall
    };
  })();

  /* --- Upload Module (Encapsulated) --- */
  var Upload = (function(){
    function handleFile(file){
      var validationError = Utils.validateFile(file);
      if (validationError) {
          Utils.displayError(validationError);
          return;
      }

      uploadedFile = file;
      var reader = new FileReader();

      reader.onload = function(e) {
          originalImageUrl = e.target.result;
          if (imagePreview) imagePreview.src = originalImageUrl;
          if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
          if (enhanceButton) enhanceButton.style.display = 'inline-block';
          if (comparisonSection) comparisonSection.style.display = 'none';
          if (downloadButton) downloadButton.style.display = 'none';
      };
      reader.onerror = function() {
          Utils.displayError("Could not read file.");
          uploadedFile = null;
      };
      reader.readAsDataURL(file);
    }

    function initUploadListeners(){
      if(fileSelectButton && fileInput){
          fileSelectButton.addEventListener('click', function(){ fileInput.click(); }, false);
          fileInput.addEventListener('change', function(e){ var f = e.target.files[0]; handleFile(f); }, false);
      }

      if(dropZone){
          dropZone.addEventListener('dragover', function(e){ e.preventDefault(); dropZone.style.backgroundColor = '#cce5ff'; }, false);
          dropZone.addEventListener('dragleave', function(e){ e.preventDefault(); dropZone.style.backgroundColor = '#f0f0f0'; }, false);
          dropZone.addEventListener('drop', function(e){
              e.preventDefault();
              dropZone.style.backgroundColor = '#f0f0f0';
              var file = e.dataTransfer.files[0];
              handleFile(file);
          }, false);
      }
    }
    return {
         initUploadListeners: initUploadListeners
    };
  })();

  /* --- Comparison Module (Encapsulated Placeholder) --- */
  var Comparison = (function(){
    function initSlider(){
      console.log("Comparison slider module initialized (ES5 placeholder).");
      /* This is a placeholder. Full implementation would need event listeners and style manipulation. */
    }
    return { initSlider: initSlider };
  })();

  /* --- Main Application Initialization --- */
  function initializeApp(){
      /* Cache DOM Elements */
      dropZone = doc.getElementById('drop-zone');
      fileInput = doc.getElementById('file-input');
      fileSelectButton = doc.getElementById('file-select-button');
      imagePreviewContainer = doc.getElementById('image-preview-container');
      imagePreview = doc.getElementById('image-preview');
      enhanceButton = doc.getElementById('enhance-button');
      loadingIndicator = doc.getElementById('loading-indicator');
      comparisonSection = doc.getElementById('comparison');
      originalImage = doc.getElementById('original-image');
      enhancedImage = doc.getElementById('enhanced-image');
      downloadButton = doc.getElementById('download-button');
      photoCounterSpan = doc.getElementById('photo-counter');

      /* Initialize UI States */
      if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
      if (comparisonSection) comparisonSection.style.display = 'none';
      if (downloadButton) downloadButton.style.display = 'none';

      /* Initialize Modules */
      Upload.initUploadListeners();
      Comparison.initSlider();

      /* Initialize Supabase Client */
      if (win.SupabaseClient) {
        SupabaseDB = win.SupabaseClient;
        SupabaseDB.init(CONFIG);
        console.log('Supabaseclient initialized in main.js');
      }

      /* Set initial photo counter from Supabase */
      /* updateDailyLimitFromSupabase();  - Temporarily disabled - causing error */

      /* --- Enhance Button Listener --- */
      if(enhanceButton){
      console.log('Enhance button found, adding click listener');
      enhanceButton.addEventListener('click', function(){
          console.log('Enhance button clicked! uploadedFile:', uploadedFile);
          if (!uploadedFile) {
              Utils.displayError("Please upload a photo first.");
              return;
          }

          var currentPhotoCount = Utils.checkAndUpdateDailyLimit();
          if (currentPhotoCount >= CONFIG.maxPhotosPerDay) {
              Utils.displayError("You have reached your daily limit of " + CONFIG.maxPhotosPerDay + " photo enhancements.");
              return;
          }

          Utils.showLoadingIndicator();

          var reader = new FileReader();
          reader.onload = function(e) {
              originalImageUrl = e.target.result;
              if (imagePreview) imagePreview.src = originalImageUrl;

              var photoId = 'temp_' + Date.now();
              var photoURL = originalImageUrl;

              console.log('Calling Maker.com webhook...');
              Api.sendToMakerWebhook(photoId, photoURL, function(makerResponse){
                  console.log('Maker response:', makerResponse);
                  if (makerResponse.success) {
                      Api.mockGeminiApiCall(makerResponse.enhancedPhotoUrl, function(geminiResponse){
                          console.log('Gemini response:', geminiResponse);
                          if (geminiResponse && geminiResponse.url) {
                              enhancedImageUrl = geminiResponse.url;
                                  Utils.displayComparisonView(originalImageUrl, enhancedImageUrl);

                                  /* Salvar no Supabase */
                                  Utils.saveToSupabase(originalImageUrl, enhancedImageUrl);
                              } else {
                                  Utils.displayError("Failed to get enhanced photo.");
                              }
                          });
                      } else {
                          Utils.displayError("Failed to process photo through Maker.com webhook.");
                      }
                  });
              };
              reader.onerror = function() {
                  Utils.displayError("Failed to read the selected file.");
                  Utils.hideLoadingIndicator();
              };
              reader.readAsDataURL(uploadedFile);
          }, false);
      }

      /* Download Button */
      if(downloadButton){
          downloadButton.addEventListener('click', function(){
              console.log('Download initiated.');
          }, false);
      }
  }

  /* --- Initialize Application --- */
  if(doc.readyState === 'complete' || doc.readyState === 'interactive') {
      setTimeout(initializeApp, 0);
  } else {
      doc.addEventListener('DOMContentLoaded', initializeApp);
  }

})(window, document);
