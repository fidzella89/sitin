import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, Select, Form, Tabs } from "antd";
import { UserOutlined } from '@ant-design/icons';
import Sidebar from "../components/Staff-Sidebar";
import axios from "axios";
import moment from "moment";
import dayjs from 'dayjs';
const { Option } = Select;

export default function StudentsTable() {
  const [idno, setIdno] = useState("");
  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [midname, setMidname] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [course, setCourse] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedIDNO, setSelectedIDNO] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [popup, setPopup] = useState(null);
  const [logoutidno, setlogoutidno] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(null);
  const [logs, setLogs] = useState([]);
  const [monthYearOptions, setMonthYearOptions] = useState([]);
  const [student, setSelectedStudent] = useState("");
  const [selectedstudentidno, setSelectedID] = useState("");
  const options = monthYearOptions.map(item => ({ label: item.label, value: item.value }));
  const [visible, setVisible] = useState(false);
  const onClose = () => {
    fetchLogs();
    setVisible(false)
  };

  const CustomPopup = ({ type, message, onClose }) => (
    <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>
      <h4 className="text-lg font-bold">{type === 'success' ? 'Success' : 'Error'}</h4>
      <p>{message}</p>
      <button onClick={onClose} className="mt-2 px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-600">Close</button>
    </div>
  );

  const openMessageNotif = (type, message) => {
    setPopup({ type, message });
    setTimeout(() => setPopup(null), 5000);
  };

  const calculateRunningTime = (sessionStart, status) => {
    if (status === "IN USE" && sessionStart) {
      const start = moment(sessionStart, "YYYY-MM-DD HH:mm:ss");
      const now = moment(moment().format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");
      const duration = moment.duration(now.diff(start));
      return `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
    }
    return "0h 0m 0s";
  };

  useEffect(() => {
      fetchStudents();
      const interval = setInterval(() => {
        setData((prevData) =>
          prevData.map((item) => ({
            ...item,
            runningTime: calculateRunningTime(item.session_start, item.status),
          }))
        );
      }, 1000);

      return () => clearInterval(interval);
    }, []);

  function capitalize(str) {
    return str
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:8000/sitin/students/info");
        const formattedData = response.data.map((item) => {
        const studentName = `${capitalize(item.firstname)} ${item.midname ? capitalize(item.midname[0]) + '.' : ''} ${capitalize(item.lastname)}`;

          return {
            idno: item.idno,
            name: studentName,
            firstname: item.firstname,
            midname: item.midname,
            lastname: item.lastname,
            course: item.course,
            year: item.yearlevel,
            email: item.email,
            session_no: item.session_no,
            runningTime: calculateRunningTime(item.session_start, item.status),
            status: item.status,
            session_start: item.session_start,
            session_end: item.session_end,
            purpose: item.purpose,
            room_no: item.room_no,
          };
        });
        setData(formattedData);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
  };

  const showRegisterModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleRegister = async (e) => {
    setEmailError("");  
  
    try {
      const response = await axios.post("http://localhost:8000/register/", {
        idno: parseInt(idno),
        lastname: lastname.trim(),
        firstname: firstname.trim(),
        midname: midname ? midname.trim() : null,
        course: course.trim(),
        yearlevel: parseInt(yearLevel),
        email: email.trim(),
        username: idno,
        password: idno,
      }, {
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.data.message) {
        openMessageNotif('success',response.data.message);
        setIsModalOpen(false);
        form.resetFields();
        fetchStudents();
      } else if (response.data.error === "name_exists") {
        setShowModal(true);
      } else if (response.data.error === "email_exists") {
        openMessageNotif('error',response.data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Error registering user. Please check your input.");
    }
  };

  const handleResetSessions = async () => {
    const hasInUse = data.some(item => item.status === 'IN USE');
  
    if (hasInUse) {
      openMessageNotif('error',"Please logout all students first before resetting session.");
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:8000/sitin/students/reset-sessions');
      setIsResetModalOpen(false);
      openMessageNotif('success',response.data.message);
    } catch (error) {
      openMessageNotif('error',"Failed to reset sessions.");
    }
  };

  const purposes = [
    'IMDBSYS32',
    'SYSARCH32',
    'IT-ELNET',
    'INTPROG32',
    'Other'
  ];

  const handleLogin = (idno) => {
    setSelectedIDNO(idno);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    if (!roomNo || !purpose) {
      openMessageNotif('error',"Please select a room and purpose.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/sitin/student/login', {
        idno: selectedIDNO,
        room_no: roomNo,
        purpose: purpose
      });

      if (response.status === 200) {
        form.resetFields();
        openMessageNotif('success',"Student ID No. " + selectedIDNO + " logged in successfully.");
        setIsModalVisible(false);
        fetchStudents();
        fetchStudentStatus(selectedIDNO);
        fetchMonthYearOptions(selectedIDNO);
        fetchLogs(selectedIDNO);
        setRoomNo('');
        setPurpose('');
      }
    } catch (error) {
      console.error('Login failed:', error);
      openMessageNotif('error',error.response?.data?.detail || 'Login failed.');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setRoomNo('');
    setPurpose('');
  };

  const handleLogout = (idno) => {
    setlogoutidno(idno);
    setIsLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      const response = await axios.post("http://localhost:8000/sitin/student/logout", {
        idno: logoutidno
      });
      openMessageNotif('success',"Student ID No. " + logoutidno + " Logout Successfully.");
      setIsLogoutModalVisible(false);
      fetchStudents();
      fetchStudentStatus(logoutidno);
      fetchMonthYearOptions(logoutidno);
      fetchLogs(logoutidno);
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };  

  const handleTempDelete = async (idno) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const response = await axios.put('http://localhost:8000/sitin/students/delete', { idno });
      openMessageNotif('success',`Student with ID Number: ${idno} successfully move to trash bin.`);
      fetchStudents(); 
      onClose();
    } catch (error) {
      openMessageNotif('error','Failed to delete student');
    }
  };

  const filteredData = data
    .filter((item) => {
      const yearLevelText = item.year === 0 ? "n/a" : `${item.year}${getYearSuffix(item.year)}`.toLowerCase();
      const courseText = item.course.toUpperCase() === "UNKNOWN" ? "N/A" : item.course.toUpperCase();
      return (
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.idno.toString().includes(searchText) ||
        courseText.includes(searchText.toUpperCase()) ||
        item.email.toLowerCase().includes(searchText) ||
        item.session_no.toString().includes(searchText) ||
        yearLevelText.includes(searchText.toLowerCase())
      );
    })
    .map((item) => ({
      ...item,
      key: item.idno,
      year: item.year === 0 ? "N/A" : `${item.year}${getYearSuffix(item.year)}`, 
      course: item.course.toUpperCase() === "UNKNOWN" ? "N/A" : item.course.toUpperCase(),
    }));

  function getYearSuffix(year) {
    switch (year) {
      case 1:
        return "st Year";
      case 2:
        return "nd Year";
      case 3:
        return "rd Year";
      case 4:
        return "th Year";
      case 5:
        return "th Year"
      default:
        return "";
    }
  }

  const columns = [
    { title: "ID Number", dataIndex: "idno", key: "idno", render: (text, record) => (
      <a onClick={() => handleViewStudent(record)} className="text-blue-600 hover:underline cursor-pointer">{text}</a>
    ) },
    { title: "Student Name", dataIndex: "name", key: "name" },
    { title: "Course", dataIndex: "course", key: "course" },
    { title: "Year", dataIndex: "year", key: "year" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Session No", dataIndex: "session_no", key: "session_no" },
    { title: "Running Time", dataIndex: "runningTime", key: "runningTime" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            className="px-3 py-1 text-white rounded"
            style={{ backgroundColor: record.status === "COMPLETED" ? "#1E3A8A" : "#DC2626" }}
            onClick={() =>
              record.status === "COMPLETED" ? handleLogin(record.idno) : handleLogout(record.idno)
            }
          >
            {record.status === "COMPLETED" ? "Login" : "Logout"}
          </Button>
          <Button
            className="px-3 py-1 text-white bg-red-500 rounded"
            onClick={() => handleTempDelete(record.idno)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleViewStudent = async (student) => {
    if (student) {
      const studentid = parseInt(student.idno);
      setSelectedStudent(student);
      setSelectedID(studentid);

      // Use Promise.all to fetch data concurrently
      try {
        await Promise.all([
          fetchMonthYearOptions(studentid),
          fetchLogs(studentid)
        ]);
        setVisible(true); // Open modal after all data is fetched
      } catch (error) {
        console.error('Error loading student data:', error);
      }
    }
  };

  const fetchMonthYearOptions = async (studentid) => {
    try {
      const response = await fetch(`http://localhost:8000/sitin/student_logs/months?studentId=${studentid}`);
      if (!response.ok) throw new Error('Failed to fetch month-year options');
      const data = await response.json();
      setMonthYearOptions(data);
    } catch (error) {
      console.error('Error fetching month-year options:', error);
    }
  };

  const fetchLogs = async (studentid) => {
    try {
      const response = await fetch(`http://localhost:8000/sitin/student_logs?studentId=${studentid}&monthYear=${selectedMonthYear || ''}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      const processedData = data.map(item => ({
        ...item,
        session_start: dayjs(item.session_start).format('YYYY-MM-DD HH:mm:ss'),
        session_end: item.session_end ? dayjs(item.session_end).format('YYYY-MM-DD HH:mm:ss') : 'Ongoing'
      }));
      setLogs(processedData);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleChange = (value) => {
    setSelectedMonthYear(value);
    fetchLogs(selectedstudentidno);
  };

  const handleClear = () => {
    setSelectedMonthYear(null);
    fetchLogs(selectedstudentidno);
  };

  const fetchStudentStatus = async (studentIdno) => {
    try {
      const response = await fetch(`http://localhost:8000/sitin/student_status?studentId=${studentIdno}`);
      if (!response.ok) throw new Error('Failed to fetch student data');
      const data = await response.json();
      setSelectedStudent(data);
    } catch (error) {
      console.error('Error fetching student status:', error);
    }
  };

  const fetchPenalties = async (studentId) => {
    try {
      const response = await fetch(`http://localhost:8000/sitin/student_penalties?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch penalties');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching penalties:', error);
      return [];
    }
  };

  const [penalties, setPenalties] = useState([]);

  useEffect(() => {
    if (student) {
      fetchPenalties(student.idno).then(data => setPenalties(data));
    }
  }, [student]);

  const penaltiescolumns = [
    { title: 'Penalty Name', dataIndex: 'penalties_name', key: 'penalties_name' },
    { title: 'Description', dataIndex: 'penalties_description', key: 'penalties_description' }
  ];
  const penaltiesContent = (
    <Table dataSource={penalties} columns={penaltiescolumns} rowKey={(record, index) => index} />
  );

  const tabItems = [
    {
      key: '1',
      label: 'Logs',
      children: <div>
                  <h1 className="text-center font-bold text-lg">Student Sitin Logs</h1>
                  <label>Filter by Month/Year:</label>
                  <Select
                    style={{ width: 200, marginLeft: 10 }}
                    value={selectedMonthYear}
                    onChange={handleChange}
                    placeholder="Select Month/Year"
                    allowClear
                    onClear={handleClear}
                    options={options}
                  >
                  </Select>
                  <Table
                    className="mt-2" 
                    dataSource={logs} 
                    columns={
                      [
                        { 
                          title: 'Session Start',
                          dataIndex: 'session_start',
                          key: 'session_start',
                          sorter: (a, b) => new Date(a.session_start) - new Date(b.session_start),
                          defaultSortOrder: 'descend',
                          render: (text) => new Date(text).toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                        },
                        { 
                          title: 'Session End',
                          dataIndex: 'session_end',
                          key: 'session_end',
                          sorter: (a, b) => (a.session_end === 'Ongoing' ? 1 : new Date(a.session_end)) - (b.session_end === 'Ongoing' ? 1 : new Date(b.session_end)),
                          render: (text) => text === 'Ongoing' ? 'Ongoing' : new Date(text).toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                        },
                        { 
                          title: 'Duration',
                          dataIndex: 'duration',
                          key: 'duration',
                          sorter: (a, b) => (a.duration === 'Ongoing' ? 1 : a.duration) - (b.duration === 'Ongoing' ? 1 : b.duration)
                        },
                        { 
                          title: 'Purpose', 
                          dataIndex: 'purpose', 
                          key: 'purpose',
                          sorter: (a, b) => a.purpose.localeCompare(b.purpose)
                        }, 
                        { 
                          title: 'Room No', 
                          dataIndex: 'room_no', 
                          key: 'room_no',
                          sorter: (a, b) => a.room_no.localeCompare(b.room_no)
                        }
                      ]
                    }
                    pagination={false}
                    scroll={{ y: 400 }}
                  />
                </div>
    },
    {
      key: '2',
      label: 'Penalties',
      children: <div><h1 className="text-center font-bold text-lg">Student Penalties</h1>
                  <div className="mt-2">
                    {penaltiesContent}
                  </div>
                </div>
    }
  ];


  return (
    <div className="p-6 ml-16">
      <Sidebar />
      <h1 className="text-2xl font-bold text-center mb-4 text-blue-800">Students Table</h1>
      <div className="flex items-center justify-between w-full">
        <Input
          placeholder="Search students..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border rounded px-3 py-2 w-1/4"
        />
        <div className="flex gap-2">
          <Button type="primary" onClick={showRegisterModal}>Register</Button>
          <Button danger onClick={setIsResetModalOpen}>Reset Sessions</Button>
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} items` }}
        bordered
        className="rounded shadow mt-4"
      />
      
      <Modal title="Register Student" className="text-center" open={isModalOpen} onCancel={handleCancel} okText="Submit" onOk={form.submit}>
        <Form form={form} layout="vertical" onFinish={handleRegister}>
          <label className="block text-gray-700 font-medium mb-2 text-left">*Student ID Number:</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="text"
            placeholder="ID Number"
            value={idno}
            onChange={(e) => setIdno(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-2 text-left">*Firstname:</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="text"
            placeholder="Firstname"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-2 text-left">Middle Name: (Optional)</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="text"
            placeholder="Midname"
            value={midname}
            onChange={(e) => setMidname(e.target.value)}
          />

          <label className="block text-gray-700 font-medium mb-2 text-left">*Lastname:</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="text"
            placeholder="Lastname"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-2 text-left">*Email</label>
          <input
            className={`w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 ${
              emailError ? "border-red-500" : "focus:ring-green-500"
            }`}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}

          <h1 className="text-gray-700 text-left font-medium">Username: </h1><span>{idno}</span>

          <label className="block text-gray-700 font-medium mb-2 text-left">*Course</label>
          <select
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setYearLevel(""); 
            }}
            required
          >
            <option value="">Select Course</option>
            <option value="BSIT">Bachelor of Science in Information Technology (BSIT)</option>
            <option value="BSCS">Bachelor of Science in Computer Science (BSCS)</option>
            <option value="BSCE">Bachelor of Science in Civil Engineering (BSCE)</option>
            <option value="BSEE">Bachelor of Science in Electrical Engineering (BSEE)</option>
            <option value="BSBA">Bachelor of Science in Business Administration (BSBA)</option>
          </select>

          <label className="block text-gray-700 font-medium mb-2 text-left">*Year Level</label>
          <select
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            required
          >
            <option value="">Select Year Level</option>
            {(course === "BSIT" || course === "BSBA" || course ==="BSCS") && (
              <>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </>
            )}
            {(course === "BSCE" || course === "BSEE") && (
              <>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </>
            )}
          </select>
        </Form>
      </Modal>

      <div>
        <Modal open={visible} onCancel={onClose} className="p-1" footer={null} width={1100}>
        <div className="flex gap-4">
          <div className="w-1/3 bg-gray-100 p-4 rounded-lg shadow">
            <div className="flex justify-center mb-4">
              {student.profile ? (
                <img src={student.profile} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-5xl text-blue-600" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-center">{`
              ${capitalize(student?.firstname || '')} 
              ${student?.midname ? capitalize(student.midname.charAt(0)) + '.' : ''} 
              ${capitalize(student?.lastname || '')}`.replace(/  +/g, ' ').trim()}
            </h2>
            <p className="mt-2"><strong>ID Number:</strong> {student.idno}</p>
            <p className="mt-2"><strong>First Name:</strong> {student.firstname}</p>
            <p className="mt-2"><strong>Middle Name:</strong> {student.midname || "N/A"}</p>
            <p className="mt-2"><strong>Last Name:</strong> {student.lastname}</p>
            <p className="mt-2"><strong>Course:</strong> {student.course}</p>
            <p className="mt-2"><strong>Year:</strong> {student.year}</p>
            <p className="mt-2"><strong>Email:</strong> {student.email}</p>
            <div className="flex gap-2 w-full justify-center text-center mt-4">
              <Button
                className="w-1/2 py-2 text-white rounded"
                style={{ backgroundColor: student.status === 'COMPLETED' ? '#1E3A8A' : '#DC2626' }}
                onClick={() =>
                  student.status === 'COMPLETED' ? handleLogin(student.idno) : handleLogout(student.idno)
                }
              >
                {student.status === 'COMPLETED' ? 'Login' : 'Logout'}
              </Button>
              <Button
                className="w-1/2 py-2 text-white bg-red-500 rounded"
                onClick={() => handleTempDelete(student.idno)}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="w-2/3">
            <Tabs items={tabItems} />
          </div>
        </div>
      </Modal></div>

      {popup && <CustomPopup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <Modal title="Confirm Reset Session" open={isResetModalOpen} onCancel={() => setIsResetModalOpen(false)} onOk={handleResetSessions}>
        <p>Are you sure you want to reset all session numbers of all students?</p>
      </Modal>

      <Modal title="Confirm Reset Session" open={isLogoutModalVisible} onCancel={() => setIsLogoutModalVisible(false)} onOk={handleLogoutConfirm}>
        <p>Are you sure you logout the Student ID Number: {logoutidno}?</p>
      </Modal>

      <Modal
        title="Student Login"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Login"
        cancelText="Cancel"
      >
        <p><strong>IDNO:</strong> {selectedIDNO}</p>

        <Input
          placeholder="Enter Room No"
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <Select
          placeholder="Select Purpose"
          value={purpose}
          onChange={(value) => setPurpose(value)}
          style={{ width: '100%', marginBottom: 10 }}
        >
          {purposes.map((p) => (
            <Option key={p} value={p}>
              {p}
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
