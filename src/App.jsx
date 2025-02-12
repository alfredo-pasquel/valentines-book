// App.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo
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
  Helper: Format a date string (YYYY-MM-DD) into a human-readable form.
  For example, "2025-02-14" becomes "February 14, 2025 – Friday"
*/
const formatCalendarDate = (dateString) => {
  const date = new Date(dateString + 'T00:00');
  const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', dateOptions);
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
      style={{
        transformOrigin: 'left center',
        backgroundImage: "url('/book.png')"
      }}
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
  Uses a continuous “page‐turn” animation with two layers:
    - The bottom layer shows the preview page (read–only).
    - The top (editable) layer shows the current (committed) page and rotates based on the drag.
  It includes:
    • Extra CSS (clipPath, willChange, translateZ(0)) to help prevent ghost/shadow artifacts.
    • A keydown handler that, when the user types in a region not marked with their user, splits the text and forces new input to be wrapped in a span with the proper color.
*/
function JournalSection() {
  const navigate = useNavigate();
  const params = useParams();
  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username');
  console.log(`current user ${currentUser}`);
  const defaultColor = currentUser === 'alfredo' ? 'blue' : 'purple';

  const initialDate = getLocalDateString(new Date());
  const initialIndex = new Date().getDate() - 1;

  const [committedDate, setCommittedDate] = useState(params.date || initialDate);
  const [selectedIndex, setSelectedIndex] = useState(
    params.date ? new Date(params.date + 'T00:00').getDate() - 1 : initialIndex
  );
  const [journalCache, setJournalCache] = useState({});
  const [isFocused, setIsFocused] = useState(false);

  // For the page-turn drag, we use a motion value.
  const pageTurnValue = useMotionValue(0);
  const rotateY = useTransform(pageTurnValue, (v) => v * -90);
  const pageOpacity = useTransform(pageTurnValue, (v) => 1 - v);

  useEffect(() => {
    if (params.date) {
      setCommittedDate(params.date);
      setSelectedIndex(new Date(params.date + 'T00:00').getDate() - 1);
    }
  }, [params.date]);

  // Memoize the month dates so they don’t change on every render.
  const memoizedMonthDates = useMemo(() => {
    const date = new Date(committedDate + 'T00:00');
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
  }, [committedDate]);

  // The previewDate (the page underneath) is based on the continuously updated selectedIndex.
  const previewDate = memoizedMonthDates[selectedIndex] || committedDate;

  // Refs for the date bar and the content.
  const dateBarRef = useRef(null);
  const dragX = useMotionValue(0);
  const buttonWidth = 60, buttonGap = 8, totalSpace = buttonWidth + buttonGap;
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
        .get(`https://valentines-book-backend.onrender.com/api/journal?date=${committedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setJournalCache(prev => ({
            ...prev,
            [committedDate]: res.data.content || ''
          }));
        })
        .catch((err) => console.error('Error fetching journal entry:', err));
    }
    // Also prefetch the next day's content.
    if (selectedIndex < memoizedMonthDates.length - 1) {
      const nextDate = memoizedMonthDates[selectedIndex + 1];
      if (!journalCache[nextDate]) {
        axios
          .get(`https://valentines-book-backend.onrender.com/api/journal?date=${nextDate}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then((res) => {
            setJournalCache(prev => ({
              ...prev,
              [nextDate]: res.data.content || ''
            }));
          })
          .catch((err) => console.error('Error fetching next journal entry:', err));
      }
    }
  }, [committedDate, selectedIndex, token, memoizedMonthDates]);
  // Note: journalCache is intentionally omitted from dependencies.

  // When not focused, update the top (editable) page content using committedDate.
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
    if (currentPageTurn > 0.5 && selectedIndex < memoizedMonthDates.length - 1) {
      newIndex = selectedIndex + 1;
    }
    if (dateBarRef.current) {
      const containerWidth = dateBarRef.current.clientWidth;
      const newOffset = containerWidth / 2 - (newIndex * totalSpace + buttonWidth / 2);
      animate(dragX, newOffset, { type: 'spring', stiffness: 300, damping: 30 });
    }
    // Animate the page turn back to 0.
    animate(pageTurnValue, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setCommittedDate(memoizedMonthDates[newIndex]);
    setSelectedIndex(newIndex);
    navigate('/journal/' + memoizedMonthDates[newIndex]);
  };

  // On input, update the journalCache without annotation (to avoid disturbing the caret).
  const handleInput = (e) => {
    const newContent = e.target.innerHTML;
    setJournalCache(prev => ({
      ...prev,
      [committedDate]: newContent
    }));
  };

  // NEW: On keyDown, if the caret is in a container whose data-user does not match the current user,
  // then split the content and force insertion into a new span with the proper color.
  const handleKeyDown = (e) => {
    // Ignore control keys
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      let range = selection.getRangeAt(0);
      let container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentNode;
      }
      if (container.getAttribute("data-user") !== currentUser) {
        // Create a new span for the current user.
        const newSpan = document.createElement("span");
        newSpan.setAttribute("data-user", currentUser);
        newSpan.style.color = currentUser === 'alfredo' ? 'blue' : 'purple';
        // Insert a zero-width space so that the caret can be positioned inside.
        newSpan.innerHTML = "&#8203;";
        range.deleteContents();
        range.insertNode(newSpan);
        // Move caret inside the new span after the zero-width space.
        const newRange = document.createRange();
        newRange.setStart(newSpan.firstChild, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };

  // Instead of wrapping entire blocks on blur, we use our keyDown handler to force new input into a new span.
  // We still call this on blur to update the cache.
  const handleBlur = (e) => {
    const newContent = contentRef.current.innerHTML;
    setJournalCache(prev => ({
      ...prev,
      [committedDate]: newContent
    }));
    setIsFocused(false);
  };

  // AUTO–SAVE EFFECT:
  useEffect(() => {
    const contentToSave = journalCache[committedDate];
    if (contentToSave !== undefined) {
      const timer = setTimeout(() => {
        axios
          .post(
            'https://valentines-book-backend.onrender.com/api/journal',
            { date: committedDate, content: contentToSave },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .then((res) => {
            console.log('Auto-saved successfully', res.data);
          })
          .catch((err) => console.error('Error auto-saving journal entry:', err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [committedDate, token, journalCache[committedDate]]);

  // POLLING EFFECT:
  useEffect(() => {
    const pollInterval = setInterval(() => {
      axios
        .get(`https://valentines-book-backend.onrender.com/api/journal?date=${committedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          const fetchedContent = res.data.content || '';
          if (!isFocused && fetchedContent !== journalCache[committedDate]) {
            setJournalCache(prev => ({
              ...prev,
              [committedDate]: fetchedContent
            }));
            if (contentRef.current) {
              contentRef.current.innerHTML = fetchedContent;
            }
          }
        })
        .catch((err) => console.error('Error polling journal entry:', err));
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [committedDate, token, isFocused]);
  // Note: journalCache is intentionally omitted from dependencies.

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00');
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const getDayName = (dateStr) => {
    const date = new Date(dateStr + 'T00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const goToPrevMonth = () => {
    const d = new Date(committedDate + 'T00:00');
    d.setMonth(d.getMonth() - 1);
    const newDate = getLocalDateString(d);
    setCommittedDate(newDate);
    setSelectedIndex(0);
    animate(pageTurnValue, 0, { duration: 0 });
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
    navigate('/calendar/' + memoizedMonthDates[selectedIndex]);
  };

  const journalContentStyle = {
    backgroundColor: '#F5ECD9',
    textAlign: 'left',
    fontSize: '1.125rem',
    height: '500px',
    overflow: 'hidden',
    color: defaultColor,
    width: '100%',
    padding: '1rem',
    border: '2px solid #4B5563',
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
          {new Date(committedDate + 'T00:00').toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })}
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
      {/* Wrap the journal area in a container with perspective */}
      <div
        style={{
          position: 'relative',
          height: '500px',
          perspective: '1200px',
          overflow: 'hidden'
        }}
      >
        {previewDate !== committedDate && (
          <div
            className="journal-page bottom-page"
            style={{
              ...journalContentStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
            dangerouslySetInnerHTML={{ __html: journalCache[previewDate] || '' }}
          />
        )}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            rotateY: rotateY,
            opacity: pageOpacity,
            transformOrigin: 'left center',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            backgroundColor: '#F5ECD9',
            willChange: 'transform, opacity',
            clipPath: 'inset(0)',
            transform: 'translateZ(0)'
          }}
        >
          <div
            contentEditable
            ref={contentRef}
            onFocus={() => { setIsFocused(true); 
              document.execCommand('styleWithCSS', false, true);
              document.execCommand('foreColor', false, currentUser === 'alfredo' ? 'blue' : 'purple'); }}
            onBlur={handleBlur}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning={true}
            style={journalContentStyle}
          />
        </motion.div>
      </div>
      <div className="overflow-hidden mt-2" ref={dateBarRef}>
        <motion.div
          drag="x"
          dragConstraints={{
            left:
              -(memoizedMonthDates.length * totalSpace -
                (dateBarRef.current ? dateBarRef.current.clientWidth : 800)),
            right: 0
          }}
          dragElastic={0.2}
          style={{
            x: dragX,
            width: memoizedMonthDates.length * totalSpace,
            display: 'flex',
            gap: `${buttonGap}px`
          }}
          onDrag={handleDateBarDrag}
          onDragEnd={handleDateBarDragEnd}
        >
          {memoizedMonthDates.map((dateStr, i) => (
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
  The entire calendar section (calendar, new event fields, today's events, and upcoming events)
  is now scrollable vertically.
  Also, the heading is now formatted to be human readable.
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

  // Helper functions to fetch events
  const fetchCalendarEvents = async () => {
    const dateStr = getLocalDateString(selectedDate);
    try {
      const res = await axios.get(`https://valentines-book-backend.onrender.com/api/calendar?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
      setCalendarEntry(prev => ({ ...prev, date: dateStr }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const fetchMonthlyEvents = async () => {
    const month = getLocalDateString(selectedDate).slice(0, 7);
    try {
      const res = await axios.get(`https://valentines-book-backend.onrender.com/api/calendar/month?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMonthlyEvents(res.data);
    } catch (error) {
      console.error('Error fetching monthly events:', error);
    }
  };

  useEffect(() => {
    if (params.date) {
      setSelectedDate(new Date(params.date + 'T00:00'));
    }
  }, [params.date]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [selectedDate, token]);

  useEffect(() => {
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
      await axios.post('https://valentines-book-backend.onrender.com/api/calendar', calendarEntry, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCalendarEvents();
      await fetchMonthlyEvents();
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
      await axios.delete(`https://valentines-book-backend.onrender.com/api/calendar/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCalendarEvents();
      await fetchMonthlyEvents();
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  };

  return (
    // Make the outer container scrollable vertically with a fixed height (e.g. 80vh)
    <div className="text-center text-gray-800" style={{ height: '80vh', overflowY: 'auto' }}>
      <h2 className="text-2xl font-semibold mb-2">Calendar</h2>
      {/* Jump-to-Journal button */}
      <div className="mb-4">
        <Button variant="contained" color="primary" onClick={goToJournal}>
          Go to Journal for This Day
        </Button>
      </div>
      {/* Center the Calendar component */}
      <div className="mb-6" style={{ display: 'flex', justifyContent: 'center' }}>
        <Calendar onChange={handleDateChange} value={selectedDate} style={{ margin: '0 auto' }}/>
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
      {/* Today's events container */}
      <div className="mb-4 mx-auto" style={{ 
        maxWidth: '350px', 
        maxHeight: '300px', 
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch' 
        }}>
        {/* Use the helper to format the date */}
        <h3 className="text-xl font-semibold mb-2">Events for {formatCalendarDate(calendarEntry.date)}</h3>
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
      {/* Upcoming events container */}
      <div className="mb-4">
        <Typography variant="h6" component="h3">
          Upcoming Events This Month
        </Typography>
        {monthlyEvents.length === 0 ? (
          <Typography>No events scheduled for this month.</Typography>
        ) : (
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch' 
            }}>
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
  GALLERY SECTION COMPONENT 
  The gallery now displays images in a scrollable container (if there are many),
  and each image has a delete button ("×") so that you can remove images.
  We also added simple pagination: only a fixed number of images (e.g., 6) are shown per page.
*/
function GallerySection() {
  const [imageFile, setImageFile] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const token = localStorage.getItem('token');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 6;

  // Helper to fetch images.
  const fetchImages = async () => {
    try {
      const res = await axios.get('https://valentines-book-backend.onrender.com/api/gallery', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImages(res.data);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  };

  useEffect(() => {
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
      await axios.post('https://valentines-book-backend.onrender.com/api/gallery/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchImages();
      setImageFile(null);
      setDescription('');
      // Reset to page 1 after upload
      setCurrentPage(1);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const deleteImage = async (id) => {
    try {
      await axios.delete(`https://valentines-book-backend.onrender.com/api/gallery/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Calculate the current images to display.
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);
  const totalPages = Math.ceil(images.length / imagesPerPage);

  return (
    <div className="text-center text-gray-800">
      <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
      {/* Wrap the file input in a center-aligned div */}
      <form onSubmit={handleUpload} className="mb-6 space-y-4 mx-auto max-w-md">
        <div style={{ textAlign: 'center' }}>
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
      {/* Wrap the images grid in a scrollable container */}
      <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="grid grid-cols-2 gap-4">
        {currentImages.map((img) => (
          <div 
            key={img._id} 
            className="relative border border-gray-200 rounded p-2 cursor-pointer"
            onClick={() => setSelectedImage(img.url)}
          >
            <img src={img.url} alt={img.description || 'Gallery image'} className="w-full h-auto" />
            {img.description && <p className="mt-2 text-sm">{img.description}</p>}
            <button 
              onClick={(e) => { e.stopPropagation(); deleteImage(img._id); }}
              className="absolute top-0 right-0 bg-white text-red-500 rounded-full px-1"
              title="Delete image"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {/* Pagination controls */}
      <div className="mt-4 flex justify-center items-center space-x-4">
        <Button
          variant="outlined"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </Button>
        <Typography variant="subtitle1">
          Page {currentPage} of {totalPages}
        </Typography>
        <Button
          variant="outlined"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </Button>
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
