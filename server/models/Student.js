const { model, Schema } = require("mongoose");

const studentSchema = new Schema({
    studentId: {
        type: String, // changed to String as we're generating it
        unique: true
    },
    assignedClasses: [{
        teacherID: {
            type: Schema.Types.ObjectId,
            ref: "auth", // changed to String as we're generating it
            required: true
        },
        classID:{
            type: Schema.Types.ObjectId,
            ref: "User", // changed to String as we're generating it
            required: true
        }
    }]
}, {
    timestamps: true
});


module.exports = model('student', studentSchema);
