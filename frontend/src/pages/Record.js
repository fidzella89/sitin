import React, { useState, useEffect } from "react";
import { Table, Button, Input, Select, Typography } from "antd";
import Sidebar from "../components/Staff-Sidebar";
import axios from "axios";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Option } = Select;
const { Title } = Typography;

export default function Record() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [uniqueDays, setUniqueDays] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, order: "ascend" });
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get("http://localhost:8000/report/records");
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
    filterRecords(filters, value);
  };

  const extractUniqueValues = (data) => {
    const rooms = [...new Set(data.map((rec) => rec.room_no))];
    const courses = [...new Set(data.map((rec) => rec.course))];
    const yearLevels = [...new Set(data.map((rec) => rec.yearlevel))];
    let purposes = [...new Set(data.map((rec) => rec.purpose))];
    const years = [...new Set(data.map((rec) => dayjs(rec.session_start).year()))];
    const months = [...new Set(data.map((rec) => dayjs(rec.session_start).format("MMMM")))]; // Month name
    const days = [...new Set(data.map((rec) => dayjs(rec.session_start).date()))];

    const hasOther = purposes.some((p) => p.startsWith("Other:"));
    purposes = purposes.filter((p) => !p.startsWith("Other:"));
  
    if (hasOther) {
      purposes.push("Other"); 
    }

    setUniqueRooms(rooms);
    setUniqueCourses(courses);
    setUniqueYearLevels(yearLevels);
    setUniquePurposes(purposes);
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
        const sessionDate = dayjs(record.session_start); // Parse datetime string
  
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

  const formatRunningTime = (start, end) => {
    const diff = dayjs(end || dayjs()).diff(dayjs(start));
    return new Date(diff).toISOString().substr(11, 8);
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
      defaultSortOrder: "ascend",
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
      title: "Session Start",
      dataIndex: "session_start",
      key: "session_start",
      align: "center",
      render: (text) => dayjs(text).format("MM/DD/YYYY hh:mm A"), 
      sorter: (a, b) => dayjs(a.session_start).unix() - dayjs(b.session_start).unix(), 
    },
    {
      title: "Time Used",
      dataIndex: "running_time",
      align: "center",
      render: (_, record) => new Date(dayjs(record.session_end || dayjs()).diff(dayjs(record.session_start))).toISOString().substr(11, 8),
      sorter: (a, b) => {
        const startA = dayjs(a.session_start);
        const endA = a.session_end ? dayjs(a.session_end) : dayjs();
        const durationA = endA.diff(startA, "minutes");
  
        const startB = dayjs(b.session_start);
        const endB = b.session_end ? dayjs(b.session_end) : dayjs();
        const durationB = endB.diff(startB, "minutes");
  
        return durationA - durationB;
      },
    },
  ];  

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.text("Student Session Records Report", 105, 15, { align: "center" });
    
    let filterText = "";
    if (filters.courseYear !== "All" && filters.courseYear !== "Year Level") filterText += `Course: ${filters.course.toUpperCase()}  `;
    if (filters.courseYear !== "All" && filters.courseYear !== "Course") filterText += `Year Level: ${filters.yearlevel}  `;
    if (filters.purpose !== "All") filterText += `Purpose: ${filters.purpose}  `;
    if (filters.date !== "All") filterText += `Date: ${filters.date}  `;
    
    if (filterText) {
      doc.text(filterText, 16, 25);
    }

    const tableColumn = ["ID No.", "Name", "Course", "Year Level", "Email", "Purpose", "Room No.", "Session Start", "Time Used"];
    const tableRows = filteredRecords.map(record => [
      record.idno || "",
      `${record.firstname ? record.firstname.charAt(0).toUpperCase() + record.firstname.slice(1) : ""} ${record.midname ? record.midname.charAt(0).toUpperCase() + '.' : ''} ${record.lastname ? record.lastname.charAt(0).toUpperCase() + record.lastname.slice(1) : ""}`,
      record.course ? record.course.toUpperCase() : "",
      formatYearLevel(record.yearlevel),
      record.email || "",
      record.purpose ? (record.purpose.startsWith("Other:") ? "Other" : record.purpose.toUpperCase()) : "",
      record.room_no || "",
      record.session_start ? dayjs(record.session_start).format("MM/DD/YYYY hh:mm A") : "",
      formatRunningTime(record.session_start, record.session_end)
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: filterText ? 30 : 20,
      styles: { overflow: 'linebreak' },
      columnStyles: { 1: { cellWidth: 'wrap' } },
      margin: { top: 20 },
      didDrawPage: function (data) {
        doc.text("Student Session Records Report", 105, 15, { align: "center" });
      },
    });
    
    doc.save("Student_Session_Report.pdf");
  };

  return (
    <div>
      <Sidebar />
      <div className="ml-20 mt-6">
        <Title level={2} className="text-center">Student Session Records</Title>
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
        <div className="p-4">
          <Table columns={columns} dataSource={filteredRecords} pagination={{ pageSize: pageSize }} rowKey="idno" />
        </div>
      </div>
    </div>
  );
}
