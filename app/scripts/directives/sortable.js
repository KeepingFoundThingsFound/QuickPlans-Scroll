define(['./module','angular'], function (directives,angular) {

    directives.directive('sortable', function() {
        return function(scope, element, attrs) {
 
        // variables used for dnd
        var toUpdate;
        var startIndex = -1;
         
        // watch the model, so we always know what element
        // is at a specific position
        scope.$watch(attrs.sortable, function(order) {
            toUpdate = order;
        },true);
         
        // use jquery to make the element sortable (dnd). This is called
        // when the element is rendered
        $(element[0]).sortable({
            items:'div.note',
            start:function (event, ui) {
                    // on start we define where the item is dragged from
                    startIndex = ($(ui.item).index());
            },
            handle:'*:not(p,p.web-link)',
            delay: 50,
            stop:function (event, ui) {
                // on stop we determine the new index of the
                // item and store it there
                var newIndex = ($(ui.item).index());
                var toMove = toUpdate[startIndex];
                toUpdate.splice(startIndex,1);
                toUpdate.splice(newIndex,0,toMove);
                var LowestIndex;
                if (startIndex != newIndex){
                    if (startIndex < newIndex) {
                        LowestIndex = startIndex;
                    }else{ //startIndex >= newIndex
                        LowestIndex = newIndex;
                    }
                }

                // we move items in the array, if we want
                // to trigger an update in angular use $apply()
                // since we're outside angulars lifecycle
                scope.$apply(scope.currentNotes);
                for(var i = scope.currentNotes.length - 1; i >= LowestIndex; i--){
                    scope.currentList.selfIM.setNoteAssociationNamespaceAttribute('order', i, scope.currentNotes[i].GUID);
                };
                
            },
            axis:'y'
        }).enableSelection();
        }
    });
    
});
