define(['./module','angular'], function (directives,angular) {

  'use strict';

  // Check if dependencies are in scope
  // console.log('jquery: ' + typeof($));
  // console.log('ItemMirror: ' + typeof(ItemMirror));
  // console.log('Dropbox: ' + typeof(Dropbox));

  directives.directive('hallo', function() {
      return {
          restrict: 'E A',
          require: '?ngModel',
          scope: { listitem: '=' },
          link: function(scope, element, attrs, ngModel) {
              if (!ngModel) {
                  return;
              }

              element.hallo({
                 plugins: {}
              });

              ngModel.$render = function() {
                  element.html(ngModel.$viewValue || '');
              };

              element.on('hallodeactivated', function() {
                // If user leaves field blank then revert to temp title
                if(element.html == '') {
                  scope.listitem.title = scope.listitem.tempTitle;
                  ngModel.$setViewValue(scope.listitem.title);
                }
                // Rename the list item only if the user has changed it
                if(scope.listitem.title !== element.html()) {
                  // Update the local model
                  ngModel.$setViewValue(element.html());
                  scope.listitem.tempTitle = element.html();
                  scope.listitem.title = element.html();
                  scope.$apply();
                  // Have itemMirror rename the folder
                  scope.listitem.renameItem();
                }
              });

              element.on('keydown', function($event){
                if($event.which === 13) {
                  $event.preventDefault();
                  // console.log(scope.$parent);
                  // scope.listItem.newSubItem(this)
                }
              });
          }
      };
  });
  
directives.directive('halloNote', function() {
      return {
          restrict: 'E A',
          require: '?ngModel',
          link: function(scope, element, attrs, ngModel) {
              if (!ngModel) {
                console.log("No ng-model");
                  return;
              }

              element.hallo({
                 plugins: {}
              });

              ngModel.$render = function() {
                  element.html(ngModel.$viewValue || '');
              };

              element.on('hallodeactivated', function() {
                 //Rename the list item only if the user has changed it
                if(scope.note.text !== element.text()) {
                   //Update the local model
                  ngModel.$setViewValue(element.text());
                  scope.note.text = element.text();
                  scope.$apply();
                   //Have itemMirror rename the folder
                  scope.currentList.selfIM.setAssociationDisplayText(scope.note.GUID, scope.note.text);
                }
              });
              
              element.on('halloactivated', function() {
                console.log('clicked on note, hallo activated');
              });
              /**
              element.on('click', function(event) {
                event.stopPropagation();
                element.focus();
              });
              **/
              element.on('keydown', function($event){
                if($event.which === 13) {
                  $event.preventDefault();
                  element.blur();
                }
              });
          }
      };
  });
  
});

