import React, { useState, useEffect } from "react";
import { Box, SimpleGrid, Heading, Text, Select, VStack } from '@chakra-ui/react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChakraProvider } from '@chakra-ui/react';
import Sidebar from "../components/Staff-Sidebar";
import axios from 'axios';

export default function StaffDashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [runningSessions, setRunningSessions] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [reservationData, setReservationData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [months, setMonths] = useState([]);

  useEffect(() => {
    const fetchMonths = async () => {
      const response = await axios.get('http://localhost:8000/dashboard/months');
      setMonths(response.data);
      if (response.data.length > 0) setSelectedMonth(response.data[0]);
    };
    fetchMonths();
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    const fetchData = async () => {
      const students = await axios.get('http://localhost:8000/dashboard/students/count');
      const sessions = await axios.get(`http://localhost:8000/dashboard/sessions/completed?month=${selectedMonth}`);
      const running = await axios.get('http://localhost:8000/dashboard/sessions/running');
      const line = await axios.get(`http://localhost:8000/dashboard/sessions/graph?month=${selectedMonth}`);
      const reservations = await axios.get(`http://localhost:8000/dashboard/reservations/graph?month=${selectedMonth}`);

      setStudentCount(students.data.count);
      setSessionsCompleted(sessions.data.count);
      setRunningSessions(running.data);
      setLineData(line.data);
      setReservationData(reservations.data);
    };
    fetchData();
  }, [selectedMonth]);

  const COLORS = ['#3182CE'];

  return (<ChakraProvider>
    <div className="ml-20">
      <Sidebar />
      <VStack spacing={5} p={5}>
        <SimpleGrid columns={3} spacing={5} w="full">
          <Box bg="white" p={5} shadow="md" borderRadius="lg">
            <Heading size="md">Students</Heading>
            <PieChart width={200} height={200}>
              <Pie data={[{ name: 'Students', value: studentCount }]} cx="50%" cy="50%" outerRadius={80} fill="#3182CE" label>
                <Cell key={`cell-0`} fill={COLORS[0]} />
              </Pie>
              <Tooltip />
            </PieChart>
          </Box>
          <Box bg="white" p={5} shadow="md" borderRadius="lg">
            <Heading size="md">Completed Sessions</Heading>
            <Select mb={3} onChange={(e) => setSelectedMonth(e.target.value)} value={selectedMonth}>
              {months.map((month, idx) => (
                <option key={idx} value={month}>{month}</option>
              ))}
            </Select>
            <PieChart width={200} height={200}>
              <Pie data={[{ name: 'Sessions', value: sessionsCompleted }]} cx="50%" cy="50%" outerRadius={80} fill="#3182CE" label>
                <Cell key={`cell-1`} fill={COLORS[0]} />
              </Pie>
              <Tooltip />
            </PieChart>
          </Box>
          <Box bg="white" p={5} shadow="md" borderRadius="lg">
            <Heading size="md">Running Sessions</Heading>
            {runningSessions.map((item, index) => (
              <Text key={index}>{item.room_no}: {item.count}</Text>
            ))}
          </Box>
        </SimpleGrid>
        <SimpleGrid columns={2} spacing={5} w="full">
          <Box bg="white" p={5} shadow="md" borderRadius="lg">
            <Heading size="md">Sessions Over Time</Heading>
            <Select mb={3} onChange={(e) => setSelectedMonth(e.target.value)} value={selectedMonth}>
              {months.map((month, idx) => (
                <option key={idx} value={month}>{month}</option>
              ))}
            </Select>
            <LineChart width={500} height={300} data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sessions" stroke="#3182CE" />
            </LineChart>
          </Box>
          <Box bg="white" p={5} shadow="md" borderRadius="lg">
            <Heading size="md">Reservations</Heading>
            <LineChart width={500} height={300} data={reservationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="approved" stroke="#38A169" />
              <Line type="monotone" dataKey="declined" stroke="#E53E3E" />
            </LineChart>
          </Box>
        </SimpleGrid>
      </VStack>
    </div></ChakraProvider>
  );
};
