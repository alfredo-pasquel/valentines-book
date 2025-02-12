// App.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect
} from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate
} from 'framer-motion';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import { Typography, Button } from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

/* 
  Helper: Get local date string in "YYYY-MM-DD" format.
  Adjusts for timezone offsets so that the date reflects your local time.
*/
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

/* 
  BOOK COVER COMPONENT 
  Animates on open (0° → –150°) and on close (reverse).
*/
function BookCover({ onComplete, mode = 'open' }) {
  const [trigger, setTrigger] = useState(mode === 'open' ? false : true);
  const handleClick = () => {
    if (mode === 'open' && !trigger) {
      setTrigger(true);
    }
  };
  return (
    <motion.div
      className="absolute inset-0 cursor-pointer bg-contain bg-center bg-no-repeat"
      style={{ transformOrigin: 'left center', backgroundImage: "url('/book.png')" }}
      initial={mode === 'open' ? { rotateY: 0 } : { rotateY: -150 }}
      animate={trigger ? (mode === 'open' ? { rotateY: -150 } : { rotateY: 0 }) : {}}
      transition={{ duration: 1, ease: 'easeInOut' }}
      onClick={handleClick}
      onAnimationComplete={() => {
        if (trigger) onComplete();
      }}
    />
  );
}

/* 
  MAIN APP COMPONENT 
  Uses useLocation to sync the active section with the URL.
  Hides underlying content when the book is closing.
*/
export default function App({ onLogout }) {
  const [isBookOpen, setBookOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeSection, setActiveSection] = useState('Journal');
  const sections = ['Journal', 'Calendar', 'Gallery'];

  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/calendar')) {
      setActiveSection('Calendar');
    } else if (location.pathname.startsWith('/journal')) {
      setActiveSection('Journal');
    } else if (location.pathname.startsWith('/gallery')) {
      setActiveSection('Gallery');
    }
  }, [location.pathname]);

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

  return (
    <div className="min-h-screen bg-pink-100 flex items-center justify-center p-4">
      {/* Book container with fixed height */}
      <div
        className="relative w-full max-w-3xl h-[1000px] shadow-xl rounded-lg overflow-hidden"
        style={{ perspective: '1200px', backgroundColor: '#F5ECD9' }}
      >
        <AnimatePresence>
          {!isBookOpen && !isClosing && (
            <BookCover onComplete={() => setBookOpen(true)} mode="open" />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isBookOpen && (
            <motion.div
              className="relative p-6 h-full overflow-hidden"
              style={isClosing ? { visibility: 'hidden' } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.5 } }}
            >
              {/* Header with Close and Logout buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setIsClosing(true)}
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
                <AnimatePresence mode="wait" exitBeforeEnter>
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
        {isClosing && (
          <BookCover
            mode="close"
            onComplete={() => {
              setBookOpen(false);
              setIsClosing(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

/* 
  JOURNAL SECTION COMPONENT 
  • Uses a continuous “page‐turn” animation with two layers:
      – The bottom layer shows the preview page (read–only).
      – The top (editable) layer shows the current (committed) page and rotates based on the drag.
  • This fixes the issue where the page turn only happened after releasing the drag and
    prevents the text from disappearing in the textbox after a page change.
*/
function JournalSection() {
  const navigate = useNavigate();
  const params = useParams();
  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username') || 'alfredo';
  const defaultColor = currentUser === 'alfredo' ? 'blue' : 'purple';

  const initialDate = getLocalDateString(new Date());
  const initialIndex = new Date().getDate() - 1;

  const [committedDate, setCommittedDate] = useState(params.date || initialDate);
  const [selectedIndex, setSelectedIndex] = useState(
    params.date ? new Date(params.date + 'T00:00').getDate() - 1 : initialIndex
  );
  const [journalCache, setJournalCache] = useState({});
  // Track focus so we don't update content while the user is editing.
  const [isFocused, setIsFocused] = useState(false);

  // For the page-turn drag, we now use a motion value.
  const pageTurnValue = useMotionValue(0);
  const rotateY = useTransform(pageTurnValue, (v) => v * -90);
  const pageOpacity = useTransform(pageTurnValue, (v) => 1 - v);

  useEffect(() => {
    if (params.date) {
      setCommittedDate(params.date);
      setSelectedIndex(new Date(params.date + 'T00:00').getDate() - 1);
    }
  }, [params.date]);

  // Compute dates for the month.
  const getMonthDates = (dateStr) => {
    const date = new Date(dateStr + 'T00:00');
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
  const monthDates = getMonthDates(committedDate);
  // The previewDate (the page underneath) is based on the continuously updated selectedIndex.
  const previewDate = monthDates[selectedIndex] || committedDate;

  // Refs for date bar and content.
  const dateBarRef = useRef(null);
  const dragX = useMotionValue(0);
  const buttonWidth = 60,
    buttonGap = 8,
    totalSpace = buttonWidth + buttonGap;
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    if (dateBarRef.current) {
      const containerWidth = dateBarRef.current.clientWidth;
      const initialOffset = containerWidth / 2 - (selectedIndex * totalSpace + buttonWidth / 2);
      dragX.set(initialOffset);
    }
  }, [dateBarRef, selectedIndex, totalSpace, buttonWidth]);

  // Fetch content for committedDate if not already cached.
  useEffect(() => {
    if (!journalCache[committedDate]) {
      axios
        .get(`http://localhost:5001/api/journal?date=${committedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setJournalCache((prev) => ({
            ...prev,
            [committedDate]: res.data.content || ''
          }));
        })
        .catch((err) => console.error('Error fetching journal entry:', err));
    }
    // Also prefetch the next day's content.
    if (selectedIndex < monthDates.length - 1) {
      const nextDate = monthDates[selectedIndex + 1];
      if (!journalCache[nextDate]) {
        axios
          .get(`http://localhost:5001/api/journal?date=${nextDate}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then((res) => {
            setJournalCache((prev) => ({
              ...prev,
              [nextDate]: res.data.content || ''
            }));
          })
          .catch((err) => console.error('Error fetching next journal entry:', err));
      }
    }
  }, [committedDate, selectedIndex, token, journalCache, monthDates]);

  // **UPDATED:** When not focused, update the top (editable) page content using committedDate.
  useEffect(() => {
    if (contentRef.current && !isFocused) {
      contentRef.current.innerHTML = journalCache[committedDate] || '';
    }
  }, [committedDate, journalCache, isFocused]);

  // Date bar drag: update continuous progress.
  const handleDateBarDrag = (event, info) => {
    if (dateBarRef.current) {
      const containerWidth = dateBarRef.current.clientWidth;
      const center = containerWidth / 2;
      const continuous = (center - dragX.get() - buttonWidth / 2) / totalSpace;
      const intPart = Math.floor(continuous);
      setSelectedIndex(intPart);
      // Update the motion value continuously.
      pageTurnValue.set(continuous - intPart);
    }
  };

  // On drag end, decide whether to commit to the next page.
  const handleDateBarDragEnd = (event, info) => {
    const currentPageTurn = pageTurnValue.get();
    let newIndex = selectedIndex;
    if (currentPageTurn > 0.5 && selectedIndex < monthDates.length - 1) {
      newIndex = selectedIndex + 1;
    }
    if (dateBarRef.current) {
      const containerWidth = dateBarRef.current.clientWidth;
      const newOffset = containerWidth / 2 - (newIndex * totalSpace + buttonWidth / 2);
      animate(dragX, newOffset, { type: 'spring', stiffness: 300, damping: 30 });
    }
    // Animate the page turn back to 0.
    animate(pageTurnValue, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setCommittedDate(monthDates[newIndex]);
    setSelectedIndex(newIndex);
    navigate('/journal/' + monthDates[newIndex]);
  };

  // When user types, update journalCache.
  const handleInput = (e) => {
    const newContent = e.target.innerHTML;
    // Save the content for the current committed page.
    setJournalCache((prev) => ({ ...prev, [committedDate]: newContent }));
    // (Auto-save logic could be added here.)
  };

  // Formatting helpers.
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  const getDayName = (dateStr) => {
    const date = new Date(dateStr + 'T00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Navigation functions.
  const goToPrevMonth = () => {
    const d = new Date(committedDate + 'T00:00');
    d.setMonth(d.getMonth() - 1);
    const newDate = getLocalDateString(d);
    setCommittedDate(newDate);
    setSelectedIndex(0);
    animate(pageTurnValue, 0, { duration: 0 }); // reset instantly
    navigate('/journal/' + newDate);
  };
  const goToNextMonth = () => {
    const d = new Date(committedDate + 'T00:00');
    d.setMonth(d.getMonth() + 1);
    const newDate = getLocalDateString(d);
    setCommittedDate(newDate);
    setSelectedIndex(0);
    animate(pageTurnValue, 0, { duration: 0 });
    navigate('/journal/' + newDate);
  };
  const goToToday = () => {
    const today = getLocalDateString(new Date());
    setCommittedDate(today);
    setSelectedIndex(new Date().getDate() - 1);
    animate(pageTurnValue, 0, { duration: 0 });
    navigate('/journal/' + today);
  };
  const jumpToCalendar = () => {
    navigate('/calendar/' + monthDates[selectedIndex]);
  };

  // Shared style for journal pages.
  const journalContentStyle = {
    backgroundColor: '#F5ECD9',
    textAlign: 'left',
    fontSize: '1.125rem',
    height: '500px',
    overflow: 'hidden',
    color: defaultColor,
    width: '100%',
    padding: '1rem',
    border: '2px solid #4B5563', // gray-600
    borderRadius: '0.375rem',
    margin: '0 auto'
  };

  return (
    <div className="text-center text-gray-800 relative" style={{ height: '700px' }}>
      <h2 className="text-2xl font-semibold mb-2">
        Journal for {formatDate(committedDate)} – {getDayName(committedDate)}
      </h2>
      <div className="flex justify-center items-center space-x-4 mb-2">
        <Button variant="outlined" onClick={goToPrevMonth}>Prev Month</Button>
        <Typography variant="subtitle1">
          {new Date(committedDate + 'T00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        <Button variant="outlined" onClick={goToNextMonth}>Next Month</Button>
      </div>
      <div className="mb-2">
        <Button variant="contained" color="success" onClick={goToToday}>Today</Button>
      </div>
      <div className="mb-2">
        <Button variant="contained" color="primary" onClick={jumpToCalendar}>
          Go to Calendar for This Day
        </Button>
      </div>
      {/* Journal content area with real-time page-turn animation */}
      <div style={{ position: 'relative', height: '500px' }}>
        {/* Bottom (preview) layer – read–only. Render only if previewDate differs from committedDate */}
        {previewDate !== committedDate && (
          <div
            className="journal-page bottom-page"
            style={{ ...journalContentStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            // Using dangerouslySetInnerHTML to render HTML content.
            dangerouslySetInnerHTML={{ __html: journalCache[previewDate] || '' }}
          />
        )}
        {/* Top (editable) layer – rotates based on drag. */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            rotateY: rotateY,
            opacity: pageOpacity,
            transformOrigin: 'left center'
          }}
        >
          <div
            contentEditable
            ref={contentRef}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onInput={handleInput}
            suppressContentEditableWarning={true}
            style={journalContentStyle}
          >
            {/* The content is injected via innerHTML in useEffect */}
          </div>
        </motion.div>
      </div>
      {/* Date bar rendered separately (no page-turn animation) */}
      <div className="overflow-hidden mt-2" ref={dateBarRef}>
        <motion.div
          drag="x"
          dragConstraints={{
            left:
              -(monthDates.length * totalSpace -
                (dateBarRef.current ? dateBarRef.current.clientWidth : 800)),
            right: 0
          }}
          dragElastic={0.2}
          style={{
            x: dragX,
            width: monthDates.length * totalSpace,
            display: 'flex',
            gap: `${buttonGap}px`
          }}
          onDrag={handleDateBarDrag}
          onDragEnd={handleDateBarDragEnd}
        >
          {monthDates.map((dateStr, i) => (
            <button
              key={dateStr}
              onClick={() => {
                setSelectedIndex(i);
                if (dateBarRef.current) {
                  const containerWidth = dateBarRef.current.clientWidth;
                  const newDragX = containerWidth / 2 - (i * totalSpace + buttonWidth / 2);
                  dragX.set(newDragX);
                }
                setCommittedDate(dateStr);
                // Reset page turn instantly.
                animate(pageTurnValue, 0, { duration: 0 });
                navigate('/journal/' + dateStr);
              }}
              className={`px-3 py-1 rounded ${
                i === selectedIndex ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              style={{ minWidth: buttonWidth }}
            >
              {new Date(dateStr + 'T00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* 
  CALENDAR SECTION COMPONENT 
  Reads an optional ":date" parameter from the URL.
  The "Go to Journal for This Day" button navigates to /journal/{date}.
*/
function CalendarSection() {
  const navigate = useNavigate();
  const params = useParams();

  const [selectedDate, setSelectedDate] = useState(
    params.date ? new Date(params.date + 'T00:00') : new Date()
  );
  const [calendarEntry, setCalendarEntry] = useState({
    title: '',
    description: '',
    date: getLocalDateString(new Date())
  });
  const [events, setEvents] = useState([]);
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (params.date) {
      setSelectedDate(new Date(params.date + 'T00:00'));
    }
  }, [params.date]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const dateStr = getLocalDateString(selectedDate);
        const res = await axios.get(`http://localhost:5001/api/calendar?date=${dateStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(res.data);
        setCalendarEntry((prev) => ({ ...prev, date: dateStr }));
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
    navigate('/calendar/' + getLocalDateString(date));
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
      setCalendarEntry((prev) => ({ ...prev, title: '', description: '' }));
    } catch (error) {
      console.error('Error saving calendar event:', error);
    }
  };

  useEffect(() => {
    const handleSetCalendarDate = (e) => {
      const parts = e.detail.split('-');
      const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      setSelectedDate(localDate);
      navigate('/calendar/' + getLocalDateString(localDate));
    };
    window.addEventListener('setCalendarDate', handleSetCalendarDate);
    return () => window.removeEventListener('setCalendarDate', handleSetCalendarDate);
  }, [navigate]);

  // "Go to Journal" button navigates to /journal/{selectedDate}
  const goToJournal = () => {
    const journalDate = getLocalDateString(selectedDate);
    navigate('/journal/' + journalDate);
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/calendar/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents((prev) => prev.filter((event) => event._id !== id));
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  };

  return (
    <div className="text-center text-gray-800 h-full overflow-hidden">
      <h2 className="text-2xl font-semibold mb-2">Calendar</h2>
      {/* Jump-to-Journal button */}
      <div className="mb-4">
        <Button variant="contained" color="primary" onClick={goToJournal}>
          Go to Journal for This Day
        </Button>
      </div>
      <div className="mb-6 flex justify-center">
        <Calendar onChange={handleDateChange} value={selectedDate} />
      </div>
      <form onSubmit={handleSubmit} className="mb-4 space-y-4 mx-auto max-w-md">
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
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Events for {calendarEntry.date}</h3>
        {events.length === 0 ? (
          <p>No events for this date.</p>
        ) : (
          events.map((event) => (
            <div key={event._id} className="mb-4 p-4 border border-gray-200 rounded flex justify-between items-start">
              <div>
                <h4 className="font-bold">{event.title}</h4>
                <p>{event.description}</p>
              </div>
              <button
                onClick={() => deleteEvent(event._id)}
                className="text-red-500 ml-4 font-bold"
                title="Delete event"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      <div className="mb-4">
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
    </div>
  );
}

/* 
  GALLERY SECTION COMPONENT (unchanged)
*/
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
