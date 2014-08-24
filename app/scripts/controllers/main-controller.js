define(['./module','angular'], 
  function (controllers,angular) {

  'use strict';

  controllers.controller('MainCtrl', ['$scope','listOp','dropboxAuth', function ($scope, listOp, dropboxAuth) {
    dropboxAuth.connectDropbox()
    .then(function() { return listOp.buildList(); })
    .then(function(result) {
      // Bind the full listed object to scope for the UI tree
      console.log(result);

      // Add a first item if the root folder is empty
      if(result.items.length === 0) {
        result.addChildItem('My First Project');
      }

      $scope.root = result;
      $scope.list = result.items;
      $scope.loaded = true;

      $scope.projectTitle = 'Folder Items';
      $scope.currentTitle = 'Notes and Files';
      $scope.currentNotes = [];

      $scope.currentList = null;
      
      // Test flag
      $scope.status = true;
    });

    // Angular UI Tree Options
    $scope.treeOptions = {
      // Callback function executed after drag-and-drop event
      dragStop: function(event) {
        var targetLI = event.source.nodeScope.$modelValue;

        // Reference the new parent if the item is moved to a sublevel
        var newParentLI = event.dest.nodesScope.$parent.$modelValue;

        // Reference a sibling if the item was moved to root level
        var rootSiblingReference = event.dest.index > 0 ? 0 : 1;
        var newSiblingLI = event.dest.nodesScope.$modelValue[rootSiblingReference];

        if(newParentLI && targetLI.parentIM !== newParentLI.selfIM) {
          console.log('Moving to sublevel');
          targetLI.moveItem(newParentLI.selfIM);
          listOp.setPriority($scope.root);
        } else if(newSiblingLI && targetLI.parentIM !== newSiblingLI.parentIM) {
          console.log('Moving to root');
          targetLI.moveItem(newSiblingLI.parentIM);
          listOp.setPriority($scope.root);
        } else if(event.source.index !== event.dest.index) {
          listOp.setPriority($scope.root);
          console.log('From ' + event.source.index + ' to ' + event.dest.index);
        } 
      }
    };

    $scope.showNotes = function(scope) {
      var listItem = scope.$modelValue;
      
      console.log(angular.element('div.angular-ui-tree').children('div.selectedLI'));
      angular.element('div.angular-ui-tree div.selectedLI').removeClass("selectedLI");
      scope.$element.addClass("selectedLI");
      
      $scope.currentTitle = listItem.title;
      $scope.currentList = listItem;
      // displaytext and associateditem (url)
      listItem.getPhantomNotes()
      .then(function(result) {
        $scope.currentNotes = result;
      }, function(error) { console.log('Error:' + error); });
    };
    
    $scope.addNote = function(scope) {
      var listItem = scope;

      // displaytext and associateditem (url)
      listItem.addPhantomNote("This is a new note")
      .then(function(result) {
          listItem.getPhantomNotes()
          .then(function(result) {
            $scope.currentNotes = result;
            console.log($scope.currentNotes);
          }, function(error) { console.log('Error:' + error); });
      }, function(error) { console.log('Error:' + error); });
    };

    $scope.deleteNote = function(scope, note){
      scope.deletePhantomNote(note.GUID)
        .then(function(){
          delete $scope.currentNotes[note.GUID];
        },function(error) { console.log('Error:' + error) });
      
    }

    $scope.delete = function(scope) {
      var listItem = scope.$modelValue;
      listItem.deleteItem();
      scope.remove();
    };

    $scope.toggle = function(scope) {
      scope.toggle();
    };

    $scope.newSubItem = function(scope) {
      var listItem = scope.$modelValue;
      listItem.addChildItem();
    };

    $scope.signOut = function() {
      dropboxAuth.disconnectDropbox();
      console.log('Disconnected Dropbox from app');
    };


  }]);
});

