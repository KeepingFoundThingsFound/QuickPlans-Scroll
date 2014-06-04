define(['./module','angular','ItemMirror'], function (services,angular,ItemMirror) {
  'use strict';

  // Check if dependencies are in scope
  // console.log('jquery: ' + typeof($));
  // console.log('ItemMirror: ' + typeof(ItemMirror));
  // console.log('Dropbox: ' + typeof(Dropbox));

  services.factory('IM', ['$q',function($q){

    function IM(dropboxClient) {
      this.dropboxClient = dropboxClient;

      this.dropboxXooMLUtility = {
        driverURI: 'DropboxXooMLUtility',
        dropboxClient: this.dropboxClient
      };
      this.dropboxItemUtility = {
        driverURI: 'DropboxItemUtility',
        dropboxClient: this.dropboxClient
      };
      this.mirrorSyncUtility = {
        utilityURI: 'MirrorSyncUtility'
      };

      // Staring folder in Dropbox
      this.groupingItemURI = '/2014-06, HTML5 MSIM IS, shared/final week demonstration';

      // Set up all of the item mirror options, even though
      //chances are the only one you're going to use is case 3
      this.itemMirrorOptions = {
        1: {
          groupingItemURI: this.groupingItemURI,
          xooMLDriver: this.dropboxXooMLUtility,
          itemDriver: this.dropboxItemUtility
        },
        2: {
          groupingItemURI: this.groupingItemURI,
          xooMLDriver: this.dropboxXooMLUtility,
          itemDriver: this.dropboxItemUtility,
          syncDriver: this.mirrorSyncUtility,
          readIfExists: false
        },
        3: {
          groupingItemURI: this.groupingItemURI,
          xooMLDriver: this.dropboxXooMLUtility,
          itemDriver: this.dropboxItemUtility,
          syncDriver: this.mirrorSyncUtility,
          readIfExists: true
        }
      };
      //console.log(this);
    }

    IM.prototype = {

      // Object Properties
      itemMirror : null,
      GUID: null,

      // associatedItemMirrors: [],  // itemMirror objects for associated grouping items
      associations : [],          // object array with title and guid as properties
      associationGUIDs : [],       // string array of GUIDs

      namespaceURI : '', // URI for this webapp

      // Use to create first ItemMirror from root or initial folder
      constructItemMirror : function() {
        var self = this;
        var deferred = $q.defer();
        new ItemMirror(this.itemMirrorOptions[3], function (error, itemMirror) {
          if (error) { deferred.reject(error); }
          // Save itemMirror object into factory object for reuse
          self.itemMirror = itemMirror;
          // It's not useful to return an itemMirror, so return IM (self)
          deferred.resolve(self);  
        });
        return deferred.promise;
      },

      // Create an itemMirror object based on a specific GUID
      createItemMirrorForAssociatedGroupingItem : function(GUID) {
        var self = this;
        var deferred = $q.defer();
        this.itemMirror.createItemMirrorForAssociatedGroupingItem(GUID, function(error, itemMirror) {
          if (error) { deferred.reject(error); }
          // Create a new IM object and assign the itemMirror object to it. Return the complete IM object.
          var imObj = new IM(self.dropboxClient);
          imObj.itemMirror = itemMirror;
          deferred.resolve(itemMirror);
        });
      },

      // Return an array of itemMirror objects from an array of GUIDs
      createIMsForGroupingItems : function() {
        var self = this;
        // Map the GUIDs into an array of promises
        var promises = this.associationGUIDs.map(function(GUID) {
          var deferred = $q.defer();
          self.itemMirror.createItemMirrorForAssociatedGroupingItem(GUID, function(error, itemMirror) {
            if (error) { deferred.reject(error); }

            // Create a new IM object and assign the itemMirror object to it. Return the complete IM object.
            var imObj = new IM(self.dropboxClient);
            imObj.itemMirror = itemMirror;
            imObj.GUID = GUID;
            deferred.resolve(imObj);
          });
          return deferred.promise;
        });
        return $q.all(promises);
      },

      // Adds the given attributeName to the association with the given GUID and namespaceURI.
      // Use this to add prev, next, isExpanded attributes to new objects
      addAssociationNamespaceAttribute : function(attributeName, GUID) {
        var deferred = $q.defer();
        this.itemMirror.addAssociationNamespaceAttribute(attributeName, GUID, this.namespaceURI, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve();
        });
        return deferred.promise;
      },

      createAssociation : function(name) {
        var self = this;
        var deferred = $q.defer();

        var options = {
          displayText: name, // Display text for the association. Required in all cases.
          //itemURI: "", // URI of the item. Required for case 2 & 3.
          //localItemRequested: false, // True if the local item is requested, else false. Required for cases 2 & 3.
          //groupingItemURI: "", // URI of the grouping item. Required for cases 4 & 5.
          //xooMLDriverURI: "", // URI of the XooML driver for the association. Required for cases 4 & 5.
          itemName: name, // URI of the new local non-grouping/grouping item. Required for cases 6 & 7.
          isGroupingItem: 'true' // String? True if the item is a grouping item, else false. Required for cases 6 & 7.]
        };

        this.itemMirror.createAssociation(options, function(error, GUID) {
          if (error) { deferred.reject(error); }
          // Store new association in the local array of GUIDs
          self.associationGUIDs.push(GUID);
          console.log(self.associationGUIDs);
          deferred.resolve(GUID);  
        });
        return deferred.promise;
      },

      deleteAssociation : function(GUID) {
        var deferred = $q.defer();
        this.itemMirror.deleteAssociation(GUID, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve();          
        });
      },

      // Gets array of GUIDs
      getAssociationGUIDs : function() {
        var self = this;
        var deferred = $q.defer();
        this.itemMirror.listAssociations(function (error, GUIDs) {
          if (error) { deferred.reject(error); }
          // Save GUIDs into factory object for reuse
          self.associationGUIDs = GUIDs;
          deferred.resolve(GUIDs);
        });
        return deferred.promise;
      },

      // Gets display names of a GUID array
      getAssociationNames : function(GUIDs) {
        var self = this;
        // If GUIDs is not provided as a param, check for locally stored GUIDs
        GUIDs = GUIDs || this.associationGUIDs;
        var promises = GUIDs.map(function(GUID) {
          var deferred  = $q.defer();
          self.itemMirror.getAssociationDisplayText(GUID, function(error, displayText) {
            if (error) { deferred.reject(error); }
            self.associations.push(displayText);
            deferred.resolve(displayText);
          });
          return deferred.promise;
        });
        return $q.all(promises);
      },

      getAssociationNamespaceAttribute : function(attributeName, GUID) {
        var deferred = $q.defer();
        this.itemMirror.getAssociationNamespaceAttribute(attributeName, GUID, this.namespaceURI, function(error, associationNamespaceAttribute) {
          if (error) { deferred.reject(error); }
          deferred.resolve(associationNamespaceAttribute);
        });
        return deferred.promise;
      },

      // Gets the name of the itemMirror object
      getDisplayName : function() {
        var self = this;
        var deferred = $q.defer();
        this.itemMirror.getDisplayName(function(error, displayName) {
          if (error) { deferred.reject(error); }
          self.displayName = displayName;
          deferred.resolve(displayName);
        });
        return deferred.promise;
      },

      // Takes an array of GUIDS and removes non-grouping items from the array
      getGroupingItems : function() {
        var self = this;
        // Map the GUIDs into an array of promises
        var promises = this.associationGUIDs.map(function(GUID) {
          var deferred  = $q.defer();
          self.itemMirror.isAssociatedItemGrouping(GUID, function(error, isGroupingItem) {
            if (error) { deferred.reject(error); }
            // Filter so only grouping items are returned
            if(isGroupingItem) { deferred.resolve(GUID); }
          });
          return deferred.promise;
        });
        return $q.all(promises);
      },

      isAssociatedItemGrouping : function(GUID) {
        var deferred = $q.defer();
        this.itemMirror.isAssociatedItemGrouping(GUID, function(error, isGroupingItem) {
          if (error) { deferred.reject(error); }
          deferred.resolve(isGroupingItem);
        });
        return deferred.promise;
      },

      listAssociationNamespaceAttributes : function(GUID) {
        var deferred = $q.defer();
        this.itemMirror.listAssociationNamespaceAttributes(GUID, this.namespaceURI, function(error, array) {
          if (error) { deferred.reject(error); }
          deferred.resolve(array);
        });
        return deferred.promise;
      },

      moveAssociation : function(GUID, destinationItemMirror) {
        var deferred = $q.defer();
        this.itemMirror.moveAssociation(GUID, destinationItemMirror, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve();
        });
        return deferred.promise;   
      },
      
      // Not yet implemented in the itemMirror library
      renameLocalItem : function(GUID) {
        var deferred = $q.defer();
        this.itemMirror.renameLocalItem(GUID, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve();
        });
        return deferred.promise; 
      },

      setAssociationDisplayText : function(GUID, displayText) {
        var deferred = $q.defer();
        this.itemMirror.setAssociationDisplayText(GUID, displayText, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve();
        });
        return deferred.promise; 
      },

      setFragmentNamespaceAttribute : function(attributeName, attributeValue, GUID) {
        var deferred = $q.defer();
        this.itemMirror.setFragmentNamespaceAttribute(attributeName, attributeValue, GUID, this.namespaceURI, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve();
        });
        return deferred.promise; 
      }

    };
    return IM;
  }]);
});
