window.DI = window.DI || {}
window.DI.analyticsUa = window.DI.analyticsUa || {};

(function (analytics) {

  'use strict'

  function initGtm() {

    const sendData = window.DI.core.sendData

    sendData({
      "gtm.allowlist": ["google"],
      "gtm.blocklist": ["adm", "awct", "sp", "gclidw", "gcs", "opt"],
    })

    //mobile were using this as a tag on the page, CIC weren't - depends on how much detail we need
    const gaCriType = document.getElementById("gaCriType");
    const gaDataElement = document.getElementById("gaData");

    const criJourney = criDataLayer(
      gaCriType ? gaCriType.value : "undefined",
    gaDataElement ? gaDataElement.value : "undefined"
    );

    if (criJourney) {
      sendData(criJourney);
    }

    sendData({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  }

  //We suspect this isn't needed/ requires update
  function initLinkerHandlers() {
    const submitButton = document.querySelector('button[type="submit"]');
    const pageForm = document.getElementById("form-tracking");

    if (submitButton && pageForm) {
      submitButton.addEventListener("click", function () {
        if (window.ga && window.gaplugins) {
          const tracker = ga.getAll()[0];
          const linker = new window.gaplugins.Linker(tracker);
          const destinationLink = linker.decorate(pageForm.action);
          pageForm.action = destinationLink;
        }
      });
    }

    const trackLink = document.getElementById("track-link");

    if (trackLink) {
      trackLink.addEventListener("click", function (e) {
        e.preventDefault();

        if (window.ga && window.gaplugins) {
          const tracker = ga.getAll()[0];
          const linker = new window.gaplugins.Linker(tracker);
          const destinationLink = linker.decorate(trackLink.href);
          window.location.href = destinationLink;
        } else {
          window.location.href = trackLink.href;
        }
      });
    }
  }


//Requires clarification - need to check with Bea/ Sam if CRI type should be
  function criDataLayer(criType = "undefined", criJourney = "undefined") {
    // cri_journey is the only field to change at the moment
    // it is based off the docType cookie bound to a hidden element on specific pages, and so if that element isn't there, it will be 'undefined'. If it is there, the values will be boolean as a string
    return {
      event: "page_view",
      page: {
        cri_type: criType,
        cri_journey: criJourney,
        organisations: "DI",
      },
    };
  }

  const init = function() {

    const consentGiven = window.DI.cookies.hasConsentForAnalytics()

    if (consentGiven) {
      window.DI.core.load(window.DI.analytics.vars.uaContainerId)
      initGtm()
      initLinkerHandlers()
    } else {
      window.addEventListener('cookie-consent', window.DI.analyticsUa.init)
    }
  }

  analytics.init = init

})(window.DI.analyticsUa)
