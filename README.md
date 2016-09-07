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
  * *filter* - object, filter will be applied to rows in `filteredRows()` using angular filter() or sent to the server.
    You can use your own registered filters using their name double underscored as key in filters.
    Example:
     Let have own filter registered as 'startingWith'. 
     filters `
      {
        __startingWith: anyTypeValue
      }
     will use startingWith filter and send to it anyTypeValue as second argument.

  * *sorting* - object, `{fieldId: 'string' desc: boolean}`, used for ordering rows in *filteredRows()* and in server request.
  * *clearFilter* - object, which will be used as base in `clearFilter` API method.
  * *perPage* - rows limit to show, also sent to the server.
  * *page* - page to show, also sent to the server.

### Initial request

Makes first request to the server to get rows.

```javascript
dataSource.query([options], [callBackFunc])
```
+ **options** - object, base options used for quering server by Model, will be populated with filters, paginating and sorting. 
+ **callBackFunc** - function, callback function to call on success response from Server. Will be called with one argument - results json.

#### Paginate

Change page in paginated data

```javascript
dataSource.paginate(page)
```
**page** - page to show


#### SortBy

Change data sorting field or direction. If not all data from the server shown, server request will be used.

```javascript
dataSource.sortBy(fieldId)
```
**fieldId** - field name to sort by. If same fieldId sent, sorting direction will be changed.

#### Pagination Info

Returns current pagination info

```javascript
dataSource.paginationInfo()
```

**Returns** object 
```javascript
{
  totalCount: number, 
  perPage: number, 
  page: number, 
  locally: boolean
}
```

Could be empty in case no pagination used for data.

#### Sorting Info

Returns current sorting info object

```javascript
dataSource.sortingInfo()
```

**Returns** object 
```javascript
{
  fieldId: string, 
  desc: boolean, 
}
```

#### Is Ordered By Field

Returns true if current sorting field is equal to argument

```javascript
dataSource.isOrderedByField(fieldId)
```

Arg **fieldId** string 

Return `boolean`

#### Apply Filter

Used to send actual filtering state to the server when filtered on server

```javascript
dataSource.applyFilter()
```
Returns `boolean` - true when sent to the server, false - otherwise.
Applying filters also sets page to 1.


#### Clear Filter

Clears current filters. Uses `clearFilter` initialization option or empty object.
Applies cleared filters when filtered on the server.

```javascript
dataSource.clearFilter()
```
Returns `boolean` - true when sent to the server, false - otherwise.
Sets page to 1.

#### Filtered Rows

Returns rows, filtered using angular.filter() with current filters object.
Then results are sorted and paginated. If server returned more data than set in perPage
local paginating will be used.

```javascript
dataSource.filteredRows()
```
Returns `[<Model {}>...<Model {}>]`


#### New Record

Builds new item of `Model` using newItemDefaults populated with sent args.

```javascript
dataSource.newRecord(attrs)
```
Returns new Model(newItemDefaults << attrs)


#### Add

Adds arg to the top of .rows array.

```javascript
dataSource.add(arg)
```

#### Remove

Removes from list object having id equal to sent id

```javascript
dataSource.remove(id)
```
Returns array with deleted item or false when not found.