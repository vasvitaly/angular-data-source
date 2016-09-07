'use strict';

angular.module('myApp').factory("Phone", ["$resource", function($resource) {
  return $resource('/examples/phones/:id.:format', { id: "@id", format: 'json' });
}
])
.controller('HomeCtrl', ['$scope', 'Phone', 'vvvDataSource', function($scope, Phone, DataSource) {

  var options = {
    newItemDefaults: {name: '', colors: [{name: '', name_lat: '', show_in_list: 0}]},
    filter: {name: 'Moto'},
    sorting: {fieldId: 'age', desc: true},
    clearFilter: {name: ''},
    perPage: 5,
    page: 1
  };

  $scope.ds = new DataSource(Phone, options);
  $scope.ds.query();
  $scope.filter = $scope.ds.filter;

  $scope.sortBy = function($event){
    var elem = $event.srcElement;
    if (elem.dataset && elem.dataset.columnId !='') {
      $scope.ds.sortBy(elem.dataset.columnId);
    };
  };

  

}]);