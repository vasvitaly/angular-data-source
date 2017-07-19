'use strict';
angular.module('vasvitaly.angular-data-source', []).factory('vvvDataSource', [
  '$filter', '$injector', function($filter, $injector) {
    var DataSource;
    var DEFAULTS = {
      perPage: 20
    };

    DataSource = function(modelClass, options) {
      var self, initialFilter, newItemDefaults, baseOptions, callBack, filterOnServer;
      var sorting, pagination;
      self = this;
      
      if (options == null) {
        options = {};
      };

      if (modelClass == null) {
        throw new TypeError('modelClass should be angular resource like class');
      };
      if (!modelClass.query || !angular.isFunction(modelClass.query)) {
        throw new TypeError('modelClass should have query method');
      };

      initialFilter = options.clearFilter || {};
      newItemDefaults = options.newItemDefaults || {};
      baseOptions = {};
      callBack = null;
      filterOnServer = false;
      
      self.filter = options.filter || {};
      self.messages = {
        'error': [],
        'success': []
      };
      sorting = angular.extend({
        fieldId: '',
        desc: false
      }, (options.sorting || {}));
      pagination = {
        perPage: options.perPage && options.perPage > 0 ? options.perPage : DEFAULTS.perPage,
        page: options.page && options.page > -1 ? options.page : 1
      };

      var doQuery = function() {
        var options = {};
        angular.copy(baseOptions, options);
        getOptions(options);
      
        self.rows = modelClass.query(options, function(results) {
          var pinfo;
          if (results && results.length && results[results.length - 1].pagination) {
            pinfo = (results.pop()).pagination;
            angular.copy(pinfo, pagination);
          }
          if (!filterOnServer) {
            filterOnServer = isFiltered() || isServerPaginated();
          }
          if (callBack) {
            callBack(results);
          }
          return results;
        });
        return self.rows;
      };

      var getOptions = function(options) {
        if (isPaginated()) {
          options.page = pagination.page;
        }
        if (isSorted()) {
          options.sortby = sorting.fieldId;
          options.desc = sorting.desc;
        }
        if (isFiltered()) {
          options.filter = getFilters();
        }
        return options;
      };

      var isPaginated = function() {
        if (!pagination.totalCount || 
            !pagination.perPage || 
            !pagination.page) {
          return false;
        }
        return maxPage() > 1;
      };

      var maxPage = function(){
        return Math.ceil(pagination.totalCount / pagination.perPage);
      }

      var isServerPaginated = function() {
        return !pagination.locally && isPaginated();
      };

      var isSorted = function() {
        return sorting && sorting.fieldId && sorting.fieldId > '';
      };

      var isFiltered = function() {
        var key, value;
        for (key in self.filter) {
          value = self.filter[key];
          if (value !== void 0 && value !== '') {
            return true
          }
        }
        return false;
      };

      var getFilters = function() {
        return getNotEmpty(self.filter);
      };

      var getNotEmpty = function(obj) {
        var key, value, res, fname;
        res = null;

        if (!angular.isObject(obj)) {
          return obj;
        }

        for (key in obj) {
          value = getNotEmpty(obj[key]);
          if (value != void 0 && value != null && value !== '') {
            fname = key;
            if (fname.indexOf('__') == 0) {
              fname = fname.replace(/^__/,'');
            }
            if (res == null) res = {};
            res[fname] = value;
          }
        }
        return res;
      };

      var prepareFilters = function(filter) {
        var filters, key, val, fname;
        filters = {
          filter: {}
        };
        for (key in filter) {
          val = filter[key];
          if (key.indexOf('__') == 0) {
            fname = key.replace(/^__/,'');
            filters[fname] = val;
          } else {
            filters.filter[key] = val;
          }
        }
        return filters;
      };

      var getPaged = function(data) {
        var begin;
        if (!pagination.totalCount || pagination.totalCount != data.length) {
          pagination.totalCount = data.length;
          pagination.page = 1;
        };
        if (pagination.perPage == null) {
          pagination.perPage = DEFAULTS.perPage;
        }
        if (pagination.page == null) {
          pagination.page = 1;
        }
        pagination.locally = true;
        begin = (pagination.page - 1) * pagination.perPage;
        return $filter('limitTo')(data, pagination.perPage, begin);
      };

      var pushMessage = function(eventType, message) {
        if (!self.messages[eventType]) {
          self.messages[eventType] = []
        }
        self.messages[eventType].push(message);
      };

      var applyErrors = function(row, response) {
        if (response && response.data) {
          if (response.data.errors) {
            angular.forEach(response.data.errors, function(errors) {
              var message = errors;
              if (angular.isArray(message)) {
                message = message.join("\n");
              }
              pushMessage("error", message);
            });
          }
          if (response.data.error_fields) {
            row.errors = response.data.error_fields;
          }
        }
      };

// Public API

      self.query = function(opts, callBackFunc) {
        baseOptions = opts;
        callBack = callBackFunc;
        self.rows = doQuery();
        return self.rows;
      };

      
      self.paginate = function(page) {
        if (!page || page < 1) page = 1;
        if (maxPage() && page > maxPage()) page = maxPage();
        if (pagination.page == page) return false;
        
        pagination.page = page;
        if (isServerPaginated()) {
          doQuery();
        }
        return true;
      };

      self.sortBy = function(fieldId) {
        if (sorting.fieldId === fieldId) {
          sorting.desc = !sorting.desc;
        } else {
          sorting.fieldId = fieldId;
          sorting.desc = false;
        }
        pagination.page = 1;
        if (filterOnServer) {
          doQuery();
        }
        return true;
      };
      
      self.paginationInfo = function(){
        return pagination;
      };

      self.sortingInfo = function(){
        return sorting;
      };
      
      self.isOrderedByField = function(fieldId) {
        return sorting.fieldId === fieldId;
      };

      self.applyFilter = function() {
        if (filterOnServer) {
          pagination.page = 1;
          doQuery();
          return true;
        }
        return false;
      };
      
      self.clearFilter = function() {
        angular.copy(initialFilter, self.filter);
        return self.applyFilter();
      };

      self.filteredRows = function() {
        var filters, res, filterName, filterData;
        filters = prepareFilters(self.filter);
        res = self.rows;
        for (filterName in filters) {
          filterData = filters[filterName];
          if ($injector.has(filterName + 'Filter') && filterData) {
            res = $filter(filterName)(res, filterData);
          }
        }
        if (sorting && sorting.fieldId) {
          res = $filter('orderBy')(res, sorting.fieldId, sorting.desc);
        }
        if (pagination.locally || !pagination.perPage || res.length > pagination.perPage) {
          res = getPaged(res);
        }
        return res;
      };

      self.newRecord = function(attrs) {
        var data;
        data = {};
        angular.copy(newItemDefaults, data);
        if (angular.isObject(attrs)) {
          angular.extend(data, attrs);
        }
        return new modelClass(data);
      };

      self.save = function(row, addToTheList, successCallBack, errorsCallBack) {
        if (row.id) {
          row.$save({}, function(){
            delete(row.saving);
            pushMessage("success", "updated");
            if (successCallBack && angular.isFunction(successCallBack)) {
              successCallBack(row);
            }
            return false;
          }, function(response) {
            delete(row.saving);
            applyErrors(row, response);
            if (errorsCallBack && angular.isFunction(errorsCallBack)) {
              errorsCallBack(row, response);
            }
            return false;
          });
        } else {
          row.$create({}, function(){
            delete(row.saving);
            if (addToTheList) {
              self.add(row);
            }
            pushMessage("success", "added");
            if (successCallBack && angular.isFunction(successCallBack)) {
              successCallBack(row);
            }
            return false;
          }, function(response) {
            delete(row.saving);
            applyErrors(row, response);
            if (errorsCallBack && angular.isFunction(errorsCallBack)) {
              errorsCallBack(row, response);
            }
            return false;
          });
        }
        row.saving = true;
      };


      self.add = function(row) {
        return self.rows.unshift(row);
      };

      self.remove = function(id, removeOnServer) {
        angular.forEach(self.rows, function(row, idx) {
          if (row.id === id) {
            if (removeOnServer) {
              row.$remove({}, function(){
                self.rows.splice(idx, 1);
              }, function(response) {
                if (response) {
                  if (response.status == 404) {
                    pushMessage("error", "404");
                  } else if (response.status == 500) {
                    pushMessage("error", "500");
                  } else if (response.data && response.data.errors) {
                    angular.forEach(response.data.errors, function(errors) {
                      var message = errors;
                      if (angular.isArray(errors)) {
                        message = errors.join("\n");
                      }
                      pushMessage("error", message);
                    });
                  } else {
                    pushMessage("error", "Server is down. Sorry.");
                  }
                }
                return false;
              });
            } else {
              return self.rows.splice(idx, 1);
            }
          }
        });
        return false;
      };



      return self;
    };

    return DataSource;
  }
]);
