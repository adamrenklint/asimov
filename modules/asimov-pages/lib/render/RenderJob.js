var asimov = require('../../../../index');
var Base = require('../../../../index').Base;
var _ = require('lodash');
var _super = Base.prototype;

module.exports = Base.extend({

  // Any render job should timeout after 10 seconds
  'limit': 10 * 1000,
  'interval': 1000,

  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.pending = {};
    self.delay('checkTimeouts', self.interval);
  },

  'checkTimeouts': function () {

    var self = this;
    var now = (new Date()).valueOf();
    var limit = now - self.limit;

    _.each(self.pending, function (deferreds, timestamp) {
      if (timestamp < limit) {
        _.invoke(deferreds, 'reject');
      }
      self.pending[timestamp] = [];
    });

    self.delay('checkTimeouts', self.interval);
  },

  'run': function (job) {

    var self = this;
    var deferred = self.deferred();
    var promise = deferred.promise();

    var timestamp = (new Date()).valueOf();
    self.pending[timestamp] = self.pending[timestamp] || [];
    self.pending[timestamp].push(deferred);

    var processed = job.attributes.processed;

    // WHY IS JUST ONE PAGE AT A TIME RENDERING?
    //
    // shouldn't all pages go through the first, and then second...

    function error (err) {
      err.push('Failed to process ' + job.attributes.type + ' @ ' + job.id);
      asimov.error(err);
      deferred.reject(err);
    }

    asimov.runSequence('preprocessor', job).done(function () {
      asimov.runSequence('processor', job).done(function () {
        asimov.runSequence('postprocessor', job).done(function () {
          if (job.attributes.processed !== processed) job.write();
          deferred.resolve(job);
        }).fail(error);
      }).fail(error);
    }).fail(error);

    return promise;
  }
});
