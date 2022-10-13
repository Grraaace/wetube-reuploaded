import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const actionBtn = document.getElementById("actionBtn");
const video = document.getElementById("preview");
const circleRecording = document.getElementById("circle-recording");
const resetBtn = document.getElementById("reset");

let stream;
let recorder;
let videoFile;

const files = {
    input: "recording.webm",
    output: "output.mp4",
    thumbnail: "thumbnail.jpg",
};

const downloadFile = (fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
}; 

const handleResetRecording = () => {
    resetBtn.classList.remove("showing");
    resetBtn.classList.add("hiding");
    actionBtn.innerText = "Start Recording";
    actionBtn.style.backgroundColor = "red";
    actionBtn.style.color = "white";
    actionBtn.removeEventListener("click", handleDownloadBtnClick);
    actionBtn.addEventListener("click", handleStartBtnClick);
    URL.revokeObjectURL(videoFile);
    init();

};

const handleDownloadBtnClick = async () => {

    actionBtn.removeEventListener("click", handleDownloadBtnClick);
    actionBtn.innerText = "Transcoding...";
    actionBtn.disabled = true;

    resetBtn.classList.add("hiding");
    resetBtn.classList.remove("showing");

    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
    //Webm -> mp4 transcoding
    ffmpeg.FS("writeFile", files.input , await fetchFile(videoFile));
    await ffmpeg.run (
        "-i", 
        files.input, 
        "-r", 
        "60", 
        files.output,
    );
    await ffmpeg.run (
        "-i", 
        files.input, 
        "-ss",
        "00:00:01", 
        "-frames:v", 
        "1", 
        files.thumbnail,
    );

    const mp4File = ffmpeg.FS("readFile", files.output);
    const thumbFile = ffmpeg.FS("readFile", files.thumbnail);

    const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
    const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });
    
    const mp4BlobUrl = URL.createObjectURL(mp4Blob);
    const thumbUrl = URL.createObjectURL(thumbBlob);
    
    downloadFile(mp4BlobUrl, "MyRecording.mp4");
    downloadFile(thumbUrl, "MyThumbnail.jpg");

    URL.revokeObjectURL(mp4BlobUrl);
    URL.revokeObjectURL(thumbUrl);
    URL.revokeObjectURL(videoFile);

    ffmpeg.FS("unlink", files.input);
    ffmpeg.FS("unlink", files.thumbnail);
    ffmpeg.FS("unlink", files.output);
    
    actionBtn.disabled = false;
    actionBtn.style.backgroundColor = "orange";
    actionBtn.innerText = "Record Again";
    actionBtn.addEventListener("click", handleStartBtnClick);

};

const handleStopBtnClick = () => {
    actionBtn.innerText = "Download Recording";
    actionBtn.style.backgroundColor = "green";
    actionBtn.style.color = "white";
    circleRecording.classList.remove("showing");
    circleRecording.classList.add("hiding");
    resetBtn.classList.remove("hiding");
    resetBtn.classList.add("showing");
    actionBtn.removeEventListener("click", handleStopBtnClick);
    actionBtn.addEventListener("click", handleDownloadBtnClick);
    recorder.stop();
};

const handleStartBtnClick = () => {
    actionBtn.innerText = "Stop Recording";
    actionBtn.style.backgroundColor = "white";
    actionBtn.style.color = "red";
    circleRecording.classList.remove("hiding");
    circleRecording.classList.add("showing");
    actionBtn.removeEventListener("click", handleStartBtnClick);
    actionBtn.addEventListener("click", handleStopBtnClick);
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
        videoFile = URL.createObjectURL(event.data);
        video.srcObject = null;
        video.src = videoFile;
        video.loop = true;
        video.play();
    }; 
    recorder.start();
};

const init = async () => {
    const constraints = { 
        audio: false, 
        video: true, 
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.play();
};

init();

actionBtn.addEventListener("click", handleStartBtnClick);
resetBtn.addEventListener("click", handleResetRecording);


// **If users press the button, they can have access to their camera.
// Then they can start to record
// **Video duration limit will be about 5 seconds.
// **When recording is done, they can see the preview.
// **If users like the preview, they can confirm the upload of this video.
// **If users don't like the preview, they can go back to video recording stage. 