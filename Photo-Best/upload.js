/* ES5 version of Upload module - portable across environments */
(function(win, doc){
  function init(){
    var dropZone = doc.getElementById('drop-zone');
    var fileInput = doc.getElementById('file-input');
    var fileSelectButton = doc.getElementById('file-select-button');
    var imagePreviewContainer = doc.getElementById('image-preview-container');
    var imagePreview = doc.getElementById('image-preview');

    win.uploadedFile = null;
    win.originalImageUrl = null;

    if(fileSelectButton && fileInput){
      fileSelectButton.addEventListener('click', function(){ fileInput.click(); }, false);
      fileInput.addEventListener('change', function(e){ var f = e.target.files[0]; handleFile(f); }, false);
    }

    function handleFile(file){
      if(!file){ alert('No file selected.'); return; }
      var validExts = ['.jpg','.jpeg','.png','.webp'];
      var name = file.name || '';
      var ext = (name.substring(name.lastIndexOf('.')) || '').toLowerCase();
      if(validExts.indexOf(ext) === -1){ alert('Invalid file type. Allowed: JPG, PNG, WEBP.'); return; }
      var sizeMB = file.size / 1024 / 1024;
      if(sizeMB > 10){ alert('File too large. Max 10MB.'); return; }
      win.uploadedFile = file;
      var reader = new FileReader();
      reader.onload = function(ev){
        win.originalImageUrl = ev.target.result;
        if(imagePreview){ imagePreview.src = win.originalImageUrl; }
        if(imagePreviewContainer){ imagePreviewContainer.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
    }
  }
  if (doc.readyState === 'complete' || doc.readyState === 'interactive') { setTimeout(init, 0); } else { doc.addEventListener('DOMContentLoaded', init); }
})(window, document);
