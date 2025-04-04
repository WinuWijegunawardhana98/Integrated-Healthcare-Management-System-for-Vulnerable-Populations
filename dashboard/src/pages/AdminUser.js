import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import UserManagement from "../components/UserManagement";
import LogsTable from "../components/LogsTable";

const AdminUser = () => {
  const [selectedUser, setSelectedUser] = useState(null); 
  console.log(selectedUser);

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="details">
          {/* Pass setSelectedUser to UserManagement */}
          <UserManagement setSelectedUser={setSelectedUser} />
          {/* Pass selectedUser to UserLogs */}
          <LogsTable selectedUser={selectedUser} />  
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default AdminUser;
