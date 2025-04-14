import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from "@mui/material";
import useAxiosPrivate from "@hooks/useAxiosPrivate";
import { useEffect, useState, useRef } from "react";

const cellStyle = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  textAlign: "left"
};

const styles = {
  appBar: {
    backgroundColor: "#1976d2",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  navButton: {
    color: "white",
    textDecoration: "none",
    marginLeft: "10px",
    fontSize: "16px",
  },
  main: {
    flexGrow: 1,
    minHeight: "calc(100vh - 64px)",
    paddingTop: "80px",
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "20px",
  },
};

const Dashboard = () => {
  const api = useAxiosPrivate();
  const [info, setInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    userName: "",
    email: "",
    role: "ADMIN",
    active: true,
    images: {
      front: null,
      left: null,
      right: null,
      top: null,
      bottom: null,
    }
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const fetchUser = () => {
    setLoading(true);
    api
      .get("/api/admin/user")
      .then(({ data }) => {
        console.log("Fetched Users:", data);
        setInfo(data);
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        setInfo([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "active" ? value === "true" : value,
    }));
  };

  const handleFileChange = (e, imageType) => {
    const file = e.target.files[0];
    setForm(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [imageType]: file
      }
    }));
  };

  const handleCaptureImage = (imageType) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/png");
      setForm((prev) => ({
        ...prev,
        images: {
          ...prev.images,
          [imageType]: imageDataUrl, // Store base64 image
        }
      }));
    }
  };

  const startCamera = () => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setIsCameraOpen(true);
        })
        .catch((error) => {
          console.error("Camera access error:", error);
        });
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    const tracks = stream?.getTracks();
    tracks?.forEach((track) => track.stop());
    setIsCameraOpen(false);
  };

  const handleAddUser = async () => {
    try {
      const formData = new FormData();
      formData.append("userName", form.userName);
      formData.append("email", form.email);
      formData.append("role", form.role);
      formData.append("active", form.active);

      // Append images as base64
      Object.entries(form.images).forEach(([key, file]) => {
        if (file) formData.append(`images[${key}]`, file);
      });

      const res = await api.post("/api/admin/user", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 200 || res.status === 201) {
        setOpen(false);
        fetchUser();
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleDialogOpen = () => {
    setOpen(true);
    startCamera(); // Start camera when dialog opens
  };

  const handleDialogClose = () => {
    setOpen(false);
    stopCamera(); // Stop camera when dialog is closed
  };

  return (
    <Container>
      <div style={styles.appBar}>
        <div style={styles.toolbar}>
          <h6 style={{ margin: 0, color: "white" }}></h6>
          <div>
            <a href="/admin/dashboard" style={styles.navButton}>
              Home
            </a>
            <a href="/admin/class" style={styles.navButton}>
              Classes
            </a>
            {/* <a href="/admin/attendance" style={styles.navButton}>
              Attendance
            </a> */}
          </div>
        </div>
      </div>
      <Typography variant="h4" gutterBottom>
        Teacher's Dashboard
      </Typography>

      <Button variant="contained" color="primary" onClick={handleDialogOpen}>
        Add New User
      </Button>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : info.length ? (
        <Paper elevation={3} sx={{ padding: 3, marginTop: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            All Users
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={cellStyle}>#</th>
                  <th style={cellStyle}>Username</th>
                  <th style={cellStyle}>Email</th>
                  <th style={cellStyle}>Role</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Created</th>
                  <th style={cellStyle}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {info.map((user, index) => (
                  <tr key={user._id}>
                    <td style={cellStyle}>{index + 1}</td>
                    <td style={cellStyle}>{user.userName}</td>
                    <td style={cellStyle}>{user.email}</td>
                    <td style={cellStyle}>
                      {user.role === "user" ? "Student" : "Teacher"}
                    </td>
                    <td style={cellStyle}>{user.active ? "Active" : "Inactive"}</td>
                    <td style={cellStyle}>{new Date(user.createdAt).toLocaleString()}</td>
                    <td style={cellStyle}>{new Date(user.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
      ) : (
        <Typography color="error" mt={3}>
          No user data available.
        </Typography>
      )}

      {/* Add User Modal */}
      <Dialog open={open} onClose={handleDialogClose} fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Username"
            name="userName"
            value={form.userName}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleInputChange}
            fullWidth
          />
          <Typography variant="subtitle1">Upload Images</Typography>
          <Button variant="outlined" onClick={startCamera}>Open Camera</Button>

          {/* Video stream display */}
          {isCameraOpen && (
            <>
              <video ref={videoRef} autoPlay style={{ width: "100%", height: "auto" }} />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </>
          )}

          {/* Capture image buttons */}
          <Button variant="contained" onClick={() => handleCaptureImage("front")}>Capture Front</Button>
          <Button variant="contained" onClick={() => handleCaptureImage("left")}>Capture Left</Button>
          <Button variant="contained" onClick={() => handleCaptureImage("right")}>Capture Right</Button>
          <Button variant="contained" onClick={() => handleCaptureImage("top")}>Capture Top</Button>
          <Button variant="contained" onClick={() => handleCaptureImage("bottom")}>Capture Bottom</Button>

          {/* Display captured images */}
          <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
            <Box>
              <Typography variant="subtitle2">Front</Typography>
              {form.images.front && <img src={form.images.front} alt="Front" style={{ width: "100px", height: "auto" }} />}
            </Box>
            <Box>
              <Typography variant="subtitle2">Left</Typography>
              {form.images.left && <img src={form.images.left} alt="Left" style={{ width: "100px", height: "auto" }} />}
            </Box>
            <Box>
              <Typography variant="subtitle2">Right</Typography>
              {form.images.right && <img src={form.images.right} alt="Right" style={{ width: "100px", height: "auto" }} />}
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
            <Box>
              <Typography variant="subtitle2">Top</Typography>
              {form.images.top && <img src={form.images.top} alt="Top" style={{ width: "100px", height: "auto" }} />}
            </Box>
            <Box>
              <Typography variant="subtitle2">Bottom</Typography>
              {form.images.bottom && <img src={form.images.bottom} alt="Bottom" style={{ width: "100px", height: "auto" }} />}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleAddUser}>
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
