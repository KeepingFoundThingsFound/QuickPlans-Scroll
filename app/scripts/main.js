require.config({
  baseUrl: '/scripts',
  paths: {
    jQuery: '../bower_components/jquery/jquery.min',
    'jQuery-UI': '../bower_components/jquery-ui/ui/jquery-ui',
    Rangy: '../bower_components/rangy/rangy-core',
    Hallo: '../bower_components/hallo.js/hallo.min',
    hallo: '../bower_components/hallo.js/hallo',
    angular: '../bower_components/angular/angular',
    'angular-route': '../bower_components/angular-route/angular-route',
    'angular-ui-tree': '../bower_components/angular-ui-tree/dist/angular-ui-tree',
    ItemMirror: '../bower_components/itemMirror/build/ItemMirror.dev',
    jquery: '../bower_components/jquery/jquery',
    dropbox: '../bower_components/dropbox.min/index',
    'angular-scenario': '../bower_components/angular-scenario/angular-scenario',
    'angular-sanitize': '../bower_components/angular-sanitize/angular-sanitize',
    'angular-resource': '../bower_components/angular-resource/angular-resource',
    'angular-mocks': '../bower_components/angular-mocks/angular-mocks',
    'angular-cookies': '../bower_components/angular-cookies/angular-cookies',
    'sass-bootstrap': '../bower_components/sass-bootstrap/dist/js/bootstrap'
  },
  shim: {
    angular: {
      exports: 'angular'
    },
    'angular-route': [
      'angular'
    ],
    'angular-ui-tree': [
      'angular'
    ],
    jQuery: {
      exports: 'jQuery'
    },
    Rangy: {
      exports: 'rangy'
    },
    dropbox: {
      exports: 'Dropbox'
    },
    Hallo: [
      'jQuery',
      'jQuery-UI',
      'Rangy'
    ]
  },
  priority: [
    'angular'
  ]
});

// Initialize the app
require(['jQuery', 'angular', 'angular-route', 'angular-ui-tree', 'dropbox', 'ItemMirror', 'Hallo', 'app', 'routes'],
  function ($, angular, Dropbox, ItemMirror, Hallo, app, routes) {
    'use strict';   

    // Confirm dependencies
    // console.log('jquery: ' + typeof($));
    // console.log('ItemMirror: ' + typeof(ItemMirror));
    // console.log('Dropbox: ' + typeof(Dropbox));

    $(function () { // using jQuery because it will run this even if DOM load already happened
      angular.bootstrap(document, ['app']);
    });
});