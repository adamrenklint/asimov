var Queue = require('../render/Queue');
var OutputWriter = require('../render/OutputWriter');
var _ = require('lodash');

module.exports = function (next, asimov) {

  var queue = new Queue();
  var writer = new OutputWriter();

  queue.on('add', _.debounce(queue.start, 100));

  asimov.preprocessor(require('../processors/decoratePage'));
  asimov.postprocessor(require('../processors/renderPage'));

  ['page', 'styleSheet', 'script'].forEach(function (name) {

    var collection = asimov[name + 's'];

    asimov.processor(require('../processors/' + name));

    collection.on('add change:raw forced:change', queue.add);
    collection.on('write', writer.write);
    collection.on('remove', writer.clear);
  });

  next();
};
