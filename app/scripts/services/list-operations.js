define(['./module','angular','ItemMirror'], function (services,angular,ItemMirror) {  
  'use strict';
  
  services.factory('listOp', ['$q','LI','IM','dropboxAuth', function($q, LI, IM, dropboxAuth){

    // Private variables
    var client;
    var listItems;
    var sortedListItems;
    var MAXDEPTH = 2;
    var currentDepth = 0;

    function buildList() {
      client = dropboxAuth.getClient();

      // Create the IM for root and call the recursive helper function to build the whole list
      var deferred = $q.defer();
      var rootIM = new IM(client);
      rootIM.constructItemMirror()
      .then(function(rootIM) {
        // Create the ListItem for Root (GUID, title [, parentIM, selfIM])
        // All other list items will be nested in this one
        listItems = new LI('root','root', null, rootIM);  
        sortedListItems = new LI('root','root', null, rootIM); 
        return buildTreeRecursive(rootIM, listItems); 
      })
      .then(function(){
        return sortView();
      })
      .then(function() {
        deferred.resolve(sortedListItems);
      });
      return deferred.promise;
    }

    function buildTreeRecursive(imObj,liObj) {
      //console.log('Called buildTreeRecursive');
      return imObj.getAssociationGUIDs()
        .then(function(GUIDs) { return imObj.getGroupingItems(GUIDs); })
        .then(function(GUIDs) { return imObj.createIMsForGroupingItems(GUIDs); })
        .then(function(associations) { 
          // Retrieves all display names and sets them as local property for each IM object
          return $q.all(associations.map(function(assoc) {
            return assoc.getDisplayName();
          }));
        })
        .then(function(associations) { 
          // Adds namespace priority association if one does not already exist
          return $q.all(associations.map(function(assoc) {
            var namespaceattr;
            imObj.getAssociationNamespaceAttribute('priority', assoc).then(function(attr){
              namespaceattr = attr;
            })
            if (namespaceattr != null || namespaceattr != "") {
              return imObj.getAssociationNamespaceAttribute('priority', assoc);
            }else{
              return imObj.addAssociationNamespaceAttribute('priority', assoc);
            }
          }));
        })
        //.then(function(associations){
        //  //Adds a priority namespace attribute to folders which do not have one
        //  return $q.all(associations.map(function(assoc){
        //    console.log("get priority");
         //   return imObj.getAssociationNamespaceAttribute('priority', assoc);
         // }));
        //})
        .then(function(associations) { 
          currentDepth++;
          return $q.all(associations.map(function(assoc) {
            // Create an LI and insert it inside the liObj
            // imObj is the parent IM and assoc is the selfIM
            var newListItem = new LI(assoc.GUID, assoc.displayName, imObj, assoc);
            newListItem.priority = assoc.priority;
            liObj.items.push(newListItem);
            // Recursive call with new IM and LI objects
            if(currentDepth < MAXDEPTH) {
              return buildTreeRecursive(assoc, newListItem);
            } else {
              // Return empty array as base case for max depth and reset depth
              // TODO: Implement isExpanded property instead of maxDepth 
              currentDepth = 0;
              return [];
            }
          }));
        });
    }

    function sortView() {
      //takes in created listElements
      //console.log('Inside sort view');
      var arr = listItems.items;
      var prop = 'priority';
      (function sortRecursive(tempLI,arr){
          arr.sort(function (a, b) {
              if (a[prop] < b[prop]) {
                  return -1;
              } else if (a[prop] > b[prop]) {
                  return 1;
              } else {
                  return 0;
              }
          });
          tempLI['items'] = arr;
          for(var i=0;i<arr.length;i++){
            if(arr[i].items.length !== 0){
                sortRecursive(arr[i],arr[i].items);
            }
          }
      }(sortedListItems,arr));
      return 1;
    }

    function setPriority(tempList){

      function setPriorityForItems(items){
        for(var i=0; i< items.length; i++){
          items[i].priority = i+1;
        }
        return items;
      }

      function setPriorityRecursive(temp){
        //console.log('Inside recursive priority');
        var items = setPriorityForItems(temp.items);
        
        return $q.all(items.map(function(item){
          return item.parentIM.setAssociationNamespaceAttribute('priority', item.priority, item.selfIM);
        }))
        .then(function(){
          return $q.all(items.map(function(item){
            //console.log(item);
            return setPriorityRecursive(item);
          }));
        });
      }  
      return setPriorityRecursive(tempList); 
    }

    //return the object, if this class should be written as 
    return {
      'buildList' : buildList,
      'setPriority' : setPriority
    };

  }]);


 });