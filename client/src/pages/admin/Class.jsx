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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
} from "@mui/material";
import useAxiosPrivate from "@hooks/useAxiosPrivate";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

const cellStyle = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  textAlign: "left",
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

const Class = () => {
  const api = useAxiosPrivate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [teacherID, setTeacherID] = useState("");
  const [studentIDs, setStudentIDs] = useState([]);
  const [users, setUsers] = useState([]);

  const [attendanceClass, setAttendanceClass] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);

  const webcamRef = useRef(null);
  const captureInterval = useRef(null);

  // Webcam device selection
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const fetchClasses = () => {
    setLoading(true);
    api.get("/api/admin/class")
      .then(({ data }) => setClasses(data))
      .catch((error) => {
        console.error("Error fetching class info:", error);
        setClasses([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    api.get("/api/admin/user")
      .then(({ data }) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
  };

  const handleAddClass = async () => {
    try {
      const form = { teacherID, studentIDs };
      const res = await api.post("/api/admin/class", form);
      if (res?.data?.success) {
        setOpen(false);
        fetchClasses();
        setTeacherID("");
        setStudentIDs([]);
      }
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  const uploadImagesToServer = async () => {
    try {
      const payload = {
        images: capturedImages,
        classId: attendanceClass?._id,
      };
      const res = await api.post("/api/admin/attendance", payload);

      if (res?.data?.success) {
        console.log("Images uploaded successfully");
      } else {
        console.warn("Upload completed but server did not return success");
      }
    } catch (err) {
      console.error("Error uploading images:", err);
    } finally {
      setCaptureOpen(false);
    }
  };

  const startCapture = () => {
    setCapturedImages([]);
    setCaptureOpen(true);

    captureInterval.current = setInterval(() => {
      if (webcamRef.current) {
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          setCapturedImages((prev) => [...prev, screenshot]);
        }
      }
    }, 2000);

    setTimeout(() => {
      stopCapture();
    }, 4000); // 4 seconds
  };

  const stopCapture = async () => {
    clearInterval(captureInterval.current);
    await uploadImagesToServer();
  };

  const getWebcamDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices[0]) {
        setSelectedDeviceId(videoDevices[0].deviceId); // default to first camera
      }
    } catch (err) {
      console.error("Error accessing webcam devices", err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchUsers();
    getWebcamDevices();
  }, []);

  const videoConstraints = {
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "user");

  return (
    <Container>
      <div style={styles.appBar}>
        <div style={styles.toolbar}>
          <h6 style={{ margin: 0, color: "white" }}></h6>
          <div>
            <a href="/admin/dashboard" style={styles.navButton}>Home</a>
            <a href="/admin/class" style={styles.navButton}>Classes</a>
            <a href="/admin/attendance" style={styles.navButton}>Attendance</a>
          </div>
        </div>
      </div>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
        <Typography variant="h4">All Classes</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Class</Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : classes.length ? (
        <Paper elevation={3} sx={{ padding: 3, marginTop: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Class List</Typography>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={cellStyle}>#</th>
                  <th style={cellStyle}>Teacher</th>
                  <th style={cellStyle}>No. of Students</th>
                  <th style={cellStyle}>Student Emails</th>
                  <th style={cellStyle}>Created</th>
                  <th style={cellStyle}>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, index) => {
                  const allStudents = cls.classDetails.flatMap(detail => detail.students);
                  return (
                    <tr key={cls._id}>
                      <td style={cellStyle}>{index + 1}</td>
                      <td style={cellStyle}>
                        {cls.teacherID?.email || cls.teacherID?._id || "Unknown"}
                      </td>
                      <td style={cellStyle}>{allStudents.length}</td>
                      <td style={cellStyle}>
                        {allStudents.map(s => s.studentID?.email).join(", ")}
                      </td>
                      <td style={cellStyle}>{new Date(cls.createdAt).toLocaleString()}</td>
                      <td style={cellStyle}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setAttendanceClass(cls);
                            startCapture();
                          }}
                        >
                          Take
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Paper>
      ) : (
        <Typography color="error" mt={3}>No class data available.</Typography>
      )}

      {/* Add Class Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Class</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="teacher-select-label">Select Teacher</InputLabel>
            <Select
              labelId="teacher-select-label"
              value={teacherID}
              onChange={(e) => setTeacherID(e.target.value)}
              input={<OutlinedInput label="Select Teacher" />}
            >
              {teachers.map((teacher) => (
                <MenuItem key={teacher._id} value={teacher._id}>
                  {teacher.userName} ({teacher.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="student-select-label">Select Students</InputLabel>
            <Select
              labelId="student-select-label"
              multiple
              value={studentIDs}
              onChange={(e) => setStudentIDs(e.target.value)}
              input={<OutlinedInput label="Select Students" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((id) => {
                    const user = users.find((u) => u._id === id);
                    return <Chip key={id} label={user?.userName || id} />;
                  })}
                </Box>
              )}
            >
              {students.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.userName} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddClass}>Add Class</Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Webcam Modal */}
      <Dialog open={captureOpen} onClose={stopCapture} fullScreen>
        <DialogTitle>
          Capturing Attendance for {attendanceClass?.teacherID?.email || "Unknown"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
            {/* Webcam Selector */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Camera</InputLabel>
              <Select
                value={selectedDeviceId}
                label="Select Camera"
                onChange={(e) => setSelectedDeviceId(e.target.value)}
              >
                {devices.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Webcam Feed */}
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: "60%", maxWidth: "600px", borderRadius: 8 }}
            />

            {/* Captured Thumbnails */}
            <Box>
              <Typography variant="subtitle1" mb={1}>Captured Images</Typography>
              <Box display="flex" gap={1} flexWrap="wrap" maxHeight={500} overflow="auto">
                {capturedImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`capture-${idx}`}
                    style={{ width: 150, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopCapture} variant="contained" color="error">
            Stop & Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Class;
