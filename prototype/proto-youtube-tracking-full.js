(function () {
  function pushVideoEvent(status, player, percent) {
    var duration = player.getDuration();
    var currentTime = player.getCurrentTime();
    var roundedDuration = Math.round(duration);
    var roundedCurrentTime = Math.round(currentTime);

    duration = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
    percent = typeof percent !== "undefined" ? percent : duration;

    var videoData = player.getVideoData();
    var title = videoData && videoData.title ? videoData.title : "YouTube Video";
    var url = player.getIframe().src;
    url = url.split("?")[0];
    if (!url || url.indexOf("http") === -1) {
      url = player.getVideoUrl();
    }

    var iframe = player.getIframe();
    var visible = false;
    if (iframe) {
      var bounds = iframe.getBoundingClientRect();
      visible =
        bounds.top < (window.innerHeight || document.documentElement.clientHeight) &&
        bounds.bottom > 0 &&
        bounds.left < (window.innerWidth || document.documentElement.clientWidth) &&
        bounds.right > 0;
    }

    var eventKey = url + "_" + status;
    if (status === "progress") {
      eventKey = url + "_p_" + percent;
    }

    if (!sentEvents[eventKey]) {
      sentEvents[eventKey] = true;
      window.dataLayer.push({
        event: "custom_video",
        video_status: status,
        video_title: title,
        video_url: url,
        video_percent: percent,
        video_duration: roundedDuration,
        video_current_time: roundedCurrentTime,
        video_provider: "youtube",
        visible: visible
      });
    }
  }

  function onPlayerReady(event) {
    var player = event.target;
    setInterval(function () {
      if (player && player.getPlayerState && player.getPlayerState() === 1) {
        checkProgress(player);
      }
    }, 1000);
  }

  function onPlayerStateChange(event) {
    var player = event.target;
    if (event.data === 1) pushVideoEvent("play", player);
    if (event.data === 2) pushVideoEvent("pause", player);
    if (event.data === 0) pushVideoEvent("complete", player);
  }

  function checkProgress(player) {
    var duration = player.getDuration();
    var currentTime = player.getCurrentTime();
    var progress = (currentTime / duration) * 100;

    milestones.forEach(function (percent) {
      var id = player.getIframe() ? player.getIframe().id : "unknown";
      var milestoneKey = "p_" + percent + "_" + id;
      if (progress >= percent && !sentEvents[milestoneKey]) {
        sentEvents[milestoneKey] = true;
        pushVideoEvent("progress", player, percent);
      }
    });
  }

  var milestones = [25, 50, 75];
  var sentEvents = {};

  window.onYouTubeIframeAPIReady = function () {
    var iframes = document.querySelectorAll('iframe[src*="youtube"]');
    iframes.forEach(function (iframe) {
      if (!iframe.id) {
        iframe.id = "yt-player-" + Math.floor(Math.random() * 100000);
      }

      new YT.Player(iframe.id, {
        events: {
          onStateChange: onPlayerStateChange,
          onReady: onPlayerReady
        }
      });
    });
  };

  if (!window.YT) {
    var apiScript = document.createElement("script");
    apiScript.src = "https://www.youtube.com/iframe_api";

    var firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(apiScript, firstScript);
  } else if (window.YT.Player) {
    window.onYouTubeIframeAPIReady();
  }
})();
