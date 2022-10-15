import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    socialOnly: { type: Boolean, default: false},
    avatarUrl: { type: String },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    name: { type: String, required: false },
    location: String,
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment"}],
});

userSchema.pre("save", async function(){
    if (this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 5);
    }
});

const User = mongoose.model("User", userSchema);

//Added Some Statics If Needed
export default User;