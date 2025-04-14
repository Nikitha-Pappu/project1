const { model, Schema } = require("mongoose");

const classSchema = new Schema({
    teacherID: {
        type: Schema.Types.ObjectId,
        ref: "auth", // changed to String as we're generating it
        required: true
    },
    classDetails: [
        {
            students: [
                {
                    studentID: {
                        type: Schema.Types.ObjectId,
                        ref: "auth", // changed to String as we're generating it
                        required: true
                    },
                }
            ]
        }
    ]
}, {
    timestamps: true
});


module.exports = model('class', classSchema);
