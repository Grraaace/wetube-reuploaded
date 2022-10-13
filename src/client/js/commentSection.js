const form = document.getElementById("commentForm");
const videoContainer = document.getElementById("videoContainer");
const videoComments = document.getElementById("video__comments");
const username = videoContainer.dataset.username;
const avatarUrl = videoContainer.dataset.avatarurl;
const deleteBtn = videoComments.querySelectorAll(".fa-trash");
const videoId = videoContainer.dataset.id;

const handleRealtimeDelete = async (event) => {
    const commentId = event.target.parentElement.dataset.commentid;
    
    const response = await fetch(`/api/videos/${videoId}/comment/delete`, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json",
        },
        body: JSON.stringify({
            commentId,
        }),
    });

    if (response.status === 200){
        const commentToDelete = event.target.parentElement.parentElement.parentElement;
        commentToDelete.style.display = "none";    
    };
};

const addComment = (text, commentId) => {
    const time = "방금전";
    const divColumn1 = document.createElement("div");
    divColumn1.classList.add("video__comment-column");
    const divColumn2 = document.createElement("div");
    divColumn2.classList.add("video__comment-column");
    const divComment = document.createElement("div");
    divComment.classList.add("video__comment");
    const divCommentData = document.createElement("div");
    divCommentData.classList.add("video__comment-data");
    divCommentData.setAttribute("data-commentId", commentId);
    const div = document.createElement("div");
    const spanAuthor = document.createElement("span");
    spanAuthor.classList.add("video__comment-author");
    spanAuthor.innerText = username;
    const spanDate = document.createElement("span");
    spanDate.classList.add("video__comment-date");
    spanDate.innerText = time;
    const spanDelete = document.createElement("span");
    spanDelete.classList.add("fa-solid","fa-trash");
    const span = document.createElement("span");
    span.innerText = text;

    if(!username) {
        const spanSmile = document.createElement("span");
        spanSmile.innerText = "😀";
        divColumn1.appendChild(spanSmile);
    } else {
        const imageAvatar = document.createElement("img");
        if(avatarUrl[0]==="u"){
            imageAvatar.src = `/${avatarUrl}`;
        } else {
            imageAvatar.src = `${avatarUrl}`;
        }
        imageAvatar.crossOrigin="anonymous";
        divColumn1.appendChild(imageAvatar);
    }
    divCommentData.appendChild(spanAuthor);
    divCommentData.appendChild(spanDate);
    divCommentData.appendChild(spanDelete);
    div.appendChild(span);
    divColumn2.appendChild(divCommentData);
    divColumn2.appendChild(div);
    divComment.appendChild(divColumn1);
    divComment.appendChild(divColumn2);
    videoComments.prepend(divComment);

    spanDelete.addEventListener("click", handleRealtimeDelete);
};

const handleDelete = async (event) => {
    const commentData = event.target.parentElement;
    const commentColumn = commentData.parentElement;
    const videoComment = commentColumn.parentElement;
    const commentId = commentData.dataset.commentid;
    const response = await fetch(`/api/videos/${videoId}/comment/delete`, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json",       
        },
        body: JSON.stringify({
            commentId,
        }),
    });
    if(response.status === 200){
        videoComment.style.display = "none";
    }
};

const handleSubmit = async (event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const text = textarea.value;
    if(text.trim() === "") {
        return;
    }
    const response = await fetch(`/api/videos/${videoId}/comment`, {
        method:"POST",
        headers: {
            "Content-Type" : "application/json",
        },
        body: JSON.stringify({
            text,
        }),
    });
    const data = await response.json();
    const commentId = data.comment._id;
    textarea.value = "";

    if (response.status === 200) {
        addComment(text, commentId);
    }

};

if(form){
    form.addEventListener("submit", handleSubmit);
}

deleteBtn.forEach((element) => {
    element.addEventListener("click", handleDelete);
});




