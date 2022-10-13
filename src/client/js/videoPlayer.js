const videoContainer = document.getElementById("videoContainer");

const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playBtn_i = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteBtn_i = muteBtn.querySelector("i");
const volumeRange = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const timelineRange = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenBtn_i = fullScreenBtn.querySelector("i");
const videoControls = document.getElementById("videoControls");
const videoDetailsDate = document.getElementById("video-details_date");

const videoUploadDate = new Date(videoDetailsDate.innerText);
const uploadYear = videoUploadDate.getFullYear();
const uploadMonth = videoUploadDate.getMonth() + 1;
const uploadDate = videoUploadDate.getDate();
const uploadDayIndex = videoUploadDate.getDay();
const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
const uploadDay = dayOfWeek[uploadDayIndex];

videoDetailsDate.innerText = `${uploadYear}년 ${uploadMonth}월 ${uploadDate}일 ${uploadDay}요일`;

let controlsTimeout = null;
let controlsMovementTimeout = null;

let volumeValue = 0.5;
video.volume = volumeValue;

const handlePlay = (e) => {
    if(video.paused){
        video.play();
    } else {
        video.pause();
    }
    playBtn_i.className = video.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
};

const handleMute = (e) => {
    if(video.muted){
        video.muted = false;
    } else {
        video.muted = true;
    }
    muteBtn_i.className = video.muted ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    volumeRange.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (event) => {
    const { 
        target: { value } 
    } = event;

    if(value == 0){
        video.muted = true;
        muteBtn_i.className = "fa-solid fa-volume-high";
    } else {
        video.muted = false;
        muteBtn_i.className  = "fa-solid fa-volume-xmark";
    }

    volumeValue = value;
    video.volume = value;
};
const formatTime = (seconds) => new Date(seconds * 1000).toISOString().substring(14, 19);

const handleTimeUpdate = () => {
    const curTime = Math.floor(video.currentTime);
    currentTime.innerText = formatTime(curTime);
    timelineRange.value = curTime;
};

const handleLoadedMetaData = () => {
    const durTime = Math.floor(video.duration);
    totalTime.innerText = formatTime(durTime);
    timelineRange.max = durTime;
};
const handleTimelineChange = (event) => {
    const { 
        target: { value } 
    } = event;
    video.currentTime = value;
};

const handleFullScreenClick = () => {
    const fullscreen = document.fullscreenElement;
    if(fullscreen){
    document.exitFullscreen();
    fullScreenBtn_i.className = "fa-solid fa-expand";
    } else {
    videoContainer.requestFullscreen();
    fullScreenBtn_i.className = "fa-solid fa-compress";    
    }
};

const hideVideoControls = () => {
    videoControls.classList.remove("showing");
    videoControls.classList.add("hiding");
};

const showVideoControls = () => {
    videoControls.classList.remove("hiding");
    videoControls.classList.add("showing");
};

const handleVideoMouseMove = () => {
    if(controlsTimeout){
        clearTimeout(controlsTimeout);
        controlsTimeout = null;
    }
    if(controlsMovementTimeout){
        clearTimeout(controlsMovementTimeout);
        controlsMovementTimeout = null;
    }
    showVideoControls()
    controlsMovementTimeout = setTimeout(hideVideoControls, 3000);
}

const handleVideoMouseLeave = () => {
    controlsTimeout = setTimeout(hideVideoControls, 3000);
};

const handleKeyDown = (event) => {
   
   const keyCode = event.keyCode;
   if(keyCode === 32){
    handlePlay();
   }
};
const handleVideoEnded = () => {
    const { id } = videoContainer.dataset;
    fetch(`/api/videos/${id}/view`, {
        method:"POST",
    });
};

playBtn.addEventListener("click", handlePlay);
muteBtn.addEventListener("click", handleMute);
volumeRange.addEventListener("input", handleVolumeChange);
video.addEventListener("loadedmetadata", handleLoadedMetaData);
video.addEventListener("timeupdate", handleTimeUpdate);
video.addEventListener("ended", handleVideoEnded);
videoContainer.addEventListener("mouseleave", handleVideoMouseLeave);
videoContainer.addEventListener("mousemove", handleVideoMouseMove);
timelineRange.addEventListener("input", handleTimelineChange);
fullScreenBtn.addEventListener("click", handleFullScreenClick);
document.addEventListener("keydown", handleKeyDown);

