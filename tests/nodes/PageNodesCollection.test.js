test([

  '../../lib/nodes/PageNodesCollection'

], function (test) {

  var instance;

  beforeEach(function (done) {

    instance = new test.deps.PageNodesCollection(null, {
      'localization': {
        'defaultLangCode': 'en'
      },
      'paths': {
        'content': 'tests/mocks/pages',
        'frameworkPages': 'tests/mocks/pages'
      },
      'muteLog': true
    });

    instance.fetch('tests/mocks/pages').done(function () {
      done();
    });
  });

  test.spec('add (array models, object options)', function () {

    test.when('several unique models with similar ids are passed', function () {

      var length;

      test.beforeEach(function () {

        length = instance.models.length;

        instance.add([{
          'type': 'page',
          'path': process.cwd() + '/' + instance.options.paths.content + '/page.txt'
        }, {
          'type': 'page',
          'path': process.cwd() + '/' + instance.options.paths.content + '/sub/page.txt'
        }, {
          'type': 'page',
          'path': process.cwd() + '/' + instance.options.paths.content + '/sub/sub2/page.txt'
        }, {
          'type': 'page',
          'path': process.cwd() + '/' + instance.options.paths.content + '/foo/page.txt'
        }, {
          'type': 'page',
          'path': process.cwd() + '/' + instance.options.paths.content + '/foo/bar/page.txt'
        }]);
      });

      test.it('should add each unique model', function () {
        expect(instance.models.length).to.equal(5 + length);
      });
    });
  });

  test.spec('childrenOf (string url, object options)', function () {

    test.when('url is not a string', function () {

      test.itShould.throwError(function () {
        instance.childrenOf();
      });
    });

    test.when('url doesn\'t match any page', function () {

      test.itShould.throwError(function () {
        instance.childrenOf('/never-existed');
      });
    });

    test.when('url matches a page', function () {

      test.it('should return an instance of PageNodesCollection', function () {

        var children = instance.childrenOf('/');
        expect(children.namespace).to.equal('Pages');
      });

      test.when('the page model has children in self.pages', function () {

        test.it('should return each child in the PageNodesCollection', function () {

          var children = instance.childrenOf('/');

          expect(children.get('/foo').attributes.title).to.equal('foo');
          expect(children.get('/zoo').attributes.title).to.equal('zoologogogogy');
        });

        test.it('should not return any other pages in the PageNodesCollection',function () {

          var children = instance.childrenOf('/');
          expect(children.models.length).to.equal(2);
        });
      });

      test.when('the page model has no children in self.pages', function () {

        test.it('should return an empty PageNodesCollection', function () {

          var children = instance.childrenOf('/zoo');
          expect(children.models.length).to.equal(0);
        });
      });

      test.when('options.hidden is false (default)', function () {

        test.it('should not return hidden pages', function () {

          var children = instance.childrenOf('/foo/bar');
          expect(children.models.length).to.equal(0);
        });
      });

      test.when('options.hidden is true', function () {

        test.it('should also return hidden pages', function () {

          var children = instance.childrenOf('/', {
            'hidden': true
          });
          expect(children.models.length).to.equal(3);
          expect(children.get('/hidden').attributes.title).to.equal('Invisible');
        });
      });
    });
  });
});