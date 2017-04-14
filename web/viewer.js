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
/* globals chrome */

'use strict';

var DEFAULT_URL = 'Spring.pdf';
// var DEFAULT_URL = 'compressed.tracemonkey-pldi-09.pdf';
//var DEFAULT_URL = 'test.pdf';

if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME')) {
  (function rewriteUrlClosure() {
    // Run this code outside DOMContentLoaded to make sure that the URL
    // is rewritten as soon as possible.
    var queryString = document.location.search.slice(1);
    var m = /(^|&)file=([^&]*)/.exec(queryString);
    DEFAULT_URL = m ? decodeURIComponent(m[2]) : '';

    // Example: chrome-extension://.../http://example.com/file.pdf
    var humanReadableUrl = '/' + DEFAULT_URL + location.hash;
    history.replaceState(history.state, '', humanReadableUrl);
    if (top === window) {
      chrome.runtime.sendMessage('showPageAction');
    }
  })();
}

var pdfjsWebApp;
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('PRODUCTION')) {
  pdfjsWebApp = require('./app.js');
}

if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
  // FIXME the l10n.js file in the Firefox extension needs global FirefoxCom.
  window.FirefoxCom = require('./firefoxcom.js').FirefoxCom;
  require('./firefox_print_service.js');
}
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME')) {
  require('./chromecom.js');
}
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME || GENERIC')) {
  require('./pdf_print_service.js');
}

function getViewerConfiguration() {
  return {
    DEBUG_MODE: true,
    appContainer: document.body,
    mainContainer: document.getElementById('viewerContainer'),
    viewerContainer: document.getElementById('viewer'),
    eventBus: null, // using global event bus with DOM events
    toolbar: {
      container: document.getElementById('toolbarViewer'),
      numPages: document.getElementById('numPages'),
      pageNumber: document.getElementById('pageNumber'),
      scaleSelectContainer: document.getElementById('scaleSelectContainer'),
      scaleSelect: document.getElementById('scaleSelect'),
      customScaleOption: document.getElementById('customScaleOption'),
      previous: document.getElementById('previous'),
      next: document.getElementById('next'),
      zoomIn: document.getElementById('zoomIn'),
      zoomOut: document.getElementById('zoomOut'),
      viewFind: document.getElementById('viewFind'),
      openFile: document.getElementById('openFile'),
      print: document.getElementById('print'),
      presentationModeButton: document.getElementById('presentationMode'),
      download: document.getElementById('download'),
      viewBookmark: document.getElementById('viewBookmark'),
    },
    secondaryToolbar: {
      toolbar: document.getElementById('secondaryToolbar'),
      toggleButton: document.getElementById('secondaryToolbarToggle'),
      toolbarButtonContainer:
        document.getElementById('secondaryToolbarButtonContainer'),
      presentationModeButton:
        document.getElementById('secondaryPresentationMode'),
      openFileButton: document.getElementById('secondaryOpenFile'),
      printButton: document.getElementById('secondaryPrint'),
      downloadButton: document.getElementById('secondaryDownload'),
      viewBookmarkButton: document.getElementById('secondaryViewBookmark'),
      firstPageButton: document.getElementById('firstPage'),
      lastPageButton: document.getElementById('lastPage'),
      pageRotateCwButton: document.getElementById('pageRotateCw'),
      pageRotateCcwButton: document.getElementById('pageRotateCcw'),
      toggleHandToolButton: document.getElementById('toggleHandTool'),
      publisherButton: document.getElementById('publisherInfoButton'),
      // documentPropertiesButton: document.getElementById('documentProperties'),
      shareButton: document.getElementById('shareButton'),
    },
    pageViewsToolbar: {
      toolbar: document.getElementById('pageViewsToolbar'),
      toggleButton: document.getElementById('pageViewsToolbarToggle'),
      toolbarButtonContainer: document.getElementById('pageViewsToolbarButtonContainer'),
      modeA: document.getElementById('modeA'),
      modeB: document.getElementById('modeB'),
      modeC: document.getElementById('modeC'),
    },
    shareToolbar: {
      secondaryToolbar: document.getElementById('secondaryToolbarButtonContainer'),
      toolbar: document.getElementById('shareToolbar'),
      toggleButton: document.getElementById('shareButton'),
      toolbarButtonContainer: document.getElementById('shareToolbarButtonContainer'),
      facebookButton: document.getElementById('facebookButton'),
      twitterButton: document.getElementById('twitterButton'),
      linkedinButton: document.getElementById('linkedinButton'),
    },
    fullscreen: {
      contextFirstPage: document.getElementById('contextFirstPage'),
      contextLastPage: document.getElementById('contextLastPage'),
      contextPageRotateCw: document.getElementById('contextPageRotateCw'),
      contextPageRotateCcw: document.getElementById('contextPageRotateCcw'),
    },
    sidebar: {
      // Divs (and sidebar button)
      mainContainer: document.getElementById('mainContainer'),
      outerContainer: document.getElementById('outerContainer'),
      toggleButton: document.getElementById('sidebarToggle'),
      // Buttons
      thumbnailButton: document.getElementById('viewThumbnail'),
      outlineButton: document.getElementById('viewOutline'),
      favoriteButton: document.getElementById('viewFavorite'),
      cartButton: document.getElementById('viewCart'),
      // attachmentsButton: document.getElementById('viewAttachments'),
      // Views
      thumbnailView: document.getElementById('thumbnailView'),
      outlineView: document.getElementById('outlineView'),
      // attachmentsView: document.getElementById('attachmentsView'),
    },
    findBar: {
      bar: document.getElementById('findbar'),
      toggleButton: document.getElementById('viewFind'),
      findField: document.getElementById('findInput'),
      highlightAllCheckbox: document.getElementById('findHighlightAll'),
      caseSensitiveCheckbox: document.getElementById('findMatchCase'),
      findMsg: document.getElementById('findMsg'),
      findResultsCount: document.getElementById('findResultsCount'),
      findStatusIcon: document.getElementById('findStatusIcon'),
      findPreviousButton: document.getElementById('findPrevious'),
      findNextButton: document.getElementById('findNext')
    },
    passwordOverlay: {
      overlayName: 'passwordOverlay',
      container: document.getElementById('passwordOverlay'),
      label: document.getElementById('passwordText'),
      input: document.getElementById('password'),
      submitButton: document.getElementById('passwordSubmit'),
      cancelButton: document.getElementById('passwordCancel')
    },
    documentProperties: {
      overlayName: 'documentPropertiesOverlay',
      container: document.getElementById('documentPropertiesOverlay'),
      closeButton: document.getElementById('documentPropertiesClose'),
      fields: {
        'fileName': document.getElementById('fileNameField'),
        'fileSize': document.getElementById('fileSizeField'),
        'title': document.getElementById('titleField'),
        'author': document.getElementById('authorField'),
        'subject': document.getElementById('subjectField'),
        'keywords': document.getElementById('keywordsField'),
        'creationDate': document.getElementById('creationDateField'),
        'modificationDate': document.getElementById('modificationDateField'),
        'creator': document.getElementById('creatorField'),
        'producer': document.getElementById('producerField'),
        'version': document.getElementById('versionField'),
        'pageCount': document.getElementById('pageCountField')
      }
    },
    productPopup: {
      overlayName: 'productPopupOverlay',
      spinner: document.getElementById('spinnerPopup'),
      container: document.getElementById('productPopupOverlay'),
      productPopup: document.getElementById('productPopup'),
      closeButton: document.getElementById('productPopupClose'),
      popupErrorClose: document.getElementById('popupErrorClose'),
      errorBody: document.getElementById('errorPopup'),
      fields: {
        'image': document.getElementById('productImageField'),
        'sku': document.getElementById('productSkuField'),
        'description': document.getElementById('productDescriptionField'),
        'price': document.getElementById('productPriceField'),
        'available': document.getElementById('productAvailableField'),
      }
    },
    publisherPopup: {
      overlayName: 'publisherPopupOverlay',
      container: document.getElementById('publisherPopupOverlay'),
      publisherPopup: document.getElementById('publisherPopup'),
      closeButton: document.getElementById('publisherPopupClose'),
      fields: {
        'company': document.getElementById('publisherCompanyField'),
        'address1': document.getElementById('publisherAddress1Field'),
        'address2': document.getElementById('publisherAddress2Field'),
        'city': document.getElementById('publisherCityField'),
        'state': document.getElementById('publisherStateField'),
        'zip': document.getElementById('publisherZipField'),
        'country': document.getElementById('publisherCountryField'),
        'company_email': document.getElementById('publisherEmailField'),
        'phone': document.getElementById('publisherPhoneField'),
        'weburl': document.getElementById('publisherWebField'),
      }
    },
    errorWrapper: {
      container: document.getElementById('errorWrapper'),
      errorMessage: document.getElementById('errorMessage'),
      closeButton: document.getElementById('errorClose'),
      errorMoreInfo: document.getElementById('errorMoreInfo'),
      moreInfoButton: document.getElementById('errorShowMore'),
      lessInfoButton: document.getElementById('errorShowLess')
    },
    matadataConfig: {
      // Shopping variables
      product_query_url: '',
      checkout_url: '',
      regex: '',
      productLookup: '',

      // General properties
      title: '',
      default_color: '',
      page_offset: '0',
      allow_download: '1',
      allow_print: '1',
      allow_share: '1',
      allow_favorite: '1',
      page_mode: '',
      page_zoom: 0,
      allow_fullscreen: 0,

      // Publisher Info
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      company_email: '',
      phone: '',
      weburl: '',

      // Data Model
      accountid: '',
      pubid: ''
    },
    printContainer: document.getElementById('printContainer'),
    openFileInputName: 'fileInput',
    debuggerScriptPath: './debugger.js',
    defaultUrl: DEFAULT_URL
  };
}

function webViewerLoad() {
  var config = getViewerConfiguration();
  if (typeof PDFJSDev === 'undefined' || !PDFJSDev.test('PRODUCTION')) {
    Promise.all([SystemJS.import('pdfjs-web/app'),
                 SystemJS.import('pdfjs-web/pdf_print_service')])
           .then(function (modules) {
      var app = modules[0];
      window.PDFViewerApplication = app.PDFViewerApplication;
      app.PDFViewerApplication.run(config);
    });
  } else {
    window.PDFViewerApplication = pdfjsWebApp.PDFViewerApplication;
    pdfjsWebApp.PDFViewerApplication.run(config);
  }
}

if (document.readyState === 'interactive' ||
    document.readyState === 'complete') {
  webViewerLoad();
} else {
  document.addEventListener('DOMContentLoaded', webViewerLoad, true);
}
