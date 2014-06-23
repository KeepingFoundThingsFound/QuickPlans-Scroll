define(['./module','angular'], function (services,angular) {

'use strict';

  services.factory('dropboxAuth', ['$q',function($q) {
    var dropboxClientCredentials = {

      // App credentials for app-specific Dropbox folder (Quickplans KFTF)
      //key: 'uz03nsz5udagdff',
      //secret: 'cjh49vw2w572xfp'
      
      //App credentials for full dropbox access (KFTF)
      key: 'e87djjebo1o8vwe',
      secret: 'ylfsrck3qicvx81'

      // App credentials for full dropbox access (Project Plans)
      // key: 'jrt7eykb5odmd98',
      // secret: 'ayrxakqedjss46f'
    };

    var dropboxClient = new Dropbox.Client(dropboxClientCredentials);
    var authenticatedClient = null;

    function getClient() {
      return authenticatedClient;
    }

    function connectDropbox() {
      var deferred = $q.defer();

      if(authenticatedClient) {
        console.log('Dropbox authenticated');
        deferred.resolve(authenticatedClient);
      } else {
        console.log('Dropbox authenticating...');
        dropboxClient.authenticate(function (error, client) {
            if (error) { deferred.reject(error); }
            authenticatedClient = client;

            // Need this redirect to prevent digest from entering an infinite loop
            window.location.href = window.location.href + '#';
            deferred.resolve(client);
        });       
      }
      return deferred.promise;
    }
  
    function disconnectDropbox() {
      dropboxClient.signOut();
    }

    return{
      connectDropbox : connectDropbox,
      disconnectDropbox : disconnectDropbox,
      getClient : getClient
    };

  }]);

});

