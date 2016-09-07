# angular-data-source
Simple data-source service with filtering, sorting and paginating. Designed to work with angular-resource models.

## Install

```shell
bower install vasvitaly/angular-data-source
```


## Usage
1. Include the `data-source.js` script into your app.
2. Add `vasvitaly.angular-data-source` as a module dependency to your app.

```javascript
angular.module('myApp', ['vasvitaly.angular-data-source']);
```

### In a controller 

```javascript
// Item - is ngResource based model

controllers.controller("ItemsController", 
['$scope', 'vvvDataSource', 'Item', function($scope, vvvDataSource, Item) {
  var dsOptions = {
    newItemDefaults: {name: '', colors: [{name: '', name_lat: '', show_in_list: 0}]},
    filter: {name: 'Abr', surName: 'Bar'},
    sorting: {fieldId: 'createdAt', desc: true},
    clearFilter: {name: '', surName: ''},
    perPage: 20,
    page: 1
  }
  
  $scope.dataSource = new vvvDataSource(Item, dsOptions);
  $scope.dataSource.query();
     
}]);

```

### In the template
```html
<table>
<tr ng-repeat="row in dataSource.rows">

</tr>
</table>
```
or 
```html
<table>
<tr ng-repeat="row in dataSource.filteredRows()">

</tr>
</table>
```

## API

### Initializing
```javascript
$scope.dataSource = new vvvDataSource(Model, [options]);
```
* *Model* - ngResource based object
* *options* - options object
#### options possible key-values
  * *newItemDefaults* - object, options which will be sent for creating new item of *Model*
  * *filter* - object, filter will be applied to rows in *filteredRows()* using angular filter() or sent to the server.
  * *sorting* - {fieldId: 'string' desc: boolean}, used for ordering rows in *filteredRows()* and in server request.
  * *clearFilter* - object, which will be used as base in `clearFilter` API method.
  * *perPage* - rows limit to show, also sent to the server.
  * *page* - page to show, also sent to the server.