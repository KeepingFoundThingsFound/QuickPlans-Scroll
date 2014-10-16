define(['./module','angular','ItemMirror'], function (services,angular,ItemMirror) {
  'use strict';

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
      if (/#\/(.*)/.exec(window.location.href)) {
        this.groupingItemURI = decodeURI(/#\/(.*)/.exec(window.location.href)[1]);
        // this.groupingItemURI = '/';
      }else{
        this.groupingItemURI = null;
      }
      // this.groupingItemURI = '/';

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

      // Object Properties
      this.itemMirror = null;
      this.GUID = null;
      this.displayName = null;
      this.priority = 0; // object of association attributes to be assigned to LI

      this.associationGUIDs = [];      // string array of all GUIDs
      this.orderedGUIDs = [];    // string array of sorted assoc GUIDs
      this.listitemGUIDs = [];   // string array of list items (groupingItem GUIDs)
      this.notes = {};          // key-value object. Key = GUID. Value = displayname

      this.namespaceURI = 'quickplans'; // URI for this webapp
    }

    IM.prototype = {

      refresh : function() {
        var self = this;
        var deferred = $q.defer();
        if(this.itemMirror) { 
          this.itemMirror.refresh(function(error) {
            if (error) { deferred.reject(error); }
            console.log('ItemMirror object synced');
            deferred.resolve(self);
          });
        } else {
          deferred.reject('No itemMirror Object');
        }
        return deferred.promise;
      },

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
          console.log('Create item mirror for associated Item');
          deferred.resolve(itemMirror);
        });

      },

      // Return an array of itemMirror objects from an array of GUIDs
      createIMsForGroupingItems : function(GUIDs) {
        var self = this;
        GUIDs = GUIDs.filter(function(e) { return (e===undefined||e===null||e==='')? false : ~e; });
        // Map the GUIDs into an array of promises
        var promises = GUIDs.map(function(GUID) {
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
          deferred.resolve(GUID);  
        });
        return deferred.promise;
      },
      
      createPhantomAssociation : function(name) {
        var self = this;
        var deferred = $q.defer();

        console.log("Creating Phantom Association: " + name);
        
        var options = {
          displayText: name, // Display text for the association. Required in all cases.
          //itemURI: "", // URI of the item. Required for case 2 & 3.
          //localItemRequested: false, // True if the local item is requested, else false. Required for cases 2 & 3.
          //groupingItemURI: "", // URI of the grouping item. Required for cases 4 & 5.
          //xooMLDriverURI: "", // URI of the XooML driver for the association. Required for cases 4 & 5.
          //itemName: name, // URI of the new local non-grouping/grouping item. Required for cases 6 & 7.
          //isGroupingItem: 'false' // String? True if the item is a grouping item, else false. Required for cases 6 & 7.]
        };

        this.itemMirror.createAssociation(options, function(error, GUID) {
          if(error) {   console.log("Error: " + error);
                        deferred.reject(error); }
          console.log("GUID: " + GUID);
            if (!error) { 
              if(self.notes[GUID] === undefined) { self.notes[GUID] = {}; }
              self.notes[GUID].text = name;
              self.notes[GUID].GUID = GUID;
            }
          deferred.resolve(GUID);  
        });
        return deferred.promise;
      },

      deleteAssociation : function(GUID) {
        var deferred = $q.defer();
        this.itemMirror.deleteAssociation(GUID, function(error) {
          if (error) { deferred.reject(error); }
          console.log("Item Deleted");
          deferred.resolve('Item Deleted from folder');          
        });
        return deferred.promise;
      },

      // Gets array of GUIDs
      getAssociationGUIDs : function() {
        var self = this;
        /**
        var deferred = $q.defer();
        this.itemMirror.listAssociations(function (error, GUIDs) {
          if (error) { deferred.reject(error); }
          // Save GUIDs into factory object for reuse
          self.associationGUIDs = GUIDs;
          deferred.resolve(GUIDs);
        });
        return deferred.promise;
        **/
        var deferred = $q.defer();
        var GUIDs = this.itemMirror.listAssociations();
        self.associationGUIDs = GUIDs;
        deferred.resolve(GUIDs)
        return deferred.promise;;
      },

      // Gets display names of a GUID array
      // Use for PHANTOM ASSOCIATIONS
      getPhantomDisplayText : function() {
        var self = this;
        var GUIDs = this.orderedGUIDs;
        var promises = GUIDs.map(function(GUID, index) {
          var deferred  = $q.defer();
          
          /**
          self.itemMirror.getAssociationDisplayText(GUID, function(error, displayText) {
            if (!error) { 
              if(self.notes[GUID] === undefined) { self.notes[GUID] = {}; }
              self.notes[GUID].text = displayText;
              self.notes[GUID].GUID = GUID;
              self.itemMirror.getAssociationNamespaceAttribute("order", GUID, self.namespaceURI, function(error, associationNamespaceAttribute) {
                if (error) { console.log(error); }
                self.notes[GUID].order = associationNamespaceAttribute || null;
              });
            }
            deferred.resolve(displayText);
          });
          **/
          
          var displayText = self.itemMirror.getAssociationDisplayText(GUID);
          if(self.notes[GUID] === undefined) { self.notes[GUID] = {}; }
              self.notes[GUID].text = displayText;
              self.notes[GUID].GUID = GUID;
          deferred.resolve(displayText);
          return deferred.promise;
        });
        return $q.all(promises);
      },

      getPhantomURL : function() {
        var self = this;
        var GUIDs = this.orderedGUIDs;
        var promises = GUIDs.map(function(GUID) {
          var deferred  = $q.defer();
          
          /**
          self.itemMirror.getAssociationAssociatedItem(GUID, function(error, url) {
            if (!error) { 
              if(self.notes[GUID] === undefined) { self.notes[GUID] = {}; }
              self.notes[GUID].url = url;
            }
            deferred.resolve(url);
          });
          **/
          
          
          var url = self.itemMirror.getAssociationAssociatedItem(GUID);
          if(self.notes[GUID] === undefined) { self.notes[GUID] = {}; }
            self.notes[GUID].url = url;
          deferred.resolve(url);
          return deferred.promise;
        });
        return $q.all(promises);
      },

      // Gets display names of a GUID array
      makeAssociationObjects : function(GUIDs) {
        var self = this;
        var promises = GUIDs.map(function(GUID) {
          var deferred  = $q.defer();
          
          /**
          self.itemMirror.getAssociationDisplayText(GUID, function(error, displayText) {
            if (error) { deferred.reject(error); }

            var item;
            item.GUID = GUID;
            item.title = displayText;

            deferred.resolve(item);
          });
          **/
          var item;
          item.GUID = GUID;
          item.title = self.itemMirror.getAssociationDisplayText(GUID);
          deferred.resolve(item);
          
          return deferred.promise;
        });
        return $q.all(promises);
      },


      // Adds the given attributeName to the association with the given GUID and namespaceURI.
      // Use this to add prev, next, isExpanded attributes to new objects
      addAssociationNamespaceAttribute : function(attributeName, assocIM) {
        var self = this;
        var deferred = $q.defer();
        var GUID = assocIM.GUID;
        //console.log(GUID);
        if(GUID) {
          
          /**
          this.itemMirror.addAssociationNamespaceAttribute(attributeName, GUID, this.namespaceURI, function(error) {
            //if(error) { console.log('Attribute already exists: ' + error); }
            deferred.resolve(assocIM);
            
          });
          **/
          console.log("Adding Association Namespace Attribute");
          this.itemMirror.addAssociationNamespaceAttribute(attributeName, "", GUID, this.namespaceURI);
          this.itemMirror.save(function(error){
            if (error) {
              console.log(error);
              console.log("itemMirror has encountered an error while saving");
            }
            console.log("Finished Adding Association Namespace Attribute");
          });
          deferred.resolve(assocIM);
        } else { 
          deferred.resolve(assocIM);
        }
        return deferred.promise;
      },

      getAssociationNamespaceAttribute : function(attributeName, assocIM) {
        var self = this;
        var deferred = $q.defer();
        var GUID = assocIM.GUID;
        if(GUID) {
          
          /**
          this.itemMirror.getAssociationNamespaceAttribute(attributeName, GUID, this.namespaceURI, function(error, associationNamespaceAttribute) {
            if (error) { console.log(error); }
            assocIM[attributeName] = associationNamespaceAttribute || 0;
            deferred.resolve(assocIM);
          });
          **/
          console.log("getting assoc ns");
          assocIM[attributeName] = this.itemMirror.getAssociationNamespaceAttribute(attributeName, GUID, this.namespaceURI) || 0;
          console.log("getting assoc ns");
          deferred.resolve(assocIM);
        } else { 
          deferred.resolve(assocIM);
        }
        return deferred.promise;
      },

      setAssociationNamespaceAttribute : function(attributeName, attributeValue, assocIM) {
        var self = this;
        var deferred = $q.defer();
        var GUID = assocIM.GUID;
        console.log("setting assoc ns");
        if(GUID) {
          
          /**
          this.itemMirror.setAssociationNamespaceAttribute(attributeName, attributeValue, GUID, this.namespaceURI, function(error) {
            if (error) { deferred.reject(error); }
            assocIM[attributeName] = attributeValue;
            deferred.resolve(assocIM);
          });
          **/
          this.itemMirror.setAssociationNamespaceAttribute(attributeName, attributeValue, GUID, this.namespaceURI);
          assocIM[attributeName] = attributeValue;
          deferred.resolve(assocIM);
        } else {
          deferred.resolve(assocIM);
        }
        console.log("setting assoc ns");
        return deferred.promise;
      },
      
      setNoteAssociationNamespaceAttribute : function(attributeName, attributeValue, GUID){
        var self = this;
        var deferred = $q.defer();
        if(GUID) {
          this.itemMirror.setAssociationNamespaceAttribute(attributeName, attributeValue, GUID, this.namespaceURI, function(error) {
            if (error) { deferred.reject(error); }
            deferred.resolve(self);
          });
        } else {
          deferred.resolve(self);
        }
        console.log("setting ns");
        return deferred.promise;
      },
      
      // Gets the name of the itemMirror object
      getDisplayName : function() {
        var self = this;
        var deferred = $q.defer();
        
        /**
        this.itemMirror.getDisplayName(function(error, displayName) {
          if (error) { deferred.reject(error); }
          self.displayName = displayName;
          // Return the whole IM object so this method can be used in chaining
          deferred.resolve(self);
        });
        **/
        self.displayName = this.itemMirror.getDisplayName();
        deferred.resolve(self);
        
        return deferred.promise;
      },

      // Takes an array of GUIDS and removes non-grouping items from the array
      getGroupingItems : function() {
        var self = this;
        // Map the GUIDs into an array of promises
        var promises = this.associationGUIDs.map(function(GUID) {
          var deferred  = $q.defer();
          
          /**
          self.itemMirror.isAssociatedItemGrouping(GUID, function(error, isGroupingItem) {
            // Removed error handling: resolve errors with a null value
            // Return GUID string only for grouping items
            // Store ALL GUIDS for phantom and real assoc in local array so they can be used later
              self.orderedGUIDs.push(GUID);
            if(isGroupingItem) { 
              self.listitemGUIDs.push(GUID);
              deferred.resolve(GUID); 
            } else {
              // Return null value to be filtered out below
              // It's necessary to return some value in order for q.all to succeed
              deferred.resolve(null); 
            }
          });
          **/
          
          if(self.itemMirror.isAssociationAssociatedItemGrouping(GUID)){
            deferred.resolve(GUID); 
          }else{
            // Store GUIDS for phantom assoc in local array so they can be used later
              self.orderedGUIDs.push(GUID);
              // Return null value to be filtered out below
              // It's necessary to return some value in order for q.all to succeed
              deferred.resolve(null); 
          }
          
          return deferred.promise;
        });
        // After promises are resolved, filter out null values and return resulting GUIDs
        return $q.all(promises)
        .then(function(result) { 
          return result.filter(function(val) {
            return (typeof val === 'string');
          });
        });
      },

      isAssociationAssociatedItemGrouping : function(GUID) {
        var deferred = $q.defer();
        
        /**
        this.itemMirror.isAssociatedItemGrouping(GUID, function(error, isGroupingItem) {
          if (error) { deferred.reject(error); }
          deferred.resolve(isGroupingItem);
        });
        **/
        
        deferred.resolve(this.itemMirror.isAssociationAssociatedItemGrouping(GUID));
        
        return deferred.promise;
      },

      listAssociationNamespaceAttributes : function(GUID) {
        var deferred = $q.defer();
        
        /**
        this.itemMirror.listAssociationNamespaceAttributes(GUID, this.namespaceURI, function(error, array) {
          if (error) { deferred.reject(error); }
          deferred.resolve(array);
        });
        **/
        console.log("listing ns");
        deferred.resolve(this.itemMirror.listAssociationNamespaceAttributes(GUID, this.namespaceURI));
        console.log("listing ns");
        return deferred.promise;
      },

      moveAssociation : function(GUID, destinationItemMirror) {
        var self = this;
        var deferred = $q.defer();
        console.log(destinationItemMirror);
        
        
        this.itemMirror.moveAssociation(GUID, destinationItemMirror, function(error) {
          if (error) { console.log(error); deferred.reject(error); }
          deferred.resolve('Item moved to new folder');
          self.itemMirror.refresh();
          //destinationItemMirror.sync(function(error) {
          //  if (error) { deferred.reject(error); }
          //  console.log('ItemMirror object synced');
          //  deferred.resolve(self);
          //});
        });
        
        
        return deferred.promise;   
      },
      
      // Not yet implemented in the itemMirror library
      renameLocalItem : function(GUID, newName) {
        var deferred = $q.defer();
        
        this.itemMirror.renameLocalItem(GUID, newName, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve('Item renamed');
        });
        
        return deferred.promise; 
      },

      setAssociationDisplayText : function(GUID, displayText) {
        var deferred = $q.defer();
        
        /**
        this.itemMirror.setAssociationDisplayText(GUID, displayText, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve('Display text updated');
        });
        **/
        
        this.itemMirror.setAssociationDisplayText(GUID, displayText);
        deferred.resolve('Display text updated');
        
        return deferred.promise; 
      },

      setFragmentNamespaceAttribute : function(attributeName, attributeValue, GUID) {
        var deferred = $q.defer();
        
        /**
        this.itemMirror.setFragmentNamespaceAttribute(attributeName, attributeValue, GUID, this.namespaceURI, function(error) {
          if (error) { deferred.reject(error); }
          deferred.resolve(attributeName + ' attribute assigned value ' + attributeValue);
        });
        **/
        console.log("setting frag ns");
        this.itemMirror.setFragmentNamespaceAttribute(attributeName, attributeValue, this.namespaceURI);
        deferred.resolve(attributeName + ' attribute assigned value ' + attributeValue);
        console.log("setting frag ns");
        return deferred.promise; 
      }

    };
    return IM;
  }]);
});
