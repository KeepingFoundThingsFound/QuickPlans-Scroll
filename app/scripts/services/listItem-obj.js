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
	  .then(function(result) { return imObj.addAssociationNamespaceAttribute('order', imObj);})
          .then(function(result) {
	    //Set the Ordering
	    var notesArray = new Array;
	    var unassignedNotes = new Array;
	    angular.forEach(imObj.notes, function(note, key){
	      if (note.order && note.order != null && note.order !== undefined && notesArray[i] === undefined) {
	       notesArray[note.order] = note;
	       delete note.order;
	      }else{
		unassignedNotes.push(note);
	      }
	    });
	    var i = 0;
	    while(i < notesArray.length){
	      if (notesArray[i] == null){
		if (unassignedNotes.length > 0) { //allocate notes to empty cells
		  notesArray[i] = unassignedNotes.pop();
		}else{ //clean up unneeded empty
		  notesArray.splice(i, 1);
		}
	      }
	      i++;
	    };
	    while(unassignedNotes.length > 0){
	      notesArray.unshift(unassignedNotes.pop());
	    };
	    // save the ordering and persist it in ItemMirror
	    for(var j = 0; j < notesArray.length; j++){
	      imObj.setNoteAssociationNamespaceAttribute('order', j, notesArray[j].GUID);
	    }
            return notesArray; 
          }, function(error) { 
            return error; 
          });
        },
	
	addPhantomNote : function(text) {
          var imObj = this.selfIM;
          if(!imObj) { return $q.when(null); }

          return imObj.createPhantomAssociation(text)
          .then(function(result) { 
            return imObj.notes; 
          }, function(error) { 
            return error; 
          });
        },
	
	deletePhantomNote : function(guid) {
	  var self = this;
          return this.parentIM.deleteAssociation(guid)
          .then(function(result) { -+
		
            self.parentIM.refresh();
            return result; 
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
          .then(function(result) { console.log("Self");
	    console.log(self.selfIM.itemMirror);console.log("Dest");
	    console.log(destinationIM.itemMirror); return destinationIM.refresh(); })
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
          .then(function(result) { -+
		
            self.parentIM.refresh();
            return result; 
          }, function(error) { 
            return error; 
          });
        },

  			toggleExpand : function() {
  				//if sub-folders - createIm, getAssociations, createLIs - set newIm as the parent for li, displayname , prev, next
  			},

        // Title is optional. If param is empty a temp title will be used
        addChildItem : function(title) {
          // Use temp info to create LI immediately
          var tempTitle = 'New Item ' + String(this.items.length + 1);
          var tempGUID = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
          
          // Create new LI and add it to the model
          var newLiObj = new LI(tempGUID, title, this.selfIM, null);
          this.items.push(newLiObj);

          // Async code to make and set the selfIM for the new liObj
          var self = this;
          return this.selfIM.createAssociation(title || tempTitle)
          .then(function(GUID) { return self.selfIM.createIMsForGroupingItems([GUID]); })
          .then(function(IMs) {
            var imObj = IMs[0];
            for(var i = 0; i < self.items.length; i++) {
              if(self.items[i].guid === tempGUID) {
                var liObj = self.items[i];
                // Set the permanent GUID and SelfIM
                liObj.selfIM = imObj;
                liObj.guid =imObj.GUID;
                if(!title) { 
                  liObj.tempTitle = tempTitle;
                }
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