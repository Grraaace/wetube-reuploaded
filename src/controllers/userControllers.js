import User from "../models/User";
import Video from "../models/Video";
import bcrypt from "bcrypt";
import fetch from "cross-fetch";
import { token } from "morgan";

export const getJoin = (req, res) => {
    return res.render("join", {pageTitle: "Join"});
};

export const postJoin = async(req, res) => {
    const { email, username, password, password2, name, location } = req.body;
    const pageTitle = "Join";
    if (password !== password2){
        return res.status(400).render("join", {
            pageTitle,
            errorMessage : "Password confirmation does not match."
        })
    }    
    const exists = await User.exists({ $or: [ {email}, {username} ]});
    if(exists){
        return res.status(400).render("join", {
            pageTitle,
            errorMessage: "This username/email is already taken.",
        });
    }
    try{
        await User.create({
            name, 
            username, 
            email, 
            password,
            location, 
        })
        req.flash("success", "Join Success")
        return res.redirect("/login");
    } catch(error){
        return res.status(400).render("join", {
            pageTitle: "Join",
            errorMessage: error._message,
        })
    }
};

export const getLogin = (req, res) => {
    return res.render("login", { pageTitle: "Login"});
};

export const postLogin = async (req, res) => {
    const { username, password } = req.body;
    const pageTitle = "Login";
    const user = await User.findOne({ username, socialOnly: false });
    if(!user){
        return res.status(400).render("login", {
            pageTitle,
            errorMessage: "An account with this username does not exist",
        })
    }

    const ok = await bcrypt.compare(password, user.password);
    if(!ok){
        return res.status(400).render("login", {
            pageTitle,
            errorMessage: "Wrong password",
        })
    };
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
    const baseUrl = "https://github.com/login/oauth/authorize";

    const config = {
        client_id : process.env.GH_CLIENT,
        allow_signup : false,
        scope: "read:user user:email",
    }
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code,
    };
   
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (await fetch(finalUrl,{
        method:"POST",
        headers:{
            Accept: "application/json",
        },
    })).json();
   
    if("access_token" in tokenRequest){
       const { access_token } = tokenRequest;
       const apiUrl = "https://api.github.com";
       const userData = await (
        await fetch(`${apiUrl}/user`, {
            headers: {
                Authorization: `token ${access_token}`,
            },
       })).json();
       const emailData = await (
        await fetch(`${apiUrl}/user/emails`, {
            headers: {
                Authorization: `token ${access_token}`,
            },
       })).json();
       const emailObj = emailData.find(
        email => email.primary == true && email.verified == true
        );
       if(!emailObj){
        //set notification
        return res.redirect("/login");
       }
       let user = await User.findOne({ email: emailObj.email});
       if (!user) {
        user = await User.create({
            avatarUrl: userData.avatar_url,
            name: userData.name, 
            username: userData.login, 
            email: emailObj.email, 
            password: "",
            socialOnly: true,
            location: userData.location,
            });  
        } 
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/");
    } else {
        return res.redirect("/login");
    };
};
export const logout = (req, res) => {
    req.session.destroy();
    return res.redirect("/");
};

export const getEdit = async (req, res) => {
    return res.render("edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
    const { 
        session: {
            user: { _id, avatarUrl }, 
        },
        body: {
            name, email, username, location
        },
        file,
    } = req;
    if(name !== req.session.user.name){
        const existsName = await User.exists({ name: name });
        if(existsName){
            return res.status(400).render("edit-profile",{
                pageTitle: "Edit Profile",
                errorMessage: "This name is already taken.",
            });
        };
    };
    if(email !== req.session.user.email){
        return res.status(400).render("edit-profile",{
            pageTitle: "Edit Profile",
            errorMessage: "Email can't be revised.",
            });
        };
    if(username !== req.session.user.username){
        const existsUsername = await User.exists({ username: username });
        if(existsUsername){
            return res.status(400).render("edit-profile",{
                pageTitle: "Edit Profile",
                errorMessage: "This username is already taken.",
            });
        };
    };
    const updatedUser = await User.findByIdAndUpdate( _id, {
        avatarUrl: file ? file.location : avatarUrl,
        email,
        username,
        name, 
        location, 
    }, 
    { new: true }
    );

    req.session.user = updatedUser;
    return res.redirect("/");
};

export const getChangePassword = (req, res) => {
    if (req.session.user.socialOnly === true) {
        req.flash("error", "Can't change password.");
        return res.redirect("/")
    }
    return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
    const {
        session: {
            user: { _id },
        },
        body: {
            oldPassword, newPassword, newPasswordCfm,
        },
    } = req;
    const user = await User.findById(_id);
    const ok = await bcrypt.compare(oldPassword, user.password);
    if(!ok){
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password",
            errorMessage: "The current password is not correct.",
        })
    };
    if(newPasswordCfm !== newPassword){
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password",
            errorMessage: "Password confirmation does not match.",
        })
    }
    
    user.password = newPassword;
    await user.save();
    req.flash("info", "Password updated");
    return res.redirect("/users/logout");
};

export const see =  async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate({
        path: "videos",
        populate: {
            path: "owner",
            model: "User",
        },
    });
    if(!user){
        return res.status(404).render("404", { 
            pageTitle: "User not found.",
        });
    };
    return res.render("users/profile", { 
        pageTitle: user.username,
        user,
     });
};

