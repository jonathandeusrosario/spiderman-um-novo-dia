document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

  // Initialize ScrollSmoother
  const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5,
    effects: true
  });

  // Canvas Frame Sequence Setup
  const canvas = document.getElementById("frame-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const stageCard = document.querySelector(".content-card.stage");

  const frameCount = 59;
  const images = [];
  const frameObj = { frame: 0 };

  const currentFrame = (index) =>
    `assets/frames/ezgif-frame-${(index + 1).toString().padStart(3, "0")}.jpg`;

  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }

  function resizeCanvas() {
    if (!canvas || !stageCard) return;
    canvas.width = stageCard.clientWidth;
    canvas.height = stageCard.clientHeight;
    renderFrame();
  }

  function renderFrame() {
    if (!ctx || !canvas) return;
    const img = images[Math.round(frameObj.frame)];
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShift_x,
        centerShift_y,
        img.width * ratio,
        img.height * ratio
      );
    }
  }

  images[0].onload = renderFrame;
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // SplitText Setup
  const split1 = new SplitText(".text-1", { type: "chars" });
  const split2 = new SplitText(".text-2", { type: "chars" });
  const split3 = new SplitText(".text-3", { type: "chars" });

  // Initially hide chars of text 2 and 3
  gsap.set(split2.chars, { opacity: 0 });
  gsap.set(split3.chars, { opacity: 0 });
  gsap.set([".text-2", ".text-3"], { opacity: 1 });

  // Main Pinned Timeline synced with ScrollTrigger
  const mainTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero-container",
      pin: true,
      start: "top top",
      end: "+=7000",
      scrub: 1
    }
  });

  // 1. Frame sequence animation (0 -> 58)
  mainTl.to(
    frameObj,
    {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      duration: 1,
      onUpdate: renderFrame
    },
    0
  );

  // 2. Text swap animation (simultaneous with frame sequence)
  // Text 1 -> Text 2
  mainTl.to(
    ".circular-text",
    {
      filter: "brightness(0) invert(1)",
      duration: 0.3,
      ease: "power1.inOut"
    },
    0.7
  );
  mainTl.to(
    [".text-1", ".text-2", ".text-3"],
    {
      color: "#ffffff",
      duration: 0.3,
      ease: "power1.inOut"
    },
    0.7
  );
  mainTl.to(
    split1.chars,
    {
      opacity: 0,
      ease: "power1.inOut",
      duration: 0.15,
      stagger: { amount: 0.12, from: "random" }
    },
    0.15
  );

  mainTl.to(
    split2.chars,
    {
      opacity: 1,
      ease: "power1.inOut",
      duration: 0.15,
      stagger: { amount: 0.12, from: "random" }
    },
    0.32
  );

  // Text 2 -> Text 3
  mainTl.to(
    split2.chars,
    {
      opacity: 0,
      ease: "power1.inOut",
      duration: 0.15,
      stagger: { amount: 0.12, from: "random" }
    },
    0.62
  );

  mainTl.to(
    split3.chars,
    {
      opacity: 1,
      ease: "power1.inOut",
      duration: 0.15,
      stagger: { amount: 0.12, from: "random" }
    },
    0.78
  );

  // 3. Center Video Mask Reveal Animation
  // Expand height first from 0 to 100%
  mainTl.to(
    ".video-mask-container",
    {
      height: "100%",
      duration: 0.2,
      ease: "power2.inOut"
    },
    1.0
  );

  // Expand width from 0 to 100%
  mainTl.to(
    ".video-mask-container",
    {
      width: "100%",
      duration: 0.5,
      ease: "power2.inOut"
    },
    1.3
  );

  // Push Card-Left to the left and Card-Right to the right as mask grows
  mainTl.to(
    ".card-left",
    {
      xPercent: -140,
      opacity: 0,
      duration: 0.6,
      ease: "power2.in"
    },
    1.4
  );

  mainTl.to(
    ".card-right",
    {
      xPercent: 140,
      opacity: 0,
      duration: 0.6,
      ease: "power2.in"
    },
    1.4
  );

  // Reveal central Play Button Trigger when mask hits 100% width
  mainTl.to(
    ".btn-play-trigger",
    {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: "back.out(1.7)"
    },
    2.0
  );

  // ==========================================
  // Custom Trailer Video Player Logic
  // ==========================================
  const trailerVideo = document.getElementById("trailer-video");
  const btnPlayTrigger = document.getElementById("btn-play-trigger");
  const videoOverlay = document.querySelector(".video-overlay");
  const customControls = document.getElementById("custom-player-controls");
  const ctrlPlayPause = document.getElementById("ctrl-play-pause");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const timeDisplay = document.getElementById("time-display");
  const ctrlMute = document.getElementById("ctrl-mute");
  const iconVolumeHigh = document.getElementById("icon-volume-high");
  const iconVolumeMute = document.getElementById("icon-volume-mute");
  const ctrlFullscreen = document.getElementById("ctrl-fullscreen");
  const videoInner = document.querySelector(".video-inner");

  let isPlayerActive = false;

  // Play button click on overlay
  if (btnPlayTrigger && trailerVideo) {
    btnPlayTrigger.addEventListener("click", () => {
      isPlayerActive = true;
      trailerVideo.currentTime = 0;
      trailerVideo.muted = false;
      trailerVideo.play();

      if (videoOverlay) videoOverlay.classList.add("hidden-overlay");
      if (customControls) customControls.classList.add("active");
      updatePlayPauseIcons();
      updateVolumeIcons();
    });
  }

  // Play / Pause Toggle
  function togglePlayPause() {
    if (!trailerVideo) return;
    if (trailerVideo.paused) {
      trailerVideo.play();
    } else {
      trailerVideo.pause();
    }
    updatePlayPauseIcons();
  }

  function updatePlayPauseIcons() {
    if (!trailerVideo || !iconPlay || !iconPause) return;
    if (trailerVideo.paused) {
      iconPause.classList.add("hidden");
      iconPlay.classList.remove("hidden");
    } else {
      iconPause.classList.remove("hidden");
      iconPlay.classList.add("hidden");
    }
  }

  if (ctrlPlayPause) {
    ctrlPlayPause.addEventListener("click", togglePlayPause);
  }

  if (trailerVideo) {
    trailerVideo.addEventListener("click", () => {
      if (isPlayerActive) {
        togglePlayPause();
      }
    });
  }

  // Mute / Unmute Toggle
  function toggleMute() {
    if (!trailerVideo) return;
    trailerVideo.muted = !trailerVideo.muted;
    updateVolumeIcons();
  }

  function updateVolumeIcons() {
    if (!trailerVideo || !iconVolumeHigh || !iconVolumeMute) return;
    if (trailerVideo.muted) {
      iconVolumeHigh.classList.add("hidden");
      iconVolumeMute.classList.remove("hidden");
    } else {
      iconVolumeHigh.classList.remove("hidden");
      iconVolumeMute.classList.add("hidden");
    }
  }

  if (ctrlMute) {
    ctrlMute.addEventListener("click", toggleMute);
  }

  // Time formatting & Progress Bar update
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  if (trailerVideo) {
    trailerVideo.addEventListener("timeupdate", () => {
      if (!trailerVideo.duration) return;
      const pct = (trailerVideo.currentTime / trailerVideo.duration) * 100;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (timeDisplay) {
        timeDisplay.textContent = `${formatTime(trailerVideo.currentTime)} / ${formatTime(trailerVideo.duration)}`;
      }
    });

    trailerVideo.addEventListener("play", updatePlayPauseIcons);
    trailerVideo.addEventListener("pause", updatePlayPauseIcons);
  }

  // Progress Bar Seek
  if (progressContainer && trailerVideo) {
    progressContainer.addEventListener("click", (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (trailerVideo.duration) {
        trailerVideo.currentTime = pos * trailerVideo.duration;
      }
    });
  }

  // Fullscreen
  if (ctrlFullscreen && videoInner) {
    ctrlFullscreen.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        if (videoInner.requestFullscreen) {
          videoInner.requestFullscreen();
        } else if (trailerVideo.requestFullscreen) {
          trailerVideo.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }

  // ==========================================
  // Cast Section (Elenco) Pinned Timeline
  // ==========================================
  const castPersonInfos = document.querySelectorAll(".cast__person .person-info");
  const castPickerItems = document.querySelectorAll(".picker-item");
  const spiderIndicator = document.getElementById("spider-indicator");
  const castLineFill = document.getElementById("cast-line-fill");

  function updateCastState(activeIndex) {
    castPersonInfos.forEach((info, idx) => {
      if (idx === activeIndex) {
        info.classList.add("active");
      } else {
        info.classList.remove("active");
      }
    });

    castPickerItems.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  const castTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".cast-section",
      pin: true,
      start: "top top",
      end: "+=4000",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        let activeIdx = 0;
        if (progress < 0.22) {
          activeIdx = 0;
        } else if (progress < 0.47) {
          activeIdx = 1;
        } else if (progress < 0.72) {
          activeIdx = 2;
        } else if (progress < 0.92) {
          activeIdx = 3;
        } else {
          activeIdx = 4;
        }
        updateCastState(activeIdx);
      }
    }
  });

  // Spider Indicator & Line Fill Progress using REAL DOM positions of picker items
  function initSpiderPositioning() {
    if (!spiderIndicator || !castPickerItems.length) return;
    const trackWrapper = spiderIndicator.parentElement;
    if (!trackWrapper) return;

    const trackRect = trackWrapper.getBoundingClientRect();
    const centers = Array.from(castPickerItems).map((item) => {
      const itemRect = item.getBoundingClientRect();
      return (itemRect.top + itemRect.height / 2) - trackRect.top;
    });

    if (centers.length === 5) {
      const [y0, y1, y2, y3, y4] = centers;

      gsap.set(spiderIndicator, { top: y0 + "px" });
      if (castLineFill) gsap.set(castLineFill, { height: y0 + "px" });

      castTl.to(
        spiderIndicator,
        {
          keyframes: [
            { top: y0 + "px" },
            { top: y1 + "px" },
            { top: y2 + "px" },
            { top: y3 + "px" },
            { top: y4 + "px" }
          ],
          ease: "none",
          duration: 1
        },
        0
      );

      if (castLineFill) {
        castTl.to(castLineFill, { height: "100%", ease: "none", duration: 1 }, 0);
      }

      // Mask Reveals (Top-to-Bottom height expansion for each slide)
      // Slide 1 (Zendaya)
      castTl.to(
        ".cast-img-wrapper.slide-1",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.02
      );

      // Slide 2 (Jacob Batalon)
      castTl.to(
        ".cast-img-wrapper.slide-2",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.27
      );

      // Slide 3 (Benedict Cumberbatch)
      castTl.to(
        ".cast-img-wrapper.slide-3",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.52
      );

      // Slide 4 (Willem Dafoe)
      castTl.to(
        ".cast-img-wrapper.slide-4",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.77
      );

      // Picker Items Click Navigation
      castPickerItems.forEach((item, index) => {
        item.addEventListener("click", () => {
          if (!castTl.scrollTrigger) return;
          const totalScroll = castTl.scrollTrigger.end - castTl.scrollTrigger.start;
          const targetProgress = index / 4;
          const scrollToPos = castTl.scrollTrigger.start + targetProgress * totalScroll;
          window.scrollTo({
            top: scrollToPos,
            behavior: "smooth"
          });
        });
      });
      if (castLineFill) {
        castTl.to(
          castLineFill,
          {
            height: "100%",
            ease: "none",
            duration: 1
          },
          0
        );
      }

      // Mask Reveals (Top-to-Bottom height expansion for each slide)

      // Slide 1 - Zendaya
      castTl.to(
        ".cast-img-wrapper.slide-1",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.02
      );

      // Slide 2 - Jacob Batalon
      castTl.to(
        ".cast-img-wrapper.slide-2",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.27
      );

      // Slide 3 - Benedict Cumberbatch
      castTl.to(
        ".cast-img-wrapper.slide-3",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.52
      );

      // Slide 4 - Willem Dafoe
      castTl.to(
        ".cast-img-wrapper.slide-4",
        {
          height: "100%",
          ease: "power2.inOut",
          duration: 0.23
        },
        0.77
      );

      // Picker Items Click Navigation
      castPickerItems.forEach((item, index) => {
        item.addEventListener("click", () => {

          if (!castTl.scrollTrigger) return;

          const totalScroll =
            castTl.scrollTrigger.end -
            castTl.scrollTrigger.start;

          const targetProgress = index / 4;

          const scrollToPos =
            castTl.scrollTrigger.start +
            targetProgress * totalScroll;

          window.scrollTo({
            top: scrollToPos,
            behavior: "smooth"
          });

        });
      });
    }
  }

  // Inicializa o posicionamento do Spider
  initSpiderPositioning();

  // Recalcula as posições ao redimensionar
  window.addEventListener("resize", () => {
    initSpiderPositioning();
    ScrollTrigger.refresh();
  });

});
