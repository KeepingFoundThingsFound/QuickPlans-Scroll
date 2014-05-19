define(['./module','angular'], 
  function (controllers,angular) {

  'use strict';

  // Check if dependencies are in scope
  // console.log('jquery: ' + typeof($));
  // console.log('ItemMirror: ' + typeof(ItemMirror));
  // console.log('Dropbox: ' + typeof(Dropbox));

  controllers.controller('MainCtrl', ['$scope','IM',function ($scope, IM) {
    $scope.status = 'Loading Associations...';

    IM.connectDropbox()
    .then(IM.constructItemMirror)
    .then(IM.getAssociationGUIDs)
    .then(IM.getAssociationNames)
    .then(function(result) {
      // Bind results to scope
      $scope.associations = result;
      $scope.status = 'success';
      $scope.loaded = true;
      $scope.GUIDs = IM.GUIDs;
    }, function(reason) {
      //Catch errors in the chain
      console.log('Failed: ' + reason);
    }, function(update) {
      // Report status update in the chain
      console.log('Got notification: ' + update);
    });

    $scope.content = "<h2>I'm editable</h2><ul><li>Don't believe me?</li><li>Just click this block and start typing!</li><li>Assuming you just dasdfid, how cool is that?!</li></ul>";

  }]);

});

