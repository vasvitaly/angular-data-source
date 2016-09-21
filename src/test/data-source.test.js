
angular.module('customFilters', []).filter('greaterThan', function() {
  return function(collection, filterObj){
    var res = [];
    var idx, item, add;
    for (idx in collection) {
      add = true;
      item = collection[idx];
      for (prop in filterObj) {
        if (!item[prop] || item[prop] <= filterObj[prop]) {
          add = false;
          break;
        };
      };
      if (add) {
        res.push(item);
      };
    }
    return res;
  };
});

describe('data-source', function() {
  'use strict';
  var sut, options, model, dataSource, modelQueryRes, serverPagination;

  // load the tabs code
  beforeEach(module('vasvitaly.angular-data-source'));
  beforeEach(module('customFilters'));
  
  beforeEach(inject(function(vvvDataSource){
    serverPagination = null;
    modelQueryRes = null;
    dataSource = vvvDataSource;
    model = jasmine.createSpyObj('model', ['query']);
    model.query.and.callFake(function(opts, callBackFunc){
      if (modelQueryRes == void 0 || modelQueryRes == null) {
        modelQueryRes = [];
      }
      if (serverPagination && angular.isObject(serverPagination)) {
        modelQueryRes.push({pagination: serverPagination});
      }
      if (callBackFunc && angular.isFunction(callBackFunc)) {
        callBackFunc(modelQueryRes);
      }
      return modelQueryRes;
    });
  }));

  describe('initialize', function(){
    var expectedObj;

    beforeEach(function(){
      options = {};
      expectedObj = {
        filter: {},
        query: jasmine.any(Function),
        paginate: jasmine.any(Function),
        paginationInfo: jasmine.any(Function),
        sortBy: jasmine.any(Function),
        sortingInfo: jasmine.any(Function),
        isOrderedByField: jasmine.any(Function),
        applyFilter: jasmine.any(Function),
        clearFilter: jasmine.any(Function),
        filteredRows: jasmine.any(Function),
        newRecord: jasmine.any(Function),
        add: jasmine.any(Function),
        remove: jasmine.any(Function)
      };
    });

    it('should throw type error when modelClass not sent', function() {
      var createDS = function() {
        sut = new dataSource();
      }
      expect(createDS).toThrowError(TypeError, 'modelClass should be angular resource like class');
    });

    it('should throw type error when modelClass has no query method', function() {
      var createDS = function() {
        sut = new dataSource({});
      }
      expect(createDS).toThrowError(TypeError, 'modelClass should have query method');
    });


    it('should use default attrs when no options sent', function() {
      sut = new dataSource(model);
      expect(sut).toEqual(jasmine.objectContaining(expectedObj));
    });

    it('use default attrs when empty options sent', function() {
      sut = new dataSource(model, options);
      expect(sut).toEqual(jasmine.objectContaining(expectedObj));
    });

    it('should apply options.filter', function() {
      options.filter = {param: 'value'};
      sut = new dataSource(model, options);
      expect(sut.filter).toEqual(options.filter);
    });

    it('should apply options.sorting', function() {
      options.sorting = {
        fieldId: 'someField',
        desc: true
      };
      sut = new dataSource(model, options);
      expect(sut.sortingInfo()).toEqual(options.sorting);
    });

    it('merge sorting defaults alongside options.sorting', function() {
      options.sorting = {
        anotherKey: 'someField',
        desc: true
      };
      sut = new dataSource(model, options);
      expect(sut.sortingInfo()).toEqual({
        anotherKey: 'someField',
        fieldId: '',
        desc: true
      });
    });

    it('should apply options.perPage for pagination', function() {
      options.perPage = 10;
      sut = new dataSource(model, options);
      expect(sut.paginationInfo().perPage).toEqual(options.perPage);
    });

    it('should apply options.page for pagination', function() {
      options.page = 2;
      sut = new dataSource(model, options);
      expect(sut.paginationInfo().page).toEqual(options.page);
    });

    it('should not apply options.page lower than 0 for pagination', function() {
      options.page = -1;
      sut = new dataSource(model, options);
      expect(sut.paginationInfo().page).toEqual(1);
    });

  });

  describe('querying data', function(){
    var baseOptions;

    beforeEach(function(){
      options = {
        filter: {filterField: 'filterValue'}
      };
      baseOptions = { baseOption1: true, baseOption2: 'value' };
      sut = new dataSource(model, options);
    });

    it('should return result of calling query method on modelClass', function(){
      modelQueryRes = [1,2,3];
      expect(sut.query()).toEqual(modelQueryRes);
    });

    describe('should send first time options to query method on modelClass', function(){
      var sentOpts;

      beforeEach(function(){
        sut.query(baseOptions);
        sentOpts = model.query.calls.mostRecent().args[0];
      });
      
      it('should pass baseOptions', function(){
        expect(sentOpts).toEqual(jasmine.objectContaining(baseOptions));
      });

      it('should pass filters as .filter attr', function(){
        expect(sentOpts).toEqual(jasmine.objectContaining({filter: options.filter}));
      });

      it('should not pass sorting', function(){
        expect(sentOpts).not.toEqual(jasmine.objectContaining({sortby: sut.sortingInfo().fieldId, desc: sut.sortingInfo().desc}));
      });

      it('should not pass page', function(){
        expect(sentOpts).not.toEqual(jasmine.objectContaining({page: jasmine.any(Number)}));
      });

    });


    describe('sending different filters', function(){
      var sentOpts;

      beforeEach(function(){
        sut.query();
      });
      
      it('should not pass filters when not filtered', function(){
        sut.filter.filterField = '';
        sut.query();
        sentOpts = model.query.calls.mostRecent().args[0];
        expect(sentOpts.hasOwnProperty('filter')).toEqual(false);
      });
  
      it('should not pass empty filter pairs', function(){
        sut.filter.filterField = '';
        sut.filter.anotherFilterField = 'someValue';
        sut.filter.toOld = false;
        sut.query();
        sentOpts = model.query.calls.mostRecent().args[0];
        expect(sentOpts).toEqual(jasmine.objectContaining({
          filter: {
            anotherFilterField: 'someValue',
            toOld: false
          }
        }));
      });

      it('should convert special filter names', function(){
        sut.filter.filterField = '';
        sut.filter.__greaterThan = 10;
        sut.filter.__startingWith = {name: 'a'};
        sut.filter.subObj = {name: ''};
        sut.query();
        sentOpts = model.query.calls.mostRecent().args[0];
        expect(sentOpts).toEqual(jasmine.objectContaining({
          filter: {
            greaterThan: 10,
            startingWith: {name: 'a'}
          }
        }));
      });

      it('should not pass empty filter objects', function(){
        sut.filter.filterField = '';
        sut.filter.startingWith = {name: 'a'};
        sut.filter.subObj = {name: ''};
        sut.query();
        sentOpts = model.query.calls.mostRecent().args[0];
        expect(sentOpts).toEqual(jasmine.objectContaining({
          filter: {
            startingWith: {name: 'a'}
          }
        }));
      });

    });


    describe('should call callBack', function(){
      var sentOpts, callBack, sentCallBack;

      beforeEach(function(){
        modelQueryRes = [1,2,3];
        serverPagination = {
          totalCount: 100,
          perPage: 15,
          page: 2
        };
        callBack = jasmine.createSpy('queryCallBack');
        sut.query({}, callBack);
      });

      it('with results when model.query resolved', function(){
        expect(callBack).toHaveBeenCalledWith(modelQueryRes);
      });

      it('should populate pagination from results pagination', function(){
        expect(sut.paginationInfo()).toEqual(serverPagination);
      });
    
    });
    
    describe('when paginating', function(){
      var sentOpts, callBack, sentCallBack;
    
      beforeEach(function(){
        modelQueryRes = [1,2,3];
        serverPagination = {
          totalCount: 100,
          perPage: 15,
          page: 2
        };
      });
    
      it('should set pagination.page to sent arg', function(){
        sut.paginate(20);
        expect(sut.paginationInfo().page).toEqual(20);
      });

      it('should set pagination.page to 1 if sent less', function(){
        sut.paginate(-1);
        expect(sut.paginationInfo().page).toEqual(1);
      });

      it('should set pagination.page to 1 if sent less', function(){
        sut.paginate(0);
        expect(sut.paginationInfo().page).toEqual(1);
      });

      it('should set pagination.page to maxPage if sent more', function(){
        sut.query();
        serverPagination = null;
        sut.paginate(8);
        expect(sut.paginationInfo().page).toEqual(7);
      });

      it('should not make server query when not serverPaginated', function(){
        sut.paginate(3);
        expect(model.query).not.toHaveBeenCalled();
      });

      describe('when serverPaginated', function(){
        var queryOptions;

        beforeEach(function(){
          sut.query();
        });

        it('should not make server query with same page', function(){
          model.query.calls.reset();
          sut.paginate(serverPagination.page);
          expect(model.query).not.toHaveBeenCalled();
        });

        it('should make query with new page', function(){
          sut.paginate(3);
          queryOptions = model.query.calls.mostRecent().args[0];
          expect(queryOptions).toEqual(jasmine.objectContaining({page: 3}));
        });

      });

    });

    describe('when sorting', function(){
      var sentOpts, callBack, sentCallBack;
    
      beforeEach(function(){
        modelQueryRes = [1,2,3];
        serverPagination = {
          totalCount: 100,
          perPage: 15,
          page: 2
        };
      });

      it('should set new sorting fieldId with in asc mode', function(){
        sut.sortBy('newFieldId');
        expect(sut.sortingInfo()).toEqual(jasmine.objectContaining({
          fieldId: 'newFieldId', desc: false})
        );
      });

      it('should set pagination to first page', function(){
        sut.sortBy('newFieldId');
        expect(sut.paginationInfo().page).toEqual(1);
      });

      it('should call model.query when filtered On Server', function(){
        var expectedOptions;
        expectedOptions = jasmine.objectContaining({
          sortby: 'newFieldId',
          desc: false
        });
        sut.query();
        sut.sortBy('newFieldId');
        expect(model.query).toHaveBeenCalledWith(expectedOptions, jasmine.any(Function));
      });

      it('should set desc mode for same fieldId sent', function(){
        sut.sortBy('newFieldId');
        sut.sortBy('newFieldId');
        expect(sut.sortingInfo()).toEqual(jasmine.objectContaining({
          fieldId: 'newFieldId', desc: true})
        );
      });
    
    });

    it('should reply isOrderedByField', function(){
      sut.sortBy('newFieldId');
      expect(sut.isOrderedByField('someAnotherField')).toEqual(false);
    });

    it('should reply isOrderedByField', function(){
      sut.sortBy('newFieldId');
      expect(sut.isOrderedByField('newFieldId')).toEqual(true);
    });

    describe('applying Filter', function(){
      describe('when filtered on server', function(){

        beforeEach(function(){
          modelQueryRes = [1,2,3];
          serverPagination = {
            totalCount: 100,
            perPage: 15,
            page: 2
          };
          sut.query();
        });

        it('set page 1 and do query', function(){
          var expectedOptions = jasmine.objectContaining({page:1});
          expect(model.query).not.toHaveBeenCalledWith(expectedOptions, jasmine.any(Function));
        });

        it('returns true', function(){
          expect(sut.applyFilter()).toEqual(true);
        });
      
      });

      it('returns false when not filtered on server', function(){
        expect(sut.applyFilter()).toEqual(false);
        expect(model.query).not.toHaveBeenCalled();
      });

    });

  });
  

  describe('clearing Filter', function(){

    beforeEach(function(){
      options = {
        filter: {filterField: 'filterValue'},
        clearFilter: {filterFieldInitial: 'filterValueInitial'},
      };
      sut = new dataSource(model, options);
    });

    it('should copy initial filter to active filter', function(){
      sut.clearFilter();
      expect(sut.filter).toEqual(options.clearFilter);
    });

    it('should applyFilter', function(){
      spyOn(sut, 'applyFilter');
      sut.clearFilter();
      expect(sut.applyFilter).toHaveBeenCalled();
    });    

  });

  describe('getting filtered Rows', function(){

    beforeEach(function(){
      options = {
        filter: {name: ''}
      };
      modelQueryRes = [
        { id: 1, name: 'alex', age: 20 },
        { id: 2, name: 'vojtek', age: 15 },
        { id: 3, name: 'vitali', age: 30 },
        { id: 4, name: 'nadia', age: 22 }
      ];
      serverPagination = {
        totalCount: 4,
        perPage: 10,
        page: 1
      };
      sut = new dataSource(model, options);
      sut.query();
    });

    it('all rows should be equal to model query results', function(){
      expect(sut.rows).toEqual(modelQueryRes);
    });

    it('return all rows when filter is clear', function(){
      expect(sut.filteredRows()).toEqual(sut.rows);
    });

    it('return rows filtered with classical angular filter', function(){
      sut.filter.name = 'al';
      var expectedRows = [modelQueryRes[0],modelQueryRes[2]];
      expect(sut.filteredRows()).toEqual(expectedRows);
    });

    it('dont uses not found special filters', function(){
      sut.filter['__startingWith'] = {name: 'al'};
      expect(sut.filteredRows()).toEqual(modelQueryRes);
    });

    it('uses found special filters', function(){
      sut.filter['__greaterThan'] = {age: 21};
      var expectedRows = [modelQueryRes[2],modelQueryRes[3]];
      expect(sut.filteredRows()).toEqual(expectedRows);
    });
    
    it('uses all found special filters and basic filters', function(){
      sut.filter['__greaterThan'] = {age: 21};
      sut.filter.name = 'al';
      var expectedRows = [modelQueryRes[2]];
      expect(sut.filteredRows()).toEqual(expectedRows);
    });

    it('applies sorting', function(){
      sut.sortBy('age');
      var expectedRows = [modelQueryRes[1], modelQueryRes[0], modelQueryRes[3], modelQueryRes[2]];
      expect(sut.filteredRows()).toEqual(expectedRows);
    });

    it('applies sorting', function(){
      sut.sortBy('age');
      sut.sortBy('age');
      var expectedRows = [modelQueryRes[2], modelQueryRes[3], modelQueryRes[0], modelQueryRes[1]];
      expect(sut.filteredRows()).toEqual(expectedRows);
    });
    
    describe('applying pagination when rows count is more than perPage limit', function(){
      beforeEach(function(){
        options = {
          filter: {name: ''}
        };
        modelQueryRes = [
          { id: 1, name: 'alex', age: 20 },
          { id: 2, name: 'vojtek', age: 15 },
          { id: 3, name: 'vitali', age: 30 },
          { id: 4, name: 'nadia', age: 22 }
        ];
        serverPagination = {
          totalCount: 14,
          perPage: 2,
          page: 2
        };
        sut = new dataSource(model, options);
      });

      it('returns limited amout of rows', function(){
        sut.query();
        expect(sut.filteredRows().length).toEqual(2);
      });

      it('updates pagination info', function(){
        var expectedObj = jasmine.objectContaining({
          locally: true,
          perPage: 2,
          page: 1,
          totalCount: 4
        });
        sut.query();
        sut.filteredRows();
        expect(sut.paginationInfo()).toEqual(expectedObj);
      });

      it('updates only not actual pagination info', function(){
        serverPagination.totalCount = modelQueryRes.length;
          
        var expectedObj = jasmine.objectContaining({
          locally: true,
          perPage: 2,
          totalCount: 4,
          page: 2
        });
        sut.query();
        sut.filteredRows();
        expect(sut.paginationInfo()).toEqual(expectedObj);
      });

      it('updates only not actual pagination info', function(){
        serverPagination.totalCount = modelQueryRes.length;
        serverPagination.page = null;
          
        var expectedObj = jasmine.objectContaining({
          locally: true,
          perPage: 2,
          totalCount: 4,
          page: 1
        });
        sut.query();
        sut.filteredRows();
        expect(sut.paginationInfo()).toEqual(expectedObj);
      });
    });

    describe('applying pagination when server returns empty pagination info', function(){
      var names;
      
      beforeEach(function(){
        names = ['alex', 'vojtek', 'vitali', 'nadia', 'oleh', 'oleksii', 'ivan', 'kolyan', 'olen', 'ira', 'ilja'];
        options = {
          filter: {name: ''}
        };
        modelQueryRes = []
        for (var i = 0; i < 40; i++) {
          modelQueryRes.push({
            id: i+1, 
            name: names[Math.round(Math.random()*10)], 
            age: Math.round(Math.random()*100)
          });
        };
        serverPagination = {};
        sut = new dataSource(model, options);
        sut.query();
      });

      it('returns limited amout of rows', function(){
        var filtered = sut.filteredRows();
        expect(filtered.length).toEqual(20);
      });

      it('updates pagination info from defaults and real data', function(){
        var expectedObj = jasmine.objectContaining({
          locally: true,
          perPage: 20,
          totalCount: 40
        });
        expect(sut.paginationInfo()).toEqual({});
        sut.filteredRows();
        expect(sut.paginationInfo()).toEqual(expectedObj);
      });
    });

  });

  describe('building new record', function(){
    beforeEach(function(){
      model = function(attrs) {
        var self = this;
        angular.extend(self, attrs);
        return self;
      };
      model.query = function() {};
      options = {
        newItemDefaults: {
          name: 'New name',
          age: 0
        }
      }
      sut = new dataSource(model, options);
    });

    it('builds record with defaults when no sent attrs', function(){
      var expectedObj, item;
      item = sut.newRecord();
      expectedObj = jasmine.objectContaining({
        name: 'New name',
        age: 0
      });
      expect(item).toEqual(expectedObj);
    });

    it('builds record with default and sent attrs', function(){
      var attrs, expectedObj, item;
      attrs = {
        name: 'ItemName',
        interest: 10
      };
      item = sut.newRecord(attrs);
      expectedObj = jasmine.objectContaining({
        name: 'ItemName',
        interest: 10,
        age: 0
      });
      expect(item).toEqual(expectedObj);
    });

    it('builds record with attrs only when no defaults', function(){
      var attrs, expectedObj, item;
      attrs = {
        name: 'ItemName',
        interest: 10
      };
      item = sut.newRecord(attrs);
      expectedObj = jasmine.objectContaining(attrs);
      sut = new dataSource(model);
      expect(item).toEqual(expectedObj);
    });

  });
  
  describe('adds new item to the collection', function(){
    beforeEach(function(){
      modelQueryRes = [1,2,3];
      sut = new dataSource(model);
      sut.query();
    });

    it('item should be added to the top of the rows', function(){
      var newItem = {name: 'newItem'};
      sut.add(newItem);
      expect(sut.rows[0]).toEqual(newItem);
    });

  });

  describe('removes item by id from collection', function(){
    var expectedObj, removeFunc; 
    
    beforeEach(function(){
      removeFunc = jasmine.createSpy('remove');
      expectedObj = [{id: 1}, {id: 20}, {id: 4, $remove: removeFunc}, {id: 5}];
      modelQueryRes = angular.copy(expectedObj);
      sut = new dataSource(model);
      sut.query();
    });

    it('item should be removed from the rows', function(){
      sut.remove(4);
      expect(sut.rows[2]).toEqual(expectedObj[3]);
    });

    it('item should be removed from the rows', function(){
      sut.remove(20);
      expect(sut.rows[1]).toEqual(expectedObj[2]);
    });

    describe('when removeOnServer flag is true', function(){
      var removeArgs;

      beforeEach(function(){
        sut.remove(4, true);
      });

      it('should call $remove method on item', function(){
        expect(removeFunc).toHaveBeenCalled();
      });

      it('should remove item on success response', function(){
        removeArgs = removeFunc.calls.mostRecent().args;
        
        expect(sut.rows[2]).toEqual(expectedObj[2]);
        removeArgs[1]();
        expect(sut.rows[2]).toEqual(expectedObj[3]);
      });

      describe('on server error' ,function(){
        var errorResponse, errorCallback, lastMessage;

        beforeEach(function(){
          errorResponse = {};
          removeArgs = removeFunc.calls.mostRecent().args;
          errorCallback = removeArgs[2];
        });

        it('should not remove item from the list', function(){
          errorCallback();
          expect(sut.rows[2]).toEqual(expectedObj[2]);
        });

        it('should add error message 404 to messages list', function(){
          errorResponse = {'status': 404};
          errorCallback(errorResponse);
          lastMessage = sut.messages.pop();
          
          expect(lastMessage).toEqual({"error": "404"});
        });

        it('should add error message 500 to messages list', function(){
          errorResponse = {status: 500, data: {errors: 'Unexpected error happend'}};
          errorCallback(errorResponse);
          expect(sut.messages.pop()).toEqual({"error": "500"});
        });

        it('should add error message from data.errors to messages list', function(){
          errorResponse = {status: 200, data: {errors: ['You cant remove this item!', 'Item is protected.']}}
          errorCallback(errorResponse);
          expect(sut.messages.pop()).toEqual({"error": "Item is protected."});
          expect(sut.messages.pop()).toEqual({"error": "You cant remove this item!"});
        });


        it('should add error message from data.errors to messages list', function(){
          errorResponse = {status: 200, data: {errors: [['You cant remove this item!', 'Item is protected.']]}}
          errorCallback(errorResponse);
          expect(sut.messages.pop()).toEqual({"error": "You cant remove this item!\nItem is protected."});
        });

        it('should add default error message to messages list when no message from server', function(){
          errorResponse = {status: 505};
          errorCallback(errorResponse);
          expect(sut.messages.pop()).toEqual({"error": "Server is down. Sorry."});
        });

      });


    })

  });

  describe('saves item', function(){
    var item, saveFunc, createFunc; 
    var saveArgs, sCallback, eCallback, addToTheList, successCallBack, errorCallback;
    
    beforeEach(function(){
      saveFunc = jasmine.createSpy('save');
      createFunc = jasmine.createSpy('create');
      item = { name: 'new item', '$save': saveFunc, '$create': createFunc };
      sut = new dataSource(model);
      sut.query();
    });

    it('calls item create method when item has no id - so its new', function(){
      sut.save(item);
      expect(saveFunc).not.toHaveBeenCalled();
      expect(createFunc).toHaveBeenCalled();
    });

    it('calls item save method when item has id', function(){
      item.id = 123;
      sut.save(item);
      expect(saveFunc).toHaveBeenCalled();
      expect(createFunc).not.toHaveBeenCalled();
    });

    describe('on success server response', function(){
      
      beforeEach(function(){
        successCallBack = jasmine.createSpy('success');
        errorCallback = jasmine.createSpy('error');
        addToTheList = false;
      });

      describe('for new item', function(){
        
        it('pushes item to the list when addToTheList flag is true', function(){
          addToTheList = true;
          saveItem();
          sCallback();
          expect(sut.rows[0]).toEqual(item);
        });

        it('doesnt push item to the list when addToTheList flag is false', function(){
          addToTheList = false;
          saveItem();
          sCallback();
          expect(sut.rows[0]).not.toEqual(item);
        });

        it('pushes success message to the messages pool', function(){
          saveItem();
          sCallback();
          expect(sut.messages.pop()).toEqual({"success": 'added'});
        });

        it('calls successCallBack', function(){
          saveItem();
          sCallback();
          expect(successCallBack).toHaveBeenCalledWith(item);
        });

        it('does not calls errorCallBack', function(){
          saveItem();
          sCallback();
          expect(errorCallback).not.toHaveBeenCalled();
        });

      });
      
      describe('for existing item', function(){

        beforeEach(function(){
          item.id = 123;
          addToTheList = true;
          saveItem();
          sCallback();
        })

        it('dont pushes item to the list with any addToTheList flag', function(){
          expect(sut.rows[0]).not.toEqual(item);
        });

        it('pushes success message to the messages pool', function(){
          expect(sut.messages.pop()).toEqual({"success": 'updated'});
        });

        it('calls successCallBack', function(){
          expect(successCallBack).toHaveBeenCalledWith(item);
        });
        
        it('does not calls errorCallBack', function(){
          saveItem();
          sCallback();
          expect(errorCallback).not.toHaveBeenCalled();
        });

      });

    });

    describe('on error server response', function(){
      var errorResponse;

      beforeEach(function(){
        successCallBack = jasmine.createSpy('success');
        errorCallback = jasmine.createSpy('error');
        addToTheList = false;
        errorResponse = {
          data: {
            error_fields: {'name': 'should not be empty'},
            errors: ['Name field should not be empty', ['Not all fields filled','please fill all']]
          }
        };
      });

      describe('for new item', function(){

        beforeEach(function(){
          saveItem();
          eCallback(errorResponse);
        });

        it('applies errors to the item', function(){
          expect(item.errors).toEqual(errorResponse.data.error_fields);
        });

        it('pushed errors to the messages', function(){
          expect(sut.messages.pop()).toEqual({'error': errorResponse.data.errors[1].join("\n")});
          expect(sut.messages.pop()).toEqual({'error': errorResponse.data.errors[0]});
        });

      });

      describe('for existing item', function(){

        beforeEach(function(){
          item.id = 123;
          saveItem();
          eCallback(errorResponse);
        });

        it('applies errors to the item', function(){
          expect(item.errors).toEqual(errorResponse.data.error_fields);
        });

        it('pushed errors to the messages', function(){
          expect(sut.messages.pop()).toEqual({'error': errorResponse.data.errors[1].join("\n")});
          expect(sut.messages.pop()).toEqual({'error': errorResponse.data.errors[0]});
        });

      });

    });

    function saveItem(){
      sut.save(item, addToTheList, successCallBack, errorCallback);
      if (item.id) {
        saveArgs = saveFunc.calls.mostRecent().args;
      } else {
        saveArgs = createFunc.calls.mostRecent().args;
      }
      sCallback = saveArgs[1];
      eCallback = saveArgs[2];
    }

  });

});