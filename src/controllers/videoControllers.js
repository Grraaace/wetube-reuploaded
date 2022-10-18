import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";
import { response } from "express";

export const home = async (req, res) => {
    const videos = await Video.find({}).populate("owner").sort({ createdAt: "desc"});
    return res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id).populate("owner").populate({
        path: "comments", 
        populate: {
            path: "owner", 
            model: "User",
        },
    });
    
    if(!video){
        return res.status(404).render("404", { 
            pageTitle: "Video Not Found."
        });
    }
    return res.render("watch", { 
        pageTitle : video.title, 
        video,
    });
};

export const getEdit = async (req, res) => {
    const { id } = req.params;
    const { 
        user : {_id}
    } = req.session;
    const video = await Video.findById(id);
    if(!video){
        return res.status(404).render("404", {
            pageTitle: "Video Not Found."
        });
    }
    if(String(video.owner) !== String(_id)){
        req.flash("error", "Not authorized");
        return res.status(403).redirect("/");
    }
    return res.render("edit-video", { 
        pageTitle : `Edit: ${video.title}`,
        video,
    });
};

export const postEdit = async (req, res) => {
    const { id } = req.params;
    const { 
        user : {_id}
    } = req.session;
    const { title, description, hashtags } = req.body;
    const video = await Video.exists({_id: id });
    if(!video){
        return res.status(404).render("404", { pageTitle: "Video Not Found."});
    }
    if(String(video.owner) !== String(_id)){
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndUpdate(id, {
        title,
        description,
        hashtags: Video.formatHashtags(hashtags),
    })
    req.flash("success", "Changes saved");
    return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
    return res.render("upload", { pageTitle: "Upload video" });
};

export const postUpload = async (req, res) => {
    const { 
        session: { user: _id },
        body: { title, description, hashtags },
        files: { 
            video: [ { location: videoUrl } ], 
            thumbnail: [ { location: thumbnailUrl} ],
        }, 
    } = req;
    try{
        const newVideo = await Video.create({
            title,
            videoUrl,
            thumbnailUrl,
            description,
            owner: _id,
            hashtags: Video.formatHashtags(hashtags),
            });
        const user = await User.findById(_id);
        user.videos.push(newVideo._id);
        user.save();
        return res.redirect("/");
        } catch(error){
            return res.status(400).render("upload", { 
                pageTitle: "Upload Video",
                errorMessage: error._message,
            });
        };
};

export const deleteVideo = async (req, res) => {
    const { id } = req.params;
    const { 
        user: {_id},
    } = req.session;
    const video = await Video.findById(id);
    if(String(video.owner) !== String(_id)){
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndDelete(id);
    return res.redirect("/");
};

export const search = async(req, res) => {
    const { keyword } = req.query;
    let videos = [];
    if(keyword){
        videos = await Video.find({
            title: {
                $regex: new RegExp(keyword, "i"),
            },
        }).populate("owner");    
    }
    return res.render("search", { pageTitle: "Search", videos});
};

export const registerView = async (req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id);
    if(!video){
        return res.sendStatus(404);
    }
    video.meta.views = video.meta.views + 1;
    await video.save();
    return res.sendStatus(200);
};

export const createComment = async (req, res) => {
    const {
        session: {user},
        body: {text},
        params: {id},
    } = req;

    const video = await Video.findById(id);
    if (!video) {
        return res.sendStatus(404);
    }

    const userWritingComment = await User.findById(user._id);
    
    const newComment = await Comment.create({
        text,
        owner: user._id,
        video: id,
    });
    
    video.comments.push(newComment._id);
    video.save();
    userWritingComment.comments.push(newComment._id);
    userWritingComment.save();

    return res.json({ comment: newComment })
};

export const deleteComment = async (req, res) => {
    const commentId = req.body.commentId;
    const commentOwnerId = req.session.user._id;
    const videoId = req.params.id;
    
    const video = await Video.findById(videoId);
    if (!video) {
        return res.sendStatus(404);
    }

    await Comment.findByIdAndDelete(commentId);
    await User.findByIdAndUpdate(commentOwnerId, {
        $pull: { comments: commentId }
    });
    await Video.findByIdAndUpdate(videoId, {
        $pull: { comments: commentId }
    });

    return res.sendStatus(200);

};

