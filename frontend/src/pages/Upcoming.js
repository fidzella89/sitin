import React, { useState, useEffect } from "react";
import { Table, Button, Input, Select, Typography, Modal } from "antd";
import Sidebar from "../components/Staff-Sidebar";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Option } = Select;
const { Title } = Typography;

export default function Record() {
  const [records, setRecords] = useState([]);
  const [activePanel, setActivePanel] = useState(1);
  const [activeSubPanel, setActiveSubPanel] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filteredRequestRecords, setFilteredRequestRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [requestrecords, setRequestRecords] = useState([]);
  const [searchRequestTerm, setSearchRequestTerm] = useState("");
  const [popup, setPopup] = useState(null);
  const [filters, setFilters] = useState({
    date: "All",
    month: null,
    day: null,
    year: null,
    courseYear: "All",
    course: null,
    yearlevel: null,
    purpose: "All",
    room: "All",
  });
  const [uniqueRooms, setUniqueRooms] = useState([]);
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [uniqueYearLevels, setUniqueYearLevels] = useState([]);
  const [uniquePurposes, setUniquePurposes] = useState([]);
  const [uniqueTime, setUniqueTime] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [uniqueDays, setUniqueDays] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, order: "ascend" });
  const [pageSize, setPageSize] = useState(5);
  const [requestpageSize, setRequestPageSize] = useState(5);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentRecord, setCurrentRecord] = useState(null);

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

  useEffect(() => {
    if (activePanel === 2) {
      fetchRecords();
    }
  }, [activePanel]);

  const fetchRecords = async () => {
    try {
      const response = await axios.get("http://localhost:8000/staff/reservation/upcoming");
      setRecords(response.data);
      setFilteredRecords(response.data);
      extractUniqueValues(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
  };

  const extractUniqueValues = (data) => {
    const rooms = [...new Set(data.map((rec) => rec.room_no))];
    const courses = [...new Set(data.map((rec) => rec.course))];
    const yearLevels = [...new Set(data.map((rec) => rec.yearlevel))];
    const time = [...new Set(data.map((rec) => rec.reservation_time))];
    let purposes = [...new Set(data.map((rec) => rec.purpose))];
    const years = [...new Set(data.map((rec) => dayjs(rec.reservation_date).year()))];
    const months = [...new Set(data.map((rec) => dayjs(rec.reservation_date).format("MMMM")))]; // Month name
    const days = [...new Set(data.map((rec) => dayjs(rec.reservation_date).date()))];

    const hasOther = purposes.some((p) => p.startsWith("Other:"));
    purposes = purposes.filter((p) => !p.startsWith("Other:"));
  
    if (hasOther) {
      purposes.push("Other"); 
    }

    setUniqueRooms(rooms);
    setUniqueCourses(courses);
    setUniqueYearLevels(yearLevels);
    setUniquePurposes(purposes);
    setUniqueTime(time);
    setUniqueYears(years);
    setUniqueMonths(months);
    setUniqueDays(days);
  };

  const filterRecords = (filters, search = searchTerm) => {
    let filtered = records;
  
    // Search filter
    if (search) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(search)
        )
      );
    }
  
    // Date filters
    if (filters.date !== "All") {
      filtered = filtered.filter(record => {
        const sessionDate = dayjs(record.reservation_date); 
        const today = dayjs();

        if (filters.date === "Today") {
          return sessionDate.isSame(today, 'day');
        }
        if (filters.date === "Upcoming") {
          return sessionDate.isAfter(today, 'day');
        }
        if (filters.date === "Past") {
          return sessionDate.isBefore(today, 'day');
        }
  
        // Ensure filters match correctly
        const matchMonth = filters.month ? sessionDate.format("MMMM") === filters.month : true;
        const matchDay = filters.day ? sessionDate.date() === parseInt(filters.day, 10) : true;
        const matchYear = filters.year ? sessionDate.year() === parseInt(filters.year, 10) : true;
  
        if (filters.date === "Month, Day, Year") {
          return matchMonth && matchDay && matchYear;
        }
        if (filters.date === "Month & Year") {
          return matchMonth && matchYear;
        }
        if (filters.date === "Year") {
          return matchYear;
        }
        return true;
      });
    }
  
    // Course & Year Level filters
    if (filters.courseYear !== "All") {
      if (filters.courseYear === "Course" && filters.course !== "All") {
        filtered = filtered.filter(record => record.course === filters.course);
      }
      if (filters.courseYear === "Year Level" && filters.yearlevel !== "All") {
        filtered = filtered.filter(record => record.yearlevel === filters.yearlevel);
      }
      if (filters.courseYear === "Course & Year Level") {
        if (filters.course !== "All" && filters.yearlevel === "All") {
          filtered = filtered.filter(record => record.course === filters.course);
        } else if (filters.course === "All" && filters.yearlevel !== "All") {
          filtered = filtered.filter(record => record.yearlevel === filters.yearlevel);
        } else if (filters.course !== "All" && filters.yearlevel !== "All") {
          filtered = filtered.filter(record => record.course === filters.course && record.yearlevel === filters.yearlevel);
        }
      }
    }    
    
    // Purpose filter
    if (filters.purpose !== "All") {
      filtered = filtered.filter(record => record.purpose.toLowerCase() === filters.purpose.toLowerCase());
    }
  
    // Room filter
    if (filters.room !== "All") {
      filtered = filtered.filter(record => record.room_no === filters.room);
    }
  
    setFilteredRecords(filtered);
  };  

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    filterRecords(newFilters);
  };

  const formatYearLevel = (year) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const relevantSuffix = (year >= 1 && year <= 3) ? suffixes[year] : suffixes[0];
    return `${year}${relevantSuffix} Year`;
  };

  const columns = [
    {
      title: "ID No.",
      dataIndex: "idno",
      align: "center",
      sorter: (a, b) => a.idno - b.idno,
    },
    {
      title: "Student Name",
      dataIndex: "name",
      align: "center",
      render: (_, record) => (
        <div style={{ wordBreak: "break-word", textTransform: "capitalize", textAlign: "center" }}>
          {record.firstname} {record.midname ? record.midname.charAt(0) + '.' : ''} {record.lastname}
        </div>
      ),
      sorter: (a, b) => a.lastname.localeCompare(b.lastname), 
    },
    {
      title: "Course",
      dataIndex: "course",
      align: "center",
      sorter: (a, b) => a.course.localeCompare(b.course),
      render: (course) => course ? course.toUpperCase() : "N/A", 
    },
    {
      title: "Year Level",
      dataIndex: "yearlevel",
      align: "center",
      sorter: (a, b) => a.yearlevel - b.yearlevel, 
      render: (year) => {
        if (!year) return "N/A"; 
    
        const suffixes = ["th", "st", "nd", "rd"];
        const relevantSuffix = (year >= 1 && year <= 3) ? suffixes[year] : suffixes[0];
        return `${year}${relevantSuffix} Year`;
      }
    },      
    {
      title: "Email",
      dataIndex: "email",
      align: "center",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      align: "center",
      sorter: (a, b) => a.purpose.localeCompare(b.purpose),
    },
    {
      title: "Room No.",
      dataIndex: "room_no",
      align: "center",
      sorter: (a, b) => a.idno - b.idno,
    },
    {
      title: "Date Status",
      dataIndex: "reservation_date",
      align: "center",
      render: (date) => {
        const sessionDate = dayjs(date);
        const today = dayjs();
        let status = "";
        let color = "";

        if (sessionDate.isSame(today, 'day')) {
          status = "Today";
          color = "#3B82F6";
        } else if (sessionDate.isAfter(today, 'day')) {
          status = "Upcoming";
          color = "#10B981";
        } else {
          status = "Past";
          color = "#EF4444";
        }

        return (
          <span style={{
            backgroundColor: color,
            color: "white",
            padding: "6px 12px",
            borderRadius: "20px",
            display: "inline-block",
            textAlign: "center"
          }}>
            {status}
          </span>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "reservation_date",
      key: "reservation_date",
      align: "center",
      render: (text) => dayjs(text).format("MM/DD/YYYY"), 
      sorter: (a, b) => dayjs(a.reservation_date).unix() - dayjs(b.reservation_date).unix(), 
    },
    {
      title: "Time",
      dataIndex: "reservation_time",
      align: "center",
      sorter: (a, b) => dayjs(a.reservation_time, "HH:mm").unix() - dayjs(b.reservation_time, "HH:mm").unix(),
    },
  ];  

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.text("Reservation Schedule Report", 105, 15, { align: "center" });

    let filterText = "";
    if (filters.courseYear !== "All" && filters.courseYear !== "Year Level") filterText += `Course: ${filters.course.toUpperCase()}  `;
    if (filters.courseYear !== "All" && filters.courseYear !== "Course") filterText += `Year Level: ${filters.yearlevel}  `;
    if (filters.date !== "All") filterText += `Date: ${filters.date}  `;

    if (filterText) {
      doc.text(filterText, 16, 30);
    }

    const groupedRecords = {};
    filteredRecords.forEach(record => {
      const key = `${record.room_no || "N/A"}-${record.purpose || "N/A"}`;
      if (!groupedRecords[key]) {
        groupedRecords[key] = [];
      }
      groupedRecords[key].push(record);
    });

    Object.entries(groupedRecords).forEach(([key, records], index) => {
      const [roomNo, purpose] = key.split("-");
      const startY = index === 0 ? 25 : doc.lastAutoTable.finalY + 10;

      doc.setFontSize(13);
      doc.text(`Room No: ${roomNo}`, 13, startY);
      doc.text(`Purpose: ${purpose}`, 13, startY + 7);

      const tableColumn = ["ID No.", "Name", "Course", "Year Level", "Email", "Date", "Time"];
      const tableRows = records.map(record => {

        return [
          record.idno || "N/A",
          `${record.firstname ? record.firstname.charAt(0).toUpperCase() + record.firstname.slice(1) : ""} ${record.midname ? record.midname.charAt(0).toUpperCase() + '.' : ''} ${record.lastname ? record.lastname.charAt(0).toUpperCase() + record.lastname.slice(1) : ""}`,
          record.course ? record.course.toUpperCase() : "",
          formatYearLevel(record.yearlevel),
          record.email || "N/A",
          record.reservation_date ? dayjs(record.reservation_date).format("MM/DD/YYYY") : "N/A",
          record.reservation_time
        ];
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: startY + 10,
        styles: { overflow: 'linebreak' },
        columnStyles: { 1: { cellWidth: 'wrap' } },
        margin: { top: 20 },
        didDrawPage: function (data) {
          doc.setFontSize(10);
          const pageHeight = doc.internal.pageSize.height;
          const footerText = `Generated on: ${dayjs().format("MM/DD/YYYY HH:mm:ss")}`;
          doc.text(footerText, 16, pageHeight - 10);
        },
      });
    });

    doc.save("Reservation_Schedule_Report.pdf");
  };

  {/* This functionality is for Reservation Request */}


  const requestcolumns = [
    {
      title: "ID No.",
      dataIndex: "idno",
      align: "center",
      sorter: (a, b) => a.idno - b.idno,
    },
    {
      title: "Student Name",
      dataIndex: "name",
      align: "center",
      render: (_, record) => (
        <div style={{ wordBreak: "break-word", textTransform: "capitalize", textAlign: "center" }}>
          {record.firstname} {record.midname ? record.midname.charAt(0) + '.' : ''} {record.lastname}
        </div>
      ),
      sorter: (a, b) => a.lastname.localeCompare(b.lastname), 
    },
    {
      title: "Course",
      dataIndex: "course",
      align: "center",
      sorter: (a, b) => a.course.localeCompare(b.course),
      render: (course) => course ? course.toUpperCase() : "N/A", 
    },
    {
      title: "Year Level",
      dataIndex: "yearlevel",
      align: "center",
      sorter: (a, b) => a.yearlevel - b.yearlevel, 
      render: (year) => {
        if (!year) return "N/A"; 
    
        const suffixes = ["th", "st", "nd", "rd"];
        const relevantSuffix = (year >= 1 && year <= 3) ? suffixes[year] : suffixes[0];
        return `${year}${relevantSuffix} Year`;
      }
    },      
    {
      title: "Email",
      dataIndex: "email",
      align: "center",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      align: "center",
      sorter: (a, b) => a.purpose.localeCompare(b.purpose),
    },
    {
      title: "Room No.",
      dataIndex: "room_no",
      align: "center",
      sorter: (a, b) => a.idno - b.idno,
    },
    {
      title: "Date Status",
      dataIndex: "reservation_date",
      align: "center",
      render: (date) => {
        const sessionDate = dayjs(date);
        const today = dayjs();
        let status = "";
        let color = "";

        if (sessionDate.isSame(today, 'day')) {
          status = "Today";
          color = "#3B82F6";
        } else if (sessionDate.isAfter(today, 'day')) {
          status = "Upcoming";
          color = "#10B981";
        } else {
          status = "Past";
          color = "#EF4444";
        }

        return (
          <span style={{
            backgroundColor: color,
            color: "white",
            padding: "6px 12px",
            borderRadius: "20px",
            display: "inline-block",
            textAlign: "center"
          }}>
            {status}
          </span>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "reservation_date",
      key: "reservation_date",
      align: "center",
      render: (text) => dayjs(text).format("MM/DD/YYYY"), 
      sorter: (a, b) => dayjs(a.reservation_date).unix() - dayjs(b.reservation_date).unix(), 
    },
    {
      title: "Time",
      dataIndex: "reservation_time",
      align: "center",
      sorter: (a, b) => dayjs(a.reservation_time, "HH:mm").unix() - dayjs(b.reservation_time, "HH:mm").unix(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button className="px-3 py-1 text-white bg-green-500 rounded" onClick={() => handleAccept(record)}>Accept</Button>
          <Button className="px-3 py-1 text-white bg-yellow-500 rounded" onClick={() => showRejectModal(record)}>Reject</Button>
        </div>
      ),
    }
  ];  

  useEffect(() => {
    if (activePanel === 1) {
      fetchRequestRecords();
    }
  }, [activePanel]);  

  const fetchRequestRecords = async () => {
    try {
      const response = await axios.get("http://localhost:8000/staff/reservation/request");
      setRequestRecords(response.data);
      setFilteredRequestRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  const handleRequestSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchRequestTerm(value);
  
    const yearLevelMap = {
      1: "1st Year",
      2: "2nd Year",
      3: "3rd Year",
      4: "4th Year",
      5: "5th Year"
    };
  
    const filteredData = requestrecords.filter((record) => {
      const fullName = `${record.firstname} ${record.midname} ${record.lastname}`.toLowerCase();
      const yearLevel = yearLevelMap[record.yearlevel] || `${record.yearlevel} Year`;
      const dateParts = record.reservation_date.split("-");
      const formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
      const [hour, minute] = record.reservation_time.split(":");
      const timeInt = parseInt(hour);
      const formattedTime = `${(timeInt % 12) || 12}:${minute} ${timeInt >= 12 ? "PM" : "AM"}`;
  
      return (
        fullName.includes(value) ||
        String(record.idno).toLowerCase().includes(value) ||
        String(record.course).toLowerCase().includes(value) ||
        yearLevel.toLowerCase().includes(value) ||
        formattedDate.toLowerCase().includes(value) ||
        formattedTime.toLowerCase().includes(value) ||
        Object.values(record).some((field) =>
          String(field).toLowerCase().includes(value)
        )
      );
    });
  
    setFilteredRequestRecords(filteredData);
  };  

  const handleAccept = async (record) => {
    try {
      const response = await axios.put('http://localhost:8000/sitin/student/accept', { idno: parseInt(record.idno), date: record.reservation_date, time: record.reservation_time });
      openMessageNotif('success',response.data.message);
      fetchRequestRecords();  
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      openMessageNotif('error','Failed Request. Please try again later.');
    }
  };
  
  const showRejectModal = (record) => {
    setCurrentRecord(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setRejectReason('');
  };

  const handleSaveReject = async () => {
    if (!rejectReason) {
      openMessageNotif('error','Please provide a reason on declining reason.');
      return;
    }
    try {
      const response = await axios.put('http://localhost:8000/sitin/student/reject', {
        idno: parseInt(currentRecord.idno),
        date: currentRecord.reservation_date,
        time: currentRecord.reservation_time,
        reason: rejectReason
      });
      openMessageNotif('success', response.data.message);
      setIsModalVisible(false);
      setRejectReason('');
      fetchRequestRecords();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      openMessageNotif('error','Failed Request. Please try again later.');
    }
  };

  return (
    <div className="flex ml-20">
      <Sidebar />
      <div className="h-screen p-4 flex-1">
      {popup && <CustomPopup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      <Title level={2} className="text-center font-bold">Reservation</Title>
        <div className="flex justify-center mb-4">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
            onClick={() => setActivePanel(activePanel === 1 ? 2 : 1)}
          >
            {activePanel === 1 ? "View Upcoming/Declined" : "View Request"}
          </button>
        </div>
          <div>
            <AnimatePresence mode="wait">
              {/* This is for Reservation Request */}
            {activePanel === 1 ? (
                <motion.div
                  key="panel1"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="bg-gray-100 p-6 shadow-lg rounded-lg text-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4"
                  >
                  <Title level={2} className="text-center">Request</Title>
                    <div className="flex justify-between items-center ml-6 mr-4 mb-2">
                      <Input placeholder="Search..." value={searchRequestTerm} onChange={handleRequestSearch} style={{ width: "300px" }} />
                    </div>
                
                    <div className="items-right p-5">
                      <div className="flex text-left mr-4 mb-2">
                      <a className="mr-2">Page:</a>
                        <Select defaultValue={5} onChange={(value) => setRequestPageSize(value)}>
                          <Option value={5}>5</Option>
                          <Option value={10}>10</Option>
                          <Option value={20}>20</Option>
                          <Option value={50}>50</Option>
                        </Select>
                      </div>
                      
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4"
                      >
                        <div className="p-2">
                          <Table columns={requestcolumns} dataSource={filteredRequestRecords} pagination={{ pageSize: requestpageSize }} rowKey={(record) => `${record.idno}-${record.reservation_date}-${record.reservation_time}`} />
                        </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : (
              <motion.div
                key="panel2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-gray-100 p-6 shadow-lg rounded-lg text-center"
              >
                <div 
                style={{ width: "250px" }} 
                className="relative text-center mx-auto"
                onMouseEnter={() => setIsDropdownOpen(true)} 
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {/* Selection Box */}
                <div className="bg-gray-200 text-gray-700 py-2 px-2 rounded-lg cursor-pointer flex items-center justify-center relative">
                  <span>{activeSubPanel === 1 ? "Approved Schedule" : "Declined Schedule"}</span>
                  <span 
                    className={`absolute right-2 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    ▼
                  </span>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full transform -translate-x-1/2 w-full bg-white border rounded-lg shadow-lg mt-1"
                    >
                      <li
                        className={`px-2 py-2 cursor-pointer ${
                          activeSubPanel === 1 ? "bg-green-500 text-white" : "hover:bg-green-200"
                        }`}
                        onClick={() => setActiveSubPanel(1)}
                      >
                        Approved Schedule
                      </li>
                      <li
                        className={`px-2 py-2 cursor-pointer ${
                          activeSubPanel === 2 ? "bg-red-500 text-white" : "hover:bg-red-300"
                        }`}
                        onClick={() => setActiveSubPanel(2)}
                      >
                        Declined Schedule
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Subpanels */}
              {activeSubPanel === 1 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4"
                >
                <Title level={2} className="text-center">Upcoming Schedule</Title>
                  <div className="flex justify-between items-center ml-6 mr-4 mb-2">
                    <Button className="px-4 py-3 text-base" type="primary" onClick={generatePDFReport}>Generate Report</Button>
                    <Input placeholder="Search..." value={searchTerm} onChange={handleSearch} style={{ width: "300px" }} />
                  </div>
              
                  <div className="items-right p-5">
                  <div className="flex text-left mr-4 mb-2">
                  <a className="mr-2">Page:</a>
                    <Select defaultValue={5} onChange={(value) => setPageSize(value)}>
                      <Option value={5}>5</Option>
                      <Option value={10}>10</Option>
                      <Option value={20}>20</Option>
                      <Option value={50}>50</Option>
                    </Select>
                  </div>
                  <a className="mr-2">Filter:</a>
                  <Select defaultValue="All" className="mr-2" onChange={(value) => handleFilterChange("date", value)}>
                    <Option value="All">All Dates</Option>
                    <Option value="Month, Day, Year">Month, Day, Year</Option>
                    <Option value="Month & Year">Month & Year</Option>
                    <Option value="Year">Year</Option>
                  </Select>
                  {filters.date !== "All" && filters.date !== "Year" && (
                    <Select defaultValue="Select Month" className="mr-2" onChange={(value) => handleFilterChange("month", value)}>
                      {uniqueMonths.map((month) => (
                        <Option key={month} value={month}>{month}</Option>
                      ))}
                    </Select>
                  )}
                  {filters.date === "Month, Day, Year" && (
                    <Select defaultValue="Select Day" className="mr-2" onChange={(value) => handleFilterChange("day", value)}>
                      {uniqueDays.map((day) => (
                        <Option key={day} value={day}>{day}</Option>
                      ))}
                    </Select>
                  )}
                  {filters.date !== "All" && (
                    <Select defaultValue="Select Year" className="mr-2" onChange={(value) => handleFilterChange("year", value)}>
                      {uniqueYears.map((year) => (
                        <Option key={year} value={year}>{year}</Option>
                      ))}
                    </Select>
                  )}

                  <Select defaultValue="All" className="mr-2" onChange={(value) => handleFilterChange("courseYear", value)}>
                    <Option value="All">All Courses & Years</Option>
                    <Option value="Course">By Course</Option>
                    <Option value="Year Level">By Year Level</Option>
                    <Option value="Course & Year Level">By Course & Year</Option>
                  </Select>

                  {filters.courseYear === "Course" || filters.courseYear === "Course & Year Level" ? (
                    <Select defaultValue="Select Course" className="mr-2" onChange={(value) => handleFilterChange("course", value)}>
                      {uniqueCourses.map((course) => (
                        <Option key={course} value={course}>{course ? course : "N/A"}</Option>
                      ))}
                    </Select>
                  ) : null}

                  {filters.courseYear === "Year Level" || filters.courseYear === "Course & Year Level" ? (
                    <Select defaultValue="Select Year Level" className="mr-2" onChange={(value) => handleFilterChange("yearlevel", value)}>
                      {uniqueYearLevels.map((yearlevel) => (
                        <Option key={yearlevel} value={yearlevel}>
                          {yearlevel ? formatYearLevel(yearlevel) : "N/A"}
                        </Option>
                      ))}
                    </Select>
                  ) : null}

                  <Select defaultValue="All" className="mr-2" onChange={(value) => handleFilterChange("purpose", value)}>
                    <Option value="All">All Purposes</Option>
                    {uniquePurposes.map((purpose) => (
                      <Option key={purpose} value={purpose}>{purpose}</Option>
                    ))}
                  </Select>

                  <Select defaultValue="All" className="mr-2" onChange={(value) => handleFilterChange("room", value)}>
                    <Option value="All">All Rooms</Option>
                    {uniqueRooms.map((room) => (
                      <Option key={room} value={room}>{room}</Option>
                    ))}
                  </Select>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4"
                  >
                    <div className="p-2">
                      <Table columns={columns} dataSource={filteredRecords} pagination={{ pageSize: pageSize }} rowKey={(record) => `${record.idno}-${record.reservation_date}-${record.reservation_time}`} />
                    </div>
                </motion.div>
              </motion.div>
              ) : (
                <h1 className="text-center text-xl font-semibold mt-4">Sub 2</h1>
              )}
            </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
        <Modal
          title="Reject Reservation"
          open={isModalVisible}
          onCancel={handleCancel}
          onOk={handleSaveReject}
          okText="Save"
        >
          <p><strong>ID No:</strong> {currentRecord?.idno}</p>
          <p><strong>Reservation Date:</strong> {currentRecord?.reservation_date}</p>
          <p><strong>Reservation Time:</strong> {currentRecord?.reservation_time}</p>
          <Input.TextArea
            placeholder="Enter reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
        </Modal>
      </div>     
    );
  }
