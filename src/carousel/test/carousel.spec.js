describe('carousel', function() {
  beforeEach(module('ui.bootstrap.booking.carousel', function($compileProvider, $provide) {
    angular.forEach(['ngSwipeLeft', 'ngSwipeRight'], makeMock);
    function makeMock(name) {
      $provide.value(name + 'Directive', []); //remove existing directive if it exists
      $compileProvider.directive(name, function() {
        return function(scope, element, attr) {
          element.on(name, function() {
            scope.$apply(attr[name]);
          });
        };
      });
    }
  }));
  beforeEach(module('template/carousel/carousel.html', 'template/carousel/slide.html'));

  var $rootScope, $compile, $controller, $interval;
  beforeEach(inject(function(_$rootScope_, _$compile_, _$controller_, _$interval_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $controller = _$controller_;
    $interval = _$interval_;
  }));

  describe('basics', function() {
    var elm, scope;
    beforeEach(function() {
      scope = $rootScope.$new();
      scope.slides = [
        {active:false,content:'one'},
        {active:false,content:'two'},
        {active:false,content:'three'}
      ];
      elm = $compile(
        '<carousel interval="interval" no-transition="true" no-pause="nopause">' +
          '<slide ng-repeat="slide in slides" active="slide.active">' +
            '{{slide.content}}' +
          '</slide>' +
        '</carousel>'
      )(scope);
      scope.interval = 5000;
      scope.nopause = undefined;
      scope.$apply();
    });

    function testSlideActive(slideIndex) {
      for (var i=0; i<scope.slides.length; i++) {
        if (i == slideIndex) {
          expect(scope.slides[i].active).toBe(true);
        } else {
          expect(scope.slides[i].active).not.toBe(true);
        }
      }
    }

    it('should set the selected slide to active = true', function() {
      expect(scope.slides[0].content).toBe('one');
      testSlideActive(0);
      scope.$apply('slides[1].active=true');
      testSlideActive(1);
    });

    it('should create clickable prev nav button', function() {
      var navPrev = elm.find('a.left');
      var navNext = elm.find('a.right');

      expect(navPrev.length).toBe(1);
      expect(navNext.length).toBe(1);
    });

    it('should display clickable slide indicators', function () {
      var indicators = elm.find('ol.carousel-indicators > li');
      expect(indicators.length).toBe(3);
    });

    it('should stop cycling slides forward when noWrap is truthy', function () {
      elm = $compile(
          '<carousel interval="interval" no-wrap="noWrap">' +
            '<slide ng-repeat="slide in slides" active="slide.active">' +
              '{{slide.content}}' +
            '</slide>' +
          '</carousel>'
        )(scope);

      scope.noWrap = true;
      scope.$apply();

      scope = elm.isolateScope();
      spyOn(scope, 'pause');

      for (var i = 0; i < scope.slides.length - 1; ++i) {
        scope.next();
      }
      testSlideActive(scope.slides.length - 1);
      scope.next();
      testSlideActive(scope.slides.length - 1);
      expect(scope.pause).toHaveBeenCalled();
    });

    it('should stop cycling slides backward when noWrap is truthy', function () {
      elm = $compile(
          '<carousel interval="interval" no-wrap="noWrap">' +
            '<slide ng-repeat="slide in slides" active="slide.active">' +
              '{{slide.content}}' +
            '</slide>' +
          '</carousel>'
        )(scope);

      scope.noWrap = true;
      scope.$apply();

      scope = elm.isolateScope();
      spyOn(scope, 'pause');

      testSlideActive(0);
      scope.prev();
      testSlideActive(0);
      expect(scope.pause).toHaveBeenCalled();
    });

    it('should hide navigation when only one slide', function () {
      scope.slides=[{active:false,content:'one'}];
      scope.$apply();
      elm = $compile(
          '<carousel interval="interval" no-transition="true">' +
            '<slide ng-repeat="slide in slides" active="slide.active">' +
              '{{slide.content}}' +
            '</slide>' +
          '</carousel>'
        )(scope);
      var indicators = elm.find('ol.carousel-indicators > li');
      expect(indicators.length).toBe(0);

      var navNext = elm.find('a.right');
      expect(navNext.length).toBe(0);

      var navPrev = elm.find('a.left');
      expect(navPrev.length).toBe(0);
    });

    it('should show navigation when there are 3 slides', function () {
      var indicators = elm.find('ol.carousel-indicators > li');
      expect(indicators.length).not.toBe(0);

      var navNext = elm.find('a.right');
      expect(navNext.length).not.toBe(0);

      var navPrev = elm.find('a.left');
      expect(navPrev.length).not.toBe(0);
    });

    it('should go to next when clicking next button', function() {
      var navNext = elm.find('a.right');
      testSlideActive(0);
      navNext.click();
      testSlideActive(1);
      navNext.click();
      testSlideActive(2);
      navNext.click();
      testSlideActive(0);
    });

    it('should go to prev when clicking prev button', function() {
      var navPrev = elm.find('a.left');
      testSlideActive(0);
      navPrev.click();
      testSlideActive(2);
      navPrev.click();
      testSlideActive(1);
      navPrev.click();
      testSlideActive(0);
    });

    describe('swiping', function() {
      it('should go next on swipeLeft', function() {
        testSlideActive(0);
        elm.triggerHandler('ngSwipeLeft');
        testSlideActive(1);
      });

      it('should go prev on swipeRight', function() {
        testSlideActive(0);
        elm.triggerHandler('ngSwipeRight');
        testSlideActive(2);
      });
    });

    it('should select a slide when clicking on slide indicators', function () {
      var indicators = elm.find('ol.carousel-indicators > li');
      indicators.eq(1).click();
      testSlideActive(1);
    });

    it('shouldnt go forward if interval is NaN or negative or has no slides', function() {
      testSlideActive(0);
      var previousInterval = scope.interval;
      scope.$apply('interval = -1');
      $interval.flush(previousInterval);
      testSlideActive(0);
      scope.$apply('interval = 1000');
      $interval.flush(1000);
      testSlideActive(1);
      scope.$apply('interval = false');
      $interval.flush(1000);
      testSlideActive(1);
      scope.$apply('interval = 1000');
      $interval.flush(1000);
      testSlideActive(2);
      scope.$apply('slides = []');
      $interval.flush(1000);
      testSlideActive(2);
    });

    it('should bind the content to slides', function() {
      var contents = elm.find('div.item');

      expect(contents.length).toBe(3);
      expect(contents.eq(0).text()).toBe('one');
      expect(contents.eq(1).text()).toBe('two');
      expect(contents.eq(2).text()).toBe('three');

      scope.$apply(function() {
        scope.slides[0].content = 'what';
        scope.slides[1].content = 'no';
        scope.slides[2].content = 'maybe';
      });

      expect(contents.eq(0).text()).toBe('what');
      expect(contents.eq(1).text()).toBe('no');
      expect(contents.eq(2).text()).toBe('maybe');
    });

    it('should be playing by default and cycle through slides', function() {
      testSlideActive(0);
      $interval.flush(scope.interval);
      testSlideActive(1);
      $interval.flush(scope.interval);
      testSlideActive(2);
      $interval.flush(scope.interval);
      testSlideActive(0);
    });

    it('should pause and play on mouseover', function() {
      testSlideActive(0);
      $interval.flush(scope.interval);
      testSlideActive(1);
      elm.trigger('mouseenter');
      testSlideActive(1);
      $interval.flush(scope.interval);
      testSlideActive(1);
      elm.trigger('mouseleave');
      $interval.flush(scope.interval);
      testSlideActive(2);
    });

    it('should not pause on mouseover if noPause', function() {
      scope.$apply('nopause = true');
      testSlideActive(0);
      elm.trigger('mouseenter');
      $interval.flush(scope.interval);
      testSlideActive(1);
      elm.trigger('mouseleave');
      $interval.flush(scope.interval);
      testSlideActive(2);
    });

    it('should remove slide from dom and change active slide', function() {
      scope.$apply('slides[2].active = true');
      testSlideActive(2);
      scope.$apply('slides.splice(0,1)');
      expect(elm.find('div.item').length).toBe(2);
      testSlideActive(1);
      $interval.flush(scope.interval);
      testSlideActive(0);
      scope.$apply('slides.splice(1,1)');
      expect(elm.find('div.item').length).toBe(1);
      testSlideActive(0);
    });

    it('should change dom when you reassign ng-repeat slides array', function() {
      scope.slides=[{content:'new1'},{content:'new2'},{content:'new3'}];
      scope.$apply();
      var contents = elm.find('div.item');
      expect(contents.length).toBe(3);
      expect(contents.eq(0).text()).toBe('new1');
      expect(contents.eq(1).text()).toBe('new2');
      expect(contents.eq(2).text()).toBe('new3');
    });

    it('should not change if next is clicked while transitioning', function() {
      var carouselScope = elm.children().scope();
      var next = elm.find('a.right');

      testSlideActive(0);
      carouselScope.$currentTransition = true;
      next.click();

      testSlideActive(0);

      carouselScope.$currentTransition = null;
      next.click();
      testSlideActive(1);
    });

    it('issue 1414 - should not continue running timers after scope is destroyed', function() {
      testSlideActive(0);
      $interval.flush(scope.interval);
      testSlideActive(1);
      $interval.flush(scope.interval);
      testSlideActive(2);
      $interval.flush(scope.interval);
      testSlideActive(0);
      spyOn($interval, 'cancel').and.callThrough();
      scope.$destroy();
      expect($interval.cancel).toHaveBeenCalled();
    });

    describe('slide order', function() {

      beforeEach(function() {
        scope.slides = [
          {active:false,content:'one', id:1},
          {active:false,content:'two', id:2},
          {active:false,content:'three', id:3}
        ];
        elm = $compile(
          '<carousel interval="interval" no-transition="true" no-pause="nopause">' +
            '<slide ng-repeat="slide in slides | orderBy: \'id\' " active="slide.active" index="$index">' +
              '{{slide.content}}' +
            '</slide>' +
          '</carousel>'
        )(scope);
        scope.$apply();
        scope.slides[0].id = 3;
        scope.slides[1].id = 1;
        scope.slides[2].id = 2;
        scope.$apply();
      });

      it('should change dom when an order of the slides was changed', function() {
        testSlideActive(0);
        var contents = elm.find('div.item');
        expect(contents.length).toBe(3);
        expect(contents.eq(0).text()).toBe('two');
        expect(contents.eq(1).text()).toBe('three');
        expect(contents.eq(2).text()).toBe('one');
      });

      it('should select next after order change', function() {
        testSlideActive(0);
        var next = elm.find('a.right');
        next.click();
        testSlideActive(1);
      });

      it('should select prev after order change', function() {
        testSlideActive(0);
        var prev = elm.find('a.left');
        prev.click();
        testSlideActive(2);
      });

      it('should add slide in the specified position', function() {
        testSlideActive(0);
        scope.slides[2].id = 4;
        scope.slides.push({active:false,content:'four', id:2});
        scope.$apply();
        var contents = elm.find('div.item');
        expect(contents.length).toBe(4);
        expect(contents.eq(0).text()).toBe('two');
        expect(contents.eq(1).text()).toBe('four');
        expect(contents.eq(2).text()).toBe('one');
        expect(contents.eq(3).text()).toBe('three');
      });

      it('should remove slide after order change', function() {
        testSlideActive(0);
        scope.slides.splice(1, 1);
        scope.$apply();
        var contents = elm.find('div.item');
        expect(contents.length).toBe(2);
        expect(contents.eq(0).text()).toBe('three');
        expect(contents.eq(1).text()).toBe('one');
      });

    });

  });

  describe('controller', function() {
    var scope, ctrl;
    //create an array of slides and add to the scope
    var slides = [{'content':1},{'content':2},{'content':3},{'content':4}];

    beforeEach(function() {
      scope = $rootScope.$new();
      ctrl = $controller('CarouselController', {$scope: scope, $element: angular.element('<div></div>')});
      for(var i = 0;i < slides.length;i++){
        ctrl.addSlide(slides[i]);
      }
    });

    describe('addSlide', function() {
      it('should set first slide to active = true and the rest to false', function() {
        angular.forEach(ctrl.slides, function(slide, i) {
          if (i !== 0) {
            expect(slide.active).not.toBe(true);
          } else {
            expect(slide.active).toBe(true);
          }
        });
      });

      it('should add new slide and change active to true if active is true on the added slide', function() {
        var newSlide = {active: true};
        expect(ctrl.slides.length).toBe(4);
        ctrl.addSlide(newSlide);
        expect(ctrl.slides.length).toBe(5);
        expect(ctrl.slides[4].active).toBe(true);
        expect(ctrl.slides[0].active).toBe(false);
      });

      it('should add a new slide and not change the active slide', function() {
        var newSlide = {active: false};
        expect(ctrl.slides.length).toBe(4);
        ctrl.addSlide(newSlide);
        expect(ctrl.slides.length).toBe(5);
        expect(ctrl.slides[4].active).toBe(false);
        expect(ctrl.slides[0].active).toBe(true);
      });

      it('should remove slide and change active slide if needed', function() {
        expect(ctrl.slides.length).toBe(4);
        ctrl.removeSlide(ctrl.slides[0]);
        expect(ctrl.slides.length).toBe(3);
        expect(ctrl.currentSlide).toBe(ctrl.slides[0]);
        ctrl.select(ctrl.slides[2]);
        ctrl.removeSlide(ctrl.slides[2]);
        expect(ctrl.slides.length).toBe(2);
        expect(ctrl.currentSlide).toBe(ctrl.slides[1]);
        ctrl.removeSlide(ctrl.slides[0]);
        expect(ctrl.slides.length).toBe(1);
        expect(ctrl.currentSlide).toBe(ctrl.slides[0]);
      });

      it('issue 1414 - should not continue running timers after scope is destroyed', function() {
        spyOn(scope, 'next').and.callThrough();
        scope.interval = 2000;
        scope.$digest();

        $interval.flush(scope.interval);
        expect(scope.next.calls.count()).toBe(1);

        scope.$destroy();

        $interval.flush(scope.interval);
        expect(scope.next.calls.count()).toBe(1);
      });
    });
  });
});
