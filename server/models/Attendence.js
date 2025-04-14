const { model, Schema } = require("mongoose");

const attendenceSchema = new Schema({
    classID: {
        type: Schema.Types.ObjectId,
        ref: "class", // changed to String as we're generating it
        required: true
    },
    attendence: [
        {
            date: {
                type: Date,
                default: Date.now()
            },
            students: [
                {
                    studentID: {
                        type: Schema.Types.ObjectId,
                        ref: "auth", // changed to String as we're generating it
                        required: true
                    },
                    status: {
                        type: Boolean,
                        defalut: false
                    }
                }
            ],

        }
    ]
}, {
    timestamps: true
});


module.exports = model('attendence', attendenceSchema);
