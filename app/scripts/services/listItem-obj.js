define(['./module','angular','ItemMirror'], function (services,angular,ItemMirror) {
  'use strict';

  	services.factory('LI', ['$q', function($q){

  		function LI(GUID, title, parentIM, selfIM){

        // Must set parent IM object in order to perform methods
        this.parentIM = parentIM || null;
        this.selfIM = selfIM || null;

        // Essential properties for UI tree
  			this.guid = GUID;
  			this.title = title;
        this.tempTitle = this.title;
  			this.items = [];

        // Association properties from XooML
  			this.isExpanded = false;
        this.priority = null;
  		}

  		LI.prototype = {	

        getPhantomNotes : function() {
          var imObj = this.selfIM;
          // Return nothing if the listItem doesn't have a selfIM yet
          if(!imObj) { return $q.when(null); }

          return imObj.getPhantomDisplayText()
          .then(function(result) { return imObj.getPhantomURL(); })
          .then(function(result) { 
            return imObj.notes; 
          }, function(error) { 
            return error; 
          });
        },

  			renameItem : function() {
          var self = this;
          console.log(self.selfIM);
          return this.parentIM.renameLocalItem(this.guid, this.title)
          .then(function(result) { return self.parentIM.refresh(); })
          .then(function(result) {

            var pathArray = self.selfIM.itemMirror._groupingItemURI.split('/');
            pathArray[pathArray.length-1] = self.title;
            var newPath = pathArray.join('/');

            self.selfIM.itemMirror._groupingItemURI = newPath;
            self.selfIM.displayName = self.title;          
            
            return self.selfIM.refresh(); 
          })
          .then(function(result) { 
            console.log(result); 
            return result; 
          }, function(error) { 
            console.log('Error: ' + error); 
            return error;
          });
        },

        // Move to a new folder (Shift left or right)
  			moveItem : function(destinationIM){

          Array.prototype.diff = function(a) {
            return this.filter(function(i) {return a.indexOf(i) < 0;});
          };

          var currentGUIDs = destinationIM.associationGUIDs.slice(0);

          var self = this;

          return this.parentIM.moveAssociation(this.guid, destinationIM.itemMirror)
          .then(function(result) { return self.selfIM.refresh(); })
          .then(function(result) { return destinationIM.getAssociationGUIDs(); })
          .then(function(GUIDs) { return GUIDs.diff(currentGUIDs); })
          .then(function(GUIDs) { 
            if(GUIDs.length === 1) {
              self.guid = GUIDs[0];
            }
            self.parentIM = destinationIM;
            return self; 
          })
          .then(function(result) {
            console.log(result); 
            return result; 
          }, function(error) { 
            return error; 
          });
        },

  			deleteItem : function() {
          var self = this;
          return this.parentIM.deleteAssociation(this.guid)
          .then(function(result) { 
            self.parentIM.refresh();
            return result; 
          }, function(error) { 
            return error; 
          });
        },

  			toggleExpand : function() {
  				//if sub-folders - createIm, getAssociations, createLIs - set newIm as the parent for li, displayname , prev, next
  			},

        addChildItem : function() {
          // Use temp info to create LI immediately
          var tempTitle = 'New Item ' + String(this.items.length + 1);
          var tempGUID = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
          
          // Create new LI and add it to the model
          var newLiObj = new LI(tempGUID, null, this.selfIM, null);
          this.items.push(newLiObj);

          // Async code to make and set the selfIM for the new liObj
          var self = this;
          return this.selfIM.createAssociation(tempTitle)
          .then(function(GUID) { return self.selfIM.createIMsForGroupingItems([GUID]); })
          .then(function(IMs) {
            var imObj = IMs[0];
            for(var i = 0; i < self.items.length; i++) {
              if(self.items[i].guid === tempGUID) {
                var liObj = self.items[i];
                // Set the permanent GUID and SelfIM
                liObj.selfIM = imObj;
                liObj.guid =imObj.GUID;
                liObj.tempTitle = tempTitle;
              }
            }
            return liObj;       
          }, function(error) { 
            return error; 
          });            
        }
  		};

  		return LI;
  	}]);

 });