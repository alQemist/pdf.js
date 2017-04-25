/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('pdfjs-web/dom_events', ['exports', 'pdfjs-web/ui_utils'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports, require('./ui_utils.js'));
  } else {
    factory((root.pdfjsWebDOMEvents = {}), root.pdfjsWebUIUtils);
  }
}(this, function (exports, uiUtils) {
  var EventBus = uiUtils.EventBus;

  // Attaching to the application event bus to dispatch events to the DOM for
  // backwards viewer API compatibility.
  function attachDOMEventsToEventBus(eventBus) {
    eventBus.on('documentload', function () {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('documentload', true, true, {});
      window.dispatchEvent(event);
    });
    eventBus.on('pagerendered', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('pagerendered', true, true, {
        pageNumber: e.pageNumber,
        cssTransform: e.cssTransform,
      });
      e.source.div.dispatchEvent(event);
    });
    eventBus.on('textlayerrendered', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('textlayerrendered', true, true, {
        pageNumber: e.pageNumber
      });
      e.source.textLayerDiv.dispatchEvent(event);
    });
    eventBus.on('pagechange', function (e) {
      var event = document.createEvent('UIEvents');
      event.initUIEvent('pagechange', true, true, window, 0);
      event.pageNumber = e.pageNumber;
      e.source.container.dispatchEvent(event);
    });

    eventBus.on('pagesinit', function (e) {
      var appConfig = PDFViewerApplication.appConfig;
      var matadataConfig = appConfig.matadataConfig;
      var regex = new RegExp(matadataConfig['regex'], 'g');

      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('pagesinit', true, true, null);
      e.source.container.dispatchEvent(event);

      //Wait 10 ms to increase performance and then
      //search the document with a Regex and highlight the results.
      setTimeout(function () {
        var event2 = document.createEvent('CustomEvent');
        event2.initCustomEvent('regex_initial_search', true, true, null);
        eventBus.dispatch('regex_initial_search', {
          //TODO just testing catalogs
          // isRegex: true,
          // regex: new RegExp(/[0-9]{5}/, 'g'),
          isRegex: matadataConfig['regex'] ? true : false,
          regex: regex,
          query: '__',
          caseSensitive: false,
          highlightAll: true,
          phraseSearch: false});
      }, 50);
    });

    eventBus.on('productdetails', function (e) {
      var sku = e.sku;
      var appConfig = PDFViewerApplication.appConfig;
      var matadataConfig = appConfig.matadataConfig;
      var product_query_url = matadataConfig["product_query_url"] || matadataConfig["productLookup"];
      // var product_query_url = "http://www.forestry-suppliers.com/icat/productLookup.asp?SKU=[SKU]";

      if (sku && product_query_url) {
        PDFViewerApplication.pdfProductPopup.open(sku, product_query_url);
      } else {
        console.log("ERROR - There is no product URL or valid SKU");
      }
    });

    eventBus.on('addtocart', function (e) {
      var product = e.product;
      if (!product) {
        return;
      }
      PDFViewerApplication.pdfCartViewer.addProduct(product);
      PDFViewerApplication.pdfProductPopup.close()
    });

    eventBus.on('showcart', function (e) {
      PDFViewerApplication.pdfSidebar.show_cart_view();
    });

    eventBus.on('pagesloaded', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('pagesloaded', true, true, {
        pagesCount: e.pagesCount
      });
      e.source.container.dispatchEvent(event);
    });
    eventBus.on('scalechange', function (e) {
      var event = document.createEvent('UIEvents');
      event.initUIEvent('scalechange', true, true, window, 0);
      event.scale = e.scale;
      event.presetValue = e.presetValue;
      e.source.container.dispatchEvent(event);
    });
    eventBus.on('updateviewarea', function (e) {
      var event = document.createEvent('UIEvents');
      event.initUIEvent('updateviewarea', true, true, window, 0);
      event.location = e.location;
      e.source.container.dispatchEvent(event);
    });
    eventBus.on('find', function (e) {
      if (e.source === window) {
        return; // event comes from FirefoxCom, no need to replicate
      }
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('find' + e.type, true, true, {
        query: e.query,
        phraseSearch: e.phraseSearch,
        caseSensitive: e.caseSensitive,
        highlightAll: e.highlightAll,
        findPrevious: e.findPrevious
      });
      window.dispatchEvent(event);
    });
    /*eventBus.on('attachmentsloaded', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('attachmentsloaded', true, true, {
        attachmentsCount: e.attachmentsCount
      });
      e.source.container.dispatchEvent(event);
    });*/
    eventBus.on('sidebarviewchanged', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('sidebarviewchanged', true, true, {
        view: e.view,
      });
      e.source.outerContainer.dispatchEvent(event);
    });
    eventBus.on('pagemode', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('pagemode', true, true, {
        mode: e.mode,
      });
      e.source.pdfViewer.container.dispatchEvent(event);
    });
    eventBus.on('namedaction', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('namedaction', true, true, {
        action: e.action
      });
      e.source.pdfViewer.container.dispatchEvent(event);
    });
    eventBus.on('presentationmodechanged', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('presentationmodechanged', true, true, {
        active: e.active,
        switchInProgress: e.switchInProgress
      });
      window.dispatchEvent(event);
    });
    eventBus.on('outlineloaded', function (e) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('outlineloaded', true, true, {
        outlineCount: e.outlineCount
      });
      e.source.container.dispatchEvent(event);
    });
  }

  var globalEventBus = null;
  function getGlobalEventBus() {
    if (globalEventBus) {
      return globalEventBus;
    }
    globalEventBus = new EventBus();
    attachDOMEventsToEventBus(globalEventBus);
    return globalEventBus;
  }

  exports.attachDOMEventsToEventBus = attachDOMEventsToEventBus;
  exports.getGlobalEventBus = getGlobalEventBus;
}));
