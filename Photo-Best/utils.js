/* ES5-compatible utilities module */
(function(win){
  function getUserIdentifier(){ var uid = localStorage.getItem('photoEnhancerUserId'); if(!uid){ uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2,9); localStorage.setItem('photoEnhancerUserId', uid); } return uid; }
  function exportGetUserIdentifier(){ win.getUserIdentifier = getUserIdentifier; }
  exportGetUserIdentifier();
})(window);
