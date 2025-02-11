// App.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './App.css';

// Material UI imports for the summary list in the calendar section
import { List, ListItem, ListItemText, Typography } from '@mui/material';

// -----------------------
// BookCover Component
// -----------------------
function BookCover({ onOpen }) {
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer bg-cover bg-center"
      style={{
        transformOrigin: 'left center',
        backgroundImage: "url('/book.png')"
      }}
      initial={{ rotateY: 0 }}
      animate={isAnimating ? { rotateY: -150 } : { rotateY: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      onClick={() => {
        if (!isAnimating) {
          setIsAnimating(true);
        }
      }}
      onAnimationComplete={() => {
        if (isAnimating) {
          onOpen();
        }
      }}
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

  return (
    <div className="min-h-screen bg-pink-100 flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-3xl h-[800px] bg-white shadow-xl rounded-lg overflow-hidden"
        style={{ perspective: '1200px' }}
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
              <div className="mt-4">
                <div className="flex space-x-4 mb-4">
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
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: '',
    content: ''
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/journal?date=${formData.date}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEntries(res.data);
      } catch (error) {
        console.error('Error fetching journal entries:', error);
      }
    };
    fetchEntries();
  }, [formData.date, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/journal', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await axios.get(
        `http://localhost:5001/api/journal?date=${formData.date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEntries(res.data);
      setFormData({ ...formData, title: '', content: '' });
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  return (
    <div className="text-gray-800">
      <h2 className="text-2xl font-semibold mb-4">Journal</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full"
            required
          />
        </div>
        <button type="submit" className="bg-pink-500 text-white px-4 py-2 rounded">
          Save Journal Entry
        </button>
      </form>
      <div>
        <h3 className="text-xl font-semibold mb-2">Entries for {formData.date}</h3>
        {entries.length === 0 ? (
          <p>No entries for this date.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry._id} className="mb-4 p-4 border border-gray-200 rounded">
              <h4 className="font-bold">{entry.title}</h4>
              <p>{entry.content}</p>
            </div>
          ))
        )}
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
    date: new Date().toISOString().slice(0, 10)
  });
  const [events, setEvents] = useState([]);
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const token = localStorage.getItem('token');

  // Fetch events for the selected date
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const res = await axios.get(`http://localhost:5001/api/calendar?date=${dateStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(res.data);
        setCalendarEntry({ ...calendarEntry, date: dateStr });
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };
    fetchEvents();
  }, [selectedDate, token]);

  // Fetch events for the entire month (requires a new backend endpoint)
  useEffect(() => {
    const fetchMonthlyEvents = async () => {
      const month = selectedDate.toISOString().slice(0, 7); // e.g. "2025-02"
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
      setCalendarEntry({ ...calendarEntry, title: '', description: '' });
    } catch (error) {
      console.error('Error saving calendar event:', error);
    }
  };

  return (
    <div className="text-gray-800">
      <h2 className="text-2xl font-semibold mb-4">Calendar</h2>
      <div className="mb-6">
        <Calendar onChange={handleDateChange} value={selectedDate} />
      </div>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
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
      {/* Events for the selected day */}
      <div>
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
      {/* Monthly Upcoming Events Summary */}
      <div className="mt-6">
        <Typography variant="h6" component="h3">
          Upcoming Events This Month
        </Typography>
        {monthlyEvents.length === 0 ? (
          <Typography>No events scheduled for this month.</Typography>
        ) : (
          <List>
            {monthlyEvents.map((event) => (
              <ListItem key={event._id}>
                <ListItemText
                  primary={event.title}
                  secondary={`${event.date} - ${event.description}`}
                />
              </ListItem>
            ))}
          </List>
        )}
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
  const [selectedImage, setSelectedImage] = useState(null); // For zoom modal
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
    <div className="text-gray-800">
      <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
      <form onSubmit={handleUpload} className="mb-6 space-y-4">
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
      {/* Zoom Modal */}
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
