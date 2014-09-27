asimov.js
================

[![NPM version](https://badge.fury.io/js/asimov.png)](http://badge.fury.io/js/asimov) [![Build Status](https://travis-ci.org/adamrenklint/asimov.js.png?branch=master)](https://travis-ci.org/adamrenklint/asimov.js) [![Code Climate](https://codeclimate.com/github/adamrenklint/asimov.js.png)](https://codeclimate.com/github/adamrenklint/asimov.js) [![Dependency Status](https://david-dm.org/adamrenklint/asimov.js.png?theme=shields.io)](https://david-dm.org/adamrenklint/asimov.js)

**A better toolkit for building awesome websites and apps**

Made by [Adam Renklint](http://adamrenklint.com), Berlin 2014. [MIT licensed](https://github.com/adamrenklint/asimov.js/blob/master/LICENSE).

[asimov.js](http://asimovjs.org) is at its core only two simple things: a command line interface that loads and executes command scripts in your project and ```node_modules folder```, and a plugin interface for adding initializers and extend the app lifecycle.

On it's own, asimov.js doesn't really do much - it leaves all the heavy lifting to plugins. The two most basic ones are [asimov-server](https://github.com/adamrenklint/asimov-server) and [asimov-static](https://github.com/adamrenklint/asimov-static). Together you get an awesome static site generator with extendable, chained processing and a high-performance clustered server, with express-compatible middleware.

**Or you roll your own plugin in a just a few seconds.**

## Getting started

Install asimov.js globally to use the cli

```
npm install -g asimov
```

Start your project and execute any registered initializers. This assumes your ```index.js``` exports a member function called ```start```. More on that later.

```
asimov start
```

And any other command, you execute the same way. Later in this guide, you'll learn to build a command that counts lines of code.

```
asimov loc
```

## Create a new project

So let's create our very first asimov.js app, a tiny thing that will load an initializer that logs a message.

**Every app is also a plugin**, meaning you can easily compose large applications from lots of smaller pieces of functionality, or publish your app to npm and let others use it as a plugin.

```
/asimov-log-message
  /lib
    /init
      logMessage.js
  index.js
  package.json
```

Install and add asimov.js to your projects dependencies.

```
$ npm install --save asimov
```

```logMessage.js``` should export an *initializer*, a function that is passed a ```next``` function, which continues the chain.

```javascript
// lib/init/logMessage.js
module.exports = function initializer (next) {
  console.log("Hello world");
  next();
};
```

Then, we add some bootstrap code in ```index.js```.

```javascript
var asimov = require('asimov');
var logMessage = require('./lib/init/logMessage');

// This is our plugin hook, the function that other modules
// can use to load our modules functionality
module.exports = function plugin () {
  asimov.init(logMessage);
};

// The "start" method should bootstrap your app
// by adding the plugin hook and starting asimov.js
module.exports.start = function bootstrap () {
  asimov
    .use(module.exports)
    .start();
};

// If we are not loaded as a plugin, start the app
module.parent || module.exports.start();
```

And run it...

```
$ asimov
> Hello world
```

```asimov``` is short for ```asimov start```, which is actually just calling ```node index.js```.

## Adding plugins

Every asimov.js app is also a plugin, and has the same interface as our app. In our projects plugin hook, we add all the plugins we need to get the job done. If we published the project above, we could add it in our next projects ```index.js```.

```javascript
var logger = require('asimov-log-message');
module.exports = function plugin (options) {
  asimov.use(logger);
};
```

Plugins can configure your app, add initializers and extend the public interface of ```asimov``` with new methods.

Development plugins that shouldn't be included when you app is loaded as a plugin are added in the bootstrap function.

```javascript
var debuggerPlugin = require('asimov-some-debugger-plugin');
module.exports.start = function bootstrap () {
  asimov
    .use(module.exports)
    .use(debuggerPlugin)
    .start();  
};
```

## Initializers

Initializers come in three flavours: *vanilla*, *pre* and *post*. For most apps and plugins, *vanilla* initializers will be enough, but in some case you might need to override the entire *vanilla* chain.

```javascript
var overrider = require('./lib/init/overrider');
module.exports = function plugin (options) {
  asimov.preinit(overrider);
};
```

If you want your initializer to be executed last, register it with ```asimov.postinit()```.

```javascript
var doneLogger = require('./lib/init/doneLogger');
module.exports = function plugin (options) {
  asimov.postinit(doneLogger);
};
```

Remember, you can **break the chain** at any time by not calling ```next()``` in your initializer, and create new, alternate chains. For example, this is how [asimov-server](http://github.com/adamrenklint/asimov-server) can be used as both cluster master and worker, by having two very different chain of initializers.

## Create a new command

Let's say we want to extend asimov.js with a new command that counts the lines of code in the ```lib``` folder. We could later publish it to npm, and use it in other asimov.js projects as a plugin.

Create a new module structure, and add ```lib/commands/loc.js``` - it will be loaded when you call ```asimov loc```.

```
/asimov-loc
  /lib
    /commands
      loc.js
  index.js
  package.json
```

In ```lib/commands/loc.js```, we add the code to recursively count the lines of javascript code in the ```lib``` folder.

```javascript
var asimov = require('../../index');

function countLinesInPath (path) {
  // A function that recursively counts
  // the lines in all the javascript files
  // You'll need to figure that part out on your own
}

module.exports = function () {

  // Some basic setup
  var path = process.cwd() + '/lib';
  var namespace = 'loc';
  var started = new Date();

  // And get the count
  var count = countLinesInPath(path);

  // Log the result, and how long it took to count
  var message = 'Counted ' + count + ' lines in ' + path;
  asimov.logger.since(namespace, message, started);
};
```

If you publish this on npm, any other project that installs it to their ```node_modules``` folder will have the command ```asimov loc``` available, unless they create ```lib/commands/loc.js``` in their project.

## Add and run sequences

You can add your own sequences to asimov.js, and let other projects hook into your processing. This is how [asimov-server](http://github.com/adamrenklint/asimov-server) implements middleware and [asimov-pages](http://github.com/adamrenklint/asimov-pages) implements rendering processors.

```javascript
asimov.addSequence('chain');
asimov.chain(myChainFactory());

asimov.runSequence('chain')
  .done(function (
    'yay! done.'
  ))
  .fail(function (err) {
    console.log('ooops', err)
  });
```

## Configuration

You can change the behavior of plugins and configure your app with the ```asimov.config``` method.

```javascript
// Set a configuration variable. Chainable.
asimov.config('myConfigVar', true);

// And get it.
var myVar = asimov.config('myConfigVar');

// Or get the whole config object.
var myConfig = asimov.config();

// Also supports constants, just uppercase the name.
// Trying to set it again will throw an error.
asimov.config('SOMETHING_CONSTANT', true);

// Use an object literal, or a JSON file. Also chainable.
var production = require('./env/production.json');
asimov.config(production);
```

## Signals and rolling restarts

Out of the box, asimov.js supports zero-downtime updates with "rolling restarts", using POSIX signals.

For your convience, the master process' PID is saved in ```process.pid``` in your project root. This file is created when you start your app, removed when you stop it and can be used to send signals to asimov's master process.

To reload all code and restart your app, send **SIGHUP** to the master process.

```
$ kill -HUP $(cat process.pid)
```

## Add shutdown handlers

You can register functions that will be executed when your app is being restarted or forcefully shutdown. These work exactly the same way as initializers, are executed in sequence and you can change or override the chain of side effects by not calling the ```next()``` callback.

```javascript
asimov.shutdown(function (next) {
  // do some cleanup here
  next();
});
```

## Register a public interface

Your app or plugin could need to register methods or variables on ```asimov```'s public interface. Chainable method.

```javascript
asimov.register('doNothing', function () {});
```

For example, this is how asimov-pages exposes its main collection as ```asimov.pages```.

## Verbose logging

To get detailed logging on everything that happens in your app and plugins, set the env var ```VERBOSE``` to true. Or take the shortcut, call ```asimov debug```.

---

## Develop and contribute

1. First, fork this repo.
2. Implement something awesome
3. Write tests and run them with ```npm test```
4. Submit a pull request

### Credits

Author: [Adam Renklint](http://adamrenklint.com). Contributors: [Marvin Labod](http://www.inlovewithcss.com), [Timothy Achumba](http://awsme.me).
