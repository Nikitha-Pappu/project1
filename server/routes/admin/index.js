const { Router } = require("express");
const adminController = require("../../controllers/admin");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // or diskStorage

const router = Router();

// api/admin/profile
router.use("/profile", adminController.profile);
router.get("/user", adminController.fetchUser);
router.post("/class", adminController.addClass);
router.post("/user", upload.any(), adminController.addUser);
router.get("/class", adminController.fetchClass);
router.post("/attendance", upload.any(), adminController.attendenceCapture);


module.exports = router;
