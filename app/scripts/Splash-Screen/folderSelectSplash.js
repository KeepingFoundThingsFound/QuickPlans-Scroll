/**
 *
 *
 */

  require(["ItemMirror"], function(ItemMirror){
    "use strict";

      var DESTURL = 'index.html'; // the page you want to redirect to and append the path after
      var MAXFOLDERS = 200; // how many folders to list out
      var DELIMITER = "#/";
      
    var
      dropboxClientCredentials,
      //dropboxAuthDriver,
      dropboxClient,
      dropboxXooMLUtility,
      dropboxItemUtility,
      mirrorSyncUtility,
      groupingItemURI,
      itemMirrorOptions,
      createAssociationOptions;
      
dropboxClientCredentials = {
      key: 'e87djjebo1o8vwe',
    };
    
dropboxClient = new Dropbox.Client(dropboxClientCredentials);
    //nope
    //dropboxClient.authDriver(dropboxAuthDriver);
    dropboxXooMLUtility = {
      driverURI: "DropboxXooMLUtility",
      dropboxClient: dropboxClient
    };
    dropboxItemUtility = {
      driverURI: "DropboxItemUtility",
      dropboxClient: dropboxClient
    };
    mirrorSyncUtility = {
      utilityURI: "MirrorSyncUtility"
    };
    
//TODO make it so you can pass in a delimiter
      groupingItemURI = "/";
      
      
itemMirrorOptions = {
      1: {
        groupingItemURI: groupingItemURI,
        xooMLDriver: dropboxXooMLUtility,
        itemDriver: dropboxItemUtility
      },
      2: {
        groupingItemURI: groupingItemURI,
        xooMLDriver: dropboxXooMLUtility,
        itemDriver: dropboxItemUtility,
        syncDriver: mirrorSyncUtility,
        readIfExists: false
      },
      3: {
        groupingItemURI: groupingItemURI,
        xooMLDriver: dropboxXooMLUtility,
        itemDriver: dropboxItemUtility,
        syncDriver: mirrorSyncUtility,
        readIfExists: true
      }
    };
      
      function run() {
        dropboxClient.authenticate(function (error, client) {
          if (error) {
            throw error;
          }
          constructNewItemMirror();
        });
      };
      
      //Construct an itemMirror object and do something with it
      function constructNewItemMirror() {
        console.log("Now Creating new itemMirror");
        new ItemMirror(itemMirrorOptions[3], function (error, itemMirror) {
          if (error) { throw error; }
          console.log("Created new itemMirror");
          listAssociations(itemMirror);
        });
      };
  
      //get an array of Association GUIDs and do something with it.
      function listAssociations(itemMirror, groupingItemURI){
            var displayText;
            var cap = MAXFOLDERS;
            var length;
            console.log(itemMirror);
            $('a#upOneLvl').remove();
            $('#modalDialog div.modal-body ul').empty();
            $('div#modalDialog div.modal-footer p').remove();
            $('div#modalDialog div.modal-footer').prepend($('<p>',{text: groupingItemURI}).css('float', 'left'));
           itemMirror.listAssociations(function (error, GUIDs){
            itemMirror.getParent(function(error, parent){
              if (parent) {
                upOneLevel(parent);
              }
            });
            if (GUIDs.length >= cap) {
              length = cap
            }else {
              length = GUIDs.length
            }
            for (var i=0;i<length;i++){
              itemMirror.getAssociationDisplayText(GUIDs[i], function(error, text){
                displayText = text;
              });
              prntAssoc(error, displayText, GUIDs[i], itemMirror);
            }
            if (error) {
              console.log(error);
            }
          });
      };
  
      //Event handler for navigating into a subfolder/child grouping item
      //you've clicked on
      function createItemMirrorFromGroupingItem(event) {
          var itemMirror = event.data.itemmirror;
          var GUID = event.data.guid;
          console.log("Now creating a grouping item for " + GUID);
          itemMirror.createItemMirrorForAssociatedGroupingItem(
            GUID, function (error, newItemMirror) {
            if (error) { throw error; }
            
            newItemMirror.getGroupingItemURI(function (error, groupingItemURI) {
                listAssociations(newItemMirror, groupingItemURI);
                $('div#modalDialog button').click(function (e) {
                        console.log(groupingItemURI);
                        window.location.assign(DESTURL + DELIMITER + groupingItemURI);
                        //window.location.reload(); RELOAD NOT REQUIRED WHEN REDIRECT FROM DIFFERENT PAGE
                  });
            });
          });
      };
  
      function alertSchemaVersion(itemMirror) {
        // Most "get" methods follow this pattern. Check documentation to be sure.
        itemMirror.getSchemaVersion(function (error, schemaVersion) {
          if (error) {
            throw error;
          }
          alert(schemaVersion);
        });
      };
  
      /**
       *The Printout for individual iM Associations
       *Uses jQuery to manipulate the DOM
       **/
      function prntAssoc(error, displayText, GUID, itemMirror){
        if (error) {
            throw error;
        }
        
        itemMirror.isAssociatedItemGrouping(GUID, function(error, isGroupingItem){
          if (isGroupingItem) {
              var $thisAssoc;
              $thisAssoc = $('<li>', {'text': " " + displayText});
              $thisAssoc.prepend($('<span>', {class:'glyphicon glyphicon-folder-close'}));
              $thisAssoc.bind("click",{guid:GUID, itemmirror:itemMirror},createItemMirrorFromGroupingItem);
            $('#modalDialog div.modal-body ul').append($thisAssoc);
          }
        });
        
      };
      
      //Print an up one level button or link
      function upOneLevel(parent) {
        $('a#upOneLvl').remove();
       $('<a>', {'class': "btn btn-primary btn-sm active", 'href':"#" + parent._groupingItemURI, 'text':"^ Up One Level ^", id: "upOneLvl"}).on("click", function(){
          if (parent) {
            listAssociations(parent, parent._groupingItemURI)
           }
       }).insertBefore('#modalDialog div.modal-body ul');
      };
    run(); //this would start the script
      $('#modalDialog').modal('show');
  });