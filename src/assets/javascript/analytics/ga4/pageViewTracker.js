window.DI = window.DI || {};
window.DI.analyticsGa4 = window.DI.analyticsGa4 || {};
window.DI.analyticsGa4.trackers = window.DI.analyticsGa4.trackers || {};

(function (trackers) {
  "use strict";

  let PageViewTracker = {
    init: function () {
      const data = {
        event: "page_view_ga4",
        page_view: {
          language: this.getLanguage(),
          location: this.getLocation(),
          organisations: "<OT1056>",
          primary_publishing_organisation:
            "government digital service - digital identity",
          status_code: this.getStatusCode(),
          title: this.getTitle(),
          referrer: this.getReferrer(),
          taxonomy_level1: "web cri",
          taxonomy_level2: this.getTaxonomyLevel2(),
        },
      };
      window.DI.core.sendData(data);
    },

    getLanguage: function () {
      var languageCode =
        document.querySelector("html") &&
        document.querySelector("html").getAttribute("lang");
      return languageCode.toLowerCase();
    },

    getStatusCode: function () {
      return window.DI.httpStatusCode ?? 200;
    },

    getLocation: function () {
      return document.location.href?.toLowerCase();
    },

    getTitle: function () {
      return document.title?.toLowerCase();
    },

    getReferrer: function () {
      return document.referrer?.toLowerCase();
    },

    getTaxonomyLevel2: function () {
      return document.getElementById("gaTaxonomyLevel2").value;
    },
  };

  trackers.PageViewTracker = PageViewTracker;
})(window.DI.analyticsGa4.trackers);
