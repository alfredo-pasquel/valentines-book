// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import { Typography, Button } from '@mui/material';

/* 
  Helper: Get local date string in "YYYY-MM-DD" format.
  This version subtracts the timezone offset so that "today" matches local time.
*/
const getLocalDateString = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().split('T')[0];
};

// -----------------------
// BookCover Component
// -----------------------
function BookCover({ onOpen }) {
  const [isAnimating, setIsAnimating] = useState(false);
  return (
    <motion.div
      className="absolute inset-0 cursor-pointer bg-contain bg-center bg-no-repeat"
      style={{
        transformOrigin: 'left center',
        backgroundImage: "url('/book.png')"
      }}
      initial={{ rotateY: 0 }}
      animate={isAnimating ? { rotateY: -150 } : { rotateY: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      onClick={() => { if (!isAnimating) setIsAnimating(true); }}
      onAnimationComplete={() => { if (isAnimating) onOpen(); }}
    />
  );
}

// -----------------------
// Main App Component
// -----------------------
export default function App({ onLogout }) {
  const [isBookOpen, setBookOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Journal');
  const sections = ['Journal', 'Calendar', 'Gallery'];

  // Global Axios interceptor for 401 errors.
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          onLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [onLogout]);

  // Listen for custom "switchSection" events.
  useEffect(() => {
    const handleSwitchSection = (e) => {
      setActiveSection(e.detail);
    };
    window.addEventListener('switchSection', handleSwitchSection);
    return () => window.removeEventListener('switchSection', handleSwitchSection);
  }, []);

  return (
    <div className="min-h-screen bg-pink-100 flex items-center justify-center p-4">
      {/* Book container with papyrus-like interior */}
      <div
        className="relative w-full max-w-3xl h-[800px] shadow-xl rounded-lg overflow-hidden"
        style={{ perspective: '1200px', backgroundColor: '#F5ECD9' }}
      >
        <AnimatePresence>
          {!isBookOpen && <BookCover onOpen={() => setBookOpen(true)} />}
        </AnimatePresence>
        <AnimatePresence>
          {isBookOpen && (
            <motion.div
              className="relative p-6 h-full overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, y: 20 }}
            >
              {/* Header with Close and Logout buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setBookOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
                <button
                  onClick={onLogout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
              <div className="mt-4 text-center">
                {/* Centered tab buttons */}
                <div className="flex justify-center space-x-4 mb-4">
                  {sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`px-4 py-2 rounded-md transition-colors duration-300 ${
                        activeSection === section
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <AnimatePresence exitBeforeEnter>
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.5 } }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {activeSection === 'Journal' && <JournalSection />}
                    {activeSection === 'Calendar' && <CalendarSection />}
                    {activeSection === 'Gallery' && <GallerySection />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// -----------------------
// Journal Section Component
// -----------------------
function JournalSection() {
  // Shared journal entry per day (no title)
  const currentUser = localStorage.getItem('username') || 'alfredo';
  const defaultColor = currentUser === 'alfredo' ? 'blue' : 'purple';
  const [journal, setJournal] = useState({
    date: getLocalDateString(new Date()),
    content: ''
  });
  const token = localStorage.getItem('token');
  const autoSaveTimer = useRef(null);

  // Generate dates for the current month only
  const getMonthDates = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    for (let d = firstDay.getDate(); d <= lastDay.getDate(); d++) {
      const newDate = new Date(year, month, d);
      dates.push(getLocalDateString(newDate));
    }
    return dates;
  };
  const monthDates = getMonthDates(journal.date);

  // Header helpers
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Fetch journal entry for current date
  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/journal?date=${journal.date}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetchedContent = res.data.content || '';
        setJournal(prev => ({ ...prev, content: fetchedContent }));
      } catch (error) {
        console.error('Error fetching journal entry:', error);
      }
    };
    fetchJournal();
  }, [journal.date, token]);

  // Listen for "goToJournal" events (e.g., from CalendarSection)
  useEffect(() => {
    const handleGoToJournal = (e) => {
      setJournal(prev => ({ ...prev, date: e.detail }));
    };
    window.addEventListener('goToJournal', handleGoToJournal);
    return () => window.removeEventListener('goToJournal', handleGoToJournal);
  }, []);

  // Debounced auto-save
  const autoSave = (newContent) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await axios.post('http://localhost:5001/api/journal',
          { date: journal.date, content: newContent },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Error auto-saving journal entry:', error);
      }
    }, 1000);
  };

  const handleInput = (e) => {
    const newContent = e.target.innerHTML;
    setJournal(prev => ({ ...prev, content: newContent }));
    autoSave(newContent);
  };

  // Draggable horizontal date bar
  const buttonWidth = 60; // in pixels
  const buttonGap = 8;    // in pixels
  const totalSpace = buttonWidth + buttonGap;
  // Calculate the draggable width for the current month
  const dragConstraint = { left: -(monthDates.length * totalSpace - 800), right: 0 };

  // onDrag: update journal date continuously as the user drags.
  const handleDrag = (event, info) => {
    const offsetX = info.offset.x; // negative if dragged left
    const indexOffset = Math.round(-offsetX / totalSpace);
    let newIndex = indexOffset;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= monthDates.length) newIndex = monthDates.length - 1;
    const newDate = monthDates[newIndex];
    if (newDate !== journal.date) {
      setJournal(prev => ({ ...prev, date: newDate }));
    }
  };

  // Month navigation controls
  const goToPrevMonth = () => {
    const d = new Date(journal.date);
    d.setMonth(d.getMonth() - 1);
    setJournal(prev => ({ ...prev, date: getLocalDateString(d) }));
  };
  const goToNextMonth = () => {
    const d = new Date(journal.date);
    d.setMonth(d.getMonth() + 1);
    setJournal(prev => ({ ...prev, date: getLocalDateString(d) }));
  };
  const goToToday = () => {
    setJournal(prev => ({ ...prev, date: getLocalDateString(new Date()) }));
  };

  // Button in Journal to jump to the corresponding Calendar entry.
  const goToCalendar = () => {
    window.dispatchEvent(new CustomEvent('setCalendarDate', { detail: journal.date }));
    window.dispatchEvent(new CustomEvent('switchSection', { detail: 'Calendar' }));
  };

  return (
    <div className="text-center text-gray-800">
      <h2 className="text-2xl font-semibold mb-2">
        Journal for {formatDate(journal.date)} – {getDayName(journal.date)}
      </h2>
      {/* Month navigation controls */}
      <div className="flex justify-center items-center space-x-4 mb-2">
        <Button variant="outlined" onClick={goToPrevMonth}>Prev Month</Button>
        <Typography variant="subtitle1">
          {new Date(journal.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        <Button variant="outlined" onClick={goToNextMonth}>Next Month</Button>
      </div>
      {/* Today button */}
      <div className="mb-2">
        <Button variant="contained" color="success" onClick={goToToday}>Today</Button>
      </div>
      {/* "Go to Calendar" button */}
      <div className="mb-2">
        <Button variant="contained" color="primary" onClick={goToCalendar}>
          Go to Calendar for This Day
        </Button>
      </div>
      {/* Animated content area with thicker border for page-turn effect */}
      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={journal.date}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0, transition: { duration: 0.5 } }}
          exit={{ opacity: 0, rotateY: -90, transition: { duration: 0.5 } }}
        >
          <div
            contentEditable
            onInput={handleInput}
            className="w-full p-4 border-2 border-gray-600 rounded overflow-y-auto focus:outline-none mx-auto"
            style={{
              backgroundColor: '#F5ECD9',
              textAlign: 'left',
              fontSize: '1.125rem',
              height: '40vh',
              color: defaultColor
            }}
          />
        </motion.div>
      </AnimatePresence>
      {/* Draggable horizontal date bar (without native scrollbar) */}
      <div className="mt-4 overflow-hidden" style={{ width: '100%' }}>
        <motion.div
          drag="x"
          dragConstraints={dragConstraint}
          dragElastic={0.2}
          onDrag={handleDrag}
          className="flex space-x-2"
          style={{ width: monthDates.length * totalSpace }}
        >
          {monthDates.map((dateStr) => (
            <button
              key={dateStr}
              onClick={() => setJournal(prev => ({ ...prev, date: dateStr }))}
              className={`px-3 py-1 rounded ${
                dateStr === journal.date
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              style={{ minWidth: buttonWidth }}
            >
              {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// -----------------------
// Calendar Section Component
// -----------------------
function CalendarSection() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEntry, setCalendarEntry] = useState({
    title: '',
    description: '',
    date: getLocalDateString(new Date())
  });
  const [events, setEvents] = useState([]);
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const dateStr = getLocalDateString(selectedDate);
        const res = await axios.get(`http://localhost:5001/api/calendar?date=${dateStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(res.data);
        setCalendarEntry(prev => ({ ...prev, date: dateStr }));
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };
    fetchEvents();
  }, [selectedDate, token]);

  useEffect(() => {
    const fetchMonthlyEvents = async () => {
      const month = getLocalDateString(selectedDate).slice(0, 7);
      try {
        const res = await axios.get(`http://localhost:5001/api/calendar/month?month=${month}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMonthlyEvents(res.data);
      } catch (error) {
        console.error('Error fetching monthly events:', error);
      }
    };
    fetchMonthlyEvents();
  }, [selectedDate, token]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleChange = (e) => {
    setCalendarEntry({ ...calendarEntry, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/calendar', calendarEntry, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await axios.get(`http://localhost:5001/api/calendar?date=${calendarEntry.date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
      setCalendarEntry(prev => ({ ...prev, title: '', description: '' }));
    } catch (error) {
      console.error('Error saving calendar event:', error);
    }
  };

  // Listen for "setCalendarDate" events from JournalSection.
  useEffect(() => {
    const handleSetCalendarDate = (e) => {
      setSelectedDate(new Date(e.detail));
    };
    window.addEventListener('setCalendarDate', handleSetCalendarDate);
    return () => window.removeEventListener('setCalendarDate', handleSetCalendarDate);
  }, []);

  // "Go to Journal" button
  const goToJournal = () => {
    window.dispatchEvent(new CustomEvent('goToJournal', { detail: calendarEntry.date }));
    window.dispatchEvent(new CustomEvent('switchSection', { detail: 'Journal' }));
  };

  return (
    <div className="text-center text-gray-800">
      <h2 className="text-2xl font-semibold mb-4">Calendar</h2>
      <div className="mb-6 flex justify-center">
        <Calendar onChange={handleDateChange} value={selectedDate} />
      </div>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4 mx-auto max-w-md">
        <div>
          <label className="block mb-1">Event Title</label>
          <input
            type="text"
            name="title"
            value={calendarEntry.title}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea
            name="description"
            value={calendarEntry.description}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full"
            required
          />
        </div>
        <button type="submit" className="bg-pink-500 text-white px-4 py-2 rounded">
          Save Calendar Event
        </button>
      </form>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Events for {calendarEntry.date}</h3>
        {events.length === 0 ? (
          <p>No events for this date.</p>
        ) : (
          events.map((event) => (
            <div key={event._id} className="mb-4 p-4 border border-gray-200 rounded">
              <h4 className="font-bold">{event.title}</h4>
              <p>{event.description}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-6">
        <Typography variant="h6" component="h3">
          Upcoming Events This Month
        </Typography>
        {monthlyEvents.length === 0 ? (
          <Typography>No events scheduled for this month.</Typography>
        ) : (
          <div>
            {monthlyEvents.map((event) => (
              <div key={event._id} className="mb-2">
                <Typography variant="body1">
                  {event.title} – {event.date} : {event.description}
                </Typography>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4">
        <Button variant="contained" color="success" onClick={goToJournal}>
          Go to Journal for This Day
        </Button>
      </div>
    </div>
  );
}

// -----------------------
// Gallery Section Component with Zoom Functionality
// -----------------------
function GallerySection() {
  const [imageFile, setImageFile] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/gallery', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setImages(res.data);
      } catch (error) {
        console.error('Error fetching gallery images:', error);
      }
    };
    fetchImages();
  }, [token]);

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('description', description);
    try {
      await axios.post('http://localhost:5001/api/gallery/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const res = await axios.get('http://localhost:5001/api/gallery', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImages(res.data);
      setImageFile(null);
      setDescription('');
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div className="text-center text-gray-800">
      <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
      <form onSubmit={handleUpload} className="mb-6 space-y-4 mx-auto max-w-md">
        <div>
          <label className="block mb-1">Image</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full"
            accept="image/*"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full"
            required
          />
        </div>
        <button type="submit" className="bg-pink-500 text-white px-4 py-2 rounded">
          Upload Image
        </button>
      </form>
      <div className="grid grid-cols-2 gap-4">
        {images.map((img) => (
          <div 
            key={img._id} 
            className="border border-gray-200 rounded p-2 cursor-pointer"
            onClick={() => setSelectedImage(img.url)}
          >
            <img src={img.url} alt={img.description || 'Gallery image'} className="w-full h-auto" />
            {img.description && <p className="mt-2 text-sm">{img.description}</p>}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              src={selectedImage}
              alt="Zoomed"
              className="max-w-full max-h-full"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
