import { Outlet } from "react-router-dom";
import Header from "./Header"; // Adjust based on your path

// Inline styles for the layout
const styles = {
  appBar: {
    backgroundColor: "#1976d2", // Primary color for the app bar
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
    minHeight: "calc(100vh - 64px)", // Account for the app bar height
    paddingTop: "80px", // Top padding for mobile screens
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "20px",
  },
};

const AdminLayout = () => {
  return (
    <>
      <Header />
      {/* AppBar using inline CSS */}
      <div style={styles.appBar}>
        <div style={styles.toolbar}>
          {/* <h6 style={{ margin: 0, color: "white" }}>Student Portal</h6> */}
          <div>
            <a href="/home" style={styles.navButton}>
              Home
            </a>
            <a href="/classes" style={styles.navButton}>
              Classes
            </a>
            {/* <a href="/attendance" style={styles.navButton}>
              Attendance
            </a> */}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.main}>
        <Outlet />
      </div>
    </>
  );
};

export default AdminLayout;
