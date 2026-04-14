/* supabase-client.js - Cliente ES5 para Supabase */
(function(win) {
  'use strict';

  var SupabaseClient = {
    config: null,
    initialized: false,

    /* Inicializar cliente com config */
    init: function(config) {
      this.config = config || win.CONFIG;
      this.initialized = true;
      console.log('SupabaseClient: inicializado');
    },

    /* Fazer request AJAX para Supabase REST API */
    request: function(method, endpoint, data, callback) {
      var self = this;
      if (!this.initialized) {
        this.init();
      }

      var url = this.config.supabaseUrl + '/rest/v1/' + endpoint;
      var xhr = new XMLHttpRequest();

      xhr.open(method, url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('apikey', this.config.supabaseAnonKey);
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.config.supabaseAnonKey);
      xhr.setRequestHeader('Prefer', 'return=representation');

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            var response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            callback && callback(null, response);
          } else {
            console.error('SupabaseClient request error:', xhr.status, xhr.responseText);
            callback && callback({ status: xhr.status, message: xhr.responseText }, null);
          }
        }
      };

      if (data) {
        xhr.send(JSON.stringify(data));
      } else {
        xhr.send();
      }
    },

    /* Salvar foto (original + URL melhorada) */
    savePhoto: function(photoData, callback) {
      /*
       photoData = {
         user_identifier: 'user_123',
         original_photo_url: 'https://...',
         enhanced_photo_url: 'https://...',
         processing_status: 'completed'
       }
      */
      this.request('POST', 'photos', photoData, function(err, response) {
        if (err) {
          callback && callback(err, null);
        } else {
          console.log('Foto salva com sucesso:', response);
          callback && callback(null, response);
        }
      });
    },

    /* Buscar fotos do usuário hoje */
    getTodayPhotos: function(userIdentifier, callback) {
      var today = new Date().toISOString().split('T')[0];
      this.request('GET', 'photos?user_identifier=eq.' + userIdentifier + '&upload_date=gt.' + today + 'T00:00:00', null, function(err, response) {
        if (err) {
          callback && callback(err, null);
        } else {
          callback && callback(null, response || []);
        }
      });
    },

    /* Contar fotos processadas hoje */
    getTodayCount: function(userIdentifier, callback) {
      var self = this;
      this.getTodayPhotos(userIdentifier, function(err, photos) {
        if (err) {
          callback && callback(err, 0);
        } else {
          callback && callback(null, photos.length);
        }
      });
    },

    /* Atualizar foto existente com URL melhorada */
    updatePhoto: function(photoId, enhancedPhotoUrl, callback) {
      var updateData = {
        enhanced_photo_url: enhancedPhotoUrl,
        processing_status: 'completed'
      };
      this.request('PATCH', 'photos?id=eq.' + photoId, updateData, function(err, response) {
        if (err) {
          callback && callback(err, null);
        } else {
          callback && callback(null, response);
        }
      });
    }
  };

  /* Exportar para global */
  win.SupabaseClient = SupabaseClient;

})(window);