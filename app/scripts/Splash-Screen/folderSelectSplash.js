

  /**
   * If you ever get an error "require is undefined", it's because you have not included the
   * require.js dependency on your page. See the <script> tag in this document ending with
   * "require.js"
   */
  require(["ItemMirror"], function(ItemMirror){
    "use strict";
    
        // Insert your Dropbox app key here:

      var DESTURL = 'index.html';

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
        // Construct new ItemMirror in Case 3, could choose other cases
        console.log("Now Creating new itemMirror");
        new ItemMirror(itemMirrorOptions[3], function (error, itemMirror) {
          if (error) { throw error; }
          console.log("Created new itemMirror");
          //SchemaVersion 0.54
          //alertSchemaVersion(itemMirror);
          listAssociations(itemMirror);
        });
      };
  
      //get an array of Association GUIDs and do something with it.
      function listAssociations(itemMirror){
            var displayText;
            //Limit output to x associations
            var cap = 200;
            var length;
            console.log(itemMirror);
            $('#modalDialog div.modal-body ul').empty();
           itemMirror.listAssociations(function (error, GUIDs){
            itemMirror.getParent(function(error, parent){
              if (parent) {
                upOneLevel(parent);
              }
            });
            //make sure length does not exceed cap.
            if (GUIDs.length >= cap) {
              length = cap
            }else {
              length = GUIDs.length
            }
            //var isGroupingItem;
            //loop across GUID up to length
            for (var i=0;i<length;i++){
            //for (var i=0;i<10;i++){
              //code to get displayText and print it out
              //console.log("Reading GUID:" + GUIDs[i]);
              //get Displaytext for Association
              itemMirror.getAssociationDisplayText(GUIDs[i], function(error, text){
                displayText = text;
                //Check if this Association is a Grouping Item (a folder in the case of dropbox)
              });
              //Print the Association
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
          //event.stopPropagation();
          var itemMirror = event.data.itemmirror;
          //console.log(itemMirror);
          var GUID = event.data.guid;
          //This will always run the constructor on Case 3, but has the added benefit of
          //adding a Parent for successful back-navigation
          console.log("Now creating a grouping item for " + GUID);
          itemMirror.createItemMirrorForAssociatedGroupingItem(
            GUID, function (error, newItemMirror) {
            if (error) { throw error; }
            //console.log(newItemMirror);
            //newItemMirror._groupingItemURI = newItemMirror._groupingItemURI;
            listAssociations(newItemMirror);
            newItemMirror.getGroupingItemURI(function (error, groupingItemURI) {
                $('div#modalDialog button').click(function (e) {
                        console.log(groupingItemURI);
                        window.location.assign(DESTURL + "#/" + groupingItemURI);
                        //window.location.reload();
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
          // do something with schemaVersion
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
        //code for print to screen
        //var $thisAssoc = $('<div>'/*, {'class':"explorirror"}*/);
        
        itemMirror.isAssociatedItemGrouping(GUID, function(error, isGroupingItem){
          if (isGroupingItem) {
              //console.log("GUID is " + GUID);
              //console.log("break");
              var $thisAssoc;
              $thisAssoc = $('<li>', {'text': " " + displayText});
              $thisAssoc.prepend($('<span>', {class:'glyphicon glyphicon-folder-close'}));
              //$thisAssoc.prepend($('<img>', {'src':"Folder.png", 'alt':displayText, 'title':displayText}));
              $thisAssoc.bind("click",{guid:GUID, itemmirror:itemMirror},createItemMirrorFromGroupingItem);
            $('#modalDialog div.modal-body ul').append($thisAssoc);
          }
          //else{
          //  $thisAssoc.prepend($('<img>', {'src':"Document.png", 'alt':displayText, 'title':displayText}));
          //}
        });
        
      };
      
      //Print an up one level button or link
      function upOneLevel(parent) {
        $('a#upOneLvl').remove();
       $('<a>', {'href':"#" + parent._groupingItemURI, 'text':"^ Up One Level ^", id: "upOneLvl"}).on("click", function(){
          if (parent) {
            listAssociations(parent)
             //Event Handler for taking it back to parent
           }
       }).insertBefore('#modalDialog div.modal-body ul');
      };
    run(); //this would start the script
      $('#modalDialog').modal('show');
  });