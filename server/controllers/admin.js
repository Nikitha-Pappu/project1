const Auth = require("../models/Auth");
const authService = require("../services/auth");
const Class = require("../models/Class");
const axios = require('axios');

const profile = async (req, res, next) => {
  try {
    const user = req.body;
    console.log(user);

    await authService.signupUser(user);

    const data = await Auth.findOne({ userName: user.userName }).select(
      "name email"
    );

    return res.json(data);
  } catch (error) {
    next(error);
  }
};

const addUser = async (req, res, next) => {
  try {
    const user = req.body;
    const { front, right, left, top, bottom } = req.body.images;

    user.password = 'password@123';
    user.role = 'user';
    const data = await authService.signupUser(user);

    // Send the images to Flask
    await axios.post('http://localhost:5000/save-images', {
      aadhaarNumber: data._id,  // Unique identifier for folder or filename
      images: { front, right, left, top, bottom }
    });

    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const fetchUser = async (req, res, next) => {
  try {
    const data = await Auth.find().select("-password");
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

// Add a class (by teacher)
const addClass = async (req, res) => {
  console.log(req.body);
  try {
    const { studentIDs } = req.body; // expects an array of student IDs
    const teacherID = req.user.userId;  // fetched from auth middleware
    console.log(req.user);

    const newClass = await Class.create({
      teacherID: teacherID,
      classDetails: [
        {
          students: studentIDs.map(id => ({ studentID: id })) // fixed variable name and key
        }
      ]
    });

    res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    console.error("Add Class Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



const fetchClass = async (req, res, next) => {
  try {
    const classes = await Class.find()
      .populate("teacherID", "name email")
      .populate("classDetails.students.studentID", "name email");
    return res.json(classes);
  } catch (error) {
    next(error);
  }
}

const attendenceCapture = async (req, res, next) => {
  try {
    const x = req.body.images;
    const results = [];
    console.log(x.length);
    
    for (let i = 0; i < x.length; i++) {
      const flask = await axios.post('http://localhost:5000/compare', {
        file: x[i]
      });

      results.push(flask.data);
    }
    console.log("Flask Response:", results);

    return res.json({ results });
  } catch (error) {
    console.log("Error from Flask:", error?.response?.data || error.message);
    next(error);
  }
}

module.exports = { profile, addUser, fetchUser, addClass, fetchClass, attendenceCapture };