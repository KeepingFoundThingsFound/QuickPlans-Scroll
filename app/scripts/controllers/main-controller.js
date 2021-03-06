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
      
      var title = result.selfIM.groupingItemURI;
      $scope.root.title = title;
      $scope.projectTitle = title;
      $scope.currentList = null;
      $scope.showNotes($scope.root);
      //$scope.currentTitle = title;
      //$scope.currentNotes = [];

      
      
      // Test flag
      $scope.status = true;
      //make sure listitems are not currently open to editing (usually it's the last listitem created)
      
      // watch, use 'true' to also receive updates when values
      // change, instead of just the reference
      /**
      $scope.$watch("currentNotes", function(order) {
        console.log("currentNotes: " + order.map(function(e){return e.order}).join(','));
      },true);
      **/
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
      var listItem;
      //handle root/title
      if (scope.$modelValue == undefined){
        listItem = scope;
      }else{ //every other case
        listItem = scope.$modelValue;
      }
      
      if (scope.tempTitle == 'root') {
        angular.element('div.angular-ui-tree div.selectedLI').removeClass("selectedLI");
      }
      
      if (scope.$element) {
        angular.element('div.angular-ui-tree div.selectedLI').removeClass("selectedLI");
        scope.$element.addClass("selectedLI");
      }
      
      $scope.currentTitle = listItem.title;
      $scope.currentList = listItem;
      // displaytext and associateditem (url)
      listItem.getPhantomNotes()
      .then(function(result) {
        $scope.currentNotes = result;
      }, function(error) { console.log('Error:' + error); });
    };
    
    $scope.showNotesFromGUID = function(GUID) {
      var matchIndex = -1;
      for(var i = 0; i < $scope.currentList.items.length; i++){
        if ($scope.currentList.items[i].guid == GUID) {
          matchIndex = i;
        }
      }
      angular.element('div.angular-ui-tree div.selectedLI').removeClass("selectedLI");
      $scope.showNotes($scope.currentList.items[matchIndex]);
      angular.element('#' + GUID).addClass("selectedLI");
    }
    
    $scope.addNote = function(scope) {
      var listItem = scope;

      // displaytext and associateditem (url)
      listItem.addPhantomNote("This is a new note")
      .then(function(result) {
          listItem.getPhantomNotes()
          .then(function(result) {
            $scope.currentNotes = result;
            
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
    
    $scope.isFolder = function(GUID) {
      if ($.inArray(GUID, $scope.currentList.selfIM.listitemGUIDs) != -1) {
        return true;
      }else{
        return false;
      }
    };
    
    $scope.isWebURL = function(URL){
      return /\b(https?|ftp|file):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|‌​]/.test(URL);
    }
  }]);
});

