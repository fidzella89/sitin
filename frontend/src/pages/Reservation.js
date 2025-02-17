import React, { useState, useEffect } from "react";
import Sidebar from "../components/Student-Sidebar";
import MessageModal from "../components/MessageModal";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { motion } from "framer-motion";
import axios from "axios"; 

export default function Reservation() {
  const [modalMessage, setModalMessage] = useState("");  
  const [modalType, setModalType] = useState(""); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReservationDate, setReservationDate] = useState(new Date());
  const [quote, setQuote] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [purpose, setPurpose] = useState(""); 
  const [otherPurpose, setOtherPurpose] = useState(""); 
  const [selectedTime, setSelectedTime] = useState("");
  const [userId, setUserId] = useState("");
  const [userSessionNo, setSessionNo] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [maxHeight, setMaxHeight] = useState(getMaxHeight());

  useEffect(() => {
    const handleResize = () => {
      setMaxHeight(getMaxHeight());
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function getMaxHeight() {
    const width = window.innerWidth;
    if (width < 640) return "240px";  // Small screens
    if (width < 768) return "320px";  // Medium
    if (width < 1024) return "390px"; // Large
    if (width < 1280) return "500px"; // XL
    return "660px"; 
  }

  const quotes = [
    "Do what you can, with what you have, where you are. – Theodore Roosevelt",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Success doesn’t just find you. You have to go out and get it.",
    "The harder you work for something, the greater you’ll feel when you achieve it.",
    "Dream bigger. Do bigger.",
    "Don’t stop when you’re tired. Stop when you’re done.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "It’s going to be hard, but hard does not mean impossible.",
    "Don’t wait for opportunity. Create it.",
    "Sometimes later becomes never. Do it now.",
    "The secret of getting ahead is getting started. – Mark Twain",
    "Difficulties in life are intended to make us better, not bitter. – Dan Reeves",
    "Courage is resistance to fear, mastery of fear—not absence of fear. – Mark Twain",
    "Opportunities don't happen, you create them. – Chris Grosser",
    "Start where you are. Use what you have. Do what you can. – Arthur Ashe",
    "You don’t have to be great to start, but you have to start to be great. – Zig Ziglar",
    "Believe you can and you're halfway there. – Theodore Roosevelt",
    "Act as if what you do makes a difference. It does. – William James",
    "You are never too old to set another goal or to dream a new dream. – C.S. Lewis",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. – Winston Churchill",
    "The only way to do great work is to love what you do. – Steve Jobs",
    "Don't watch the clock; do what it does. Keep going. – Sam Levenson",
    "What lies behind us and what lies before us are tiny matters compared to what lies within us. – Ralph Waldo Emerson",
    "Doubt kills more dreams than failure ever will. – Suzy Kassem",
    "A journey of a thousand miles begins with a single step. – Lao Tzu",
    "Keep your face always toward the sunshine—and shadows will fall behind you. – Walt Whitman"
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  };

  // Update the quote when the page loads
  useEffect(() => {
    setQuote(getRandomQuote());
    const fetchUserId = async () => {
      const sessionResponse = await axios.get("http://localhost:8000/auth/check-session", {
        withCredentials: true,
      });

      const username = sessionResponse.data.user.username;
      const userResponse = await axios.get(`http://localhost:8000/students/${username}`);
      setUserId(userResponse.data.idno); 
      setSessionNo(userResponse.data.session_no);
    };
    fetchUserId();
  }, []);

  const year = new Date().getFullYear();
  const country = "PH"; 
  const apiKey = "749TUP1Xpj8xkWuptnp1WfvfBm2kWivH"; 
  const [reservations, setReservations] = useState([]);
  const [displayText, setDisplayText] = useState("");
  const [displayHolidayTitle, setHolidayTitle] = useState("");
  const [displayHolidayDesc, setHolidayDesc] = useState("");
  const [textColor, setTextColor] = useState("text-gray-600 text-center italic");

  useEffect(() => {
    if (!userId || !selectedDate) return; // Prevent execution if userId is empty
  
    async function fetchReservations() {
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const response = await axios.get(`http://localhost:8000/students/reservations/${userId}/${formattedDate}`);
        setReservations(response.data.reservations);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        setReservations([]);
        setDisplayText("Error fetching reservations");
      }
    }
  
    fetchReservations();
  }, [userId, selectedDate]); // Add userId as a dependency  

  const Loadlist = async ()  => {
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(`http://localhost:8000/students/reservations/${userId}/${formattedDate}`);
      setReservations(response.data.reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setReservations([]);
      setDisplayText("Error fetching reservations");
    }
  }

  useEffect(() => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const isSunday = selectedDate.getDay() === 0;
    const holiday = holidays.find(h => h.date === formattedDate);
  
    if (isSunday) {
      setDisplayText("No Working day - Sunday");
      setTextColor("text-red-600");
    } else if (holiday) {
      setDisplayText("Holiday");
      setTextColor("text-green-600 mt-2");
      setHolidayTitle(holiday.name);
      setHolidayDesc(holiday.description);
    } else {
      setDisplayText();
      setHolidayTitle();
      setHolidayDesc();
    }
  }, [selectedDate, holidays]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const currentYear = new Date().getFullYear(); 
        const yearsToFetch = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i); 
  
        let allHolidays = [];
  
        for (const year of yearsToFetch) {
          const response = await axios.get(
            `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${country}&year=${year}`
          );
  
          const yearHolidays = response.data.response.holidays
            .filter((holiday) => holiday.locations.includes("All")) 
            .map((holiday) => ({
              date: holiday.date.iso, 
              name: holiday.name, 
              description: holiday.description, 
            }));
  
          allHolidays = [...allHolidays, ...yearHolidays];
        }
  
        setHolidays(allHolidays);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
  
    fetchHolidays();
  }, []);  

  // Function to disable Sundays & holidays
  const isDateDisabled = ({ date }) => {
    const isSunday = date.getDay() === 0; 
    const formattedDate = format(date, "yyyy-MM-dd"); 
    const isHoliday = holidays.some((holiday) => holiday.date === formattedDate);
  
    return isSunday || isHoliday;
  };  

  const resetForm = () => {
    setReservationDate(new Date());
    setPurpose("");
    setOtherPurpose("");
    setSelectedTime("");
  };

  const handleReserve = async () => {
    setIsSubmitting(true); 
    const reservationDate = format(selectedReservationDate, "yyyy-MM-dd");
    const reservationTime = selectedTime;
    if (!selectedTime || !selectedReservationDate || !purpose || (purpose === "other" && !otherPurpose)){
        setModalMessage("Fields can't be empty. Please fill required Fields.");
        setShowMessageModal(true);
        setIsSubmitting(false);
        return;
      } 
    const reservationData = {
      student_id: userId,
      purpose: purpose === "other" ? "Other: " + otherPurpose : purpose,
      reservation_date: reservationDate,
      reservation_time: reservationTime,
    };
  
    try {
      await axios.post("http://localhost:8000/students/reserve", reservationData);
      setModalMessage("Your Reservation Submitted Successfully.");
      setModalType("success");
      setShowMessageModal(true);
      resetForm();
      setShowModal(false);
      setSelectedDate(selectedDate);
      Loadlist();
    } catch (error) {
      setModalMessage("Something went wrong. Please try again later.");
      setModalType("error");
      setShowMessageModal(true);
    } finally {
      setIsSubmitting(false);  
    }
  };  

  // Time options for reservation
  const timeOptions = [
    "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
    "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM",
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-green-400 to-blue-500">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 transition-all ml-16 md:ml-28 flex flex-col md:flex-row gap-6">
        {/* Calendar Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 w-full md:w-3/5">
          <div className="flex justify-between items-center">
            <h1 className="font-semibold text-base">Remaining Session: {userSessionNo || 0}</h1>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-blue-700 text-white py-2 px-4 rounded-lg"
              onClick={() => setShowModal(true)}
            >
              Reserve Now
            </motion.button>
          </div>
          
          <h2 className="text-3xl font-semibold text-center text-purple-700 mb-4">Calendar</h2>
          <Calendar
            onChange={(date) => setSelectedDate(date)}
            value={selectedDate}
            className="mx-auto border border-gray-300 rounded-lg p-4 shadow-md"
          />

          {/* Animated Motivational Quote */}
          <motion.div 
            className="mt-6 p-4 text-center bg-green-50 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            key={quote}
          >
            <p className="text-blue-700 font-medium italic">"{quote}"</p>
          </motion.div>
        </div>

        {/* Reservation List Section */}
        <motion.div
          className="bg-white shadow-lg rounded-lg p-6 w-full md:w-2/5 overflow-y-auto max-h-[400px] relative"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl text-center font-semibold text-gray-800 mb-4 mt-2">
            Reservations for {format(selectedDate, "PPP, EEEE")}
          </h2>

          {/* Reservation List */}
          <div
            className="mt-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200
                      max-h-60 sm:max-h-80 md:max-h-96 lg:max-h-[800px] xl:max-h-[900px]" style={{ maxHeight }}
          >
            {reservations.length === 0 ? (
              <motion.p 
                className="text-gray-500 text-center italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                No reservations
              </motion.p>
            ) : (
              reservations.map((res, index) => (
                <motion.div 
                  key={index}
                  className="p-4 bg-blue-100 rounded-lg shadow-md border-l-4 border-blue-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <p className="text-blue-800 font-semibold">Time: {res.time}</p>
                  <p className="text-black-600 font-semibold">Purpose: {res.purpose}</p>
                  <p className="text-gray-600">Status: {res.status.charAt(0).toUpperCase() + res.status.slice(1).toLowerCase()}</p>
                  {res.status === 'DECLINED' && (
                    <p>Reason: <span className="text-red-600 text-base">{res.declined_reason.charAt(0).toUpperCase() + res.declined_reason.slice(1).toLowerCase()}</span></p>
                  )}
                </motion.div>
              ))
            )}
          </div>
          
          {/* Show holiday or Sunday notice */}
          {displayText && (
            <motion.p
              className={`text-center text-lg font-bold ${textColor} transition-all whitespace-pre-line`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {displayText}

            </motion.p>  
          )}
          {displayHolidayTitle && (<motion.p
              className="text-red-400 text-lg text-center font-bold mt-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
          >
              {displayHolidayTitle}
          </motion.p>)}
          {displayHolidayDesc && (<p className="text-gray-600 text-s italic text-center mt-1">{displayHolidayDesc}</p>)}
        </motion.div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full md:w-1/2">
            <h2 className="text-2xl font-semibold text-center mb-4">Reserve Your Session</h2>
            <div>
              <label className="block text-gray-700 mb-2 text-lg text-center">Select Date: {format(selectedReservationDate,"PPP")}</label>
              <Calendar
                onChange={(date) => setReservationDate(date)}
                value={selectedReservationDate}
                className="mx-auto border border-gray-300 rounded-lg p-4 shadow-md mt-2"
                tileDisabled={isDateDisabled}
              />
            </div>
            <h1 className="font-semibold text-base">Remaining Session: {userSessionNo || 0}</h1>
            <div className="mt-4">
              <label className="block text-gray-700 font-medium mb-2">Select Time</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="" className="text-gray-500">Select Time</option>
                {timeOptions.map((time, index) => (
                  <option key={index} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="" className="text-gray-500">Select Purpose</option>
                <option value="SYSARCH32">SYSARCH32</option>
                <option value="IMDBSYS32">IMDBSYS32</option>
                <option value="INPROG32">INPROG32</option>
                <option value="Other">Other</option>
              </select>

              {purpose === "other" && (
                <div className="mt-2">
                  <label className="block text-gray-700 font-medium mb-2">Other Purpose: (Please Specify)</label>
                  <input
                    type="text"
                    value={otherPurpose}
                    onChange={(e) => setOtherPurpose(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Enter purpose"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReserve}
                className={`bg-blue-700 text-white py-2 px-4 rounded-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        {showMessageModal && (
          <MessageModal title={modalType === "success" ? "Success" : modalType === "error" ? "Error" : "Information"} onClose={() => setShowMessageModal(false)}>
            <p>{modalMessage}</p>
          </MessageModal>
        )}
      </div> 
    </div> 
        
   
  );
}
