const mediaFrames = document.querySelectorAll(".media-frame");

mediaFrames.forEach((frame) => {
  const media = frame.querySelector("img, video");

  if (!media) {
    return;
  }

  const markLoaded = () => {
    frame.classList.add("is-loaded");
    frame.classList.remove("is-missing");
  };

  const markMissing = () => {
    frame.classList.add("is-missing");
    frame.classList.remove("is-loaded");
  };

  media.addEventListener("load", markLoaded);
  media.addEventListener("loadeddata", markLoaded);
  media.addEventListener("canplay", markLoaded);
  media.addEventListener("error", markMissing);

  if (media.tagName === "IMG" && media.complete) {
    if (media.naturalWidth > 0) {
      markLoaded();
    } else {
      markMissing();
    }
  }

  if (media.tagName === "VIDEO" && media.readyState >= 2) {
    markLoaded();
  }
});

document.querySelector("[data-email-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextPage = event.currentTarget.dataset.nextPage || "perfiles.html";
  window.location.href = nextPage;
});

const selectedProfileKey = "netflixSelectedProfile";

const getStoredProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(selectedProfileKey));
  } catch {
    return null;
  }
};

const setStoredProfile = (profile) => {
  try {
    localStorage.setItem(selectedProfileKey, JSON.stringify(profile));
  } catch {
    // La navegación sigue funcionando si el navegador bloquea localStorage.
  }
};

const applySelectedProfile = () => {
  const profile = getStoredProfile() || {
    name: "Bi y Bu",
    image: "assets/perfiles/bi.jpeg",
    position: "48% 36%",
  };

  document.querySelectorAll("[data-selected-profile-image]").forEach((image) => {
    const frame = image.closest(".media-frame");

    image.src = profile.image;
    image.alt = image.alt ? `Perfil ${profile.name}` : "";
    image.style.objectPosition = profile.position || "center center";

    frame?.classList.remove("is-missing");

    if (image.complete && image.naturalWidth > 0) {
      frame?.classList.add("is-loaded");
    }
  });
};

document.querySelectorAll("[data-next-page]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    if (trigger.dataset.profileImage) {
      setStoredProfile({
        name: trigger.dataset.profileName || trigger.querySelector(".profile-card__name")?.textContent.trim() || "Perfil",
        image: trigger.dataset.profileImage,
        position: trigger.dataset.profilePosition || "center center",
      });
    }

    window.location.href = trigger.dataset.nextPage;
  });
});

applySelectedProfile();

document.querySelectorAll("[data-redirect-page]").forEach((trigger) => {
  const redirect = () => {
    window.location.href = trigger.dataset.redirectPage;
  };

  trigger.addEventListener("click", redirect);
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    redirect();
  });
});

document.querySelectorAll(".content-rail").forEach((rail) => {
  const track = rail.querySelector(".rail-track");
  const previousButton = rail.querySelector("[data-rail-prev]");
  const nextButton = rail.querySelector("[data-rail-next]");

  if (!track) {
    return;
  }

  const updateRailState = () => {
    const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
    const isAtStart = track.scrollLeft <= 2;
    const isAtEnd = track.scrollLeft >= maxScroll - 2;

    rail.classList.toggle("is-at-start", isAtStart);
    rail.classList.toggle("is-at-end", isAtEnd);

    if (previousButton) {
      previousButton.disabled = isAtStart;
    }

    if (nextButton) {
      nextButton.disabled = isAtEnd;
    }
  };

  rail.querySelectorAll("[data-rail-prev], [data-rail-next]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.matches("[data-rail-prev]") ? -1 : 1;
      const distance = Math.max(track.clientWidth * 0.86, 240);

      track.scrollBy({
        left: direction * distance,
        behavior: "smooth",
      });
    });
  });

  track.addEventListener("scroll", updateRailState, { passive: true });
  window.addEventListener("resize", updateRailState);
  updateRailState();
});

const hoverPreview = document.querySelector("[data-hover-preview]");

if (hoverPreview && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const previewImage = hoverPreview.querySelector("[data-hover-preview-image]");
  const previewTitle = hoverPreview.querySelector("[data-hover-preview-title]");
  const previewMeta = hoverPreview.querySelector("[data-hover-preview-meta]");
  const previewActions = hoverPreview.querySelectorAll("[data-hover-preview-play]");
  const previewCards = document.querySelectorAll(".browse-screen .content-rail .media-card");
  let activePreviewCard = null;
  let hoverPreviewTimer = null;
  let hidePreviewTimer = null;

  const getPreviewTitle = (card) => {
    return (
      card.dataset.previewTitle ||
      card.querySelector(".card-fallback")?.dataset.title ||
      card.querySelector(".card-image img")?.alt ||
      "Momento destacado"
    );
  };

  const getPreviewMeta = (card) => {
    if (card.classList.contains("media-card--event")) {
      return "Próximamente";
    }

    if (card.closest(".content-rail--continue")) {
      return "Continuar viendo";
    }

    return "Momentos favoritos";
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const positionHoverPreview = (card) => {
    const rect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = clamp(rect.width * 1.36, 300, Math.min(390, viewportWidth - 32));
    const estimatedHeight = width * 0.5625 + 142;
    const left = clamp(rect.left + rect.width / 2 - width / 2, 16, viewportWidth - width - 16);
    const top = clamp(rect.top - 62, 72, viewportHeight - estimatedHeight - 16);

    hoverPreview.style.width = `${width}px`;
    hoverPreview.style.left = `${left}px`;
    hoverPreview.style.top = `${top}px`;
  };

  const hideHoverPreview = () => {
    clearTimeout(hoverPreviewTimer);
    hoverPreview.classList.remove("is-visible");
    hoverPreview.setAttribute("aria-hidden", "true");
    activePreviewCard = null;

    window.setTimeout(() => {
      if (!hoverPreview.classList.contains("is-visible")) {
        hoverPreview.hidden = true;
      }
    }, 140);
  };

  const scheduleHideHoverPreview = () => {
    clearTimeout(hidePreviewTimer);
    hidePreviewTimer = window.setTimeout(hideHoverPreview, 150);
  };

  const showHoverPreview = (card) => {
    const image = card.querySelector(".card-image img");

    if (!image) {
      return;
    }

    clearTimeout(hidePreviewTimer);
    activePreviewCard = card;
    hoverPreview.hidden = false;
    hoverPreview.setAttribute("aria-hidden", "false");
    previewImage.src = image.currentSrc || image.src;
    previewImage.alt = image.alt ? `Vista previa de ${image.alt}` : "";
    previewTitle.textContent = getPreviewTitle(card);
    previewMeta.textContent = getPreviewMeta(card);
    positionHoverPreview(card);

    requestAnimationFrame(() => {
      hoverPreview.classList.add("is-visible");
      positionHoverPreview(card);
    });
  };

  previewCards.forEach((card) => {
    const scheduleShow = () => {
      clearTimeout(hoverPreviewTimer);
      hoverPreviewTimer = window.setTimeout(() => showHoverPreview(card), 320);
    };

    card.addEventListener("pointerenter", scheduleShow);
    card.addEventListener("mouseenter", scheduleShow);
    card.addEventListener("pointerleave", scheduleHideHoverPreview);
    card.addEventListener("mouseleave", scheduleHideHoverPreview);
    card.addEventListener("focusin", () => showHoverPreview(card));
    card.addEventListener("focusout", scheduleHideHoverPreview);
  });

  hoverPreview.addEventListener("pointerenter", () => {
    clearTimeout(hidePreviewTimer);
  });

  hoverPreview.addEventListener("mouseenter", () => {
    clearTimeout(hidePreviewTimer);
  });

  hoverPreview.addEventListener("pointerleave", scheduleHideHoverPreview);
  hoverPreview.addEventListener("mouseleave", scheduleHideHoverPreview);

  previewActions.forEach((button) => {
    button.addEventListener("click", () => {
      const card = activePreviewCard;
      hideHoverPreview();
      card?.click();
    });
  });

  window.addEventListener("scroll", () => {
    if (activePreviewCard && hoverPreview.classList.contains("is-visible")) {
      positionHoverPreview(activePreviewCard);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (activePreviewCard && hoverPreview.classList.contains("is-visible")) {
      positionHoverPreview(activePreviewCard);
    }
  });
}

const openModal = (modal) => {
  modal.hidden = false;
  document.body.classList.add("modal-open");
  playModalVideo(modal);

  requestAnimationFrame(() => {
    modal.classList.add("is-open");
    modal.querySelector("[data-modal-close]")?.focus();
  });
};

const closeModal = (modal) => {
  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  pauseModalVideo(modal);

  window.setTimeout(() => {
    modal.hidden = true;
  }, 180);
};

const updateSoundButton = (button, video) => {
  if (!button || !video) {
    return;
  }

  const isMuted = video.muted || video.volume === 0;
  button.classList.toggle("is-unmuted", !isMuted);
  button.setAttribute("aria-label", isMuted ? "Activar sonido" : "Silenciar");
};

const playModalVideo = (modal) => {
  const video = modal.querySelector(".modal-video");
  const soundButton = modal.querySelector("[data-video-toggle]");

  if (!video) {
    return;
  }

  video.currentTime = 0;
  video.muted = false;
  video.volume = 1;
  updateSoundButton(soundButton, video);

  const playback = video.play();

  if (playback && typeof playback.catch === "function") {
    playback.catch(() => {
      video.muted = true;
      video.volume = 0;
      updateSoundButton(soundButton, video);
      video.play().catch(() => {});
    });
  }
};

const pauseModalVideo = (modal) => {
  modal.querySelectorAll(".modal-video").forEach((video) => {
    video.pause();
    video.currentTime = 0;
  });
};

document.querySelectorAll("[data-modal-open]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const modal = document.getElementById(trigger.dataset.modalOpen);

    if (modal) {
      openModal(modal);
    }
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    trigger.click();
  });
});

document.querySelectorAll(".detail-overlay").forEach((modal) => {
  modal.querySelectorAll("[data-modal-close]").forEach((trigger) => {
    trigger.addEventListener("click", () => closeModal(modal));
  });
});

document.querySelectorAll("[data-video-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const video = document.querySelector(button.dataset.videoToggle);

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    video.volume = video.muted ? 0 : 1;
    updateSoundButton(button, video);

    if (video.paused) {
      video.play().catch(() => {});
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  document.querySelectorAll(".detail-overlay.is-open").forEach((modal) => {
    closeModal(modal);
  });
});

document.querySelectorAll(".hero-video").forEach((video) => {
  const playVideo = () => {
    video.muted = true;
    video.play().catch(() => {
      document.addEventListener("pointerdown", playVideo, { once: true });
      document.addEventListener("keydown", playVideo, { once: true });
    });
  };

  video.addEventListener("canplay", playVideo, { once: true });
  playVideo();
});

const animationScreen = document.querySelector("[data-netflix-animation]");

if (animationScreen) {
  document.body.style.setProperty("--primary-colour", "#E50914");
  document.body.style.setProperty("--shadow-colour", "#000000");
  document.body.style.setProperty("--logo-animation-bg", "#000000");

  const logo = animationScreen.querySelector(".netflix-animation-logo");
  const introAudio = animationScreen.querySelector(".netflix-intro-audio");
  const invitationVideo = animationScreen.querySelector(".invitation-video");
  const invitationStage = animationScreen.querySelector(".invitation-stage");
  const videoStage = animationScreen.querySelector(".video-stage");
  const selectedVideoPlayer = animationScreen.querySelector(".selected-video-player");
  const whatsappPhone = animationScreen.dataset.whatsappPhone?.replace(/\D/g, "") || "";
  const animationParams = new URLSearchParams(window.location.search);
  const selectedVideoKey = animationParams.get("video") || "";
  const similarVideos = {
    tiktok1: {
      src: "assets/videos/tiktok1.mp4",
      poster: "assets/videos/tiktok1-foto.png",
    },
    tiktok2: {
      src: "assets/videos/tiktok2.mp4",
      poster: "assets/videos/tiktok2-foto.png",
    },
    tiktok3: {
      src: "assets/videos/tiktok3.mp4",
      poster: "assets/videos/tiktok3-foto.png",
    },
  };
  const selectedVideo = similarVideos[selectedVideoKey];
  let introAudioStarted = false;

  if (selectedVideo && selectedVideoPlayer) {
    animationScreen.classList.add("is-video-mode");
    invitationVideo?.pause();
    invitationVideo?.removeAttribute("autoplay");
    selectedVideoPlayer.src = selectedVideo.src;
    selectedVideoPlayer.poster = selectedVideo.poster;
    selectedVideoPlayer.load();
  }

  const playIntroAudio = () => {
    if (!introAudio || introAudioStarted || animationScreen.classList.contains("is-logo-finished")) {
      return;
    }

    introAudioStarted = true;
    introAudio.volume = 1;
    introAudio.currentTime = 0;

    const playback = introAudio.play();

    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {
        introAudioStarted = false;
        document.addEventListener("pointerdown", playIntroAudio, { once: true });
        document.addEventListener("keydown", playIntroAudio, { once: true });
      });
    }
  };

  const stopIntroAudio = () => {
    if (!introAudio) {
      return;
    }

    introAudio.pause();
    introAudio.currentTime = 0;
  };

  const playInvitationVideo = () => {
    if (!invitationVideo) {
      return;
    }

    invitationVideo.muted = true;
    invitationVideo.play().catch(() => {
      document.addEventListener("pointerdown", playInvitationVideo, { once: true });
      document.addEventListener("keydown", playInvitationVideo, { once: true });
    });
  };

  const showSelectedVideo = () => {
    if (!selectedVideo || !selectedVideoPlayer) {
      return false;
    }

    invitationStage?.setAttribute("aria-hidden", "true");
    videoStage?.removeAttribute("aria-hidden");
    animationScreen.classList.add("is-video-visible");
    selectedVideoPlayer.pause();

    try {
      selectedVideoPlayer.currentTime = 0;
    } catch {
      selectedVideoPlayer.addEventListener(
        "loadedmetadata",
        () => {
          selectedVideoPlayer.currentTime = 0;
          selectedVideoPlayer.pause();
        },
        { once: true }
      );
    }

    return true;
  };

  const showInvitation = () => {
    if (animationScreen.classList.contains("is-logo-finished")) {
      return;
    }

    animationScreen.classList.add("is-logo-finished");
    stopIntroAudio();

    window.setTimeout(() => {
      if (showSelectedVideo()) {
        return;
      }

      invitationStage?.removeAttribute("aria-hidden");
      animationScreen.classList.add("is-question-visible");
      playInvitationVideo();
    }, 1150);
  };

  window.setTimeout(playIntroAudio, 1000);

  logo?.addEventListener("animationend", (event) => {
    if (event.target === logo) {
      showInvitation();
    }
  });
  window.setTimeout(() => {
    if (!animationScreen.classList.contains("is-logo-finished")) {
      showInvitation();
    }
  }, 7200);

  animationScreen.querySelectorAll("[data-whatsapp-response]").forEach((button) => {
    button.addEventListener("click", () => {
      const response = button.textContent.trim() || button.dataset.whatsappResponse;
      const message = `Respuesta a tu invitación: ${response}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = whatsappPhone
        ? `https://wa.me/${whatsappPhone}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;

      window.location.href = whatsappUrl;
    });
  });
}
